/**
 * Unit tests for LRU Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../lru-cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;
  
  beforeEach(() => {
    cache = new LRUCache<string, number>(3); // Small cache for easier testing
  });
  
  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });
    
    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });
    
    it('should update existing values', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
      expect(cache.size).toBe(1);
    });
    
    it('should check key existence with has()', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
    
    it('should delete entries', () => {
      cache.set('key1', 100);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false);
    });
    
    it('should clear all entries', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });
  
  describe('LRU Eviction', () => {
    it('should evict least recently used item when full', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.set('key4', 400); // Should evict key1
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe(200);
      expect(cache.get('key3')).toBe(300);
      expect(cache.get('key4')).toBe(400);
      expect(cache.size).toBe(3);
    });
    
    it('should update LRU order on get', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (now LRU)
      cache.set('key4', 400);
      
      expect(cache.get('key1')).toBe(100);
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe(300);
      expect(cache.get('key4')).toBe(400);
    });
    
    it('should not evict when updating existing key', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      
      // Update key1 (should not cause eviction)
      cache.set('key1', 150);
      
      expect(cache.size).toBe(3);
      expect(cache.get('key1')).toBe(150);
    });
    
    it('should track eviction count', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      cache.set('key4', 400); // Evict
      cache.set('key5', 500); // Evict
      
      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBe(2);
    });
  });
  
  describe('TTL (Time-to-Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 100, 50); // 50ms TTL
      expect(cache.get('key1')).toBe(100);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
    });
    
    it('should not expire entries without TTL', async () => {
      cache.set('key1', 100); // No TTL
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('key1')).toBe(100);
    });
    
    it('should clean up expired entries on has()', async () => {
      cache.set('key1', 100, 50);
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.size).toBe(0);
    });
    
    it('should handle mixed TTL and non-TTL entries', async () => {
      cache.set('key1', 100, 50); // With TTL
      cache.set('key2', 200);     // Without TTL
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe(200);
    });
  });
  
  describe('Metrics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 100);
      
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit
      cache.get('key3'); // Miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(2);
    });
    
    it('should calculate hit rate correctly', () => {
      cache.set('key1', 100);
      
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit
      cache.get('key3'); // Miss
      cache.get('key1'); // Hit
      
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBeCloseTo(0.6, 2); // 3 hits / 5 total
    });
    
    it('should track cache size', () => {
      expect(cache.getMetrics().size).toBe(0);
      
      cache.set('key1', 100);
      expect(cache.getMetrics().size).toBe(1);
      
      cache.set('key2', 200);
      expect(cache.getMetrics().size).toBe(2);
      
      cache.delete('key1');
      expect(cache.getMetrics().size).toBe(1);
    });
    
    it('should reset metrics', () => {
      cache.set('key1', 100);
      cache.get('key1');
      cache.get('key2');
      
      cache.resetMetrics();
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.evictions).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
    
    it('should include max size in metrics', () => {
      const metrics = cache.getMetrics();
      expect(metrics.maxSize).toBe(3);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle cache size of 1', () => {
      const smallCache = new LRUCache<string, number>(1);
      smallCache.set('key1', 100);
      smallCache.set('key2', 200);
      
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe(200);
      expect(smallCache.size).toBe(1);
    });
    
    it('should handle empty cache operations', () => {
      expect(cache.size).toBe(0);
      expect(cache.get('any')).toBeUndefined();
      expect(cache.delete('any')).toBe(false);
      cache.clear(); // Should not throw
    });
    
    it('should handle complex values', () => {
      interface ComplexValue {
        data: number[];
        metadata: { name: string };
      }
      
      const complexCache = new LRUCache<string, ComplexValue>(10);
      const value: ComplexValue = {
        data: [1, 2, 3],
        metadata: { name: 'test' }
      };
      
      complexCache.set('key1', value);
      const retrieved = complexCache.get('key1');
      
      expect(retrieved).toEqual(value);
      expect(retrieved?.data).toEqual([1, 2, 3]);
    });
    
    it('should list all keys in LRU order', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      
      const keys = cache.keys();
      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });
  });
  
  describe('Concurrency Safety', () => {
    it('should handle rapid sequential operations', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, i);
      }
      
      // Only last 3 should remain
      expect(cache.size).toBe(3);
      expect(cache.get('key97')).toBe(97);
      expect(cache.get('key98')).toBe(98);
      expect(cache.get('key99')).toBe(99);
    });
    
    it('should maintain consistency under mixed operations', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      
      cache.get('key1');
      cache.delete('key2');
      cache.set('key3', 300);
      cache.get('key1');
      
      expect(cache.size).toBe(2);
      expect(cache.get('key1')).toBe(100);
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe(300);
    });
  });
});

