/**
 * Unit Tests for CategorySearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CategorySearchTool } from '../category-search-tool.js';
import { CategoryIdCache } from '../../../infrastructure/cache/category-id-cache.js';
import { CategoryRepository } from '../../../domain/interfaces/category-repository.js';
import { Category } from '../../../domain/models/category.js';
import {
  FakeCatalogRepository
} from '../../../__tests__/test-helpers/index.js';

/**
 * Mock CategoryRepository for testing
 */
class MockCategoryRepository implements CategoryRepository {
  private categories: Category[] = [];

  async findAll(): Promise<Category[]> {
    return Promise.resolve(this.categories);
  }

  async findById(id: number): Promise<Category | null> {
    return Promise.resolve(this.categories.find(c => c.id === id) || null);
  }

  async findByName(name: string): Promise<Category | null> {
    return Promise.resolve(this.categories.find(c => c.category === name) || null);
  }

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

  setCategories(categories: Category[]): void {
    this.categories = categories;
  }
}

describe('CategorySearchTool', () => {
  let categoryCache: CategoryIdCache;
  let catalogRepo: FakeCatalogRepository;
  let categoryRepo: MockCategoryRepository;
  let tool: CategorySearchTool;
  
  beforeEach(() => {
    // SETUP
    categoryCache = CategoryIdCache.getInstance();
    categoryCache.clear();
    catalogRepo = new FakeCatalogRepository();
    categoryRepo = new MockCategoryRepository();
    tool = new CategorySearchTool(categoryCache, catalogRepo);
  });
  
  describe('execute', () => {
    it('should return formatted category search results', async () => {
      // SETUP - Initialize cache with a category
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
      categoryRepo.setCategories(categories);
      await categoryCache.initialize(categoryRepo);
      
      // EXERCISE
      const result = await tool.execute({ category: 'Software Engineering' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Initialize cache with a category, then make findByCategory throw
      const categories: Category[] = [
        {
          id: 1,
          category: 'Test Category',
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
      categoryRepo.setCategories(categories);
      await categoryCache.initialize(categoryRepo);
      
      // Make findByCategory throw
      catalogRepo.findByCategory = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({ category: 'Test Category' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
});

