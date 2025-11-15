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
  constructor(private chunkRepo: ChunkRepository) {}
  
  /**
   * Search across all chunks in all documents.
   * 
   * Uses hybrid search with multi-signal ranking.
   * 
   * @param params - Search parameters
   * @returns Search results ranked by hybrid score
   */
  async searchBroad(params: BroadChunkSearchParams): Promise<SearchResult[]> {
    return await this.chunkRepo.search({
      text: params.text,
      limit: params.limit,
      debug: params.debug || false
    });
  }
  
  /**
   * Search chunks within a specific source document.
   * 
   * @param params - Search parameters including source filter
   * @returns Chunks from the specified source
   */
  async searchInSource(params: TargetedChunkSearchParams): Promise<Chunk[]> {
    // Note: Current implementation returns all chunks from source
    // Future enhancement: Could filter results by params.text relevance
    return await this.chunkRepo.findBySource(params.source, params.limit);
  }
}

