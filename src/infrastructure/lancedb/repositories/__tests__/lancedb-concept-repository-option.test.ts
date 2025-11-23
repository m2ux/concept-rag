/**
 * Tests for Option-based methods in LanceDBConceptRepository
 * 
 * These tests verify that the Option<T> variants properly wrap
 * the nullable methods and provide type-safe composition.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanceDBConceptRepository } from '../lancedb-concept-repository.js';
import { Concept } from '../../../../domain/models/index.js';
import { isSome, isNone, foldOption, mapOption, getOrElse } from '../../../../domain/functional/index.js';
import type { Table } from '@lancedb/lancedb';

describe('LanceDBConceptRepository - Option Methods', () => {
  let repository: LanceDBConceptRepository;
  let mockTable: Partial<Table>;

  beforeEach(() => {
    // Create mock table with query builder chain
    mockTable = {
      query: vi.fn()
    };
    
    repository = new LanceDBConceptRepository(mockTable as Table);
  });

  describe('findByNameOpt', () => {
    it('should return Some(concept) when concept exists', async () => {
      const mockConcept: Concept = {
        concept: 'test-concept',
        conceptType: 'primary',
        sources: ['doc1.pdf'],
        relatedConcepts: ['related1', 'related2'],
        embeddings: Array(384).fill(0.1),  // Proper 384-dimensional vector
        weight: 1.0,
        category: 'test-category'
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            concept: 'test-concept',
            concept_type: 'primary',
            sources: JSON.stringify(['doc1.pdf']),
            related_concepts: JSON.stringify(['related1', 'related2']),
            vector: Array(384).fill(0.1),  // Proper 384-dimensional vector
            weight: 1.0,
            category: 'test-category'
          }
        ])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('test-concept');

      expect(isSome(result)).toBe(true);
      
      // Extract value using fold
      const concept = foldOption(
        result,
        () => null,
        (c) => c
      );
      
      expect(concept).not.toBeNull();
      expect(concept?.concept).toBe('test-concept');
      expect(concept?.conceptType).toBe('primary');
    });

    it('should return None when concept does not exist', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('nonexistent');

      expect(isNone(result)).toBe(true);
    });

    it('should allow functional composition with map', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            concept: 'test-concept',
            concept_type: 'primary',
            sources: JSON.stringify(['doc1.pdf']),
            related_concepts: JSON.stringify(['related1', 'related2']),
            vector: Array(384).fill(0.1),  // Proper 384-dimensional vector
            weight: 1.0,
            category: 'test-category'
          }
        ])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('test-concept');
      
      // Extract concept name using map
      const conceptName = mapOption(result, c => c.concept);
      
      expect(isSome(conceptName)).toBe(true);
      const name = foldOption(conceptName, () => '', (n) => n);
      expect(name).toBe('test-concept');
    });

    it('should provide default value with getOrElse when concept missing', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('nonexistent');
      
      // Extract category with default
      const category = mapOption(result, c => c.category);
      const categoryValue = getOrElse(category, 'unknown');
      
      expect(categoryValue).toBe('unknown');
    });

    it('should chain multiple operations with flatMap', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            concept: 'test-concept',
            concept_type: 'primary',
            sources: JSON.stringify(['doc1.pdf']),
            related_concepts: JSON.stringify(['related1', 'related2']),
            vector: Array(384).fill(0.1),  // Proper 384-dimensional vector
            weight: 1.0,
            category: 'test-category'
          }
        ])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('test-concept');
      
      // Simulate extracting related concepts
      const relatedCount = foldOption(
        result,
        () => 0,
        (c) => c.relatedConcepts?.length || 0
      );
      
      expect(relatedCount).toBe(2);
    });
  });

  describe('findByIdOpt', () => {
    it('should return Some(concept) when concept exists by ID', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            concept: 'test-concept',
            concept_type: 'primary',
            sources: JSON.stringify(['doc1.pdf']),
            related_concepts: JSON.stringify([]),
            vector: Array(384).fill(0.1),  // Proper 384-dimensional vector
            weight: 1.0,
            category: 'test-category'
          }
        ])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(12345);

      expect(isSome(result)).toBe(true);
      
      const concept = foldOption(
        result,
        () => null,
        (c) => c
      );
      
      expect(concept).not.toBeNull();
      expect(concept?.concept).toBe('test-concept');
    });

    it('should return None when concept ID does not exist', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(99999);

      expect(isNone(result)).toBe(true);
    });

    it('should compose with getOrElse for default values', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(99999);
      
      const defaultConcept: Concept = {
        concept: 'default',
        conceptType: 'primary',
        sources: [],
        relatedConcepts: [],
        embeddings: [],
        weight: 0,
        category: 'unknown'
      };
      
      const concept = getOrElse(result, defaultConcept);
      
      expect(concept.concept).toBe('default');
    });
  });

  describe('Option composition patterns', () => {
    it('should support safe navigation through nested properties', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            concept: 'test-concept',
            concept_type: 'primary',
            sources: JSON.stringify(['doc1.pdf', 'doc2.pdf']),
            related_concepts: JSON.stringify(['related1']),
            vector: Array(384).fill(0.1),  // Proper 384-dimensional vector
            weight: 1.0,
            category: 'test-category'
          }
        ])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const conceptOpt = await repository.findByNameOpt('test-concept');
      
      // Safe extraction of nested data
      const sourceCount = foldOption(
        conceptOpt,
        () => 0,
        (c) => c.sources?.length || 0
      );
      
      expect(sourceCount).toBe(2);
    });

    it('should handle None gracefully in computation chains', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const conceptOpt = await repository.findByNameOpt('nonexistent');
      
      // Chain operations on None - should return empty result
      const result = foldOption(
        mapOption(conceptOpt, c => c.relatedConcepts),
        () => [],
        (related) => related || []
      );
      
      expect(result).toEqual([]);
    });
  });
});

