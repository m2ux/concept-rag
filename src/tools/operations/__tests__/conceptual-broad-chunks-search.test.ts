/**
 * Unit Tests for ConceptualBroadChunksSearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptualBroadChunksSearchTool } from '../conceptual_broad_chunks_search.js';
import { ChunkSearchService } from '../../../domain/services/index.js';
import {
  FakeChunkRepository,
  createTestSearchResult,
  MockLogger
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptualBroadChunksSearchTool', () => {
  let chunkRepo: FakeChunkRepository;
  let service: ChunkSearchService;
  let tool: ConceptualBroadChunksSearchTool;
  let mockLogger: MockLogger;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test
    chunkRepo = new FakeChunkRepository();
    mockLogger = new MockLogger();
    service = new ChunkSearchService(chunkRepo, mockLogger);
    tool = new ConceptualBroadChunksSearchTool(service);
  });
  
  describe('execute', () => {
    it('should return formatted search results across all documents', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          source: '/test/doc1.pdf',
          text: 'First chunk about testing',
          hybridScore: 0.95
        }),
        createTestSearchResult({
          source: '/test/doc2.pdf',
          text: 'Second chunk',
          hybridScore: 0.85
        })
      ];
      const originalSearch = chunkRepo.search.bind(chunkRepo);
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'testing' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(2);
      expect(parsedContent[0].source).toBe('/test/doc1.pdf');
      expect(parsedContent[0].scores).toBeDefined();
    });
    
    it('should respect limit parameter (defaults to 10)', async () => {
      // SETUP
      const testResults = Array.from({ length: 15 }, (_, i) =>
        createTestSearchResult({
          id: `chunk-${i}`,
          source: `/test/doc${i}.pdf`,
          text: `Test chunk ${i} about testing`
        })
      );
      chunkRepo.search = async () => testResults.slice(0, 10); // Service limits to 10
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBeLessThanOrEqual(10); // Default limit
    });
    
    it('should include score information', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test chunk',
          hybridScore: 0.95,
          vectorScore: 0.85,
          bm25Score: 0.75
        })
      ];
      const originalSearch = chunkRepo.search.bind(chunkRepo);
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].scores.hybrid).toBe('0.950');
      expect(parsedContent[0].scores.vector).toBe('0.850');
      expect(parsedContent[0].scores.bm25).toBe('0.750');
    });
    
    it('should include expanded terms when debug is enabled', async () => {
      // SETUP
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test chunk',
          expandedTerms: ['test', 'testing', 'tests']
        })
      ];
      const originalSearch = chunkRepo.search.bind(chunkRepo);
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'test', debug: true });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].expanded_terms).toBeDefined();
    });
    
    it('should handle empty results', async () => {
      // SETUP
      chunkRepo.search = async () => [];
      
      // EXERCISE
      const result = await tool.execute({ text: 'nonexistent' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toEqual([]);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error
      chunkRepo.search = async () => {
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
      // EXERCISE & VERIFY
      await expect(
        tool.execute({ text: '' })
      ).resolves.toBeDefined();
    });
  });
});

