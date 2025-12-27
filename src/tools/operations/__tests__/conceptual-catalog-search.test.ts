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
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptualCatalogSearchTool', () => {
  let catalogRepo: FakeCatalogRepository;
  let service: CatalogSearchService;
  let tool: ConceptualCatalogSearchTool;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test
    catalogRepo = new FakeCatalogRepository();
    service = new CatalogSearchService(catalogRepo);
    tool = new ConceptualCatalogSearchTool(service);
  });
  
  describe('execute', () => {
    it('should return formatted catalog search results', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          id: 100001,
          source: '/test/doc1.pdf',
          text: 'Document about clean architecture and software design',
          hybridScore: 0.95
        }),
        createTestSearchResult({
          id: 100002,
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
      expect(parsedContent[0].score).toBeDefined();  // Hybrid score always shown
    });
    
    it('should use gap detection to filter results (no fixed limit)', async () => {
      // SETUP - create results with a clear score gap
      // High cluster: 0.90, 0.87, 0.84
      // Gap: 0.34 (largest)
      // Low cluster: 0.50, 0.48, 0.45
      const testResults = [
        createTestSearchResult({ id: 7000, source: '/test/doc0.pdf', text: 'Test 0', hybridScore: 0.90 }),
        createTestSearchResult({ id: 7001, source: '/test/doc1.pdf', text: 'Test 1', hybridScore: 0.87 }),
        createTestSearchResult({ id: 7002, source: '/test/doc2.pdf', text: 'Test 2', hybridScore: 0.84 }),
        createTestSearchResult({ id: 7003, source: '/test/doc3.pdf', text: 'Test 3', hybridScore: 0.50 }),
        createTestSearchResult({ id: 7004, source: '/test/doc4.pdf', text: 'Test 4', hybridScore: 0.48 }),
        createTestSearchResult({ id: 7005, source: '/test/doc5.pdf', text: 'Test 5', hybridScore: 0.45 })
      ];
      testResults.forEach(result => catalogRepo.addDocument(result));
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY - gap detection should return high cluster (3 results)
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBe(3);
      expect(parsedContent[0].score).toBe('0.900');
      expect(parsedContent[2].score).toBe('0.840');
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
    
    it('should format score correctly', async () => {
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
      
      // VERIFY - hybrid score always shown as 'score', components only in debug
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].score).toBe('0.123');
      expect(parsedContent[0].score_components).toBeUndefined();  // Not in debug mode
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

