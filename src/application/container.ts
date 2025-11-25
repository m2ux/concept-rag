import { LanceDBConnection } from '../infrastructure/lancedb/database-connection.js';
import { SimpleEmbeddingService } from '../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../infrastructure/search/conceptual-hybrid-search-service.js';
import { LanceDBChunkRepository } from '../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBCatalogRepository } from '../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { QueryExpander } from '../concepts/query_expander.js';
import { 
  ConceptSearchService, 
  CatalogSearchService, 
  ChunkSearchService 
} from '../domain/services/index.js';
import { ConceptSearchTool } from '../tools/operations/concept_search.js';
import { ConceptualCatalogSearchTool } from '../tools/operations/conceptual_catalog_search.js';
import { ConceptualChunksSearchTool } from '../tools/operations/conceptual_chunks_search.js';
import { ConceptualBroadChunksSearchTool } from '../tools/operations/conceptual_broad_chunks_search.js';
import { DocumentConceptsExtractTool } from '../tools/operations/document_concepts_extract.js';
import { CategorySearchTool } from '../tools/operations/category-search-tool.js';
import { ListCategoriesTool } from '../tools/operations/list-categories-tool.js';
import { ListConceptsInCategoryTool } from '../tools/operations/list-concepts-in-category-tool.js';
import { BaseTool } from '../tools/base/tool.js';
import { ConceptIdCache, CategoryIdCache, EmbeddingCache, SearchResultCache } from '../infrastructure/cache/index.js';
import { LanceDBCategoryRepository } from '../infrastructure/lancedb/repositories/lancedb-category-repository.js';
import type { CategoryRepository } from '../domain/interfaces/category-repository.js';
import { RetryService } from '../infrastructure/utils/retry-service.js';
import { ResilientExecutor } from '../infrastructure/resilience/resilient-executor.js';
import type { SearchResult } from '../domain/models/search-result.js';
import * as defaults from '../config.js';

/**
 * Application Container - Composition Root for Dependency Injection.
 * 
 * The ApplicationContainer is responsible for:
 * - **Creating all dependencies** (services, repositories, tools)
 * - **Wiring dependencies together** (manual dependency injection)
 * - **Managing lifecycle** (initialization, cleanup)
 * - **Providing access** to configured tools
 * 
 * **Design Pattern**: Composition Root
 * - Single place where object graph is constructed
 * - Dependencies flow inward (Domain ← Infrastructure)
 * - Enables testing via dependency substitution
 * 
 * **Lifecycle**:
 * 1. `new ApplicationContainer()` - Create instance
 * 2. `await container.initialize(dbUrl)` - Wire dependencies
 * 3. `container.getTool(name)` - Use tools
 * 4. `await container.close()` - Cleanup resources
 * 
 * @example
 * ```typescript
 * // Server initialization
 * const container = new ApplicationContainer();
 * await container.initialize('~/.concept_rag');
 * 
 * // Use tools
 * const searchTool = container.getTool('concept_search');
 * const result = await searchTool.execute({ concept: 'microservices', limit: 10 });
 * 
 * // Shutdown
 * await container.close();
 * ```
 * 
 * See REFERENCES.md for pattern sources and further reading.
 */
export class ApplicationContainer {
  private dbConnection!: LanceDBConnection;
  private conceptIdCache?: ConceptIdCache;
  private categoryIdCache?: CategoryIdCache;
  private categoryRepo?: CategoryRepository;
  private retryService!: RetryService;
  private resilientExecutor!: ResilientExecutor;
  private embeddingCache?: EmbeddingCache;
  private searchResultCache?: SearchResultCache<SearchResult[]>;
  private tools = new Map<string, BaseTool>();
  
