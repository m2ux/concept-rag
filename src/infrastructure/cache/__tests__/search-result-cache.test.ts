/**
 * Unit tests for Search Result Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchResultCache } from '../search-result-cache.js';

interface TestSearchResult {
  id: string;
  text: string;
  score: number;
}

describe('SearchResultCache', () => {
  let cache: SearchResultCache<TestSearchResult[]>;
  
  beforeEach(() => {
    cache = new SearchResultCache<TestSearchResult[]>(100, 1000); // 100 entries, 1s TTL for testing
  });
  
  const mockResults: TestSearchResult[] = [
    { id: '1', text: 'result 1', score: 0.9 },
    { id: '2', text: 'result 2', score: 0.8 }
  ];
  
  describe('Basic Operations', () => {
    it('should cache and retrieve search results', () => {
      cache.set('microservices', { limit: 10 }, mockResults);
      
      const retrieved = cache.get('microservices', { limit: 10 });
      expect(retrieved).toEqual(mockResults);
    });
    
    it('should return undefined for non-existent query', () => {
      const result = cache.get('nonexistent', { limit: 10 });
      expect(result).toBeUndefined();
    });
    
    it('should differentiate queries by text', () => {
      const results1 = [{ id: '1', text: 'result 1', score: 0.9 }];
      const results2 = [{ id: '2', text: 'result 2', score: 0.8 }];
      
      cache.set('query1', { limit: 10 }, results1);
      cache.set('query2', { limit: 10 }, results2);
      
      expect(cache.get('query1', { limit: 10 })).toEqual(results1);
      expect(cache.get('query2', { limit: 10 })).toEqual(results2);
    });
    
    it('should check cache presence', () => {
      cache.set('microservices', { limit: 10 }, mockResults);
      
      expect(cache.has('microservices', { limit: 10 })).toBe(true);
      expect(cache.has('databases', { limit: 10 })).toBe(false);
    });
    
    it('should clear cache', () => {
      cache.set('query1', { limit: 10 }, mockResults);
      cache.set('query2', { limit: 10 }, mockResults);
      
      cache.clear();
      
      expect(cache.size).toBe(0);
      expect(cache.get('query1', { limit: 10 })).toBeUndefined();
    });
  });
  
  describe('Cache Key Generation', () => {
    it('should generate same key for identical query and options', () => {
      cache.set('test', { limit: 10, debug: false }, mockResults);
      
      const retrieved1 = cache.get('test', { limit: 10, debug: false });
      const retrieved2 = cache.get('test', { limit: 10, debug: false });
      
      expect(retrieved1).toEqual(mockResults);
      expect(retrieved2).toEqual(mockResults);
    });
    
    it('should generate different keys for different limits', () => {
      const results1 = [{ id: '1', text: 'result 1', score: 0.9 }];
      const results2 = [{ id: '2', text: 'result 2', score: 0.8 }];
      
      cache.set('test', { limit: 5 }, results1);
      cache.set('test', { limit: 10 }, results2);
      
      expect(cache.get('test', { limit: 5 })).toEqual(results1);
      expect(cache.get('test', { limit: 10 })).toEqual(results2);
    });
    
    it('should generate different keys for different option values', () => {
      cache.set('test', { limit: 10, debug: true }, mockResults);
      
      expect(cache.get('test', { limit: 10, debug: true })).toEqual(mockResults);
      expect(cache.get('test', { limit: 10, debug: false })).toBeUndefined();
    });
    
    it('should handle options with different key order', () => {
      cache.set('test', { limit: 10, debug: false, filter: 'test' }, mockResults);
      
      // Same options, different order - should find cache
      const retrieved = cache.get('test', { debug: false, filter: 'test', limit: 10 });
      expect(retrieved).toEqual(mockResults);
    });
    
    it('should handle empty options', () => {
      cache.set('test', {}, mockResults);
      
      expect(cache.get('test', {})).toEqual(mockResults);
    });
    
    it('should handle complex option values', () => {
      const options = {
        limit: 10,
        filters: { category: 'tech', tags: ['ai', 'ml'] },
        sort: 'relevance'
      };
      
      cache.set('test', options, mockResults);
      expect(cache.get('test', options)).toEqual(mockResults);
    });
  });
  
  describe('TTL Expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('test', { limit: 10 }, mockResults);
      expect(cache.get('test', { limit: 10 })).toEqual(mockResults);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('test', { limit: 10 })).toBeUndefined();
    });
    
    it('should support custom TTL per entry', async () => {
      const shortCache = new SearchResultCache<TestSearchResult[]>(100, 500);
      
      shortCache.set('short', { limit: 10 }, mockResults, 100); // 100ms TTL
      shortCache.set('long', { limit: 10 }, mockResults, 2000); // 2s TTL
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortCache.get('short', { limit: 10 })).toBeUndefined();
      expect(shortCache.get('long', { limit: 10 })).toEqual(mockResults);
    });
  });
  
  describe('Cache Invalidation', () => {
    it('should invalidate specific query', () => {
      cache.set('query1', { limit: 10 }, mockResults);
      cache.set('query2', { limit: 10 }, mockResults);
      
      const deleted = cache.invalidate('query1', { limit: 10 });
      
      expect(deleted).toBe(true);
      expect(cache.get('query1', { limit: 10 })).toBeUndefined();
      expect(cache.get('query2', { limit: 10 })).toEqual(mockResults);
    });
    
    it('should return false when invalidating non-existent query', () => {
      const deleted = cache.invalidate('nonexistent', { limit: 10 });
      expect(deleted).toBe(false);
    });
  });
  
  describe('Metrics', () => {
    it('should track cache hits and misses', () => {
      cache.set('test', { limit: 10 }, mockResults);
      
      cache.get('test', { limit: 10 }); // Hit
      cache.get('other', { limit: 10 }); // Miss
      cache.get('test', { limit: 10 }); // Hit
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
    });
    
    it('should calculate hit rate', () => {
      cache.set('test', { limit: 10 }, mockResults);
      
      cache.get('test', { limit: 10 }); // Hit
      cache.get('other', { limit: 10 }); // Miss
      cache.get('test', { limit: 10 }); // Hit
      cache.get('another', { limit: 10 }); // Miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0.5); // 2 hits / 4 total
    });
    
    it('should reset metrics', () => {
      cache.set('test', { limit: 10 }, mockResults);
      cache.get('test', { limit: 10 });
      cache.get('other', { limit: 10 });
      
      cache.resetMetrics();
      
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
    });
  });
  
  describe('LRU Behavior', () => {
    it('should evict least recently used entries when full', () => {
      const smallCache = new SearchResultCache<TestSearchResult[]>(3);
      
      smallCache.set('query1', { limit: 10 }, mockResults);
      smallCache.set('query2', { limit: 10 }, mockResults);
      smallCache.set('query3', { limit: 10 }, mockResults);
      smallCache.set('query4', { limit: 10 }, mockResults); // Should evict query1
      
      expect(smallCache.get('query1', { limit: 10 })).toBeUndefined();
      expect(smallCache.get('query2', { limit: 10 })).toEqual(mockResults);
      expect(smallCache.get('query3', { limit: 10 })).toEqual(mockResults);
      expect(smallCache.get('query4', { limit: 10 })).toEqual(mockResults);
    });
    
    it('should update LRU order on access', () => {
      const smallCache = new SearchResultCache<TestSearchResult[]>(3);
      
      smallCache.set('query1', { limit: 10 }, mockResults);
      smallCache.set('query2', { limit: 10 }, mockResults);
      smallCache.set('query3', { limit: 10 }, mockResults);
      
      // Access query1 to make it most recently used
      smallCache.get('query1', { limit: 10 });
      
      // Add query4, should evict query2 (now LRU)
      smallCache.set('query4', { limit: 10 }, mockResults);
      
      expect(smallCache.get('query1', { limit: 10 })).toEqual(mockResults);
      expect(smallCache.get('query2', { limit: 10 })).toBeUndefined();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty result arrays', () => {
      const emptyResults: TestSearchResult[] = [];
      cache.set('test', { limit: 10 }, emptyResults);
      
      expect(cache.get('test', { limit: 10 })).toEqual([]);
    });
    
    it('should handle very long query strings', () => {
      const longQuery = 'a'.repeat(10000);
      cache.set(longQuery, { limit: 10 }, mockResults);
      
      expect(cache.get(longQuery, { limit: 10 })).toEqual(mockResults);
    });
    
    it('should handle special characters in queries', () => {
      const specialQuery = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      cache.set(specialQuery, { limit: 10 }, mockResults);
      
      expect(cache.get(specialQuery, { limit: 10 })).toEqual(mockResults);
    });
    
    it('should handle unicode characters', () => {
      const unicodeQuery = 'こんにちは 世界 🌍';
      cache.set(unicodeQuery, { limit: 10 }, mockResults);
      
      expect(cache.get(unicodeQuery, { limit: 10 })).toEqual(mockResults);
    });
  });
});
