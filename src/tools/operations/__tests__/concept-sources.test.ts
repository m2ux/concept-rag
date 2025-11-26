/**
 * Unit Tests for ConceptSourcesTool
 * 
 * Tests the ConceptSourcesTool using test doubles (fakes/mocks).
 * Demonstrates dependency injection for testing as described in:
 * - "Continuous Delivery" (Humble & Farley), Chapter 4
 * - "Test Driven Development for Embedded C" (Grenning), Chapter 7
 * 
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
    // SETUP - Fresh repositories and service for each test (test isolation)
    conceptRepo = new FakeConceptRepository();
    catalogRepo = new FakeCatalogRepository();
    service = new ConceptSourcesService(conceptRepo, catalogRepo);
    tool = new ConceptSourcesTool(service);
  });
  
  describe('execute', () => {
    it('should find all sources for a concept', async () => {
      // SETUP - Concept that appears in 3 documents
      const testConcept = createTestConcept({
        concept: 'test driven development',
        sources: [
          '/books/clean-code.pdf',
          '/books/tdd-by-example.pdf',
          '/books/refactoring.pdf'
        ],
        relatedConcepts: ['refactoring', 'unit testing', 'clean code'],
        chunkCount: 25
      });
      
      conceptRepo.addConcept(testConcept);
      
      // Add catalog entries for metadata enrichment
      catalogRepo.addDocument(createTestSearchResult({
        id: 'doc-1',
        source: '/books/clean-code.pdf',
        text: 'Clean Code by Robert Martin covers best practices...',
        concepts: { primary_concepts: ['clean code', 'tdd'], categories: ['Software Engineering'] }
      }));
      catalogRepo.addDocument(createTestSearchResult({
        id: 'doc-2',
        source: '/books/tdd-by-example.pdf',
        text: 'TDD by Example by Kent Beck teaches test driven development...',
        concepts: { primary_concepts: ['tdd', 'testing'], categories: ['Software Engineering'] }
      }));
      catalogRepo.addDocument(createTestSearchResult({
        id: 'doc-3',
        source: '/books/refactoring.pdf',
        text: 'Refactoring by Martin Fowler explains code improvement...',
        concepts: { primary_concepts: ['refactoring', 'design'], categories: ['Software Engineering'] }
      }));
      
      // EXERCISE
      const result = await tool.execute({ concept: 'test driven development' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.concept).toBe('test driven development');
      expect(parsedContent.source_count).toBe(3);
      expect(parsedContent.sources).toHaveLength(3);
      
      // Check sources have titles extracted from summaries (preferred) or paths (fallback)
      const titles = parsedContent.sources.map((s: any) => s.title);
      // Titles should be extracted from summary text first lines
      expect(titles.some((t: string) => t.includes('Clean Code'))).toBe(true);
      expect(titles.some((t: string) => t.includes('TDD by Example'))).toBe(true);
      expect(titles.some((t: string) => t.includes('Refactoring'))).toBe(true);
    });
    
    it('should include concept metadata in response', async () => {
      // SETUP
      const testConcept = createTestConcept({
        concept: 'dependency injection',
        category: 'software patterns',
        conceptType: 'terminology',
        weight: 0.85,
        chunkCount: 42,
        sources: ['/docs/patterns.pdf'],
        relatedConcepts: ['inversion of control', 'factory pattern', 'service locator']
      });
      
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'dependency injection' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.concept_metadata).toBeDefined();
      expect(parsedContent.concept_metadata.category).toBe('software patterns');
      expect(parsedContent.concept_metadata.type).toBe('terminology');
      expect(parsedContent.concept_metadata.chunk_count).toBe(42);
      expect(parsedContent.related_concepts).toContain('inversion of control');
    });
    
    it('should return error when concept not found', async () => {
      // SETUP - No concepts added
      
      // EXERCISE
      const result = await tool.execute({ concept: 'nonexistent concept' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toBe('CONCEPT_NOT_FOUND');
      expect(parsedContent.error.message).toContain('nonexistent concept');
    });
    
    it('should be case-insensitive', async () => {
      // SETUP
      const testConcept = createTestConcept({
        concept: 'machine learning',
        sources: ['/docs/ml-guide.pdf']
      });
      
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE - Search with different cases
      const result1 = await tool.execute({ concept: 'MACHINE LEARNING' });
      const result2 = await tool.execute({ concept: 'Machine Learning' });
      const result3 = await tool.execute({ concept: 'machine learning' });
      
      // VERIFY - All should return same results
      const content1 = JSON.parse(result1.content[0].text);
      const content2 = JSON.parse(result2.content[0].text);
      const content3 = JSON.parse(result3.content[0].text);
      
      expect(content1.source_count).toBe(1);
      expect(content2.source_count).toBe(1);
      expect(content3.source_count).toBe(1);
    });
    
    it('should respect include_metadata=false parameter', async () => {
      // SETUP
      const testConcept = createTestConcept({
        concept: 'microservices',
        sources: ['/docs/architecture.pdf']
      });
      
      conceptRepo.addConcept(testConcept);
      
      // Add catalog entry with rich metadata
      catalogRepo.addDocument(createTestSearchResult({
        id: 'doc-1',
        source: '/docs/architecture.pdf',
        text: 'Detailed guide to microservices architecture...',
        concepts: { primary_concepts: ['microservices', 'distributed systems'], categories: ['Architecture'] }
      }));
      
      // EXERCISE - Without metadata
      const result = await tool.execute({ 
        concept: 'microservices', 
        include_metadata: false 
      });
      
      // VERIFY - Should still work but source won't have summary/concepts
      expect(result.isError).toBe(false);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.sources[0].summary).toBeUndefined();
      expect(parsedContent.sources[0].primary_concepts).toBeUndefined();
    });
    
    it('should handle concept with single source', async () => {
      // SETUP
      const testConcept = createTestConcept({
        concept: 'singleton pattern',
        sources: ['/docs/design-patterns.pdf']
      });
      
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'singleton pattern' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.source_count).toBe(1);
      expect(parsedContent.sources).toHaveLength(1);
    });
    
    it('should handle concept with many sources', async () => {
      // SETUP - Concept that appears in many documents
      const sources = Array.from({ length: 10 }, (_, i) => `/books/book-${i + 1}.pdf`);
      const testConcept = createTestConcept({
        concept: 'object oriented programming',
        sources
      });
      
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'object oriented programming' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.source_count).toBe(10);
      expect(parsedContent.sources).toHaveLength(10);
    });
  });
  
  describe('validation', () => {
    it('should handle missing concept parameter gracefully', async () => {
      // EXERCISE & VERIFY
      const result = await tool.execute({ concept: '' });
      expect(result.isError).toBe(true);
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.code).toContain('VALIDATION');
    });
    
    it('should handle whitespace-only concept parameter', async () => {
      // EXERCISE
      const result = await tool.execute({ concept: '   ' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.error).toBeDefined();
    });
  });
  
  describe('title extraction', () => {
    it('should extract readable titles from file paths', async () => {
      // SETUP - Various file naming conventions
      const testConcept = createTestConcept({
        concept: 'agile development',
        sources: [
          '/books/Agile_Software_Development.pdf',
          '/docs/clean-architecture-guide.epub',
          '/papers/extreme_programming-explained.pdf'
        ]
      });
      
      conceptRepo.addConcept(testConcept);
      
      // EXERCISE
      const result = await tool.execute({ concept: 'agile development' });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      const titles = parsedContent.sources.map((s: any) => s.title);
      
      // Underscores and hyphens should be converted to spaces
      expect(titles).toContain('Agile Software Development');
      expect(titles).toContain('clean architecture guide');
      expect(titles).toContain('extreme programming explained');
    });
  });
});

