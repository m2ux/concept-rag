/**
 * Enhanced Catalog Search Service with Result Types
 * 
 * This service demonstrates using Result types for error handling
 * in catalog search operations, providing an alternative to exception-based flow.
 */

import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { SearchResult } from '../models/index.js';
import { Result, Ok, Err } from '../functional/result.js';
import * as Railway from '../functional/railway.js';
import { validateCatalogSearch, ValidationError } from './validation/result-validator.js';

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
 * Catalog search errors
 */
export type CatalogSearchError =
  | { type: 'validation'; errors: ValidationError[] }
  | { type: 'database'; message: string }
  | { type: 'empty_results'; query: string }
  | { type: 'unknown'; message: string };

/**
 * Enhanced catalog search service using Result types
 */
export class ResultCatalogSearchService {
  constructor(private catalogRepo: CatalogRepository) {}
  
  /**
   * Search the catalog using Result types
   * 
   * This method returns Result<SearchResult[], CatalogSearchError> instead of throwing.
   * Use this when you want to compose operations or handle errors functionally.
   */
  async searchCatalog(
    params: Partial<CatalogSearchParams>
  ): Promise<Result<SearchResult[], CatalogSearchError>> {
    // Validate parameters
    const validationResult = validateCatalogSearch(params);
    if (!validationResult.ok) {
      return Err({ type: 'validation', errors: validationResult.error });
    }
    
    const validParams = validationResult.value;
    
    // Perform search with error handling
    try {
      const results = await this.catalogRepo.search({
        text: validParams.text,
        limit: params.limit ?? 5,
        debug: validParams.debug || false
      });
      
      // Check if we got any results
      if (results.length === 0) {
        return Err({ type: 'empty_results', query: validParams.text });
      }
      
      return Ok(results);
    } catch (error) {
      if (error instanceof Error && error.message.includes('database')) {
        return Err({ type: 'database', message: error.message });
      }
      
      return Err({
        type: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Search with fallback query if primary fails
   */
  async searchWithFallback(
    primaryQuery: string,
    fallbackQuery: string,
    limit: number = 5
  ): Promise<Result<SearchResult[], CatalogSearchError>> {
    return Railway.firstSuccess([
      () => this.searchCatalog({ text: primaryQuery, limit }),
      () => this.searchCatalog({ text: fallbackQuery, limit })
    ]);
  }
  
  /**
   * Search with retry on database errors
   */
  async searchWithRetry(
    params: Partial<CatalogSearchParams>,
    maxAttempts: number = 3
  ): Promise<Result<SearchResult[], CatalogSearchError>> {
    return Railway.retry(
      () => this.searchCatalog(params),
      {
        maxAttempts,
        delayMs: 100,
        shouldRetry: (error, attempt) => {
          // Retry on database errors, not on validation errors
          return error.type === 'database' && attempt < maxAttempts;
        }
      }
    );
  }
  
  /**
   * Search and filter results (demonstrating map usage)
   */
  async searchAndFilter(
    params: Partial<CatalogSearchParams>,
    minScore: number = 0.5
  ): Promise<Result<SearchResult[], CatalogSearchError>> {
    const searchResult = await this.searchCatalog(params);
    
    // Use map to transform the successful result
    return Result.map(searchResult, results =>
      results.filter(r => r.score >= minScore)
    );
  }
  
  /**
   * Search multiple queries in parallel
   */
  async searchMultiple(
    queries: string[],
    limit: number = 5
  ): Promise<Result<SearchResult[][], CatalogSearchError>> {
    const searchFns = queries.map(query => 
      () => this.searchCatalog({ text: query, limit })
    );
    
    return Railway.parallel(searchFns);
  }
  
  /**
   * Get the first search result (using Option)
   */
  getFirstResult(results: SearchResult[]): Option.Option<SearchResult> {
    return results.length > 0 ? Option.Some(results[0]) : Option.None();
  }
  
  /**
   * Extract titles from search results
   */
  extractTitles(results: SearchResult[]): string[] {
    return results.map(r => r.metadata.title);
  }
}

// Re-export for convenience
import * as Option from '../functional/option.js';

