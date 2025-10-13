import * as lancedb from "@lancedb/lancedb";
import { Document } from "@langchain/core/documents";
import { ConceptRecord, ConceptMetadata } from "./types.js";
import { createSimpleEmbedding } from "../lancedb/hybrid_search_client.js";

export class ConceptIndexBuilder {
    
    // Build concept index from documents with metadata
    async buildConceptIndex(documents: Document[]): Promise<ConceptRecord[]> {
        const conceptMap = new Map<string, ConceptRecord>();
        
        console.log('📊 Building concept index from document metadata...');
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) {
                console.warn(`  ⚠️  No concepts found for: ${doc.metadata.source}`);
                continue;
            }
            
            const source = doc.metadata.source;
            
            // Process primary concepts (higher weight)
            for (const concept of metadata.primary_concepts || []) {
                this.addOrUpdateConcept(
                    conceptMap, 
                    concept, 
                    source,
                    metadata.categories[0] || 'General',
                    metadata.related_concepts || [],
                    2.0  // Primary concepts get double weight
                );
            }
            
            // Process technical terms (standard weight)
            for (const term of metadata.technical_terms || []) {
                this.addOrUpdateConcept(
                    conceptMap,
                    term,
                    source,
                    metadata.categories[0] || 'Technical',
                    [],
                    1.0
                );
            }
        }
        
        console.log(`  ✅ Extracted ${conceptMap.size} unique concepts`);
        
        // Build co-occurrence relationships
        this.enrichWithCoOccurrence(conceptMap, documents);
        
        return Array.from(conceptMap.values());
    }
    
    private addOrUpdateConcept(
        map: Map<string, ConceptRecord>,
        concept: string,
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
                category,
                sources: [],
                related_concepts: [...relatedConcepts.map(c => c.toLowerCase().trim())],
                embeddings: createSimpleEmbedding(concept),
                weight: 0,
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
            const allTerms = [
                ...(metadata.primary_concepts || []),
                ...(metadata.technical_terms || [])
            ].map(t => t.toLowerCase().trim()).filter(t => t);
            
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
    
    // Create LanceDB table for concepts
    async createConceptTable(
        db: lancedb.Connection,
        concepts: ConceptRecord[],
        tableName: string = 'concepts'
    ): Promise<lancedb.Table> {
        
        const data = concepts.map((concept, idx) => ({
            id: idx.toString(),
            concept: concept.concept,
            category: concept.category,
            sources: JSON.stringify(concept.sources),
            related_concepts: JSON.stringify(concept.related_concepts),
            synonyms: JSON.stringify(concept.synonyms || []),
            broader_terms: JSON.stringify(concept.broader_terms || []),
            narrower_terms: JSON.stringify(concept.narrower_terms || []),
            weight: concept.weight,
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

