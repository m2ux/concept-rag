import { LanceDBConnection } from '../infrastructure/lancedb/database-connection.js';
import { SimpleEmbeddingService } from '../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../infrastructure/search/conceptual-hybrid-search-service.js';
import { LanceDBChunkRepository } from '../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBCatalogRepository } from '../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { QueryExpander } from '../concepts/query_expander.js';
import { ConceptSearchService, CatalogSearchService, ChunkSearchService } from '../domain/services/index.js';
import { ConceptSearchTool } from '../tools/operations/concept_search.js';
import { ConceptualCatalogSearchTool } from '../tools/operations/conceptual_catalog_search.js';
import { ConceptualChunksSearchTool } from '../tools/operations/conceptual_chunks_search.js';
import { ConceptualBroadChunksSearchTool } from '../tools/operations/conceptual_broad_chunks_search.js';
import { DocumentConceptsExtractTool } from '../tools/operations/document_concepts_extract.js';
import { BaseTool } from '../tools/base/tool.js';
import { ConceptIdCache } from '../infrastructure/cache/concept-id-cache.js';
import { CategoryIdCache } from '../infrastructure/cache/category-id-cache.js';
import { LanceDBCategoryRepository } from '../infrastructure/lancedb/repositories/lancedb-category-repository.js';
import type { CategoryRepository } from '../domain/interfaces/category-repository.js';
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
    
    // 1. Connect to database
    this.dbConnection = await LanceDBConnection.connect(databaseUrl);
    
    // 2. Open tables
    const chunksTable = await this.dbConnection.openTable(defaults.CHUNKS_TABLE_NAME);
    const catalogTable = await this.dbConnection.openTable(defaults.CATALOG_TABLE_NAME);
    const conceptsTable = await this.dbConnection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    // 2a. Open categories table if it exists (optional for backward compatibility)
    let categoriesTable = null;
    try {
      categoriesTable = await this.dbConnection.openTable(defaults.CATEGORIES_TABLE_NAME);
      console.error('✅ Categories table found');
    } catch (err) {
      console.error('⚠️  Categories table not found (skipping category features)');
    }
    
    // 3. Create infrastructure services
    const embeddingService = new SimpleEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    
    // 4. Create repositories (with infrastructure services)
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    // 4a. Initialize ConceptIdCache for fast ID↔name resolution
    this.conceptIdCache = ConceptIdCache.getInstance();
    await this.conceptIdCache.initialize(conceptRepo);
    const cacheStats = this.conceptIdCache.getStats();
    console.error(`✅ ConceptIdCache initialized: ${cacheStats.conceptCount} concepts, ~${Math.round(cacheStats.memorySizeEstimate / 1024)}KB`);
    
    // 4b. Initialize CategoryIdCache if categories table exists
    if (categoriesTable) {
      this.categoryRepo = new LanceDBCategoryRepository(categoriesTable);
      this.categoryIdCache = CategoryIdCache.getInstance();
      await this.categoryIdCache.initialize(this.categoryRepo);
      const catStats = this.categoryIdCache.getStats();
      console.error(`✅ CategoryIdCache initialized: ${catStats.categoryCount} categories, ~${Math.round(catStats.memorySizeEstimate / 1024)}KB`);
    }
    
    const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService, hybridSearchService, this.conceptIdCache);
    const catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
    
    // 5. Create domain services (with repositories)
    const conceptSearchService = new ConceptSearchService(chunkRepo, conceptRepo);
    const catalogSearchService = new CatalogSearchService(catalogRepo);
    const chunkSearchService = new ChunkSearchService(chunkRepo);
    
    // 6. Create tools (with domain services)
    this.tools.set('concept_search', new ConceptSearchTool(conceptSearchService));
    this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogSearchService));
    this.tools.set('chunks_search', new ConceptualChunksSearchTool(chunkSearchService));
    this.tools.set('broad_chunks_search', new ConceptualBroadChunksSearchTool(chunkSearchService));
    this.tools.set('extract_concepts', new DocumentConceptsExtractTool(catalogRepo));
    
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
   * @returns Array of all tool instances (currently 5 tools)
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
}

