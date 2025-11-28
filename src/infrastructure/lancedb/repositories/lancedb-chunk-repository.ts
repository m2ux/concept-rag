import * as lancedb from "@lancedb/lancedb";
import { ChunkRepository } from '../../../domain/interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { Chunk, SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { ConceptNotFoundError, InvalidEmbeddingsError } from '../../../domain/exceptions.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';
import { parseJsonField } from '../utils/field-parsers.js';
import { validateChunkRow, detectVectorField } from '../utils/schema-validators.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';
import { ConceptIdCache } from '../../cache/concept-id-cache.js';
import { isNone } from '../../../domain/functional/index.js';

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
    private hybridSearchService: HybridSearchService,
    private conceptIdCache: ConceptIdCache
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
      const conceptRecordOpt = await this.conceptRepo.findByName(conceptLower);
      
      if (isNone(conceptRecordOpt)) {
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
      
      // Sort by concept count (most concept-rich first)
      matches.sort((a, b) => (b.concepts?.length || 0) - (a.concepts?.length || 0));
      
      return matches.slice(0, limit);
    } catch (error) {
      // Wrap in domain exception if not already
      if (error instanceof InvalidEmbeddingsError || error instanceof ConceptNotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to find chunks for concept "${concept}"`,
        'query',
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
  
  async findByCatalogId(catalogId: number, limit: number): Promise<Chunk[]> {
    // Direct integer lookup - more efficient than string matching
    try {
      const results = await this.chunksTable
        .query()
        .where(`catalog_id = ${catalogId}`)
        .limit(limit)
        .toArray();
      
      return results.map((row: any) => this.mapRowToChunk(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find chunks for catalog ID ${catalogId}`,
        'query',
        error as Error
      );
    }
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
  
  /**
   * Map a database row to a Chunk domain model.
   */
  private mapRowToChunk(row: any): Chunk {
    // Detect which field contains the vector (handles 'vector' vs 'embeddings' naming)
    const vectorField = detectVectorField(row);
    const embeddings = vectorField ? row[vectorField] : undefined;
    
    // Parse concept_ids (native array in normalized schema, JSON string in legacy, or Arrow Vector)
    let conceptIds: number[] = [];
    if (row.concept_ids) {
      if (Array.isArray(row.concept_ids)) {
        conceptIds = row.concept_ids;
      } else if (typeof row.concept_ids === 'object' && row.concept_ids !== null && 'toArray' in row.concept_ids) {
        // Arrow Vector - convert to JavaScript array
        conceptIds = Array.from(row.concept_ids.toArray());
      } else if (typeof row.concept_ids === 'string') {
        // JSON string
        conceptIds = parseJsonField<number>(row.concept_ids);
      }
    }
    
    // Resolve concepts via cache (convert numeric IDs to strings for cache lookup)
    const concepts = this.conceptIdCache.getNames(conceptIds.map(id => String(id)));
    
    // Parse category_ids (native array in normalized schema, JSON string in legacy, or Arrow Vector)
    let categoryIds: number[] = [];
    if (row.category_ids) {
      if (Array.isArray(row.category_ids)) {
        categoryIds = row.category_ids;
      } else if (typeof row.category_ids === 'object' && row.category_ids !== null && 'toArray' in row.category_ids) {
        // Arrow Vector - convert to JavaScript array
        categoryIds = Array.from(row.category_ids.toArray());
      } else if (typeof row.category_ids === 'string') {
        // JSON string
        categoryIds = parseJsonField<number>(row.category_ids);
      }
    }
    
    // Parse page_number from loc field or direct field
    let pageNumber: number | undefined;
    if (row.page_number !== undefined && row.page_number !== null) {
      pageNumber = typeof row.page_number === 'number' ? row.page_number : parseInt(row.page_number);
    } else if (row.loc) {
      // Fall back to loc.pageNumber if page_number field doesn't exist
      try {
        const loc = typeof row.loc === 'string' ? JSON.parse(row.loc) : row.loc;
        pageNumber = loc?.pageNumber;
      } catch {
        // Ignore parse errors
      }
    }
    
    // Parse concept_density (may be stored or computed)
    let conceptDensity: number | undefined;
    if (row.concept_density !== undefined && row.concept_density !== null) {
      conceptDensity = typeof row.concept_density === 'number' ? row.concept_density : parseFloat(row.concept_density);
    }
    
    return {
      id: typeof row.id === 'number' ? row.id : parseInt(row.id) || 0,
      text: row.text || '',
      source: row.source || '',
      catalogId: row.catalog_id,
      hash: row.hash || '',
      concepts,  // Resolved from conceptIds for API compatibility
      conceptIds,
      categoryIds,
      embeddings,  // May be undefined if no vector field found
      pageNumber,
      conceptDensity
    };
  }
}

