/**
 * Integration Test Data Builders
 * 
 * Helper functions to create test data for integration tests with real LanceDB tables.
 * Uses the Test Data Builder pattern to provide sensible defaults with easy customization.
 * 
 * These builders create data in the format expected by LanceDB (v7 schema),
 * including derived text fields (concept_names, catalog_title, category_names).
 */

import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { hashToId } from '../../infrastructure/utils/hash.js';

// Singleton embedding service for test data generation
const embeddingService = new SimpleEmbeddingService();

// Standard concept names and their hash IDs for consistency
export const TEST_CONCEPTS = {
  'clean architecture': hashToId('clean architecture'),
  'repository pattern': hashToId('repository pattern'),
  'dependency injection': hashToId('dependency injection'),
  'solid principles': hashToId('solid principles'),
  'typescript': hashToId('typescript'),
  'software design': hashToId('software design'),
};

// Standard category names and their hash IDs
export const TEST_CATEGORIES = {
  'software architecture': hashToId('software architecture'),
  'design patterns': hashToId('design patterns'),
  'programming languages': hashToId('programming languages'),
  'software engineering': hashToId('software engineering'),
};

// Standard catalog entry IDs (hash of source paths)
export const TEST_CATALOG_IDS = {
  'clean-architecture': hashToId('/docs/architecture/clean-architecture.pdf'),
  'repository-pattern': hashToId('/docs/patterns/repository-pattern.pdf'),
  'dependency-injection': hashToId('/docs/patterns/dependency-injection.pdf'),
  'solid': hashToId('/docs/principles/solid.pdf'),
  'typescript': hashToId('/docs/languages/typescript.pdf'),
};

/**
 * Integration test chunk data (for LanceDB table) - v7 schema
 */
export interface IntegrationChunkData {
  id: number;
  text: string;
  catalog_id: number;
  catalog_title: string;  // DERIVED: for display
  hash: string;
  vector: number[];
  concept_ids: number[];
  concept_names: string[];  // DERIVED: for display and text search
  concept_density?: number;
  page_number?: number;
  [key: string]: unknown;
}

/**
 * Integration test concept data (for LanceDB table)
 */
export interface IntegrationConceptData {
  id: number;
  name: string;
  summary: string;
  vector: number[];
  weight: number;
  catalog_ids: number[];
  catalog_titles: string[];  // DERIVED: for display
  chunk_ids: number[];
  adjacent_ids: number[];
  related_ids: number[];
  synonyms: string[];
  broader_terms: string[];
  narrower_terms: string[];
  [key: string]: unknown;
}

/**
 * Integration test catalog data (for LanceDB table) - v7 schema
 */
export interface IntegrationCatalogData {
  id: number;
  source: string;
  title: string;
  summary: string;
  hash: string;
  vector: number[];
  concept_ids: number[];
  concept_names: string[];  // DERIVED: for display and text search
  category_ids: number[];
  category_names: string[];  // DERIVED: for display and text search
  origin_hash: string;
  author: string;
  year: number;
  publisher: string;
  isbn: string;
  [key: string]: unknown;
}

/**
 * Integration test category data (for LanceDB table)
 */
export interface IntegrationCategoryData {
  id: number;
  category: string;
  description: string;
  summary: string;
  parent_category_id: number | null;
  aliases: string[];
  related_categories: number[];
  document_count: number;
  chunk_count: number;
  concept_count: number;
  vector: number[];
  [key: string]: unknown;
}

/**
 * Creates an integration test chunk with sensible defaults (v7 schema)
 */
