/**
 * Unit Tests for Integration Test Data Builders
 * 
 * Tests the test data builder functions to ensure they create
 * correct data structures for integration testing.
 */

import { describe, it, expect } from 'vitest';
import {
  createIntegrationTestCatalogEntry,
  createIntegrationTestChunk,
  createIntegrationTestConcept,
  createIntegrationTestCategory,
  IntegrationCatalogData,
  TEST_CATALOG_IDS,
  TEST_CONCEPTS,
  TEST_CATEGORIES
} from './integration-test-data.js';

describe('Integration Test Data Builders', () => {
  describe('createIntegrationTestCatalogEntry', () => {
    it('should create catalog entry with all required fields', () => {
      const entry = createIntegrationTestCatalogEntry();
      
      // Core fields
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe('number');
      expect(entry.source).toBeDefined();
      expect(typeof entry.source).toBe('string');
      expect(entry.title).toBeDefined();
      expect(entry.summary).toBeDefined();
      expect(entry.hash).toBeDefined();
      expect(entry.vector).toBeDefined();
      expect(Array.isArray(entry.vector)).toBe(true);
      expect(entry.vector.length).toBe(384);
    });
    
    it('should include concept and category arrays', () => {
      const entry = createIntegrationTestCatalogEntry();
      
      expect(Array.isArray(entry.concept_ids)).toBe(true);
      expect(Array.isArray(entry.concept_names)).toBe(true);
      expect(Array.isArray(entry.category_ids)).toBe(true);
      expect(Array.isArray(entry.category_names)).toBe(true);
    });
    
    it('should include bibliographic fields', () => {
      const entry = createIntegrationTestCatalogEntry();
      
      expect(typeof entry.author).toBe('string');
      expect(typeof entry.year).toBe('number');
      expect(typeof entry.publisher).toBe('string');
      expect(typeof entry.isbn).toBe('string');
      expect(typeof entry.origin_hash).toBe('string');
    });
    
    it('should include research paper metadata fields with defaults', () => {
      const entry = createIntegrationTestCatalogEntry();
      
      // All new fields should be present
      expect(entry.document_type).toBeDefined();
      expect(entry.doi).toBeDefined();
      expect(entry.arxiv_id).toBeDefined();
      expect(entry.venue).toBeDefined();
      expect(entry.keywords).toBeDefined();
      expect(entry.abstract).toBeDefined();
      expect(entry.authors).toBeDefined();
      
      // Default values for books
      expect(entry.document_type).toBe('book');
      expect(entry.doi).toBe('');
      expect(entry.arxiv_id).toBe('');
      expect(entry.venue).toBe('');
      expect(entry.abstract).toBe('');
      
      // Arrays should have placeholder values for LanceDB type inference
      expect(Array.isArray(entry.keywords)).toBe(true);
      expect(Array.isArray(entry.authors)).toBe(true);
    });
    
    it('should allow overriding research paper fields', () => {
      const entry = createIntegrationTestCatalogEntry({
        document_type: 'paper',
        doi: '10.1234/test.2024',
        arxiv_id: '2404.12345v1',
        venue: 'Test Conference 2024',
        keywords: ['test', 'unit testing', 'integration'],
        abstract: 'This is a test abstract.',
        authors: ['John Doe', 'Jane Smith']
      });
      
      expect(entry.document_type).toBe('paper');
      expect(entry.doi).toBe('10.1234/test.2024');
      expect(entry.arxiv_id).toBe('2404.12345v1');
      expect(entry.venue).toBe('Test Conference 2024');
      expect(entry.keywords).toEqual(['test', 'unit testing', 'integration']);
      expect(entry.abstract).toBe('This is a test abstract.');
      expect(entry.authors).toEqual(['John Doe', 'Jane Smith']);
    });
    
    it('should allow overriding bibliographic fields', () => {
      const entry = createIntegrationTestCatalogEntry({
        title: 'Custom Title',
        author: 'Custom Author',
        year: 2023,
        publisher: 'Custom Publisher'
      });
      
      expect(entry.title).toBe('Custom Title');
      expect(entry.author).toBe('Custom Author');
      expect(entry.year).toBe(2023);
      expect(entry.publisher).toBe('Custom Publisher');
    });
    
    it('should generate hash-based ID from source', () => {
      const source = '/custom/path/document.pdf';
      const entry = createIntegrationTestCatalogEntry({ source });
      
      expect(entry.source).toBe(source);
      expect(typeof entry.id).toBe('number');
      expect(entry.id).toBeGreaterThan(0);
    });
  });
  
  describe('createIntegrationTestChunk', () => {
    it('should create chunk with all required fields', () => {
      const chunk = createIntegrationTestChunk();
      
      expect(chunk.id).toBeDefined();
      expect(chunk.text).toBeDefined();
      expect(chunk.catalog_id).toBeDefined();
      expect(chunk.catalog_title).toBeDefined();
      expect(chunk.hash).toBeDefined();
      expect(chunk.vector).toBeDefined();
      expect(Array.isArray(chunk.vector)).toBe(true);
      expect(chunk.vector.length).toBe(384);
    });
    
    it('should include concept arrays', () => {
      const chunk = createIntegrationTestChunk();
      
      expect(Array.isArray(chunk.concept_ids)).toBe(true);
      expect(Array.isArray(chunk.concept_names)).toBe(true);
    });
    
    it('should include optional fields', () => {
      const chunk = createIntegrationTestChunk();
      
      expect(typeof chunk.concept_density).toBe('number');
      expect(typeof chunk.page_number).toBe('number');
    });
    
    it('should include content classification fields with defaults', () => {
      const chunk = createIntegrationTestChunk();
      
      // Content classification fields (ADR-0046)
      expect(chunk.is_reference).toBe(false);
      expect(chunk.has_extraction_issues).toBe(false);
      expect(chunk.has_math).toBe(false);
    });
    
    it('should allow overriding content classification fields', () => {
      const chunk = createIntegrationTestChunk({
        is_reference: true,
        has_extraction_issues: true,
        has_math: true
      });
      
      expect(chunk.is_reference).toBe(true);
      expect(chunk.has_extraction_issues).toBe(true);
      expect(chunk.has_math).toBe(true);
    });
  });
  
  describe('createIntegrationTestConcept', () => {
    it('should create concept with all required fields', () => {
      const concept = createIntegrationTestConcept();
      
      expect(concept.id).toBeDefined();
      expect(concept.name).toBeDefined();
      expect(concept.summary).toBeDefined();
      expect(concept.vector).toBeDefined();
      expect(Array.isArray(concept.vector)).toBe(true);
      expect(concept.vector.length).toBe(384);
      expect(typeof concept.weight).toBe('number');
    });
    
    it('should include relationship arrays', () => {
      const concept = createIntegrationTestConcept();
      
      expect(Array.isArray(concept.catalog_ids)).toBe(true);
      expect(Array.isArray(concept.catalog_titles)).toBe(true);
      expect(Array.isArray(concept.chunk_ids)).toBe(true);
      expect(Array.isArray(concept.adjacent_ids)).toBe(true);
      expect(Array.isArray(concept.related_ids)).toBe(true);
    });
    
    it('should include WordNet arrays', () => {
      const concept = createIntegrationTestConcept();
      
      expect(Array.isArray(concept.synonyms)).toBe(true);
      expect(Array.isArray(concept.broader_terms)).toBe(true);
      expect(Array.isArray(concept.narrower_terms)).toBe(true);
    });
  });
  
  describe('createIntegrationTestCategory', () => {
    it('should create category with all required fields', () => {
      const category = createIntegrationTestCategory();
      
      expect(category.id).toBeDefined();
      expect(category.category).toBeDefined();
      expect(category.description).toBeDefined();
      expect(category.summary).toBeDefined();
      expect(category.vector).toBeDefined();
      expect(Array.isArray(category.vector)).toBe(true);
      expect(category.vector.length).toBe(384);
    });
    
    it('should include count fields', () => {
      const category = createIntegrationTestCategory();
      
      expect(typeof category.document_count).toBe('number');
      expect(typeof category.chunk_count).toBe('number');
      expect(typeof category.concept_count).toBe('number');
    });
    
    it('should support parent_category_id', () => {
      const category = createIntegrationTestCategory({
        parent_category_id: 12345
      });
      
      expect(category.parent_category_id).toBe(12345);
    });
  });
  
  describe('TEST_CATALOG_IDS', () => {
    it('should have consistent IDs for test documents', () => {
      expect(TEST_CATALOG_IDS['clean-architecture']).toBeDefined();
      expect(TEST_CATALOG_IDS['repository-pattern']).toBeDefined();
      expect(TEST_CATALOG_IDS['dependency-injection']).toBeDefined();
      expect(TEST_CATALOG_IDS['solid']).toBeDefined();
      expect(TEST_CATALOG_IDS['typescript']).toBeDefined();
      
      // IDs should be positive numbers
      Object.values(TEST_CATALOG_IDS).forEach(id => {
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });
    });
  });
  
  describe('TEST_CONCEPTS', () => {
    it('should have consistent IDs for test concepts', () => {
      expect(TEST_CONCEPTS['clean architecture']).toBeDefined();
      expect(TEST_CONCEPTS['repository pattern']).toBeDefined();
      expect(TEST_CONCEPTS['dependency injection']).toBeDefined();
      expect(TEST_CONCEPTS['solid principles']).toBeDefined();
      expect(TEST_CONCEPTS['typescript']).toBeDefined();
      
      // IDs should be positive numbers
      Object.values(TEST_CONCEPTS).forEach(id => {
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });
    });
  });
  
  describe('TEST_CATEGORIES', () => {
    it('should have consistent IDs for test categories', () => {
      expect(TEST_CATEGORIES['software architecture']).toBeDefined();
      expect(TEST_CATEGORIES['design patterns']).toBeDefined();
      expect(TEST_CATEGORIES['programming languages']).toBeDefined();
      expect(TEST_CATEGORIES['software engineering']).toBeDefined();
      
      // IDs should be positive numbers
      Object.values(TEST_CATEGORIES).forEach(id => {
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });
    });
  });
});

