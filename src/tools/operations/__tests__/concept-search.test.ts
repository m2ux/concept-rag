/**
 * Unit Tests for ConceptSearchTool
 * 
 * Tests the ConceptSearchTool using test doubles (fakes/mocks).
 * Demonstrates dependency injection for testing as described in:
 * - "Continuous Delivery" (Humble & Farley), Chapter 4
 * - "Test Driven Development for Embedded C" (Grenning), Chapter 7
 * 
 * Uses "Fake" repositories instead of real LanceDB for fast, isolated testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptSearchTool } from '../concept_search.js';
import { ConceptSearchService } from '../../../domain/services/index.js';
import {
  FakeChunkRepository,
  FakeConceptRepository,
  createTestChunk,
  createTestConcept
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptSearchTool', () => {
  let chunkRepo: FakeChunkRepository;
  let conceptRepo: FakeConceptRepository;
  let service: ConceptSearchService;
  let tool: ConceptSearchTool;
  
  beforeEach(() => {
    // SETUP - Fresh repositories and service for each test (test isolation)
    chunkRepo = new FakeChunkRepository();
    conceptRepo = new FakeConceptRepository();
    service = new ConceptSearchService(chunkRepo, conceptRepo);
    tool = new ConceptSearchTool(service);
  });
  
  describe('execute', () => {
    it('should find chunks by concept name', async () => {
      // SETUP
      const testChunks = [
        createTestChunk({ id: 'chunk-1', concepts: ['innovation'], text: 'Text about innovation' }),
        createTestChunk({ id: 'chunk-2', concepts: ['innovation'], text: 'More innovation content' }),
        createTestChunk({ id: 'chunk-3', concepts: ['innovation'], text: 'Innovation everywhere' })
      ];
      const testConcept = createTestConcept({ concept: 'innovation' });
      conceptRepo.addConcept(testConcept);
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results).toHaveLength(3);
      expect(parsedContent.results[0].text).toContain('innovation');
      expect(parsedContent.concept).toBe('innovation');
      expect(parsedContent.total_chunks_found).toBe(3);
    });
    
    it('should respect limit parameter', async () => {
      // SETUP
      const testChunks = Array.from({ length: 10 }, (_, i) =>
        createTestChunk({
          id: `chunk-${i}`,
          concepts: ['testing'],
          text: `Test chunk ${i}`
        })
      );
      const testConcept = createTestConcept({ concept: 'innovation' });
      conceptRepo.addConcept(testConcept);
      testChunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'testing', limit: 5 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results).toHaveLength(5);
    });
    
    it('should return empty array when concept not found', async () => {
      // SETUP - No concepts or chunks added
      
      // EXERCISE
      const result = await tool.execute({ concept: 'nonexistent', limit: 10 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results).toEqual([]);
      expect(parsedContent.total_chunks_found).toBe(0);
    });
    
    it('should handle concept with no matching chunks', async () => {
      // SETUP
      const testConcept = createTestConcept({ concept: 'innovation' });
      conceptRepo.addConcept(testConcept);
      // No chunks added
      
      // EXERCISE
      const result = await tool.execute({ concept: 'orphan', limit: 10 });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results).toEqual([]);
      expect(parsedContent.total_chunks_found).toBe(0);
    });
    
    it('should be case-insensitive', async () => {
      // SETUP
      const testConcept = createTestConcept({ concept: 'innovation' });
      const testChunk = createTestChunk({ concepts: ['innovation'] });
      
      conceptRepo.addConcept(testConcept);
      chunkRepo.addChunk(testChunk);
      
      // EXERCISE - Search with different case
      const result1 = await tool.execute({ concept: 'INNOVATION', limit: 10 });
      const result2 = await tool.execute({ concept: 'Innovation', limit: 10 });
      const result3 = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY - All should return same results
      const content1 = JSON.parse(result1.content[0].text);
      const content2 = JSON.parse(result2.content[0].text);
      const content3 = JSON.parse(result3.content[0].text);
      
      expect(content1.results).toHaveLength(1);
      expect(content2.results).toHaveLength(1);
      expect(content3.results).toHaveLength(1);
    });
    
    it('should filter chunks by concept correctly', async () => {
      // SETUP
      const innovationConcept = createTestConcept({ concept: 'innovation' });
      const creativityConcept = createTestConcept({ concept: 'creativity' });
      
      const chunks = [
        createTestChunk({ id: 'chunk-1', concepts: ['innovation'] }),
        createTestChunk({ id: 'chunk-2', concepts: ['creativity'] }),
        createTestChunk({ id: 'chunk-3', concepts: ['innovation', 'creativity'] }),
        createTestChunk({ id: 'chunk-4', concepts: ['other'] })
      ];
      
      conceptRepo.addConcept(innovationConcept);
      conceptRepo.addConcept(creativityConcept);
      chunks.forEach(chunk => chunkRepo.addChunk(chunk));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'innovation', limit: 10 });
      
      // VERIFY - Should only get chunks 1 and 3
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results).toHaveLength(2);
      // Note: ConceptSearchTool doesn't include IDs in results, check source instead
      const sources = parsedContent.results.map((r: any) => r.source);
      expect(sources).toHaveLength(2);
    });
  });
  
  describe('validation', () => {
    it('should handle missing concept parameter gracefully', async () => {
      // EXERCISE & VERIFY
      await expect(
        tool.execute({ concept: '', limit: 10 })
      ).resolves.toBeDefined();
    });
    
    it('should handle negative limit', async () => {
      // SETUP
      const testConcept = createTestConcept({ concept: 'test' });
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'test', limit: -5 });
      
      // VERIFY - Should return error due to validation
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toContain('VALIDATION');
    });
    
    it('should handle very large limit', async () => {
      // SETUP
      const testConcept = createTestConcept({ concept: 'test' });
      const testChunk = createTestChunk({ concepts: ['test'] });
      
      conceptRepo.addConcept(testConcept);
      chunkRepo.addChunk(testChunk);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'test', limit: 10000 });
      
      // VERIFY - Should return error due to validation (limit out of range)
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toContain('VALIDATION');
    });
  });
});

