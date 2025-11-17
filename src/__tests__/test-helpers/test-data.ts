/**
 * Test Data Builders
 * 
 * Helper functions to create test data following the Test Data Builder pattern.
 * 
 * These builders provide sensible defaults while allowing easy customization
 * through partial overrides.
 * 
 * See REFERENCES.md for pattern sources and further reading.
 */

import { Chunk, Concept, SearchResult } from '../../domain/models/index.js';

/**
 * Creates a test chunk with sensible defaults
 * 
 * @param overrides - Partial chunk properties to override defaults
 * @returns Complete Chunk object for testing
 */
export function createTestChunk(overrides?: Partial<Chunk>): Chunk {
  return {
    id: 'test-chunk-1',
    text: 'This is a test chunk about innovation and creativity in software development.',
    source: '/test/documents/test-document.pdf',
    hash: 'abc123def456',
    concepts: ['innovation', 'creativity', 'software development'],
    conceptCategories: ['business', 'technology', 'design'],
    conceptDensity: 0.75,
    ...overrides
  };
}

/**
 * Creates a test concept with sensible defaults
 * 
 * @param overrides - Partial concept properties to override defaults
 * @returns Complete Concept object for testing
 */
export function createTestConcept(overrides?: Partial<Concept>): Concept {
  return {
    concept: 'innovation',
    conceptType: 'thematic',
    category: 'business',
    sources: ['/test/documents/test-document.pdf'],
    relatedConcepts: ['creativity', 'disruption', 'change'],
    synonyms: ['novelty', 'originality'],
    broaderTerms: ['change', 'transformation'],
    narrowerTerms: ['breakthrough', 'invention'],
    embeddings: createTestEmbedding(),
    weight: 1.0,
    chunkCount: 15,
    enrichmentSource: 'corpus',
    ...overrides
  };
}

/**
 * Creates a test search result with sensible defaults
 * 
 * @param overrides - Partial search result properties to override defaults
 * @returns Complete SearchResult object for testing
 */
export function createTestSearchResult(overrides?: Partial<SearchResult>): SearchResult {
  const chunk = createTestChunk();
  return {
    ...chunk,
    distance: 0.25,
    vectorScore: 0.75,
    bm25Score: 0.8,
    titleScore: 0.5,
    conceptScore: 0.9,
    wordnetScore: 0.6,
    hybridScore: 0.77,
    ...overrides
  };
}

/**
 * Creates a test embedding vector
 * 
 * @param dimension - Embedding dimension (default 384)
 * @param value - Value to fill (default 0.5)
 * @returns Embedding vector for testing
 */
export function createTestEmbedding(dimension: number = 384, value: number = 0.5): number[] {
  return new Array(dimension).fill(value);
}

/**
 * Creates an array of test chunks with incremented IDs
 * 
 * @param count - Number of chunks to create
 * @param overrides - Optional overrides applied to all chunks
 * @returns Array of test chunks
 */
export function createTestChunks(count: number, overrides?: Partial<Chunk>): Chunk[] {
  return Array.from({ length: count }, (_, i) => 
    createTestChunk({
      id: `test-chunk-${i + 1}`,
      text: `Test chunk ${i + 1} with some unique content about concept ${i}.`,
      ...overrides
    })
  );
}

/**
 * Creates an array of test concepts with incremented names
 * 
 * @param count - Number of concepts to create
 * @param baseWord - Base word for concept names
 * @returns Array of test concepts
 */
export function createTestConcepts(count: number, baseWord: string = 'concept'): Concept[] {
  return Array.from({ length: count }, (_, i) =>
    createTestConcept({
      concept: `${baseWord}-${i + 1}`,
      weight: 1.0 - (i * 0.1)
    })
  );
}