  /**
   * Initialize the application container and wire all dependencies.
   * 
   * This method implements the Composition Root pattern by:
   * 1. Connecting to the LanceDB database
   * 2. Opening required tables (chunks, catalog, concepts)
   * 3. Creating services (embedding, hybrid search)
   * 4. Creating repositories with injected services
   * 5. Creating tools with injected repositories
   * 
   * **Dependency Flow**:
   * ```
   * Database → Tables → Services → Repositories → Domain Services → Tools
   * ```
   * 
   * **Initialization Order** (critical for correctness):
   * 1. Database connection
   * 2. Tables
   * 3. Infrastructure Services (EmbeddingService, HybridSearchService)
   * 4. Repositories (inject infrastructure services)
   * 5. Domain Services (inject repositories)
   * 6. Tools (inject domain services)
   * 
   * **Idempotency**: Can be called multiple times (reopens connection)
   * 
   * @param databaseUrl - Path to LanceDB database (e.g., '~/.concept_rag', '/data/vectordb')
   * @throws {Error} If database connection fails
   * @throws {Error} If required tables don't exist (ensure database is seeded)
   * 
   * @example
   * ```typescript
   * const container = new ApplicationContainer();
   * await container.initialize('/home/user/.concept_rag');
   * console.log(`Initialized with ${container.getAllTools().length} tools`);
   * ```
   */
  async initialize(databaseUrl: string): Promise<void> {
    console.error('🏗️  Initializing application container...');
    
    // 1. Create resilience infrastructure (early, so it's available for all services)
    this.retryService = new RetryService();
    this.resilientExecutor = new ResilientExecutor(this.retryService);
    console.error('✅ Resilience infrastructure initialized (circuit breaker, bulkhead, timeout)');
    
    // 2. Connect to database (with resilience protection)
    this.dbConnection = await LanceDBConnection.connect(databaseUrl, this.resilientExecutor);
    
    // 3. Open tables
    const chunksTable = await this.dbConnection.openTable(defaults.CHUNKS_TABLE_NAME);
    const catalogTable = await this.dbConnection.openTable(defaults.CATALOG_TABLE_NAME);
    const conceptsTable = await this.dbConnection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    // 3a. Open categories table if it exists (optional for backward compatibility)
    let categoriesTable = null;
    try {
      categoriesTable = await this.dbConnection.openTable(defaults.CATEGORIES_TABLE_NAME);
      console.error('✅ Categories table found');
    } catch (err) {
      console.error('⚠️  Categories table not found (skipping category features)');
    }
    
    // 3b. Create performance caches
    this.embeddingCache = new EmbeddingCache(10000); // Cache up to 10k embeddings
    this.searchResultCache = new SearchResultCache<SearchResult[]>(1000, 5 * 60 * 1000); // 1k searches, 5min TTL
    console.error(`✅ Performance caches initialized`);
    
    // 4. Create infrastructure services (with caches and resilience integration)
    const embeddingService = new SimpleEmbeddingService(this.embeddingCache);
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander, this.searchResultCache, this.resilientExecutor);
    
    // 5. Create repositories (with infrastructure services)
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    // 5a. Initialize ConceptIdCache for fast ID↔name resolution
    this.conceptIdCache = ConceptIdCache.getInstance();
    await this.conceptIdCache.initialize(conceptRepo);
    const cacheStats = this.conceptIdCache.getStats();
    console.error(`✅ ConceptIdCache initialized: ${cacheStats.conceptCount} concepts, ~${Math.round(cacheStats.memorySizeEstimate / 1024)}KB`);
    
    // 5b. Initialize CategoryIdCache if categories table exists
    if (categoriesTable) {
      this.categoryRepo = new LanceDBCategoryRepository(categoriesTable);
      this.categoryIdCache = CategoryIdCache.getInstance();
      await this.categoryIdCache.initialize(this.categoryRepo);
      const catStats = this.categoryIdCache.getStats();
      console.error(`✅ CategoryIdCache initialized: ${catStats.categoryCount} categories, ~${Math.round(catStats.memorySizeEstimate / 1024)}KB`);
    }
    
