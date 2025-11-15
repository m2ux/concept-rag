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
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { LanceDBConceptRepository } from '../../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import * as defaults from '../../config.js';

describe('LanceDBConceptRepository - Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let conceptRepo: LanceDBConceptRepository;
  
  beforeAll(async () => {
    // Setup test database with sample data
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
      const concept = await conceptRepo.findByName('clean architecture');
      
      expect(concept).toBeDefined();
      expect(concept).not.toBeNull();
      expect(concept!.concept).toBe('clean architecture');
      expect(concept!.category).toBe('Architecture Pattern');
    });
    
    it('should handle case-insensitive lookup', async () => {
      const lower = await conceptRepo.findByName('clean architecture');
      const upper = await conceptRepo.findByName('CLEAN ARCHITECTURE');
      const mixed = await conceptRepo.findByName('Clean Architecture');
      
      expect(lower).toBeDefined();
      expect(upper).toBeDefined();
      expect(mixed).toBeDefined();
      
      expect(upper!.concept).toBe(lower!.concept);
      expect(mixed!.concept).toBe(lower!.concept);
    });
    
    it('should return null for non-existent concept', async () => {
      const concept = await conceptRepo.findByName('nonexistent-concept-xyz');
      
      expect(concept).toBeNull();
    });
    
    it('should correctly map vector field (critical bug fix verification)', async () => {
      const concept = await conceptRepo.findByName('typescript');
      
      expect(concept).not.toBeNull();
      expect(concept!.embeddings).toBeDefined();
      expect(Array.isArray(concept!.embeddings)).toBe(true);
      expect(concept!.embeddings.length).toBe(384); // Expected embedding dimension
      
      // Verify embeddings are numbers, not undefined
      expect(typeof concept!.embeddings[0]).toBe('number');
      expect(concept!.embeddings.every(v => typeof v === 'number')).toBe(true);
    });
  });
  
  describe('field mapping validation', () => {
    it('should correctly map all concept fields from LanceDB', async () => {
      const concept = await conceptRepo.findByName('dependency injection');
      
      expect(concept).not.toBeNull();
      const c = concept!;
      
      // Verify all required fields
      expect(c.concept).toBeDefined();
      expect(typeof c.concept).toBe('string');
      expect(c.concept).toBe('dependency injection');
      
      expect(c.embeddings).toBeDefined();
      expect(Array.isArray(c.embeddings)).toBe(true);
      expect(c.embeddings.length).toBe(384);
      
      expect(c.category).toBeDefined();
      expect(typeof c.category).toBe('string');
      expect(c.category).toBe('Design Pattern');
      
      expect(c.weight).toBeDefined();
      expect(typeof c.weight).toBe('number');
      expect(c.weight).toBeGreaterThan(0);
      expect(c.weight).toBeLessThanOrEqual(1);
      
      expect(c.chunkCount).toBeDefined();
      expect(typeof c.chunkCount).toBe('number');
      expect(c.chunkCount).toBeGreaterThan(0);
      
      expect(c.sources).toBeDefined();
      expect(Array.isArray(c.sources)).toBe(true);
      expect(c.sources.length).toBeGreaterThan(0);
      
      expect(c.relatedConcepts).toBeDefined();
      expect(Array.isArray(c.relatedConcepts)).toBe(true);
    });
    
    it('should parse JSON fields correctly', async () => {
      const concept = await conceptRepo.findByName('clean architecture');
      
      expect(concept).not.toBeNull();
      
      // Sources should be parsed from JSON string to array
      expect(Array.isArray(concept!.sources)).toBe(true);
      expect(concept!.sources.length).toBeGreaterThan(0);
      expect(concept!.sources[0]).toContain('.pdf');
      
      // Related concepts should be parsed from JSON string to array
      expect(Array.isArray(concept!.relatedConcepts)).toBe(true);
      expect(concept!.relatedConcepts.length).toBeGreaterThan(0);
      expect(concept!.relatedConcepts).toContain('layered architecture');
    });
  });
  
  describe('vector field detection', () => {
    it('should detect vector field even if column is named "vector" not "embeddings"', async () => {
      // This test verifies the fix for the critical bug
      // LanceDB stores vectors in a column named 'vector', but we expose as 'embeddings' in domain model
      const concept = await conceptRepo.findByName('repository pattern');
      
      expect(concept).not.toBeNull();
      expect(concept!.embeddings).toBeDefined();
      expect(concept!.embeddings.length).toBe(384);
      
      // Should not be empty or undefined
      expect(concept!.embeddings.every(v => v !== undefined)).toBe(true);
      expect(concept!.embeddings.some(v => v !== 0)).toBe(true); // At least some non-zero values
    });
    
    it('should handle all test concepts without vector field errors', async () => {
      const conceptNames = [
        'clean architecture',
        'repository pattern',
        'dependency injection',
        'solid principles',
        'typescript'
      ];
      
      for (const name of conceptNames) {
        const concept = await conceptRepo.findByName(name);
        
        expect(concept).not.toBeNull();
        expect(concept!.embeddings).toBeDefined();
        expect(concept!.embeddings.length).toBe(384);
        
        // No zero-length or invalid embeddings
        expect(concept!.embeddings.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('data integrity', () => {
    it('should have consistent weight values', async () => {
      const concept = await conceptRepo.findByName('solid principles');
      
      expect(concept).not.toBeNull();
      expect(concept!.weight).toBeGreaterThan(0);
      expect(concept!.weight).toBeLessThanOrEqual(1);
    });
    
    it('should have valid chunk counts', async () => {
      const concept = await conceptRepo.findByName('typescript');
      
      expect(concept).not.toBeNull();
      expect(concept!.chunkCount).toBeGreaterThan(0);
      expect(Number.isInteger(concept!.chunkCount)).toBe(true);
    });
    
    it('should have non-empty sources array', async () => {
      const concept = await conceptRepo.findByName('dependency injection');
      
      expect(concept).not.toBeNull();
      expect(concept!.sources.length).toBeGreaterThan(0);
      expect(concept!.sources.every(s => typeof s === 'string' && s.length > 0)).toBe(true);
    });
  });
  
  describe('error handling', () => {
    it('should handle empty string gracefully', async () => {
      const concept = await conceptRepo.findByName('');
      
      // Should return null or throw, not crash
      expect(concept === null || concept === undefined).toBe(true);
    });
    
    it('should handle whitespace-only string', async () => {
      const concept = await conceptRepo.findByName('   ');
      
      expect(concept).toBeNull();
    });
    
    it('should handle special characters in concept name', async () => {
      // Should not throw, just return null for non-matching concept
      const concept = await conceptRepo.findByName('test!@#$%^&*()');
      
      expect(concept).toBeNull();
    });
  });
  
  describe('performance and limits', () => {
    it('should retrieve concept quickly', async () => {
      const start = Date.now();
      const concept = await conceptRepo.findByName('clean architecture');
      const duration = Date.now() - start;
      
      expect(concept).not.toBeNull();
      expect(duration).toBeLessThan(1000); // Should be under 1 second
    });
  });
});

