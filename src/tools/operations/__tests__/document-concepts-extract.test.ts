/**
 * Unit Tests for DocumentConceptsExtractTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { DocumentConceptsExtractTool } from '../document_concepts_extract.js';
import { ConceptIdCache } from '../../../infrastructure/cache/concept-id-cache.js';
import {
  FakeCatalogRepository,
  FakeConceptRepository,
  createTestSearchResult,
  createTestConcept
} from '../../../__tests__/test-helpers/index.js';

describe('DocumentConceptsExtractTool', () => {
  let catalogRepo: FakeCatalogRepository;
  let conceptIdCache: ConceptIdCache;
  let tool: DocumentConceptsExtractTool;
  
  // Test concept IDs - use hashToId logic to generate these
  const CONCEPT_IDS = {
    testing: 11111111,
    softwareDesign: 22222222,
    architecture: 33333333,
    patterns: 44444444
  };
  
  beforeAll(async () => {
    // Create a mock concept repository with known IDs
    const mockConceptRepo = {
      findAll: vi.fn().mockResolvedValue([
        { id: CONCEPT_IDS.testing, name: 'testing' },
        { id: CONCEPT_IDS.softwareDesign, name: 'software design' },
        { id: CONCEPT_IDS.architecture, name: 'architecture' },
        { id: CONCEPT_IDS.patterns, name: 'patterns' }
      ])
    };
    
    conceptIdCache = ConceptIdCache.getInstance();
    conceptIdCache.clear();
    await conceptIdCache.initialize(mockConceptRepo as any);
  });
  
  beforeEach(() => {
    // SETUP - Fresh repository for each test
    catalogRepo = new FakeCatalogRepository();
    tool = new DocumentConceptsExtractTool(catalogRepo, undefined, undefined, conceptIdCache);
  });
  
  describe('execute', () => {
    it('should extract concepts from document in JSON format', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document about testing',
        conceptIds: [CONCEPT_IDS.testing, CONCEPT_IDS.softwareDesign, CONCEPT_IDS.architecture, CONCEPT_IDS.patterns],
      });
      catalogRepo.addDocument(testDoc);
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'testing' });
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.document).toBe('/test/doc.pdf');
      expect(parsedContent.primary_concepts).toContain('testing');
      expect(parsedContent.total_concepts).toBeGreaterThan(0);
    });
    
    it('should return error when document not found', async () => {
      // SETUP
      catalogRepo.clear();
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'nonexistent' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      // Now returns structured error object
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.message).toContain('not found');
    });
    
    it('should return empty concepts when document has no concepts', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document without concepts',
        conceptIds: undefined,
      });
      catalogRepo.addDocument(testDoc);
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'doc' });
      
      // VERIFY - Document exists but has no concepts, which is a valid state
      expect(result.isError).toBe(false);
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.primary_concepts).toEqual([]);
      expect(parsedContent.total_concepts).toBe(0);
    });
    
    it('should format output as markdown when format is markdown', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document about testing',
        conceptIds: [CONCEPT_IDS.testing, CONCEPT_IDS.softwareDesign, CONCEPT_IDS.architecture],
      });
      catalogRepo.addDocument(testDoc);
      
      // EXERCISE
      const result = await tool.execute({
        document_query: 'testing',
        format: 'markdown'
      });
      
      // VERIFY
      expect(result.content[0].type).toBe('text');
      const markdown = result.content[0].text;
      expect(markdown).toContain('# Concepts Extracted from Document');
      expect(markdown).toContain('## Primary Concepts');
      expect(markdown).toContain('testing');
    });
    
    it('should exclude summary when include_summary is false', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document',
        conceptIds: [CONCEPT_IDS.testing],
      });
      catalogRepo.addDocument(testDoc);
      
      // EXERCISE
      const result = await tool.execute({
        document_query: 'testing',
        include_summary: false
      });
      
      // VERIFY
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.summary).toBeUndefined();
      expect(parsedContent.categories).toBeUndefined();
    });
    
    it('should handle errors gracefully', async () => {
      // SETUP - Simulate error
      catalogRepo.search = async () => {
        throw new Error('Database error');
      };
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'test' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Database error');
    });
  });
});
