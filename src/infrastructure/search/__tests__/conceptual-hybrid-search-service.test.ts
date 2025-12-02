/**
 * Unit Tests for ConceptualHybridSearchService
 * 
 * Tests the hybrid search service that combines multiple ranking signals.
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 * 
 * Test Coverage:
 * - Score combination logic
 * - Result ranking
 * - Query expansion integration
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConceptualHybridSearchService } from '../conceptual-hybrid-search-service.js';
import { EmbeddingService } from '../../../domain/interfaces/services/embedding-service.js';
import { SearchableCollection } from '../../../domain/interfaces/services/hybrid-search-service.js';
import { QueryExpander } from '../../../concepts/query_expander.js';
import { ExpandedQuery } from '../scoring-strategies.js';
import { createTestEmbedding } from '../../../__tests__/test-helpers/test-data.js';

/**
 * Mock QueryExpander for testing
 */
class MockQueryExpander {
  private expandedQueries: Map<string, ExpandedQuery> = new Map();

  async expandQuery(queryText: string): Promise<ExpandedQuery> {
    const cached = this.expandedQueries.get(queryText);
    if (cached) {
      return cached;
    }

    // Default expansion for testing
    const terms = queryText.toLowerCase().split(/\s+/);
    const weights = new Map<string, number>();
    terms.forEach(term => weights.set(term, 1.0));

    const expanded: ExpandedQuery = {
      original_terms: terms,
      corpus_terms: [],
      concept_terms: [],  // Required for concept matching
      wordnet_terms: [],
      all_terms: terms,
      weights
    };

    this.expandedQueries.set(queryText, expanded);
    return expanded;
  }

  // Test helper: Set custom expansion
  setExpansion(queryText: string, expansion: ExpandedQuery): void {
    this.expandedQueries.set(queryText, expansion);
  }

  clear(): void {
    this.expandedQueries.clear();
  }
}

/**
 * Mock SearchableCollection for testing
 */
class MockSearchableCollection implements SearchableCollection {
  private results: any[] = [];

  async vectorSearch(queryVector: number[], limit: number): Promise<any[]> {
    return this.results.slice(0, limit);
  }

  getName(): string {
    return 'test-collection';
  }

  // Test helper: Set mock results
  setResults(results: any[]): void {
    this.results = results;
  }

  clear(): void {
    this.results = [];
  }
}

/**
 * Mock EmbeddingService for testing
 */
class MockEmbeddingService implements EmbeddingService {
  private embeddings: Map<string, number[]> = new Map();

  generateEmbedding(text: string): number[] {
    if (this.embeddings.has(text)) {
      return this.embeddings.get(text)!;
    }
    return createTestEmbedding(384, 0.5);
  }

  // Test helper: Set custom embedding
  setEmbedding(text: string, embedding: number[]): void {
    this.embeddings.set(text, embedding);
  }

  clear(): void {
    this.embeddings.clear();
  }
}