    const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService, hybridSearchService, this.conceptIdCache);
    const catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
    
    // 6. Create domain services (with repositories) - using Result-based error handling
    const conceptSearchService = new ConceptSearchService(chunkRepo, conceptRepo);
    const catalogSearchService = new CatalogSearchService(catalogRepo);
    const chunkSearchService = new ChunkSearchService(chunkRepo);
    
    // 7. Create tools (with domain services)
    this.tools.set('concept_search', new ConceptSearchTool(conceptSearchService));
    this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogSearchService));
    this.tools.set('chunks_search', new ConceptualChunksSearchTool(chunkSearchService));
    this.tools.set('broad_chunks_search', new ConceptualBroadChunksSearchTool(chunkSearchService));
    this.tools.set('extract_concepts', new DocumentConceptsExtractTool(catalogRepo));
    
    // 7a. Register category tools if categories table exists
    if (categoriesTable && this.categoryIdCache) {
      this.tools.set('category_search', new CategorySearchTool(this.categoryIdCache, catalogRepo));
      this.tools.set('list_categories', new ListCategoriesTool(this.categoryIdCache));
      this.tools.set('list_concepts_in_category', new ListConceptsInCategoryTool(this.categoryIdCache, catalogRepo, conceptRepo));
      console.error(`✅ Category tools registered (3 tools)`);
    }
    
    console.error(`✅ Container initialized with ${this.tools.size} tool(s)`);
  }
  
  /**
   * Get a specific tool by name.
   * 
   * Available tools:
   * - `concept_search`: Find chunks by concept name
   * - `catalog_search`: Search document summaries
   * - `chunks_search`: Search within a specific document
   * - `broad_chunks_search`: Search all chunks with hybrid ranking
   * - `extract_concepts`: Extract concepts from a document
   * 
   * @param name - Tool name (e.g., 'concept_search', 'catalog_search')
   * @returns The requested tool instance
   * @throws {Error} If tool name is not recognized
   * 
   * @example
   * ```typescript
   * const searchTool = container.getTool('concept_search');
   * const result = await searchTool.execute({
   *   concept: 'microservices',
   *   limit: 10
   * });
   * ```
   */
  getTool(name: string): BaseTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }
  
  /**
   * Get all available tools as an array.
   * 
   * Useful for:
   * - MCP server tool listing
   * - Debugging/inspection
   * - Dynamic tool iteration
   * 
   * @returns Array of all tool instances (5 base tools + 3 category tools if categories table exists)
   * 
   * @example
   * ```typescript
   * const tools = container.getAllTools();
   * console.log(`Available tools: ${tools.map(t => t.name).join(', ')}`);
   * 
   * // MCP ListTools handler
   * server.setRequestHandler(ListToolsRequestSchema, async () => ({
   *   tools: container.getAllTools().map(tool => ({
   *     name: tool.name,
   *     description: tool.description,
   *     inputSchema: tool.inputSchema
   *   }))
   * }));
   * ```
   */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Cleanup and close all resources.
   * 
   * Performs graceful shutdown:
   * 1. Closes database connection
   * 2. Clears tool registry
   * 3. Logs shutdown completion
   * 
   * **When to call**:
   * - Server shutdown (SIGINT, SIGTERM)
   * - Application exit
   * - Between tests (if reusing container)
   * 
   * **Idempotent**: Safe to call multiple times
   * 
   * @throws {Error} If database connection close fails (rare)
   * 
   * @example
   * ```typescript
   * // Server shutdown handler
   * process.on('SIGINT', async () => {
   *   console.log('Shutting down...');
   *   await container.close();
   *   process.exit(0);
   * });
   * 
   * // Test cleanup
   * afterAll(async () => {
   *   await container.close();
   * });
   * ```
   */
  async close(): Promise<void> {
    await this.dbConnection.close();
    this.tools.clear();
    if (this.conceptIdCache) {
      this.conceptIdCache.clear();
    }
    if (this.categoryIdCache) {
      this.categoryIdCache.clear();
    }
    if (this.embeddingCache) {
      this.embeddingCache.clear();
    }
    if (this.searchResultCache) {
      this.searchResultCache.clear();
    }
    console.error('🛑 Container shutdown complete');
  }
  
  /**
   * Get CategoryRepository (if categories table exists)
   */
  getCategoryRepository(): CategoryRepository | undefined {
    return this.categoryRepo;
  }
  
  /**
   * Get CategoryIdCache (if initialized)
   */
  getCategoryIdCache(): CategoryIdCache | undefined {
    return this.categoryIdCache;
  }
  
  /**
   * Get ResilientExecutor for external service protection.
   * 
   * Use this to wrap external API calls with circuit breaker, bulkhead,
   * timeout, and retry protection.
   * 
   * @returns ResilientExecutor instance
   * 
   * @example
   * ```typescript
   * const executor = container.getResilientExecutor();
   * const result = await executor.execute(
   *   () => externalAPI.call(),
   *   ResilienceProfiles.LLM_API
   * );
   * ```
   */
  getResilientExecutor(): ResilientExecutor {
    return this.resilientExecutor;
  }
  
  /**
   * Get RetryService for custom retry logic.
   * 
   * @returns RetryService instance
   */
  getRetryService(): RetryService {
    return this.retryService;
  }
}

