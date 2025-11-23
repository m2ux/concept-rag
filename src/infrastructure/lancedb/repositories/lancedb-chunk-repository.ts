import * as lancedb from "@lancedb/lancedb";
import { ChunkRepository } from '../../../domain/interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { Chunk, SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { ConceptNotFoundError, InvalidEmbeddingsError, DatabaseOperationError } from '../../../domain/exceptions.js';
import { DatabaseError } from '../../../domain/exceptions/index.js';
import { parseJsonField } from '../utils/field-parsers.js';
import { validateChunkRow, detectVectorField } from '../utils/schema-validators.js';
import { SearchableCollectionAdapter } from '../searchable-collection-adapter.js';
import { ConceptIdCache } from '../../cache/concept-id-cache.js';
import { ILogger } from '../../observability/index.js';

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
    private conceptIdCache: ConceptIdCache,
    private logger: ILogger
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
    
    this.logger.debug('Finding chunks by concept', { concept: conceptLower, limit });
    
    try {
      // Verify concept exists
      const conceptRecord = await this.conceptRepo.findByName(conceptLower);
      
      if (!conceptRecord) {
        this.logger.warn('Concept not found', { concept: conceptLower });
        console.error(`⚠️  Concept "${concept}" not found in concept table`);
        return [];
      }
      
      // Load chunks and filter by concepts field
      const batchSize = 100000;
      const allRows = await this.chunksTable
        .query()
        .limit(batchSize)
        .toArray();
      
      this.logger.debug('Loaded chunk rows for filtering', { rowCount: allRows.length });
      
      const matches: Chunk[] = [];
      
      for (const row of allRows) {
        // Validate chunk schema
        try {
          validateChunkRow(row);
        } catch (validationError) {
          this.logger.warn('Chunk validation failed', undefined, { 
            error: validationError instanceof Error ? validationError.message : String(validationError)
          });
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
      
      this.logger.info('Found chunks by concept', { 
        concept: conceptLower, 
        matchCount: matches.length,
        limit 
      });
      
      return matches.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to find chunks by concept', error as Error, {
        concept: conceptLower,
        limit
      });
      
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
    this.logger.debug('Finding chunks by source', { source, limit });
    
    try {
      // LanceDB doesn't support SQL WHERE on non-indexed columns efficiently
      // Best approach: vector search + filter, or use source as query
      const sourceEmbedding = this.embeddingService.generateEmbedding(source);
      
      const results = await this.chunksTable
        .vectorSearch(sourceEmbedding)
        .limit(limit * 2)  // Get extra for filtering
        .toArray();
      
      const filteredResults = results
        .filter((row: any) => row.source && row.source.toLowerCase().includes(source.toLowerCase()))
        .slice(0, limit)
        .map((row: any) => this.mapRowToChunk(row));
      
      this.logger.info('Found chunks by source', { 
        source, 
        totalResults: results.length,
        filteredResults: filteredResults.length,
        limit 
      });
      
      return filteredResults;
    } catch (error) {
      this.logger.error('Failed to find chunks by source', error as Error, { source, limit });
      throw new DatabaseError(
        `Failed to find chunks for source "${source}"`,
        'query',
        error as Error
      );
    }
  }
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const limit = query.limit || 10;
    const debug = query.debug || false;
    
    this.logger.debug('Searching chunks', { query: query.text, limit, debug });
    
    try {
      // Wrap table in adapter to prevent infrastructure leakage
      const collection = new SearchableCollectionAdapter(this.chunksTable, 'chunks');
      
      const results = await this.hybridSearchService.search(
        collection,
        query.text,
        limit,
        debug
      );
      
      this.logger.info('Chunk search completed', { 
        query: query.text,
        resultCount: results.length,
        limit 
      });
      
      return results;
    } catch (error) {
      this.logger.error('Chunk search failed', error as Error, { 
        query: query.text,
        limit,
        debug 
      });
      throw new DatabaseError(
        `Failed to search chunks for query "${query.text}"`,
        'query',
        error as Error
      );
    }
  }
  
  async countChunks(): Promise<number> {
    this.logger.debug('Counting chunks');
    
    try {
      const count = await this.chunksTable.countRows();
      this.logger.info('Chunk count retrieved', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to count chunks', error as Error);
      throw new DatabaseError(
        'Failed to count chunks',
        'query',
        error as Error
      );
    }
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
    
    // Resolve concepts: prefer new format (concept_ids) over old format (concepts)
    let concepts: string[] = [];
    if (row.concept_ids) {
      // NEW FORMAT: Use concept IDs and resolve to names via cache
      try {
        const conceptIds = parseJsonField(row.concept_ids);
        concepts = this.conceptIdCache.getNames(conceptIds);
      } catch (error) {
        console.warn('[ChunkRepository] Failed to parse concept_ids, falling back to concepts:', error);
        // Fallback to old format
        concepts = parseJsonField(row.concepts);
      }
    } else {
      // OLD FORMAT: Use concept names directly
      concepts = parseJsonField(row.concepts);
    }
    
    return {
      id: row.id || '',
      text: row.text || '',
      source: row.source || '',
      hash: row.hash || '',
      concepts,
      conceptCategories: parseJsonField(row.concept_categories),
      conceptDensity: row.concept_density || 0,
      embeddings  // May be undefined if no vector field found
    };
  }
}

