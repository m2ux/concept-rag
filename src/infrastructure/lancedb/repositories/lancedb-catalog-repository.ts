import * as lancedb from "@lancedb/lancedb";
import { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { SearchQuery, SearchResult } from '../../../domain/models/index.js';
import { HybridSearchService } from '../../../domain/interfaces/services/hybrid-search-service.js';

/**
 * LanceDB implementation of CatalogRepository
 * 
 * Uses HybridSearchService for multi-signal ranking:
 * - Vector similarity (semantic understanding)
 * - BM25 (keyword matching)
 * - Title matching (document relevance)
 * - Concept alignment
 * - WordNet expansion
 */
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private catalogTable: lancedb.Table,
    private hybridSearchService: HybridSearchService
  ) {}
  
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Use hybrid search for comprehensive multi-signal ranking
    const limit = query.limit || 5;
    const debug = query.debug || false;
    
    return await this.hybridSearchService.search(
      this.catalogTable,
      query.text,
      limit,
      debug
    );
  }
  
  async findBySource(source: string): Promise<SearchResult | null> {
    // Use hybrid search with source as query (benefits from title matching)
    const results = await this.hybridSearchService.search(
      this.catalogTable,
      source,
      10,
      false
    );
    
    // Find exact source match
    for (const result of results) {
      if (result.source.toLowerCase() === source.toLowerCase()) {
        return result;
      }
    }
    
    // If no exact match, return best match if it's close
    return results.length > 0 ? results[0] : null;
  }
}

