/**
 * Performance Benchmarks for Query Expansion
 * 
 * Measures performance of query expansion operations to:
 * - Establish baseline performance metrics
 * - Detect performance regressions
 * - Guide optimization efforts
 * 
 * Run with: npm test -- query_expander.bench.ts
 * 
 * @group benchmark
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { QueryExpander } from '../query_expander.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { createTestDatabase, TestDatabaseFixture } from '../../__tests__/integration/test-db-setup.js';
import * as lancedb from '@lancedb/lancedb';

describe('Query Expansion Performance Benchmarks', () => {
  let fixture: TestDatabaseFixture;
  let queryExpander: QueryExpander;
  const iterations = 50;
  
  beforeAll(async () => {
    // SETUP: Create test database with concepts table
    fixture = createTestDatabase('query-expander-bench');
    await fixture.setup();
    
    const connection = fixture.getConnection();
    const conceptsTable = await connection.openTable('concepts');
    const embeddingService = new SimpleEmbeddingService();
    queryExpander = new QueryExpander(conceptsTable, embeddingService);
  }, 30000);
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('expandQuery', () => {
    it('should benchmark expansion for short queries', async () => {
      const shortQuery = 'software architecture';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await queryExpander.expandQuery(shortQuery);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`expandQuery (short): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be reasonable (< 200ms per call for DB + WordNet operations)
      expect(avgTime).toBeLessThan(200);
    }, 60000); // 60 second timeout for long-running benchmark
    
    it('should benchmark expansion for medium queries', async () => {
      const mediumQuery = 'distributed systems design patterns and microservices architecture';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await queryExpander.expandQuery(mediumQuery);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`expandQuery (medium): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be reasonable (< 600ms per call for DB + WordNet operations)
      expect(avgTime).toBeLessThan(600);
    }, 60000); // 60 second timeout for long-running benchmark
    
    it('should benchmark expansion for long queries', async () => {
      const longQuery = 'clean architecture domain-driven design hexagonal architecture microservices patterns event sourcing CQRS';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await queryExpander.expandQuery(longQuery);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`expandQuery (long): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be reasonable (< 600ms per call for DB + WordNet operations)
      expect(avgTime).toBeLessThan(600);
    }, 60000); // 60 second timeout for long-running benchmark
    
    it('should benchmark expansion with special characters', async () => {
      const specialQuery = 'C++ programming & design patterns (OOP)';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await queryExpander.expandQuery(specialQuery);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`expandQuery (special chars): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should handle special chars efficiently (< 250ms per call)
      expect(avgTime).toBeLessThan(250);
    }, 60000); // 60 second timeout for long-running benchmark
  });
  
  describe('query expansion consistency', () => {
    it('should verify expansion is deterministic', async () => {
      const query = 'software architecture';
      
      const result1 = await queryExpander.expandQuery(query);
      const result2 = await queryExpander.expandQuery(query);
      
      // Verify same input produces same output structure
      expect(result1.original_terms).toEqual(result2.original_terms);
      expect(result1.all_terms.length).toBe(result2.all_terms.length);
    });
  });
});

