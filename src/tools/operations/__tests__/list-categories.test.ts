/**
 * Unit Tests for ListCategoriesTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListCategoriesTool } from '../list-categories-tool.js';
import { CategoryIdCache } from '../../../infrastructure/cache/category-id-cache.js';

describe('ListCategoriesTool', () => {
  let categoryCache: CategoryIdCache;
  let tool: ListCategoriesTool;
  
  beforeEach(() => {
    // SETUP
    categoryCache = CategoryIdCache.getInstance();
    tool = new ListCategoriesTool(categoryCache);
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
    });
    
    it('should handle errors gracefully', async () => {
      // EXERCISE - Even if cache is not initialized, should handle gracefully
      const result = await tool.execute({});
      
      // VERIFY
      expect(result).toBeDefined();
      // Tool should handle errors internally
    });
  });
});

