/**
 * Integration Test Database Setup
 * 
 * Provides utilities for creating and tearing down test databases for integration tests.
 * Uses a temporary directory for each test suite to ensure isolation.
 * 
 * **Design**: Test Fixture pattern
 * - Setup creates fresh test database with v7 schema
 * - Teardown cleans up resources
 * - Each test suite gets isolated environment
 * 
 * See REFERENCES.md for pattern sources and further reading.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LanceDBConnection } from '../../infrastructure/lancedb/database-connection.js';
import * as lancedb from '@lancedb/lancedb';
import {
  createStandardTestChunks,
  createStandardTestConcepts,
  createStandardTestCatalogEntries,
  createStandardTestCategories
} from '../test-helpers/integration-test-data.js';

/**
 * Test database fixture for integration tests.
 * Manages lifecycle of temporary LanceDB instance.
 */
export class TestDatabaseFixture {
  private testDbPath: string;
  private connection?: LanceDBConnection;
  
  constructor(testSuiteName: string) {
    // Create unique temp directory for this test suite
    this.testDbPath = path.join(
      os.tmpdir(),
      `concept-rag-test-${testSuiteName}-${Date.now()}`
    );
  }
  
  /**
   * Get the path to the test database.
   */
  getDbPath(): string {
    return this.testDbPath;
  }
  
  /**
   * Initialize test database with sample data.
   * Creates tables and populates with test fixtures using v7 schema.
   */
  async setup(): Promise<void> {
    // Create test database directory
    fs.mkdirSync(this.testDbPath, { recursive: true });
    
    // Connect to database
    this.connection = await LanceDBConnection.connect(this.testDbPath);
    
    // Create and populate tables
    await this.createChunksTable();
    await this.createConceptsTable();
    await this.createCatalogTable();
    await this.createCategoriesTable();
  }
  
  /**
   * Clean up test database and resources.
   */
  async teardown(): Promise<void> {
    // Close connection
    if (this.connection) {
      await this.connection.close();
    }
    
    // Remove test database directory
    if (fs.existsSync(this.testDbPath)) {
      fs.rmSync(this.testDbPath, { recursive: true, force: true });
    }
  }
  
  /**
   * Get the database connection for direct table access.
   */
  getConnection(): LanceDBConnection {
    if (!this.connection) {
      throw new Error('Test database not initialized. Call setup() first.');
    }
    return this.connection;
  }
  
  /**
   * Create and populate chunks table with test data (v7 schema).
   */
  private async createChunksTable(): Promise<void> {
    const chunks = createStandardTestChunks();
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('chunks', chunks, { mode: 'overwrite' });
  }
  
  /**
   * Create and populate concepts table with test data.
   */
  private async createConceptsTable(): Promise<void> {
    const concepts = createStandardTestConcepts();
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('concepts', concepts, { mode: 'overwrite' });
  }
  
  /**
   * Create and populate catalog table with test data (v7 schema).
   */
  private async createCatalogTable(): Promise<void> {
    const catalog = createStandardTestCatalogEntries();
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('catalog', catalog, { mode: 'overwrite' });
  }
  
  /**
   * Create and populate categories table with test data.
   */
  private async createCategoriesTable(): Promise<void> {
    const categories = createStandardTestCategories();
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('categories', categories, { mode: 'overwrite' });
  }
}

/**
 * Create a test database fixture for a test suite.
 * 
 * @example
 * ```typescript
 * describe('ChunkRepository Integration Tests', () => {
 *   const fixture = createTestDatabase('chunk-repo');
 *   
 *   beforeAll(async () => {
 *     await fixture.setup();
 *   });
 *   
 *   afterAll(async () => {
 *     await fixture.teardown();
 *   });
 *   
 *   it('should find chunks', async () => {
 *     const connection = fixture.getConnection();
 *     // ... test code
 *   });
 * });
 * ```
 */
export function createTestDatabase(testSuiteName: string): TestDatabaseFixture {
  return new TestDatabaseFixture(testSuiteName);
}
