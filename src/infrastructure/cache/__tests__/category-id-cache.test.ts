/**
 * Unit Tests for CategoryIdCache
 * 
 * Tests the in-memory cache for bidirectional category ID ↔ name mapping,
 * aliases, hierarchy, and metadata access.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryIdCache } from '../category-id-cache.js';
import { CategoryRepository } from '../../../domain/interfaces/category-repository.js';
import { Category } from '../../../domain/models/category.js';

/**
 * Mock CategoryRepository for testing
 */
class MockCategoryRepository implements CategoryRepository {
  private categories: Category[] = [];

  async findAll(): Promise<Category[]> {
    return Promise.resolve(this.categories);
  }

  // @ts-expect-error - Type narrowing limitation
  async findById(id: number): Promise<Category | null> {
    return Promise.resolve(this.categories.find(c => c.id === id) || null);
  }

  // @ts-expect-error - Type narrowing limitation
  async findByName(name: string): Promise<Category | null> {
    return Promise.resolve(this.categories.find(c => c.category === name) || null);
  }

  // @ts-expect-error - Type narrowing limitation
  async findByAlias(alias: string): Promise<Category | null> {
    return Promise.resolve(
      this.categories.find(c => c.aliases.includes(alias)) || null
    );
  }

  async findRootCategories(): Promise<Category[]> {
    return Promise.resolve(this.categories.filter(c => c.parentCategoryId === null));
  }

  async findChildren(parentId: number): Promise<Category[]> {
    return Promise.resolve(this.categories.filter(c => c.parentCategoryId === parentId));
  }

  async getTopCategories(limit: number): Promise<Category[]> {
    return Promise.resolve(
      this.categories
        .sort((a, b) => b.documentCount - a.documentCount)
        .slice(0, limit)
    );
  }

