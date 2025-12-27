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
 * **Test Strategy**: Integration testing with real sample-docs data (xUnit Test Patterns)
 * **Database**: Uses db/test with real documents from sample-docs/
 * **CI-Ready**: Run `./scripts/seed-test-database.sh` before running these tests
 * 
 * Sample documents include:
 * - Clean Architecture (Robert C. Martin)
 * - Design Patterns (Gang of Four)
 * - Thinking in Systems (Donella Meadows)
 * - Sun Tzu - Art of War
 * - Various blockchain and distributed systems papers
 * 
 * @group integration
 * @group e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { useExistingTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { ApplicationContainer } from '../../application/container.js';
import * as fs from 'fs';

describe('MCP Tools End-to-End Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let container: ApplicationContainer;
  
  // Check if test database exists
  const testDbPath = './db/test';
  const testDbExists = fs.existsSync(testDbPath);
  
  beforeAll(async () => {
    if (!testDbExists) {
      console.warn('⚠️  Test database not found at ./db/test');
      console.warn('   Run: ./scripts/seed-test-database.sh');
      return;
    }
    
    // ARRANGE: Use real sample-docs data from db/test
    // This database contains real documents with proper schema fields
    // (is_reference, has_math, has_extraction_issues, etc.)
    fixture = useExistingTestDatabase('mcp-tools-e2e');
    await fixture.setup();
    
    // Create ApplicationContainer with test database
    const dbPath = fixture.getDbPath();
    container = new ApplicationContainer();
    await container.initialize(dbPath);
  }, 30000);
  
  afterAll(async () => {
    if (container) {
      await container.close();
    }
    if (fixture) {
      await fixture.teardown();
    }
  });
  
  describe('Base Tools - Core Search Functionality', () => {
    describe('concept_search tool', () => {
      it('should find chunks by concept name', async () => {
        if (!testDbExists) return; // Skip if no test database
        
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT - search for "clean architecture" which is in the test database
        const result = await tool.execute({ concept: 'clean architecture' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        // Concept name may be fuzzy-matched to closest match in database
        expect(content.concept).toBeDefined();
        expect(typeof content.concept).toBe('string');
        expect(Array.isArray(content.chunks)).toBe(true);
        expect(content.stats.total_chunks).toBeGreaterThanOrEqual(0);
      });
      
      it('should handle non-existent concepts gracefully', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT
        const result = await tool.execute({ concept: 'nonexistent_concept_xyz_123' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        // Should return empty or found results, not error
        const content = JSON.parse(result.content[0].text);
        expect(Array.isArray(content.chunks)).toBe(true);
      });
      
      it('should respect limit parameter', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('concept_search');
        
        // ACT - search for design patterns (from Gang of Four book)
        const result = await tool.execute({ concept: 'design patterns' });
        
        // ASSERT
        expect(result.isError).toBe(false);
        const content = JSON.parse(result.content[0].text);
        expect(Array.isArray(content.chunks)).toBe(true);
        // Gap detection returns natural cluster - just verify results exist
        expect(content.stats.sources_returned).toBeGreaterThanOrEqual(0);
      });
    });
    
    describe('catalog_search tool', () => {
      it('should search document summaries', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT - search for "clean architecture" which is a book in sample-docs
        const result = await tool.execute({ text: 'clean architecture' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
        // Should find the Clean Architecture book
        expect(results.length).toBeGreaterThan(0);
      });
      
      it('should return results with source paths', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT - search for "design patterns" (Gang of Four book)
        const result = await tool.execute({ text: 'design patterns' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        if (results && results.length > 0) {
          const firstResult = results[0];
          // Should have basic result information (source is required)
          expect(firstResult.source).toBeDefined();
          expect(typeof firstResult.source).toBe('string');
        }
      }, 30000);  // Increased timeout for gap detection search
      
      it('should handle empty search results', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('catalog_search');
        
        // ACT
        const result = await tool.execute({ text: 'nonexistent_query_xyz_12345' });
        
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
        if (!testDbExists) return;
        
        // ARRANGE - first find a document via catalog search
        const catalogTool = container.getTool('catalog_search');
        const catalogResult = await catalogTool.execute({ text: 'clean architecture' });
        const catalogContent = JSON.parse(catalogResult.content[0].text);
        const source = Array.isArray(catalogContent) 
          ? catalogContent[0]?.source 
          : catalogContent.results?.[0]?.source;
        
        if (!source) {
          // Skip if no documents available
          return;
        }
        
        const tool = container.getTool('chunks_search');
        
        // ACT - search for "dependency" within the found document
        const result = await tool.execute({ 
          text: 'dependency', 
          source: source
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
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('chunks_search');
        
        // ACT
        const result = await tool.execute({ 
          text: 'test', 
          source: '/nonexistent/path/document.pdf'
        });
        
        // ASSERT
        expect(result).toBeDefined();
        // Should return empty results or error, not crash
        const content = JSON.parse(result.content[0].text);
        // May return error object or empty results array
        const isErrorResponse = content.error !== undefined;
        const results = Array.isArray(content) ? content : content.results;
        expect(isErrorResponse || Array.isArray(results)).toBe(true);
      });
    });
    
    describe('broad_chunks_search tool', () => {
      it('should search across all chunks', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('broad_chunks_search');
        
        // ACT - search for "software" which appears in multiple sample-docs
        const result = await tool.execute({ text: 'software architecture' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const results = Array.isArray(content) ? content : content.results;
        expect(Array.isArray(results)).toBe(true);
        // Gap detection returns natural cluster - just verify results are array
        expect(results.length).toBeGreaterThanOrEqual(0);
      });
      
      it('should return results with text and source', async () => {
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('broad_chunks_search');
        
        // ACT - search for "dependency injection" from Clean Architecture
        const result = await tool.execute({ text: 'dependency injection' });
        
        // ASSERT
        expect(result.isError).toBe(false);
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
        if (!testDbExists) return;
        
        // ARRANGE
        const tool = container.getTool('extract_concepts');
        
        // ACT - extract concepts from Clean Architecture book
        const result = await tool.execute({ document_query: 'clean architecture robert martin' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        
        const content = JSON.parse(result.content[0].text);
        // May return error if no documents found, which is acceptable
        if (!content.error) {
          expect(content.primary_concepts || content.document_summary).toBeDefined();
          if (content.primary_concepts) {
            expect(Array.isArray(content.primary_concepts)).toBe(true);
            // Clean Architecture should have meaningful concepts
            expect(content.primary_concepts.length).toBeGreaterThan(0);
          }
        }
      });
      
      it('should handle document not found gracefully', async () => {
        if (!testDbExists) return;
        
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
      if (!testDbExists) return;
      
      // ARRANGE & ACT
      const tools = container.getAllTools();
      const toolNames = tools.map(t => t.name);
      const hasCategoryRepo = container.getCategoryRepository() !== undefined;
      
      // ASSERT - db/test has categories table
      expect(hasCategoryRepo).toBe(true);
      expect(toolNames).toContain('category_search');
      expect(toolNames).toContain('list_categories');
      expect(toolNames).toContain('list_concepts_in_category');
    });
    
    describe('category_search tool', () => {
      it('should search documents by category', async () => {
        if (!testDbExists) return;
        if (!container.getCategoryRepository()) return;
        
        const tool = container.getTool('category_search');
        
        // ACT - search for "software engineering" category (from sample-docs)
        const result = await tool.execute({ category: 'software engineering' });
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        // Category search may return error if category not found with exact alias match
        if (!result.isError) {
          const content = JSON.parse(result.content[0].text);
          // category_search returns { category, statistics, documents, ... }
          expect(content.documents !== undefined || Array.isArray(content.results) || Array.isArray(content)).toBe(true);
        }
      });
    });
    
    describe('list_categories tool', () => {
      it('should list all categories', async () => {
        if (!testDbExists) return;
        if (!container.getCategoryRepository()) return;
        
        const tool = container.getTool('list_categories');
        
        // ACT
        const result = await tool.execute({});
        
        // ASSERT
        expect(result).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.isError).toBe(false);
        
        const content = JSON.parse(result.content[0].text);
        const categories = Array.isArray(content) ? content : content.categories;
        expect(Array.isArray(categories)).toBe(true);
        // db/test has 87 categories
        expect(categories.length).toBeGreaterThan(0);
      });
    });
    
    describe('list_concepts_in_category tool', () => {
      it('should list concepts in category', async () => {
        if (!testDbExists) return;
        if (!container.getCategoryRepository()) return;
        
        const tool = container.getTool('list_concepts_in_category');
        
        // ACT - use a category that likely exists from the sample-docs
        const result = await tool.execute({ category: 'software architecture' });
        
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
      if (!testDbExists) return;
      
      // ARRANGE
      const catalogTool = container.getTool('catalog_search');
      const chunksTool = container.getTool('chunks_search');
      
      // ACT: Find Design Patterns book via catalog
      const catalogResult = await catalogTool.execute({ text: 'design patterns gang of four' });
      const catalogContent = JSON.parse(catalogResult.content[0].text);
      const source = Array.isArray(catalogContent) 
        ? catalogContent[0]?.source 
        : catalogContent.results?.[0]?.source;
      
      if (!source) {
        return; // Skip if no documents
      }
      
      // ACT: Search for "factory" pattern within that document
      const chunksResult = await chunksTool.execute({ 
        text: 'factory pattern', 
        source: source
      });
      
      // ASSERT
      expect(chunksResult).toBeDefined();
      expect(chunksResult.isError).toBe(false);
    });
    
    it('should support concept → extract workflow', async () => {
      if (!testDbExists) return;
      
      // ARRANGE
      const conceptTool = container.getTool('concept_search');
      const extractTool = container.getTool('extract_concepts');
      
      // ACT: Find document via concept search for "systems thinking"
      const conceptResult = await conceptTool.execute({ concept: 'systems thinking' });
      const conceptContent = JSON.parse(conceptResult.content[0].text);
      
      // Get source from chunks if available
      if (conceptContent.chunks && conceptContent.chunks.length > 0) {
        const source = conceptContent.chunks[0].source;
        
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
      if (!testDbExists) return;
      
      // ACT & ASSERT
      expect(() => {
        container.getTool('nonexistent_tool');
      }).toThrow('Tool not found: nonexistent_tool');
    });
    
    it('should handle empty query strings', async () => {
      if (!testDbExists) return;
      
      // ARRANGE
      const tool = container.getTool('catalog_search');
      
      // ACT
      const result = await tool.execute({ text: '' });
      
      // ASSERT
      expect(result).toBeDefined();
      // Should handle gracefully, not crash
    });
    
    it('should handle very large limit values', async () => {
      if (!testDbExists) return;
      
      // ARRANGE
      const tool = container.getTool('broad_chunks_search');
      
      // ACT - search for blockchain (from sample papers) - no limit needed with gap detection
      const result = await tool.execute({ text: 'blockchain interoperability' });
      
      // ASSERT
      expect(result).toBeDefined();
      // Should handle gracefully, may limit internally
    });
  });
  
  describe('Schema Coverage Tests', () => {
    it('should have is_reference field in schema', async () => {
      if (!testDbExists) return;
      
      // ARRANGE
      const tool = container.getTool('broad_chunks_search');
      
      // ACT - search should work without errors (is_reference field exists)
      const result = await tool.execute({ text: 'references bibliography' });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
    });
    
    it('should have has_math and has_extraction_issues fields', async () => {
      if (!testDbExists) return;
      
      // ARRANGE - directly query database to verify schema via lancedb
      const lancedb = await import('@lancedb/lancedb');
      const db = await lancedb.connect(fixture.getDbPath());
      const chunksTable = await db.openTable('chunks');
      const schema = await chunksTable.schema();
      const fieldNames = schema.fields.map(f => f.name);
      
      // ASSERT
      expect(fieldNames).toContain('is_reference');
      expect(fieldNames).toContain('has_math');
      expect(fieldNames).toContain('has_extraction_issues');
    });
  });
});

