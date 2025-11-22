/**
 * Property-Based Tests for Concept Chunk Matcher
 * 
 * Uses property-based testing to verify mathematical properties and invariants
 * hold true for all inputs, not just specific test cases.
 * 
 * Properties tested:
 * - Density bounds: Concept density always in [0, 1]
 * - Concept matching: Matched concepts are valid
 * - Enrichment consistency: Same input produces consistent output
 * - Edge cases: Empty chunks, no concepts, very long chunks
 * 
 * Run with: npm test -- concept_chunk_matcher.property.test.ts
 * 
 * @group property
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Document } from '@langchain/core/documents';
import { ConceptChunkMatcher } from '../concept_chunk_matcher.js';
import type { ConceptMetadata } from '../types.js';

describe('Concept Chunk Matcher Property-Based Tests', () => {
  const matcher = new ConceptChunkMatcher();
  
  describe('matchConceptsToChunk properties', () => {
    it('should always return density in [0, 1]', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 5000 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
          (chunkText, concepts, categories) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: categories
            };
            
            const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(result.density).toBeGreaterThanOrEqual(0);
            expect(result.density).toBeLessThanOrEqual(1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should always return arrays for concepts and categories', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 2000 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
          (chunkText, primaryConcepts, categories) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: primaryConcepts,
              technical_terms: [],
              related_concepts: [],
              categories: categories
            };
            
            const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(Array.isArray(result.concepts)).toBe(true);
            expect(Array.isArray(result.categories)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should return density 0 when chunk text is empty', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3), { minLength: 0, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
          (concepts, categories) => {
            // Filter out whitespace-only concepts
            const validConcepts = concepts.filter(c => c.trim().length >= 3);
            
            const documentConcepts: ConceptMetadata = {
              primary_concepts: validConcepts,
              related_concepts: [],
              categories: categories
            };
            
            const result = matcher.matchConceptsToChunk('', documentConcepts);
            
            // Empty text should result in density 0
            expect(result.density).toBe(0);
            // Concepts array should be empty for empty text
            expect(result.concepts.length).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should return density 0 when no concepts provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (chunkText) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: [],
              related_concepts: [],
              categories: []
            };
            
            const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(result.density).toBe(0);
            expect(result.concepts).toEqual([]);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should be idempotent: same input produces same output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
          (chunkText, concepts, categories) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: categories
            };
            
            const result1 = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            const result2 = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(result1.density).toBe(result2.density);
            expect(result1.concepts.length).toBe(result2.concepts.length);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  describe('enrichChunksWithConcepts properties', () => {
    it('should preserve chunk count', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 500 }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 15 }),
          (chunkTexts, concepts) => {
            // Filter out empty or whitespace-only texts
            const validTexts = chunkTexts.filter(text => text.trim().length > 0);
            if (validTexts.length === 0) {
              return true; // Skip if no valid texts
            }
            
            const chunks = validTexts.map(text => new Document({ 
              pageContent: text, 
              metadata: { source: '/test/doc.pdf' } 
            }));
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: []
            };
            
            const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);
            
            expect(enriched.length).toBe(chunks.length);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should add concepts property to all chunks', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 500 }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
          (chunkTexts, concepts) => {
            // Filter out empty or whitespace-only texts
            const validTexts = chunkTexts.filter(text => text.trim().length > 0);
            if (validTexts.length === 0) {
              return true; // Skip if no valid texts
            }
            
            const chunks = validTexts.map(text => new Document({ 
              pageContent: text, 
              metadata: { source: '/test/doc.pdf' } 
            }));
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: []
            };
            
            const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);
            
            for (const chunk of enriched) {
              expect(chunk).toHaveProperty('concepts');
              expect(Array.isArray(chunk.concepts)).toBe(true);
              expect(chunk).toHaveProperty('concept_categories');
              expect(Array.isArray(chunk.concept_categories)).toBe(true);
              expect(chunk).toHaveProperty('concept_density');
              expect(chunk.concept_density).toBeGreaterThanOrEqual(0);
              expect(chunk.concept_density).toBeLessThanOrEqual(1);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should preserve original chunk text and source', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 500 }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
          (chunkTexts, source, concepts) => {
            const chunks = chunkTexts.map(text => new Document({ 
              pageContent: text, 
              metadata: { source } 
            }));
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: []
            };
            
            const enriched = matcher.enrichChunksWithConcepts(chunks, documentConcepts);
            
            for (let i = 0; i < chunks.length; i++) {
              expect(enriched[i].text).toBe(chunks[i].pageContent);
              expect(enriched[i].source).toBe(chunks[i].metadata.source);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  describe('density calculation properties', () => {
    it('should always return density in [0, 1] via matchConceptsToChunk', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 2000 }),
          fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
          (chunkText, concepts) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: Array.isArray(concepts) ? concepts : [],
              related_concepts: [],
              categories: Array.isArray(categories) ? categories : []
            };
            
            const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(result.density).toBeGreaterThanOrEqual(0);
            expect(result.density).toBeLessThanOrEqual(1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should return density 0 when no concepts provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (chunkText) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: [],
              technical_terms: [],
              related_concepts: [],
              categories: []
            };
            
            const result = matcher.matchConceptsToChunk(chunkText, documentConcepts);
            
            expect(result.density).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should return density 0 when chunk text is empty', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          (concepts) => {
            const documentConcepts: ConceptMetadata = {
              primary_concepts: concepts,
              related_concepts: [],
              categories: []
            };
            
            const result = matcher.matchConceptsToChunk('', documentConcepts);
            
            expect(result.density).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

