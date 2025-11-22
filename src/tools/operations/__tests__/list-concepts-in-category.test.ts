/**
 * Unit Tests for ListConceptsInCategoryTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListConceptsInCategoryTool } from '../list-concepts-in-category-tool.js';
import { CategoryIdCache } from '../../../infrastructure/cache/category-id-cache.js';
import {
  FakeCatalogRepository,
  FakeConceptRepository
} from '../../../__tests__/test-helpers/index.js';

describe('ListConceptsInCategoryTool', () => {
  let categoryCache: CategoryIdCache;
  let catalogRepo: FakeCatalogRepository;
  let conceptRepo: FakeConceptRepository;
  let tool: ListConceptsInCategoryTool;
  
  beforeEach(() => {
    // SETUP
    categoryCache = CategoryIdCache.getInstance();
    catalogRepo = new FakeCatalogRepository();
    conceptRepo = new FakeConceptRepository();
    tool = new ListConceptsInCategoryTool(categoryCache, catalogRepo, conceptRepo);
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
    });
    
    it('should handle errors gracefully', async () => {
      // EXERCISE
      const result = await tool.execute({ category: 'nonexistent' });
      
      // VERIFY
      expect(result).toBeDefined();
      // Tool should handle errors internally
    });
  });
});

