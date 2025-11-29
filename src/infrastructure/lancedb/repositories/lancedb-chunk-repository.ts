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
import { isNone } from '../../../domain/functional/index.js';

/**
 * LanceDB implementation of ChunkRepository
 * 
 * Uses vector search for efficient querying - does NOT load all data.
 * Performance: O(log n) vector search vs O(n) full scan.
 * 
 * Search operations use HybridSearchService for multi-signal ranking.
 * 
 * Note: Uses derived text fields (concept_names, catalog_title) for display
 * and filtering. No ID-to-name caches needed at runtime.
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
   * 2. Filter to chunks that contain the concept in their concept_names field
   * 3. Return up to limit results
   * 
   * Note: Uses derived concept_names field for matching - no cache lookup needed.
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
      
      // Load chunks and filter by concept_names field
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
        
        // Check if concept is in chunk's concept_names list
        if (this.chunkContainsConcept(chunk, conceptLower)) {
          matches.push(chunk);
          if (matches.length >= limit) break;
        }
      }
      
      // Sort by concept count (most concept-rich first)
      matches.sort((a, b) => (b.conceptIds?.length || 0) - (a.conceptIds?.length || 0));
      
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
  
  async findByTitle(title: string, limit: number): Promise<Chunk[]> {
    // Search chunks by catalog_title using vector similarity
    const titleEmbedding = this.embeddingService.generateEmbedding(title);
    
    const results = await this.chunksTable
      .vectorSearch(titleEmbedding)
      .limit(limit * 2)  // Get extra for filtering
      .toArray();
    
    return results
      .filter((row: any) => row.catalog_title && row.catalog_title.toLowerCase().includes(title.toLowerCase()))
      .slice(0, limit)
      .map((row: any) => this.mapRowToChunk(row));
  }
  
  async findByCatalogId(catalogId: number, limit: number): Promise<Chunk[]> {
    // Direct integer lookup - most efficient
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
  
  /**
   * Find chunks by source path using catalog_title field.
   * 
   * @deprecated Use findByCatalogId instead for better performance.
   * This method exists for backward compatibility only.
   */
  async findBySource(sourcePath: string, limit: number): Promise<Chunk[]> {
    console.warn('findBySource is deprecated - use findByCatalogId for better performance');
    
    try {
      // Search by catalog_title field which stores the document title
      const sourceMatch = sourcePath.toLowerCase();
      const results = await this.chunksTable
        .query()
        .limit(100000)  // Get all to filter
        .toArray();
      
      // Filter by catalog_title containing the source path
      const filtered = results
        .filter((row: any) => {
          const title = (row.catalog_title || '').toLowerCase();
          return title.includes(sourceMatch) || sourceMatch.includes(title);
        })
        .slice(0, limit);
      
      return filtered.map((row: any) => this.mapRowToChunk(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find chunks for source "${sourcePath}"`,
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
  
  /**
   * Check if chunk contains a concept using derived concept_names field.
   * No cache lookup needed - uses text field directly.
   */
  private chunkContainsConcept(chunk: Chunk, concept: string): boolean {
    // Use derived concept_names field directly (new schema)
    if (chunk.conceptNames && chunk.conceptNames.length > 0 && chunk.conceptNames[0] !== '') {
      return chunk.conceptNames.some((c: string) => {
        const cLower = c.toLowerCase();
        return cLower === concept || 
               cLower.includes(concept) || 
               concept.includes(cLower);
      });
    }
    
    // No concept_names available
    return false;
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
    
    // Parse page_number directly
    let pageNumber: number | undefined;
    if (row.page_number !== undefined && row.page_number !== null) {
      pageNumber = typeof row.page_number === 'number' ? row.page_number : parseInt(row.page_number);
    }
    
    // Parse concept_density (may be stored or computed)
    let conceptDensity: number | undefined;
    if (row.concept_density !== undefined && row.concept_density !== null) {
      conceptDensity = typeof row.concept_density === 'number' ? row.concept_density : parseFloat(row.concept_density);
    }
    
    // Parse concept_names (DERIVED field for display and text search)
    let conceptNames: string[] | undefined;
    if (row.concept_names) {
      if (Array.isArray(row.concept_names)) {
        conceptNames = row.concept_names;
      } else if (typeof row.concept_names === 'object' && row.concept_names !== null && 'toArray' in row.concept_names) {
        // Arrow Vector - convert to JavaScript array
        conceptNames = Array.from(row.concept_names.toArray());
      } else if (typeof row.concept_names === 'string') {
        // JSON string
        conceptNames = parseJsonField<string>(row.concept_names);
      }
    }
    
    return {
      id: typeof row.id === 'number' ? row.id : parseInt(row.id) || 0,
      text: row.text || '',
      catalogId: row.catalog_id || 0,
      catalogTitle: row.catalog_title || '',  // DERIVED: document title for display
      hash: row.hash || '',
      conceptIds,
      conceptNames,  // DERIVED: for display and text search
      embeddings,  // May be undefined if no vector field found
      pageNumber,
      conceptDensity
    };
  }
}
