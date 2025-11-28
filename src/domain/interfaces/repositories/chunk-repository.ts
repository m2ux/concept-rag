import { Chunk, SearchQuery, SearchResult } from '../../models/index.js';

/**
 * Repository interface for accessing chunk data from the vector database.
 * 
 * Chunks are text segments from documents enriched with:
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation
 * - Metadata for filtering and organization
 * 
 * **Performance Requirements**:
 * - Implementations MUST use efficient database queries (e.g., vector search)
 * - NEVER load all chunks into memory
 * - Target: O(log n) for searches, not O(n)
 * 
 * **Design Pattern**: Repository Pattern
 * - Abstracts data access behind domain interface
 * - Enables testability via test doubles
 * - Follows Dependency Inversion Principle
 * 
 * See REFERENCES.md for pattern sources and further reading.
 * 
 * @example
 * ```typescript
 * // Usage in application code
 * const chunks = await chunkRepo.findByConceptName('dependency injection', 10);
 * console.log(`Found ${chunks.length} chunks about DI`);
 * 
 * // Search with full query
 * const results = await chunkRepo.search({
 *   text: 'microservice architecture patterns',
 *   limit: 20,
 *   sourceFilter: 'design-patterns'
 * });
 * ```
 * 
 * @see {@link Chunk} for the data model
 * @see {@link SearchResult} for search result format
 * @see {@link SearchQuery} for query parameters
 */
export interface ChunkRepository {
  /**
   * Find chunks associated with a specific concept using vector search.
   * 
   * Performs efficient vector similarity search using the concept's embedding
   * rather than loading all chunks into memory. This is critical for performance
   * at scale.
   * 
   * **Performance**: O(log n) vector search
   * 
   * **Algorithm**:
   * 1. Look up concept's embedding in concept table
   * 2. Use embedding for vector similarity search in chunks table
   * 3. Filter by `json_contains(concepts, conceptName)`
   * 4. Sort by relevance (vector distance)
   * 
   * @param conceptName - The concept to search for (case-insensitive, e.g., 'REST API', 'microservices')
   * @param limit - Maximum number of chunks to return (typically 5-50)
   * @returns Promise resolving to array of chunks sorted by relevance (most relevant first)
   * @throws {Error} If database query fails
   * @throws {Error} If concept not found in concept table
   * 
   * @example
   * ```typescript
   * const chunks = await chunkRepo.findByConceptName('machine learning', 10);
   * chunks.forEach(chunk => {
   *   console.log(`Source: ${chunk.source}`);
   *   console.log(`Text: ${chunk.text.substring(0, 100)}...`);
   * });
   * ```
   */
  findByConceptName(conceptName: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Find chunks from a specific source document.
   * 
   * Retrieves all chunks that belong to a particular source document,
   * useful for document-specific searches or analysis.
   * 
   * @param sourcePath - The source document path (exact match, e.g., '/docs/guide.pdf')
   * @param limit - Maximum number of chunks to return
   * @returns Promise resolving to chunks from the specified source
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const chunks = await chunkRepo.findBySource('/docs/architecture.pdf', 100);
   * console.log(`Document has ${chunks.length} chunks`);
   * ```
   */
  findBySource(sourcePath: string, limit: number): Promise<Chunk[]>;
  
  /**
   * Find chunks from a specific catalog entry by ID.
   * 
   * Preferred over findBySource for normalized schema - uses integer ID
   * instead of string path matching.
   * 
   * @param catalogId - The catalog entry ID (hash-based integer)
   * @param limit - Maximum number of chunks to return
   * @returns Promise resolving to chunks from the specified document
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const chunks = await chunkRepo.findByCatalogId(3847293847, 100);
   * console.log(`Document has ${chunks.length} chunks`);
   * ```
   */
  findByCatalogId(catalogId: number, limit: number): Promise<Chunk[]>;
  
  /**
   * Perform hybrid search across all chunks using multi-signal ranking.
   * 
   * Combines multiple ranking signals for best results:
   * - **Vector similarity** (25%): Semantic understanding
   * - **BM25** (25%): Keyword matching
   * - **Title matching** (20%): Query in document title
   * - **Concept alignment** (20%): Conceptual relevance
   * - **WordNet expansion** (10%): Synonym matching
   * 
   * This is the most powerful search method, providing balanced ranking
   * across semantic, keyword, and conceptual dimensions.
   * 
   * @param query - Search query with text and optional filters
   * @param query.text - The search query (natural language or keywords)
   * @param query.limit - Maximum results (default: 10)
   * @param query.sourceFilter - Filter to sources containing this substring
   * @param query.debug - Enable score breakdown logging
   * @returns Promise resolving to ranked search results with scoring metadata
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const results = await chunkRepo.search({
   *   text: 'dependency injection best practices',
   *   limit: 15,
   *   sourceFilter: 'design-patterns',
   *   debug: true // Shows score breakdown
   * });
   * 
   * results.forEach(result => {
   *   console.log(`Score: ${result.hybridScore.toFixed(3)}`);
   *   console.log(`  Vector: ${result.vectorScore.toFixed(3)}`);
   *   console.log(`  BM25: ${result.bm25Score.toFixed(3)}`);
   *   console.log(`Text: ${result.text.substring(0, 100)}...`);
   * });
   * ```
   * 
   * @see {@link SearchResult} for score components
   * @see {@link SearchQuery} for query options
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  
  /**
   * Count the total number of chunks in the repository.
   * 
   * Useful for:
   * - Monitoring database growth
   * - Pagination calculations
   * - System health checks
   * 
   * @returns Promise resolving to total chunk count
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const total = await chunkRepo.countChunks();
   * console.log(`Database contains ${total} chunks`);
   * ```
   */
  countChunks(): Promise<number>;
}

