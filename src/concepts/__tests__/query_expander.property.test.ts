/**
 * Property-Based Tests for Query Expansion
 * 
 * Uses property-based testing to verify mathematical properties and invariants
 * hold true for all inputs, not just specific test cases.
 * 
 * Properties tested:
 * - Term extraction: Always produces valid terms
 * - Weight bounds: All weights in [0, 1]
 * - Term inclusion: Original terms always included
 * - Expansion consistency: Same input produces consistent structure
 * - Edge cases: Empty queries, special characters, very long queries
 * 
 * Run with: npm test -- query_expander.property.test.ts
 * 
 * @group property
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { QueryExpander } from '../query_expander.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { createTestDatabase, TestDatabaseFixture } from '../../__tests__/integration/test-db-setup.js';

describe('Query Expansion Property-Based Tests', () => {
  let fixture: TestDatabaseFixture;
  let queryExpander: QueryExpander;
  
  beforeAll(async () => {
    // SETUP: Create test database with concepts table
    fixture = createTestDatabase('query-expander-property');
    await fixture.setup();
    
    const connection = fixture.getConnection();
    const conceptsTable = await connection.openTable('concepts');
    const embeddingService = new SimpleEmbeddingService();
    queryExpander = new QueryExpander(conceptsTable, embeddingService);
  }, 30000);
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('expandQuery properties', () => {
    it('should always include original terms in all_terms', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // All original terms should be in all_terms
            for (const originalTerm of result.original_terms) {
              expect(result.all_terms).toContain(originalTerm);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should always have weights for all terms in all_terms', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // Every term in all_terms should have a weight
            for (const term of result.all_terms) {
              const weight = result.weights.get(term);
              expect(weight).toBeDefined();
              expect(weight).toBeGreaterThanOrEqual(0);
              expect(weight).toBeLessThanOrEqual(1);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should have original terms with weight 1.0', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // Original terms should have weight 1.0
            for (const originalTerm of result.original_terms) {
              const weight = result.weights.get(originalTerm);
              expect(weight).toBe(1.0);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should produce consistent structure for same input', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (queryText) => {
            const result1 = await queryExpander.expandQuery(queryText);
            const result2 = await queryExpander.expandQuery(queryText);
            
            // Same original terms
            expect(result1.original_terms).toEqual(result2.original_terms);
            
            // Same structure (all_terms may vary slightly due to corpus expansion, but original should match)
            expect(result1.original_terms.length).toBe(result2.original_terms.length);
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
    
    it('should handle empty query gracefully', async () => {
      const result = await queryExpander.expandQuery('');
      
      // Should return valid structure even for empty query
      expect(result.original_terms).toBeDefined();
      expect(result.all_terms).toBeDefined();
      expect(result.weights).toBeDefined();
      expect(Array.isArray(result.original_terms)).toBe(true);
      expect(Array.isArray(result.all_terms)).toBe(true);
    });
    
    it('should filter out very short terms (length <= 2)', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // No term in original_terms should be length <= 2
            for (const term of result.original_terms) {
              expect(term.length).toBeGreaterThan(2);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should normalize terms (lowercase, no special chars)', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // All terms should be lowercase
            for (const term of result.original_terms) {
              expect(term).toBe(term.toLowerCase());
              // Should not contain non-word characters (except spaces, but terms are split)
              expect(term).toMatch(/^[a-z0-9]+$/);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should have non-empty all_terms when query has valid terms', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 200 }),
          async (queryText) => {
            // Only test queries that likely have valid terms
            if (queryText.trim().length < 3) {
              return true; // Skip very short queries
            }
            
            const result = await queryExpander.expandQuery(queryText);
            
            // If we extracted any original terms, all_terms should not be empty
            if (result.original_terms.length > 0) {
              expect(result.all_terms.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should have corpus_terms and wordnet_terms as subsets of all_terms', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (queryText) => {
            const result = await queryExpander.expandQuery(queryText);
            
            // Corpus terms should be in all_terms (or empty)
            for (const corpusTerm of result.corpus_terms) {
              expect(result.all_terms).toContain(corpusTerm);
            }
            
            // WordNet terms should be in all_terms (or empty)
            for (const wordnetTerm of result.wordnet_terms) {
              expect(result.all_terms).toContain(wordnetTerm);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

