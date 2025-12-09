import * as lancedb from "@lancedb/lancedb";
import { Document } from "@langchain/core/documents";
import { ConceptRecord, ConceptMetadata, ExtractedConcept } from "./types.js";
import { SimpleEmbeddingService } from "../infrastructure/embeddings/simple-embedding-service.js";
import { hashToId } from "../infrastructure/utils/hash.js";

// Use singleton embedding service for concept index building
const embeddingService = new SimpleEmbeddingService();

/**
 * Builds the concept index from document metadata.
 */
export class ConceptIndexBuilder {
    
    // Build source path to catalog ID mapping
    private sourceToIdMap = new Map<string, number>();
    
    // Build catalog ID to source path mapping (for catalog_titles)
    private catalogIdToSourceMap = new Map<number, string>();
    
    /**
     * Build concept index from documents with metadata.
     * @param documents - Documents with concept metadata
     * @param sourceToCatalogId - Map of source paths to actual catalog IDs from the catalog table
     *                            (REQUIRED: foreign keys must reference actual IDs, not computed hashes)
     */
    async buildConceptIndex(
        documents: Document[],
        sourceToCatalogId: Map<string, number>
    ): Promise<ConceptRecord[]> {
        const conceptMap = new Map<string, ConceptRecord>();
        
        console.log('📊 Building concept index from document metadata...');
        
        // Use the provided source-to-catalogId map (actual IDs from catalog table)
        this.sourceToIdMap = sourceToCatalogId;
        
        // Build reverse mapping: catalogId → source (for catalog_titles)
        this.catalogIdToSourceMap.clear();
        for (const [source, catalogId] of sourceToCatalogId) {
            this.catalogIdToSourceMap.set(catalogId, source);
        }
        
        if (this.sourceToIdMap.size === 0) {
            console.warn('  ⚠️  No source-to-catalog-ID mapping provided! Catalog IDs will be 0.');
        }
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) {
                console.warn(`  ⚠️  No concepts found for: ${doc.metadata.source}`);
                continue;
            }
            
            const source = doc.metadata.source;
            // Look up actual catalog ID - DO NOT compute from hash!
            const catalogId = this.sourceToIdMap.get(source);
            if (catalogId === undefined) {
                console.warn(`  ⚠️  No catalog ID found for source: ${source}`);
                continue;
            }
            
