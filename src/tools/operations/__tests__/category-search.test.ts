/**
 * Unit Tests for CategorySearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CategorySearchTool } from '../category-search-tool.js';
import { CategoryIdCache } from '../../../infrastructure/cache/category-id-cache.js';
import {
  FakeCatalogRepository
} from '../../../__tests__/test-helpers/index.js';

describe('CategorySearchTool', () => {
  let categoryCache: CategoryIdCache;
  let catalogRepo: FakeCatalogRepository;
  let tool: CategorySearchTool;
  
  beforeEach(() => {
    // SETUP
    categoryCache = CategoryIdCache.getInstance();
    catalogRepo = new FakeCatalogRepository();
    tool = new CategorySearchTool(categoryCache, catalogRepo);
  });
  
  describe('execute', () => {
    it('should return formatted category search results', async () => {
      // SETUP - Note: This test requires CategoryIdCache to be initialized
      // For a full test, we'd need to mock the categorySearch function
      
      // EXERCISE
      const result = await tool.execute({ category: 'software engineering' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error
      catalogRepo.search = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({ category: 'test' });
      
      // VERIFY
      expect(result.isError).toBe(true);
    });
  });
});

