/**
 * Integration Test Database Setup
 * 
 * Provides utilities for creating and tearing down test databases for integration tests.
 * Supports two modes:
 * 1. Fresh temp database with synthetic test data (isolated per test suite)
 * 2. Existing test_db with real sample-docs data (shared, faster)
 * 
 * **Design**: Test Fixture pattern
 * - Setup creates fresh test database with v7 schema OR uses existing test_db
 * - Teardown cleans up resources (only for temp databases)
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

// Path to the existing test_db with real sample-docs data
const EXISTING_TEST_DB_PATH = path.resolve(process.cwd(), 'test_db');

/**
 * Test database fixture for integration tests.
 * Manages lifecycle of LanceDB instance (temp or existing).
 */
export class TestDatabaseFixture {
  private testDbPath: string;
  private connection?: LanceDBConnection;
  private useExisting: boolean;
  
  constructor(testSuiteName: string, useExistingDb: boolean = false) {
    this.useExisting = useExistingDb;
    
    if (useExistingDb && fs.existsSync(EXISTING_TEST_DB_PATH)) {
      // Use existing test_db with real data
      this.testDbPath = EXISTING_TEST_DB_PATH;
    } else {
      // Create unique temp directory for this test suite
      this.testDbPath = path.join(
        os.tmpdir(),
        `concept-rag-test-${testSuiteName}-${Date.now()}`
      );
      this.useExisting = false;
    }
  }
  
  /**
   * Get the path to the test database.
   */
  getDbPath(): string {
    return this.testDbPath;
  }
  
  /**
   * Check if using existing database.
   */
  isUsingExistingDb(): boolean {
    return this.useExisting;
  }
  
  /**
   * Initialize test database.
   * If using existing db, just connects.
   * If using temp db, creates tables and populates with test fixtures.
   */
  async setup(): Promise<void> {
    if (this.useExisting) {
      // Just connect to existing database
      this.connection = await LanceDBConnection.connect(this.testDbPath);
      return;
    }
    
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
   * Only removes temp databases, not existing test_db.
   */
  async teardown(): Promise<void> {
    // Close connection
    if (this.connection) {
      await this.connection.close();
    }
    
    // Only remove temp database directories, not existing test_db
    if (!this.useExisting && fs.existsSync(this.testDbPath)) {
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
 * Uses synthetic test data in a temp directory.
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

/**
 * Create a test database fixture using the existing test_db with real sample-docs data.
 * This is faster and uses real document data for more realistic testing.
 * 
 * @example
 * ```typescript
 * describe('MCP Tools E2E Tests', () => {
 *   const fixture = useExistingTestDatabase('mcp-tools-e2e');
 *   
 *   beforeAll(async () => {
 *     await fixture.setup();
 *   });
 *   
 *   afterAll(async () => {
 *     await fixture.teardown();
 *   });
 *   
 *   it('should search real documents', async () => {
 *     const connection = fixture.getConnection();
 *     // ... test code using real data
 *   });
 * });
 * ```
 */
export function useExistingTestDatabase(testSuiteName: string): TestDatabaseFixture {
  return new TestDatabaseFixture(testSuiteName, true);
}
