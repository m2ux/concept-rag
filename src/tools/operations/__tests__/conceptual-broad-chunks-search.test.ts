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
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptualBroadChunksSearchTool', () => {
  let chunkRepo: FakeChunkRepository;
  let service: ChunkSearchService;
  let tool: ConceptualBroadChunksSearchTool;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test
    chunkRepo = new FakeChunkRepository();
    service = new ChunkSearchService(chunkRepo);
    tool = new ConceptualBroadChunksSearchTool(service);
  });
  
  describe('execute', () => {
    it('should return formatted search results across all documents', async () => {
      // SETUP - scores very close together (< 0.01 gap) so both are in same cluster
      const testResults = [
        createTestSearchResult({
          source: '/test/doc1.pdf',
          text: 'First chunk about testing',
          hybridScore: 0.95
        }),
        createTestSearchResult({
          source: '/test/doc2.pdf',
          text: 'Second chunk',
          hybridScore: 0.948  // Gap of 0.002 - below 0.01 threshold, so same cluster
        })
      ];
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
      expect(parsedContent).toHaveLength(2);  // Both in same cluster
      expect(parsedContent[0].source).toBe('/test/doc1.pdf');
      expect(parsedContent[0].score).toBeDefined();  // Hybrid score always shown
    });
    
    it('should use gap detection to filter results (no fixed limit)', async () => {
      // SETUP - create results with a clear score gap
      // High cluster: 0.90, 0.88, 0.85, 0.82
      // Gap: 0.42 (largest)
      // Low cluster: 0.40, 0.38, 0.35
      const testResults = [
        createTestSearchResult({ id: 5000, source: '/test/doc0.pdf', text: 'Test 0', hybridScore: 0.90 }),
        createTestSearchResult({ id: 5001, source: '/test/doc1.pdf', text: 'Test 1', hybridScore: 0.88 }),
        createTestSearchResult({ id: 5002, source: '/test/doc2.pdf', text: 'Test 2', hybridScore: 0.85 }),
        createTestSearchResult({ id: 5003, source: '/test/doc3.pdf', text: 'Test 3', hybridScore: 0.82 }),
        createTestSearchResult({ id: 5004, source: '/test/doc4.pdf', text: 'Test 4', hybridScore: 0.40 }),
        createTestSearchResult({ id: 5005, source: '/test/doc5.pdf', text: 'Test 5', hybridScore: 0.38 }),
        createTestSearchResult({ id: 5006, source: '/test/doc6.pdf', text: 'Test 6', hybridScore: 0.35 })
      ];
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY - gap detection should return only high cluster (4 results)
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBe(4);
      expect(parsedContent[0].score).toBe('0.900');
      expect(parsedContent[3].score).toBe('0.820');
    });
    
    it('should include score information', async () => {
      // SETUP - single result (gap detection returns it)
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test chunk',
          hybridScore: 0.95,
          vectorScore: 0.85,
          bm25Score: 0.75
        })
      ];
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'test' });
      
      // VERIFY - hybrid score always shown as 'score', components only in debug
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBe(1);
      expect(parsedContent[0].score).toBe('0.950');
      expect(parsedContent[0].score_components).toBeUndefined();  // Not in debug mode
    });
    
    it('should include expanded terms when debug is enabled', async () => {
      // SETUP - single result (gap detection returns it)
      const testResults = [
        createTestSearchResult({
          source: '/test/doc.pdf',
          text: 'Test chunk',
          hybridScore: 0.90,
          expandedTerms: ['test', 'testing', 'tests']
        })
      ];
      chunkRepo.search = async () => testResults;
      
      // EXERCISE
      const result = await tool.execute({ text: 'test', debug: true });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBe(1);
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

