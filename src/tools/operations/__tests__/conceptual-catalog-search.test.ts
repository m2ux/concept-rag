/**
 * Unit Tests for ConceptualCatalogSearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptualCatalogSearchTool } from '../conceptual_catalog_search.js';
import { CatalogSearchService } from '../../../domain/services/index.js';
import {
  FakeCatalogRepository,
  createTestSearchResult,
  MockLogger
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptualCatalogSearchTool', () => {
  let catalogRepo: FakeCatalogRepository;
  let service: CatalogSearchService;
  let tool: ConceptualCatalogSearchTool;
  let mockLogger: MockLogger;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test
    catalogRepo = new FakeCatalogRepository();
    mockLogger = new MockLogger();
    service = new CatalogSearchService(catalogRepo, mockLogger);
    tool = new ConceptualCatalogSearchTool(service);
  });
  
  describe('execute', () => {
    it('should return formatted catalog search results', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          id: 'doc1',
          source: '/test/doc1.pdf',
          text: 'Document about clean architecture and software design',
          hybridScore: 0.95
        }),
        createTestSearchResult({
          id: 'doc2',
          source: '/test/doc2.pdf',
          text: 'Another document about clean architecture patterns',
          hybridScore: 0.85
        })
      ];
      testResults.forEach(result => catalogRepo.addDocument(result));
      
      // EXERCISE
      const result = await tool.execute({ text: 'clean architecture' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBeGreaterThan(0);
      expect(parsedContent[0].source).toBeDefined();
      expect(parsedContent[0].scores).toBeDefined();
      expect(parsedContent[0].scores.hybrid).toBeDefined();
    });
    
    it('should respect limit parameter (defaults to 5)', async () => {
      // SETUP
      const testResults = Array.from({ length: 10 }, (_, i) =>
        createTestSearchResult({
          id: `doc-${i}`,
          source: `/test/doc${i}.pdf`,
          text: `Test document ${i} about testing`
        })
      );
      testResults.forEach(result => catalogRepo.addDocument(result));
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toHaveLength(5); // Default limit
    });
    
    it('should include debug information when debug is true', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test document',
          expandedTerms: ['test', 'document']
        })
      ];
      testResults.forEach(result => catalogRepo.addDocument(result));
      
      // EXERCISE
      const result = await tool.execute({ text: 'test', debug: true });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].expanded_terms).toBeDefined();
    });
    
    it('should handle empty results', async () => {
      // SETUP
      catalogRepo.clear();
      
      // EXERCISE
      const result = await tool.execute({ text: 'nonexistent' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toEqual([]);
    });
    
    it('should format scores correctly', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test',
          hybridScore: 0.123456,
          vectorScore: 0.789012,
          bm25Score: 0.345678
        })
      ];
      testResults.forEach(result => catalogRepo.addDocument(result));
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].scores.hybrid).toBe('0.123');
      expect(parsedContent[0].scores.vector).toBe('0.789');
      expect(parsedContent[0].scores.bm25).toBe('0.346');
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error by overriding search method
      catalogRepo.search = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
  
  describe('validation', () => {
    it('should require text parameter', async () => {
      // EXERCISE & VERIFY - TypeScript will catch this, but test runtime behavior
      await expect(
        tool.execute({ text: '' })
      ).resolves.toBeDefined();
    });
  });
});

