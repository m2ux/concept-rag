import { SearchResult } from '../../models/search-result.js';

/**
 * Abstraction for a searchable collection with vector capabilities.
 * 
 * This interface decouples the domain layer from LanceDB specifics.
 * Implementations wrap a LanceDB table but expose only the operations
 * needed by the domain layer.
 * 
 * **Design**: This is an example of the Adapter pattern, wrapping
 * infrastructure concerns (LanceDB) to make them domain-friendly.
 */
export interface SearchableCollection {
  /**
   * Perform vector search on the collection.
   * 
   * @param queryVector - The embedding vector to search with
   * @param limit - Maximum number of results
   * @returns Promise of search results with similarity scores
   */
  vectorSearch(queryVector: number[], limit: number): Promise<any[]>;
  
  /**
   * Get the name/identifier of this collection (for logging/debugging).
   */
  getName(): string;
}

/**
 * Service interface for performing hybrid multi-signal search.
 * 
 * Hybrid search combines multiple ranking signals to provide more accurate
 * and comprehensive results than single-signal approaches (e.g., pure vector
 * search or keyword search alone).
 * 
 * **Ranking Signals** (weighted combination):
 * - **Vector similarity** (25%): Semantic understanding via embeddings
 * - **BM25** (25%): Statistical keyword matching with term frequency
 * - **Title matching** (20%): Query terms in document title/source
 * - **Concept alignment** (20%): Conceptual overlap with query
 * - **WordNet expansion** (10%): Synonym and related term matching
 * 
 * **Query Expansion**:
 * - Expands query with corpus-based related terms
 * - Adds WordNet synonyms and semantic relations
 * - Weights terms by importance
 * 
 * **Why Hybrid**:
 * - Vector search can miss exact keyword matches
 * - Keyword search misses semantic equivalents
 * - Combining signals provides balanced, robust results
 * 
 * **Performance**: Queries are reranked after initial vector search,
 * so performance is dominated by vector search (O(log n)).
 * 
 * @example
 * ```typescript
 * const service: HybridSearchService = new ConceptualHybridSearchService(
 *   embeddingService,
 *   queryExpander
 * );
 * 
 * // Search chunks table
 * const results = await service.search(
 *   chunksCollection,
 *   'dependency injection patterns',
 *   10,
 *   true // enable debug logging
 * );
 * 
 * results.forEach(result => {
 *   console.log(`Score: ${result.hybridScore.toFixed(3)}`);
 *   console.log(`  Vector: ${result.vectorScore.toFixed(3)}`);
 *   console.log(`  BM25: ${result.bm25Score.toFixed(3)}`);
 *   console.log(`  Title: ${result.titleScore.toFixed(3)}`);
 * });
 * ```
 * 
 * @see {@link SearchResult} for result format with score breakdown
 * @see {@link ConceptualHybridSearchService} for the implementation
 */
export interface HybridSearchService {
  /**
   * Perform hybrid search on a searchable collection using multi-signal ranking.
   * 
   * This is the core search operation that powers all search modalities.
   * It can be used with any searchable collection (chunks, catalog) as long as
   * the collection has the required fields (embeddings, text, source, concepts).
   * 
   * **Algorithm**:
   * 1. **Query Expansion**: Expand query with related terms and WordNet synonyms
   * 2. **Vector Search**: Get initial candidates using semantic similarity (3x limit)
   * 3. **Multi-Signal Scoring**: Score each result across all signals
   * 4. **Reranking**: Sort by weighted hybrid score
   * 5. **Top-K**: Return top K results
   * 
   * **Debug Mode**: When enabled, outputs detailed information to stderr:
   * - Expanded query terms
   * - Score breakdown for each result
   * - Matched concepts
   * 
   * @param collection - The searchable collection to query (chunks or catalog)
   * @param queryText - Natural language query or keywords (e.g., 'microservice patterns')
   * @param limit - Maximum number of results to return (typically 5-20, default: 5)
   * @param debug - Enable debug logging to stderr for query expansion and score breakdown
   * @returns Promise resolving to array of search results ranked by hybrid score (highest first)
   * @throws {Error} If collection access fails
   * @throws {Error} If query expansion fails
   * 
   * @example
   * ```typescript
   * // Basic search
   * const results = await hybridSearch.search(chunksCollection, 'REST API design', 10);
   * 
   * // With debug logging
   * const results = await hybridSearch.search(
   *   catalogCollection,
   *   'distributed systems patterns',
   *   5,
   *   true // shows query expansion and score breakdown
   * );
   * 
   * // Process results
   * results.forEach((result, idx) => {
   *   console.log(`${idx + 1}. ${result.source}`);
   *   console.log(`   Hybrid Score: ${result.hybridScore.toFixed(3)}`);
   *   console.log(`   Matched: ${result.matchedConcepts.join(', ')}`);
   *   console.log(`   Text: ${result.text.substring(0, 100)}...`);
   * });
   * ```
   */
  search(
    collection: SearchableCollection,
    queryText: string,
    limit: number,
    debug?: boolean
  ): Promise<SearchResult[]>;
}

