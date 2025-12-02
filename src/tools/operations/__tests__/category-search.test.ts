/**
 * Unit Tests for CategorySearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CategorySearchTool } from '../category-search-tool.js';
import { CategoryRepository } from '../../../domain/interfaces/category-repository.js';
import { Category } from '../../../domain/models/category.js';
import {
  FakeCatalogRepository
} from '../../../__tests__/test-helpers/index.js';
import { fromNullable } from '../../../domain/functional/option.js';

/**
 * Mock CategoryRepository for testing
 */
class MockCategoryRepository implements CategoryRepository {
  private categories: Category[] = [];

  async findAll(): Promise<Category[]> {
    return Promise.resolve(this.categories);
  }

  // @ts-expect-error - Type narrowing limitation
  async findById(id: number) {
    const category = this.categories.find(c => c.id === id);
    return Promise.resolve(fromNullable(category));
  }

  // @ts-expect-error - Type narrowing limitation
  async findByName(name: string) {
    const category = this.categories.find(c => c.category === name);
    return Promise.resolve(fromNullable(category));
  }

  // @ts-expect-error - Type narrowing limitation
  async findByAlias(alias: string) {
    const category = this.categories.find(c => c.aliases.includes(alias));
    return Promise.resolve(fromNullable(category));
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

  async resolveCategory(nameOrIdOrAlias: string): Promise<Category | null> {
    // Check by name first
    const byName = this.categories.find(c => 
      c.category.toLowerCase() === nameOrIdOrAlias.toLowerCase()
    );
    if (byName) return byName;

    // Check by ID
    const asNumber = parseInt(nameOrIdOrAlias, 10);
    if (!isNaN(asNumber)) {
      const byId = this.categories.find(c => c.id === asNumber);
      if (byId) return byId;
    }

    // Check by alias
    const byAlias = this.categories.find(c => 
      c.aliases.some(a => a.toLowerCase() === nameOrIdOrAlias.toLowerCase())
    );
    if (byAlias) return byAlias;

    return null;
  }

  async getHierarchyPath(categoryId: number): Promise<string[]> {
    const path: string[] = [];
    let currentId: number | null = categoryId;
    
    while (currentId !== null) {
      const category = this.categories.find(c => c.id === currentId);
      if (!category) break;
      path.unshift(category.category);
      currentId = category.parentCategoryId;
    }
    
    return Promise.resolve(path);
  }

  async getChildIds(parentId: number): Promise<number[]> {
    const children = this.categories.filter(c => c.parentCategoryId === parentId);
    return Promise.resolve(children.map(c => c.id));
  }

  setCategories(categories: Category[]): void {
    this.categories = categories;
  }
}

describe('CategorySearchTool', () => {
  let catalogRepo: FakeCatalogRepository;
  let categoryRepo: MockCategoryRepository;
  let tool: CategorySearchTool;
  
  beforeEach(() => {
    // SETUP
    catalogRepo = new FakeCatalogRepository();
    categoryRepo = new MockCategoryRepository();
    tool = new CategorySearchTool(categoryRepo, catalogRepo);
  });
  
  describe('execute', () => {
    it('should return formatted category search results', async () => {
      // SETUP - Initialize repo with a category
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
      
      // EXERCISE
      const result = await tool.execute({ category: 'Software Engineering' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Initialize repo with a category, then make findByCategory throw
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
