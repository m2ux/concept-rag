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
import { ILogger } from '../../infrastructure/observability/index.js';
import * as defaults from '../../config.js';

// Mock Logger for tests
class MockLogger implements ILogger {
  debug = () => {};
  info = () => {};
  warn = () => {};
  error = () => {};
  logOperation = () => {};
  child = () => this;
}

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
    const mockLogger = new MockLogger();
    
    conceptRepo = new LanceDBConceptRepository(conceptsTable, mockLogger);
  }, 30000);
  
  afterAll(async () => {
    await fixture.teardown();
  });
  
  describe('findByName', () => {
    it('should find concept by exact name', async () => {
      // ARRANGE: Known concept in test data
      const conceptName = 'clean architecture';
      
      // ACT: Query by exact name
      const concept = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Concept should be found with correct data
      expect(concept).toBeDefined();
      expect(concept).not.toBeNull();
      expect(concept!.concept).toBe('clean architecture');
      expect(concept!.category).toBe('Architecture Pattern');
    });
    
    it('should handle case-insensitive lookup', async () => {
      // ARRANGE: Same concept name in different cases
      const conceptLower = 'clean architecture';
      const conceptUpper = 'CLEAN ARCHITECTURE';
      const conceptMixed = 'Clean Architecture';
      
      // ACT: Query with all case variations
      const lower = await conceptRepo.findByName(conceptLower);
      const upper = await conceptRepo.findByName(conceptUpper);
      const mixed = await conceptRepo.findByName(conceptMixed);
      
      // ASSERT: All should find the same concept
      expect(lower).toBeDefined();
      expect(upper).toBeDefined();
      expect(mixed).toBeDefined();
      
      expect(upper!.concept).toBe(lower!.concept);
      expect(mixed!.concept).toBe(lower!.concept);
    });
    
    it('should return null for non-existent concept', async () => {
      // ARRANGE: Concept name not in test data
      const nonExistentConcept = 'nonexistent-concept-xyz';
      
      // ACT: Query for non-existent concept
      const concept = await conceptRepo.findByName(nonExistentConcept);
      
      // ASSERT: Should return null, not throw error
      expect(concept).toBeNull();
    });
    
    it('should correctly map vector field (critical bug fix verification)', async () => {
      // ARRANGE: Query concept with embeddings
      const conceptName = 'typescript';
      
      // ACT: Retrieve concept
      const concept = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Critical test - verifies vector/embeddings field mapping bug fix
      expect(concept).not.toBeNull();
      expect(concept!.embeddings).toBeDefined();
      
      // Embeddings can be either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(concept!.embeddings);
      const hasLength = 'length' in concept!.embeddings && typeof concept!.embeddings.length === 'number';
      expect(isArray || hasLength).toBe(true);
      expect(concept!.embeddings.length).toBe(384); // Expected embedding dimension
      
      // Verify embeddings contain valid data (convert to array if needed)
      const embeddingsArray = Array.isArray(concept!.embeddings) 
        ? concept!.embeddings 
        : Array.from(concept!.embeddings as any);
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
      const concept = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Verify all field mappings from LanceDB to domain model
      expect(concept).not.toBeNull();
      const c = concept!;
      
      // String fields
      expect(c.concept).toBeDefined();
      expect(typeof c.concept).toBe('string');
      expect(c.concept).toBe('dependency injection');
      
      // Vector field (critical)
      expect(c.embeddings).toBeDefined();
      
      // Embeddings can be either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(c.embeddings);
      const hasLength = 'length' in c.embeddings && typeof c.embeddings.length === 'number';
      expect(isArray || hasLength).toBe(true);
      expect(c.embeddings.length).toBe(384);
      
      expect(c.category).toBeDefined();
      expect(typeof c.category).toBe('string');
      expect(c.category).toBe('Design Pattern');
      
      // Number fields
      expect(c.weight).toBeDefined();
      expect(typeof c.weight).toBe('number');
      expect(c.weight).toBeGreaterThan(0);
      expect(c.weight).toBeLessThanOrEqual(1);
      
      expect(c.chunkCount).toBeDefined();
      expect(typeof c.chunkCount).toBe('number');
      expect(c.chunkCount).toBeGreaterThan(0);
      
      // Array fields (JSON deserialized)
      expect(c.sources).toBeDefined();
      expect(Array.isArray(c.sources)).toBe(true);
      expect(c.sources.length).toBeGreaterThan(0);
      
      expect(c.relatedConcepts).toBeDefined();
      expect(Array.isArray(c.relatedConcepts)).toBe(true);
    });
    
    it('should parse JSON fields correctly', async () => {
      // ARRANGE: Concept with JSON-stringified array fields
      const conceptName = 'clean architecture';
      
      // ACT: Retrieve concept
      const concept = await conceptRepo.findByName(conceptName);
      
      // ASSERT: JSON fields should be deserialized to arrays
      expect(concept).not.toBeNull();
      
      // Sources array
      expect(Array.isArray(concept!.sources)).toBe(true);
      expect(concept!.sources.length).toBeGreaterThan(0);
      expect(concept!.sources[0]).toContain('.pdf');
      
      // Related concepts array
      expect(Array.isArray(concept!.relatedConcepts)).toBe(true);
      expect(concept!.relatedConcepts.length).toBeGreaterThan(0);
      expect(concept!.relatedConcepts).toContain('layered architecture');
    });
  });
  
  describe('edge cases and error handling', () => {
    it('should handle empty string lookup', async () => {
      // ARRANGE: Empty concept name
      const emptyConcept = '';
      
      // ACT: Query with empty string
      const concept = await conceptRepo.findByName(emptyConcept);
      
      // ASSERT: Should return null, not throw
      expect(concept).toBeNull();
    });
    
    it('should handle whitespace-only concept names', async () => {
      // ARRANGE: Whitespace-only string
      const whitespaceConcept = '   ';
      
      // ACT: Query with whitespace
      const concept = await conceptRepo.findByName(whitespaceConcept);
      
      // ASSERT: Should return null, not throw
      expect(concept).toBeNull();
    });
    
    it('should handle very long concept names', async () => {
      // ARRANGE: Extremely long concept name
      const longConcept = 'x'.repeat(1000);
      
      // ACT: Query with very long string
      const concept = await conceptRepo.findByName(longConcept);
      
      // ASSERT: Should handle gracefully
      expect(concept).toBeNull();
    });
    
    it('should handle special characters in concept names', async () => {
      // ARRANGE: Concept name with special characters
      const specialCharConcept = '!@#$%^&*()';
      
      // ACT: Query with special characters
      const concept = await conceptRepo.findByName(specialCharConcept);
      
      // ASSERT: Should return null without error
      expect(concept).toBeNull();
    });
    
    it('should handle concept names with unicode characters', async () => {
      // ARRANGE: Concept name with unicode
      const unicodeConcept = '概念検索';
      
      // ACT: Query with unicode characters
      const concept = await conceptRepo.findByName(unicodeConcept);
      
      // ASSERT: Should handle unicode gracefully
      expect(concept).toBeNull();
    });
    
    it('should handle SQL-like injection attempts', async () => {
      // ARRANGE: String resembling SQL injection
      const injectionAttempt = "'; DROP TABLE concepts; --";
      
      // ACT: Query with injection-like string
      const concept = await conceptRepo.findByName(injectionAttempt);
      
      // ASSERT: Should handle safely, not execute
      expect(concept).toBeNull();
    });
  });
  
  describe('vector field detection', () => {
    it('should detect and use vector field from LanceDB', async () => {
      // ARRANGE: Concept that should have vector field
      const conceptName = 'repository pattern';
      
      // ACT: Retrieve concept
      const concept = await conceptRepo.findByName(conceptName);
      
      // ASSERT: Vector field should be detected and mapped
      expect(concept).not.toBeNull();
      expect(concept!.embeddings).toBeDefined();
      expect(concept!.embeddings.length).toBe(384);
      
      // Verify it's either an array or Arrow Vector object (both valid)
      const isArray = Array.isArray(concept!.embeddings);
      const isArrowVector = typeof concept!.embeddings === 'object' && 'length' in concept!.embeddings;
      expect(isArray || isArrowVector).toBe(true);
    });
  });
});
