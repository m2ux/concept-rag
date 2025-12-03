/**
 * E2E Test: Document Processing Pipeline with Resilience
 * 
 * Tests full document ingestion pipeline with resilience patterns:
 * 1. Document chunking
 * 2. Concept extraction (with circuit breaker)
 * 3. Embedding generation (with bulkhead)
 * 4. Database storage (with retry)
 * 5. Graceful degradation on failures
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResilientExecutor, ResilienceProfiles } from '../../infrastructure/resilience/resilient-executor.js';
import { RetryService } from '../../infrastructure/utils/retry-service.js';
import { 
  MockLLMService, 
  MockEmbeddingService, 
  MockDatabaseService 
} from './mock-service-framework.js';
import { countResults, sleep } from './resilience-test-helpers.js';

/**
 * Simulated document chunk
 */
interface DocumentChunk {
  id: string;
  text: string;
  index: number;
}

/**
 * Pipeline result for a chunk
 */
interface ChunkProcessingResult {
  chunkId: string;
  concepts?: { primary: string[]; technical: string[]; related: string[] };
  embedding?: number[];
  storageId?: string;
  errors: string[];
}

describe('E2E: Document Pipeline Resilience', () => {
  let executor: ResilientExecutor;
  let mockLLM: MockLLMService;
  let mockEmbedding: MockEmbeddingService;
  let mockDatabase: MockDatabaseService;
  
  beforeEach(() => {
    executor = new ResilientExecutor(new RetryService());
    mockLLM = new MockLLMService();
    mockEmbedding = new MockEmbeddingService();
    mockDatabase = new MockDatabaseService();
    
    // Start with healthy services
    mockLLM.setHealthy(true);
    mockEmbedding.setHealthy(true);
    mockDatabase.setHealthy(true);
  });
  
  /**
   * Create mock document chunks
   */
  function createMockDocument(numChunks: number): DocumentChunk[] {
    return Array.from({ length: numChunks }, (_, i) => ({
      id: `chunk-${i}`,
      text: `This is chunk ${i} of the document. It contains meaningful content about various topics.`,
      index: i,
    }));
  }
  
  /**
   * Process a single chunk through the pipeline
   */
  async function processChunk(chunk: DocumentChunk): Promise<ChunkProcessingResult> {
    const result: ChunkProcessingResult = {
      chunkId: chunk.id,
      errors: [],
    };
    
    // Stage 1: Extract concepts (with circuit breaker + timeout)
    try {
      result.concepts = await executor.execute(
        () => mockLLM.extractConcepts(chunk.text),
        {
          ...ResilienceProfiles.LLM_API,
          name: 'pipeline_concept_extraction',
        }
      );
    } catch (error) {
      result.errors.push(`Concept extraction failed: ${(error as Error).message}`);
    }
    
    // Stage 2: Generate embedding (with bulkhead + timeout)
    try {
      result.embedding = await executor.execute(
        () => mockEmbedding.generateEmbedding(chunk.text),
        {
          ...ResilienceProfiles.EMBEDDING,
          name: 'pipeline_embedding_generation',
        }
      );
    } catch (error) {
      result.errors.push(`Embedding generation failed: ${(error as Error).message}`);
    }
    
    // Stage 3: Store in database (with retry)
    if (result.embedding) {
      try {
        const stored = await executor.execute(
          () => mockDatabase.save({
            chunkId: chunk.id,
            text: chunk.text,
            concepts: result.concepts,
            embedding: result.embedding,
          }),
          {
            ...ResilienceProfiles.DATABASE,
            name: 'pipeline_database_storage',
          }
        );
        result.storageId = stored.id;
      } catch (error) {
        result.errors.push(`Database storage failed: ${(error as Error).message}`);
      }
    }
    
    return result;
  }
  
  it('should process document successfully with all services healthy', async () => {
    const document = createMockDocument(10);
    
    console.log(`Processing document with ${document.length} chunks...`);
    
    const results = await Promise.all(
      document.map(chunk => processChunk(chunk))
    );
    
    // All chunks should process successfully
    const successful = results.filter(r => r.errors.length === 0).length;
    expect(successful).toBe(10);
    
    // Verify all stages completed
    results.forEach(result => {
      expect(result.concepts).toBeDefined();
      expect(result.concepts!.primary).toHaveLength(2);
      expect(result.embedding).toBeDefined();
      expect(result.embedding!.length).toBe(384);
      expect(result.storageId).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
    
    console.log('✓ All chunks processed successfully');
  }, 30000);
  
  it('should handle LLM failures with circuit breaker while continuing other stages', async () => {
    const document = createMockDocument(15);
    
    console.log('Testing pipeline with LLM failures...');
    
    // Process first 5 chunks normally
    const batch1 = await Promise.all(
      document.slice(0, 5).map(chunk => processChunk(chunk))
    );
    
    expect(batch1.filter(r => r.concepts).length).toBe(5);
    
    // Simulate LLM failure
    mockLLM.setHealthy(false);
    mockLLM.setError(new Error('LLM service unavailable'));
    
    console.log('LLM service failed, continuing with remaining chunks...');
    
    // Process remaining chunks - LLM should fail but embedding/storage should work
    const batch2 = await Promise.all(
      document.slice(5).map(chunk => processChunk(chunk))
    );
    
    // LLM extractions should fail
    const conceptExtractionsSucceeded = batch2.filter(r => r.concepts).length;
    expect(conceptExtractionsSucceeded).toBe(0);
    
    // But embeddings should still succeed (resilience pattern isolates failures)
    const embeddingsSucceeded = batch2.filter(r => r.embedding).length;
    expect(embeddingsSucceeded).toBe(10);
    
    // Circuit breaker should be open
    const cb = executor.getCircuitBreaker('pipeline_concept_extraction');
    expect(cb?.isOpen()).toBe(true);
    
    console.log('✓ Pipeline continued processing despite LLM failure');
    
    // Verify metrics show partial success
    const allResults = [...batch1, ...batch2];
    const chunksWithConcepts = allResults.filter(r => r.concepts).length;
    const chunksWithEmbeddings = allResults.filter(r => r.embedding).length;
    const chunksStored = allResults.filter(r => r.storageId).length;
    
    console.log('Pipeline results:', {
      totalChunks: document.length,
      chunksWithConcepts,
      chunksWithEmbeddings,
      chunksStored,
    });
    
    expect(chunksWithConcepts).toBe(5); // Only first batch
    expect(chunksWithEmbeddings).toBe(15); // All chunks
    expect(chunksStored).toBe(15); // All chunks (embeddings available)
  }, 30000);
  
  it('should handle concurrent chunk processing with bulkhead protection', async () => {
    const document = createMockDocument(25);
    
    // Make operations slower to observe concurrency
    mockLLM.setResponseDelay(200);
    mockEmbedding.setResponseDelay(100);
    
    console.log('Processing 25 chunks concurrently with bulkhead protection...');
    
    const startTime = Date.now();
    
    // Process all chunks concurrently
    const results = await Promise.all(
      document.map(chunk => processChunk(chunk))
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`Processed ${document.length} chunks in ${duration}ms`);
    
    // Verify all chunks processed (may have some rejections from bulkhead)
    const successful = results.filter(r => r.errors.length === 0).length;
    
    // Most should succeed (bulkhead limits prevent resource exhaustion)
    expect(successful).toBeGreaterThan(15); // At least 60% success rate
    
    // Check bulkhead metrics
    const embeddingBh = executor.getBulkhead('pipeline_embedding_generation');
    const metrics = embeddingBh?.getMetrics();
    
    if (metrics) {
      console.log('Embedding bulkhead metrics:', {
        maxConcurrent: metrics.maxConcurrent,
        rejections: metrics.rejections,
      });
      
      // If there were rejections, verify they're tracked
      if (metrics.rejections > 0) {
        const chunksWithEmbeddingErrors = results.filter(r =>
          r.errors.some(e => e.includes('Embedding generation failed'))
        ).length;
        expect(chunksWithEmbeddingErrors).toBeGreaterThan(0);
      }
    }
    
    console.log('✓ Concurrent processing protected by bulkhead');
  }, 45000);
  
  it('should recover and continue processing when services recover', async () => {
    const document = createMockDocument(20);
    
    console.log('Testing pipeline recovery...');
    
    // Use custom config with shorter timeouts and no retry
    const customConfig = {
      name: 'pipeline_recovery_test',
      timeout: 3000,
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 3000, // 3s recovery timeout
        resetTimeout: 500,
      },
      retry: undefined, // Disable retry for clearer behavior
    };
    
    // Helper to process chunk with custom config
    async function processChunkWithConfig(chunk: DocumentChunk): Promise<ChunkProcessingResult> {
      const result: ChunkProcessingResult = {
        chunkId: chunk.id,
        errors: [],
      };
      
      try {
        result.concepts = await executor.execute(
          () => mockLLM.extractConcepts(chunk.text),
          customConfig
        );
      } catch (error) {
        result.errors.push(`Concept extraction failed: ${(error as Error).message}`);
      }
      
      return result;
    }
    
    // Start with healthy services, process first batch
    const batch1 = await Promise.all(
      document.slice(0, 3).map(chunk => processChunkWithConfig(chunk))
    );
    
    expect(batch1.filter(r => r.concepts).length).toBe(3);
    
    // Simulate service failures
    mockLLM.setHealthy(false);
    
    console.log('LLM service failed, processing batch 2...');
    
    const batch2 = await Promise.all(
      document.slice(3, 6).map(chunk => processChunkWithConfig(chunk))
    );
    
    // Should fail
    expect(batch2.filter(r => r.concepts).length).toBe(0);
    
    // Check circuit is open
    const cb = executor.getCircuitBreaker('pipeline_recovery_test');
    expect(cb?.isOpen()).toBe(true);
    
    // Restore services
    mockLLM.resetToHealthy();
    
    console.log('Services recovered, waiting for circuit breaker recovery (3s)...');
    
    // Wait for circuit breaker timeout
    await sleep(3200);
    
    console.log('Processing batch 3 after recovery...');
    
    const batch3 = await Promise.all(
      document.slice(6, 9).map(chunk => processChunkWithConfig(chunk))
    );
    
    // Should succeed again after circuit recovery
    const batch3Successes = batch3.filter(r => r.concepts).length;
    
    // At least some should succeed as circuit recovers (2 needed to close)
    expect(batch3Successes).toBeGreaterThan(0);
    
    // Circuit should eventually close
    expect(cb?.isClosed()).toBe(true);
    
    console.log('✓ Pipeline recovered after service restoration');
  }, 60000);
  
  it('should provide comprehensive health summary across pipeline', async () => {
    const document = createMockDocument(10);
    
    // Process some chunks
    await Promise.all(
      document.slice(0, 5).map(chunk => processChunk(chunk))
    );
    
    // Check health summary
    const health = executor.getHealthSummary();
    
    console.log('Pipeline health summary:', {
      healthy: health.healthy,
      openCircuits: health.openCircuits,
      fullBulkheads: health.fullBulkheads,
      warnings: health.warnings,
    });
    
    // With healthy services, should be healthy
    expect(health.healthy).toBe(true);
    expect(health.openCircuits).toEqual([]);
    expect(health.fullBulkheads).toEqual([]);
    
    // Now cause failures to open circuit
    mockLLM.setHealthy(false);
    
    // Need multiple failures to open circuit (5 with default config)
    for (let i = 0; i < 8; i++) {
      await processChunk(document[i % document.length]);
    }
    
    const degradedHealth = executor.getHealthSummary();
    
    console.log('Degraded health summary:', {
      healthy: degradedHealth.healthy,
      openCircuits: degradedHealth.openCircuits,
      fullBulkheads: degradedHealth.fullBulkheads,
      warnings: degradedHealth.warnings,
    });
    
    // Should show degraded state
    expect(degradedHealth.healthy).toBe(false);
    expect(degradedHealth.openCircuits.length).toBeGreaterThan(0);
    expect(degradedHealth.warnings.length).toBeGreaterThan(0);
    
    console.log('✓ Health summary reflects pipeline state accurately');
  }, 30000);
  
  it('should maintain service isolation when one service is slow', async () => {
    const document = createMockDocument(10);
    
    // Make LLM very slow but embedding fast
    mockLLM.setResponseDelay(2000); // 2 seconds
    mockEmbedding.setResponseDelay(50); // 50ms
    mockDatabase.setResponseDelay(50);
    
    console.log('Testing service isolation with slow LLM...');
    
    const startTime = Date.now();
    
    // Process chunks concurrently
    const results = await Promise.all(
      document.map(chunk => processChunk(chunk))
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`Pipeline completed in ${duration}ms`);
    
    // All should complete (slowly due to LLM)
    const successful = results.filter(r => r.errors.length === 0).length;
    expect(successful).toBe(10);
    
    // Verify all stages completed
    results.forEach(result => {
      expect(result.concepts).toBeDefined();
      expect(result.embedding).toBeDefined();
      expect(result.storageId).toBeDefined();
    });
    
    // Check that services are still isolated (metrics should show different patterns)
    const llmCB = executor.getCircuitBreaker('pipeline_concept_extraction');
    const embeddingBH = executor.getBulkhead('pipeline_embedding_generation');
    
    console.log('Service metrics:', {
      llm: llmCB?.getMetrics(),
      embedding: embeddingBH?.getMetrics(),
    });
    
    console.log('✓ Services remained isolated despite different performance');
  }, 45000);
});