            // Process primary concepts
            for (const concept of metadata.primary_concepts || []) {
                this.addOrUpdateConcept(
                    conceptMap, 
                    concept,
                    catalogId,
                    1.0  // Standard weight
                );
            }
        }
        
        console.log(`  ✅ Extracted ${conceptMap.size} unique concepts`);
        
        // Build co-occurrence relationships (populates related_concepts)
        this.enrichWithCoOccurrence(conceptMap, documents);
        
        // Convert related_concepts strings to adjacent_ids
        this.resolveAdjacentIds(conceptMap);
        
        // Populate catalog_titles (DERIVED field) from catalog_ids
        this.populateCatalogTitles(conceptMap);
        
        return Array.from(conceptMap.values());
    }
    
    /**
     * Populate catalog_titles for each concept from catalog_ids.
     * DERIVED field: resolved from catalog_ids → catalog.source paths.
     */
    private populateCatalogTitles(conceptMap: Map<string, ConceptRecord>): void {
        for (const [_key, record] of conceptMap) {
            if (record.catalog_ids && record.catalog_ids.length > 0) {
                record.catalog_titles = record.catalog_ids
                    .map(catalogId => this.catalogIdToSourceMap.get(catalogId))
                    .filter((source): source is string => source !== undefined);
            }
        }
    }
    
    /**
     * Add or update a concept in the map.
     * Handles both string concepts (legacy) and ExtractedConcept objects (new with summaries).
     */
    private addOrUpdateConcept(
        map: Map<string, ConceptRecord>,
        concept: string | ExtractedConcept,
        catalogId: number,
        weight: number = 1.0
    ) {
        // Extract name and summary from input
        let conceptName: string;
        let conceptSummary: string = '';
        
        if (typeof concept === 'string') {
            conceptName = concept;
        } else {
            conceptName = concept.name;
            conceptSummary = concept.summary || '';
        }
        
        const key = conceptName.toLowerCase().trim();
        
        if (!key) return;  // Skip empty concepts
        
        if (!map.has(key)) {
            map.set(key, {
                name: key,
                summary: conceptSummary,  // Store summary from extraction
                catalog_ids: [],
                related_concepts: [],
                adjacent_ids: [],
                related_ids: [],
                embeddings: embeddingService.generateEmbedding(conceptName),
                weight: 0
            });
        }
        
        const record = map.get(key)!;
        
        // Add catalog_id if not already present
        if (!record.catalog_ids.includes(catalogId)) {
            record.catalog_ids.push(catalogId);
            record.weight += weight;
        }
        
        // Update summary if we have one and the record doesn't
        if (conceptSummary && !record.summary) {
            record.summary = conceptSummary;
        }
    }
    
    /**
     * Convert related_concepts strings to adjacent_ids.
     * Call after co-occurrence enrichment.
     */
    private resolveAdjacentIds(conceptMap: Map<string, ConceptRecord>) {
        // Build concept name to ID mapping
        const conceptToId = new Map<string, number>();
        for (const [key, _record] of conceptMap) {
            conceptToId.set(key, hashToId(key));
        }
        
        // Resolve related_concepts to IDs
        for (const [_key, record] of conceptMap) {
            if (record.related_concepts && record.related_concepts.length > 0) {
                record.adjacent_ids = record.related_concepts
                    .map(name => conceptToId.get(name.toLowerCase().trim()))
                    .filter((id): id is number => id !== undefined);
            }
        }
    }
    
    /**
     * Find concepts that co-occur frequently across documents.
     * Populates related_concepts field with co-occurring terms.
     */
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
            // Handle both string and ExtractedConcept formats
            const allTerms = (metadata.primary_concepts || [])
                .map(t => {
                    const name = typeof t === 'string' ? t : (t.name || '');
                    return name.toLowerCase().trim();
                })
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
            
            // Initialize related_concepts if needed
            if (!record.related_concepts) {
                record.related_concepts = [];
            }
            
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
    
    /**
     * Create LanceDB table for concepts.
     */
    async createConceptTable(
        db: lancedb.Connection,
        concepts: ConceptRecord[],
        tableName: string = 'concepts',
        _sourceToIdMap?: Map<string, string>  // Deprecated: no longer used with hash-based IDs
    ): Promise<lancedb.Table> {
        
        const data = concepts.map((concept) => {
            // Generate hash-based integer ID from concept name (stable across rebuilds)
            const conceptId = hashToId(concept.name);
            
            // Ensure array fields have at least one element for LanceDB type inference
            // Empty arrays cause "Cannot infer list vector from empty array" errors
            const ensureNonEmpty = <T>(arr: T[] | undefined, placeholder: T): T[] => {
                if (!arr || arr.length === 0) return [placeholder];
                return arr;
            };
            
            return {
                id: conceptId,  // Hash-based integer ID (stable)
                name: concept.name,  // Renamed from 'concept' to 'name'
                summary: concept.summary || '',  // LLM-generated summary
                catalog_ids: ensureNonEmpty(concept.catalog_ids, 0),  // Native array of hash-based IDs
                catalog_titles: ensureNonEmpty(concept.catalog_titles, ''),  // DERIVED: document titles for display
                chunk_ids: ensureNonEmpty(concept.chunk_ids, 0),  // Chunk IDs for fast lookups  // Native array of hash-based IDs
                adjacent_ids: ensureNonEmpty(concept.adjacent_ids, 0),  // Co-occurrence links
                related_ids: ensureNonEmpty(concept.related_ids, 0),  // Lexical links
                synonyms: ensureNonEmpty(concept.synonyms, ''),  // Native array
                broader_terms: ensureNonEmpty(concept.broader_terms, ''),  // Native array
                narrower_terms: ensureNonEmpty(concept.narrower_terms, ''),  // Native array
                weight: concept.weight,
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

