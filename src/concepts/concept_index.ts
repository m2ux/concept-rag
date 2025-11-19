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
        tableName: string = 'concepts',
        sourceToIdMap?: Map<string, string>  // Optional: source path → catalog ID mapping
    ): Promise<lancedb.Table> {
        
        const data = concepts.map((concept, idx) => {
            // Build catalog_ids from sources if mapping is provided
            let catalogIds: string[] = [];
            if (sourceToIdMap) {
                catalogIds = concept.sources
                    .map(source => sourceToIdMap.get(source))
                    .filter((id): id is string => id !== undefined);
            }
            
            return {
                id: idx.toString(),
                concept: concept.concept,
                concept_type: concept.concept_type,  // Include type for filtering
                category: concept.category,
                sources: JSON.stringify(concept.sources),  // OLD: backward compatibility
                catalog_ids: sourceToIdMap ? JSON.stringify(catalogIds) : undefined,  // NEW: catalog IDs
                related_concepts: JSON.stringify(concept.related_concepts),
                synonyms: JSON.stringify(concept.synonyms || []),
                broader_terms: JSON.stringify(concept.broader_terms || []),
                narrower_terms: JSON.stringify(concept.narrower_terms || []),
                weight: concept.weight,
                chunk_count: concept.chunk_count,  // ENHANCED: Include chunk count
                enrichment_source: concept.enrichment_source,
                vector: concept.embeddings
            };
        });
        
        console.log(`📊 Creating concept table '${tableName}' with ${data.length} concepts...`);
        
        try {
            const table = await db.createTable(tableName, data, { 
                mode: 'overwrite' 
            });
            
            // Calculate appropriate number of partitions based on dataset size
            // Rule of thumb: ~100-200 vectors per partition for good cluster quality
            const calculatePartitions = (dataSize: number): number => {
                if (dataSize < 100) return 2;
                if (dataSize < 500) return Math.max(2, Math.floor(dataSize / 100));
                if (dataSize < 1000) return Math.max(4, Math.floor(dataSize / 150));
                if (dataSize < 5000) return Math.max(8, Math.floor(dataSize / 300));
                if (dataSize < 10000) return Math.max(32, Math.floor(dataSize / 300));
                if (dataSize < 50000) return Math.max(64, Math.floor(dataSize / 400));
                return 256; // Default for very large datasets (50k+ vectors)
            };
            
            const numPartitions = calculatePartitions(data.length);
            
            // Create optimized index for large datasets only
            // IVF_PQ requires substantial data for PQ training (256+ samples per subvector)
            // For smaller/medium datasets, skip indexing - linear scan is fast and avoids warnings
            if (data.length >= 100000) {
                console.log(`  🔧 Building optimized index (${data.length} vectors, ${numPartitions} partitions)...`);
                try {
                    await table.createIndex("vector", {
                        config: lancedb.Index.ivfPq({
                            numPartitions: numPartitions,
                            numSubVectors: 16, // For 384-dim vectors
                        })
                    });
                    console.log(`  ✅ Vector index created (IVF_PQ) successfully`);
                } catch (indexError: any) {
                    console.warn(`  ⚠️  Index creation failed: ${indexError.message}`);
                    console.warn(`     Table is still functional with brute-force search`);
                }
            } else {
                console.log(`  ✅ Table created (${data.length} vectors - using linear scan, fast and no warnings)`);
            }
            
            return table;
        } catch (error) {
            console.error('Error creating concept table:', error);
            throw error;
        }
    }
}

