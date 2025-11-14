import { SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for accessing document catalog (summaries and metadata).
 * 
 * The catalog contains document-level information:
 * - Document summaries
 * - Primary concepts (key themes)
 * - Technical terms
 * - Categories and tags
 * - Document embeddings
 * 
 * **Purpose**: Document discovery and overview
 * 
 * **Difference from ChunkRepository**:
 * - **CatalogRepository**: Document-level search (find documents)
 * - **ChunkRepository**: Chunk-level search (find specific passages)
 * 
 * @example
 * ```typescript
 * // Find documents about a topic
 * const docs = await catalogRepo.search({
 *   text: 'microservice patterns',
 *   limit: 5
 * });
 * 
 * docs.forEach(doc => {
 *   console.log(`Document: ${doc.source}`);
 *   console.log(`Summary: ${doc.text.substring(0, 200)}...`);
 *   console.log(`Concepts: ${doc.concepts.primary_concepts.join(', ')}`);
 * });
 * ```
 * 
 * @see {@link SearchResult} for result format
 * @see {@link SearchQuery} for query parameters
 */
export interface CatalogRepository {
  /**
   * Search document catalog using hybrid multi-signal ranking.
   * 
   * Finds relevant documents using the same hybrid search algorithm as
   * chunk search, but operates at the document level. Particularly effective
   * for title matching (documents often have descriptive titles).
   * 
   * **Ranking Signals**:
   * - **Vector similarity** (25%): Semantic document understanding
   * - **BM25** (25%): Keyword matching in summary
   * - **Title matching** (20%): Query in document title (high weight)
   * - **Concept alignment** (20%): Document's primary concepts match query
   * - **WordNet expansion** (10%): Synonym matching
   * 
   * **Best for**:
   * - "What documents cover X?"
   * - Document discovery
   * - Broad topic exploration
   * 
   * @param query - Search query with text and optional filters
   * @param query.text - The search query (e.g., 'REST API design patterns')
   * @param query.limit - Maximum documents to return (default: 5)
   * @param query.debug - Enable score breakdown logging
   * @returns Promise resolving to document summaries ranked by relevance
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const results = await catalogRepo.search({
   *   text: 'dependency injection patterns',
   *   limit: 5,
   *   debug: true
   * });
   * 
   * results.forEach(doc => {
   *   console.log(`\nDocument: ${doc.source.split('/').pop()}`);
   *   console.log(`Score: ${doc.hybridScore.toFixed(3)}`);
   *   console.log(`Primary Concepts: ${doc.concepts.primary_concepts.slice(0, 3).join(', ')}`);
   *   console.log(`Summary: ${doc.text.substring(0, 150)}...`);
   * });
   * ```
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Find a catalog entry by source document path.
   * 
   * Retrieves the catalog entry (summary, concepts, metadata) for a specific
   * document. Uses hybrid search with the source path as the query, which
   * benefits from strong title matching.
   * 
   * **Use Cases**:
   * - Get document metadata
   * - Extract document concepts
   * - Document overview
   * 
   * @param sourcePath - The source document path (e.g., '/docs/guide.pdf')
   * @returns Promise resolving to catalog entry if found, null if not found
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const entry = await catalogRepo.findBySource('/docs/microservices-guide.pdf');
   * if (entry) {
   *   console.log(`Document: ${entry.source}`);
   *   console.log(`Summary: ${entry.text}`);
   *   console.log(`Primary Concepts:`);
   *   entry.concepts.primary_concepts.forEach(c => console.log(`  - ${c}`));
   *   console.log(`Categories: ${entry.concepts.categories.join(', ')}`);
   * }
   * ```
   */
  findBySource(sourcePath: string): Promise<SearchResult | null>;
}

