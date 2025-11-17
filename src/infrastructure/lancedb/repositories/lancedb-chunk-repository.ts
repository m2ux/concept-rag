import * as lancedb from "@lancedb/lancedb";
import { ChunkRepository } from '../../../domain/interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { Chunk, SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { ConceptNotFoundError, InvalidEmbeddingsError, DatabaseOperationError } from '../../../domain/exceptions.js';
import { parseJsonField } from '../utils/field-parsers.js';
import { validateChunkRow, detectVectorField } from '../utils/schema-validators.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';

/**
 * LanceDB implementation of ChunkRepository
 * 
 * Uses vector search for efficient querying - does NOT load all data.
 * Performance: O(log n) vector search vs O(n) full scan.
 * 
 * Search operations use HybridSearchService for multi-signal ranking.
 */
export class LanceDBChunkRepository implements ChunkRepository {
  constructor(
    private chunksTable: lancedb.Table,
    private conceptRepo: ConceptRepository,
    private embeddingService: EmbeddingService,
    private hybridSearchService: HybridSearchService
  ) {}
  
  /**
   * Find chunks by concept name using direct field filtering
   * 
   * Strategy:
   * 1. Load chunks in batches (to handle large databases)
   * 2. Filter to chunks that contain the concept in their concepts field
   * 3. Return up to limit results
   * 
   * Note: Previous implementation used vector search, but this failed because
   * concept embeddings (short phrases) are not semantically similar to chunk
   * embeddings (full paragraphs). Direct field filtering is more reliable.
   * 
   * See: .ai/planning/2025-11-17-empty-chunk-investigation/INVESTIGATION_REPORT.md
   */
  async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
    const conceptLower = concept.toLowerCase().trim();
    
    try {
      // Verify concept exists
      const conceptRecord = await this.conceptRepo.findByName(conceptLower);
      
      if (!conceptRecord) {
        console.error(`⚠️  Concept "${concept}" not found in concept table`);
        return [];
      }
      
      // Load chunks and filter by concepts field
      // Note: LanceDB loads efficiently, and we can optimize with batching if needed
      const batchSize = 100000;
      const allRows = await this.chunksTable
        .query()
        .limit(batchSize)
        .toArray();
      
      const matches: Chunk[] = [];
      
      for (const row of allRows) {
        // Validate chunk schema
        try {
          validateChunkRow(row);
        } catch (validationError) {
          console.error(`⚠️  Schema validation failed for chunk:`, validationError);
          continue;
        }
        
        const chunk = this.mapRowToChunk(row);
        
        // Check if concept is in chunk's concept list
        if (this.chunkContainsConcept(chunk, conceptLower)) {
          matches.push(chunk);
          if (matches.length >= limit) break;
        }
      }
      
      // Sort by concept density (most concept-rich first)
      matches.sort((a, b) => (b.conceptDensity || 0) - (a.conceptDensity || 0));
      
      return matches.slice(0, limit);
    } catch (error) {
      // Wrap in domain exception if not already
      if (error instanceof InvalidEmbeddingsError || error instanceof ConceptNotFoundError) {
        throw error;
      }
      throw new DatabaseOperationError(
        `Failed to find chunks for concept "${concept}"`,
        error as Error
      );
    }
  }
  
  async findBySource(source: string, limit: number): Promise<Chunk[]> {
    // LanceDB doesn't support SQL WHERE on non-indexed columns efficiently
    // Best approach: vector search + filter, or use source as query
    const sourceEmbedding = this.embeddingService.generateEmbedding(source);
    
    const results = await this.chunksTable
      .vectorSearch(sourceEmbedding)
      .limit(limit * 2)  // Get extra for filtering
      .toArray();
    
    return results
      .filter((row: any) => row.source && row.source.toLowerCase().includes(source.toLowerCase()))
      .slice(0, limit)
      .map((row: any) => this.mapRowToChunk(row));
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Use hybrid search for multi-signal ranking
    const limit = query.limit || 10;
    const debug = query.debug || false;
    
    // Wrap table in adapter to prevent infrastructure leakage
    const collection = new SearchableCollectionAdapter(this.chunksTable, 'chunks');
    
    return await this.hybridSearchService.search(
      collection,
      query.text,
      limit,
      debug
    );
  }
  
  async countChunks(): Promise<number> {
    return await this.chunksTable.countRows();
  }
  
  // Helper methods
  
  private chunkContainsConcept(chunk: Chunk, concept: string): boolean {
    if (!chunk.concepts || chunk.concepts.length === 0) {
      return false;
    }
    
    return chunk.concepts.some((c: string) => {
      const cLower = c.toLowerCase();
      return cLower === concept || 
             cLower.includes(concept) || 
             concept.includes(cLower);
    });
  }
  
  private mapRowToChunk(row: any): Chunk {
    // Detect which field contains the vector (handles 'vector' vs 'embeddings' naming)
    const vectorField = detectVectorField(row);
    const embeddings = vectorField ? row[vectorField] : undefined;
    
    return {
      id: row.id || '',
      text: row.text || '',
      source: row.source || '',
      hash: row.hash || '',
      concepts: parseJsonField(row.concepts),
      conceptCategories: parseJsonField(row.concept_categories),
      conceptDensity: row.concept_density || 0,
      embeddings  // May be undefined if no vector field found
    };
  }
}

