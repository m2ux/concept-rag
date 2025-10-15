import * as lancedb from "@lancedb/lancedb";
import { Document } from "@langchain/core/documents";
import { ConceptRecord, ConceptMetadata } from "./types.js";
import { createSimpleEmbedding } from "../lancedb/hybrid_search_client.js";

export class ConceptIndexBuilder {
    
    // Build concept index from documents with metadata
    // Now also accepts chunks to calculate chunk_count
    async buildConceptIndex(
        documents: Document[],
        chunks?: Document[]
    ): Promise<ConceptRecord[]> {
        const conceptMap = new Map<string, ConceptRecord>();
        
        console.log('📊 Building concept index from document metadata...');
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) {
                console.warn(`  ⚠️  No concepts found for: ${doc.metadata.source}`);
                continue;
            }
            
            const source = doc.metadata.source;
            
            // Process primary concepts (all concepts)
            for (const concept of metadata.primary_concepts || []) {
                this.addOrUpdateConcept(
                    conceptMap, 
                    concept,
                    'thematic',  // All concepts are thematic
                    source,
                    metadata.categories[0] || 'General',
                    metadata.related_concepts || [],
                    1.0  // Standard weight
                );
            }
        }
        
        console.log(`  ✅ Extracted ${conceptMap.size} unique concepts`);
        
        // Build co-occurrence relationships
        this.enrichWithCoOccurrence(conceptMap, documents);
        
        // ENHANCED: Calculate chunk_count if chunks are provided
        if (chunks && chunks.length > 0) {
            this.calculateChunkCounts(conceptMap, chunks);
        }
        
        return Array.from(conceptMap.values());
    }
    
    private addOrUpdateConcept(
        map: Map<string, ConceptRecord>,
        concept: string,
        conceptType: 'thematic' | 'terminology',
        source: string,
        category: string,
        relatedConcepts: string[],
        weight: number = 1.0
    ) {
        const key = concept.toLowerCase().trim();
        
        if (!key) return;  // Skip empty concepts
        
        if (!map.has(key)) {
            map.set(key, {
                concept: key,
                concept_type: conceptType,  // Store type for differentiated search
                category,
                sources: [],
                related_concepts: [...relatedConcepts.map(c => c.toLowerCase().trim())],
                embeddings: createSimpleEmbedding(concept),
                weight: 0,
                chunk_count: 0,  // ENHANCED: Initialize chunk count
                enrichment_source: 'corpus'
            });
        }
        
        const record = map.get(key)!;
        
        // Add source if not already present
        if (!record.sources.includes(source)) {
            record.sources.push(source);
            record.weight += weight;
        }
        
        // Merge related concepts (avoid duplicates)
        for (const related of relatedConcepts) {
            const relatedKey = related.toLowerCase().trim();
            if (relatedKey && !record.related_concepts.includes(relatedKey)) {
                record.related_concepts.push(relatedKey);
            }
        }
    }
    
    // Find concepts that co-occur frequently
    private enrichWithCoOccurrence(
        conceptMap: Map<string, ConceptRecord>,
        documents: Document[]
    ) {
        console.log('  🔗 Analyzing concept co-occurrence...');
        
        // Build co-occurrence matrix
        const coOccurrence = new Map<string, Map<string, number>>();
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) continue;
            
            // Collect all terms from this document
            const allTerms = (metadata.primary_concepts || [])
                .map(t => t.toLowerCase().trim())
                .filter(t => t);
            
            // Count co-occurrences (undirected graph)
            for (let i = 0; i < allTerms.length; i++) {
                for (let j = i + 1; j < allTerms.length; j++) {
                    const term1 = allTerms[i];
                    const term2 = allTerms[j];
                    
                    if (term1 === term2) continue;  // Skip self-references
                    
                    // Add to term1 -> term2
                    if (!coOccurrence.has(term1)) {
                        coOccurrence.set(term1, new Map());
                    }
                    const coMap1 = coOccurrence.get(term1)!;
                    coMap1.set(term2, (coMap1.get(term2) || 0) + 1);
                    
                    // Add to term2 -> term1 (symmetric)
                    if (!coOccurrence.has(term2)) {
                        coOccurrence.set(term2, new Map());
                    }
                    const coMap2 = coOccurrence.get(term2)!;
                    coMap2.set(term1, (coMap2.get(term1) || 0) + 1);
                }
            }
        }
        
        // Add top co-occurring terms to related_concepts
        let enrichedCount = 0;
        for (const [concept, coMap] of coOccurrence.entries()) {
            const record = conceptMap.get(concept);
            if (!record) continue;
            
            // Get top 5 co-occurring terms (by frequency)
            const topRelated = Array.from(coMap.entries())
                .sort((a, b) => b[1] - a[1])  // Sort by frequency
                .slice(0, 5)                  // Top 5
                .map(([term, _]) => term);
            
            // Add to related concepts (avoiding duplicates)
            let added = 0;
            for (const related of topRelated) {
                if (!record.related_concepts.includes(related)) {
                    record.related_concepts.push(related);
                    added++;
                }
            }
            
            if (added > 0) enrichedCount++;
        }
        
        console.log(`  ✅ Enriched ${enrichedCount} concepts with co-occurrence data`);
    }
    
    // ENHANCED: Calculate how many chunks reference each concept
    private calculateChunkCounts(
        conceptMap: Map<string, ConceptRecord>,
        chunks: Document[]
    ) {
        console.log('  📊 Calculating chunk counts for concepts...');
        
        const chunkCounts = new Map<string, number>();
        
        // Count chunks for each concept
        for (const chunk of chunks) {
            const chunkConcepts = chunk.metadata.concepts as string[] || [];
            
            for (const concept of chunkConcepts) {
                const key = concept.toLowerCase().trim();
                if (key) {
                    chunkCounts.set(key, (chunkCounts.get(key) || 0) + 1);
                }
            }
        }
        
        // Update concept records with chunk counts
        let updatedCount = 0;
        for (const [concept, count] of chunkCounts.entries()) {
            const record = conceptMap.get(concept);
            if (record) {
                record.chunk_count = count;
                updatedCount++;
            }
        }
        
        console.log(`  ✅ Updated ${updatedCount} concepts with chunk counts`);
    }
    
    // Create LanceDB table for concepts
    async createConceptTable(
        db: lancedb.Connection,
        concepts: ConceptRecord[],
        tableName: string = 'concepts'
    ): Promise<lancedb.Table> {
        
        const data = concepts.map((concept, idx) => ({
            id: idx.toString(),
            concept: concept.concept,
            concept_type: concept.concept_type,  // Include type for filtering
            category: concept.category,
            sources: JSON.stringify(concept.sources),
            related_concepts: JSON.stringify(concept.related_concepts),
            synonyms: JSON.stringify(concept.synonyms || []),
            broader_terms: JSON.stringify(concept.broader_terms || []),
            narrower_terms: JSON.stringify(concept.narrower_terms || []),
            weight: concept.weight,
            chunk_count: concept.chunk_count,  // ENHANCED: Include chunk count
            enrichment_source: concept.enrichment_source,
            vector: concept.embeddings
        }));
        
        console.log(`📊 Creating concept table '${tableName}' with ${data.length} concepts...`);
        
        try {
            const table = await db.createTable(tableName, data, { 
                mode: 'overwrite' 
            });
            
            // Skip index creation for small datasets (< 5000 vectors)
            // Index overhead isn't worth it, and LanceDB will use linear scan (fast for small tables)
            if (data.length >= 5000) {
                console.log(`  ✅ Table created, building vector index...`);
                try {
                    await table.createIndex('vector');
                    console.log(`  ✅ Vector index created`);
                } catch (indexError: any) {
                    console.warn(`  ⚠️  Could not create index: ${indexError.message}`);
                }
            } else {
                console.log(`  ✅ Table created (${data.length} vectors - using linear scan, no index needed)`);
            }
            
            return table;
        } catch (error) {
            console.error('Error creating concept table:', error);
            throw error;
        }
    }
}

