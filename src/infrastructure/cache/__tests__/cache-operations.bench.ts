/**
 * Performance Benchmarks for Cache Operations
 * 
 * Measures performance of cache operations to:
 * - Establish baseline performance metrics
 * - Detect performance regressions
 * - Guide optimization efforts
 * 
 * Run with: npm test -- cache-operations.bench.ts
 * 
 * @group benchmark
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConceptIdCache } from '../concept-id-cache.js';
import { CategoryIdCache } from '../category-id-cache.js';
import { createTestDatabase, TestDatabaseFixture } from '../../../__tests__/integration/test-db-setup.js';
import { LanceDBConceptRepository } from '../../lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBCategoryRepository } from '../../lancedb/repositories/lancedb-category-repository.js';

describe('Cache Operations Performance Benchmarks', () => {
  let fixture: TestDatabaseFixture;
  let conceptCache: ConceptIdCache;
  let categoryCache: CategoryIdCache | undefined;
  const iterations = 1000;
  
  beforeAll(async () => {
    // SETUP: Create test database and initialize caches
    fixture = createTestDatabase('cache-operations-bench');
    await fixture.setup();
    
    const connection = fixture.getConnection();
    const conceptsTable = await connection.openTable('concepts');
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    conceptCache = ConceptIdCache.getInstance();
    conceptCache.clear();
    await conceptCache.initialize(conceptRepo);
    
    // Try to initialize category cache if available
    try {
      const categoriesTable = await connection.openTable('categories');
      const categoryRepo = new LanceDBCategoryRepository(categoriesTable);
      categoryCache = CategoryIdCache.getInstance();
      categoryCache.clear();
      await categoryCache.initialize(categoryRepo);
    } catch {
      // Categories table may not exist in test database
      categoryCache = undefined;
    }
  }, 30000);
  
  afterAll(async () => {
    conceptCache.clear();
    if (categoryCache) {
      categoryCache.clear();
    }
    await fixture.teardown();
  });
  
  describe('ConceptIdCache operations', () => {
    it('should benchmark getId lookup', () => {
      const conceptNames = conceptCache.getAllNames();
      if (conceptNames.length === 0) {
        return; // Skip if no concepts
      }
      
      const testName = conceptNames[0];
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conceptCache.getId(testName);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`ConceptIdCache.getId: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
    
    it('should benchmark getName lookup', () => {
      const conceptIds = conceptCache.getAllIds();
      if (conceptIds.length === 0) {
        return; // Skip if no concepts
      }
      
      const testId = conceptIds[0];
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conceptCache.getName(testId);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`ConceptIdCache.getName: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
    
    it('should benchmark getIds batch operation', () => {
      const conceptNames = conceptCache.getAllNames().slice(0, 10);
      if (conceptNames.length === 0) {
        return; // Skip if no concepts
      }
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conceptCache.getIds(conceptNames);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`ConceptIdCache.getIds (batch 10): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.1ms per call)
      expect(avgTime).toBeLessThan(0.1);
    });
    
    it('should benchmark getNames batch operation', () => {
      const conceptIds = conceptCache.getAllIds().slice(0, 10);
      if (conceptIds.length === 0) {
        return; // Skip if no concepts
      }
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conceptCache.getNames(conceptIds);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`ConceptIdCache.getNames (batch 10): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.1ms per call)
      expect(avgTime).toBeLessThan(0.1);
    });
  });
  
  describe('CategoryIdCache operations', () => {
    it('should benchmark getId lookup when available', () => {
      if (!categoryCache) {
        return; // Skip if categories not available
      }
      
      const categoryNames = categoryCache.getAllNames();
      if (categoryNames.length === 0) {
        return; // Skip if no categories
      }
      
      const testName = categoryNames[0];
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        categoryCache.getId(testName);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`CategoryIdCache.getId: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
    
    it('should benchmark getName lookup when available', () => {
      if (!categoryCache) {
        return; // Skip if categories not available
      }
      
      const categoryIds = categoryCache.getAllIds();
      if (categoryIds.length === 0) {
        return; // Skip if no categories
      }
      
      const testId = categoryIds[0];
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        categoryCache.getName(testId);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`CategoryIdCache.getName: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
    
    it('should benchmark getMetadata lookup when available', () => {
      if (!categoryCache) {
        return; // Skip if categories not available
      }
      
      const categoryIds = categoryCache.getAllIds();
      if (categoryIds.length === 0) {
        return; // Skip if no categories
      }
      
      const testId = categoryIds[0];
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        categoryCache.getMetadata(testId);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`CategoryIdCache.getMetadata: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
  
  describe('cache statistics', () => {
    it('should benchmark getStats operation', () => {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        conceptCache.getStats();
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`ConceptIdCache.getStats: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
});

