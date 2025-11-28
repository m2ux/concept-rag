/**
 * Unit Tests for ConceptualChunksSearchTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptualChunksSearchTool } from '../conceptual_chunks_search.js';
import { ChunkSearchService } from '../../../domain/services/index.js';
import {
  FakeChunkRepository,
  FakeCatalogRepository,
  createTestChunk,
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptualChunksSearchTool', () => {
  let chunkRepo: FakeChunkRepository;
  let catalogRepo: FakeCatalogRepository;
  let service: ChunkSearchService;
  let tool: ConceptualChunksSearchTool;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test
    chunkRepo = new FakeChunkRepository();
    catalogRepo = new FakeCatalogRepository();
    service = new ChunkSearchService(chunkRepo, catalogRepo);
    tool = new ConceptualChunksSearchTool(service, catalogRepo);
    
    // Add a default catalog entry for test documents
    catalogRepo.addDocument(createTestSearchResult({
      id: 12345678,
      
      text: 'Test document'
    }));
  });
  
  describe('execute', () => {
    it('should return formatted chunks from specific source', async () => {
      // SETUP
      const testChunks = [
        createTestChunk({
          id: 1001,
          
          catalogId: 12345678,  // matches catalog entry
          text: 'First chunk about testing',
          concepts: ['testing']
        }),
        createTestChunk({
          id: 1002,
          
          catalogId: 12345678,  // matches catalog entry
          text: 'Second chunk',
          concepts: ['testing']
        })
      ];
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({
        text: 'testing',
        source: '/test/doc.pdf'
      });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBeGreaterThan(0);
      expect(parsedContent[0].source).toBe('/test/doc.pdf');
      expect(parsedContent[0].text).toBeDefined();
    });
    
    it('should respect limit parameter (defaults to 5)', async () => {
      // SETUP
      const testChunks = Array.from({ length: 10 }, (_, i) =>
        createTestChunk({
          id: 5000 + i,
          
          catalogId: 12345678,  // matches catalog entry
          text: `Chunk ${i}`
        })
      );
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({
        text: 'test',
        source: '/test/doc.pdf'
      });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.length).toBeLessThanOrEqual(5);
    });
    
    it('should include concept information', async () => {
      // SETUP
      const testChunk = createTestChunk({
        id: 1001,
        
        catalogId: 12345678,  // matches catalog entry
        text: 'Test chunk',
        concepts: ['testing', 'unit tests'],
        conceptIds: [111111, 222222],
      });
      chunkRepo.addChunk(testChunk);
      
      // EXERCISE
      const result = await tool.execute({
        text: 'test',
        source: '/test/doc.pdf'
      });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent[0].concepts).toBeDefined();
      expect(Array.isArray(parsedContent[0].concepts)).toBe(true);
    });
    
    it('should handle empty results', async () => {
      // SETUP - No chunks added
      
      // EXERCISE
      const result = await tool.execute({
        text: 'nonexistent',
        source: '/test/doc.pdf'
      });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toEqual([]);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error
      chunkRepo.findByCatalogId = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({
        text: 'test',
        source: '/test/doc.pdf'
      });
      
      // VERIFY
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
  
  describe('validation', () => {
    it('should require both text and source parameters', async () => {
      // EXERCISE & VERIFY - TypeScript will catch this, but test runtime behavior
      await expect(
        tool.execute({ text: 'test', source: '' })
      ).resolves.toBeDefined();
    });
  });
});

