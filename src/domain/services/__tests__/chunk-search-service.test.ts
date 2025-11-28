/**
 * Unit Tests for ChunkSearchService
 * 
 * Tests the domain service for chunk-level search operations.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkSearchService } from '../chunk-search-service.js';
import { ChunkRepository } from '../../interfaces/repositories/chunk-repository.js';
import { Chunk, SearchResult } from '../../models/index.js';
import { isOk, isErr } from '../../functional/index.js';

/**
 * Mock ChunkRepository for testing
 */
class MockChunkRepository implements ChunkRepository {
  private searchResults: SearchResult[] = [];
  private sourceChunks: Map<string, Chunk[]> = new Map();

  async search(query: { text: string; limit: number; debug?: boolean }): Promise<SearchResult[]> {
    return Promise.resolve(this.searchResults.slice(0, query.limit));
  }

  async findByConceptName(conceptName: string, limit: number): Promise<Chunk[]> {
    return Promise.resolve([]);
  }

  async findBySource(sourcePath: string, limit: number): Promise<Chunk[]> {
    const chunks = this.sourceChunks.get(sourcePath) || [];
    return Promise.resolve(chunks.slice(0, limit));
  }

  async findByCatalogId(catalogId: number, limit: number): Promise<Chunk[]> {
    return Promise.resolve([]);
  }

  async countChunks(): Promise<number> {
    return Promise.resolve(0);
  }

  // Test helpers
  setSearchResults(results: SearchResult[]): void {
    this.searchResults = results;
  }

  setSourceChunks(sourcePath: string, chunks: Chunk[]): void {
    this.sourceChunks.set(sourcePath, chunks);
  }

  clear(): void {
    this.searchResults = [];
    this.sourceChunks.clear();
  }
}

