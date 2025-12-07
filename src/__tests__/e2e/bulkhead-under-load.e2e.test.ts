/**
 * E2E Test: Bulkhead Under Load
 * 
 * Tests bulkhead pattern under realistic concurrent load:
 * 1. Concurrency limiting
 * 2. Queue management
 * 3. Rejection when full
 * 4. Resource protection
 * 5. Metrics accuracy
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResilientExecutor, ResilienceProfiles } from '../../infrastructure/resilience/resilient-executor.js';
import { BulkheadRejectionError } from '../../infrastructure/resilience/errors.js';
import { RetryService } from '../../infrastructure/utils/retry-service.js';
import { MockLLMService } from './mock-service-framework.js';
import { executeConcurrentBatch, countResults, sleep } from './resilience-test-helpers.js';

describe('E2E: Bulkhead Under Load', () => {
  let executor: ResilientExecutor;
  let mockLLM: MockLLMService;
  
  beforeEach(() => {
    executor = new ResilientExecutor(new RetryService());
    mockLLM = new MockLLMService();
    mockLLM.setHealthy(true);
  });
  
  it('should limit concurrent operations and queue overflow properly', async () => {
    const operationName = 'bulkhead_concurrency_test';
    
    // Configure bulkhead with strict limits
    const config = {
      name: operationName,
      bulkhead: {
        maxConcurrent: 5,
        maxQueue: 10,
      },
      timeout: 5000,
    };
    
    // Make operations slow so we can observe concurrency
    mockLLM.setResponseDelay(500); // 500ms per operation
    
    // Launch 20 concurrent operations
    // Expected: 5 execute, 10 queue, 5 reject
    console.log('Launching 20 concurrent operations (max 5 concurrent, max 10 queued)...');
    
    const results = await executeConcurrentBatch(20, async (i) => {
      return executor.execute(
        () => mockLLM.extractConcepts(`test ${i}`),
        config
      );
    });
    
    const counts = countResults(results);
    
    console.log('Results:', {
      successful: counts.successful,
      failed: counts.failed,
      total: counts.total,
    });
    
    // Should accept 15 total (5 concurrent + 10 queued) and reject 5
    expect(counts.successful).toBe(15);
    expect(counts.failed).toBe(5);
    
    // Verify rejected operations have correct error type
    const rejectedResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    rejectedResults.forEach(result => {
      expect(result.reason).toBeInstanceOf(BulkheadRejectionError);
    });
    
    // Verify bulkhead metrics
    const bh = executor.getBulkhead(operationName);
    expect(bh).toBeDefined();
    
    const metrics = bh!.getMetrics();
    expect(metrics.rejections).toBe(5);
    expect(metrics.maxConcurrent).toBe(5);
    expect(metrics.maxQueue).toBe(10);
    
    console.log('✓ Bulkhead correctly limited concurrency and rejected overflow');
  }, 30000);
  
  it('should handle sustained concurrent load without resource exhaustion', async () => {
    const operationName = 'bulkhead_sustained_load';
    
    const config = {
      name: operationName,
      bulkhead: {
        maxConcurrent: 10,
        maxQueue: 20,
      },
      timeout: 3000,
    };
    
    // Set moderate delay
    mockLLM.setResponseDelay(100);
    
    console.log('Testing sustained load (100 operations with max 10 concurrent)...');
    
    let successCount = 0;
    let rejectCount = 0;
    const batches = 5;
    const operationsPerBatch = 20;
    
    for (let batch = 0; batch < batches; batch++) {
      console.log(`Batch ${batch + 1}/${batches}...`);
      
      const results = await executeConcurrentBatch(operationsPerBatch, async (i) => {
        return executor.execute(
          () => mockLLM.extractConcepts(`batch${batch}-op${i}`),
          config
        );
      });
      
      const counts = countResults(results);
      successCount += counts.successful;
      rejectCount += counts.failed;
      
      // Brief pause between batches
      await sleep(50);
    }
    
    console.log('Sustained load results:', {
      totalOperations: batches * operationsPerBatch,
      successful: successCount,
      rejected: rejectCount,
    });
    
    // Should complete most operations (some may be rejected due to concurrency)
    expect(successCount).toBeGreaterThan(80); // At least 80% success
    
    const bh = executor.getBulkhead(operationName);
    const metrics = bh!.getMetrics();
    
    // After completion, bulkhead should be empty
    expect(metrics.active).toBe(0);
    expect(metrics.queued).toBe(0);
    
    console.log('✓ Sustained load handled successfully');
  }, 45000);
  
  it('should allow operations to complete as slots become available', async () => {
    const operationName = 'bulkhead_slot_release';
    
    const config = {
      name: operationName,
      bulkhead: {
        maxConcurrent: 3,
        maxQueue: 5,
      },
      timeout: 10000,
    };
    
    // Set longer delay to observe slot management
    mockLLM.setResponseDelay(1000); // 1 second per operation
    
    console.log('Testing slot release (8 operations with max 3 concurrent)...');
    
    // Launch 8 operations (3 execute immediately, 5 queue)
    const startTime = Date.now();
    
    const results = await executeConcurrentBatch(8, async (i) => {
      const opStart = Date.now();
      const result = await executor.execute(
        () => mockLLM.extractConcepts(`test ${i}`),
        config
      );
      const opDuration = Date.now() - opStart;
      
      console.log(`Operation ${i} completed in ${opDuration}ms (${Date.now() - startTime}ms from start)`);
      
      return result;
    });
    
    const totalDuration = Date.now() - startTime;
    const counts = countResults(results);
    
    console.log('Results:', {
      successful: counts.successful,
      failed: counts.failed,
      totalDuration: `${totalDuration}ms`,
    });
    
    // All 8 should succeed (3 concurrent + 5 queued, no rejections)
    expect(counts.successful).toBe(8);
    expect(counts.failed).toBe(0);
    
    // With 3 concurrent and 1s per operation, 8 operations should take ~3s
    // (batch 1: 3 ops in parallel ~1s, batch 2: 3 ops ~1s, batch 3: 2 ops ~1s)
    expect(totalDuration).toBeGreaterThan(2500);
    expect(totalDuration).toBeLessThan(4000);
    
    console.log('✓ All operations completed as slots became available');
  }, 20000);
  
  it('should track utilization metrics accurately', async () => {
    const operationName = 'bulkhead_metrics';
    
    const config = {
      name: operationName,
      bulkhead: {
        maxConcurrent: 5,
        maxQueue: 5,
      },
      timeout: 5000,
    };
    
    mockLLM.setResponseDelay(200);
    
    const bh = executor.getBulkhead(operationName);
    
    // Launch operations in background
    const operations = executeConcurrentBatch(12, async (i) => {
      return executor.execute(
        () => mockLLM.extractConcepts(`test ${i}`),
        config
      );
    });
    
    // Give operations time to start
    await sleep(50);
    
    // Check metrics while operations are in progress
    if (bh) {
      const metrics = bh.getMetrics();
      
      console.log('Mid-execution metrics:', {
        active: metrics.active,
        queued: metrics.queued,
        utilization: metrics.utilization,
      });
      
      // Should have operations active and/or queued
      const inProgress = metrics.active + metrics.queued;
      expect(inProgress).toBeGreaterThan(0);
      expect(inProgress).toBeLessThanOrEqual(10); // max 5 concurrent + 5 queued
      
      // Utilization should reflect usage
      expect(metrics.utilization).toBeGreaterThan(0);
      expect(metrics.utilization).toBeLessThanOrEqual(1);
    }
    
    // Wait for completion
    await operations;
    
    if (bh) {
      const finalMetrics = bh.getMetrics();
      
      console.log('Final metrics:', {
        active: finalMetrics.active,
        queued: finalMetrics.queued,
        rejections: finalMetrics.rejections,
        utilization: finalMetrics.utilization,
      });
      
      // After completion, should be empty
      expect(finalMetrics.active).toBe(0);
      expect(finalMetrics.queued).toBe(0);
      expect(finalMetrics.utilization).toBe(0);
      
      // Should have rejected 2 operations (12 total - 10 capacity)
      expect(finalMetrics.rejections).toBe(2);
    }
    
    console.log('✓ Metrics tracked accurately throughout execution');
  }, 15000);
  
  it('should protect multiple resource pools independently', async () => {
    // Test that different bulkheads don't interfere with each other
    
    const llmConfig = {
      name: 'llm_bulkhead',
      bulkhead: { maxConcurrent: 3, maxQueue: 2 },
      timeout: 5000,
    };
    
    const embeddingConfig = {
      name: 'embedding_bulkhead',
      bulkhead: { maxConcurrent: 5, maxQueue: 5 },
      timeout: 5000,
    };
    
    const mockEmbedding = new MockLLMService();
    mockEmbedding.setHealthy(true);
    mockEmbedding.setResponseDelay(300);
    mockLLM.setResponseDelay(300);
    
    console.log('Testing independent bulkheads...');
    
    // Launch operations on both services concurrently
    const [llmResults, embeddingResults] = await Promise.all([
      executeConcurrentBatch(10, (i) =>
        executor.execute(() => mockLLM.extractConcepts(`llm ${i}`), llmConfig)
      ),
      executeConcurrentBatch(15, (i) =>
        executor.execute(() => mockEmbedding.extractConcepts(`emb ${i}`), embeddingConfig)
      ),
    ]);
    
    const llmCounts = countResults(llmResults);
    const embeddingCounts = countResults(embeddingResults);
    
    console.log('LLM bulkhead:', {
      successful: llmCounts.successful,
      rejected: llmCounts.failed,
    });
    
    console.log('Embedding bulkhead:', {
      successful: embeddingCounts.successful,
      rejected: embeddingCounts.failed,
    });
    
    // LLM: max 5 (3 concurrent + 2 queue), reject 5
    expect(llmCounts.successful).toBe(5);
    expect(llmCounts.failed).toBe(5);
    
    // Embedding: max 10 (5 concurrent + 5 queue), reject 5
    expect(embeddingCounts.successful).toBe(10);
    expect(embeddingCounts.failed).toBe(5);
    
    const llmBh = executor.getBulkhead('llm_bulkhead');
    const embBh = executor.getBulkhead('embedding_bulkhead');
    
    expect(llmBh!.getMetrics().rejections).toBe(5);
    expect(embBh!.getMetrics().rejections).toBe(5);
    
    console.log('✓ Independent bulkheads protected resources correctly');
  }, 20000);
});








