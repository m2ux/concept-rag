/**
 * Integration Tests for ApplicationContainer
 * 
 * Tests the composition root and dependency injection wiring with real database.
 * Verifies that all components are properly initialized and wired together.
 * 
 * Follows integration test patterns from existing tests.
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApplicationContainer } from '../../application/container.js';
import { useExistingTestDatabase, TestDatabaseFixture } from './test-db-setup.js';

describe('ApplicationContainer Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let container: ApplicationContainer;
  
  beforeAll(async () => {
    // ARRANGE: Use existing test_db with real sample-docs data
    fixture = useExistingTestDatabase('application-container');
    await fixture.setup();
    
    // Create ApplicationContainer with test database
    const dbPath = fixture.getDbPath();
    container = new ApplicationContainer();
    await container.initialize(dbPath);
  }, 30000);
  
  afterAll(async () => {
    // CLEANUP
    await container.close();
    await fixture.teardown();
  });
  
  describe('initialization', () => {
    it('should initialize container with database connection', () => {
      // VERIFY
      expect(container).toBeDefined();
      // Container should be initialized (no error thrown)
    });
    
    it('should register all base tools', () => {
      // EXERCISE
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      
      // VERIFY - Base tools registered by container
      expect(tools.length).toBeGreaterThanOrEqual(5);
      expect(toolNames).toContain('concept_search');  // For concept-based chunk search
      expect(toolNames).toContain('catalog_search');
      expect(toolNames).toContain('chunks_search');
      expect(toolNames).toContain('broad_chunks_search');
      expect(toolNames).toContain('extract_concepts');
    });
    
    it('should register category tools when categories table exists', () => {
      // EXERCISE
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      
      // VERIFY - Category tools may or may not be present depending on test database
      // If categories table exists, these should be present
      if (toolNames.includes('category_search')) {
        expect(toolNames).toContain('list_categories');
        expect(toolNames).toContain('list_concepts_in_category');
      }
    });
  });
  
  describe('getTool', () => {
    it('should return concept_search tool', () => {
      // EXERCISE
      const tool = container.getTool('concept_search');
      
      // VERIFY
      expect(tool).toBeDefined();
      expect(tool.name).toBe('concept_search');
    });
    
    it('should return catalog_search tool', () => {
      // EXERCISE
      const tool = container.getTool('catalog_search');
      
      // VERIFY
      expect(tool).toBeDefined();
      expect(tool.name).toBe('catalog_search');
    });
    
    it('should return chunks_search tool', () => {
      // EXERCISE
      const tool = container.getTool('chunks_search');
      
      // VERIFY
      expect(tool).toBeDefined();
      expect(tool.name).toBe('chunks_search');
    });
    
    it('should return broad_chunks_search tool', () => {
      // EXERCISE
      const tool = container.getTool('broad_chunks_search');
      
      // VERIFY
      expect(tool).toBeDefined();
      expect(tool.name).toBe('broad_chunks_search');
    });
    
    it('should return extract_concepts tool', () => {
      // EXERCISE
      const tool = container.getTool('extract_concepts');
      
      // VERIFY
      expect(tool).toBeDefined();
      expect(tool.name).toBe('extract_concepts');
    });
    
    it('should throw error for non-existent tool', () => {
      // EXERCISE & VERIFY
      expect(() => {
        container.getTool('nonexistent_tool');
      }).toThrow('Tool not found: nonexistent_tool');
    });
  });
  
  describe('tool execution', () => {
    it('should execute concept_search tool', async () => {
      // ARRANGE
      const tool = container.getTool('concept_search');
      
      // EXERCISE
      const result = await tool.execute({ concept: 'clean architecture', limit: 5 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.isError).toBe(false);
    });
    
    it('should execute catalog_search tool', async () => {
      // ARRANGE
      const tool = container.getTool('catalog_search');
      
      // EXERCISE
      const result = await tool.execute({ text: 'architecture', limit: 3 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.isError).toBe(false);
    });
    
    it('should execute broad_chunks_search tool', async () => {
      // ARRANGE
      const tool = container.getTool('broad_chunks_search');
      
      // EXERCISE
      const result = await tool.execute({ text: 'software', limit: 5 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.isError).toBe(false);
    });
    
    it('should execute extract_concepts tool', async () => {
      // ARRANGE
      const tool = container.getTool('extract_concepts');
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'architecture' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      // May return error if no documents found, which is acceptable
    });
  });
  
  describe('getAllTools', () => {
    it('should return all registered tools', () => {
      // EXERCISE
      const tools = container.getAllTools();
      
      // VERIFY
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should return tools with correct structure', () => {
      // EXERCISE
      const tools = container.getAllTools();
      
      // VERIFY
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
      });
    });
    
    it('should return unique tool names', () => {
      // EXERCISE
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      
      // VERIFY
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });
  });
  
  describe('category features', () => {
    it('should provide category repository if categories table exists', () => {
      // EXERCISE
      const categoryRepo = container.getCategoryRepository();
      
      // VERIFY
      // May be undefined if categories table doesn't exist in test database
      // This is acceptable for backward compatibility
      // With real test_db, category repo should be available
      expect(categoryRepo).toBeDefined();
    });
    
    it('should register category tools when category repository is available', () => {
      // EXERCISE
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      const hasCategoryRepo = container.getCategoryRepository() !== undefined;
      
      // VERIFY
      if (hasCategoryRepo) {
        expect(toolNames).toContain('category_search');
        expect(toolNames).toContain('list_categories');
        expect(toolNames).toContain('list_concepts_in_category');
      }
    });
  });
  
  describe('dependency wiring', () => {
    it('should wire all tools with proper dependencies', async () => {
      // ARRANGE
      const toolNames = ['concept_search', 'catalog_search', 'broad_chunks_search'];
      
      // EXERCISE & VERIFY
      for (const toolName of toolNames) {
        const tool = container.getTool(toolName);
        expect(tool).toBeDefined();
        
        // Verify tool can execute (proves dependencies are wired)
        const result = await tool.execute({ 
          text: 'test', 
          limit: 1,
          ...(toolName === 'concept_search' ? { concept: 'test' } : {})
        });
        expect(result).toBeDefined();
      }
    });
    
    it('should initialize repositories during container initialization', () => {
      // VERIFY - Category repository should be available
      const categoryRepo = container.getCategoryRepository();
      // ConceptIdCache is a singleton, so we can't directly access it
      // But if tools work, it's initialized
      
      // Verify category tools are registered (proves repositories are initialized)
      if (categoryRepo) {
        const tool = container.getTool('category_search');
        expect(tool).toBeDefined();
      }
      
      // Verify concept search tool works (proves caches are initialized)
      const conceptTool = container.getTool('concept_search');
      expect(conceptTool).toBeDefined();
    });
  });
  
  describe('cleanup', () => {
    it('should allow reinitialization after close', async () => {
      // SETUP - Create new container (don't use the shared one)
      // Note: ConceptIdCache is a singleton, so we need to clear it first
      const { ConceptIdCache } = await import('../../infrastructure/cache/concept-id-cache.js');
      const cache = ConceptIdCache.getInstance();
      if (cache.isInitialized()) {
        cache.clear();
      }
      
      const newContainer = new ApplicationContainer();
      const dbPath = fixture.getDbPath();
      
      // EXERCISE
      await newContainer.initialize(dbPath);
      
      // VERIFY
      expect(newContainer.getAllTools().length).toBeGreaterThan(0);
      
      // CLEANUP
      await newContainer.close();
      // Clear cache again for other tests
      if (cache.isInitialized()) {
        cache.clear();
      }
    });
  });
});

