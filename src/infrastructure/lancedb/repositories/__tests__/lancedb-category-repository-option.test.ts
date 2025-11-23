/**
 * Tests for Option-based methods in LanceDBCategoryRepository
 * 
 * Verifies that the Option<Category> variants provide type-safe
 * handling of potentially missing categories.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanceDBCategoryRepository } from '../lancedb-category-repository.js';
import type { Category } from '../../../../domain/models/category.js';
import { isSome, isNone, foldOption, mapOption, getOrElse } from '../../../../domain/functional/index.js';
import type { Table } from '@lancedb/lancedb';

describe('LanceDBCategoryRepository - Option Methods', () => {
  let repository: LanceDBCategoryRepository;
  let mockTable: Partial<Table>;

  beforeEach(() => {
    mockTable = {
      query: vi.fn()
    };
    
    repository = new LanceDBCategoryRepository(mockTable as Table);
  });

  describe('findByIdOpt', () => {
    it('should return Some(category) when category exists', async () => {
      const mockCategory = {
        id: 12345,
        category: 'Software Engineering',
        parent_id: null,
        parent_category: null,
        aliases: JSON.stringify(['software-eng', 'swe']),
        document_count: 42,
        popularity: 0.85
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(12345);

      expect(isSome(result)).toBe(true);
      
      const category = foldOption(
        result,
        () => null,
        (cat) => cat
      );
      
      expect(category).not.toBeNull();
      expect(category?.category).toBe('Software Engineering');
      expect(category?.documentCount).toBe(42);
    });

    it('should return None when category ID does not exist', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(99999);

      expect(isNone(result)).toBe(true);
    });

    it('should extract category name with map', async () => {
      const mockCategory = {
        id: 12345,
        category: 'Distributed Systems',
        parent_id: null,
        parent_category: null,
        aliases: JSON.stringify([]),
        document_count: 25,
        popularity: 0.75
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByIdOpt(12345);
      const nameOpt = mapOption(result, cat => cat.category);
      
      const name = getOrElse(nameOpt, 'Unknown');
      expect(name).toBe('Distributed Systems');
    });
  });

  describe('findByNameOpt', () => {
    it('should return Some(category) when category name matches', async () => {
      const mockCategory = {
        id: 12345,
        category: 'Machine Learning',
        parent_id: 100,
        aliases: JSON.stringify(['ml', 'machine-learning']),
        document_count: 150,
        popularity: 0.95,
        parent_category_id: 100,
        description: '',
        related_categories: JSON.stringify([]),
        chunk_count: 0,
        concept_count: 0,
        vector: []
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Machine Learning');

      expect(isSome(result)).toBe(true);
      
      const category = foldOption(
        result,
        () => null,
        (cat) => cat
      );
      
      expect(category?.category).toBe('Machine Learning');
      expect(category?.parentCategoryId).toBe(100);
      expect(category?.aliases).toContain('ml');
    });

    it('should return None when category name does not exist', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Nonexistent Category');

      expect(isNone(result)).toBe(true);
    });

    it('should provide default document count with getOrElse', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Missing');
      const docCountOpt = mapOption(result, cat => cat.documentCount);
      
      const docCount = getOrElse(docCountOpt, 0);
      expect(docCount).toBe(0);
    });

    it('should safely extract nested data', async () => {
      const mockCategory = {
        id: 12345,
        category: 'TypeScript',
        parent_id: 200,
        parent_category: 'Programming Languages',
        aliases: JSON.stringify(['ts', 'typescript-lang']),
        document_count: 75,
        popularity: 0.88
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('TypeScript');
      
      const aliasCount = foldOption(
        result,
        () => 0,
        cat => cat.aliases.length
      );
      
      expect(aliasCount).toBe(2);
    });
  });

  describe('findByAliasOpt', () => {
    it('should return Some(category) when alias matches', async () => {
      const mockCategories = [
        {
          id: 12345,
          category: 'Machine Learning',
          parent_id: null,
          parent_category: null,
          aliases: JSON.stringify(['ml', 'machine-learning']),
          document_count: 150,
          popularity: 0.95
        },
        {
          id: 67890,
          category: 'Natural Language Processing',
          parent_id: null,
          parent_category: null,
          aliases: JSON.stringify(['nlp']),
          document_count: 80,
          popularity: 0.85
        }
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockCategories)
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByAliasOpt('ml');

      expect(isSome(result)).toBe(true);
      
      const category = foldOption(
        result,
        () => null,
        (cat) => cat
      );
      
      expect(category?.category).toBe('Machine Learning');
    });

    it('should return None when alias does not exist', async () => {
      const mockCategories = [
        {
          id: 12345,
          category: 'Machine Learning',
          parent_id: null,
          parent_category: null,
          aliases: JSON.stringify(['ml']),
          document_count: 150,
          popularity: 0.95
        }
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockCategories)
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByAliasOpt('nonexistent-alias');

      expect(isNone(result)).toBe(true);
    });

    it('should be case-insensitive for alias matching', async () => {
      const mockCategories = [
        {
          id: 12345,
          category: 'Natural Language Processing',
          parent_id: null,
          parent_category: null,
          aliases: JSON.stringify(['NLP', 'nlp-tech']),
          document_count: 80,
          popularity: 0.85
        }
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockCategories)
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByAliasOpt('nlp'); // lowercase

      expect(isSome(result)).toBe(true);
      
      const category = getOrElse(result, null as any);
      expect(category.category).toBe('Natural Language Processing');
    });
  });

  describe('Option composition patterns', () => {
    it('should chain operations to extract hierarchy information', async () => {
      const mockCategory = {
        id: 12345,
        category: 'React',
        parent_category_id: 100,
        aliases: JSON.stringify(['reactjs', 'react.js']),
        document_count: 200,
        popularity: 0.98,
        description: '',
        related_categories: JSON.stringify([]),
        chunk_count: 0,
        concept_count: 0,
        vector: []
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('React');
      
      // Extract category and parent ID
      const categoryInfo = foldOption(
        result,
        () => 'Unknown',
        cat => cat.parentCategoryId 
          ? `Category: ${cat.category}, Parent ID: ${cat.parentCategoryId}`
          : `Category: ${cat.category}`
      );
      
      expect(categoryInfo).toBe('Category: React, Parent ID: 100');
    });

    it('should handle None in complex computations', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Missing');
      
      // Compute popularity tier from missing category
      const popularityTier = foldOption(
        result,
        () => 'unknown',
        cat => {
          if (cat.popularity >= 0.9) return 'high';
          if (cat.popularity >= 0.5) return 'medium';
          return 'low';
        }
      );
      
      expect(popularityTier).toBe('unknown');
    });

    it('should support filtering based on category properties', async () => {
      const mockCategory = {
        id: 12345,
        category: 'Python',
        parent_id: null,
        parent_category: null,
        aliases: JSON.stringify(['py', 'python-lang']),
        document_count: 500,
        popularity: 0.97
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Python');
      
      // Filter: only include if document count > 100
      const isPopular = foldOption(
        result,
        () => false,
        cat => cat.documentCount > 100
      );
      
      expect(isPopular).toBe(true);
    });

    it('should combine multiple Option operations for complex queries', async () => {
      const mockCategory = {
        id: 12345,
        category: 'Kubernetes',
        parent_id: 200,
        parent_category: 'Container Orchestration',
        aliases: JSON.stringify(['k8s', 'kube']),
        document_count: 180,
        popularity: 0.92
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([mockCategory])
      };

      (mockTable.query as any).mockReturnValue(mockQuery);

      const result = await repository.findByNameOpt('Kubernetes');
      
      // Complex query: Extract summary info
      const summary = foldOption(
        result,
        () => ({ category: 'Unknown', aliases: 0, docs: 0 }),
        cat => ({
          category: cat.category,
          aliases: cat.aliases.length,
          docs: cat.documentCount
        })
      );
      
      expect(summary.category).toBe('Kubernetes');
      expect(summary.aliases).toBe(2);
      expect(summary.docs).toBe(180);
    });
  });
});