export function createIntegrationTestChunk(overrides?: Partial<IntegrationChunkData>): IntegrationChunkData {
  const catalogId = overrides?.catalog_id || TEST_CATALOG_IDS['clean-architecture'];
  const conceptNames = overrides?.concept_names || ['clean architecture', 'repository pattern', 'dependency injection'];
  
  const defaults: IntegrationChunkData = {
    id: hashToId(`chunk-${catalogId}-0`),
    text: 'Clean architecture is a software design philosophy that emphasizes separation of concerns and dependency inversion.',
    catalog_id: catalogId,
    catalog_title: 'Clean Architecture',  // DERIVED
    hash: 'chunk-hash-001',
    vector: embeddingService.generateEmbedding('Clean architecture is a software design philosophy'),
    concept_ids: conceptNames.map(name => TEST_CONCEPTS[name as keyof typeof TEST_CONCEPTS] || hashToId(name)),
    concept_names: conceptNames,  // DERIVED
    concept_density: 0.15,
    page_number: 1
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates an integration test concept with sensible defaults
 * Note: Arrays must have at least one element for LanceDB type inference
 */
export function createIntegrationTestConcept(overrides?: Partial<IntegrationConceptData>): IntegrationConceptData {
  const conceptName = overrides?.name || 'clean architecture';
  const defaults: IntegrationConceptData = {
    id: hashToId(conceptName),
    name: conceptName,
    summary: `Concept summary for ${conceptName}`,
    vector: embeddingService.generateEmbedding(conceptName),
    weight: 0.85,
    catalog_ids: [TEST_CATALOG_IDS['clean-architecture']],
    catalog_titles: ['Clean Architecture'],  // DERIVED
    // Arrays must have at least one element for LanceDB type inference
    chunk_ids: [0],  // Placeholder - will be filtered
    adjacent_ids: [0],  // Placeholder - will be filtered
    related_ids: [0],  // Placeholder - will be filtered
    synonyms: [''],  // Placeholder - will be filtered
    broader_terms: [''],  // Placeholder - will be filtered
    narrower_terms: ['']  // Placeholder - will be filtered
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates an integration test catalog entry with sensible defaults (v7 schema)
 */
export function createIntegrationTestCatalogEntry(overrides?: Partial<IntegrationCatalogData>): IntegrationCatalogData {
  const source = overrides?.source || '/docs/architecture/clean-architecture.pdf';
  const conceptNames = overrides?.concept_names || ['clean architecture', 'software design'];
  const categoryNames = overrides?.category_names || ['software architecture'];
  
  const defaults: IntegrationCatalogData = {
    id: hashToId(source),
    source,
    title: 'Clean Architecture',
    summary: 'Comprehensive guide to Clean Architecture principles and implementation patterns.',
    hash: 'catalog-hash-001',
    vector: embeddingService.generateEmbedding('Clean Architecture principles'),
    concept_ids: conceptNames.map(name => TEST_CONCEPTS[name as keyof typeof TEST_CONCEPTS] || hashToId(name)),
    concept_names: conceptNames,  // DERIVED
    category_ids: categoryNames.map(name => TEST_CATEGORIES[name as keyof typeof TEST_CATEGORIES] || hashToId(name)),
    category_names: categoryNames,  // DERIVED
    origin_hash: '',
    author: 'Robert C. Martin',
    year: 2017,
    publisher: 'Pearson',
    isbn: '9780134494166'
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates an integration test category with sensible defaults
 * Note: Arrays must have at least one element for LanceDB type inference
 */
export function createIntegrationTestCategory(overrides?: Partial<IntegrationCategoryData>): IntegrationCategoryData {
  const categoryName = overrides?.category || 'software architecture';
  const defaults: IntegrationCategoryData = {
    id: hashToId(categoryName),
    category: categoryName,
    description: `Concepts and practices related to ${categoryName}`,
    summary: `Category for ${categoryName} topics`,
    parent_category_id: null,
    // Arrays must have at least one element for LanceDB type inference
    aliases: [''],  // Placeholder - will be filtered
    related_categories: [0],  // Placeholder - will be filtered
    document_count: 5,
    chunk_count: 25,
    concept_count: 10,
    vector: embeddingService.generateEmbedding(categoryName)
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates a set of standard test chunks for integration testing (v7 schema)
 */
export function createStandardTestChunks(): IntegrationChunkData[] {
  return [
    createIntegrationTestChunk({
      id: hashToId('chunk-clean-arch-1'),
      catalog_id: TEST_CATALOG_IDS['clean-architecture'],
      catalog_title: 'Clean Architecture',
      concept_names: ['clean architecture', 'repository pattern', 'dependency injection'],
    }),
    createIntegrationTestChunk({
      id: hashToId('chunk-repo-pattern-1'),
      text: 'Repository pattern provides an abstraction layer between the domain and data mapping layers.',
      catalog_id: TEST_CATALOG_IDS['repository-pattern'],
      catalog_title: 'Repository Pattern',
      hash: 'chunk-hash-002',
      vector: embeddingService.generateEmbedding('Repository pattern provides an abstraction layer'),
      concept_names: ['repository pattern', 'clean architecture'],
      page_number: 1
    }),
    createIntegrationTestChunk({
      id: hashToId('chunk-di-1'),
      text: 'Dependency injection is a technique for achieving Inversion of Control between classes and their dependencies.',
      catalog_id: TEST_CATALOG_IDS['dependency-injection'],
      catalog_title: 'Dependency Injection',
      hash: 'chunk-hash-003',
      vector: embeddingService.generateEmbedding('Dependency injection is a technique'),
      concept_names: ['dependency injection', 'solid principles'],
      page_number: 1
    }),
    createIntegrationTestChunk({
      id: hashToId('chunk-solid-1'),
      text: 'SOLID principles are five design principles intended to make software designs more understandable, flexible and maintainable.',
      catalog_id: TEST_CATALOG_IDS['solid'],
      catalog_title: 'SOLID Principles',
      hash: 'chunk-hash-004',
      vector: embeddingService.generateEmbedding('SOLID principles are five design principles'),
      concept_names: ['solid principles', 'clean architecture'],
      page_number: 1
    }),
    createIntegrationTestChunk({
      id: hashToId('chunk-ts-1'),
      text: 'TypeScript provides static type checking for JavaScript, catching errors at compile time rather than runtime.',
      catalog_id: TEST_CATALOG_IDS['typescript'],
      catalog_title: 'TypeScript',
      hash: 'chunk-hash-005',
      vector: embeddingService.generateEmbedding('TypeScript provides static type checking'),
      concept_names: ['typescript', 'dependency injection'],
      page_number: 1
    })
  ];
}

/**
 * Creates a set of standard test concepts for integration testing
 */
export function createStandardTestConcepts(): IntegrationConceptData[] {
  return [
    createIntegrationTestConcept({
      name: 'clean architecture',
      catalog_ids: [TEST_CATALOG_IDS['clean-architecture'], TEST_CATALOG_IDS['solid']],
      catalog_titles: ['Clean Architecture', 'SOLID Principles'],
      adjacent_ids: [TEST_CONCEPTS['repository pattern'], TEST_CONCEPTS['dependency injection']],
      related_ids: [TEST_CONCEPTS['solid principles']]
    }),
    createIntegrationTestConcept({
      name: 'repository pattern',
      vector: embeddingService.generateEmbedding('repository pattern'),
      weight: 0.78,
      catalog_ids: [TEST_CATALOG_IDS['repository-pattern']],
      catalog_titles: ['Repository Pattern'],
      adjacent_ids: [TEST_CONCEPTS['clean architecture']],
      related_ids: [TEST_CONCEPTS['dependency injection']]
    }),
    createIntegrationTestConcept({
      name: 'dependency injection',
      vector: embeddingService.generateEmbedding('dependency injection'),
      weight: 0.82,
      catalog_ids: [TEST_CATALOG_IDS['dependency-injection']],
      catalog_titles: ['Dependency Injection'],
      adjacent_ids: [TEST_CONCEPTS['solid principles']],
      related_ids: [TEST_CONCEPTS['clean architecture']]
    }),
    createIntegrationTestConcept({
      name: 'solid principles',
      vector: embeddingService.generateEmbedding('solid principles'),
      weight: 0.90,
      catalog_ids: [TEST_CATALOG_IDS['solid']],
      catalog_titles: ['SOLID Principles'],
      adjacent_ids: [TEST_CONCEPTS['clean architecture'], TEST_CONCEPTS['dependency injection']],
      related_ids: []
    }),
    createIntegrationTestConcept({
      name: 'typescript',
      vector: embeddingService.generateEmbedding('typescript'),
      weight: 0.75,
      catalog_ids: [TEST_CATALOG_IDS['typescript']],
      catalog_titles: ['TypeScript'],
      adjacent_ids: [TEST_CONCEPTS['dependency injection']],
      related_ids: []
    })
  ];
}

/**
 * Creates a set of standard test catalog entries for integration testing (v7 schema)
 */
export function createStandardTestCatalogEntries(): IntegrationCatalogData[] {
  return [
    createIntegrationTestCatalogEntry({
      id: TEST_CATALOG_IDS['clean-architecture'],
      source: '/docs/architecture/clean-architecture.pdf',
      title: 'Clean Architecture',
      summary: 'Comprehensive guide to Clean Architecture principles and implementation patterns.',
      concept_names: ['clean architecture', 'software design'],
      category_names: ['software architecture']
    }),
    createIntegrationTestCatalogEntry({
      id: TEST_CATALOG_IDS['repository-pattern'],
      source: '/docs/patterns/repository-pattern.pdf',
      title: 'Repository Pattern',
      summary: 'Design patterns for modern software development including Repository and Factory patterns.',
      hash: 'catalog-hash-002',
      vector: embeddingService.generateEmbedding('Design patterns for modern software'),
      concept_names: ['repository pattern', 'clean architecture'],
      category_names: ['design patterns']
    }),
    createIntegrationTestCatalogEntry({
      id: TEST_CATALOG_IDS['dependency-injection'],
      source: '/docs/patterns/dependency-injection.pdf',
      title: 'Dependency Injection',
      summary: 'Understanding Dependency Injection and Inversion of Control in object-oriented programming.',
      hash: 'catalog-hash-003',
      vector: embeddingService.generateEmbedding('Dependency Injection and IoC'),
      concept_names: ['dependency injection', 'solid principles'],
      category_names: ['design patterns']
    }),
    createIntegrationTestCatalogEntry({
      id: TEST_CATALOG_IDS['solid'],
      source: '/docs/principles/solid.pdf',
      title: 'SOLID Principles',
      summary: 'SOLID principles: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
      hash: 'catalog-hash-004',
      vector: embeddingService.generateEmbedding('SOLID principles SRP OCP LSP ISP DIP'),
      concept_names: ['solid principles', 'clean architecture'],
      category_names: ['software engineering']
    }),
    createIntegrationTestCatalogEntry({
      id: TEST_CATALOG_IDS['typescript'],
      source: '/docs/languages/typescript.pdf',
      title: 'TypeScript',
      summary: 'TypeScript language features, type system, and best practices for type-safe JavaScript development.',
      hash: 'catalog-hash-005',
      vector: embeddingService.generateEmbedding('TypeScript language features type system'),
      concept_names: ['typescript'],
      category_names: ['programming languages']
    })
  ];
}

/**
 * Creates a set of standard test categories for integration testing
 * Note: At least one category must have a non-null parent_category_id for LanceDB type inference
 */
export function createStandardTestCategories(): IntegrationCategoryData[] {
  return [
    createIntegrationTestCategory({
      id: TEST_CATEGORIES['software engineering'],
      category: 'software engineering',
      description: 'Root category for software engineering topics',
      parent_category_id: null,  // Root category
      document_count: 1,
      chunk_count: 5,
      concept_count: 3
    }),
    createIntegrationTestCategory({
      id: TEST_CATEGORIES['software architecture'],
      category: 'software architecture',
      parent_category_id: TEST_CATEGORIES['software engineering'],  // Child of software engineering
      document_count: 2,
      chunk_count: 10,
      concept_count: 5
    }),
    createIntegrationTestCategory({
      id: TEST_CATEGORIES['design patterns'],
      category: 'design patterns',
      parent_category_id: TEST_CATEGORIES['software engineering'],  // Child of software engineering
      document_count: 2,
      chunk_count: 8,
      concept_count: 4
    }),
    createIntegrationTestCategory({
      id: TEST_CATEGORIES['programming languages'],
      category: 'programming languages',
      parent_category_id: null,  // Root category
      document_count: 1,
      chunk_count: 5,
      concept_count: 2
    })
  ];
}
