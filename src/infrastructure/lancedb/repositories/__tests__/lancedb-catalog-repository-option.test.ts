/**
 * Tests for Option-based methods in LanceDBCatalogRepository
 * 
 * Verifies that the Option<SearchResult> variant provides type-safe
 * handling of potentially missing catalog entries.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanceDBCatalogRepository } from '../lancedb-catalog-repository.js';
import { SearchResult } from '../../../../domain/models/index.js';
import { isSome, isNone, foldOption, mapOption, getOrElse } from '../../../../domain/functional/index.js';
import type { Table } from '@lancedb/lancedb';
import type { HybridSearchService } from '../../../../domain/interfaces/services/hybrid-search-service.js';

describe('LanceDBCatalogRepository - Option Methods', () => {
  let repository: LanceDBCatalogRepository;
  let mockTable: Partial<Table>;
  let mockHybridSearchService: HybridSearchService;

  beforeEach(() => {
    mockTable = {
      query: vi.fn()
    };
    
    mockHybridSearchService = {
      search: vi.fn()
    } as any;

    repository = new LanceDBCatalogRepository(
      mockTable as Table,
      mockHybridSearchService
    );
  });

  describe('findBySourceOpt', () => {
    it('should return Some(result) when document is found', async () => {
      const mockResult: SearchResult = {
        id: 1,
        text: 'Document summary',
        source: '/docs/test.pdf',
        hash: 'hash123',
        concepts: {
          primary_concepts: ['concept1', 'concept2'],
          technical_terms: [],
          related_concepts: [],
          categories: ['category1']
        },
        embeddings: [0.1, 0.2, 0.3],
        hybridScore: 0.9,
        vectorScore: 0.85,
        bm25Score: 0.8,
        titleScore: 1.0,
        conceptScore: 0.7,
        wordnetScore: 0.6
      };

      (mockHybridSearchService.search as any).mockResolvedValue([mockResult]);

      const result = await repository.findBySourceOpt('/docs/test.pdf');

      expect(isSome(result)).toBe(true);
      
      const document = foldOption(
        result,
        () => null,
        (doc) => doc
      );
      
      expect(document).not.toBeNull();
      expect(document?.source).toBe('/docs/test.pdf');
      expect(document?.text).toBe('Document summary');
    });

    it('should return None when document is not found', async () => {
      (mockHybridSearchService.search as any).mockResolvedValue([]);

      const result = await repository.findBySourceOpt('/docs/nonexistent.pdf');

      expect(isNone(result)).toBe(true);
    });

    it('should allow extracting document metadata with map', async () => {
      const mockResult: SearchResult = {
        id: 1,
        text: 'Document summary',
        source: '/docs/test.pdf',
        hash: 'hash123',
        concepts: {
          primary_concepts: ['concept1', 'concept2', 'concept3'],
          technical_terms: [],
          related_concepts: [],
          categories: ['category1']
        },
        embeddings: [0.1, 0.2, 0.3],
        hybridScore: 0.9,
        vectorScore: 0.85,
        bm25Score: 0.8,
        titleScore: 1.0,
        conceptScore: 0.7,
        wordnetScore: 0.6
      };

      (mockHybridSearchService.search as any).mockResolvedValue([mockResult]);

      const result = await repository.findBySourceOpt('/docs/test.pdf');
      
      // Extract concept count
      const conceptCountOpt = mapOption(
        result,
        doc => doc.concepts.primary_concepts.length
      );
      
      const conceptCount = getOrElse(conceptCountOpt, 0);
      expect(conceptCount).toBe(3);
    });

    it('should provide default values with getOrElse', async () => {
      (mockHybridSearchService.search as any).mockResolvedValue([]);

      const result = await repository.findBySourceOpt('/docs/missing.pdf');
      
      const defaultResult: SearchResult = {
        id: -1,
        text: 'Not found',
        source: 'unknown',
        hash: '',
        concepts: {
          primary_concepts: [],
          technical_terms: [],
          related_concepts: [],
          categories: []
        },
        embeddings: [],
        hybridScore: 0,
        vectorScore: 0,
        bm25Score: 0,
        titleScore: 0,
        conceptScore: 0,
        wordnetScore: 0
      };
      
      const document = getOrElse(result, defaultResult);
      
      expect(document.text).toBe('Not found');
      expect(document.source).toBe('unknown');
    });

    it('should safely extract nested concept data', async () => {
      const mockResult: SearchResult = {
        id: 1,
        text: 'Document summary',
        source: '/docs/test.pdf',
        hash: 'hash123',
        concepts: {
          primary_concepts: ['microservices', 'API design'],
          technical_terms: ['REST', 'GraphQL'],
          related_concepts: ['architecture'],
          categories: ['software engineering', 'distributed systems']
        },
        embeddings: [0.1, 0.2, 0.3],
        hybridScore: 0.9,
        vectorScore: 0.85,
        bm25Score: 0.8,
        titleScore: 1.0,
        conceptScore: 0.7,
        wordnetScore: 0.6
      };

      (mockHybridSearchService.search as any).mockResolvedValue([mockResult]);

      const result = await repository.findBySourceOpt('/docs/test.pdf');
      
      // Extract categories safely
      const categories = foldOption(
        result,
        () => [],
        doc => doc.concepts.categories
      );
      
      expect(categories).toHaveLength(2);
      expect(categories).toContain('software engineering');
    });

    it('should compose with fold for conditional logic', async () => {
      const mockResult: SearchResult = {
        id: 1,
        text: 'A'.repeat(500), // Long summary
        source: '/docs/test.pdf',
        hash: 'hash123',
        concepts: {
          primary_concepts: [],
          technical_terms: [],
          related_concepts: [],
          categories: []
        },
        embeddings: [],
        hybridScore: 0.9,
        vectorScore: 0.85,
        bm25Score: 0.8,
        titleScore: 1.0,
        conceptScore: 0.7,
        wordnetScore: 0.6
      };

      (mockHybridSearchService.search as any).mockResolvedValue([mockResult]);

      const result = await repository.findBySourceOpt('/docs/test.pdf');
      
      // Conditional: truncate summary if too long
      const summary = foldOption(
        result,
        () => 'No summary available',
        doc => doc.text.length > 100 ? doc.text.substring(0, 100) + '...' : doc.text
      );
      
      expect(summary).toHaveLength(103); // 100 chars + '...'
    });

    it('should handle None gracefully in computation chains', async () => {
      (mockHybridSearchService.search as any).mockResolvedValue([]);

      const result = await repository.findBySourceOpt('/docs/missing.pdf');
      
      // Try to extract categories from missing document
      const categories = foldOption(
        mapOption(result, doc => doc.concepts.categories),
        () => ['uncategorized'],
        cats => cats.length > 0 ? cats : ['uncategorized']
      );
      
      expect(categories).toEqual(['uncategorized']);
    });

    it('should support chaining multiple transformations', async () => {
      const mockResult: SearchResult = {
        id: 1,
        text: 'Document about microservices architecture',
        source: '/docs/architecture/microservices.pdf',
        hash: 'hash123',
        concepts: {
          primary_concepts: ['microservices', 'scalability', 'resilience'],
          technical_terms: [],
          related_concepts: [],
          categories: ['architecture']
        },
        embeddings: [0.1, 0.2, 0.3],
        hybridScore: 0.9,
        vectorScore: 0.85,
        bm25Score: 0.8,
        titleScore: 1.0,
        conceptScore: 0.7,
        wordnetScore: 0.6
      };

      (mockHybridSearchService.search as any).mockResolvedValue([mockResult]);

      const result = await repository.findBySourceOpt('/docs/architecture/microservices.pdf');
      
      // Chain: get document -> extract concepts -> filter -> count
      const microserviceConceptCount = foldOption(
        result,
        () => 0,
        doc => doc.concepts.primary_concepts.filter(c => c.includes('microservice')).length
      );
      
      expect(microserviceConceptCount).toBe(1);
    });
  });
});


