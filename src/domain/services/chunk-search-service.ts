/**
 * Domain service for chunk-level search operations.
 * 
 * This service encapsulates business logic for searching individual chunks,
 * including both broad searches across all documents and targeted searches
 * within specific sources.
 * 
 * **Responsibility**: Orchestrate chunk searches with appropriate filtering
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { Chunk, SearchResult } from '../models/index.js';
import { ILogger } from '../../infrastructure/observability/index.js';

/**
 * Parameters for broad chunk search (across all documents).
 */
export interface BroadChunkSearchParams {
  /** Search query text */
  text: string;
  
  /** Maximum results to return */
  limit: number;
  
  /** Enable debug output */
  debug?: boolean;
}

/**
 * Parameters for targeted chunk search (within one document).
 */
export interface TargetedChunkSearchParams {
  /** Search query text */
  text: string;
  
  /** Source document path (exact match) */
  source: string;
  
  /** Maximum results to return */
  limit: number;
  
  /** Enable debug output */
  debug?: boolean;
}

/**
 * Domain service for chunk search operations.
 */
export class ChunkSearchService {
  constructor(
    private chunkRepo: ChunkRepository,
    private logger: ILogger
  ) {}
  
  /**
   * Search across all chunks in all documents.
   * 
   * Uses hybrid search with multi-signal ranking.
   * 
   * @param params - Search parameters
   * @returns Search results ranked by hybrid score
   * @throws {DatabaseError} If database query fails
   * @throws {SearchError} If search operation fails
   */
  async searchBroad(params: BroadChunkSearchParams): Promise<SearchResult[]> {
    const childLogger = this.logger.child({
      operation: 'broad_chunk_search',
      query: params.text,
      limit: params.limit,
      debug: params.debug
    });
    
    childLogger.info('Starting broad chunk search');
    
    try {
      const results = await this.chunkRepo.search({
        text: params.text,
        limit: params.limit,
        debug: params.debug || false
      });
      
      childLogger.info('Broad chunk search completed', {
        resultsCount: results.length,
        topScore: results[0]?.hybridScore
      });
      
      return results;
    } catch (error) {
      childLogger.error('Broad chunk search failed', error as Error, {
        query: params.text,
        limit: params.limit
      });
      throw error;
    }
  }
  
  /**
   * Search chunks within a specific source document.
   * 
   * @param params - Search parameters including source filter
   * @returns Chunks from the specified source
   * @throws {DatabaseError} If database query fails
   * @throws {RecordNotFoundError} If source document not found
   */
  async searchInSource(params: TargetedChunkSearchParams): Promise<Chunk[]> {
    const childLogger = this.logger.child({
      operation: 'targeted_chunk_search',
      source: params.source,
      limit: params.limit
    });
    
    childLogger.info('Starting targeted chunk search');
    
    try {
      // Note: Current implementation returns all chunks from source
      // Future enhancement: Could filter results by params.text relevance
      const results = await this.chunkRepo.findBySource(params.source, params.limit);
      
      childLogger.info('Targeted chunk search completed', {
        chunksCount: results.length
      });
      
      return results;
    } catch (error) {
      childLogger.error('Targeted chunk search failed', error as Error, {
        source: params.source,
        limit: params.limit
      });
      throw error;
    }
  }
}

