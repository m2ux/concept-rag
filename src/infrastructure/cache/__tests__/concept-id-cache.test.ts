/**
 * Unit Tests for ConceptIdCache
 * 
 * Tests the in-memory cache for bidirectional concept ID ↔ name mapping.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error - Type narrowing limitation
import { ConceptIdCache, ConceptRepositoryForCache } from '../concept-id-cache.js';
import { Concept } from '../../../domain/models/concept.js';

/**
 * Mock ConceptRepository for testing
 */
class MockConceptRepository implements ConceptRepositoryForCache {
  private concepts: Concept[] = [];

  async findAll(): Promise<Concept[]> {
    return Promise.resolve(this.concepts);
  }

  // Test helpers
  setConcepts(concepts: Concept[]): void {
    this.concepts = concepts;
  }

  clear(): void {
    this.concepts = [];
  }
}

describe('ConceptIdCache', () => {
  let cache: ConceptIdCache;
  let mockRepo: MockConceptRepository;

  beforeEach(() => {
    // SETUP: Get fresh instance and clear it
    cache = ConceptIdCache.getInstance();
    cache.clear();
    mockRepo = new MockConceptRepository();
  });

  describe('Singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      // SETUP & EXERCISE
      const instance1 = ConceptIdCache.getInstance();
      const instance2 = ConceptIdCache.getInstance();

      // VERIFY
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize cache with concepts from repository', async () => {
      // SETUP
      const concepts: Concept[] = [
        {
          concept: 'dependency injection',
          conceptType: 'terminology',
          category: 'software engineering',
          sources: [],
          relatedConcepts: [],
          weight: 10
        } as any
      ];
      (concepts[0] as any).id = '123';
      mockRepo.setConcepts(concepts);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getId('dependency injection')).toBe('123');
      expect(cache.getName('123')).toBe('dependency injection');
    });

    it('should handle concepts without ID field', async () => {
      // SETUP
      const concepts: Concept[] = [
        {
          concept: 'architecture',
          conceptType: 'thematic',
          category: 'engineering',
          sources: [],
          relatedConcepts: [],
          weight: 5
        } as any
      ];
      // No ID field
      mockRepo.setConcepts(concepts);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      // Should use concept name as ID fallback
      expect(cache.getId('architecture')).toBe('architecture');
      expect(cache.getName('architecture')).toBe('architecture');
    });

    it('should throw error if already initialized', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);

      // EXERCISE & VERIFY
      await expect(cache.initialize(mockRepo)).rejects.toThrow(
        'ConceptIdCache already initialized'
      );
    });

    it('should handle empty concepts array', async () => {
      // SETUP
      mockRepo.setConcepts([]);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getStats().conceptCount).toBe(0);
    });

    it('should handle multiple concepts', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any,
        { concept: 'concept2', conceptType: 'terminology', category: 'cat2', sources: [], relatedConcepts: [], weight: 2 } as any
      ];
      (concepts[0] as any).id = '1';
      (concepts[1] as any).id = '2';
      mockRepo.setConcepts(concepts);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.getStats().conceptCount).toBe(2);
      expect(cache.getId('concept1')).toBe('1');
      expect(cache.getId('concept2')).toBe('2');
    });
  });

  describe('getId', () => {
    it('should return ID for existing concept name', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'microservices', conceptType: 'thematic', category: 'architecture', sources: [], relatedConcepts: [], weight: 10 } as any
      ];
      (concepts[0] as any).id = '456';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getId('microservices');

      // VERIFY
      expect(id).toBe('456');
    });

    it('should return undefined for non-existent concept', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getId('nonexistent');

      // VERIFY
      expect(id).toBeUndefined();
    });

    it('should throw error if not initialized', () => {
      // SETUP
      cache.clear();

      // EXERCISE & VERIFY
      expect(() => cache.getId('test')).toThrow('ConceptIdCache not initialized');
    });
  });

  describe('getName', () => {
    it('should return name for existing concept ID', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'API gateway', conceptType: 'terminology', category: 'architecture', sources: [], relatedConcepts: [], weight: 8 } as any
      ];
      (concepts[0] as any).id = '789';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const name = cache.getName('789');

      // VERIFY
      expect(name).toBe('API gateway');
    });

    it('should return undefined for non-existent ID', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const name = cache.getName('999');

      // VERIFY
      expect(name).toBeUndefined();
    });

    it('should throw error if not initialized', () => {
      // SETUP
      cache.clear();

      // EXERCISE & VERIFY
      expect(() => cache.getName('test')).toThrow('ConceptIdCache not initialized');
    });
  });

  describe('getIds', () => {
    it('should return IDs for multiple concept names', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any,
        { concept: 'concept2', conceptType: 'terminology', category: 'cat2', sources: [], relatedConcepts: [], weight: 2 } as any
      ];
      (concepts[0] as any).id = '1';
      (concepts[1] as any).id = '2';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getIds(['concept1', 'concept2']);

      // VERIFY
      expect(ids).toEqual(['1', '2']);
    });

    it('should filter out undefined entries', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getIds(['concept1', 'nonexistent']);

      // VERIFY
      expect(ids).toEqual(['1']);
    });

    it('should return empty array for empty input', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getIds([]);

      // VERIFY
      expect(ids).toEqual([]);
    });
  });

  describe('getNames', () => {
    it('should return names for multiple concept IDs', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any,
        { concept: 'concept2', conceptType: 'terminology', category: 'cat2', sources: [], relatedConcepts: [], weight: 2 } as any
      ];
      (concepts[0] as any).id = '1';
      (concepts[1] as any).id = '2';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const names = cache.getNames(['1', '2']);

      // VERIFY
      expect(names).toEqual(['concept1', 'concept2']);
    });

    it('should filter out undefined entries', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const names = cache.getNames(['1', '999']);

      // VERIFY
      expect(names).toEqual(['concept1']);
    });
  });

  describe('addConcept', () => {
    it('should add new concept to cache', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.addConcept('100', 'new concept');

      // VERIFY
      expect(cache.getId('new concept')).toBe('100');
      expect(cache.getName('100')).toBe('new concept');
      expect(cache.getStats().conceptCount).toBe(1);
    });

    it('should skip if concept name already exists', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'existing', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.addConcept('2', 'existing');

      // VERIFY
      // Should not add duplicate
      expect(cache.getStats().conceptCount).toBe(1);
      expect(cache.getId('existing')).toBe('1'); // Original ID preserved
    });
  });

  describe('updateConcept', () => {
    it('should update concept name', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'old name', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.updateConcept('1', 'new name');

      // VERIFY
      expect(cache.getName('1')).toBe('new name');
      expect(cache.getId('new name')).toBe('1');
      expect(cache.getId('old name')).toBeUndefined();
    });
  });

  describe('removeConcept', () => {
    it('should remove concept from cache', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'to remove', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.removeConcept('1');

      // VERIFY
      expect(cache.getName('1')).toBeUndefined();
      expect(cache.getId('to remove')).toBeUndefined();
      expect(cache.getStats().conceptCount).toBe(0);
    });
  });

  describe('hasName and hasId', () => {
    it('should return true for existing concept name', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'test concept', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE & VERIFY
      expect(cache.hasName('test concept')).toBe(true);
      expect(cache.hasName('nonexistent')).toBe(false);
    });

    it('should return true for existing concept ID', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'test', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE & VERIFY
      expect(cache.hasId('1')).toBe(true);
      expect(cache.hasId('999')).toBe(false);
    });
  });

  describe('getAllIds and getAllNames', () => {
    it('should return all concept IDs', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any,
        { concept: 'concept2', conceptType: 'terminology', category: 'cat2', sources: [], relatedConcepts: [], weight: 2 } as any
      ];
      (concepts[0] as any).id = '1';
      (concepts[1] as any).id = '2';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getAllIds();

      // VERIFY
      expect(ids).toContain('1');
      expect(ids).toContain('2');
      expect(ids.length).toBe(2);
    });

    it('should return all concept names', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any,
        { concept: 'concept2', conceptType: 'terminology', category: 'cat2', sources: [], relatedConcepts: [], weight: 2 } as any
      ];
      (concepts[0] as any).id = '1';
      (concepts[1] as any).id = '2';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const names = cache.getAllNames();

      // VERIFY
      expect(names).toContain('concept1');
      expect(names).toContain('concept2');
      expect(names.length).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      const stats = cache.getStats();

      // VERIFY
      expect(stats.initialized).toBe(true);
      expect(stats.conceptCount).toBe(1);
      expect(stats.lastUpdated).toBeDefined();
      expect(stats.memorySizeEstimate).toBeGreaterThan(0);
    });

    it('should return uninitialized stats after clear', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);
      cache.clear();

      // EXERCISE
      const stats = cache.getStats();

      // VERIFY
      expect(stats.initialized).toBe(false);
      expect(stats.conceptCount).toBe(0);
      expect(stats.lastUpdated).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all cache data', async () => {
      // SETUP
      const concepts: Concept[] = [
        { concept: 'concept1', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (concepts[0] as any).id = '1';
      mockRepo.setConcepts(concepts);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.clear();

      // VERIFY
      expect(cache.isInitialized()).toBe(false);
      expect(cache.getStats().conceptCount).toBe(0);
      // After clear, cache is not initialized, so getId will throw
      expect(() => cache.getId('concept1')).toThrow('ConceptIdCache not initialized');
    });

    it('should allow reinitialization after clear', async () => {
      // SETUP
      mockRepo.setConcepts([]);
      await cache.initialize(mockRepo);
      cache.clear();

      const newConcepts: Concept[] = [
        { concept: 'new concept', conceptType: 'thematic', category: 'cat1', sources: [], relatedConcepts: [], weight: 1 } as any
      ];
      (newConcepts[0] as any).id = '100';
      mockRepo.setConcepts(newConcepts);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getId('new concept')).toBe('100');
    });
  });
});

