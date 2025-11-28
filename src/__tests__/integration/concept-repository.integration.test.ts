/**
 * Integration Tests for LanceDBConceptRepository
 * 
 * Tests the actual repository implementation against a real (temporary) LanceDB instance.
 * Focuses on:
 * - Vector/embeddings field mapping (critical bug that was fixed)
 * - Concept lookup by name
 * - Schema validation
 * - Error handling
 * 
 * **Test Strategy**: Integration testing with test fixtures (xUnit Test Patterns)
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { LanceDBConceptRepository } from '../../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import * as defaults from '../../config.js';
import { isSome, isNone } from '../../domain/functional/index.js';

describe('LanceDBConceptRepository - Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let conceptRepo: LanceDBConceptRepository;
  
  beforeAll(async () => {
    // ARRANGE: Setup test database with standard concepts
    fixture = createTestDatabase('concept-repo');
    await fixture.setup();
    
    // Create repository
    const connection = fixture.getConnection();
    const conceptsTable = await connection.openTable(defaults.CONCEPTS_TABLE_NAME);
    
    conceptRepo = new LanceDBConceptRepository(conceptsTable);
  }, 30000);
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('findByName', () => {
    it('should find concept by exact name', async () => {
      // ARRANGE: Known concept in test data
      const conceptName = 'clean architecture';
      
      // ACT: Query by exact name
      const conceptOpt = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Concept should be found with correct data
      expect(isSome(conceptOpt)).toBe(true);
      // @ts-expect-error - Type narrowing limitation
      expect((conceptOpt as { tag: "some"; value: Concept }).value.name).toBe('clean architecture');
    });
    
    it('should handle case-insensitive lookup', async () => {
      // ARRANGE: Same concept name in different cases
      const conceptLower = 'clean architecture';
      const conceptUpper = 'CLEAN ARCHITECTURE';
      const conceptMixed = 'Clean Architecture';
      
      // ACT: Query with all case variations
      const lowerOpt = await conceptRepo.findByName(conceptLower);
      const upperOpt = await conceptRepo.findByName(conceptUpper);
      const mixedOpt = await conceptRepo.findByName(conceptMixed);
      
      // ASSERT: All should find the same concept
      expect(isSome(lowerOpt)).toBe(true);
      expect(isSome(lowerOpt)).toBe(true);
      expect(isSome(mixedOpt)).toBe(true);
      expect(isSome(mixedOpt)).toBe(true);
      if (isSome(lowerOpt) && isSome(upperOpt) && isSome(mixedOpt)) {
        // @ts-expect-error - Type narrowing limitation
        expect(upperOpt.value.name).toBe(lowerOpt.value.name);
        // @ts-expect-error - Type narrowing limitation
        expect(mixedOpt.value.name).toBe(lowerOpt.value.name);
      }
    });
    
    it('should return null for non-existent concept', async () => {
      // ARRANGE: Concept name not in test data
      const nonExistentConcept = 'nonexistent-concept-xyz';
      
      // ACT: Query for non-existent concept
      const conceptOpt = await conceptRepo.findByName(nonExistentConcept);
      
      // ASSERT: Should return None, not throw error
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should correctly map vector field (critical bug fix verification)', async () => {
      // ARRANGE: Query concept with embeddings
      const conceptName = 'typescript';
      
      // ACT: Retrieve concept
      const conceptOpt = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Critical test - verifies vector/embeddings field mapping bug fix
      expect(isSome(conceptOpt)).toBe(true);
      if (isSome(conceptOpt)) {
        // @ts-expect-error - Type narrowing limitation
        expect((conceptOpt as { tag: "some"; value: Concept }).value.embeddings).toBeDefined();
      }
      
      // Embeddings can be either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(conceptOpt.value.embeddings);
      const hasLength = 'length' in conceptOpt.value.embeddings && typeof conceptOpt.value.embeddings.length === 'number';
      expect(isArray || hasLength).toBe(true);
      // @ts-expect-error - Type narrowing limitation
      expect((conceptOpt as { tag: "some"; value: Concept }).value.embeddings.length).toBe(384); // Expected embedding dimension
      
      // Verify embeddings contain valid data (convert to array if needed)
      const embeddingsArray = Array.isArray(conceptOpt.value.embeddings) 
        ? conceptOpt.value.embeddings 
        : Array.from(conceptOpt.value.embeddings as any);
      expect(embeddingsArray.length).toBe(384);
      expect(typeof embeddingsArray[0]).toBe('number');
      expect(Number.isFinite(embeddingsArray[0])).toBe(true);
    });
  });
  
  describe('field mapping validation', () => {
    it('should correctly map all concept fields from LanceDB', async () => {
      // ARRANGE: Known concept with all fields populated
      const conceptName = 'dependency injection';
      
      // ACT: Retrieve concept
      const conceptOpt = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Verify all field mappings from LanceDB to domain model (normalized schema)
      expect(isSome(conceptOpt)).toBe(true);
      const c = conceptOpt.value;
      
      // String fields
      expect(c.name).toBeDefined();
      expect(typeof c.name).toBe('string');
      expect(c.name).toBe('dependency injection');
      
      // Vector field (critical)
      expect(c.embeddings).toBeDefined();
      
      // Embeddings can be either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(c.embeddings);
      const hasLength = 'length' in c.embeddings && typeof c.embeddings.length === 'number';
      expect(isArray || hasLength).toBe(true);
      expect(c.embeddings.length).toBe(384);
      
      // Number fields
      expect(c.weight).toBeDefined();
      expect(typeof c.weight).toBe('number');
      expect(c.weight).toBeGreaterThan(0);
      expect(c.weight).toBeLessThanOrEqual(1);
      
      // Array fields (normalized schema uses native arrays, not JSON)
      expect(c.catalogIds).toBeDefined();
      expect(Array.isArray(c.catalogIds)).toBe(true);
      
      expect(c.adjacentIds).toBeDefined();
      expect(Array.isArray(c.adjacentIds)).toBe(true);
    });
    
    it('should handle array fields correctly', async () => {
      // ARRANGE: Concept with array fields (normalized schema uses native arrays)
      const conceptName = 'clean architecture';
      
      // ACT: Retrieve concept
      const conceptOpt = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Array fields should be properly mapped
      expect(isSome(conceptOpt)).toBe(true);
      
      // catalogIds array (replaces sources)
      expect(Array.isArray(conceptOpt.value.catalogIds)).toBe(true);
      
      // adjacentIds array (replaces relatedConcepts)
      expect(Array.isArray(conceptOpt.value.adjacentIds)).toBe(true);
    });
  });
  
  describe('edge cases and error handling', () => {
    it('should handle empty string lookup', async () => {
      // ARRANGE: Empty concept name
      const emptyConcept = '';
      
      // ACT: Query with empty string
      const conceptOpt = await conceptRepo.findByName(emptyConcept);
      
      // ASSERT: Should return null, not throw
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should handle whitespace-only concept names', async () => {
      // ARRANGE: Whitespace-only string
      const whitespaceConcept = '   ';
      
      // ACT: Query with whitespace
      const conceptOpt = await conceptRepo.findByName(whitespaceConcept);
      
      // ASSERT: Should return null, not throw
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should handle very long concept names', async () => {
      // ARRANGE: Extremely long concept name
      const longConcept = 'x'.repeat(1000);
      
      // ACT: Query with very long string
      const conceptOpt = await conceptRepo.findByName(longConcept);
      
      // ASSERT: Should handle gracefully
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should handle special characters in concept names', async () => {
      // ARRANGE: Concept name with special characters
      const specialCharConcept = '!@#$%^&*()';
      
      // ACT: Query with special characters
      const conceptOpt = await conceptRepo.findByName(specialCharConcept);
      
      // ASSERT: Should return null without error
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should handle concept names with unicode characters', async () => {
      // ARRANGE: Concept name with unicode
      const unicodeConcept = '概念検索';
      
      // ACT: Query with unicode characters
      const conceptOpt = await conceptRepo.findByName(unicodeConcept);
      
      // ASSERT: Should handle unicode gracefully
      expect(isNone(conceptOpt)).toBe(true);
    });
    
    it('should handle SQL-like injection attempts', async () => {
      // ARRANGE: String resembling SQL injection
      const injectionAttempt = "'; DROP TABLE concepts; --";
      
      // ACT: Query with injection-like string
      const conceptOpt = await conceptRepo.findByName(injectionAttempt);
      
      // ASSERT: Should handle safely, not execute
      expect(isNone(conceptOpt)).toBe(true);
    });
  });
  
  describe('vector field detection', () => {
    it('should detect and use vector field from LanceDB', async () => {
      // ARRANGE: Concept that should have vector field
      const conceptName = 'repository pattern';
      
      // ACT: Retrieve concept
      const conceptOpt = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Vector field should be detected and mapped
      expect(isSome(conceptOpt)).toBe(true);
      if (isSome(conceptOpt)) {
        // @ts-expect-error - Type narrowing limitation
        expect((conceptOpt as { tag: "some"; value: Concept }).value.embeddings).toBeDefined();
        // @ts-expect-error - Type narrowing limitation
        expect((conceptOpt as { tag: "some"; value: Concept }).value.embeddings.length).toBe(384);
      }
      
      // Verify it's either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(conceptOpt.value.embeddings);
      const isArrowVector = typeof conceptOpt.value.embeddings === 'object' && 'length' in conceptOpt.value.embeddings;
      expect(isArray || isArrowVector).toBe(true);
    });
  });
});
