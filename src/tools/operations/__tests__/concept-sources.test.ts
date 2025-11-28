/**
 * Unit Tests for ConceptSourcesTool
 * 
 * Tests the ConceptSourcesTool (per-concept source arrays).
 * Uses "Fake" repositories instead of real LanceDB for fast, isolated testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptSourcesTool } from '../concept_sources.js';
import { ConceptSourcesService } from '../../../domain/services/index.js';
import {
  FakeConceptRepository,
  FakeCatalogRepository,
  createTestConcept,
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('ConceptSourcesTool', () => {
  let conceptRepo: FakeConceptRepository;
  let catalogRepo: FakeCatalogRepository;
  let service: ConceptSourcesService;
  let tool: ConceptSourcesTool;
  
  beforeEach(() => {
    conceptRepo = new FakeConceptRepository();
    catalogRepo = new FakeCatalogRepository();
    service = new ConceptSourcesService(conceptRepo, catalogRepo);
    tool = new ConceptSourcesTool(service);
  });
  
  describe('single concept', () => {
    it('should return sources for a single concept', async () => {
      // Add catalog entries that the concept references
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/tdd-book.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 23456789, source: '/books/clean-code.pdf' }));
      
      const testConcept = createTestConcept({
        name: 'tdd',
        catalogIds: [12345678, 23456789]
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ name: 'tdd' });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['tdd']);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0]).toHaveLength(2); // 2 sources for tdd
    });
    
    it('should return empty array for not found concept', async () => {
      const result = await tool.execute({ name: 'nonexistent' });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['nonexistent']);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0]).toEqual([]); // Empty array for not found
    });
  });
  
  describe('multiple concepts (per-concept arrays)', () => {
    it('should return separate source arrays for each concept', async () => {
      // Add catalog entries
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/book-a.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 23456789, source: '/books/book-b.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 34567890, source: '/books/book-c.pdf' }));
      
      const concept1 = createTestConcept({
        name: 'tdd',
        catalogIds: [12345678, 23456789]
      });
      const concept2 = createTestConcept({
        name: 'di',
        catalogIds: [12345678, 23456789, 34567890]
      });
      conceptRepo.addConcept(concept1);
      conceptRepo.addConcept(concept2);
      
      const result = await tool.execute({ concept: ['tdd', 'di'] });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['tdd', 'di']);
      expect(parsed.results).toHaveLength(2);
      
      // results[0] = sources for 'tdd' (2 sources)
      expect(parsed.results[0]).toHaveLength(2);
      
      // results[1] = sources for 'di' (3 sources)
      expect(parsed.results[1]).toHaveLength(3);
    });
    
    it('should maintain position correspondence with input', async () => {
      // Add catalog entries
      catalogRepo.addDocument(createTestSearchResult({ id: 11111111, source: '/books/first-book.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 22222222, source: '/books/second-book.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 33333333, source: '/books/third-book.pdf' }));
      
      const concept1 = createTestConcept({
        name: 'first',
        catalogIds: [11111111]
      });
      const concept2 = createTestConcept({
        name: 'second',
        catalogIds: [22222222]
      });
      const concept3 = createTestConcept({
        name: 'third',
        catalogIds: [33333333]
      });
      conceptRepo.addConcept(concept1);
      conceptRepo.addConcept(concept2);
      conceptRepo.addConcept(concept3);
      
      const result = await tool.execute({ concept: ['first', 'second', 'third'] });
      const parsed = JSON.parse(result.content[0].text);
      
      // Position 0 should have 'first' sources
      expect(parsed.results[0][0].source_path).toContain('first');
      
      // Position 1 should have 'second' sources
      expect(parsed.results[1][0].source_path).toContain('second');
      
      // Position 2 should have 'third' sources
      expect(parsed.results[2][0].source_path).toContain('third');
    });
    
    it('should return empty array for not found concepts at correct position', async () => {
      // Add catalog entry for the concept that exists
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/exists-book.pdf' }));
      
      const testConcept = createTestConcept({
        name: 'exists',
        catalogIds: [12345678]
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ concept: ['nonexistent', 'exists', 'also-nonexistent'] });
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.results).toHaveLength(3);
      expect(parsed.results[0]).toEqual([]); // nonexistent
      expect(parsed.results[1]).toHaveLength(1); // exists
      expect(parsed.results[2]).toEqual([]); // also-nonexistent
    });
    
    it('should include source metadata (title, author, year)', async () => {
      // Add catalog entry
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/test-book.pdf' }));
      
      const testConcept = createTestConcept({
        name: 'test',
        catalogIds: [12345678]
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ name: 'test' });
      const parsed = JSON.parse(result.content[0].text);
      
      const source = parsed.results[0][0];
      expect(source.title).toBeDefined();
      expect(source.source_path).toBeDefined();
      // Author and year may be extracted depending on filename format
    });
  });
  
  describe('validation', () => {
    it('should reject empty concept string', async () => {
      const result = await tool.execute({ name: '' });
      expect(result.isError).toBe(true);
    });
    
    it('should reject empty array', async () => {
      const result = await tool.execute({ concept: [] });
      expect(result.isError).toBe(true);
    });
    
    it('should reject array of empty strings', async () => {
      const result = await tool.execute({ concept: ['', '  '] });
      expect(result.isError).toBe(true);
    });
  });
});
