/**
 * Unit Tests for Scoring Strategies
 * 
 * Tests all scoring functions used in hybrid search:
 * - Vector similarity scoring
 * - BM25 keyword matching
 * - Title matching
 * - Concept matching
 * - WordNet bonus scoring
 * - Hybrid score combination
 * - Matched concepts extraction
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVectorScore,
  calculateWeightedBM25,
  calculateTitleScore,
  calculateConceptScore,
  calculateWordNetBonus,
  calculateHybridScore,
  getMatchedConcepts,
  type ExpandedQuery,
  type ScoreComponents
} from '../scoring-strategies.js';

describe('Scoring Strategies', () => {
  describe('calculateVectorScore', () => {
    it('should return 1.0 for perfect match (distance 0)', () => {
      // SETUP
      const distance = 0;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      expect(score).toBe(1.0);
    });

    it('should return 0.0 for maximum distance (distance 1.0)', () => {
      // SETUP
      const distance = 1.0;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      expect(score).toBe(0.0);
    });

    it('should return 0.5 for medium distance (distance 0.5)', () => {
      // SETUP
      const distance = 0.5;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      expect(score).toBe(0.5);
    });

    it('should handle null/undefined distance as 0', () => {
      // SETUP
      const distance = null as any;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      expect(score).toBe(1.0);
    });

    it('should handle negative distance', () => {
      // SETUP
      const distance = -0.5;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      // Score is clamped to 0-1 range
      expect(score).toBe(1.0); // 1 - (-0.5) = 1.5 -> clamped to 1.0
    });

    it('should handle distance greater than 1.0', () => {
      // SETUP
      const distance = 2.0;

      // EXERCISE
      const score = calculateVectorScore(distance);

      // VERIFY
      // Score is clamped to 0-1 range
      expect(score).toBe(0.0); // 1 - 2.0 = -1.0 -> clamped to 0.0
    });
  });

  describe('calculateWeightedBM25', () => {
    it('should return 0 for empty terms', () => {
      // SETUP
      const terms: string[] = [];
      const weights = new Map<string, number>();
      const docText = 'This is a test document';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should return 0 when no terms match document', () => {
      // SETUP
      const terms = ['xyzabc123']; // Term that won't match
      const weights = new Map([['xyzabc123', 1.0]]);
      const docText = 'completely unrelated content with no matches';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      // When no terms match (termFreq = 0), score should be 0
      expect(score).toBe(0);
    });

    it('should score exact term matches', () => {
      // SETUP
      const terms = ['test'];
      const weights = new Map([['test', 1.0]]);
      const docText = 'This is a test document';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should apply term weights correctly', () => {
      // SETUP
      const terms = ['important', 'less'];
      const weights = new Map([
        ['important', 1.0],  // High weight
        ['less', 0.1]        // Low weight
      ]);
      const docText = 'This document contains important information and less relevant content';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should use default weight when term not in weights map', () => {
      // SETUP
      const terms = ['test'];
      const weights = new Map(); // Empty weights
      const docText = 'This is a test document';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should match terms in source path', () => {
      // SETUP
      const terms = ['typescript'];
      const weights = new Map([['typescript', 1.0]]);
      const docText = 'Some content';
      const docSource = '/docs/typescript-guide.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      const terms = ['TEST'];
      const weights = new Map([['test', 1.0]]);
      const docText = 'This is a Test Document';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should handle fuzzy matching (substring)', () => {
      // SETUP
      const terms = ['test'];
      const weights = new Map([['test', 1.0]]);
      const docText = 'This document contains testing and tested concepts';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should normalize score to 0-1 range', () => {
      // SETUP
      const terms = ['test'];
      const weights = new Map([['test', 10.0]]); // Very high weight
      const docText = 'test test test test test'; // Many matches
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple terms with different frequencies', () => {
      // SETUP
      const terms = ['common', 'rare'];
      const weights = new Map([
        ['common', 1.0],
        ['rare', 1.0]
      ]);
      const docText = 'common common common common rare';
      const docSource = '/test/doc.pdf';

      // EXERCISE
      const score = calculateWeightedBM25(terms, weights, docText, docSource);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('calculateTitleScore', () => {
    it('should return 0 for empty terms', () => {
      // SETUP
      const terms: string[] = [];
      const source = '/test/document.pdf';

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should return 0 for empty source', () => {
      // SETUP
      const terms = ['test'];
      const source = '';

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should return 0 for null/undefined source', () => {
      // SETUP
      const terms = ['test'];
      const source = null as any;

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should score filename matches higher than path matches', () => {
      // SETUP
      const terms = ['typescript'];
      const source1 = '/docs/typescript-guide.pdf'; // In filename
      const source2 = '/typescript/docs/guide.pdf'; // In path only

      // EXERCISE
      const score1 = calculateTitleScore(terms, source1);
      const score2 = calculateTitleScore(terms, source2);

      // VERIFY
      expect(score1).toBeGreaterThan(score2);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      const terms = ['TYPESCRIPT'];
      const source = '/docs/typescript-guide.pdf';

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should return 1.0 for perfect match in filename', () => {
      // SETUP
      const terms = ['typescript'];
      const source = '/docs/typescript.pdf';

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBe(1.0);
    });

    it('should handle multiple term matches', () => {
      // SETUP
      const terms = ['clean', 'architecture'];
      const source = '/docs/clean-architecture.pdf';

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should normalize score based on number of terms', () => {
      // SETUP
      const terms = ['test', 'document', 'guide'];
      const source = '/docs/test-document.pdf'; // Only 2 of 3 terms match

      // EXERCISE
      const score = calculateTitleScore(terms, source);

      // VERIFY
      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('calculateConceptScore', () => {
    it('should return 0 for null/undefined concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = { concepts: null };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should return 0 for empty concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: []
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should score exact concept matches', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['architecture'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['architecture'],
        weights: new Map([['architecture', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['architecture', 'design']
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should apply query term weights', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['important', 'less'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['important', 'less'],
        weights: new Map([
          ['important', 1.0],
          ['less', 0.1]
        ])
      };
      const result = {
        concepts: {
          primary_concepts: ['important', 'less']
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle fuzzy matching (substring)', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['arch'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['arch'],
        weights: new Map([['arch', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['architecture', 'architectural']
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      // Note: weights map uses lowercase keys, and all_terms should match
      const expanded: ExpandedQuery = {
        original_terms: ['architecture'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['architecture'], // Lowercase to match weights map
        weights: new Map([['architecture', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['Architecture', 'Design'] // Case varies in concepts
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for no matches', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['nonexistent'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['nonexistent'],
        weights: new Map([['nonexistent', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['architecture', 'design']
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should handle errors gracefully', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: null // Invalid structure
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should normalize score by number of query terms', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test', 'document', 'guide'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test', 'document', 'guide'],
        weights: new Map([
          ['test', 1.0],
          ['document', 1.0],
          ['guide', 1.0]
        ])
      };
      const result = {
        concepts: {
          primary_concepts: ['test', 'document'] // Only 2 of 3 match
        }
      };

      // EXERCISE
      const score = calculateConceptScore(expanded, result);

      // VERIFY
      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('calculateWordNetBonus', () => {
    it('should return 0 for empty WordNet terms', () => {
      // SETUP
      const wordnetTerms: string[] = [];
      const docText = 'This is a test document';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should return 0 for empty document text', () => {
      // SETUP
      const wordnetTerms = ['synonym', 'related'];
      const docText = '';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(0);
    });

    it('should score exact matches', () => {
      // SETUP
      const wordnetTerms = ['synonym'];
      const docText = 'This document contains the word synonym';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(1.0);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      const wordnetTerms = ['SYNONYM'];
      const docText = 'This document contains the word synonym';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(1.0);
    });

    it('should score partial matches', () => {
      // SETUP
      const wordnetTerms = ['synonym'];
      const docText = 'This document contains synonyms and synonymous terms';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(1.0); // substring match
    });

    it('should normalize by number of terms', () => {
      // SETUP
      const wordnetTerms = ['synonym', 'related', 'unmatched'];
      const docText = 'This document contains synonym and related terms';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBeCloseTo(2 / 3, 2); // 2 of 3 match
    });

    it('should return 1.0 for all terms matching', () => {
      // SETUP
      const wordnetTerms = ['synonym', 'related'];
      const docText = 'This document contains synonym and related terms';

      // EXERCISE
      const score = calculateWordNetBonus(wordnetTerms, docText);

      // VERIFY
      expect(score).toBe(1.0);
    });
  });

  describe('calculateHybridScore', () => {
    it('should calculate weighted combination correctly', () => {
      // SETUP - 5 components including concept scoring
      // Catalog weights: vector=30%, bm25=25%, title=20%, concept=15%, wordnet=10%
      const components: ScoreComponents = {
        vectorScore: 1.0,
        bm25Score: 1.0,
        titleScore: 1.0,
        conceptScore: 1.0,
        wordnetScore: 1.0
      };

      // EXERCISE
      const score = calculateHybridScore(components);

      // VERIFY
      // 1.0 * 0.30 + 1.0 * 0.25 + 1.0 * 0.20 + 1.0 * 0.15 + 1.0 * 0.10 = 1.0
      // Use toBeCloseTo for floating point comparison
      expect(score).toBeCloseTo(1.0, 10);
    });

    it('should apply correct weights to each component', () => {
      // SETUP - Catalog weights: vector=30%, bm25=25%, title=20%, concept=15%, wordnet=10%
      const components: ScoreComponents = {
        vectorScore: 1.0,  // 30% weight
        bm25Score: 0.0,    // 25% weight
        titleScore: 0.0,   // 20% weight
        conceptScore: 0.0, // 15% weight
        wordnetScore: 0.0  // 10% weight
      };

      // EXERCISE
      const score = calculateHybridScore(components);

      // VERIFY
      // Only vector score contributes: 1.0 * 0.30 = 0.30
      expect(score).toBe(0.30);
    });

    it('should handle zero scores', () => {
      // SETUP
      const components: ScoreComponents = {
        vectorScore: 0.0,
        bm25Score: 0.0,
        titleScore: 0.0,
        conceptScore: 0.0,
        wordnetScore: 0.0
      };

      // EXERCISE
      const score = calculateHybridScore(components);

      // VERIFY
      expect(score).toBe(0.0);
    });

    it('should handle mixed scores', () => {
      // SETUP - Catalog weights: vector=30%, bm25=25%, title=20%, concept=15%, wordnet=10%
      const components: ScoreComponents = {
        vectorScore: 0.8,  // 30% * 0.8 = 0.24
        bm25Score: 0.6,    // 25% * 0.6 = 0.15
        titleScore: 0.5,   // 20% * 0.5 = 0.10
        conceptScore: 0.4, // 15% * 0.4 = 0.06
        wordnetScore: 0.2  // 10% * 0.2 = 0.02
      };

      // EXERCISE
      const score = calculateHybridScore(components);

      // VERIFY
      // 0.24 + 0.15 + 0.10 + 0.06 + 0.02 = 0.57
      expect(score).toBeCloseTo(0.57, 2);
    });

    it('should return value in 0-1 range', () => {
      // SETUP
      const components: ScoreComponents = {
        vectorScore: 0.5,
        bm25Score: 0.5,
        titleScore: 0.5,
        conceptScore: 0.5,
        wordnetScore: 0.5
      };

      // EXERCISE
      const score = calculateHybridScore(components);

      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('getMatchedConcepts', () => {
    it('should return empty array for null/undefined concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = { concepts: null };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched).toEqual([]);
    });

    it('should return empty array for empty concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: []
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched).toEqual([]);
    });

    it('should return matched concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['architecture'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['architecture'],
        weights: new Map([['architecture', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['architecture', 'design', 'patterns']
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched).toContain('architecture');
      expect(matched.length).toBeGreaterThan(0);
    });

    it('should handle fuzzy matching', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['arch'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['arch'],
        weights: new Map([['arch', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['architecture', 'architectural']
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      // SETUP
      // Note: all_terms should be lowercase to match weights map lookup
      const expanded: ExpandedQuery = {
        original_terms: ['architecture'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['architecture'], // Lowercase to match weights map
        weights: new Map([['architecture', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['Architecture', 'Design'] // Case varies in concepts
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched).toContain('Architecture');
    });

    it('should return unique concepts only', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test', 'test'], // Duplicate term
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['test', 'testing']
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      const unique = [...new Set(matched)];
      expect(matched.length).toBe(unique.length);
    });

    it('should limit results to 5 concepts', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7']
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched.length).toBeLessThanOrEqual(5);
    });

    it('should handle errors gracefully', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: ['test'],
        weights: new Map([['test', 1.0]])
      };
      const result = {
        concepts: {
          primary_concepts: null // Invalid structure
        }
      };

      // EXERCISE
      const matched = getMatchedConcepts(expanded, result);

      // VERIFY
      expect(matched).toEqual([]);
    });
  });
});

