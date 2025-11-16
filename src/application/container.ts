import { LanceDBConnection } from '../infrastructure/lancedb/database-connection.js';
import { 
  SimpleEmbeddingService,
  OpenAIEmbeddingService,
  OpenRouterEmbeddingService,
  HuggingFaceEmbeddingService
} from '../infrastructure/embeddings/index.js';
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
import { EmbeddingService } from '../domain/interfaces/services/embedding-service.js';
import * as defaults from '../config.js';
import { embeddingConfig } from '../config.js';

/**
 * Application Container - Composition Root for Dependency Injection.
 * 
 * The ApplicationContainer is responsible for:
 * - **Creating all dependencies** (services, repositories, tools)
 * - **Wiring dependencies together** (manual dependency injection)
 * - **Managing lifecycle** (initialization, cleanup)
 * - **Providing access** to configured tools
 * 
 * **Design Pattern**: Composition Root (DDD / Clean Architecture)
 * - Single place where object graph is constructed
 * - Dependencies flow inward (Domain ← Infrastructure)
 * - Enables testing via dependency substitution
 * 
 * **Replaces Anti-Patterns**:
 * - ❌ Global mutable state (`export let client`)
 * - ❌ Eager instantiation at module load
 * - ❌ Implicit dependencies via imports
 * - ✅ Explicit dependency injection
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
 * @see "Code That Fits in Your Head" (Mark Seemann) - Composition Root pattern
 * @see "Introduction to Software Design and Architecture With TypeScript" (Khalil Stemmler) - DI patterns
 */
export class ApplicationContainer {
  private dbConnection!: LanceDBConnection;
  private tools = new Map<string, BaseTool>();
  
  /**
   * Create an embedding service based on configuration.
   * 
   * Factory method that instantiates the correct embedding service implementation
   * based on the `EMBEDDING_PROVIDER` environment variable.
   * 
   * **Supported Providers**:
   * - `simple`: Hash-based embeddings (default, no API key required)
   * - `openai`: OpenAI embeddings API (requires OPENAI_API_KEY)
   * - `openrouter`: OpenRouter embeddings API (requires OPENROUTER_API_KEY)
   * - `huggingface`: HuggingFace embeddings API or local (requires HUGGINGFACE_API_KEY or HUGGINGFACE_USE_LOCAL=true)
   * 
   * **Configuration**:
   * Set via environment variables (see `embeddingConfig` in config.ts)
   * 
   * @returns Configured EmbeddingService instance
   * @throws {Error} If required API keys are missing for selected provider
   * 
   * @example
   * ```typescript
   * // Uses configuration from environment variables
   * const service = this.createEmbeddingService();
   * ```
   */
  private createEmbeddingService(): EmbeddingService {
    const config = embeddingConfig;
    
    console.error(`🔌 Embedding Provider: ${config.provider}`);
    
    switch (config.provider) {
      case 'openai':
        if (!config.openai.apiKey) {
          throw new Error(
            'OpenAI embedding provider selected but OPENAI_API_KEY environment variable is not set. ' +
            'Either set OPENAI_API_KEY or change EMBEDDING_PROVIDER to "simple".'
          );
        }
        console.error(`   Model: ${config.openai.model}`);
        return new OpenAIEmbeddingService(config.openai);
        
      case 'openrouter':
        if (!config.openrouter.apiKey) {
          throw new Error(
            'OpenRouter embedding provider selected but OPENROUTER_API_KEY environment variable is not set. ' +
            'Either set OPENROUTER_API_KEY or change EMBEDDING_PROVIDER to "simple".'
          );
        }
        console.error(`   Model: ${config.openrouter.model}`);
        return new OpenRouterEmbeddingService(config.openrouter);
        
      case 'huggingface':
        if (!config.huggingface.useLocal && !config.huggingface.apiKey) {
          throw new Error(
            'HuggingFace embedding provider selected but neither HUGGINGFACE_API_KEY is set nor HUGGINGFACE_USE_LOCAL=true. ' +
            'Either set HUGGINGFACE_API_KEY, set HUGGINGFACE_USE_LOCAL=true, or change EMBEDDING_PROVIDER to "simple".'
          );
        }
        console.error(`   Model: ${config.huggingface.model}`);
        console.error(`   Mode: ${config.huggingface.useLocal ? 'Local' : 'API'}`);
        return new HuggingFaceEmbeddingService(config.huggingface);
        
      case 'simple':
      default:
        if (config.provider !== 'simple') {
          console.error(`⚠️  Unknown embedding provider "${config.provider}", falling back to "simple"`);
        }
        console.error('⚠️  Using SimpleEmbeddingService (development/testing only - not production-grade)');
        return new SimpleEmbeddingService();
    }
  }
  
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
    
    // 3. Create infrastructure services
    const embeddingService = this.createEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    
    // 4. Create repositories (with infrastructure services)
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService, hybridSearchService);
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
    console.error('🛑 Container shutdown complete');
  }
}

