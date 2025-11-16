/**
 * Integration Test Data Builders
 * 
 * Helper functions to create test data for integration tests with real LanceDB tables.
 * Uses the Test Data Builder pattern to provide sensible defaults with easy customization.
 * 
 * These builders create data in the format expected by LanceDB (with JSON stringified fields),
 * unlike the unit test builders which create domain models.
 */

import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';

// Singleton embedding service for test data generation
const embeddingService = new SimpleEmbeddingService();

/**
 * Integration test chunk data (for LanceDB table)
 */
export interface IntegrationChunkData {
  id?: string; // Optional for LanceDB (auto-generated)
  text: string;
  source: string;
  vector: number[];
  concepts: string; // JSON stringified
  concept_categories: string; // JSON stringified
  concept_density: number;
  chunk_index: number;
  hash?: string; // Optional
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Integration test concept data (for LanceDB table)
 */
export interface IntegrationConceptData {
  id?: string; // Optional for LanceDB (auto-generated)
  concept: string;
  vector: number[];
  category: string;
  weight: number;
  chunk_count: number;
  sources: string; // JSON stringified
  related_concepts: string; // JSON stringified
  concept_type?: string; // Optional for backward compatibility
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Integration test catalog data (for LanceDB table)
 */
export interface IntegrationCatalogData {
  id?: string; // Optional for LanceDB (auto-generated)
  text: string;
  source: string;
  vector: number[];
  concepts: string; // JSON stringified
  concept_categories: string; // JSON stringified
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Creates an integration test chunk with sensible defaults
 * 
 * @param overrides - Partial properties to override defaults
 * @returns Chunk data ready for LanceDB insertion
 */
export function createIntegrationTestChunk(overrides?: Partial<IntegrationChunkData>): IntegrationChunkData {
  const defaults: IntegrationChunkData = {
    text: 'Clean architecture is a software design philosophy that emphasizes separation of concerns and dependency inversion.',
    source: '/docs/architecture/clean-architecture.pdf',
    vector: embeddingService.generateEmbedding('Clean architecture is a software design philosophy'),
    concepts: JSON.stringify(['clean architecture', 'separation of concerns', 'dependency inversion']),
    concept_categories: JSON.stringify(['Architecture Pattern', 'Software Design']),
    concept_density: 0.15,
    chunk_index: 0
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates an integration test concept with sensible defaults
 * 
 * @param overrides - Partial properties to override defaults
 * @returns Concept data ready for LanceDB insertion
 */
export function createIntegrationTestConcept(overrides?: Partial<IntegrationConceptData>): IntegrationConceptData {
  const defaults: IntegrationConceptData = {
    concept: 'clean architecture',
    vector: embeddingService.generateEmbedding('clean architecture'),
    category: 'Architecture Pattern',
    weight: 0.85,
    chunk_count: 5,
    sources: JSON.stringify(['/docs/architecture/clean-architecture.pdf']),
    related_concepts: JSON.stringify(['layered architecture', 'hexagonal architecture', 'onion architecture']),
    concept_type: 'thematic'
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates an integration test catalog entry with sensible defaults
 * 
 * @param overrides - Partial properties to override defaults
 * @returns Catalog data ready for LanceDB insertion
 */
export function createIntegrationTestCatalogEntry(overrides?: Partial<IntegrationCatalogData>): IntegrationCatalogData {
  const defaults: IntegrationCatalogData = {
    text: 'Comprehensive guide to Clean Architecture principles and implementation patterns.',
    source: '/docs/architecture/clean-architecture.pdf',
    vector: embeddingService.generateEmbedding('Clean Architecture principles'),
    concepts: JSON.stringify(['clean architecture', 'layered architecture', 'dependency inversion']),
    concept_categories: JSON.stringify(['Architecture Pattern'])
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates a set of standard test chunks for integration testing
 */
export function createStandardTestChunks(): IntegrationChunkData[] {
  return [
    createIntegrationTestChunk(),
    createIntegrationTestChunk({
      text: 'Repository pattern provides an abstraction layer between the domain and data mapping layers.',
      source: '/docs/patterns/repository-pattern.pdf',
      vector: embeddingService.generateEmbedding('Repository pattern provides an abstraction layer'),
      concepts: JSON.stringify(['repository pattern', 'abstraction', 'data mapping']),
      concept_categories: JSON.stringify(['Design Pattern']),
      concept_density: 0.12
    }),
    createIntegrationTestChunk({
      text: 'Dependency injection is a technique for achieving Inversion of Control between classes and their dependencies.',
      source: '/docs/patterns/dependency-injection.pdf',
      vector: embeddingService.generateEmbedding('Dependency injection is a technique'),
      concepts: JSON.stringify(['dependency injection', 'inversion of control', 'ioc']),
      concept_categories: JSON.stringify(['Design Pattern', 'SOLID Principles']),
      concept_density: 0.18
    }),
    createIntegrationTestChunk({
      text: 'SOLID principles are five design principles intended to make software designs more understandable, flexible and maintainable.',
      source: '/docs/principles/solid.pdf',
      vector: embeddingService.generateEmbedding('SOLID principles are five design principles'),
      concepts: JSON.stringify(['solid principles', 'software design', 'maintainability']),
      concept_categories: JSON.stringify(['Software Design', 'Best Practices']),
      concept_density: 0.14
    }),
    createIntegrationTestChunk({
      text: 'TypeScript provides static type checking for JavaScript, catching errors at compile time rather than runtime.',
      source: '/docs/languages/typescript.pdf',
      vector: embeddingService.generateEmbedding('TypeScript provides static type checking'),
      concepts: JSON.stringify(['typescript', 'static typing', 'type safety']),
      concept_categories: JSON.stringify(['Programming Language', 'Type System']),
      concept_density: 0.16
    })
  ];
}

/**
 * Creates a set of standard test concepts for integration testing
 */
export function createStandardTestConcepts(): IntegrationConceptData[] {
  return [
    createIntegrationTestConcept(),
    createIntegrationTestConcept({
      concept: 'repository pattern',
      vector: embeddingService.generateEmbedding('repository pattern'),
      category: 'Design Pattern',
      weight: 0.78,
      chunk_count: 3,
      sources: JSON.stringify(['/docs/patterns/repository-pattern.pdf']),
      related_concepts: JSON.stringify(['data access', 'abstraction layer', 'persistence'])
    }),
    createIntegrationTestConcept({
      concept: 'dependency injection',
      vector: embeddingService.generateEmbedding('dependency injection'),
      category: 'Design Pattern',
      weight: 0.82,
      chunk_count: 4,
      sources: JSON.stringify(['/docs/patterns/dependency-injection.pdf']),
      related_concepts: JSON.stringify(['inversion of control', 'ioc container', 'di container'])
    }),
    createIntegrationTestConcept({
      concept: 'solid principles',
      vector: embeddingService.generateEmbedding('solid principles'),
      category: 'Software Design',
      weight: 0.90,
      chunk_count: 8,
      sources: JSON.stringify(['/docs/principles/solid.pdf']),
      related_concepts: JSON.stringify(['srp', 'ocp', 'lsp', 'isp', 'dip'])
    }),
    createIntegrationTestConcept({
      concept: 'typescript',
      vector: embeddingService.generateEmbedding('typescript'),
      category: 'Programming Language',
      weight: 0.75,
      chunk_count: 10,
      sources: JSON.stringify(['/docs/languages/typescript.pdf']),
      related_concepts: JSON.stringify(['javascript', 'static typing', 'type inference'])
    })
  ];
}

/**
 * Creates a set of standard test catalog entries for integration testing
 */
export function createStandardTestCatalogEntries(): IntegrationCatalogData[] {
  return [
    createIntegrationTestCatalogEntry(),
    createIntegrationTestCatalogEntry({
      text: 'Design patterns for modern software development including Repository and Factory patterns.',
      source: '/docs/patterns/repository-pattern.pdf',
      vector: embeddingService.generateEmbedding('Design patterns for modern software'),
      concepts: JSON.stringify(['repository pattern', 'factory pattern', 'design patterns']),
      concept_categories: JSON.stringify(['Design Pattern'])
    }),
    createIntegrationTestCatalogEntry({
      text: 'Understanding Dependency Injection and Inversion of Control in object-oriented programming.',
      source: '/docs/patterns/dependency-injection.pdf',
      vector: embeddingService.generateEmbedding('Dependency Injection and IoC'),
      concepts: JSON.stringify(['dependency injection', 'inversion of control']),
      concept_categories: JSON.stringify(['Design Pattern'])
    }),
    createIntegrationTestCatalogEntry({
      text: 'SOLID principles: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
      source: '/docs/principles/solid.pdf',
      vector: embeddingService.generateEmbedding('SOLID principles SRP OCP LSP ISP DIP'),
      concepts: JSON.stringify(['solid principles', 'srp', 'ocp', 'lsp', 'isp', 'dip']),
      concept_categories: JSON.stringify(['Software Design'])
    }),
    createIntegrationTestCatalogEntry({
      text: 'TypeScript language features, type system, and best practices for type-safe JavaScript development.',
      source: '/docs/languages/typescript.pdf',
      vector: embeddingService.generateEmbedding('TypeScript language features type system'),
      concepts: JSON.stringify(['typescript', 'static typing', 'type safety']),
      concept_categories: JSON.stringify(['Programming Language'])
    })
  ];
}

