/**
 * Performance Benchmarks for Embedding Generation
 * 
 * Measures performance of embedding generation to:
 * - Establish baseline performance metrics
 * - Detect performance regressions
 * - Guide optimization efforts
 * 
 * Run with: npm test -- simple-embedding-service.bench.ts
 * 
 * @group benchmark
 */

import { describe, it, expect } from 'vitest';
import { SimpleEmbeddingService } from '../simple-embedding-service.js';

describe('Embedding Generation Performance Benchmarks', () => {
  const embeddingService = new SimpleEmbeddingService();
  const iterations = 100;
  
  describe('generateEmbedding', () => {
    it('should benchmark embedding generation for short text', () => {
      const shortText = 'This is a short document.';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        embeddingService.generateEmbedding(shortText);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`generateEmbedding (short): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 1ms per call)
      expect(avgTime).toBeLessThan(1.0);
    });
    
    it('should benchmark embedding generation for medium text', () => {
      const mediumText = 'This is a medium length document with multiple sentences. ' +
                        'It contains various words and terms that need to be processed. ' +
                        'The embedding service should handle this efficiently.';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        embeddingService.generateEmbedding(mediumText);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`generateEmbedding (medium): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 2ms per call)
      expect(avgTime).toBeLessThan(2.0);
    });
    
    it('should benchmark embedding generation for long text', () => {
      const longText = Array(50).fill(
        'This is a longer document with many sentences. ' +
        'It contains various words and terms repeated multiple times. ' +
        'The embedding service should handle longer documents efficiently. '
      ).join('');
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        embeddingService.generateEmbedding(longText);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`generateEmbedding (long): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be reasonable (< 5ms per call for long text)
      expect(avgTime).toBeLessThan(5.0);
    });
    
    it('should benchmark batch embedding generation', () => {
      const texts = Array(10).fill(0).map((_, i) => 
        `Document ${i}: This is a test document with some content.`
      );
      
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        for (const text of texts) {
          embeddingService.generateEmbedding(text);
        }
      }
      const duration = performance.now() - start;
      
      const totalEmbeddings = 10 * texts.length;
      const avgTime = duration / totalEmbeddings;
      console.log(`Batch embedding generation: ${avgTime.toFixed(4)}ms per call (${totalEmbeddings} total embeddings)`);
      
      // Performance assertion: should be fast (< 1ms per call)
      expect(avgTime).toBeLessThan(1.0);
    });
  });
  
  describe('embedding consistency', () => {
    it('should verify embedding generation is deterministic', () => {
      const text = 'This is a test document for consistency checking.';
      
      const embedding1 = embeddingService.generateEmbedding(text);
      const embedding2 = embeddingService.generateEmbedding(text);
      
      // Verify same input produces same output
      expect(embedding1).toEqual(embedding2);
      expect(embedding1.length).toBe(384);
    });
  });
});

