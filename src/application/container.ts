import { LanceDBConnection } from '../infrastructure/lancedb/database-connection.js';
import { SimpleEmbeddingService } from '../infrastructure/embeddings/simple-embedding-service.js';
import { LanceDBChunkRepository } from '../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBCatalogRepository } from '../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { ConceptSearchTool } from '../tools/operations/concept_search.js';
import { ConceptualCatalogSearchTool } from '../tools/operations/conceptual_catalog_search.js';
import { ConceptualChunksSearchTool } from '../tools/operations/conceptual_chunks_search.js';
import { ConceptualBroadChunksSearchTool } from '../tools/operations/conceptual_broad_chunks_search.js';
import { DocumentConceptsExtractTool } from '../tools/operations/document_concepts_extract.js';
import { BaseTool } from '../tools/base/tool.js';
import * as defaults from '../config.js';

/**
 * Application Container - Composition Root
 * 
 * Single place where all dependencies are created and wired together.
 * Implements the Composition Root pattern from "Code That Fits in Your Head"
 * and "Introduction to Software Design and Architecture With TypeScript".
 * 
 * This replaces:
 * - Global module-level exports (export let client, etc.)
 * - Eager tool instantiation at module load
 * - Implicit dependencies via imports
 */
export class ApplicationContainer {
  private dbConnection!: LanceDBConnection;
  private tools = new Map<string, BaseTool>();
  
  /**
   * Initialize the application container
   * 
   * This is called once at server startup to:
   * 1. Connect to database
   * 2. Create repositories
   * 3. Create services
   * 4. Wire tools with their dependencies
   * 
   * @param databaseUrl - Path to LanceDB database
   */
  async initialize(databaseUrl: string): Promise<void> {
    console.error('🏗️  Initializing application container...');
    
    // 1. Connect to database
    this.dbConnection = await LanceDBConnection.connect(databaseUrl);
    
    // 2. Open tables
    const chunksTable = await this.dbConnection.openTable(defaults.CHUNKS_TABLE_NAME);
    const catalogTable = await this.dbConnection.openTable(defaults.CATALOG_TABLE_NAME);
    const conceptsTable = await this.dbConnection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    // 3. Create services
    const embeddingService = new SimpleEmbeddingService();
    
    // 4. Create repositories
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService);
    const catalogRepo = new LanceDBCatalogRepository(catalogTable, embeddingService);
    
    // 5. Create tools with injected dependencies
    this.tools.set('concept_search', new ConceptSearchTool(chunkRepo, conceptRepo));
    this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogRepo, conceptRepo));
    this.tools.set('chunks_search', new ConceptualChunksSearchTool(chunkRepo, conceptRepo));
    this.tools.set('broad_chunks_search', new ConceptualBroadChunksSearchTool(chunkRepo, conceptRepo));
    this.tools.set('extract_concepts', new DocumentConceptsExtractTool(catalogRepo, embeddingService));
    
    console.error(`✅ Container initialized with ${this.tools.size} tool(s)`);
  }
  
  /**
   * Get a tool by name
   * 
   * @param name - Tool name
   * @returns Tool instance
   * @throws Error if tool not found
   */
  getTool(name: string): BaseTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }
  
  /**
   * Get all available tools
   * 
   * @returns Array of all tool instances
   */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    await this.dbConnection.close();
    this.tools.clear();
    console.error('🛑 Container shutdown complete');
  }
}

