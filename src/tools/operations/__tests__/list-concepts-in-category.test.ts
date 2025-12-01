/**
 * Unit Tests for ListConceptsInCategoryTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListConceptsInCategoryTool } from '../list-concepts-in-category-tool.js';
import type { CategoryRepository } from '../../../domain/interfaces/category-repository.js';
import type { CatalogRepository } from '../../../domain/interfaces/repositories/catalog-repository.js';
import type { ConceptRepository } from '../../../domain/interfaces/repositories/concept-repository.js';
import { Some, None } from '../../../domain/functional/option.js';

describe('ListConceptsInCategoryTool', () => {
  let mockCategoryRepo: CategoryRepository;
  let mockCatalogRepo: CatalogRepository;
  let mockConceptRepo: ConceptRepository;
  let tool: ListConceptsInCategoryTool;
  
  beforeEach(() => {
    // SETUP - Create mock repositories
    const mockCategory = {
      id: 1,
      category: 'software engineering',
      description: 'Test category',
      aliases: [],
      parentCategoryId: null,
      relatedCategories: [],
      documentCount: 10,
      chunkCount: 100,
      conceptCount: 50
    };
    
    mockCategoryRepo = {
      findAll: vi.fn().mockResolvedValue([mockCategory]),
      findById: vi.fn().mockResolvedValue(Some(mockCategory)),
      findByName: vi.fn().mockResolvedValue(Some(mockCategory)),
      resolveCategory: vi.fn().mockResolvedValue(mockCategory),
      getHierarchyPath: vi.fn().mockResolvedValue(['software engineering'])
    } as unknown as CategoryRepository;
    
    mockCatalogRepo = {
      getConceptsInCategory: vi.fn().mockResolvedValue([101, 102]),
      count: vi.fn().mockResolvedValue(10)
    } as unknown as CatalogRepository;
    
    mockConceptRepo = {
      findById: vi.fn().mockImplementation((id: number) => {
        if (id === 101) {
          return Promise.resolve(Some({
            id: 101,
            name: 'dependency injection',
            catalogIds: [1, 2, 3],
            weight: 0.8
          }));
        } else if (id === 102) {
          return Promise.resolve(Some({
            id: 102,
            name: 'design patterns',
            catalogIds: [1, 2],
            weight: 0.7
          }));
        }
        return Promise.resolve(None());
      })
    } as unknown as ConceptRepository;
    
    tool = new ListConceptsInCategoryTool(mockCategoryRepo, mockCatalogRepo, mockConceptRepo);
  });
  
  describe('execute', () => {
    it('should return formatted concepts list', async () => {
      // EXERCISE
      const result = await tool.execute({ category: 'software engineering' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.category).toBeDefined();
      expect(parsed.category.name).toBe('software engineering');
      expect(parsed.concepts).toBeDefined();
      expect(parsed.concepts.length).toBeGreaterThan(0);
    });
    
    it('should handle nonexistent category gracefully', async () => {
      // SETUP - Make resolveCategory return null
      mockCategoryRepo.resolveCategory = vi.fn().mockResolvedValue(null);
      
      // EXERCISE
      const result = await tool.execute({ category: 'nonexistent' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Make findAll throw
      mockCategoryRepo.resolveCategory = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // EXERCISE
      const result = await tool.execute({ category: 'software engineering' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
  });
});
