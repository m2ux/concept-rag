/**
 * Integration Test Database Setup
 * 
 * Provides utilities for creating and tearing down test databases for integration tests.
 * Uses a temporary directory for each test suite to ensure isolation.
 * 
 * **Design**: Test Fixture pattern (Martin Fowler, xUnit Test Patterns)
 * - Setup creates fresh test database
 * - Teardown cleans up resources
 * - Each test suite gets isolated environment
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LanceDBConnection } from '../../infrastructure/lancedb/database-connection.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import * as lancedb from '@lancedb/lancedb';

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
   * Creates tables and populates with test fixtures.
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
   * Create and populate chunks table with test data.
   */
  private async createChunksTable(): Promise<void> {
    const embeddingService = new SimpleEmbeddingService();
    
    const chunks = [
      {
        text: 'Clean architecture is a software design philosophy that emphasizes separation of concerns and dependency inversion.',
        source: '/docs/architecture/clean-architecture.pdf',
        vector: embeddingService.generateEmbedding('Clean architecture is a software design philosophy'),
        concepts: JSON.stringify(['clean architecture', 'separation of concerns', 'dependency inversion']),
        concept_categories: JSON.stringify(['Architecture Pattern', 'Software Design']),
        concept_density: 0.15,
        chunk_index: 0
      },
      {
        text: 'Repository pattern provides an abstraction layer between the domain and data mapping layers.',
        source: '/docs/patterns/repository-pattern.pdf',
        vector: embeddingService.generateEmbedding('Repository pattern provides an abstraction layer'),
        concepts: JSON.stringify(['repository pattern', 'abstraction', 'data mapping']),
        concept_categories: JSON.stringify(['Design Pattern']),
        concept_density: 0.12,
        chunk_index: 0
      },
      {
        text: 'Dependency injection is a technique for achieving Inversion of Control between classes and their dependencies.',
        source: '/docs/patterns/dependency-injection.pdf',
        vector: embeddingService.generateEmbedding('Dependency injection is a technique'),
        concepts: JSON.stringify(['dependency injection', 'inversion of control', 'ioc']),
        concept_categories: JSON.stringify(['Design Pattern', 'SOLID Principles']),
        concept_density: 0.18,
        chunk_index: 0
      },
      {
        text: 'SOLID principles are five design principles intended to make software designs more understandable, flexible and maintainable.',
        source: '/docs/principles/solid.pdf',
        vector: embeddingService.generateEmbedding('SOLID principles are five design principles'),
        concepts: JSON.stringify(['solid principles', 'software design', 'maintainability']),
        concept_categories: JSON.stringify(['Software Design', 'Best Practices']),
        concept_density: 0.14,
        chunk_index: 0
      },
      {
        text: 'TypeScript provides static type checking for JavaScript, catching errors at compile time rather than runtime.',
        source: '/docs/languages/typescript.pdf',
        vector: embeddingService.generateEmbedding('TypeScript provides static type checking'),
        concepts: JSON.stringify(['typescript', 'static typing', 'type safety']),
        concept_categories: JSON.stringify(['Programming Language', 'Type System']),
        concept_density: 0.16,
        chunk_index: 0
      }
    ];
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('chunks', chunks, { mode: 'overwrite' });
  }
  
  /**
   * Create and populate concepts table with test data.
   */
  private async createConceptsTable(): Promise<void> {
    const embeddingService = new SimpleEmbeddingService();
    
    const concepts = [
      {
        concept: 'clean architecture',
        vector: embeddingService.generateEmbedding('clean architecture'),
        category: 'Architecture Pattern',
        weight: 0.85,
        chunk_count: 5,
        sources: JSON.stringify(['/docs/architecture/clean-architecture.pdf']),
        related_concepts: JSON.stringify(['layered architecture', 'hexagonal architecture', 'onion architecture'])
      },
      {
        concept: 'repository pattern',
        vector: embeddingService.generateEmbedding('repository pattern'),
        category: 'Design Pattern',
        weight: 0.78,
        chunk_count: 3,
        sources: JSON.stringify(['/docs/patterns/repository-pattern.pdf']),
        related_concepts: JSON.stringify(['data access', 'abstraction layer', 'persistence'])
      },
      {
        concept: 'dependency injection',
        vector: embeddingService.generateEmbedding('dependency injection'),
        category: 'Design Pattern',
        weight: 0.82,
        chunk_count: 4,
        sources: JSON.stringify(['/docs/patterns/dependency-injection.pdf']),
        related_concepts: JSON.stringify(['inversion of control', 'ioc container', 'di container'])
      },
      {
        concept: 'solid principles',
        vector: embeddingService.generateEmbedding('solid principles'),
        category: 'Software Design',
        weight: 0.90,
        chunk_count: 8,
        sources: JSON.stringify(['/docs/principles/solid.pdf']),
        related_concepts: JSON.stringify(['srp', 'ocp', 'lsp', 'isp', 'dip'])
      },
      {
        concept: 'typescript',
        vector: embeddingService.generateEmbedding('typescript'),
        category: 'Programming Language',
        weight: 0.75,
        chunk_count: 10,
        sources: JSON.stringify(['/docs/languages/typescript.pdf']),
        related_concepts: JSON.stringify(['javascript', 'static typing', 'type inference'])
      }
    ];
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('concepts', concepts, { mode: 'overwrite' });
  }
  
  /**
   * Create and populate catalog table with test data.
   */
  private async createCatalogTable(): Promise<void> {
    const embeddingService = new SimpleEmbeddingService();
    
    const catalog = [
      {
        text: 'Comprehensive guide to Clean Architecture principles and implementation patterns.',
        source: '/docs/architecture/clean-architecture.pdf',
        vector: embeddingService.generateEmbedding('Clean Architecture principles'),
        concepts: JSON.stringify(['clean architecture', 'layered architecture', 'dependency inversion']),
        concept_categories: JSON.stringify(['Architecture Pattern'])
      },
      {
        text: 'Design patterns for modern software development including Repository and Factory patterns.',
        source: '/docs/patterns/repository-pattern.pdf',
        vector: embeddingService.generateEmbedding('Design patterns for modern software'),
        concepts: JSON.stringify(['repository pattern', 'factory pattern', 'design patterns']),
        concept_categories: JSON.stringify(['Design Pattern'])
      },
      {
        text: 'Understanding Dependency Injection and Inversion of Control in object-oriented programming.',
        source: '/docs/patterns/dependency-injection.pdf',
        vector: embeddingService.generateEmbedding('Dependency Injection and IoC'),
        concepts: JSON.stringify(['dependency injection', 'inversion of control']),
        concept_categories: JSON.stringify(['Design Pattern'])
      },
      {
        text: 'SOLID principles: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
        source: '/docs/principles/solid.pdf',
        vector: embeddingService.generateEmbedding('SOLID principles SRP OCP LSP ISP DIP'),
        concepts: JSON.stringify(['solid principles', 'srp', 'ocp', 'lsp', 'isp', 'dip']),
        concept_categories: JSON.stringify(['Software Design'])
      },
      {
        text: 'TypeScript language features, type system, and best practices for type-safe JavaScript development.',
        source: '/docs/languages/typescript.pdf',
        vector: embeddingService.generateEmbedding('TypeScript language features type system'),
        concepts: JSON.stringify(['typescript', 'static typing', 'type safety']),
        concept_categories: JSON.stringify(['Programming Language'])
      }
    ];
    
    const db = await lancedb.connect(this.testDbPath);
    await db.createTable('catalog', catalog, { mode: 'overwrite' });
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

