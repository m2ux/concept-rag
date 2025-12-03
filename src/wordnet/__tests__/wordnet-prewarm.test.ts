/**
 * Unit Tests for WordNet Cache Pre-warming
 * 
 * Tests the pre-warming capability that populates the WordNet cache
 * with vocabulary extracted from concepts before enrichment.
 * 
 * Follows Four-Phase Test pattern: Setup, Exercise, Verify, Teardown.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WordNetService } from '../wordnet_service.js';

describe('WordNetService Pre-warming', () => {
  let service: WordNetService;
  
  beforeEach(() => {
    service = new WordNetService();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('extractTermsFromConcepts', () => {
    it('should extract unique words from concept names', () => {
      // SETUP
      const conceptNames = [
        'software architecture',
        'design patterns',
        'software design'
      ];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms).toContain('software');
      expect(terms).toContain('architecture');
      expect(terms).toContain('design');
      expect(terms).toContain('patterns');
      // 'software' should appear only once despite multiple occurrences
      expect(terms.filter(t => t === 'software').length).toBe(1);
    });
    
    it('should filter out short words (length <= 2)', () => {
      // SETUP
      const conceptNames = [
        'a big thing',
        'an example',
        'i/o operations'
      ];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms).not.toContain('a');
      expect(terms).not.toContain('an');
      expect(terms).toContain('big');
      expect(terms).toContain('thing');
      expect(terms).toContain('example');
      expect(terms).toContain('operations');
    });
    
    it('should handle hyphenated and underscored names', () => {
      // SETUP
      const conceptNames = [
        'test-driven-development',
        'object_oriented_design',
        'model/view/controller'
      ];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms).toContain('test');
      expect(terms).toContain('driven');
      expect(terms).toContain('development');
      expect(terms).toContain('object');
      expect(terms).toContain('oriented');
      expect(terms).toContain('design');
      expect(terms).toContain('model');
      expect(terms).toContain('view');
      expect(terms).toContain('controller');
    });
    
    it('should normalize to lowercase', () => {
      // SETUP
      const conceptNames = [
        'Software Architecture',
        'DESIGN PATTERNS',
        'CamelCasePattern'
      ];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms.every(t => t === t.toLowerCase())).toBe(true);
      expect(terms).toContain('software');
      expect(terms).toContain('design');
    });
    
    it('should handle empty array', () => {
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts([]);
      
      // VERIFY
      expect(terms).toEqual([]);
    });
    
    it('should handle array with empty strings', () => {
      // SETUP
      const conceptNames = ['', '   ', 'valid concept'];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms).toContain('valid');
      expect(terms).toContain('concept');
      expect(terms.length).toBe(2);
    });
    
    it('should remove special characters', () => {
      // SETUP
      const conceptNames = [
        'object-oriented (OOP)',
        'test: unit & integration',
        'version@2.0'
      ];
      
      // EXERCISE
      const terms = WordNetService.extractTermsFromConcepts(conceptNames);
      
      // VERIFY
      expect(terms).toContain('object');
      expect(terms).toContain('oriented');
      expect(terms).toContain('oop');
      expect(terms).toContain('unit');
      expect(terms).toContain('integration');
      expect(terms).not.toContain('@');
      expect(terms).not.toContain('&');
    });
  });
  
  describe('prewarmCache', () => {
    it('should return statistics about pre-warming', async () => {
      // SETUP
      const terms = ['unique', 'terms'];
      
      // EXERCISE
      const stats = await service.prewarmCache(terms, { skipCached: true });
      
      // VERIFY
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('cached');
      expect(stats).toHaveProperty('fetched');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('duration');
      expect(stats.total).toBe(2);
      expect(stats.duration).toBeGreaterThanOrEqual(0);
    }, 30000);  // 30 second timeout for WordNet lookups
    
    it('should deduplicate terms', async () => {
      // SETUP
      const terms = ['test', 'TEST', 'Test', 'testing'];
      
      // EXERCISE
      const stats = await service.prewarmCache(terms, { skipCached: true });
      
      // VERIFY
      // 'test', 'TEST', 'Test' should be deduplicated to 'test'
      // 'testing' is a different term
      expect(stats.total).toBe(2);  // 'test' and 'testing'
    }, 30000);
    
    it('should skip very short terms', async () => {
      // SETUP
      // Terms with length <= 2 are filtered: 'a' (1), 'an' (2)
      // 'the' (3) and 'software' (8) pass the filter
      const terms = ['a', 'an', 'the', 'software'];
      
      // EXERCISE
      const stats = await service.prewarmCache(terms, { skipCached: true });
      
      // VERIFY
      expect(stats.total).toBe(2);  // 'the' and 'software' (length > 2)
    }, 30000);
    
    it('should skip cached terms when skipCached is true', async () => {
      // SETUP
      const terms = ['pattern'];
      
      // First prewarm to populate cache
      await service.prewarmCache(terms, { skipCached: true });
      const initialStats = service.getCacheStats();
      
      // EXERCISE - prewarm again
      const stats = await service.prewarmCache(terms, { skipCached: true });
      
      // VERIFY
      expect(stats.cached).toBe(1);  // Term was already in cache
      expect(stats.fetched).toBe(0);  // No new lookups needed
    }, 30000);
    
    it('should call progress callback', async () => {
      // SETUP
      const terms = ['first', 'second'];
      const progressCallback = vi.fn();
      
      // EXERCISE
      await service.prewarmCache(terms, { 
        skipCached: true,
        onProgress: progressCallback
      });
      
      // VERIFY
      expect(progressCallback).toHaveBeenCalled();
      // Should be called at least once per term
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(1);
    }, 30000);
    
    it('should handle empty terms array', async () => {
      // EXERCISE
      const stats = await service.prewarmCache([]);
      
      // VERIFY
      expect(stats.total).toBe(0);
      expect(stats.cached).toBe(0);
      expect(stats.fetched).toBe(0);
      expect(stats.failed).toBe(0);
    });
    
    it('should respect concurrency setting', async () => {
      // SETUP
      const terms = ['one', 'two', 'three', 'four', 'five', 'six'];
      
      // EXERCISE - with low concurrency
      const stats = await service.prewarmCache(terms, { 
        skipCached: true,
        concurrency: 2 
      });
      
      // VERIFY - should still process all terms
      expect(stats.total).toBe(6);
      expect(stats.fetched + stats.failed).toBe(6);
    }, 60000);  // 60 second timeout for multiple lookups
  });
  
  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      // EXERCISE
      const stats = service.getCacheStats();
      
      // VERIFY
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('loaded');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.loaded).toBe('boolean');
    });
  });
});
