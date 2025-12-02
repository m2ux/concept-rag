/**
 * Integration Tests for LanceDBCatalogRepository
 * 
 * Tests the catalog repository implementation against a real (temporary) LanceDB instance.
 * The catalog table contains document-level summaries and metadata.
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { LanceDBCatalogRepository } from '../../infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../../infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../../concepts/query_expander.js';
import * as defaults from '../../config.js';
import { isSome, isNone } from '../../domain/functional/index.js';

describe('LanceDBCatalogRepository - Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let catalogRepo: LanceDBCatalogRepository;
  
  beforeAll(async () => {
    // Setup test database with sample data
    fixture = createTestDatabase('catalog-repo');
    await fixture.setup();
    
    // Create repository with dependencies
    const connection = fixture.getConnection();
    const catalogTable = await connection.openTable(defaults.CATALOG_TABLE_NAME);
    const conceptsTable = await connection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    const embeddingService = new SimpleEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    
    catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
  }, 30000);
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('search', () => {
    it('should perform hybrid search on catalog', async () => {
      const results = await catalogRepo.search({
        text: 'clean architecture',
        limit: 5
      });
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      
      // Verify search result structure
      const first = results[0];
      expect(first.text).toBeDefined();
      expect(typeof first.text).toBe('string');
      expect(first.source).toBeDefined();
      expect(typeof first.source).toBe('string');
      expect(typeof first.hybridScore).toBe('number');
      expect(typeof first.vectorScore).toBe('number');
      expect(typeof first.bm25Score).toBe('number');
      expect(typeof first.titleScore).toBe('number'); // Catalog should have title scoring
    });
    
    it('should rank by hybrid score', async () => {
      const results = await catalogRepo.search({
        text: 'design patterns',
        limit: 5
      });
      
      expect(results.length).toBeGreaterThan(1);
      
      // Results should be sorted by hybrid score descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].hybridScore).toBeGreaterThanOrEqual(results[i + 1].hybridScore);
      }
    });
    
    it('should benefit from title matching', async () => {
      // Search for something in a document title/source
      const results = await catalogRepo.search({
        text: 'solid principles',
        limit: 3
      });
      
      expect(results.length).toBeGreaterThan(0);
      
      // SOLID principles document should rank highly due to title matching
      const solidDoc = results.find(r => r.source && r.source.includes('solid'));
      expect(solidDoc).toBeDefined();
      if (solidDoc) {
        expect(solidDoc.titleScore).toBeGreaterThan(0);
      }
    });
    
    it('should support debug mode', async () => {
      const results = await catalogRepo.search({
        text: 'typescript',
        limit: 3,
        debug: true
      });
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });
  
  describe('findBySource', () => {
    it('should find document by exact source path', async () => {
      const resultOpt = await catalogRepo.findBySource('/docs/architecture/clean-architecture.pdf');
      
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        const result = resultOpt.value;
        // @ts-expect-error - Type narrowing limitation
        expect(result.source).toBe('/docs/architecture/clean-architecture.pdf');
        // @ts-expect-error - Type narrowing limitation
        expect(result.text).toContain('Clean Architecture');
      }
    });
    
    it('should use exact source path matching (case-sensitive)', async () => {
      // Note: Hash-based IDs are case-sensitive, so exact path is required
      const lowerOpt = await catalogRepo.findBySource('/docs/architecture/clean-architecture.pdf');
      const upperOpt = await catalogRepo.findBySource('/DOCS/ARCHITECTURE/CLEAN-ARCHITECTURE.PDF');
      
      // Exact path should be found
      expect(isSome(lowerOpt)).toBe(true);
      // Different case should not match (hash-based lookup is case-sensitive)
      expect(isNone(upperOpt)).toBe(true);
    });
    
    it('should return None for non-existent source', async () => {
      // ARRANGE: Query for source not in test data
      const nonExistentSource = '/nonexistent/document.pdf';
      
      // ACT: Query for non-existent source
      const resultOpt = await catalogRepo.findBySource(nonExistentSource);
      
      // ASSERT: Should return None for non-existent document
      expect(isNone(resultOpt)).toBe(true);
    });
    
    it('should use hybrid search for source lookup', async () => {
      // ARRANGE: Query for document by exact source path
      const sourcePath = '/docs/patterns/repository-pattern.pdf';
      
      // ACT: Use findBySource which leverages hybrid search
      const resultOpt = await catalogRepo.findBySource(sourcePath);
      
      // ASSERT: Should find the matching document
      expect(isSome(resultOpt)).toBe(true);
      if (isSome(resultOpt)) {
        const result = resultOpt.value;
        // @ts-expect-error - Type narrowing limitation
        expect(result.source).toContain('repository-pattern');
        
        // Verify hybrid search components are present
        // @ts-expect-error - Type narrowing limitation
        expect(result.hybridScore).toBeGreaterThan(0);
        
        // Note: titleScore may be 0 depending on how title matching is implemented
        // Title matching typically applies to document titles, not source paths
        // @ts-expect-error - Type narrowing limitation
        expect(typeof result.titleScore).toBe('number');
      }
    });
  });
  
  describe('field mapping', () => {
    it('should correctly map all catalog fields', async () => {
      const results = await catalogRepo.search({
        text: 'dependency injection',
        limit: 1
      });
      
      expect(results.length).toBeGreaterThan(0);
      const doc = results[0];
      
      // Verify all expected fields
      expect(doc.text).toBeDefined();
      expect(typeof doc.text).toBe('string');
      
      expect(doc.source).toBeDefined();
      expect(typeof doc.source).toBe('string');
      
      expect(typeof doc.hybridScore).toBe('number');
      expect(typeof doc.vectorScore).toBe('number');
      expect(typeof doc.bm25Score).toBe('number');
      expect(typeof doc.titleScore).toBe('number');
      
      expect(typeof doc.wordnetScore).toBe('number');
    });
    
    it('should have matched concepts and expanded terms', async () => {
      const results = await catalogRepo.search({
        text: 'design patterns',
        limit: 1
      });
      
      expect(results.length).toBeGreaterThan(0);
      const doc = results[0];
      
      // matchedConcepts and expandedTerms are optional fields
      if (doc.matchedConcepts) {
        expect(Array.isArray(doc.matchedConcepts)).toBe(true);
      }
      
      if (doc.expandedTerms) {
        expect(Array.isArray(doc.expandedTerms)).toBe(true);
      }
    });
  });
  
  describe('hybrid search scoring', () => {
    it('should have non-zero scores for relevant documents', async () => {
      const results = await catalogRepo.search({
        text: 'clean architecture principles',
        limit: 3
      });
      
      expect(results.length).toBeGreaterThan(0);
      const top = results[0];
      
      // At least some scoring components should contribute
      expect(top.hybridScore).toBeGreaterThan(0);
      expect(top.vectorScore).toBeGreaterThan(0);
      
      // Hybrid score should be combination of components
      expect(top.hybridScore).toBeGreaterThan(0);
    });
    
    it('should have title score for documents with matching title', async () => {
      const results = await catalogRepo.search({
        text: 'typescript',
        limit: 3
      });
      
      // Find the TypeScript document
      const tsDoc = results.find(r => r.source?.includes('typescript'));
      
      if (tsDoc) {
        expect(tsDoc.titleScore).toBeGreaterThan(0);
      }
    });
  });
  
  describe('error handling', () => {
    it('should handle empty query', async () => {
      const results = await catalogRepo.search({
        text: '',
        limit: 5
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    it('should handle very long query', async () => {
      const longQuery = 'architecture '.repeat(100);
      const results = await catalogRepo.search({
        text: longQuery,
        limit: 5
      });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
    
    it('should handle large limit gracefully', async () => {
      const results = await catalogRepo.search({
        text: 'software',
        limit: 10000
      });
      
      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(5); // Only 5 docs in test data
    });
  });
  
  describe('query expansion integration', () => {
    it('should expand query with related concepts', async () => {
      const results = await catalogRepo.search({
        text: 'dependency injection',
        limit: 3,
        debug: false
      });
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should find related documents even if exact term doesn't match
      const first = results[0];
      expect(first).toBeDefined();
      if (first.expandedTerms) {
        expect(first.expandedTerms.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('performance', () => {
    it('should search catalog quickly', async () => {
      const start = Date.now();
      const results = await catalogRepo.search({
        text: 'software architecture',
        limit: 5
      });
      const duration = Date.now() - start;
      
      expect(results).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should be under 2 seconds
    });
  });
});

