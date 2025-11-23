/**
 * Result-Based Chunk Search Service
 * 
 * This service provides functional error handling for chunk search operations
 * using Result types instead of exceptions. It complements the exception-based
 * ChunkSearchService for callers who prefer functional composition.
 * 
 * **Use this when you want to:**
 * - Compose search operations functionally
 * - Handle errors explicitly without try-catch
 * - Use railway patterns (retry, fallback, etc.)
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { Chunk, SearchResult } from '../models/index.js';
import { Result, Ok, Err } from '../functional/result.js';
import { InputValidator } from './validation/InputValidator.js';

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
 * Search error types
 */
export type SearchError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'database'; message: string }
  | { type: 'not_found'; resource: string }
  | { type: 'unknown'; message: string };

/**
 * Result-based chunk search service.
 * 
 * Returns Result<T, SearchError> instead of throwing exceptions,
 * enabling functional composition and explicit error handling.
 */
export class ResultChunkSearchService {
  private validator = new InputValidator();
  
  constructor(private chunkRepo: ChunkRepository) {}
  
  /**
   * Search across all chunks in all documents.
   * 
   * @param params - Search parameters
   * @returns Result containing search results or error
   * 
   * @example
   * ```typescript
   * const result = await service.searchBroad({ text: 'microservices', limit: 10 });
   * if (result.ok) {
   *   console.log('Found:', result.value);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   * 
   * @example With retry
   * ```typescript
   * const result = await retry(
   *   () => service.searchBroad({ text: query, limit: 10 }),
   *   { maxAttempts: 3, delayMs: 100 }
   * );
   * ```
   */
  async searchBroad(
    params: Partial<BroadChunkSearchParams>
  ): Promise<Result<SearchResult[], SearchError>> {
    // Validate parameters
    try {
      this.validator.validateBroadChunksSearch(params);
    } catch (error) {
      return Err({
        type: 'validation',
        field: 'params',
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    const validParams = params as BroadChunkSearchParams;
    
    // Execute search with error handling
    try {
      const results = await this.chunkRepo.search({
        text: validParams.text,
        limit: validParams.limit,
        debug: validParams.debug || false
      });
      
      return Ok(results);
    } catch (error) {
      if (error instanceof Error) {
        // Check error type by name or message
        if (error.constructor.name === 'DatabaseError') {
          return Err({
            type: 'database',
            message: error.message
          });
        }
      }
      
      return Err({
        type: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Search chunks within a specific source document.
   * 
   * @param params - Search parameters including source filter
   * @returns Result containing chunks or error
   * 
   * @example
   * ```typescript
   * const result = await service.searchInSource({
   *   text: 'architecture',
   *   source: '/docs/ddd.pdf',
   *   limit: 20
   * });
   * 
   * fold(
   *   result,
   *   chunks => displayChunks(chunks),
   *   error => showError(error)
   * );
   * ```
   */
  async searchInSource(
    params: Partial<TargetedChunkSearchParams>
  ): Promise<Result<Chunk[], SearchError>> {
    // Validate parameters
    try {
      this.validator.validateChunksSearch(params);
    } catch (error) {
      return Err({
        type: 'validation',
        field: 'params',
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    const validParams = params as TargetedChunkSearchParams;
    
    // Execute search with error handling
    try {
      const chunks = await this.chunkRepo.findBySource(
        validParams.source,
        validParams.limit
      );
      
      return Ok(chunks);
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a not-found error
        if (error.constructor.name === 'RecordNotFoundError') {
          return Err({
            type: 'not_found',
            resource: validParams.source
          });
        }
        
        if (error.constructor.name === 'DatabaseError') {
          return Err({
            type: 'database',
            message: error.message
          });
        }
      }
      
      return Err({
        type: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

