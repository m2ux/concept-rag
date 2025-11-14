import { SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for catalog (document summary) data access
 */
export interface CatalogRepository {
  /**
   * Search catalog using hybrid ranking
   * 
   * @param query - Search query with parameters
   * @returns Document summaries ranked by relevance
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Find catalog entry by source path
   * 
   * @param source - Source document path
   * @returns Catalog entry if found, null otherwise
   */
  findBySource(source: string): Promise<SearchResult | null>;
}

