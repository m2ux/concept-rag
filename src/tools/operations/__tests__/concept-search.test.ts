/**
 * Unit Tests for ConceptSearchTool
 * 
 * Tests the ConceptSearchTool using test doubles (fakes/mocks).
 * 
 * NOTE: ConceptSearchTool uses ConceptSearchService internally.
 * The service name will be consolidated to ConceptSearchService in a future refactor.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptSearchTool } from '../concept_search.js';
import { ConceptSearchService } from '../../../domain/services/concept-search-service.js';
import {
  FakeChunkRepository,
  FakeConceptRepository,
  FakeCatalogRepository,
  createTestChunk,
  createTestConcept
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptSearchTool', () => {
  let chunkRepo: FakeChunkRepository;
  let conceptRepo: FakeConceptRepository;
  let catalogRepo: FakeCatalogRepository;
  let service: ConceptSearchService;
  let tool: ConceptSearchTool;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test (test isolation)
    chunkRepo = new FakeChunkRepository();
    conceptRepo = new FakeConceptRepository();
    catalogRepo = new FakeCatalogRepository();
    service = new ConceptSearchService(conceptRepo, chunkRepo, catalogRepo);
    tool = new ConceptSearchTool(service);
  });
  
  describe('execute', () => {
    it('should find chunks by concept name', async () => {
      // SETUP - Create concept with catalogIds linking to catalog entries
      const catalogId = 12345678;
      const testConcept = createTestConcept({ 
        name: 'innovation',
        catalogIds: [catalogId]
      });
      conceptRepo.addConcept(testConcept);
      
      // Create catalog entry via constructor (FakeCatalogRepository doesn't have addEntry)
      const catalogEntry = {
        id: catalogId,
        source: '/docs/innovation.pdf',
        text: 'A document about innovation',
        hash: 'abc123',
        embeddings: [],
        distance: 0,
        hybridScore: 1,
        vectorScore: 0,
        bm25Score: 0,
        titleScore: 0,
        wordnetScore: 0,
        catalogId: catalogId
      };
      catalogRepo = new FakeCatalogRepository([catalogEntry]);
      // Recreate service with updated catalogRepo
      service = new ConceptSearchService(conceptRepo, chunkRepo, catalogRepo);
      tool = new ConceptSearchTool(service);
      
      // Create chunks linked to catalog
      const testChunks = [
        createTestChunk({ id: 1, catalogId, conceptIds: [1], text: 'Text about innovation' }),
        createTestChunk({ id: 2, catalogId, conceptIds: [1], text: 'More innovation content' }),
        createTestChunk({ id: 3, catalogId, conceptIds: [1], text: 'Innovation everywhere' })
      ];
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.concept).toBe('innovation');
      // ConceptSearchService returns 'chunks' not 'results'
      expect(parsedContent.chunks).toBeDefined();
    });
    
    it('should return empty result when concept not found', async () => {
      // SETUP - No concepts added
      
      // EXERCISE
      const result = await tool.execute({ concept: 'nonexistent', limit: 10 });
      
      // VERIFY - Should return empty result, not error
      expect(result.isError).toBe(false);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.chunks).toEqual([]);
      expect(parsedContent.stats.total_chunks).toBe(0);
    });
    
    it('should handle empty concept parameter', async () => {
      // EXERCISE
      const result = await tool.execute({ concept: '', limit: 10 });
      
      // VERIFY - Should return validation error
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('validation', () => {
    it('should handle missing concept parameter gracefully', async () => {
      // EXERCISE
      const result = await tool.execute({ concept: '', limit: 10 });
      
      // VERIFY - Should return validation error
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
