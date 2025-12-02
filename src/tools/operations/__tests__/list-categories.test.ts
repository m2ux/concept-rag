/**
 * Unit Tests for ListCategoriesTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListCategoriesTool } from '../list-categories-tool.js';
import type { CategoryRepository } from '../../../domain/interfaces/category-repository.js';
import type { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import { Some, None } from '../../../domain/functional/option.js';

describe('ListCategoriesTool', () => {
  let mockCategoryRepo: CategoryRepository;
  let mockCatalogRepo: CatalogRepository;
  let tool: ListCategoriesTool;
  
  beforeEach(() => {
    // SETUP - Create mock repositories
    mockCategoryRepo = {
      findAll: vi.fn().mockResolvedValue([
        {
          id: 1,
          category: 'software engineering',
          description: 'Test category',
          aliases: [],
          parentCategoryId: null,
          relatedCategories: [],
          documentCount: 10,
          chunkCount: 100,
          conceptCount: 50
        }
      ]),
      findById: vi.fn().mockResolvedValue(None()),
      findByName: vi.fn().mockResolvedValue(None()),
      resolveCategory: vi.fn().mockResolvedValue(null),
      getHierarchyPath: vi.fn().mockResolvedValue(['software engineering'])
    } as unknown as CategoryRepository;
    
    mockCatalogRepo = {
      count: vi.fn().mockResolvedValue(10)
    } as unknown as CatalogRepository;
    
    tool = new ListCategoriesTool(mockCategoryRepo, mockCatalogRepo);
  });
  
  describe('execute', () => {
    it('should return formatted category list', async () => {
      // EXERCISE
      const result = await tool.execute({});
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalDocuments).toBe(10);
      expect(parsed.categories).toBeDefined();
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Make findAll throw
      mockCategoryRepo.findAll = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // EXERCISE
      const result = await tool.execute({});
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
    
    it('should work without catalogRepo (fallback to max documentCount)', async () => {
      // SETUP - Create tool without catalogRepo
      const toolWithoutCatalog = new ListCategoriesTool(mockCategoryRepo);
      
      // EXERCISE
      const result = await toolWithoutCatalog.execute({});
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      
      const parsed = JSON.parse(result.content[0].text);
      // Without catalogRepo, falls back to max documentCount
      expect(parsed.summary.totalDocuments).toBe(10);
    });
  });
});
