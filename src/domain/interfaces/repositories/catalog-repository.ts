import { SearchQuery, SearchResult } from '../../models/index.js';
import { Option } from '../../functional/option.js';

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
   * Find a catalog entry by hash-based catalog ID.
   * 
   * Returns Option<SearchResult> for type-safe nullable handling.
   * 
   * @param catalogId - Hash-based document ID
   * @returns Promise resolving to Some(entry) if found, None if not found
   * @throws {Error} If database query fails
   */
  findById(catalogId: number): Promise<Option<SearchResult>>;
  
  /**
   * Find a catalog entry by source document path.
   * 
   * Returns Option<SearchResult> for type-safe nullable handling.
   * Use isSome/isNone to check, or fold/map for functional composition.
   * 
   * @param sourcePath - The source document path
   * @returns Promise resolving to Some(entry) if found, None if not found
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * import { isSome, map, fold } from '../../functional/option';
   * 
   * const entryOpt = await catalogRepo.findBySource('/docs/guide.pdf');
   * 
   * if (isSome(entryOpt)) {
   *   const entry = entryOpt.value;
   *   console.log(`Document: ${entry.source}`);
   *   console.log(`Summary: ${entry.text}`);
   * }
   * 
   * // Extract primary concepts with default
   * const concepts = fold(
   *   entryOpt,
   *   () => [],
   *   entry => entry.concepts.primary_concepts
   * );
   * ```
   */
  findBySource(sourcePath: string): Promise<Option<SearchResult>>;
  
  /**
   * Find all documents in a specific category.
   * 
   * Queries documents by category_ids field (hash-based integer IDs).
   * Categories are stored directly on documents, enabling fast filtering.
   * 
   * **Use Cases**:
   * - Browse documents by category
   * - Category-specific search
   * - Aggregate concepts in a category
   * 
   * @param categoryId - Hash-based category ID
   * @returns Promise resolving to array of documents in this category
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const categoryId = categoryCache.getId("software engineering");
   * const docs = await catalogRepo.findByCategory(categoryId);
   * console.log(`Found ${docs.length} documents in category`);
   * ```
   */
  findByCategory(categoryId: number): Promise<SearchResult[]>;
  
  /**
   * Get unique concepts that appear in documents of a category.
   * 
   * Dynamically queries documents in a category and aggregates their concepts.
   * Uses query-time computation (no redundant storage) for accuracy and simplicity.
   * 
   * **Performance**: ~30-130ms for typical libraries (acceptable for occasional queries)
   * 
   * **Design**: Concepts are category-agnostic (cross-domain). This method finds
   * which concepts happen to appear in documents of a specific category.
   * 
   * @param categoryId - Hash-based category ID
   * @returns Promise resolving to array of unique concept IDs
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const categoryId = categoryCache.getId("software engineering");
   * const conceptIds = await catalogRepo.getConceptsInCategory(categoryId);
   * console.log(`${conceptIds.length} unique concepts in this category`);
   * 
   * // Fetch concept details
   * const concepts = await conceptRepo.findByIds(conceptIds.slice(0, 50));
   * ```
   */
  getConceptsInCategory(categoryId: number): Promise<number[]>;
  
  /**
   * Count total number of documents in the catalog.
   * 
   * Returns the actual unique document count, not the sum of category assignments
   * (since a document can belong to multiple categories).
   * 
   * @returns Promise resolving to total document count
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const totalDocs = await catalogRepo.count();
   * console.log(`Library contains ${totalDocs} documents`);
   * ```
   */
  count(): Promise<number>;
}

