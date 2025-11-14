import * as lancedb from "@lancedb/lancedb";
import { SearchResult } from '../../models/search-result.js';

/**
 * Service for performing hybrid search combining multiple ranking signals.
 * 
 * Hybrid search combines:
 * - Vector similarity (semantic understanding)
 * - BM25 keyword matching (lexical relevance)
 * - Title matching (document relevance)
 * - Concept scoring (conceptual alignment)
 * - WordNet expansion (semantic enrichment)
 * 
 * The service handles query expansion and multi-signal ranking to provide
 * more accurate and comprehensive search results than single-signal approaches.
 */
export interface HybridSearchService {
  /**
   * Perform hybrid search on a LanceDB table.
   * 
   * @param table - The LanceDB table to search (chunks or catalog)
   * @param queryText - The search query text
   * @param limit - Maximum number of results to return
   * @param debug - Enable debug output (query expansion, score breakdown)
   * @returns Array of search results ranked by hybrid score
   */
  search(
    table: lancedb.Table,
    queryText: string,
    limit: number,
    debug?: boolean
  ): Promise<SearchResult[]>;
}

