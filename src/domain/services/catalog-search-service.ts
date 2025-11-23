/**
 * Domain service for catalog (document-level) search operations.
 * 
 * This service encapsulates business logic for discovering and searching
 * documents at the catalog level (summaries, metadata).
 * 
 * **Responsibility**: Orchestrate catalog searches and format results
 */

import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { SearchResult } from '../models/index.js';
import { ILogger } from '../../infrastructure/observability/index.js';

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
 * Domain service for catalog search.
 */
export class CatalogSearchService {
  constructor(
    private catalogRepo: CatalogRepository,
    private logger: ILogger
  ) {}
  
  /**
   * Search the document catalog.
   * 
   * Returns document-level results (summaries) ranked by relevance.
   * 
   * @param params - Search parameters
   * @returns Search results
   * @throws {DatabaseError} If database query fails
   * @throws {SearchError} If search operation fails
   */
  async searchCatalog(params: CatalogSearchParams): Promise<SearchResult[]> {
    const childLogger = this.logger.child({
      operation: 'catalog_search',
      query: params.text,
      limit: params.limit,
      debug: params.debug
    });
    
    childLogger.info('Starting catalog search');
    
    try {
      const results = await this.catalogRepo.search({
        text: params.text,
        limit: params.limit,
        debug: params.debug || false
      });
      
      childLogger.info('Catalog search completed', {
        resultsCount: results.length,
        topScore: results[0]?.hybridScore
      });
      
      return results;
    } catch (error) {
      childLogger.error('Catalog search failed', error as Error, {
        query: params.text,
        limit: params.limit
      });
      throw error;
    }
  }
}

