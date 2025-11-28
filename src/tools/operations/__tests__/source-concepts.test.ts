/**
 * Unit Tests for SourceConceptsTool
 * 
 * Tests the SourceConceptsTool (union of sources with concept_indices).
 * Uses "Fake" repositories instead of real LanceDB for fast, isolated testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SourceConceptsTool } from '../source_concepts.js';
import { ConceptSourcesService } from '../../../domain/services/index.js';
import {
  FakeConceptRepository,
  FakeCatalogRepository,
  createTestConcept,
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('SourceConceptsTool', () => {
  let conceptRepo: FakeConceptRepository;
  let catalogRepo: FakeCatalogRepository;
  let service: ConceptSourcesService;
  let tool: SourceConceptsTool;
  
  beforeEach(() => {
    conceptRepo = new FakeConceptRepository();
    catalogRepo = new FakeCatalogRepository();
    service = new ConceptSourcesService(conceptRepo, catalogRepo);
    tool = new SourceConceptsTool(service);
  });
  
  describe('single concept', () => {
    it('should find all sources for a single concept', async () => {
      // Add catalog entries that the concept references
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/tdd-book.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 23456789, source: '/books/clean-code.pdf' }));
      
      const testConcept = createTestConcept({
        concept: 'test driven development',
        catalogIds: [12345678, 23456789]
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ concept: 'test driven development' });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.concepts_searched).toEqual(['test driven development']);
      expect(parsed.concepts_found).toEqual(['test driven development']);
      expect(parsed.source_count).toBe(2);
      expect(parsed.sources).toHaveLength(2);
    });
    
    it('should return error when concept not found', async () => {
      const result = await tool.execute({ concept: 'nonexistent' });
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('CONCEPT_NOT_FOUND');
    });
  });
  
  describe('multiple concepts (union)', () => {
    it('should return union of sources with concept_indices', async () => {
      // Add catalog entries for the concepts
      catalogRepo.addDocument(createTestSearchResult({ id: 11111111, source: '/books/book-a.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 22222222, source: '/books/book-b.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 33333333, source: '/books/book-c.pdf' }));
      
      // Setup: Two concepts with overlapping sources
      const concept1 = createTestConcept({
        concept: 'tdd',
        catalogIds: [11111111, 22222222] // book-a, book-b
      });
      const concept2 = createTestConcept({
        concept: 'di',
        catalogIds: [22222222, 33333333] // book-b, book-c
      });
      conceptRepo.addConcept(concept1);
      conceptRepo.addConcept(concept2);
      
      const result = await tool.execute({ concept: ['tdd', 'di'] });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      
      expect(parsed.concepts_searched).toEqual(['tdd', 'di']);
      expect(parsed.concepts_found).toEqual(['tdd', 'di']);
      expect(parsed.source_count).toBe(3); // Union: book-a, book-b, book-c
      
      // Find book-b which should have both concept indices
      const bookB = parsed.sources.find((s: any) => s.source_path.includes('book-b'));
      expect(bookB.concept_indices).toEqual([0, 1]); // Both concepts
      
      // Find book-a which should only have index 0
      const bookA = parsed.sources.find((s: any) => s.source_path.includes('book-a'));
      expect(bookA.concept_indices).toEqual([0]);
      
      // Find book-c which should only have index 1
      const bookC = parsed.sources.find((s: any) => s.source_path.includes('book-c'));
      expect(bookC.concept_indices).toEqual([1]);
    });
    
    it('should sort by number of matching concepts (most first)', async () => {
      // Add catalog entries
      catalogRepo.addDocument(createTestSearchResult({ id: 11111111, source: '/books/matches-both.pdf' }));
      catalogRepo.addDocument(createTestSearchResult({ id: 22222222, source: '/books/matches-one.pdf' }));
      
      const concept1 = createTestConcept({
        concept: 'concept1',
        catalogIds: [11111111, 22222222] // both books
      });
      const concept2 = createTestConcept({
        concept: 'concept2',
        catalogIds: [11111111] // only matches-both
      });
      conceptRepo.addConcept(concept1);
      conceptRepo.addConcept(concept2);
      
      const result = await tool.execute({ concept: ['concept1', 'concept2'] });
      const parsed = JSON.parse(result.content[0].text);
      
      // Book matching both concepts should be first
      expect(parsed.sources[0].source_path).toContain('matches-both');
      expect(parsed.sources[0].concept_indices).toEqual([0, 1]);
    });
    
    it('should handle partial matches (some concepts not found)', async () => {
      // Add catalog entry
      catalogRepo.addDocument(createTestSearchResult({ id: 12345678, source: '/books/exists-book.pdf' }));
      
      const testConcept = createTestConcept({
        concept: 'exists',
        catalogIds: [12345678]
      });
      conceptRepo.addConcept(testConcept);
      
      const result = await tool.execute({ concept: ['exists', 'nonexistent'] });
      
      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.concepts_found).toEqual(['exists']);
      expect(parsed.concepts_not_found).toEqual(['nonexistent']);
      expect(parsed.source_count).toBe(1);
    });
    
    it('should return error only when ALL concepts not found', async () => {
      const result = await tool.execute({ concept: ['nope1', 'nope2'] });
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('CONCEPT_NOT_FOUND');
    });
  });
  
  describe('validation', () => {
    it('should reject empty concept', async () => {
      const result = await tool.execute({ concept: '' });
      expect(result.isError).toBe(true);
    });
    
    it('should reject empty array', async () => {
      const result = await tool.execute({ concept: [] });
      expect(result.isError).toBe(true);
    });
  });
});
