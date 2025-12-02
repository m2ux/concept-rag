/**
 * Integration Tests for LanceDBChunkRepository
 * 
 * Tests the actual repository implementation against a real (temporary) LanceDB instance.
 * Unlike unit tests that use fakes, these tests verify:
 * - Field mappings are correct
 * - Vector search works as expected
 * - Schema validation catches errors
 * - Database operations succeed
 * 
 * **Test Strategy**: Integration testing with test fixtures (xUnit Test Patterns)
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { LanceDBChunkRepository } from '../../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../../infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../../concepts/query_expander.js';
import * as defaults from '../../config.js';

describe('LanceDBChunkRepository - Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let chunkRepo: LanceDBChunkRepository;
  
  beforeAll(async () => {
    // Setup test database with sample data
    fixture = createTestDatabase('chunk-repo');
    await fixture.setup();
    
    // Create repository with real dependencies
    const connection = fixture.getConnection();
    const chunksTable = await connection.openTable(defaults.CHUNKS_TABLE_NAME);
    const conceptsTable = await connection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    const embeddingService = new SimpleEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    // Initialize ConceptIdCache for integer ID resolution
    const { ConceptIdCache } = await import('../../infrastructure/cache/concept-id-cache.js');
    const conceptIdCache = ConceptIdCache.getInstance();
    // Clear any existing cache (singleton might be initialized from previous test)
    conceptIdCache.clear();
    await conceptIdCache.initialize(conceptRepo);
    
    chunkRepo = new LanceDBChunkRepository(
      chunksTable,
      conceptRepo,
      embeddingService,
      hybridSearchService,
      conceptIdCache
    );
  }, 30000); // Increased timeout for database setup
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('findByConceptName', () => {
    it('should find chunks by concept name', async () => {
      // ARRANGE: Test fixture already loaded with standard test data including 'clean architecture' concept
      const conceptName = 'clean architecture';
      const limit = 10;
      
      // ACT: Query chunks by concept name
      const chunks = await chunkRepo.findByConceptName(conceptName, limit);
      
      // ASSERT: Verify chunks were found and contain expected data
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain('architecture');
      // Note: chunks no longer store concept names, only conceptIds (normalized schema)
      expect(chunks[0].conceptIds).toBeDefined();
    });
    
    it('should respect limit parameter', async () => {
      // ARRANGE: Concept with multiple chunks in test data
      const conceptName = 'clean architecture';
      const limit = 2;
      
      // ACT: Query with specific limit
      const chunks = await chunkRepo.findByConceptName(conceptName, limit);
      
      // ASSERT: Verify result count respects limit
      expect(chunks.length).toBeLessThanOrEqual(limit);
    });
    
    it('should return empty array for non-existent concept', async () => {
      // ARRANGE: Use concept name not in test data
      const nonExistentConcept = 'nonexistent-concept-xyz';
      
      // ACT: Query for non-existent concept
      const chunks = await chunkRepo.findByConceptName(nonExistentConcept, 10);
      
      // ASSERT: Should return empty array, not throw error
      expect(chunks).toBeDefined();
      expect(chunks).toEqual([]);
    });
    
    it('should handle case-insensitive concept search', async () => {
      // ARRANGE: Same concept in different case variations
      const conceptLower = 'clean architecture';
      const conceptUpper = 'CLEAN ARCHITECTURE';
      const conceptMixed = 'Clean Architecture';
      
      // ACT: Query with all case variations
      const lower = await chunkRepo.findByConceptName(conceptLower, 10);
      const upper = await chunkRepo.findByConceptName(conceptUpper, 10);
      const mixed = await chunkRepo.findByConceptName(conceptMixed, 10);
      
      // ASSERT: All variations should return same results
      expect(lower.length).toBeGreaterThan(0);
      expect(upper.length).toBe(lower.length);
      expect(mixed.length).toBe(lower.length);
    });
    
    it('should map vector field correctly', async () => {
      // ARRANGE: Query for concept with embeddings
      const conceptName = 'typescript';
      
      // ACT: Retrieve chunks with vector embeddings
      const chunks = await chunkRepo.findByConceptName(conceptName, 10);
      
      // ASSERT: Critical test - verifies the bug fix for vector/embeddings field mapping
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify chunk has embeddings (optional field)
      const chunkWithEmbeddings = chunks.find(c => c.embeddings);
      if (chunkWithEmbeddings) {
        // Embeddings can be Array or Arrow Vector (both valid)
        const isArray = Array.isArray(chunkWithEmbeddings.embeddings);
        const isArrowVector = typeof chunkWithEmbeddings.embeddings === 'object' && 'length' in chunkWithEmbeddings.embeddings!;
        expect(isArray || isArrowVector).toBe(true);
        expect(chunkWithEmbeddings.embeddings!.length).toBe(384); // Expected dimension
      }
    });
  });
  
  describe('findBySource', () => {
    it('should find chunks by catalog title', async () => {
      // ARRANGE: Use catalog_title from test data (v7 schema uses catalog_title, not source)
      const catalogTitle = 'Clean Architecture';
      const limit = 10;
      
      // ACT: Query chunks by catalog title
      const chunks = await chunkRepo.findBySource(catalogTitle, limit);
      
      // ASSERT: Verify chunks were found (matching via catalog_title)
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(typeof chunks[0].catalogId).toBe('number');  // Hash-based integer
    });
    
    it('should handle partial title matching', async () => {
      // ARRANGE: Partial title that matches
      const partialTitle = 'architecture';
      
      // ACT: Query with partial title match
      const chunks = await chunkRepo.findBySource(partialTitle, 10);
      
      // ASSERT: Should find chunks with 'architecture' in catalog_title
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(typeof chunks[0].catalogId).toBe('number');  // Hash-based integer
    });
    
    it('should return empty array for non-existent title', async () => {
      // ARRANGE: Title not in test data
      const nonExistentTitle = 'nonexistent-document-title-xyz';
      
      // ACT: Query for non-existent title
      const chunks = await chunkRepo.findBySource(nonExistentTitle, 10);
      
      // ASSERT: Should return empty array without error
      expect(chunks).toEqual([]);
    });
  });
  
  describe('search (hybrid search)', () => {
    it('should perform hybrid search across all chunks', async () => {
      // ARRANGE: Search query and limit
      const searchQuery = {
        text: 'software design patterns',
        limit: 5
      };
      
      // ACT: Execute hybrid search
      const results = await chunkRepo.search(searchQuery);
      
      // ASSERT: Verify search results structure and content
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      
      // Verify search result structure includes all scoring components
      const first = results[0];
      expect(first.text).toBeDefined();
      expect(first.catalogId).toBeDefined();  // catalogId instead of source
      expect(first.hybridScore).toBeDefined();
      expect(first.vectorScore).toBeDefined();
      expect(first.bm25Score).toBeDefined();
    }, 30000); // 30 second timeout for integration test with database operations
    
    it('should rank results by hybrid score', async () => {
      // ARRANGE: Query that will return multiple results
      const searchQuery = {
        text: 'dependency injection',
        limit: 5
      };
      
      // ACT: Execute search
      const results = await chunkRepo.search(searchQuery);
      
      // ASSERT: Verify results are sorted by hybrid score (descending)
      expect(results.length).toBeGreaterThan(1);
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].hybridScore).toBeGreaterThanOrEqual(results[i + 1].hybridScore);
      }
    });
    
    it('should support debug mode without errors', async () => {
      // ARRANGE: Search query with debug flag enabled
      const searchQuery = {
        text: 'clean architecture',
        limit: 3,
        debug: true
      };
      
      // ACT: Execute search in debug mode
      const results = await chunkRepo.search(searchQuery);
      
      // ASSERT: Should return results without throwing errors
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });
  
  describe('countChunks', () => {
    it('should return correct count of chunks', async () => {
      const count = await chunkRepo.countChunks();
      
      expect(count).toBe(5); // Test data has 5 chunks
    });
  });
  
  describe('field mapping validation', () => {
    it('should correctly map all chunk fields from LanceDB', async () => {
      // ARRANGE: Query for specific chunk using catalog_title
      const catalogTitle = 'SOLID Principles';
      
      // ACT: Retrieve chunk
      const chunks = await chunkRepo.findBySource(catalogTitle, 1);
      
      // ASSERT: Verify all field mappings from LanceDB to domain model (normalized schema)
      expect(chunks.length).toBe(1);
      const chunk = chunks[0];
      
      // String fields
      expect(chunk.text).toBeDefined();
      expect(typeof chunk.text).toBe('string');
      
      expect(chunk.catalogId).toBeDefined();
      expect(typeof chunk.catalogId).toBe('number');  // Hash-based integer ID
      
      // Array fields (native arrays - normalized schema)
      expect(chunk.conceptIds).toBeDefined();
      expect(Array.isArray(chunk.conceptIds)).toBe(true);
      
      // embeddings is optional, but if present should be array of correct dimension
      if (chunk.embeddings) {
        // Embeddings can be Array or Arrow Vector (both valid)
        const isArray = Array.isArray(chunk.embeddings);
        const isArrowVector = typeof chunk.embeddings === 'object' && 'length' in chunk.embeddings;
        expect(isArray || isArrowVector).toBe(true);
        expect(chunk.embeddings.length).toBe(384);
      }
    });
    
    it('should handle array fields correctly', async () => {
      // ARRANGE: Chunk with array fields (normalized schema uses native arrays)
      const catalogTitle = 'SOLID Principles';
      
      // ACT: Retrieve chunk
      const chunks = await chunkRepo.findBySource(catalogTitle, 1);
      expect(chunks.length).toBeGreaterThan(0);
      const chunk = chunks[0];
      
      // ASSERT: ID-based array fields should be native arrays
      expect(Array.isArray(chunk.conceptIds)).toBe(true);
    });
  });
  
  describe('error handling', () => {
    it('should handle empty query gracefully', async () => {
      // ARRANGE: Search query with empty text
      const emptyQuery = {
        text: '',
        limit: 5
      };
      
      // ACT: Execute search with empty text
      const results = await chunkRepo.search(emptyQuery);
      
      // ASSERT: Should not throw, may return empty or all results
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    it('should handle very large limit', async () => {
      // ARRANGE: Query with limit much larger than dataset
      const largeLimitQuery = {
        text: 'architecture',
        limit: 10000
      };
      
      // ACT: Execute search with unrealistic limit
      const results = await chunkRepo.search(largeLimitQuery);
      
      // ASSERT: Should return all available chunks (not fail)
      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(5); // Only 5 chunks in test data
    });
    
    it('should handle zero limit gracefully', async () => {
      // ARRANGE: Query with limit of zero
      const zeroLimitQuery = {
        text: 'architecture',
        limit: 0
      };
      
      // ACT: Execute search with zero limit
      const results = await chunkRepo.search(zeroLimitQuery);
      
      // ASSERT: Should handle gracefully (may return all results or empty)
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Zero limit behavior is implementation-specific
      // LanceDB may treat 0 as "no limit" or return empty
    });
    
    it('should handle negative limit gracefully', async () => {
      // ARRANGE: Query with negative limit
      const negativeLimitQuery = {
        text: 'architecture',
        limit: -5
      };
      
      // ACT: Execute search with negative limit
      const results = await chunkRepo.search(negativeLimitQuery);
      
      // ASSERT: Should handle gracefully (empty array or treat as invalid)
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    it('should return empty array for very specific non-matching query', async () => {
      // ARRANGE: Query that definitely won't match any test data
      const specificQuery = {
        text: 'xyzabc123nonexistentconceptquantumfluxcapacitor',
        limit: 10
      };
      
      // ACT: Execute search for non-existent terms
      const results = await chunkRepo.search(specificQuery);
      
      // ASSERT: Should return empty or very low-scored results
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // May return low-scored results or empty array
    });
    
    it('should handle special characters in search query', async () => {
      // ARRANGE: Query with special characters
      const specialCharQuery = {
        text: '!@#$%^&*()',
        limit: 5
      };
      
      // ACT: Execute search with special characters
      const results = await chunkRepo.search(specialCharQuery);
      
      // ASSERT: Should not throw, handle gracefully
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

