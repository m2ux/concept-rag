/**
 * Unit Tests for DocumentConceptsExtractTool
 * 
 * Tests the MCP tool contract using test doubles (fakes/mocks).
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentConceptsExtractTool } from '../document_concepts_extract.js';
import {
  FakeCatalogRepository,
  createTestSearchResult
} from '../../../__tests__/test-helpers/index.js';

describe('DocumentConceptsExtractTool', () => {
  let catalogRepo: FakeCatalogRepository;
  let tool: DocumentConceptsExtractTool;
  
  beforeEach(() => {
    // SETUP - Fresh repository for each test
    catalogRepo = new FakeCatalogRepository();
    tool = new DocumentConceptsExtractTool(catalogRepo);
  });
  
  describe('execute', () => {
    it('should extract concepts from document in JSON format', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document about testing',
        concepts: JSON.stringify({
          primary_concepts: ['testing', 'quality assurance'],
          technical_terms: ['unit test', 'integration test'],
          related_concepts: ['test-driven development'],
          categories: ['software engineering'],
          summary: 'Document about testing practices'
        })
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
    
    it('should return error when document has no concepts', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document without concepts',
        concepts: undefined
      });
      catalogRepo.addDocument(testDoc);
      
      // EXERCISE
      const result = await tool.execute({ document_query: 'doc' });
      
      // VERIFY
      expect(result.isError).toBe(true);
      const parsedContent = JSON.parse(result.content[0].text);
      // Now returns structured error object
      expect(parsedContent.error).toBeDefined();
      expect(parsedContent.error.message).toContain('not found');
    });
    
    it('should format output as markdown when format is markdown', async () => {
      // SETUP
      const testDoc = createTestSearchResult({
        source: '/test/doc.pdf',
        text: 'Document about testing',
        concepts: JSON.stringify({
          primary_concepts: ['testing'],
          technical_terms: ['unit test'],
          related_concepts: ['tdd'],
          categories: ['software engineering'],
          summary: 'Test document'
        })
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
        concepts: JSON.stringify({
          primary_concepts: ['testing'],
          categories: ['software'],
          summary: 'Test summary'
        })
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

