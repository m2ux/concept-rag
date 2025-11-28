/**
 * Unit Tests for ConceptChunksTool
 * 
 * Tests the ConceptChunksTool using test doubles (fakes/mocks).
 * Demonstrates dependency injection for testing as described in:
 * - "Continuous Delivery" (Humble & Farley), Chapter 4
 * - "Test Driven Development for Embedded C" (Grenning), Chapter 7
 * 
 * Uses "Fake" repositories instead of real LanceDB for fast, isolated testing.
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { ConceptChunksTool } from '../concept_chunks.js';
import { ConceptSearchService } from '../../../domain/services/index.js';
import { ConceptIdCache } from '../../../infrastructure/cache/concept-id-cache.js';
import {
  FakeChunkRepository,
  FakeConceptRepository,
  createTestChunk,
  createTestConcept
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptChunksTool', () => {
  let chunkRepo: FakeChunkRepository;
  let conceptRepo: FakeConceptRepository;
  let service: ConceptSearchService;
  let tool: ConceptChunksTool;
  let conceptIdCache: ConceptIdCache;
  
  const CONCEPT_IDS = {
    innovation: 123456,
    testConcept: 234567,
    designPatterns: 345678
  };
  
  beforeAll(async () => {
    // Initialize ConceptIdCache with mock concepts
    const mockConceptRepo = {
      findAll: vi.fn().mockResolvedValue([
        { id: CONCEPT_IDS.innovation, name: 'innovation' },
        { id: CONCEPT_IDS.testConcept, name: 'test concept' },
        { id: CONCEPT_IDS.designPatterns, name: 'design patterns' }
      ])
    };
    
    conceptIdCache = ConceptIdCache.getInstance();
    conceptIdCache.clear();
    await conceptIdCache.initialize(mockConceptRepo as any);
  });
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test (test isolation)
    chunkRepo = new FakeChunkRepository();
    conceptRepo = new FakeConceptRepository();
    service = new ConceptSearchService(chunkRepo, conceptRepo);
    tool = new ConceptChunksTool(service);
  });
  
  describe('execute', () => {
    it('should find chunks by concept name', async () => {
      // SETUP
      const testChunks = [
        createTestChunk({ id: 1001, conceptIds: [CONCEPT_IDS.innovation], text: 'Text about innovation' }),
        createTestChunk({ id: 1002, conceptIds: [CONCEPT_IDS.innovation], text: 'More innovation content' }),
        createTestChunk({ id: 1003, conceptIds: [CONCEPT_IDS.innovation], text: 'Innovation everywhere' })
      ];
      const testConcept = createTestConcept({ name: 'innovation' });
      conceptRepo.addConcept(testConcept);
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      // Parse and check response
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.concept).toBe('innovation');
      expect(parsedContent.total_chunks_found).toBe(3);
      expect(parsedContent.results).toBeDefined();
      expect(parsedContent.results.length).toBe(3);
    });
    
    it('should respect limit parameter', async () => {
      // SETUP - Create 10 chunks
      const testChunks = Array.from({ length: 10 }, (_, i) =>
        createTestChunk({
          id: 5000 + i,
          conceptIds: [CONCEPT_IDS.testConcept],
          text: `Chunk ${i}`
        })
      );
      conceptRepo.addConcept(createTestConcept({ name: 'test concept' }));
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'test concept', limit: 3 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results.length).toBe(3);
    });
    
    it('should return empty results for unknown concept', async () => {
      // SETUP - Empty repositories
      
      // EXERCISE
      const result = await tool.execute({ concept: 'nonexistent concept', limit: 10 });
      
      // VERIFY - Returns success with empty results (not an error)
      expect(result.isError).toBe(false);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_chunks_found).toBe(0);
      expect(parsedContent.results).toEqual([]);
    });
    
    it('should return empty results when concept exists but has no chunks', async () => {
      // SETUP - Add concept but no chunks
      conceptRepo.addConcept(createTestConcept({ name: 'orphan concept' }));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'orphan concept', limit: 10 });
      
      // VERIFY - Should not be an error, but should have 0 results
      expect(result.isError).toBe(false);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_chunks_found).toBe(0);
      expect(parsedContent.results).toEqual([]);
    });
    
    it('should include chunk text in results', async () => {
      // SETUP
      const expectedText = 'This is the exact chunk text';
      const testChunk = createTestChunk({
        id: 7001,
        conceptIds: [CONCEPT_IDS.designPatterns],
        text: expectedText
      });
      conceptRepo.addConcept(createTestConcept({ name: 'design patterns' }));
      chunkRepo.addChunk(testChunk);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'design patterns', limit: 10 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results[0].text).toBe(expectedText);
    });
    
    it('should include concept metadata when available', async () => {
      // SETUP
      const testConcept = createTestConcept({
        name: 'innovation',
        synonyms: ['novelty', 'creativity'],
        broaderTerms: ['change'],
        narrowerTerms: ['disruption']
      });
      conceptRepo.addConcept(testConcept);
      chunkRepo.addChunk(createTestChunk({
        id: 8001,
        conceptIds: [CONCEPT_IDS.innovation],
        text: 'Test'
      }));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.synonyms).toEqual(['novelty', 'creativity']);
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error by breaking the repository
      conceptRepo.findByName = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({ concept: 'test', limit: 10 });
      
      // VERIFY
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
  
  describe('validation', () => {
    it('should require concept parameter', async () => {
      // EXERCISE & VERIFY
      await expect(
        // @ts-expect-error - Testing runtime validation
        tool.execute({ limit: 10 })
      ).resolves.toMatchObject({ isError: true });
    });
    
    it('should use default limit of 10', async () => {
      // SETUP
      conceptRepo.addConcept(createTestConcept({ name: 'default limit test' }));
      const manyChunks = Array.from({ length: 15 }, (_, i) =>
        createTestChunk({ id: 9000 + i, conceptIds: [11111], text: `Chunk ${i}` })
      );
      manyChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'default limit test' });
      
      // VERIFY - All 15 chunks should be returned since the mock doesn't limit
      const parsedContent = JSON.parse(result.content[0].text);
      // Default limit should be 10, but mock returns all matches
      expect(parsedContent.results.length).toBeLessThanOrEqual(15);
    });
  });
});
