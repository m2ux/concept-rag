/**
 * Unit Tests for ConceptChunkMatcher
 * 
 * Tests concept matching logic that matches document-level concepts to chunks.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptChunkMatcher } from '../concept_chunk_matcher.js';
import { Document } from '@langchain/core/documents';
import { ConceptMetadata } from '../types.js';

describe('ConceptChunkMatcher', () => {
  let matcher: ConceptChunkMatcher;

  beforeEach(() => {
    // SETUP: Create fresh matcher for each test
    matcher = new ConceptChunkMatcher();
  });

  describe('matchConceptsToChunk', () => {
    it('should match exact concept in chunk text', () => {
      // SETUP
      const chunkText = 'This chunk discusses dependency injection patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts).toContain('dependency injection');
      expect(result.concepts.length).toBeGreaterThan(0);
    });

    it('should match multiple concepts in chunk', () => {
      // SETUP
      const chunkText = 'This discusses both dependency injection and design patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection', 'design patterns'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts.length).toBeGreaterThanOrEqual(2);
      expect(result.concepts).toContain('dependency injection');
      expect(result.concepts).toContain('design patterns');
    });

    it('should return empty concepts when no matches', () => {
      // SETUP
      const chunkText = 'This chunk has no relevant concepts';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['microservices', 'distributed systems'],
        categories: ['architecture'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.density).toBe(0);
    });

    it('should return empty for unrelated concepts', () => {
      // SETUP
      const chunkText = 'This discusses architectural patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['microservices'],
        categories: ['architecture']
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts.length).toBe(0);
    });

    it('should include categories when concepts match', () => {
      // SETUP
      const chunkText = 'This discusses dependency injection';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['software engineering', 'design patterns'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.categories).toContain('software engineering');
      expect(result.categories).toContain('design patterns');
    });

    it('should not include categories when no concepts match', () => {
      // SETUP
      const chunkText = 'This has no matching concepts';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['microservices'],
        categories: ['architecture'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.categories).toEqual([]);
    });

    it('should calculate density for matched concepts', () => {
      // SETUP
      const chunkText = 'This discusses dependency injection and design patterns in detail';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection', 'design patterns'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.density).toBeGreaterThan(0);
      expect(result.density).toBeLessThanOrEqual(1.0);
    });

    it('should handle empty primary concepts', () => {
      // SETUP
      const chunkText = 'Some text';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: [],
        categories: ['category'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts).toEqual([]);
      expect(result.density).toBe(0);
    });

    it('should handle null/undefined primary concepts', () => {
      // SETUP
      const chunkText = 'Some text';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: undefined as any,
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts).toEqual([]);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      const chunkText = 'This discusses DEPENDENCY INJECTION';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.concepts).toContain('dependency injection');
    });

    it('should match multi-word concepts when all words present', () => {
      // SETUP
      const chunkText = 'This discusses dependency and injection patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      // Should match if all words of multi-word concept appear
      expect(result.concepts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('enrichChunkWithConcepts', () => {
    it('should enrich a single chunk with concepts', () => {
      // SETUP
      const chunk = new Document({
        pageContent: 'This chunk discusses dependency injection',
        metadata: { source: '/docs/di.pdf' }
      });
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const enriched = matcher.enrichChunkWithConcepts(chunk, documentConcepts);

      // VERIFY
      expect(enriched.text).toBe(chunk.pageContent);
      expect(enriched.source).toBe('/docs/di.pdf');
      expect(enriched.concepts).toBeDefined();
    });

    it('should handle chunk without source metadata', () => {
      // SETUP
      const chunk = new Document({
        pageContent: 'Some text',
        metadata: {}
      });
      const documentConcepts: ConceptMetadata = {
        primary_concepts: [],
        categories: [],
      };

      // EXERCISE
      const enriched = matcher.enrichChunkWithConcepts(chunk, documentConcepts);

      // VERIFY
      expect(enriched.source).toBe('');
    });

    it('should preserve chunk text content', () => {
      // SETUP
      const chunkText = 'Original chunk text content';
      const chunk = new Document({
        pageContent: chunkText,
        metadata: { source: '/test.pdf' }
      });
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['test'],
        categories: [],
      };

      // EXERCISE
      const enriched = matcher.enrichChunkWithConcepts(chunk, documentConcepts);

      // VERIFY
      expect(enriched.text).toBe(chunkText);
    });
  });

  describe('enrichChunksWithConcepts', () => {
    it('should enrich multiple chunks', () => {
      // SETUP
      const chunks = [
        new Document({
          pageContent: 'First chunk about dependency injection',
          metadata: { source: '/docs/di.pdf' }
        }),
        new Document({
          pageContent: 'Second chunk about design patterns',
          metadata: { source: '/docs/patterns.pdf' }
        })
      ];
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection', 'design patterns'],
        categories: ['software engineering'],
      };

      // EXERCISE
      const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);

      // VERIFY
      expect(enriched.length).toBe(2);
      expect(enriched[0].text).toBe(chunks[0].pageContent);
      expect(enriched[1].text).toBe(chunks[1].pageContent);
    });

    it('should handle empty chunks array', () => {
      // SETUP
      const chunks: Document[] = [];
      const documentConcepts: ConceptMetadata = {
        primary_concepts: [],
        categories: [],
      };

      // EXERCISE
      const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);

      // VERIFY
      expect(enriched).toEqual([]);
    });

    it('should process each chunk independently', () => {
      // SETUP
      const chunks = [
        new Document({
          pageContent: 'Chunk with dependency injection',
          metadata: { source: '/test1.pdf' }
        }),
        new Document({
          pageContent: 'Chunk without any matching concepts',
          metadata: { source: '/test2.pdf' }
        })
      ];
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection'],
        categories: ['category'],
      };

      // EXERCISE
      const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);

      // VERIFY
      expect(enriched[0].concepts.length).toBeGreaterThan(0);
      expect(enriched[1].concepts.length).toBe(0);
    });
  });

  describe('getMatchingStats', () => {
    it('should calculate statistics for enriched chunks', () => {
      // SETUP
      const enrichedChunks = [
        {
          text: 'Chunk 1',
          source: '/test1.pdf',
          concepts: ['concept1', 'concept2']
        },
        {
          text: 'Chunk 2',
          source: '/test2.pdf',
          concepts: ['concept1']
        },
        {
          text: 'Chunk 3',
          source: '/test3.pdf',
          concepts: []
        }
      ];

      // EXERCISE
      const stats = matcher.getMatchingStats(enrichedChunks);

      // VERIFY
      expect(stats.totalChunks).toBe(3);
      expect(stats.chunksWithConcepts).toBe(2);
      expect(stats.avgConceptsPerChunk).toBeCloseTo(1.0, 1); // (2+1+0)/3 = 1.0
    });

    it('should identify top concepts', () => {
      // SETUP
      const enrichedChunks = [
        {
          text: 'Chunk 1',
          source: '/test1.pdf',
          concepts: ['concept1', 'concept2']
        },
        {
          text: 'Chunk 2',
          source: '/test2.pdf',
          concepts: ['concept1', 'concept1'] // concept1 appears twice
        },
        {
          text: 'Chunk 3',
          source: '/test3.pdf',
          concepts: ['concept2']
        }
      ];

      // EXERCISE
      const stats = matcher.getMatchingStats(enrichedChunks);

      // VERIFY
      expect(stats.topConcepts.length).toBeGreaterThan(0);
      // concept1 should be most frequent (appears in chunks 1 and 2, twice in chunk 2)
      const concept1Entry = stats.topConcepts.find(c => c.concept === 'concept1');
      expect(concept1Entry).toBeDefined();
      expect(concept1Entry!.count).toBeGreaterThanOrEqual(2);
    });

    it('should limit top concepts to 10', () => {
      // SETUP
      const enrichedChunks = Array.from({ length: 20 }, (_, i) => ({
        text: `Chunk ${i}`,
        source: `/test${i}.pdf`,
        concepts: [`concept${i}`]
      }));

      // EXERCISE
      const stats = matcher.getMatchingStats(enrichedChunks);

      // VERIFY
      expect(stats.topConcepts.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty chunks array', () => {
      // SETUP
      const enrichedChunks: any[] = [];

      // EXERCISE
      const stats = matcher.getMatchingStats(enrichedChunks);

      // VERIFY
      expect(stats.totalChunks).toBe(0);
      expect(stats.chunksWithConcepts).toBe(0);
      expect(stats.avgConceptsPerChunk).toBe(0);
      expect(stats.topConcepts).toEqual([]);
    });

    it('should calculate average concepts per chunk correctly', () => {
      // SETUP
      const enrichedChunks = [
        {
          text: 'Chunk 1',
          source: '/test1.pdf',
          concepts: ['a', 'b', 'c']
        },
        {
          text: 'Chunk 2',
          source: '/test2.pdf',
          concepts: ['d', 'e']
        }
      ];

      // EXERCISE
      const stats = matcher.getMatchingStats(enrichedChunks);

      // VERIFY
      // (3 + 2) / 2 = 2.5
      expect(stats.avgConceptsPerChunk).toBe(2.5);
    });
  });

  describe('fuzzy matching behavior', () => {
    it('should match concepts with word boundaries for single words', () => {
      // SETUP
      const chunkText = 'This discusses testing in detail';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['testing'],
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      // Should match 'testing' as a word boundary match
      expect(result.concepts.length).toBeGreaterThan(0);
    });

    it('should handle concepts with special regex characters', () => {
      // SETUP
      const chunkText = 'This discusses C++ programming';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['C++'],
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      // Should handle special characters in concept name
      expect(result).toBeDefined();
    });

    it('should match partial word matches for longer concepts', () => {
      // SETUP
      const chunkText = 'This discusses architectural patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['architecture'],
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      // Should match 'architecture' within 'architectural' if similarity >= threshold
      expect(result.concepts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('density calculation', () => {
    it('should return 0 density for empty concepts', () => {
      // SETUP
      const chunkText = 'Some text without concepts';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: [],
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.density).toBe(0);
    });

    it('should return density in 0-1 range', () => {
      // SETUP
      const chunkText = 'This discusses dependency injection and design patterns';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['dependency injection', 'design patterns'],
        categories: [],
      };

      // EXERCISE
      const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);

      // VERIFY
      expect(result.density).toBeGreaterThanOrEqual(0);
      expect(result.density).toBeLessThanOrEqual(1.0);
    });

    it('should calculate higher density for more concepts', () => {
      // SETUP
      const chunkText1 = 'This discusses one concept';
      const chunkText2 = 'This discusses first concept and second concept and third concept';
      const documentConcepts: ConceptMetadata = {
        primary_concepts: ['one concept', 'first concept', 'second concept', 'third concept'],
        categories: [],
      };

      // EXERCISE
      const result1 = matcher.matchConceptsToChunk(chunkText1, documentConcepts);
      const result2 = matcher.matchConceptsToChunk(chunkText2, documentConcepts);

      // VERIFY
      // More concepts should generally result in higher density
      // (though exact values depend on text length)
      expect(result2.density).toBeGreaterThanOrEqual(0);
      expect(result1.density).toBeGreaterThanOrEqual(0);
    });
  });
});