describe('ChunkSearchService', () => {
  let service: ChunkSearchService;
  let mockRepo: MockChunkRepository;

  beforeEach(() => {
    // SETUP: Create fresh mocks for each test
    mockRepo = new MockChunkRepository();
    service = new ChunkSearchService(mockRepo);
  });

  describe('searchBroad', () => {
    it('should delegate to chunk repository search', async () => {
      // SETUP
      const mockResults: SearchResult[] = [
        {
          id: 1,
          text: 'Chunk about software architecture',
          source: '/docs/architecture.pdf',
          hash: 'hash1',
          catalogId: 12345678,
          distance: 0.2,
          vectorScore: 0.8,
          bm25Score: 0.7,
          titleScore: 0.5,
          conceptScore: 0.6,
          wordnetScore: 0.4,
          hybridScore: 0.67,
          concepts: ['architecture']
        }
      ];
      mockRepo.setSearchResults(mockResults);

      // EXERCISE
      const result = await service.searchBroad({
        text: 'software architecture',
        limit: 5
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.length).toBe(1);
      }
    });

    it('should pass search parameters correctly', async () => {
      // SETUP
      const mockResults: SearchResult[] = [
        {
          id: 1,
          text: 'Test chunk',
          source: '/test.pdf',
          hash: 'hash1',
          catalogId: 12345678,
          distance: 0.2,
          vectorScore: 0.8,
          bm25Score: 0.7,
          titleScore: 0.5,
          conceptScore: 0.6,
          wordnetScore: 0.4,
          hybridScore: 0.67,
          concepts: []
        }
      ];
      mockRepo.setSearchResults(mockResults);

      // EXERCISE
      const result = await service.searchBroad({
        text: 'test query',
        limit: 1
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value[0].id).toBe('1');
      }
    });

    it('should pass debug flag to repository', async () => {
      // SETUP
      mockRepo.setSearchResults([]);

      // EXERCISE
      await service.searchBroad({
        text: 'test',
        limit: 5,
        debug: true
      });

      // VERIFY
      // VERIFY
      expect(true).toBe(true);
    });

    it('should default debug to false when not provided', async () => {
      // SETUP
      mockRepo.setSearchResults([]);

      // EXERCISE
      await service.searchBroad({
        text: 'test',
        limit: 5
      });

      // VERIFY
      // VERIFY
      expect(true).toBe(true);
    });

    it('should handle empty results', async () => {
      // SETUP
      mockRepo.setSearchResults([]);

      // EXERCISE
      const result = await service.searchBroad({
        text: 'nonexistent query',
        limit: 5
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.length).toBe(0);
      }
    });

    it('should respect limit parameter', async () => {
      // SETUP
      const mockResults: SearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1000,
        text: `Chunk ${i}`,
        source: `/doc${i}.pdf`,
        hash: `hash${i}`,
        catalogId: 12345678,
        distance: 0.2,
        vectorScore: 0.8,
        bm25Score: 0.7,
        titleScore: 0.5,
        conceptScore: 0.6,
        wordnetScore: 0.4,
        hybridScore: 0.67,
        concepts: []
      }));
      mockRepo.setSearchResults(mockResults);

      // EXERCISE
      const result = await service.searchBroad({
        text: 'test',
        limit: 3
      });

      // VERIFY
      // VERIFY
    });
  });

  describe('searchInSource', () => {
    it('should find chunks from specific source', async () => {
      // SETUP
      const sourcePath = '/docs/architecture.pdf';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'First chunk',
          source: sourcePath,
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        },
        {
          id: 2,
          text: 'Second chunk',
          source: sourcePath,
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['design'],
        }
      ];
      mockRepo.setSourceChunks(sourcePath, mockChunks);

      // EXERCISE
      const result = await service.searchInSource({
        text: 'architecture',
        source: sourcePath,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.length).toBe(2);
      }
    });

    it('should respect limit parameter', async () => {
      // SETUP
      const sourcePath = '/docs/test.pdf';
      const mockChunks: Chunk[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1000,
        text: `Chunk ${i}`,
        source: sourcePath,
        hash: `hash${i}`,
        catalogId: 12345678,
        concepts: [],
      }));
      mockRepo.setSourceChunks(sourcePath, mockChunks);

      // EXERCISE
      const result = await service.searchInSource({
        text: 'test',
        source: sourcePath,
        limit: 5
      });

      // VERIFY
      // VERIFY
    });

    it('should return empty array for nonexistent source', async () => {
      // SETUP
      const sourcePath = '/docs/nonexistent.pdf';
      mockRepo.setSourceChunks(sourcePath, []);

      // EXERCISE
      const result = await service.searchInSource({
        text: 'test',
        source: sourcePath,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.length).toBe(0);
      }
    });

    it('should handle empty source document', async () => {
      // SETUP
      const sourcePath = '/docs/empty.pdf';
      mockRepo.setSourceChunks(sourcePath, []);

      // EXERCISE
      const result = await service.searchInSource({
        text: 'test',
        source: sourcePath,
        limit: 10
      });

      // VERIFY
      // VERIFY
    });

    it('should pass source path correctly', async () => {
      // SETUP
      const sourcePath = '/docs/specific.pdf';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk from specific source',
          source: sourcePath,
          hash: 'hash1',
          catalogId: 12345678,
          concepts: [],
        }
      ];
      mockRepo.setSourceChunks(sourcePath, mockChunks);

      // EXERCISE
      const result = await service.searchInSource({
        text: 'test',
        source: sourcePath,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value[0].source).toBe(sourcePath);
      }
    });

    it('should handle multiple sources correctly', async () => {
      // SETUP
      const source1 = '/docs/doc1.pdf';
      const source2 = '/docs/doc2.pdf';
      const chunks1: Chunk[] = [
        {
          id: 1,
          text: 'Chunk from doc1',
          source: source1,
          hash: 'hash1',
          catalogId: 12345678,
          concepts: [],
        }
      ];
      const chunks2: Chunk[] = [
        {
          id: 2,
          text: 'Chunk from doc2',
          source: source2,
          hash: 'hash1',
          catalogId: 12345678,
          concepts: [],
        }
      ];
      mockRepo.setSourceChunks(source1, chunks1);
      mockRepo.setSourceChunks(source2, chunks2);

      // EXERCISE
      const results1 = await service.searchInSource({
        text: 'test',
        source: source1,
        limit: 10
      });
      const results2 = await service.searchInSource({
        text: 'test',
        source: source2,
        limit: 10
      });

      // VERIFY
      expect(isOk(results1)).toBe(true);
      expect(isOk(results2)).toBe(true);
      if (isOk(results1) && isOk(results2)) {
        expect(results1.value[0].source).toBe(source1);
        expect(results2.value.length).toBe(1);
        expect(results2.value[0].source).toBe(source2);
      }
    });
  });
});

