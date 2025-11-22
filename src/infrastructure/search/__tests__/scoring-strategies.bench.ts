/**
 * Performance Benchmarks for Scoring Functions
 * 
 * Measures performance of scoring functions to:
 * - Establish baseline performance metrics
 * - Detect performance regressions
 * - Guide optimization efforts
 * 
 * Run with: npm test -- scoring-strategies.bench.ts
 * 
 * @group benchmark
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVectorScore,
  calculateWeightedBM25,
  calculateTitleScore,
  calculateConceptScore,
  calculateWordNetBonus,
  calculateHybridScore,
  type ScoreComponents,
  type ExpandedQuery
} from '../scoring-strategies.js';

describe('Scoring Functions Performance Benchmarks', () => {
  const iterations = 1000;
  
  describe('calculateVectorScore', () => {
    it('should benchmark vector score calculation', () => {
      const distances = Array.from({ length: iterations }, (_, i) => i / iterations);
      
      const start = performance.now();
      for (const distance of distances) {
        calculateVectorScore(distance);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateVectorScore: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
  
  describe('calculateWeightedBM25', () => {
    const shortText = 'This is a short document with some keywords.';
    const mediumText = 'This is a medium length document with multiple sentences. It contains various keywords and terms that might match search queries. The document has enough content to test BM25 scoring performance.';
    const longText = Array(100).fill('This is a longer document with many sentences. ').join('') + 
                     'It contains various keywords and terms repeated multiple times throughout the text. ' +
                     'The document has enough content to test BM25 scoring performance with longer documents.';
    
    it('should benchmark BM25 on short documents', () => {
      const terms = ['document', 'keywords'];
      const weights = new Map([['document', 1.0], ['keywords', 0.8]]);
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateWeightedBM25(terms, weights, shortText, '/test/short.txt');
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateWeightedBM25 (short): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.1ms per call for short text)
      expect(avgTime).toBeLessThan(0.1);
    });
    
    it('should benchmark BM25 on medium documents', () => {
      const terms = ['document', 'keywords', 'sentences', 'content'];
      const weights = new Map([
        ['document', 1.0],
        ['keywords', 0.8],
        ['sentences', 0.7],
        ['content', 0.6]
      ]);
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateWeightedBM25(terms, weights, mediumText, '/test/medium.txt');
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateWeightedBM25 (medium): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.2ms per call for medium text)
      expect(avgTime).toBeLessThan(0.2);
    });
    
    it('should benchmark BM25 on long documents', () => {
      const terms = ['document', 'keywords', 'sentences', 'content', 'text'];
      const weights = new Map([
        ['document', 1.0],
        ['keywords', 0.8],
        ['sentences', 0.7],
        ['content', 0.6],
        ['text', 0.5]
      ]);
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateWeightedBM25(terms, weights, longText, '/test/long.txt');
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateWeightedBM25 (long): ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be reasonable (< 1ms per call for long text)
      expect(avgTime).toBeLessThan(1.0);
    });
  });
  
  describe('calculateTitleScore', () => {
    it('should benchmark title score calculation', () => {
      const terms = ['software', 'architecture', 'design'];
      const source = '/documents/software-architecture-design.pdf';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateTitleScore(terms, source);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateTitleScore: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
  
  describe('calculateConceptScore', () => {
    it('should benchmark concept score calculation', () => {
      const expanded: ExpandedQuery = {
        original_terms: ['software', 'architecture'],
        corpus_terms: ['design', 'patterns'],
        wordnet_terms: ['system', 'structure'],
        all_terms: ['software', 'architecture', 'design', 'patterns', 'system', 'structure'],
        weights: new Map([
          ['software', 1.0],
          ['architecture', 1.0],
          ['design', 0.8],
          ['patterns', 0.7],
          ['system', 0.6],
          ['structure', 0.6]
        ])
      };
      
      const result = {
        concepts: {
          primary_concepts: ['Software Architecture', 'Design Patterns', 'System Design']
        }
      };
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateConceptScore(expanded, result);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateConceptScore: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.05ms per call)
      expect(avgTime).toBeLessThan(0.05);
    });
  });
  
  describe('calculateWordNetBonus', () => {
    it('should benchmark WordNet bonus calculation', () => {
      const wordnetTerms = ['system', 'structure', 'organization', 'framework', 'architecture'];
      const docText = 'This document discusses software architecture and system design patterns. ' +
                      'It covers organizational structures and framework design principles.';
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateWordNetBonus(wordnetTerms, docText);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateWordNetBonus: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.05ms per call)
      expect(avgTime).toBeLessThan(0.05);
    });
  });
  
  describe('calculateHybridScore', () => {
    it('should benchmark hybrid score calculation', () => {
      const components: ScoreComponents = {
        vectorScore: 0.85,
        bm25Score: 0.72,
        titleScore: 0.90,
        conceptScore: 0.68,
        wordnetScore: 0.55
      };
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        calculateHybridScore(components);
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`calculateHybridScore: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be very fast (< 0.01ms per call)
      expect(avgTime).toBeLessThan(0.01);
    });
  });
  
  describe('end-to-end scoring pipeline', () => {
    it('should benchmark complete scoring pipeline', () => {
      const components: ScoreComponents = {
        vectorScore: 0.85,
        bm25Score: 0.72,
        titleScore: 0.90,
        conceptScore: 0.68,
        wordnetScore: 0.55
      };
      
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        // Simulate complete scoring pipeline
        const vector = calculateVectorScore(0.15);
        const bm25 = calculateWeightedBM25(
          ['software', 'architecture'],
          new Map([['software', 1.0], ['architecture', 0.8]]),
          'This document discusses software architecture principles.',
          '/documents/software-architecture.pdf'
        );
        const title = calculateTitleScore(['software', 'architecture'], '/documents/software-architecture.pdf');
        const hybrid = calculateHybridScore({
          vectorScore: vector,
          bm25Score: bm25,
          titleScore: title,
          conceptScore: 0.68,
          wordnetScore: 0.55
        });
        // Use result to prevent optimization
        if (hybrid < 0) throw new Error('Impossible');
      }
      const duration = performance.now() - start;
      
      const avgTime = duration / iterations;
      console.log(`Complete scoring pipeline: ${avgTime.toFixed(4)}ms per call (${iterations} iterations)`);
      
      // Performance assertion: should be fast (< 0.5ms per call for complete pipeline)
      expect(avgTime).toBeLessThan(0.5);
    });
  });
});

