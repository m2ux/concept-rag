/**
 * Unit Tests for Dynamic Weight Adjustment
 * 
 * Tests the dynamic weighting system that adjusts WordNet contribution
 * based on query characteristics.
 * 
 * Follows Four-Phase Test pattern: Setup, Exercise, Verify, Teardown.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeQuery,
  getAdjustedCatalogWeights,
  getAdjustedChunkWeights,
  getAdjustedConceptWeights,
  calculateDynamicHybridScore,
  DEFAULT_WEIGHTS,
  QueryAnalysis,
  WeightProfile
} from '../dynamic-weights.js';
import { ExpandedQuery } from '../scoring-strategies.js';

describe('Dynamic Weights', () => {
  describe('analyzeQuery', () => {
    it('should identify single-term queries', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['architecture'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: ['design', 'structure'],
        all_terms: ['architecture', 'design', 'structure'],
        weights: new Map([['architecture', 1.0], ['design', 0.6], ['structure', 0.6]])
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.isSingleTerm).toBe(true);
      expect(analysis.termCount).toBe(1);
      expect(analysis.wordnetTermCount).toBe(2);
    });
    
    it('should boost single-term queries without concept matches', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['pattern'],
        corpus_terms: [],
        concept_terms: [],  // No concept matches
        wordnet_terms: ['design', 'template'],
        all_terms: ['pattern', 'design', 'template'],
        weights: new Map([['pattern', 1.0]])
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.wordnetBoostFactor).toBe(2.0);
      expect(analysis.boostReason).toContain('single-term');
      expect(analysis.boostReason).toContain('without concept matches');
    });
    
    it('should moderately boost single-term queries with concept matches', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['pattern'],
        corpus_terms: [],
        concept_terms: ['design pattern'],  // Has concept matches
        wordnet_terms: ['design', 'template'],
        all_terms: ['pattern', 'design', 'template', 'design pattern'],
        weights: new Map([['pattern', 1.0], ['design pattern', 0.7]])
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.wordnetBoostFactor).toBe(1.5);
      expect(analysis.boostReason).toContain('single-term');
      expect(analysis.boostReason).toContain('with concept matches');
    });
    
    it('should reduce weight for multi-term queries with strong concept signals', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['software', 'design', 'patterns', 'best', 'practices'],
        corpus_terms: [],
        concept_terms: [
          'software architecture',
          'design patterns',
          'best practices',
          'clean code',
          'refactoring'
        ],  // Strong concept signal (>= original terms)
        wordnet_terms: ['program', 'structure'],
        all_terms: ['software', 'design', 'patterns', 'best', 'practices'],
        weights: new Map()
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.wordnetBoostFactor).toBe(0.75);
      expect(analysis.boostReason).toContain('multi-term');
      expect(analysis.boostReason).toContain('strong concept matches');
    });
    
    it('should handle empty queries', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: [],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: [],
        all_terms: [],
        weights: new Map()
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.termCount).toBe(0);
      expect(analysis.isSingleTerm).toBe(false);
      expect(analysis.wordnetExpansionRatio).toBe(0);
    });
    
    it('should calculate WordNet expansion ratio', () => {
      // SETUP
      const expanded: ExpandedQuery = {
        original_terms: ['test', 'query'],
        corpus_terms: [],
        concept_terms: [],
        wordnet_terms: ['exam', 'trial', 'question', 'inquiry'],  // 4 terms for 2 original
        all_terms: ['test', 'query', 'exam', 'trial', 'question', 'inquiry'],
        weights: new Map()
      };
      
      // EXERCISE
      const analysis = analyzeQuery(expanded);
      
      // VERIFY
      expect(analysis.wordnetExpansionRatio).toBe(2);  // 4/2
    });
  });
  
  describe('getAdjustedCatalogWeights', () => {
    it('should return default weights when boost factor is 1.0', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 3,
        isSingleTerm: false,
        wordnetTermCount: 3,
        conceptTermCount: 3,
        wordnetExpansionRatio: 1,
        hasStrongConceptSignal: true,
        wordnetBoostFactor: 1.0,
        boostReason: 'standard weighting'
      };
      
      // EXERCISE
      const weights = getAdjustedCatalogWeights(analysis);
      
      // VERIFY
      expect(weights).toEqual(DEFAULT_WEIGHTS.catalog);
    });
    
    it('should increase WordNet weight when boost factor > 1', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 1,
        isSingleTerm: true,
        wordnetTermCount: 2,
        conceptTermCount: 0,
        wordnetExpansionRatio: 2,
        hasStrongConceptSignal: false,
        wordnetBoostFactor: 2.0,
        boostReason: 'single-term query'
      };
      
      // EXERCISE
      const weights = getAdjustedCatalogWeights(analysis);
      
      // VERIFY
      expect(weights.wordnetWeight).toBeGreaterThan(DEFAULT_WEIGHTS.catalog.wordnetWeight);
      // Verify weights still sum to 1.0
      const sum = weights.vectorWeight + weights.bm25Weight + 
                  weights.titleWeight + weights.conceptWeight + weights.wordnetWeight;
      expect(sum).toBeCloseTo(1.0, 5);
    });
    
    it('should cap WordNet weight at 0.25', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 1,
        isSingleTerm: true,
        wordnetTermCount: 5,
        conceptTermCount: 0,
        wordnetExpansionRatio: 5,
        hasStrongConceptSignal: false,
        wordnetBoostFactor: 2.5,  // Max boost
        boostReason: 'max boost'
      };
      
      // EXERCISE
      const weights = getAdjustedCatalogWeights(analysis);
      
      // VERIFY
      expect(weights.wordnetWeight).toBeLessThanOrEqual(0.25);
    });
    
    it('should maintain vector weight unchanged', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 1,
        isSingleTerm: true,
        wordnetTermCount: 2,
        conceptTermCount: 0,
        wordnetExpansionRatio: 2,
        hasStrongConceptSignal: false,
        wordnetBoostFactor: 2.0,
        boostReason: 'boost'
      };
      
      // EXERCISE
      const weights = getAdjustedCatalogWeights(analysis);
      
      // VERIFY
      expect(weights.vectorWeight).toBe(DEFAULT_WEIGHTS.catalog.vectorWeight);
    });
  });
  
  describe('getAdjustedChunkWeights', () => {
    it('should return default weights when boost factor is 1.0', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 3,
        isSingleTerm: false,
        wordnetTermCount: 3,
        conceptTermCount: 3,
        wordnetExpansionRatio: 1,
        hasStrongConceptSignal: true,
        wordnetBoostFactor: 1.0,
        boostReason: 'standard'
      };
      
      // EXERCISE
      const weights = getAdjustedChunkWeights(analysis);
      
      // VERIFY
      expect(weights).toEqual(DEFAULT_WEIGHTS.chunk);
    });
    
    it('should increase WordNet weight for chunk search', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 1,
        isSingleTerm: true,
        wordnetTermCount: 3,
        conceptTermCount: 0,
        wordnetExpansionRatio: 3,
        hasStrongConceptSignal: false,
        wordnetBoostFactor: 2.0,
        boostReason: 'single-term'
      };
      
      // EXERCISE
      const weights = getAdjustedChunkWeights(analysis);
      
      // VERIFY
      expect(weights.wordnetWeight).toBeGreaterThan(DEFAULT_WEIGHTS.chunk.wordnetWeight);
      // Chunk search can boost higher (up to 0.30)
      expect(weights.wordnetWeight).toBeLessThanOrEqual(0.30);
    });
  });
  
  describe('getAdjustedConceptWeights', () => {
    it('should maintain title/name weight priority', () => {
      // SETUP
      const analysis: QueryAnalysis = {
        termCount: 1,
        isSingleTerm: true,
        wordnetTermCount: 3,
        conceptTermCount: 0,
        wordnetExpansionRatio: 3,
        hasStrongConceptSignal: false,
        wordnetBoostFactor: 2.0,
        boostReason: 'single-term'
      };
      
      // EXERCISE
      const weights = getAdjustedConceptWeights(analysis);
      
      // VERIFY - name matching should remain highest priority
      expect(weights.titleWeight).toBe(DEFAULT_WEIGHTS.concept.titleWeight);
      expect(weights.titleWeight).toBeGreaterThan(weights.wordnetWeight);
    });
  });
  
  describe('calculateDynamicHybridScore', () => {
    it('should calculate score with custom weights', () => {
      // SETUP
      const components = {
        vectorScore: 0.8,
        bm25Score: 0.6,
        titleScore: 0.4,
        conceptScore: 0.5,
        wordnetScore: 0.7
      };
      
      const weights: WeightProfile = {
        vectorWeight: 0.30,
        bm25Weight: 0.25,
        titleWeight: 0.15,
        conceptWeight: 0.10,
        wordnetWeight: 0.20  // Boosted
      };
      
      // EXERCISE
      const score = calculateDynamicHybridScore(components, weights);
      
      // VERIFY
      const expected = (0.8 * 0.30) + (0.6 * 0.25) + (0.4 * 0.15) + 
                       (0.5 * 0.10) + (0.7 * 0.20);
      expect(score).toBeCloseTo(expected, 5);
    });
    
    it('should return higher score when WordNet matches with boosted weight', () => {
      // SETUP
      const components = {
        vectorScore: 0.5,
        bm25Score: 0.3,
        titleScore: 0.2,
        conceptScore: 0.2,
        wordnetScore: 0.9  // Strong WordNet match
      };
      
      const defaultWeights = DEFAULT_WEIGHTS.catalog;
      const boostedWeights: WeightProfile = {
        ...defaultWeights,
        wordnetWeight: 0.25,  // Boosted from 0.10
        bm25Weight: 0.175,    // Reduced
        titleWeight: 0.125    // Reduced
      };
      
      // EXERCISE
      const defaultScore = calculateDynamicHybridScore(components, defaultWeights);
      const boostedScore = calculateDynamicHybridScore(components, boostedWeights);
      
      // VERIFY - boosted weights should increase score when WordNet matches
      expect(boostedScore).toBeGreaterThan(defaultScore);
    });
    
    it('should handle zero scores', () => {
      // SETUP
      const components = {
        vectorScore: 0,
        bm25Score: 0,
        titleScore: 0,
        conceptScore: 0,
        wordnetScore: 0
      };
      
      // EXERCISE
      const score = calculateDynamicHybridScore(components, DEFAULT_WEIGHTS.catalog);
      
      // VERIFY
      expect(score).toBe(0);
    });
    
    it('should handle perfect scores', () => {
      // SETUP
      const components = {
        vectorScore: 1,
        bm25Score: 1,
        titleScore: 1,
        conceptScore: 1,
        wordnetScore: 1
      };
      
      // EXERCISE
      const score = calculateDynamicHybridScore(components, DEFAULT_WEIGHTS.catalog);
      
      // VERIFY - weights should sum to 1.0, so perfect scores = 1.0
      expect(score).toBeCloseTo(1.0, 5);
    });
  });
  
  describe('weight sum validation', () => {
    it('should ensure default catalog weights sum to 1.0', () => {
      const weights = DEFAULT_WEIGHTS.catalog;
      const sum = weights.vectorWeight + weights.bm25Weight + 
                  weights.titleWeight + weights.conceptWeight + weights.wordnetWeight;
      expect(sum).toBeCloseTo(1.0, 5);
    });
    
    it('should ensure default chunk weights sum to 1.0', () => {
      const weights = DEFAULT_WEIGHTS.chunk;
      const sum = weights.vectorWeight + weights.bm25Weight + 
                  weights.titleWeight + weights.conceptWeight + weights.wordnetWeight;
      expect(sum).toBeCloseTo(1.0, 5);
    });
    
    it('should ensure default concept weights sum to 1.0', () => {
      const weights = DEFAULT_WEIGHTS.concept;
      const sum = weights.vectorWeight + weights.bm25Weight + 
                  weights.titleWeight + weights.conceptWeight + weights.wordnetWeight;
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });
});

