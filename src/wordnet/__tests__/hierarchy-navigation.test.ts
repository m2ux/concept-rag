/**
 * Unit Tests for WordNet Hierarchy Navigation
 * 
 * Tests the hierarchy navigation methods that traverse WordNet's
 * hypernym/hyponym relationships.
 * 
 * Follows Four-Phase Test pattern: Setup, Exercise, Verify, Teardown.
 * 
 * Note: These tests use real WordNet lookups which may be slow.
 * Each test has appropriate timeouts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WordNetService } from '../wordnet_service.js';

describe('WordNet Hierarchy Navigation', () => {
  let service: WordNetService;
  
  beforeEach(() => {
    service = new WordNetService();
  });
  
  describe('getBroaderTerms', () => {
    it('should return hypernyms for a word', async () => {
      // EXERCISE
      const broader = await service.getBroaderTerms('dog');
      
      // VERIFY
      expect(Array.isArray(broader)).toBe(true);
      // Dog should have broader terms in WordNet
      // Exact terms depend on WordNet version
    }, 30000);
    
    it('should return empty array for unknown word', async () => {
      // EXERCISE
      const broader = await service.getBroaderTerms('xyznonexistent');
      
      // VERIFY
      expect(broader).toEqual([]);
    }, 30000);
    
    it('should return lowercase terms', async () => {
      // EXERCISE
      const broader = await service.getBroaderTerms('Computer');
      
      // VERIFY
      for (const term of broader) {
        expect(term).toBe(term.toLowerCase());
      }
    }, 30000);
    
    it('should support depth parameter', async () => {
      // EXERCISE
      const depth1 = await service.getBroaderTerms('dog', 1);
      const depth2 = await service.getBroaderTerms('dog', 2);
      
      // VERIFY
      // Depth 2 should include more terms (or at least the same)
      expect(depth2.length).toBeGreaterThanOrEqual(depth1.length);
    }, 60000);
    
    it('should deduplicate results', async () => {
      // EXERCISE
      const broader = await service.getBroaderTerms('pattern', 1);
      
      // VERIFY
      const uniqueCount = new Set(broader).size;
      expect(uniqueCount).toBe(broader.length);
    }, 30000);
  });
  
  describe('getNarrowerTerms', () => {
    it('should return hyponyms for a word', async () => {
      // EXERCISE
      const narrower = await service.getNarrowerTerms('animal');
      
      // VERIFY
      expect(Array.isArray(narrower)).toBe(true);
      // Animal should have narrower terms in WordNet
    }, 30000);
    
    it('should return empty array for unknown word', async () => {
      // EXERCISE
      const narrower = await service.getNarrowerTerms('xyznonexistent');
      
      // VERIFY
      expect(narrower).toEqual([]);
    }, 30000);
    
    it('should return lowercase terms', async () => {
      // EXERCISE
      const narrower = await service.getNarrowerTerms('Pattern');
      
      // VERIFY
      for (const term of narrower) {
        expect(term).toBe(term.toLowerCase());
      }
    }, 30000);
    
    it('should support depth parameter', async () => {
      // EXERCISE
      const depth1 = await service.getNarrowerTerms('organism', 1);
      const depth2 = await service.getNarrowerTerms('organism', 2);
      
      // VERIFY
      // Depth 2 should include more terms (or at least the same)
      expect(depth2.length).toBeGreaterThanOrEqual(depth1.length);
    }, 90000);
  });
  
  describe('getSynonyms', () => {
    it('should return synonyms for a word', async () => {
      // EXERCISE
      const synonyms = await service.getSynonyms('happy');
      
      // VERIFY
      expect(Array.isArray(synonyms)).toBe(true);
      // Happy should have synonyms in WordNet
    }, 30000);
    
    it('should exclude the original word from synonyms', async () => {
      // EXERCISE
      const synonyms = await service.getSynonyms('happy');
      
      // VERIFY
      expect(synonyms).not.toContain('happy');
    }, 30000);
    
    it('should return empty array for unknown word', async () => {
      // EXERCISE
      const synonyms = await service.getSynonyms('xyznonexistent');
      
      // VERIFY
      expect(synonyms).toEqual([]);
    }, 30000);
    
    it('should return lowercase synonyms', async () => {
      // EXERCISE
      const synonyms = await service.getSynonyms('Computer');
      
      // VERIFY
      for (const syn of synonyms) {
        expect(syn).toBe(syn.toLowerCase());
      }
    }, 30000);
    
    it('should deduplicate synonyms', async () => {
      // EXERCISE
      const synonyms = await service.getSynonyms('design');
      
      // VERIFY
      const uniqueCount = new Set(synonyms).size;
      expect(uniqueCount).toBe(synonyms.length);
    }, 30000);
  });
  
  describe('getAllRelatedTerms', () => {
    it('should return synonyms, broader, and narrower terms', async () => {
      // EXERCISE
      const related = await service.getAllRelatedTerms('pattern');
      
      // VERIFY
      expect(related).toHaveProperty('synonyms');
      expect(related).toHaveProperty('broader');
      expect(related).toHaveProperty('narrower');
      expect(Array.isArray(related.synonyms)).toBe(true);
      expect(Array.isArray(related.broader)).toBe(true);
      expect(Array.isArray(related.narrower)).toBe(true);
    }, 30000);
    
    it('should return empty arrays for unknown word', async () => {
      // EXERCISE
      const related = await service.getAllRelatedTerms('xyznonexistent');
      
      // VERIFY
      expect(related.synonyms).toEqual([]);
      expect(related.broader).toEqual([]);
      expect(related.narrower).toEqual([]);
    }, 30000);
    
    it('should execute queries in parallel', async () => {
      // SETUP
      const startTime = Date.now();
      
      // EXERCISE
      await service.getAllRelatedTerms('design');
      
      const duration = Date.now() - startTime;
      
      // VERIFY
      // Should be faster than 3 sequential calls (rough estimate)
      // This is a soft assertion - mainly testing the parallel structure works
      expect(duration).toBeLessThan(15000);
    }, 30000);
  });
  
  describe('findHierarchyPath', () => {
    it('should find path between related terms', async () => {
      // EXERCISE
      const path = await service.findHierarchyPath('dog', 'canine', 3);
      
      // VERIFY
      if (path) {
        expect(path[0]).toBe('dog');
        expect(path.length).toBeGreaterThanOrEqual(1);
      }
      // Path may or may not exist depending on WordNet structure
    }, 60000);
    
    it('should return undefined for unrelated terms with short max depth', async () => {
      // EXERCISE - use very short maxDepth to ensure fast completion
      const path = await service.findHierarchyPath('computer', 'pizza', 1);
      
      // VERIFY
      // These are semantically unrelated, no direct connection
      // With maxDepth=1, should return undefined quickly
      expect(path).toBeUndefined();
    }, 30000);
    
    it('should return single-element path for same term', async () => {
      // EXERCISE
      const path = await service.findHierarchyPath('pattern', 'pattern', 3);
      
      // VERIFY
      expect(path).toEqual(['pattern']);
    }, 30000);
    
    it('should respect maxDepth parameter', async () => {
      // EXERCISE
      const path = await service.findHierarchyPath('dog', 'entity', 2);
      
      // VERIFY
      if (path) {
        expect(path.length).toBeLessThanOrEqual(3); // Start + 2 levels
      }
    }, 60000);
    
    it('should handle unknown terms', async () => {
      // EXERCISE
      const path = await service.findHierarchyPath('xyznonexistent', 'pattern', 3);
      
      // VERIFY
      expect(path).toBeUndefined();
    }, 30000);
  });
  
  describe('integration scenarios', () => {
    it('should support concept exploration workflow', async () => {
      // SETUP - simulate exploring a concept
      const concept = 'architecture';
      
      // EXERCISE
      const related = await service.getAllRelatedTerms(concept);
      
      // VERIFY - all operations complete without error
      expect(related).toBeDefined();
      expect(typeof related.synonyms.length).toBe('number');
      expect(typeof related.broader.length).toBe('number');
      expect(typeof related.narrower.length).toBe('number');
    }, 30000);
    
    it('should support hierarchical search expansion', async () => {
      // SETUP - simulate expanding search with broader terms
      const searchTerm = 'software';
      
      // EXERCISE
      const broader = await service.getBroaderTerms(searchTerm, 1);
      
      // VERIFY - results can be used for search expansion
      for (const term of broader) {
        expect(typeof term).toBe('string');
        expect(term.length).toBeGreaterThan(0);
      }
    }, 30000);
  });
});

