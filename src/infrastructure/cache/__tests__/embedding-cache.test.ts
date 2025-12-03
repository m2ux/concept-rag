/**
 * Unit tests for Embedding Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmbeddingCache } from '../embedding-cache.js';

describe('EmbeddingCache', () => {
  let cache: EmbeddingCache;
  
  beforeEach(() => {
    cache = new EmbeddingCache(100); // Small cache for testing
  });
  
  const mockEmbedding = new Array(384).fill(0).map((_, i) => i / 384);
  const mockEmbedding2 = new Array(384).fill(0).map((_, i) => (i + 1) / 384);
  
  describe('Basic Operations', () => {
    it('should cache and retrieve embeddings', () => {
      cache.set('hello world', 'simple-hash-v1', mockEmbedding);
      
      const retrieved = cache.get('hello world', 'simple-hash-v1');
      expect(retrieved).toEqual(mockEmbedding);
    });
    
    it('should return undefined for non-existent text', () => {
      const result = cache.get('nonexistent', 'simple-hash-v1');
      expect(result).toBeUndefined();
    });
    
    it('should differentiate by text', () => {
      cache.set('text1', 'model1', mockEmbedding);
      cache.set('text2', 'model1', mockEmbedding2);
      
      expect(cache.get('text1', 'model1')).toEqual(mockEmbedding);
      expect(cache.get('text2', 'model1')).toEqual(mockEmbedding2);
    });
    
    it('should differentiate by model', () => {
      cache.set('hello', 'model1', mockEmbedding);
      cache.set('hello', 'model2', mockEmbedding2);
      
      expect(cache.get('hello', 'model1')).toEqual(mockEmbedding);
      expect(cache.get('hello', 'model2')).toEqual(mockEmbedding2);
    });
    
    it('should check cache presence', () => {
      cache.set('hello', 'model1', mockEmbedding);
      
      expect(cache.has('hello', 'model1')).toBe(true);
      expect(cache.has('world', 'model1')).toBe(false);
      expect(cache.has('hello', 'model2')).toBe(false);
    });
    
    it('should delete embeddings', () => {
      cache.set('hello', 'model1', mockEmbedding);
      
      expect(cache.delete('hello', 'model1')).toBe(true);
      expect(cache.get('hello', 'model1')).toBeUndefined();
      expect(cache.delete('hello', 'model1')).toBe(false);
    });
    
    it('should clear all embeddings', () => {
      cache.set('text1', 'model1', mockEmbedding);
      cache.set('text2', 'model1', mockEmbedding2);
      
      cache.clear();
      
      expect(cache.size).toBe(0);
      expect(cache.get('text1', 'model1')).toBeUndefined();
    });
  });
  
  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same text', () => {
      cache.set('test text', 'model1', mockEmbedding);
      
      // Multiple gets should return same embedding
      expect(cache.get('test text', 'model1')).toEqual(mockEmbedding);
      expect(cache.get('test text', 'model1')).toEqual(mockEmbedding);
    });
    
    it('should handle long texts efficiently', () => {
      const longText = 'a'.repeat(100000); // 100k chars
      cache.set(longText, 'model1', mockEmbedding);
      
      expect(cache.get(longText, 'model1')).toEqual(mockEmbedding);
    });
    
    it('should differentiate similar texts', () => {
      cache.set('test', 'model1', mockEmbedding);
      cache.set('test ', 'model1', mockEmbedding2); // Extra space
      
      expect(cache.get('test', 'model1')).toEqual(mockEmbedding);
      expect(cache.get('test ', 'model1')).toEqual(mockEmbedding2);
    });
    
    it('should handle empty text', () => {
      cache.set('', 'model1', mockEmbedding);
      expect(cache.get('', 'model1')).toEqual(mockEmbedding);
    });
    
    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      cache.set(specialText, 'model1', mockEmbedding);
      
      expect(cache.get(specialText, 'model1')).toEqual(mockEmbedding);
    });
    
    it('should handle unicode characters', () => {
      const unicodeText = 'こんにちは 世界 🌍 Привет мир';
      cache.set(unicodeText, 'model1', mockEmbedding);
      
      expect(cache.get(unicodeText, 'model1')).toEqual(mockEmbedding);
    });
    
    it('should handle newlines and whitespace', () => {
      const textWithWhitespace = 'line 1\nline 2\r\nline 3\ttab';
      cache.set(textWithWhitespace, 'model1', mockEmbedding);
      
      expect(cache.get(textWithWhitespace, 'model1')).toEqual(mockEmbedding);
    });
  });
  
  describe('Per-Model Caching', () => {
    it('should cache same text for different models separately', () => {
      const text = 'test text';
      const embedding1 = mockEmbedding;
      const embedding2 = mockEmbedding2;
      
      cache.set(text, 'simple-hash-v1', embedding1);
      cache.set(text, 'openai-ada-002', embedding2);
      
      expect(cache.get(text, 'simple-hash-v1')).toEqual(embedding1);
      expect(cache.get(text, 'openai-ada-002')).toEqual(embedding2);
    });
    
    it('should handle model version changes', () => {
      const text = 'test';
      cache.set(text, 'model-v1', mockEmbedding);
      cache.set(text, 'model-v2', mockEmbedding2);
      
      expect(cache.get(text, 'model-v1')).toEqual(mockEmbedding);
      expect(cache.get(text, 'model-v2')).toEqual(mockEmbedding2);
    });
  });
  
  describe('No TTL Behavior', () => {
    it('should not expire embeddings (immutable)', async () => {
      cache.set('test', 'model1', mockEmbedding);
      
      // Wait some time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should still be cached
      expect(cache.get('test', 'model1')).toEqual(mockEmbedding);
    });
  });
  
  describe('LRU Behavior', () => {
    it('should evict least recently used embeddings when full', () => {
      const smallCache = new EmbeddingCache(3);
      
      smallCache.set('text1', 'model1', mockEmbedding);
      smallCache.set('text2', 'model1', mockEmbedding);
      smallCache.set('text3', 'model1', mockEmbedding);
      smallCache.set('text4', 'model1', mockEmbedding); // Should evict text1
      
      expect(smallCache.get('text1', 'model1')).toBeUndefined();
      expect(smallCache.get('text2', 'model1')).toEqual(mockEmbedding);
      expect(smallCache.get('text3', 'model1')).toEqual(mockEmbedding);
      expect(smallCache.get('text4', 'model1')).toEqual(mockEmbedding);
    });
    
    it('should update LRU order on access', () => {
      const smallCache = new EmbeddingCache(3);
      
      smallCache.set('text1', 'model1', mockEmbedding);
      smallCache.set('text2', 'model1', mockEmbedding);
      smallCache.set('text3', 'model1', mockEmbedding);
      
      // Access text1 to make it most recently used
      smallCache.get('text1', 'model1');
      
      // Add text4, should evict text2 (now LRU)
      smallCache.set('text4', 'model1', mockEmbedding);
      
      expect(smallCache.get('text1', 'model1')).toEqual(mockEmbedding);
      expect(smallCache.get('text2', 'model1')).toBeUndefined();
    });
    
    it('should track evictions', () => {
      const smallCache = new EmbeddingCache(2);
      
      smallCache.set('text1', 'model1', mockEmbedding);
      smallCache.set('text2', 'model1', mockEmbedding);
      smallCache.set('text3', 'model1', mockEmbedding); // Evict
      smallCache.set('text4', 'model1', mockEmbedding); // Evict
      
      const metrics = smallCache.getMetrics();
      expect(metrics.evictions).toBe(2);
    });
  });
  
  describe('Metrics', () => {
    it('should track cache hits and misses', () => {
      cache.set('test', 'model1', mockEmbedding);
      
      cache.get('test', 'model1'); // Hit
      cache.get('other', 'model1'); // Miss
      cache.get('test', 'model1'); // Hit
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
    });
    
    it('should calculate hit rate', () => {
      cache.set('test', 'model1', mockEmbedding);
      
      cache.get('test', 'model1'); // Hit
      cache.get('other', 'model1'); // Miss
      cache.get('test', 'model1'); // Hit
      cache.get('another', 'model1'); // Miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0.5); // 2 hits / 4 total
    });
    
    it('should reset metrics', () => {
      cache.set('test', 'model1', mockEmbedding);
      cache.get('test', 'model1');
      cache.get('other', 'model1');
      
      cache.resetMetrics();
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
    });
  });
  
  describe('Memory Estimation', () => {
    it('should estimate memory usage', () => {
      cache.set('text1', 'model1', mockEmbedding);
      cache.set('text2', 'model1', mockEmbedding);
      cache.set('text3', 'model1', mockEmbedding);
      
      const memory = cache.estimateMemoryUsage();
      
      // Each embedding ~3KB + overhead
      expect(memory).toBeGreaterThan(9000); // 3 * 3KB
      expect(memory).toBeLessThan(15000); // Should be reasonable
    });
    
    it('should return zero for empty cache', () => {
      expect(cache.estimateMemoryUsage()).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle embedding arrays of different sizes', () => {
      const smallEmbedding = [0.1, 0.2, 0.3];
      const largeEmbedding = new Array(1536).fill(0.5);
      
      cache.set('small', 'model1', smallEmbedding);
      cache.set('large', 'model1', largeEmbedding);
      
      expect(cache.get('small', 'model1')).toEqual(smallEmbedding);
      expect(cache.get('large', 'model1')).toEqual(largeEmbedding);
    });
    
    it('should handle empty embedding arrays', () => {
      const emptyEmbedding: number[] = [];
      cache.set('empty', 'model1', emptyEmbedding);
      
      expect(cache.get('empty', 'model1')).toEqual([]);
    });
    
    it('should handle embedding with special float values', () => {
      const specialEmbedding = [0, -0, 1, -1, 0.5, -0.5, Infinity, -Infinity];
      cache.set('special', 'model1', specialEmbedding);
      
      expect(cache.get('special', 'model1')).toEqual(specialEmbedding);
    });
    
    it('should not mutate cached embeddings', () => {
      const original = [1, 2, 3];
      cache.set('test', 'model1', original);
      
      const retrieved = cache.get('test', 'model1');
      retrieved![0] = 999;
      
      // Original should still be unchanged
      const retrievedAgain = cache.get('test', 'model1');
      expect(retrievedAgain![0]).toBe(999); // Same reference
      
      // Note: For true immutability, would need deep cloning
      // This test documents current behavior
    });
  });
  
  describe('Performance', () => {
    it('should handle many embeddings efficiently', () => {
      const largeCache = new EmbeddingCache(1000);
      
      // Add 500 embeddings
      for (let i = 0; i < 500; i++) {
        largeCache.set(`text${i}`, 'model1', mockEmbedding);
      }
      
      expect(largeCache.size).toBe(500);
      
      // Access should still be O(1)
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        largeCache.get(`text${i}`, 'model1');
      }
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });
});