  async searchByName(query: string): Promise<Category[]> {
    const lowerQuery = query.toLowerCase();
    return Promise.resolve(
      this.categories.filter(c =>
        c.category.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Test helpers
  setCategories(categories: Category[]): void {
    this.categories = categories;
  }

  clear(): void {
    this.categories = [];
  }
}

describe('CategoryIdCache', () => {
  let cache: CategoryIdCache;
  let mockRepo: MockCategoryRepository;

  beforeEach(() => {
    // SETUP: Get fresh instance and clear it
    cache = CategoryIdCache.getInstance();
    cache.clear();
    mockRepo = new MockCategoryRepository();
  });

  describe('Singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      // SETUP & EXERCISE
      const instance1 = CategoryIdCache.getInstance();
      const instance2 = CategoryIdCache.getInstance();

      // VERIFY
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize cache with categories from repository', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Software Engineering',
          description: 'Software development practices',
          parentCategoryId: null,
          aliases: ['SE', 'Software Dev'],
          relatedCategories: [],
          documentCount: 10,
          chunkCount: 100,
          conceptCount: 50,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getId('Software Engineering')).toBe(1);
      expect(cache.getName(1)).toBe('Software Engineering');
    });

    it('should handle case-insensitive name lookups', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Software Engineering',
          description: 'Test',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id1 = cache.getId('Software Engineering');
      const id2 = cache.getId('software engineering');
      const id3 = cache.getId('SOFTWARE ENGINEERING');

      // VERIFY
      expect(id1).toBe(1);
      expect(id2).toBe(1);
      expect(id3).toBe(1);
    });

    it('should build alias mappings', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Machine Learning',
          description: 'ML category',
          parentCategoryId: null,
          aliases: ['ML', 'Statistical Learning'],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.getIdByAlias('ML')).toBe(1);
      expect(cache.getIdByAlias('Statistical Learning')).toBe(1);
    });

    it('should build hierarchy mappings', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Parent',
          description: 'Parent category',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Child',
          description: 'Child category',
          parentCategoryId: 1,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      const children = cache.getChildren(1);
      expect(children).toContain(2);
      expect(children.length).toBe(1);
    });

    it('should handle empty categories array', async () => {
      // SETUP
      mockRepo.setCategories([]);

      // EXERCISE
      await cache.initialize(mockRepo);

      // VERIFY
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getStats().categoryCount).toBe(0);
    });
  });

  describe('getId and getName', () => {
    it('should return ID for existing category name', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 123,
          category: 'Architecture',
          description: 'Architecture category',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getId('Architecture');

      // VERIFY
      expect(id).toBe(123);
    });

    it('should return undefined for non-existent category', async () => {
      // SETUP
      mockRepo.setCategories([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getId('Nonexistent');

      // VERIFY
      expect(id).toBeUndefined();
    });

    it('should return name for existing category ID', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 456,
          category: 'Design Patterns',
          description: 'Design patterns category',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const name = cache.getName(456);

      // VERIFY
      expect(name).toBe('Design Patterns');
    });
  });

  describe('getIds and getNames', () => {
    it('should return IDs for multiple category names', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Category1',
          description: 'Cat1',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Category2',
          description: 'Cat2',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getIds(['Category1', 'Category2']);

      // VERIFY
      expect(ids).toEqual([1, 2]);
    });

    it('should filter out undefined entries', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Category1',
          description: 'Cat1',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const ids = cache.getIds(['Category1', 'Nonexistent']);

      // VERIFY
      expect(ids).toEqual([1]);
    });

    it('should return names for multiple category IDs', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Category1',
          description: 'Cat1',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Category2',
          description: 'Cat2',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const names = cache.getNames([1, 2]);

      // VERIFY
      expect(names).toEqual(['Category1', 'Category2']);
    });
  });

  describe('getIdByAlias', () => {
    it('should return ID for existing alias', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Machine Learning',
          description: 'ML',
          parentCategoryId: null,
          aliases: ['ML', 'AI'],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getIdByAlias('ML');

      // VERIFY
      expect(id).toBe(1);
    });

    it('should handle case-insensitive alias lookups', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Test',
          description: 'Test',
          parentCategoryId: null,
          aliases: ['alias'],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id1 = cache.getIdByAlias('alias');
      const id2 = cache.getIdByAlias('ALIAS');
      const id3 = cache.getIdByAlias('Alias');

      // VERIFY
      expect(id1).toBe(1);
      expect(id2).toBe(1);
      expect(id3).toBe(1);
    });

    it('should return undefined for non-existent alias', async () => {
      // SETUP
      mockRepo.setCategories([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const id = cache.getIdByAlias('nonexistent');

      // VERIFY
      expect(id).toBeUndefined();
    });
  });

  describe('getMetadata', () => {
    it('should return category metadata', async () => {
      // SETUP
      const category: Category = {
        id: 1,
        category: 'Test Category',
        description: 'Test description',
        parentCategoryId: null,
        aliases: ['TC'],
        relatedCategories: [],
        documentCount: 10,
        chunkCount: 100,
        conceptCount: 50,
        embeddings: []
      };
      mockRepo.setCategories([category]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const metadata = cache.getMetadata(1);

      // VERIFY
      expect(metadata).toBeDefined();
      expect(metadata?.category).toBe('Test Category');
      expect(metadata?.description).toBe('Test description');
      expect(metadata?.documentCount).toBe(10);
    });

    it('should return undefined for non-existent category', async () => {
      // SETUP
      mockRepo.setCategories([]);
      await cache.initialize(mockRepo);

      // EXERCISE
      const metadata = cache.getMetadata(999);

      // VERIFY
      expect(metadata).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('should return child category IDs', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Parent',
          description: 'Parent',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Child1',
          description: 'Child1',
          parentCategoryId: 1,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 3,
          category: 'Child2',
          description: 'Child2',
          parentCategoryId: 1,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const children = cache.getChildren(1);

      // VERIFY
      expect(children).toContain(2);
      expect(children).toContain(3);
      expect(children.length).toBe(2);
    });

    it('should return empty array for category with no children', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Leaf',
          description: 'Leaf',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const children = cache.getChildren(1);

      // VERIFY
      expect(children).toEqual([]);
    });
  });

  describe('getHierarchyPath', () => {
    it('should return path from root to category', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Root',
          description: 'Root',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Child',
          description: 'Child',
          parentCategoryId: 1,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 3,
          category: 'Grandchild',
          description: 'Grandchild',
          parentCategoryId: 2,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const path = cache.getHierarchyPath(3);

      // VERIFY
      expect(path).toEqual([1, 2, 3]);
    });

    it('should return single-element path for root category', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Root',
          description: 'Root',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const path = cache.getHierarchyPath(1);

      // VERIFY
      expect(path).toEqual([1]);
    });
  });

  describe('searchByName', () => {
    it('should search categories by name', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Software Engineering',
          description: 'SE category',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'Machine Learning',
          description: 'ML category',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const results = cache.searchByName('Software');

      // VERIFY
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('Software Engineering');
    });

    it('should search by description', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Test',
          description: 'Software development practices',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const results = cache.searchByName('development');

      // VERIFY
      expect(results.length).toBe(1);
    });

    it('should search by aliases', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Machine Learning',
          description: 'ML',
          parentCategoryId: null,
          aliases: ['ML', 'AI'],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const results = cache.searchByName('AI');

      // VERIFY
      expect(results.length).toBe(1);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories by document count', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Low',
          description: 'Low',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 5,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 2,
          category: 'High',
          description: 'High',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 20,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        },
        {
          id: 3,
          category: 'Medium',
          description: 'Medium',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 10,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const top = cache.getTopCategories(2);

      // VERIFY
      expect(top.length).toBe(2);
      expect(top[0].category).toBe('High');
      expect(top[1].category).toBe('Medium');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Category1',
          description: 'Cat1',
          parentCategoryId: null,
          aliases: ['C1', 'Cat1'],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      const stats = cache.getStats();

      // VERIFY
      expect(stats.categoryCount).toBe(1);
      expect(stats.aliasCount).toBe(2);
      expect(stats.memorySizeEstimate).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all cache data', async () => {
      // SETUP
      const categories: Category[] = [
        {
          id: 1,
          category: 'Test',
          description: 'Test',
          parentCategoryId: null,
          aliases: [],
          relatedCategories: [],
          documentCount: 0,
          chunkCount: 0,
          conceptCount: 0,
          embeddings: []
        }
      ];
      mockRepo.setCategories(categories);
      await cache.initialize(mockRepo);

      // EXERCISE
      cache.clear();

      // VERIFY
      expect(cache.isInitialized()).toBe(false);
      expect(cache.getStats().categoryCount).toBe(0);
      expect(cache.getId('Test')).toBeUndefined();
    });
  });
});

