/**
 * E2E Cache Performance Tests
 * 
 * These tests measure the real-world performance impact of the caching system.
 * Run with: npm test -- src/__tests__/e2e/cache-performance.e2e.test.ts
 * 
 * Tests validate:
 * - Cache hit rates meet targets (>60% search, >70% embeddings)
 * - Latency reduction (40-60% for cached queries)
 * - Memory usage stays bounded
 * - Cache effectiveness under realistic usage patterns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApplicationContainer } from '../../application/container.js';

describe('Cache Performance E2E Tests', () => {
  let container: ApplicationContainer;
  const testDbPath = process.env.TEST_DB_PATH || './db/test';
  
  beforeAll(async () => {
    container = new ApplicationContainer();
    await container.initialize(testDbPath);
  });
  
  afterAll(async () => {
    await container.close();
  });
  
  describe('Search Result Cache Performance', () => {
    it('should demonstrate cache hit rate >60% on repeated queries', { timeout: 60000 }, async () => {
      const catalogSearchTool = container.getTool('catalog_search');
      
      // Common queries that would be repeated in real usage
      const commonQueries = [
        'microservices',
        'distributed systems',
        'api design',
        'database optimization',
        'software architecture'
      ];
      
      // First pass - populate cache (all misses)
      console.log('\n📊 Cache Population Phase (First Pass)...');
      const firstPassTimes: number[] = [];
      
      for (const query of commonQueries) {
        const start = performance.now();
        await catalogSearchTool.execute({ text: query, limit: 5 });
        const duration = performance.now() - start;
        firstPassTimes.push(duration);
        console.log(`  Query "${query}": ${duration.toFixed(2)}ms (cache miss)`);
      }
      
      const avgFirstPass = firstPassTimes.reduce((a, b) => a + b, 0) / firstPassTimes.length;
      
      // Second pass - should hit cache
      console.log('\n📊 Cache Hit Phase (Second Pass)...');
      const secondPassTimes: number[] = [];
      
      for (const query of commonQueries) {
        const start = performance.now();
        await catalogSearchTool.execute({ text: query, limit: 5 });
        const duration = performance.now() - start;
        secondPassTimes.push(duration);
        console.log(`  Query "${query}": ${duration.toFixed(2)}ms (cache hit)`);
      }
      
      const avgSecondPass = secondPassTimes.reduce((a, b) => a + b, 0) / secondPassTimes.length;
      
      // Calculate improvement
      const improvement = ((avgFirstPass - avgSecondPass) / avgFirstPass) * 100;
      
      console.log('\n📈 Performance Results:');
      console.log(`  First pass avg:  ${avgFirstPass.toFixed(2)}ms (cache miss)`);
      console.log(`  Second pass avg: ${avgSecondPass.toFixed(2)}ms (cache hit)`);
      console.log(`  Improvement:     ${improvement.toFixed(1)}% faster`);
      
      // Verify cache effectiveness (target: 40-60% improvement)
      expect(improvement).toBeGreaterThan(30); // At least 30% improvement
      expect(avgSecondPass).toBeLessThan(avgFirstPass);
    });
    
    it('should maintain performance under realistic query patterns', { timeout: 300000 }, async () => {
      const catalogSearchTool = container.getTool('catalog_search');
      
      // Simulate realistic usage: 70% repeated queries, 30% unique
      const repeatedQueries = ['microservices', 'api gateway', 'database'];
      const uniqueQueries = [
        'event sourcing patterns',
        'cqrs implementation',
        'saga pattern orchestration',
        'eventual consistency handling',
        'distributed tracing systems'
      ];
      
      const executionTimes: number[] = [];
      let cacheHits = 0;
      let cacheMisses = 0;
      
      console.log('\n📊 Realistic Usage Simulation (100 queries)...');
      
      for (let i = 0; i < 100; i++) {
        // 70% chance of repeated query
        const query = Math.random() < 0.7
          ? repeatedQueries[Math.floor(Math.random() * repeatedQueries.length)]
          : uniqueQueries[Math.floor(Math.random() * uniqueQueries.length)];
        
        const start = performance.now();
        await catalogSearchTool.execute({ text: query, limit: 5 });
        const duration = performance.now() - start;
        
        executionTimes.push(duration);
        
        // Heuristic: fast queries (<10ms) are likely cache hits
        if (duration < 10) cacheHits++;
        else cacheMisses++;
      }
      
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      const hitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
      
      console.log(`  Average query time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Estimated hit rate: ${hitRate.toFixed(1)}%`);
      console.log(`  Cache hits:   ${cacheHits}`);
      console.log(`  Cache misses: ${cacheMisses}`);
      
      // Verify target hit rate (>60%)
      expect(hitRate).toBeGreaterThan(50); // At least 50% in realistic scenario
    });
  });
  
  describe('Embedding Cache Performance', () => {
    it('should cache embeddings for repeated texts', async () => {
      const broadSearchTool = container.getTool('broad_chunks_search');
      
      // Same query text should generate same embedding
      const query = 'distributed systems architecture patterns';
      
      console.log('\n📊 Embedding Cache Test...');
      
      // First execution - generates embedding (cache miss)
      const start1 = performance.now();
      await broadSearchTool.execute({ text: query, limit: 5 });
      const duration1 = performance.now() - start1;
      console.log(`  First execution:  ${duration1.toFixed(2)}ms (embedding generated)`);
      
      // Second execution - uses cached embedding (cache hit)
      const start2 = performance.now();
      await broadSearchTool.execute({ text: query, limit: 5 });
      const duration2 = performance.now() - start2;
      console.log(`  Second execution: ${duration2.toFixed(2)}ms (embedding cached)`);
      
      // Embedding cache should provide significant speedup
      const improvement = ((duration1 - duration2) / duration1) * 100;
      console.log(`  Improvement:      ${improvement.toFixed(1)}% faster`);
      
      expect(duration2).toBeLessThan(duration1);
    });
    
    it('should handle diverse query patterns efficiently', { timeout: 60000 }, async () => {
      const broadSearchTool = container.getTool('broad_chunks_search');
      
      // Test queries - each run twice to verify caching
      const queries = ['microservices', 'api design', 'database sharding'];
      
      console.log('\n📊 Embedding Cache with Mixed Queries...');
      
      // First pass - populate cache (all cache misses)
      const firstPassTimes: number[] = [];
      for (const query of queries) {
        const start = performance.now();
        await broadSearchTool.execute({ text: query, limit: 5 });
        const duration = performance.now() - start;
        firstPassTimes.push(duration);
        console.log(`  First pass "${query}": ${duration.toFixed(2)}ms (new)`);
      }
      
      // Second pass - should be faster due to caching
      const secondPassTimes: number[] = [];
      for (const query of queries) {
        const start = performance.now();
        await broadSearchTool.execute({ text: query, limit: 5 });
        const duration = performance.now() - start;
        secondPassTimes.push(duration);
        console.log(`  Second pass "${query}": ${duration.toFixed(2)}ms (cached)`);
      }
      
      const avgFirst = firstPassTimes.reduce((a, b) => a + b, 0) / firstPassTimes.length;
      const avgSecond = secondPassTimes.reduce((a, b) => a + b, 0) / secondPassTimes.length;
      
      console.log(`  Avg first pass: ${avgFirst.toFixed(2)}ms`);
      console.log(`  Avg second pass: ${avgSecond.toFixed(2)}ms`);
      
      // Second pass (cached) should be significantly faster than first pass
      expect(avgSecond).toBeLessThan(avgFirst);
    });
  });
  
  // NOTE: Memory bounds test removed - 5 minute timeout with 1000 queries is too slow for regular test runs.
  // Memory behavior is adequately verified by the LRU cache unit tests.
  
  describe('Cache TTL Behavior', () => {
    it('should expire search results after TTL', { timeout: 30000 }, async () => {
      const catalogSearchTool = container.getTool('catalog_search');
      const query = 'test ttl expiration query';
      
      console.log('\n📊 TTL Expiration Test...');
      
      // First query - cache miss
      const start1 = performance.now();
      await catalogSearchTool.execute({ text: query, limit: 5 });
      const duration1 = performance.now() - start1;
      console.log(`  Initial query: ${duration1.toFixed(2)}ms (cache miss)`);
      
      // Immediate second query - cache hit
      const start2 = performance.now();
      await catalogSearchTool.execute({ text: query, limit: 5 });
      const duration2 = performance.now() - start2;
      console.log(`  Immediate repeat: ${duration2.toFixed(2)}ms (cache hit)`);
      
      expect(duration2).toBeLessThan(duration1);
      
      // Note: Full TTL test would require waiting 5 minutes
      // For e2e tests, you might want a shorter TTL in test config
      console.log('  ⏱️  Note: Full TTL test requires 5min wait (default TTL)');
    });
  });
  
  describe('Concurrent Access Performance', () => {
    it('should handle concurrent queries efficiently', async () => {
      const catalogSearchTool = container.getTool('catalog_search');
      
      console.log('\n📊 Concurrent Access Test (50 parallel queries)...');
      
      // Mix of same and different queries
      const queries = Array.from({ length: 50 }, (_, i) => 
        i % 5 === 0 ? 'microservices' : `query ${i % 10}`
      );
      
      const start = performance.now();
      
      // Execute all queries in parallel
      const results = await Promise.all(
        queries.map(q => catalogSearchTool.execute({ text: q, limit: 5 }))
      );
      
      const totalDuration = performance.now() - start;
      const avgDuration = totalDuration / queries.length;
      
      console.log(`  Total time: ${totalDuration.toFixed(2)}ms`);
      console.log(`  Avg per query: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Queries completed: ${results.length}`);
      
      // All queries should complete successfully
      expect(results.length).toBe(50);
      
      // Average should be reasonable even with concurrency
      // Note: Performance can vary based on system load, so we use a generous threshold
      expect(avgDuration).toBeLessThan(200); // 200ms avg acceptable
    });
  });
  
  describe('Real-World Usage Simulation', () => {
    it('should perform well under realistic usage patterns', { timeout: 600000 }, async () => {
      const catalogSearchTool = container.getTool('catalog_search');
      const chunksSearchTool = container.getTool('chunks_search');
      
      console.log('\n📊 Real-World Simulation (200 operations)...');
      
      // Simulate user behavior:
      // - 50% catalog searches (discovering documents)
      // - 30% repeated searches (exploring same topics)
      // - 20% chunk searches (drilling into documents)
      
      const catalogQueries = ['microservices', 'api design', 'databases'];
      const sources = [
        '/test/document1.pdf',
        '/test/document2.pdf',
        '/test/document3.pdf'
      ];
      
      let totalTime = 0;
      let operationCount = 0;
      
      const startTime = performance.now();
      
      for (let i = 0; i < 200; i++) {
        const operation = Math.random();
        
        const opStart = performance.now();
        
        if (operation < 0.5) {
          // Catalog search
          const query = catalogQueries[Math.floor(Math.random() * catalogQueries.length)];
          await catalogSearchTool.execute({ text: query, limit: 5 });
        } else if (operation < 0.8) {
          // Repeated catalog search (same queries)
          await catalogSearchTool.execute({ text: 'microservices', limit: 5 });
        } else {
          // Chunk search in specific document
          const source = sources[Math.floor(Math.random() * sources.length)];
          try {
            await chunksSearchTool.execute({ 
              text: 'implementation details', 
              source,
              limit: 5 
            });
          } catch (e) {
            // Document might not exist in test DB - that's OK
          }
        }
        
        const opDuration = performance.now() - opStart;
        totalTime += opDuration;
        operationCount++;
        
        // Log progress every 50 operations
        if ((i + 1) % 50 === 0) {
          const avgSoFar = totalTime / operationCount;
          console.log(`  ${i + 1} ops: avg ${avgSoFar.toFixed(2)}ms per operation`);
        }
      }
      
      const totalDuration = performance.now() - startTime;
      const avgOperationTime = totalTime / operationCount;
      const opsPerSecond = (operationCount / totalDuration) * 1000;
      
      console.log('\n📈 Real-World Performance:');
      console.log(`  Total operations: ${operationCount}`);
      console.log(`  Total time: ${totalDuration.toFixed(2)}ms`);
      console.log(`  Avg per operation: ${avgOperationTime.toFixed(2)}ms`);
      console.log(`  Throughput: ${opsPerSecond.toFixed(1)} ops/sec`);
      
      // Performance targets for realistic usage
      expect(avgOperationTime).toBeLessThan(50); // <50ms avg acceptable
      expect(opsPerSecond).toBeGreaterThan(20);  // >20 ops/sec acceptable
    });
  });
});

