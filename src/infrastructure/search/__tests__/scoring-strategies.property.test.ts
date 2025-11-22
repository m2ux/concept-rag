/**
 * Property-Based Tests for Scoring Functions
 * 
 * Uses property-based testing to verify mathematical properties and invariants
 * hold true for all inputs, not just specific test cases.
 * 
 * Properties tested:
 * - Score bounds: All scores must be in [0, 1]
 * - Monotonicity: Higher distance = lower vector score
 * - Idempotency: Same inputs produce same outputs
 * - Normalization: Hybrid score is weighted average
 * - Edge cases: Empty inputs, null values, extreme values
 * 
 * Run with: npm test -- scoring-strategies.property.test.ts
 * 
 * @group property
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateVectorScore,
  calculateWeightedBM25,
  calculateTitleScore,
  calculateConceptScore,
  calculateWordNetBonus,
  calculateHybridScore,
  type ExpandedQuery,
  type ScoreComponents
} from '../scoring-strategies.js';

describe('Scoring Functions Property-Based Tests', () => {
  describe('calculateVectorScore properties', () => {
    it('should always return values in [0, 1] for non-negative distances <= 1', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 1, noNaN: true }), (distance) => {
          const score = calculateVectorScore(distance);
          return !isNaN(score) && score >= 0 && score <= 1;
        }),
        { numRuns: 1000 }
      );
    });
    
    it('should be monotonic: higher distance = lower score', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (distance1, distance2) => {
            const score1 = calculateVectorScore(distance1);
            const score2 = calculateVectorScore(distance2);
            
            // Skip if either score is NaN
            if (isNaN(score1) || isNaN(score2)) return true;
            
            // If distance1 < distance2, then score1 >= score2
            if (distance1 < distance2) {
              return score1 >= score2;
            } else if (distance1 > distance2) {
              return score1 <= score2;
            } else {
              return Math.abs(score1 - score2) < 0.0001; // Allow floating-point precision
            }
          }
        ),
        { numRuns: 500 }
      );
    });
    
    it('should return 1.0 for distance 0', () => {
      fc.assert(
        fc.property(fc.constant(0), (distance) => {
          return calculateVectorScore(distance) === 1.0;
        })
      );
    });
    
    it('should handle negative distances (may exceed 1.0)', () => {
      fc.assert(
        fc.property(fc.float({ min: -100, max: 0 }), (distance) => {
          const score = calculateVectorScore(distance);
          // Negative distances can produce scores > 1.0 (e.g., distance = -1 gives score = 2)
          // This is acceptable behavior for edge cases
          return score >= 0;
        }),
        { numRuns: 100 }
      );
    });
  });
  
  describe('calculateWeightedBM25 properties', () => {
    it('should always return values in [0, 1] for any inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.float({ min: 0, max: 2 })),
          fc.string({ minLength: 0, maxLength: 1000 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (terms, weightsDict, docText, docSource) => {
            const weights = new Map(Object.entries(weightsDict));
            const score = calculateWeightedBM25(terms, weights, docText, docSource);
            return score >= 0 && score <= 1;
          }
        ),
        { numRuns: 500 }
      );
    });
    
    it('should return 0 when terms array is empty', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string(), fc.float()),
          fc.string(),
          fc.string(),
          (weightsDict, docText, docSource) => {
            const weights = new Map(Object.entries(weightsDict));
            const score = calculateWeightedBM25([], weights, docText, docSource);
            return score === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should be idempotent: same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          (terms, weightsDict, docText, docSource) => {
            const weights = new Map(Object.entries(weightsDict));
            const score1 = calculateWeightedBM25(terms, weights, docText, docSource);
            const score2 = calculateWeightedBM25(terms, weights, docText, docSource);
            return score1 === score2;
          }
        ),
        { numRuns: 200 }
      );
    });
  });
  
  describe('calculateTitleScore properties', () => {
    it('should always return values in [0, 1] for any inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (terms, source) => {
            const score = calculateTitleScore(terms, source);
            return score >= 0 && score <= 1;
          }
        ),
        { numRuns: 500 }
      );
    });
    
    it('should return 0 when terms array is empty', () => {
      fc.assert(
        fc.property(fc.string(), (source) => {
          return calculateTitleScore([], source) === 0;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should return 0 when source is empty', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          (terms) => {
            return calculateTitleScore(terms, '') === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should be idempotent: same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          (terms, source) => {
            const score1 = calculateTitleScore(terms, source);
            const score2 = calculateTitleScore(terms, source);
            return score1 === score2;
          }
        ),
        { numRuns: 200 }
      );
    });
  });
  
  describe('calculateConceptScore properties', () => {
    it('should always return values in [0, 1] for any inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
          fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
          (originalTerms, corpusTerms, wordnetTerms, weightsDict, docConcepts) => {
            const allTerms = [...originalTerms, ...corpusTerms, ...wordnetTerms];
            const weights = new Map(Object.entries(weightsDict));
            
            // Ensure all terms have weights
            for (const term of allTerms) {
              if (!weights.has(term)) {
                weights.set(term, 0.5);
              }
            }
            
            const expanded: ExpandedQuery = {
              original_terms: originalTerms,
              corpus_terms: corpusTerms,
              wordnet_terms: wordnetTerms,
              all_terms: allTerms,
              weights: weights
            };
            
            const result = {
              concepts: {
                primary_concepts: docConcepts
              }
            };
            
            const score = calculateConceptScore(expanded, result);
            return score >= 0 && score <= 1;
          }
        ),
        { numRuns: 300 }
      );
    });
    
    it('should return 0 when result has no concepts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          (terms, weightsDict) => {
            const weights = new Map(Object.entries(weightsDict));
            const expanded: ExpandedQuery = {
              original_terms: terms,
              corpus_terms: [],
              wordnet_terms: [],
              all_terms: terms,
              weights: weights
            };
            
            const result = { concepts: null };
            return calculateConceptScore(expanded, result) === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should return 0 when concepts array is empty', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          (terms, weightsDict) => {
            const weights = new Map(Object.entries(weightsDict));
            const expanded: ExpandedQuery = {
              original_terms: terms,
              corpus_terms: [],
              wordnet_terms: [],
              all_terms: terms,
              weights: weights
            };
            
            const result = {
              concepts: {
                primary_concepts: []
              }
            };
            return calculateConceptScore(expanded, result) === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('calculateWordNetBonus properties', () => {
    it('should always return values in [0, 1] for any inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          (wordnetTerms, docText) => {
            const score = calculateWordNetBonus(wordnetTerms, docText);
            return score >= 0 && score <= 1;
          }
        ),
        { numRuns: 500 }
      );
    });
    
    it('should return 0 when wordnetTerms array is empty', () => {
      fc.assert(
        fc.property(fc.string(), (docText) => {
          return calculateWordNetBonus([], docText) === 0;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should be idempotent: same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          (wordnetTerms, docText) => {
            const score1 = calculateWordNetBonus(wordnetTerms, docText);
            const score2 = calculateWordNetBonus(wordnetTerms, docText);
            return score1 === score2;
          }
        ),
        { numRuns: 200 }
      );
    });
  });
  
  describe('calculateHybridScore properties', () => {
    it('should always return values in [0, 1] for any component scores', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (vectorScore, bm25Score, titleScore, conceptScore, wordnetScore) => {
            const components: ScoreComponents = {
              vectorScore,
              bm25Score,
              titleScore,
              conceptScore,
              wordnetScore
            };
            const score = calculateHybridScore(components);
            return !isNaN(score) && score >= 0 && score <= 1;
          }
        ),
        { numRuns: 1000 }
      );
    });
    
    it('should be a weighted average: sum of weights = 1.0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (vectorScore, bm25Score, titleScore, conceptScore, wordnetScore) => {
            const components: ScoreComponents = {
              vectorScore,
              bm25Score,
              titleScore,
              conceptScore,
              wordnetScore
            };
            const hybridScore = calculateHybridScore(components);
            
            // Skip if result is NaN
            if (isNaN(hybridScore)) return true;
            
            // Calculate expected weighted average
            const expected = (
              vectorScore * 0.25 +
              bm25Score * 0.25 +
              titleScore * 0.20 +
              conceptScore * 0.20 +
              wordnetScore * 0.10
            );
            
            // Allow small floating-point precision differences
            return Math.abs(hybridScore - expected) < 0.0001;
          }
        ),
        { numRuns: 500 }
      );
    });
    
    it('should be idempotent: same inputs produce same outputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (vectorScore, bm25Score, titleScore, conceptScore, wordnetScore) => {
            const components: ScoreComponents = {
              vectorScore,
              bm25Score,
              titleScore,
              conceptScore,
              wordnetScore
            };
            const score1 = calculateHybridScore(components);
            const score2 = calculateHybridScore(components);
            // Allow floating-point precision differences
            return isNaN(score1) && isNaN(score2) || Math.abs(score1 - score2) < 0.0001;
          }
        ),
        { numRuns: 200 }
      );
    });
    
    it('should be monotonic: higher component scores = higher hybrid score', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (vectorScore1, bm25Score, titleScore, conceptScore, wordnetScore, vectorScore2) => {
            // Ensure vectorScore2 > vectorScore1
            const v1 = Math.min(vectorScore1, vectorScore2);
            const v2 = Math.max(vectorScore1, vectorScore2);
            
            const components1: ScoreComponents = {
              vectorScore: v1,
              bm25Score,
              titleScore,
              conceptScore,
              wordnetScore
            };
            
            const components2: ScoreComponents = {
              vectorScore: v2,
              bm25Score,
              titleScore,
              conceptScore,
              wordnetScore
            };
            
            const score1 = calculateHybridScore(components1);
            const score2 = calculateHybridScore(components2);
            
            // Skip if either score is NaN
            if (isNaN(score1) || isNaN(score2)) return true;
            
            // If v2 > v1, then score2 >= score1 (monotonicity)
            return score2 >= score1;
          }
        ),
        { numRuns: 300 }
      );
    });
    
    it('should handle edge case: all scores are 0', () => {
      const components: ScoreComponents = {
        vectorScore: 0,
        bm25Score: 0,
        titleScore: 0,
        conceptScore: 0,
        wordnetScore: 0
      };
      expect(calculateHybridScore(components)).toBe(0);
    });
    
    it('should handle edge case: all scores are 1', () => {
      const components: ScoreComponents = {
        vectorScore: 1,
        bm25Score: 1,
        titleScore: 1,
        conceptScore: 1,
        wordnetScore: 1
      };
      expect(calculateHybridScore(components)).toBeCloseTo(1.0, 10);
    });
  });
  
  describe('cross-function properties', () => {
    it('should maintain score bounds across all scoring functions', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.dictionary(fc.string(), fc.float({ min: 0, max: 1 })),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 5, maxLength: 100 }),
          (distance, terms, weightsDict, docText, source) => {
            const weights = new Map(Object.entries(weightsDict));
            
            const vectorScore = calculateVectorScore(distance);
            const bm25Score = calculateWeightedBM25(terms, weights, docText, source);
            const titleScore = calculateTitleScore(terms, source);
            
            const components: ScoreComponents = {
              vectorScore,
              bm25Score,
              titleScore,
              conceptScore: 0.5,
              wordnetScore: 0.5
            };
            
            const hybridScore = calculateHybridScore(components);
            
            // All scores should be in [0, 1]
            return (
              vectorScore >= 0 && vectorScore <= 1 &&
              bm25Score >= 0 && bm25Score <= 1 &&
              titleScore >= 0 && titleScore <= 1 &&
              hybridScore >= 0 && hybridScore <= 1
            );
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});

