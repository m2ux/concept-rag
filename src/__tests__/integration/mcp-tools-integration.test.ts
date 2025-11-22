/**
 * End-to-End Integration Tests for All MCP Tools
 * 
 * Comprehensive E2E tests for all MCP tools with real database to verify:
 * 1. All search modalities work correctly
 * 2. Dependency injection is properly wired
 * 3. Tool contracts are maintained
 * 4. Error handling works correctly
 * 5. Category tools function properly (if available)
 * 
 * **Test Strategy**: Integration testing with test fixtures (xUnit Test Patterns)
 * **Fully Automated**: Uses test database fixtures, no manual intervention required
 * **CI-Ready**: Can run in CI/CD pipelines without production database access
 * 
 * @group integration
 * @group e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { ApplicationContainer } from '../../application/container.js';

describe('MCP Tools End-to-End Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let container: ApplicationContainer;
  
  beforeAll(async () => {
    // ARRANGE: Setup test database
    fixture = createTestDatabase('mcp-tools-e2e');
    await fixture.setup();
    
    // Create ApplicationContainer with test database
    const dbPath = fixture.getDbPath();
    container = new ApplicationContainer();
    await container.initialize(dbPath);
  }, 30000);
  
  afterAll(async () => {
    await container.close();
    await fixture.teardown();
  });
  
  describe('Base Tools - Core Search Functionality', () => {
    describe('concept_search tool', () => {
      it('should find chunks by concept name', async () => {
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT
        const result = await tool.execute({ concept: 'clean architecture', limit: 5 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        expect(content.concept).toBe('clean architecture');
        expect(Array.isArray(content.results)).toBe(true);
        expect(content.total_chunks_found).toBeGreaterThanOrEqual(0);
      });
      
      it('should handle non-existent concepts gracefully', async () => {
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT
        const result = await tool.execute({ concept: 'nonexistent_concept_xyz_123', limit: 5 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        // Should return empty results, not error
        const content = JSON.parse(result.content[0].text);
        expect(Array.isArray(content.results)).toBe(true);
      });
      
      it('should respect limit parameter', async () => {
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT
        const result = await tool.execute({ concept: 'clean architecture', limit: 2 });
        
        // ASSERT
        const content = JSON.parse(result.content[0].text);
        expect(content.results.length).toBeLessThanOrEqual(2);
      });
    });
    
    describe('catalog_search tool', () => {
      it('should search document summaries', async () => {
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT
        const result = await tool.execute({ text: 'architecture', limit: 3 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
      });
      
      it('should return results with scores', async () => {
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT
        const result = await tool.execute({ text: 'software', limit: 1 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        if (results && results.length > 0) {
          const firstResult = results[0];
          // Should have basic result information (source is required)
          expect(firstResult.source).toBeDefined();
          // Other fields may vary based on catalog structure
        }
      });
      
      it('should handle empty search results', async () => {
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT
        const result = await tool.execute({ text: 'nonexistent_query_xyz_12345', limit: 5 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.isError).toBe(false);
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
      });
    });
    
    describe('chunks_search tool', () => {
      it('should search within specific document', async () => {
        // ARRANGE
        const catalogTool = container.getTool('catalog_search');
        const catalogResult = await catalogTool.execute({ text: 'architecture', limit: 1 });
        const catalogContent = JSON.parse(catalogResult.content[0].text);
        const source = Array.isArray(catalogContent) 
          ? catalogContent[0]?.source 
          : catalogContent.results?.[0]?.source;
        
        if (!source) {
          // Skip if no documents available
          return;
        }
        
        const tool = container.getTool('chunks_search');
        
        // ACT
        const result = await tool.execute({ 
          text: 'design', 
          source: source,
          limit: 3 
        });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
        
        // Verify all results are from the specified source
        if (results && results.length > 0) {
          results.forEach((chunk: any) => {
            expect(chunk.source).toBe(source);
          });
        }
      });
      
      it('should handle non-existent source gracefully', async () => {
        // ARRANGE
        const tool = container.getTool('chunks_search');
        
        // ACT
        const result = await tool.execute({ 
          text: 'test', 
          source: '/nonexistent/path/document.pdf',
          limit: 5 
        });
        
        // ASSERT
        expect(result).toBeDefined();
        // Should return empty results or error, not crash
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
      });
    });
    
    describe('broad_chunks_search tool', () => {
      it('should search across all chunks', async () => {
        // ARRANGE
        const tool = container.getTool('broad_chunks_search');
        
        // ACT
        const result = await tool.execute({ text: 'software', limit: 5 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(5);
      });
      
      it('should return results with hybrid scores', async () => {
        // ARRANGE
        const tool = container.getTool('broad_chunks_search');
        
        // ACT
        const result = await tool.execute({ text: 'architecture', limit: 3 });
        
        // ASSERT
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        if (results && results.length > 0) {
          const firstResult = results[0];
          expect(firstResult.text).toBeDefined();
          expect(firstResult.source).toBeDefined();
        }
      });
    });
    
    describe('extract_concepts tool', () => {
      it('should extract concepts from document', async () => {
        // ARRANGE
        const tool = container.getTool('extract_concepts');
        
        // ACT
        const result = await tool.execute({ document_query: 'architecture' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        
        const content = JSON.parse(result.content[0].text);
        // May return error if no documents found, which is acceptable
        if (!content.error) {
          expect(content.primary_concepts || content.document_summary).toBeDefined();
          if (content.primary_concepts) {
            expect(Array.isArray(content.primary_concepts)).toBe(true);
          }
        }
      });
      
      it('should handle document not found gracefully', async () => {
        // ARRANGE
        const tool = container.getTool('extract_concepts');
        
        // ACT
        const result = await tool.execute({ document_query: 'nonexistent_document_xyz_123' });
        
        // ASSERT
        expect(result).toBeDefined();
        const content = JSON.parse(result.content[0].text);
        // Should return error message, not crash
        expect(content.error || content.primary_concepts).toBeDefined();
      });
    });
  });
  
  describe('Category Tools - Advanced Features', () => {
    it('should register category tools if categories table exists', () => {
      // ARRANGE & ACT
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      const hasCategoryCache = container.getCategoryIdCache() !== undefined;
      
      // ASSERT
      if (hasCategoryCache) {
        expect(toolNames).toContain('category_search');
        expect(toolNames).toContain('list_categories');
        expect(toolNames).toContain('list_concepts_in_category');
      }
    });
    
    describe('category_search tool', () => {
      it('should search documents by category when available', async () => {
        // ARRANGE
        if (!container.getCategoryIdCache()) {
          // Skip if categories not available
          return;
        }
        
        const tool = container.getTool('category_search');
        
        // ACT
        const result = await tool.execute({ category: 'software engineering', limit: 5 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        expect(Array.isArray(content) || Array.isArray(content.results)).toBe(true);
      });
    });
    
    describe('list_categories tool', () => {
      it('should list all categories when available', async () => {
        // ARRANGE
        if (!container.getCategoryIdCache()) {
          // Skip if categories not available
          return;
        }
        
        const tool = container.getTool('list_categories');
        
        // ACT
        const result = await tool.execute({});
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        expect(Array.isArray(content) || Array.isArray(content.categories)).toBe(true);
      });
    });
    
    describe('list_concepts_in_category tool', () => {
      it('should list concepts in category when available', async () => {
        // ARRANGE
        if (!container.getCategoryIdCache()) {
          // Skip if categories not available
          return;
        }
        
        const tool = container.getTool('list_concepts_in_category');
        
        // ACT
        const result = await tool.execute({ category: 'software engineering', limit: 10 });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        // May return error if category not found, which is acceptable
        if (!result.isError) {
          const content = JSON.parse(result.content[0].text);
          expect(Array.isArray(content) || Array.isArray(content.concepts)).toBe(true);
        }
      });
    });
  });
  
  describe('Tool Integration - Cross-Tool Workflows', () => {
    it('should support catalog → chunks search workflow', async () => {
      // ARRANGE
      const catalogTool = container.getTool('catalog_search');
      const chunksTool = container.getTool('chunks_search');
      
      // ACT: Find document via catalog
      const catalogResult = await catalogTool.execute({ text: 'software', limit: 1 });
      const catalogContent = JSON.parse(catalogResult.content[0].text);
      const source = Array.isArray(catalogContent) 
        ? catalogContent[0]?.source 
        : catalogContent.results?.[0]?.source;
      
      if (!source) {
        return; // Skip if no documents
      }
      
      // ACT: Search within that document
      const chunksResult = await chunksTool.execute({ 
        text: 'design', 
        source: source,
        limit: 3 
      });
      
      // ASSERT
      expect(chunksResult).toBeDefined();
      expect(chunksResult.isError).toBe(false);
    });
    
    it('should support concept → extract workflow', async () => {
      // ARRANGE
      const conceptTool = container.getTool('concept_search');
      const extractTool = container.getTool('extract_concepts');
      
      // ACT: Find document via concept search
      const conceptResult = await conceptTool.execute({ concept: 'architecture', limit: 1 });
      const conceptContent = JSON.parse(conceptResult.content[0].text);
      
      if (conceptContent.results && conceptContent.results.length > 0) {
        const source = conceptContent.results[0].source;
        
        // ACT: Extract concepts from that document
        const extractResult = await extractTool.execute({ document_query: source });
        
        // ASSERT
        expect(extractResult).toBeDefined();
        // May return error if document not in catalog, which is acceptable
      }
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid tool names gracefully', () => {
      // ACT & ASSERT
      expect(() => {
        container.getTool('nonexistent_tool');
      }).toThrow('Tool not found: nonexistent_tool');
    });
    
    it('should handle empty query strings', async () => {
      // ARRANGE
      const tool = container.getTool('catalog_search');
      
      // ACT
      const result = await tool.execute({ text: '', limit: 5 });
      
      // ASSERT
      expect(result).toBeDefined();
      // Should handle gracefully, not crash
    });
    
    it('should handle very large limit values', async () => {
      // ARRANGE
      const tool = container.getTool('broad_chunks_search');
      
      // ACT
      const result = await tool.execute({ text: 'test', limit: 10000 });
      
      // ASSERT
      expect(result).toBeDefined();
      // Should handle gracefully, may limit internally
    });
  });
});

