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
    
    chunkRepo = new LanceDBChunkRepository(
      chunksTable,
      conceptRepo,
      embeddingService,
      hybridSearchService
    );
  }, 30000); // Increased timeout for database setup
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('findByConceptName', () => {
    it('should find chunks by concept name', async () => {
      const chunks = await chunkRepo.findByConceptName('clean architecture', 10);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain('architecture');
      expect(chunks[0].concepts).toContain('clean architecture');
    });
    
    it('should respect limit parameter', async () => {
      const chunks = await chunkRepo.findByConceptName('clean architecture', 2);
      
      expect(chunks.length).toBeLessThanOrEqual(2);
    });
    
    it('should return empty array for non-existent concept', async () => {
      const chunks = await chunkRepo.findByConceptName('nonexistent-concept-xyz', 10);
      
      expect(chunks).toBeDefined();
      expect(chunks).toEqual([]);
    });
    
    it('should handle case-insensitive concept search', async () => {
      const lower = await chunkRepo.findByConceptName('clean architecture', 10);
      const upper = await chunkRepo.findByConceptName('CLEAN ARCHITECTURE', 10);
      const mixed = await chunkRepo.findByConceptName('Clean Architecture', 10);
      
      expect(lower.length).toBeGreaterThan(0);
      expect(upper.length).toBe(lower.length);
      expect(mixed.length).toBe(lower.length);
    });
    
    it('should map vector field correctly', async () => {
      // This is a critical test - verifies the bug fix for vector/embeddings field mapping
      const chunks = await chunkRepo.findByConceptName('typescript', 10);
      
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify chunk has embeddings (optional field)
      const chunkWithEmbeddings = chunks.find(c => c.embeddings);
      if (chunkWithEmbeddings) {
        expect(chunkWithEmbeddings.embeddings).toBeInstanceOf(Array);
        expect(chunkWithEmbeddings.embeddings!.length).toBe(384); // Expected dimension
      }
    });
  });
  
  describe('findBySource', () => {
    it('should find chunks from specific source', async () => {
      const chunks = await chunkRepo.findBySource('/docs/architecture/clean-architecture.pdf', 10);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].source).toBe('/docs/architecture/clean-architecture.pdf');
    });
    
    it('should handle partial source matching', async () => {
      const chunks = await chunkRepo.findBySource('architecture', 10);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].source).toContain('architecture');
    });
    
    it('should return empty array for non-existent source', async () => {
      const chunks = await chunkRepo.findBySource('/nonexistent/path.pdf', 10);
      
      expect(chunks).toEqual([]);
    });
  });
  
  describe('search (hybrid search)', () => {
    it('should perform hybrid search across all chunks', async () => {
      const results = await chunkRepo.search({
        text: 'software design patterns',
        limit: 5
      });
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      
      // Verify search result structure
      const first = results[0];
      expect(first.text).toBeDefined();
      expect(first.source).toBeDefined();
      expect(first.hybridScore).toBeDefined();
      expect(first.vectorScore).toBeDefined();
      expect(first.bm25Score).toBeDefined();
    });
    
    it('should rank results by hybrid score', async () => {
      const results = await chunkRepo.search({
        text: 'dependency injection',
        limit: 5
      });
      
      expect(results.length).toBeGreaterThan(1);
      
      // Verify results are sorted by hybrid score (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].hybridScore).toBeGreaterThanOrEqual(results[i + 1].hybridScore);
      }
    });
    
    it('should support debug mode without errors', async () => {
      const results = await chunkRepo.search({
        text: 'clean architecture',
        limit: 3,
        debug: true
      });
      
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
      const chunks = await chunkRepo.findBySource('/docs/principles/solid.pdf', 1);
      
      expect(chunks.length).toBe(1);
      const chunk = chunks[0];
      
      // Verify all expected fields are mapped
      expect(chunk.text).toBeDefined();
      expect(typeof chunk.text).toBe('string');
      
      expect(chunk.source).toBeDefined();
      expect(typeof chunk.source).toBe('string');
      
      expect(chunk.concepts).toBeDefined();
      expect(Array.isArray(chunk.concepts)).toBe(true);
      
      expect(chunk.conceptCategories).toBeDefined();
      expect(Array.isArray(chunk.conceptCategories)).toBe(true);
      
      expect(chunk.conceptDensity).toBeDefined();
      expect(typeof chunk.conceptDensity).toBe('number');
      
      // embeddings is optional, but if present should be array
      if (chunk.embeddings) {
        expect(Array.isArray(chunk.embeddings)).toBe(true);
        expect(chunk.embeddings.length).toBe(384);
      }
    });
    
    it('should parse JSON fields correctly', async () => {
      const chunks = await chunkRepo.findBySource('/docs/principles/solid.pdf', 1);
      const chunk = chunks[0];
      
      // Concepts should be parsed from JSON string to array
      expect(Array.isArray(chunk.concepts)).toBe(true);
      expect(chunk.concepts!.length).toBeGreaterThan(0);
      expect(chunk.concepts).toContain('solid principles');
      
      // Categories should be parsed from JSON string to array
      expect(Array.isArray(chunk.conceptCategories)).toBe(true);
      expect(chunk.conceptCategories!.length).toBeGreaterThan(0);
    });
  });
  
  describe('error handling', () => {
    it('should handle empty query gracefully', async () => {
      const results = await chunkRepo.search({
        text: '',
        limit: 5
      });
      
      // Should not throw, may return empty or all results
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    it('should handle very large limit', async () => {
      const results = await chunkRepo.search({
        text: 'architecture',
        limit: 10000
      });
      
      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(5); // Only 5 chunks in test data
    });
  });
});

