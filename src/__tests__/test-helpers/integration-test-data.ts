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
import { hashToId } from '../../infrastructure/utils/hash.js';

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
  
  /** Legacy field for backward compatibility */
  concepts?: string; // JSON stringified array of concept names
  
  /** Concept references using integer IDs (native array) */
  concept_ids: number[];
  
  /** Category references using integer IDs (native array) */
  category_ids: number[];
  
  chunk_index: number;
  hash?: string; // Optional
  
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Integration test concept data (for LanceDB table)
 */
export interface IntegrationConceptData {
  id?: number; // Optional for LanceDB (auto-generated)
  concept: string;
  vector: number[];
  weight: number;
  
  /** Document references using catalog entry IDs (native array) */
  catalog_ids: number[];
  
  /** Related concept references using integer IDs (native array) */
  adjacent_ids: number[];
  
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Integration test catalog data (for LanceDB table)
 */
export interface IntegrationCatalogData {
  id?: number; // Optional for LanceDB (auto-generated)
  text: string;
  source: string;
  vector: number[];
  
  /** Legacy field for backward compatibility */
  concepts?: string; // JSON stringified array of concept names
  
  /** Category references using integer IDs (native array) */
  category_ids: number[];
  
  [key: string]: unknown; // Index signature for LanceDB compatibility
}

/**
 * Creates an integration test chunk with sensible defaults
 * 
 * @param overrides - Partial properties to override defaults
 * @returns Chunk data ready for LanceDB insertion
 */
export function createIntegrationTestChunk(overrides?: Partial<IntegrationChunkData>): IntegrationChunkData {
  // Use hash-based concept IDs that match the test concepts
  const defaultConceptIds = [
    hashToId('clean architecture'),
    hashToId('repository pattern'),
    hashToId('dependency injection')
  ];
  
  const defaults: IntegrationChunkData = {
    text: 'Clean architecture is a software design philosophy that emphasizes separation of concerns and dependency inversion.',
    source: '/docs/architecture/clean-architecture.pdf',
    vector: embeddingService.generateEmbedding('Clean architecture is a software design philosophy'),
    concept_ids: defaultConceptIds,
    category_ids: [111111, 222222],
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
  const conceptName = overrides?.concept || 'clean architecture';
  const defaults: IntegrationConceptData = {
    id: hashToId(conceptName), // Hash-based ID for reliable cache lookups
    concept: conceptName,
    vector: embeddingService.generateEmbedding(conceptName),
    weight: 0.85,
    catalog_ids: [12345678],
    adjacent_ids: [11111111, 22222222, 33333333]
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
  const source = overrides?.source || '/docs/architecture/clean-architecture.pdf';
  const defaults: IntegrationCatalogData = {
    id: hashToId(source), // Hash-based ID for reliable lookups
    text: 'Comprehensive guide to Clean Architecture principles and implementation patterns.',
    source,
    vector: embeddingService.generateEmbedding('Clean Architecture principles'),
    category_ids: [111111]
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
      concept_ids: [hashToId('repository pattern'), hashToId('clean architecture')],
      category_ids: [333333]
    }),
    createIntegrationTestChunk({
      text: 'Dependency injection is a technique for achieving Inversion of Control between classes and their dependencies.',
      source: '/docs/patterns/dependency-injection.pdf',
      vector: embeddingService.generateEmbedding('Dependency injection is a technique'),
      concept_ids: [hashToId('dependency injection'), hashToId('solid principles')],
      category_ids: [333333, 444444]
    }),
    createIntegrationTestChunk({
      text: 'SOLID principles are five design principles intended to make software designs more understandable, flexible and maintainable.',
      source: '/docs/principles/solid.pdf',
      vector: embeddingService.generateEmbedding('SOLID principles are five design principles'),
      concept_ids: [hashToId('solid principles'), hashToId('clean architecture')],
      category_ids: [555555, 666666]
    }),
    createIntegrationTestChunk({
      text: 'TypeScript provides static type checking for JavaScript, catching errors at compile time rather than runtime.',
      source: '/docs/languages/typescript.pdf',
      vector: embeddingService.generateEmbedding('TypeScript provides static type checking'),
      concept_ids: [hashToId('typescript'), hashToId('dependency injection')],
      category_ids: [777777, 888888]
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
      weight: 0.78,
      catalog_ids: [23456789],
      adjacent_ids: [44444444, 55555555, 66666666]
    }),
    createIntegrationTestConcept({
      concept: 'dependency injection',
      vector: embeddingService.generateEmbedding('dependency injection'),
      weight: 0.82,
      catalog_ids: [34567890],
      adjacent_ids: [77777777, 88888888, 99999999]
    }),
    createIntegrationTestConcept({
      concept: 'solid principles',
      vector: embeddingService.generateEmbedding('solid principles'),
      weight: 0.90,
      catalog_ids: [45678901],
      adjacent_ids: [10101010, 20202020, 30303030]
    }),
    createIntegrationTestConcept({
      concept: 'typescript',
      vector: embeddingService.generateEmbedding('typescript'),
      weight: 0.75,
      catalog_ids: [56789012],
      adjacent_ids: [40404040, 50505050, 60606060]
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
      category_ids: [333333]
    }),
    createIntegrationTestCatalogEntry({
      text: 'Understanding Dependency Injection and Inversion of Control in object-oriented programming.',
      source: '/docs/patterns/dependency-injection.pdf',
      vector: embeddingService.generateEmbedding('Dependency Injection and IoC'),
      category_ids: [333333]
    }),
    createIntegrationTestCatalogEntry({
      text: 'SOLID principles: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
      source: '/docs/principles/solid.pdf',
      vector: embeddingService.generateEmbedding('SOLID principles SRP OCP LSP ISP DIP'),
      category_ids: [555555]
    }),
    createIntegrationTestCatalogEntry({
      text: 'TypeScript language features, type system, and best practices for type-safe JavaScript development.',
      source: '/docs/languages/typescript.pdf',
      vector: embeddingService.generateEmbedding('TypeScript language features type system'),
      category_ids: [777777]
    })
  ];
}

