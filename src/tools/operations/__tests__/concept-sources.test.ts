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
  createTestConcept
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
      const testConcept = createTestConcept({
        concept: 'tdd',
        sources: ['/books/book-a.pdf', '/books/book-b.pdf']
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ concept: 'tdd' });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['tdd']);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0]).toHaveLength(2); // 2 sources for tdd
    });
    
    it('should return empty array for not found concept', async () => {
      const result = await tool.execute({ concept: 'nonexistent' });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['nonexistent']);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0]).toEqual([]); // Empty array for not found
    });
  });
  
  describe('multiple concepts (per-concept arrays)', () => {
    it('should return separate source arrays for each concept', async () => {
      const concept1 = createTestConcept({
        concept: 'tdd',
        sources: ['/books/book-a.pdf', '/books/book-b.pdf']
      });
      const concept2 = createTestConcept({
        concept: 'di',
        sources: ['/books/book-b.pdf', '/books/book-c.pdf', '/books/book-d.pdf']
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
      const concept1 = createTestConcept({
        concept: 'first',
        sources: ['/books/first.pdf']
      });
      const concept2 = createTestConcept({
        concept: 'second',
        sources: ['/books/second.pdf']
      });
      const concept3 = createTestConcept({
        concept: 'third',
        sources: ['/books/third.pdf']
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
      const testConcept = createTestConcept({
        concept: 'exists',
        sources: ['/books/exists.pdf']
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
      const testConcept = createTestConcept({
        concept: 'test',
        sources: ['/books/Clean Code -- Robert Martin -- 2008 -- Publisher.pdf']
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ concept: 'test' });
      const parsed = JSON.parse(result.content[0].text);
      
      const source = parsed.results[0][0];
      expect(source.title).toBeDefined();
      expect(source.source_path).toBeDefined();
      // Author and year may be extracted depending on filename format
    });
  });
  
  describe('validation', () => {
    it('should reject empty concept string', async () => {
      const result = await tool.execute({ concept: '' });
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