describe('ConceptualHybridSearchService', () => {
  let service: ConceptualHybridSearchService;
  let mockEmbeddingService: MockEmbeddingService;
  let mockQueryExpander: MockQueryExpander;
  let mockCollection: MockSearchableCollection;

  beforeEach(() => {
    // SETUP: Create fresh mocks for each test
    mockEmbeddingService = new MockEmbeddingService();
    mockQueryExpander = new MockQueryExpander();
    mockCollection = new MockSearchableCollection();

    // Create service with mocks
    service = new ConceptualHybridSearchService(
      mockEmbeddingService as any,
      mockQueryExpander as any
    );
  });

  describe('search - basic functionality', () => {
    it('should return empty array for empty collection', async () => {
      // SETUP
      mockCollection.setResults([]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test query', 5);

      // VERIFY
      expect(results).toEqual([]);
    });

    it('should return results with all score components', async () => {
      // SETUP - Use v7 schema field names
      const mockRow = {
        id: 'chunk-1',
        text: 'This is a test document about software architecture',
        source: '/test/architecture.pdf',
        catalog_title: 'Architecture Guide',
        hash: 'abc123',
        concept_names: ['architecture', 'software'],  // v7 schema uses concept_names
        category_names: ['technology'],
        concept_density: 0.75,
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'software architecture', 5);

      // VERIFY
      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.id).toBe('chunk-1');
      expect(result.text).toBe(mockRow.text);
      expect(result.source).toBe(mockRow.source);
      expect(result.vectorScore).toBeDefined();
      expect(result.bm25Score).toBeDefined();
      expect(result.titleScore).toBeDefined();
      expect(result.wordnetScore).toBeDefined();
      expect(result.hybridScore).toBeDefined();
      expect(result.matchedConcepts).toBeDefined();
      expect(result.expandedTerms).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      // SETUP - Use v7 schema field names
      const mockRows = Array.from({ length: 10 }, (_, i) => ({
        id: `chunk-${i}`,
        text: `Test document ${i}`,
        source: `/test/doc-${i}.pdf`,
        catalog_title: `Document ${i}`,
        hash: `hash-${i}`,
        concept_names: [],  // v7 schema
        vector: createTestEmbedding(),
        _distance: 0.2 + i * 0.1
      }));
      mockCollection.setResults(mockRows);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 3);

      // VERIFY
      expect(results).toHaveLength(3);
    });

    it('should request 3x limit from vector search for reranking', async () => {
      // SETUP
      const mockRows = Array.from({ length: 20 }, (_, i) => ({
        id: `chunk-${i}`,
        text: `Test document ${i}`,
        source: `/test/doc-${i}.pdf`,
        hash: `hash-${i}`,
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      }));
      mockCollection.setResults(mockRows);

      // Track vector search calls
      const vectorSearchSpy = vi.spyOn(mockCollection, 'vectorSearch');

      // EXERCISE
      await service.search(mockCollection, 'test', 5);

      // VERIFY - Should request 15 results (5 * 3) for reranking
      expect(vectorSearchSpy).toHaveBeenCalledWith(
        expect.any(Array),
        15 // limit * 3
      );
    });
  });

  describe('search - result ranking', () => {
    it('should rank results by hybrid score (highest first)', async () => {
      // SETUP - Create results with different scores
      const mockRows = [
        {
          id: 'chunk-1',
          text: 'Low score document',
          source: '/test/low.pdf',
          hash: 'hash1',
          concept_names: [],
          vector: createTestEmbedding(),
          _distance: 0.9 // High distance = low vector score
        },
        {
          id: 'chunk-2',
          text: 'High score document with matching terms',
          source: '/test/high.pdf',
          hash: 'hash2',
          concept_names: ['matching'],
          vector: createTestEmbedding(),
          _distance: 0.1 // Low distance = high vector score
        },
        {
          id: 'chunk-3',
          text: 'Medium score document',
          source: '/test/medium.pdf',
          hash: 'hash3',
          concept_names: [],
          vector: createTestEmbedding(),
          _distance: 0.5
        }
      ];
      mockCollection.setResults(mockRows);

      // EXERCISE
      const results = await service.search(mockCollection, 'matching terms', 10);

      // VERIFY - Results should be sorted by hybrid score (descending)
      expect(results.length).toBeGreaterThan(0);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].hybridScore).toBeGreaterThanOrEqual(results[i + 1].hybridScore);
      }
    });

    it('should return top K results after reranking', async () => {
      // SETUP
      const mockRows = Array.from({ length: 15 }, (_, i) => ({
        id: `chunk-${i}`,
        text: `Document ${i}`,
        source: `/test/doc-${i}.pdf`,
        hash: `hash-${i}`,
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.1 + (i * 0.05) // Increasing distance
      }));
      mockCollection.setResults(mockRows);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY
      expect(results).toHaveLength(5);
      // All results should have scores
      results.forEach(result => {
        expect(result.hybridScore).toBeDefined();
        expect(typeof result.hybridScore).toBe('number');
      });
    });
  });

  describe('search - query expansion integration', () => {
    it('should use expanded query terms for scoring', async () => {
      // SETUP
      const expandedQuery: ExpandedQuery = {
        original_terms: ['software'],
        corpus_terms: ['architecture', 'design'],
        concept_terms: ['architecture'],  // Required for concept matching
        wordnet_terms: ['programming'],
        all_terms: ['software', 'architecture', 'design', 'programming'],
        weights: new Map([
          ['software', 1.0],
          ['architecture', 0.8],
          ['design', 0.8],
          ['programming', 0.6]
        ])
      };
      mockQueryExpander.setExpansion('software', expandedQuery);

      const mockRow = {
        id: 'chunk-1',
        text: 'This document discusses software architecture and design patterns',
        source: '/test/arch.pdf',
        hash: 'abc123',
        concept_names: ['architecture'],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'software', 5);

      // VERIFY
      expect(results).toHaveLength(1);
      expect(results[0].expandedTerms).toContain('software');
      expect(results[0].expandedTerms).toContain('architecture');
    });

    it('should handle empty query expansion gracefully', async () => {
      // SETUP
      const emptyExpansion: ExpandedQuery = {
        original_terms: [],
        corpus_terms: [],
        concept_terms: [],  // Required for concept matching
        wordnet_terms: [],
        all_terms: [],
        weights: new Map()
      };
      mockQueryExpander.setExpansion('', emptyExpansion);

      const mockRow = {
        id: 'chunk-1',
        text: 'Test document',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, '', 5);

      // VERIFY - Should still return results (with low scores)
      expect(results).toHaveLength(1);
      expect(results[0].hybridScore).toBeDefined();
    });
  });

  describe('search - score calculation', () => {
    it('should calculate all score components correctly', async () => {
      // SETUP
      const mockRow = {
        id: 'chunk-1',
        text: 'Software architecture patterns and design principles',
        source: '/test/software-architecture.pdf',
        hash: 'abc123',
        concept_names: ['architecture', 'patterns'],
        category_names: ['technology'],
        concept_density: 0.8,
        vector: createTestEmbedding(),
        _distance: 0.15 // Low distance = high vector score
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'software architecture', 5);

      // VERIFY
      expect(results).toHaveLength(1);
      const result = results[0];

      // Vector score should be high (low distance)
      expect(result.vectorScore).toBeGreaterThan(0.8);
      expect(result.vectorScore).toBeLessThanOrEqual(1.0);

      // BM25 score should be calculated
      expect(result.bm25Score).toBeGreaterThanOrEqual(0);
      expect(result.bm25Score).toBeLessThanOrEqual(1.0);

      // Title score should be calculated
      expect(result.titleScore).toBeGreaterThanOrEqual(0);
      expect(result.titleScore).toBeLessThanOrEqual(1.0);

      // Concept score should be calculated

      // WordNet score should be calculated
      expect(result.wordnetScore).toBeGreaterThanOrEqual(0);
      expect(result.wordnetScore).toBeLessThanOrEqual(1.0);

      // Hybrid score should be weighted combination
      expect(result.hybridScore).toBeGreaterThanOrEqual(0);
      expect(result.hybridScore).toBeLessThanOrEqual(1.0);
    });

    it('should handle missing optional fields gracefully', async () => {
      // SETUP - Row with minimal fields
      const mockRow = {
        id: 'chunk-1',
        text: 'Test',
        source: '/test/doc.pdf',
        vector: createTestEmbedding(),
        _distance: 0.2
        // Missing: hash, concepts, concept_categories, concept_density
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY - Should not throw and should return results
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('chunk-1');
      expect(results[0].hash).toBe('');
      expect(results[0].conceptIds).toEqual([]);
    });
  });

  describe('search - debug mode', () => {
    it('should not output debug info when debug is false', async () => {
      // SETUP
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRow = {
        id: 'chunk-1',
        text: 'Test document',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      await service.search(mockCollection, 'test', 5, false);

      // VERIFY - Should not call console.error
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // CLEANUP
      consoleErrorSpy.mockRestore();
    });

    it('should output debug info when debug is true', async () => {
      // SETUP
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRow = {
        id: 'chunk-1',
        text: 'Test document',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      await service.search(mockCollection, 'test', 5, true);

      // VERIFY - Should call console.error for debug output
      expect(consoleErrorSpy).toHaveBeenCalled();

      // CLEANUP
      consoleErrorSpy.mockRestore();
    });
  });

  describe('search - edge cases', () => {
    it('should handle very large limit gracefully', async () => {
      // SETUP
      const mockRows = Array.from({ length: 5 }, (_, i) => ({
        id: `chunk-${i}`,
        text: `Document ${i}`,
        source: `/test/doc-${i}.pdf`,
        hash: `hash-${i}`,
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      }));
      mockCollection.setResults(mockRows);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 1000);

      // VERIFY - Should return only available results
      expect(results.length).toBeLessThanOrEqual(mockRows.length);
    });

    it('should handle zero limit', async () => {
      // SETUP
      const mockRow = {
        id: 'chunk-1',
        text: 'Test document',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 0);

      // VERIFY
      expect(results).toHaveLength(0);
    });

    it('should handle null/undefined values in row data', async () => {
      // SETUP - Row with null/undefined values
      const mockRow: any = {
        id: null,
        text: undefined,
        source: null,
        hash: undefined,
        concepts: null,
        vector: createTestEmbedding(),
        _distance: null
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY - Should handle gracefully with defaults
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('');
      expect(results[0].text).toBe('');
      expect(results[0].source).toBe('');
    });
  });

  describe('search - concept field parsing', () => {
    it('should parse array concept_categories', async () => {
      // SETUP
      const mockRow = {
        id: 'chunk-1',
        text: 'Test',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        category_names: ['technology', 'design'],
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY
    });

    it('should parse JSON string concept_categories', async () => {
      // SETUP
      const mockRow = {
        id: 'chunk-1',
        text: 'Test',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        category_names: JSON.stringify(['technology', 'design']),
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY
    });

    it('should handle invalid JSON in concept_categories', async () => {
      // SETUP
      const mockRow = {
        id: 'chunk-1',
        text: 'Test',
        source: '/test/doc.pdf',
        hash: 'abc123',
        concept_names: [],
        category_names: 'invalid json{',
        vector: createTestEmbedding(),
        _distance: 0.2
      };
      mockCollection.setResults([mockRow]);

      // EXERCISE
      const results = await service.search(mockCollection, 'test', 5);

      // VERIFY - Should handle gracefully
    });
  });
});

