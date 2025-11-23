/**
 * Result-Based Catalog Search Service
 * 
 * This service provides functional error handling for catalog search operations
 * using Result types instead of exceptions. It complements the exception-based
 * CatalogSearchService for callers who prefer functional composition.
 * 
 * **Use this when you want to:**
 * - Compose search operations functionally
 * - Handle errors explicitly without try-catch
 * - Use railway patterns (retry, fallback, etc.)
 */

import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { SearchResult } from '../models/index.js';
import { Result, Ok, Err } from '../functional/result.js';
import { InputValidator } from './validation/InputValidator.js';

/**
 * Parameters for catalog search.
 */
export interface CatalogSearchParams {
  /** Search query text */
  text: string;
  
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
  | { type: 'empty_results'; query: string }
  | { type: 'unknown'; message: string };

/**
 * Result-based catalog search service.
 * 
 * Returns Result<T, SearchError> instead of throwing exceptions,
 * enabling functional composition and explicit error handling.
 */
export class ResultCatalogSearchService {
  private validator = new InputValidator();
  
  constructor(private catalogRepo: CatalogRepository) {}
  
  /**
   * Search the document catalog.
   * 
   * @param params - Search parameters
   * @returns Result containing search results or error
   * 
   * @example
   * ```typescript
   * const result = await service.searchCatalog({ text: 'microservices', limit: 5 });
   * if (result.ok) {
   *   console.log('Found:', result.value);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   * 
   * @example With Railway Pattern
   * ```typescript
   * const result = await pipe(
   *   () => service.searchCatalog({ text: query, limit: 5 }),
   *   async (results) => filterByCategory(results),
   *   async (filtered) => enrichWithMetadata(filtered)
   * )();
   * ```
   * 
   * @example With Retry
   * ```typescript
   * const result = await retry(
   *   () => service.searchCatalog({ text: query, limit: 5 }),
   *   { maxAttempts: 3, delayMs: 100 }
   * );
   * ```
   */
  async searchCatalog(
    params: Partial<CatalogSearchParams>
  ): Promise<Result<SearchResult[], SearchError>> {
    // Validate parameters
    try {
      this.validator.validateCatalogSearch(params);
    } catch (error) {
      return Err({
        type: 'validation',
        field: 'params',
        message: error instanceof Error ? error.message : String(error)
      });
    }
    
    const validParams = params as CatalogSearchParams;
    
    // Execute search with error handling
    try {
      const results = await this.catalogRepo.search({
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
}

