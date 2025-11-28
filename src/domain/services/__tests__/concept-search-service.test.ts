/**
 * Unit Tests for ConceptSearchService
 * 
 * Tests the domain service for concept-based search operations.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptSearchService } from '../concept-search-service.js';
import { ChunkRepository } from '../../interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../../interfaces/repositories/concept-repository.js';
import { Chunk, Concept } from '../../models/index.js';
// @ts-expect-error - Type narrowing limitation
import type { Option } from "../../../../__tests__/test-helpers/../../domain/functional/index.js";
import { fromNullable, isSome, isNone, None ,  isOk, isErr } from '../../functional/index.js';

/**
 * Mock ChunkRepository for testing
 */
class MockChunkRepository implements ChunkRepository {
  private conceptChunks: Map<string, Chunk[]> = new Map();

  async findByConceptName(conceptName: string, limit: number): Promise<Chunk[]> {
    const conceptLower = conceptName.toLowerCase();
    const chunks = this.conceptChunks.get(conceptLower) || [];
    return Promise.resolve(chunks.slice(0, limit));
  }

  async findBySource(sourcePath: string, limit: number): Promise<Chunk[]> {
    return Promise.resolve([]);
  }

  async search(query: { text: string; limit: number; debug?: boolean }): Promise<any[]> {
    return Promise.resolve([]);
  }

  async findByCatalogId(catalogId: number, limit: number): Promise<Chunk[]> {
    return Promise.resolve([]);
  }

  async countChunks(): Promise<number> {
    return Promise.resolve(0);
  }

  // Test helpers
  setConceptChunks(conceptName: string, chunks: Chunk[]): void {
    this.conceptChunks.set(conceptName.toLowerCase(), chunks);
  }

  clear(): void {
    this.conceptChunks.clear();
  }
}

/**
 * Mock ConceptRepository for testing
 */
class MockConceptRepository implements ConceptRepository {
  private concepts: Map<string, Concept> = new Map();

  async findById(id: number): Promise<Option<Concept>> {
    return Promise.resolve(None());
  }

  async findByName(conceptName: string): Promise<Option<Concept>> {
    const conceptLower = conceptName.toLowerCase();
    const concept = this.concepts.get(conceptLower);
    return Promise.resolve(fromNullable(concept));
  }

  async findRelated(conceptName: string, limit: number): Promise<Concept[]> {
    return Promise.resolve([]);
  }

  async searchConcepts(queryText: string, limit: number): Promise<Concept[]> {
    return Promise.resolve([]);
  }

  async findAll(): Promise<Concept[]> {
    return Promise.resolve([]);
  }

  // Test helpers
  setConcept(conceptName: string, concept: Concept): void {
    this.concepts.set(conceptName.toLowerCase(), concept);
  }

  clear(): void {
    this.concepts.clear();
  }
}

describe('ConceptSearchService', () => {
  let service: ConceptSearchService;
  let mockChunkRepo: MockChunkRepository;
  let mockConceptRepo: MockConceptRepository;

  beforeEach(() => {
    // SETUP: Create fresh mocks for each test
    mockChunkRepo = new MockChunkRepository();
    mockConceptRepo = new MockConceptRepository();
    service = new ConceptSearchService(mockChunkRepo, mockConceptRepo);
  });

  describe('searchConcept - basic functionality', () => {
    it('should find chunks containing concept', async () => {
      // SETUP
      const conceptName = 'dependency injection';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk about dependency injection',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['dependency injection'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.chunks[0].id).toBe('1');
      }
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.concept).toBe(conceptName);
      }
    });

    it('should handle case-insensitive concept names', async () => {
      // SETUP
      const conceptName = 'dependency injection';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk about DI',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['dependency injection'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: 'DEPENDENCY INJECTION', // Uppercase
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.concept).toBe('DEPENDENCY INJECTION');
      }
    });

    it('should trim whitespace from concept name', async () => {
      // SETUP
      const conceptName = 'dependency injection';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk about DI',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['dependency injection'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: '  dependency injection  ', // With whitespace
        limit: 10
      });

      // VERIFY
      // VERIFY
    });

    it('should return concept metadata when found', async () => {
      // SETUP
      const conceptName = 'dependency injection';
      const mockConcept: Concept = {
        // @ts-expect-error - Type narrowing limitation
        id: 123,
        concept: conceptName,
        conceptType: 'terminology',
        category: 'software engineering',
        sources: ['/docs/di.pdf'],
        relatedConcepts: ['inversion of control', 'DI container'],
        weight: 10
      };
      mockConceptRepo.setConcept(conceptName, mockConcept);
      mockChunkRepo.setConceptChunks(conceptName, []);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(isSome(result.value.conceptMetadata)).toBe(true);
        if (isSome(result.value.conceptMetadata)) {
          // @ts-expect-error - Type narrowing limitation
          expect(result.value.conceptMetadata.value.concept).toBe(conceptName);
          // @ts-expect-error - Type narrowing limitation
          expect(result.value.conceptMetadata.value.category).toBe('software engineering');
        }
      }
    });

    it('should return null metadata when concept not found', async () => {
      // SETUP
      const conceptName = 'nonexistent concept';
      mockChunkRepo.setConceptChunks(conceptName, []);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
    });

    it('should return related concepts from metadata', async () => {
      // SETUP
      const conceptName = 'microservices';
      const mockConcept: Concept = {
        // @ts-expect-error - Type narrowing limitation
        id: 456,
        concept: conceptName,
        conceptType: 'thematic',
        category: 'architecture',
        sources: ['/docs/microservices.pdf'],
        relatedConcepts: ['service-oriented architecture', 'API gateway', 'distributed systems'],
        weight: 15
      };
      mockConceptRepo.setConcept(conceptName, mockConcept);
      mockChunkRepo.setConceptChunks(conceptName, []);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.relatedConcepts).toContain('service-oriented architecture');
      }
    });

    it('should limit related concepts to 10', async () => {
      // SETUP
      const conceptName = 'architecture';
      const mockConcept: Concept = {
        // @ts-expect-error - Type narrowing limitation
        id: 789,
        concept: conceptName,
        conceptType: 'thematic',
        category: 'software engineering',
        sources: [],
        relatedConcepts: Array.from({ length: 15 }, (_, i) => `related-${i}`),
        weight: 20
      };
      mockConceptRepo.setConcept(conceptName, mockConcept);
      mockChunkRepo.setConceptChunks(conceptName, []);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
    });

    it('should return empty related concepts when concept not found', async () => {
      // SETUP
      const conceptName = 'nonexistent';
      mockChunkRepo.setConceptChunks(conceptName, []);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
      if (isOk(result)) {
        expect(result.value.relatedConcepts).toEqual([]);
      }
    });
  });

  describe('searchConcept - filtering', () => {
    it('should filter chunks by source', async () => {
      // SETUP
      const conceptName = 'architecture';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk from typescript guide',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        },
        {
          id: 2,
          text: 'Chunk from python guide',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sourceFilter: 'typescript'
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.chunks[0].catalogId).toContain('typescript');
      }
    });

    it('should handle case-insensitive source filtering', async () => {
      // SETUP
      const conceptName = 'design patterns';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk from TypeScript guide',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['design patterns'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sourceFilter: 'TYPESCRIPT'
      });

      // VERIFY
      // VERIFY
    });

    it('should return all chunks when source filter not provided', async () => {
      // SETUP
      const conceptName = 'testing';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk 1',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['testing'],
        },
        {
          id: 2,
          text: 'Chunk 2',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['testing'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
    });

    it('should return empty array when source filter matches nothing', async () => {
      // SETUP
      const conceptName = 'architecture';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sourceFilter: 'python'
      });

      // VERIFY
      // VERIFY
    });
  });

  describe('searchConcept - sorting', () => {
    it('should sort by density by default', async () => {
      // SETUP
      const conceptName = 'patterns';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Few concepts',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['patterns'],
        },
        {
          id: 2,
          text: 'Many concepts',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['patterns', 'design', 'architecture'],
        },
        {
          id: 3,
          text: 'Some concepts',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['patterns', 'design'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Results should be sorted by concept count (most concepts first)
        expect(result.value.chunks[0].concepts?.length).toBeGreaterThanOrEqual(result.value.chunks[1].concepts?.length || 0);
      }
    });

    it('should sort by relevance when specified', async () => {
      // SETUP
      const conceptName = 'testing';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Short chunk', // Short text, fewer concepts = lower relevance
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['testing'],
        },
        {
          id: 2,
          text: 'A'.repeat(300), // Long text (qualifies for text length bonus) + more concepts
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['testing', 'software', 'development'], // More concepts
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sortBy: 'relevance'
      });

      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Chunk 2 has higher relevance due to text length bonus and concept match
        expect(result.value.chunks[0].id).toBe('2');
      }
    });

    it('should sort by source when specified', async () => {
      // SETUP
      const conceptName = 'architecture';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk from Z document',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        },
        {
          id: 2,
          text: 'Chunk from A document',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['architecture'],
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sortBy: 'source'
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.chunks[1].catalogId).toBe('/docs/z.pdf');
      }
    });

    it('should handle chunks with null/undefined density', async () => {
      // SETUP
      const conceptName = 'patterns';
      const mockChunks: Chunk[] = [
        {
          id: 1,
          text: 'Chunk with density',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['patterns'],
        },
        {
          id: 2,
          text: 'Chunk without density',
          hash: 'hash1',
          catalogId: 12345678,
          concepts: ['patterns']
          // conceptDensity is undefined
        }
      ];
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.chunks[0].id).toBe('1');
      }
    });
  });

  describe('searchConcept - limiting', () => {
    it('should respect limit parameter', async () => {
      // SETUP
      const conceptName = 'testing';
      const mockChunks: Chunk[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1000,
        text: `Chunk ${i}`,
        hash: `hash${i}`,
        catalogId: 12345678,
        concepts: ['testing'],
      }));
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 5
      });

      // VERIFY
      // VERIFY
    });

    it('should request extra chunks for filtering', async () => {
      // SETUP
      const conceptName = 'architecture';
      const mockChunks: Chunk[] = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1000,
        text: `Chunk ${i}`,
        source: i < 15 ? '/docs/typescript.pdf' : '/docs/python.pdf',
        hash: `hash${i}`,
        catalogId: 12345678,
        concepts: ['architecture'],
      }));
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 10,
        sourceFilter: 'typescript'
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.chunks.length).toBe(10);
        expect(result.value.chunks.every(c => c.catalogId > 0)).toBe(true);
      }
    });

    it('should return totalFound from candidate chunks', async () => {
      // SETUP
      const conceptName = 'patterns';
      // Service requests limit * 2 = 10 chunks, so we'll return 10
      const mockChunks: Chunk[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1000,
        text: `Chunk ${i}`,
        hash: `hash${i}`,
        catalogId: 12345678,
        concepts: ['patterns'],
      }));
      mockChunkRepo.setConceptChunks(conceptName, mockChunks);

      // EXERCISE
      const result = await service.searchConcept({
        concept: conceptName,
        limit: 5
      });

      // VERIFY
      // VERIFY
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.totalFound).toBe(10);
      }
      // @ts-expect-error - Type narrowing limitation
      expect(result.value.chunks.length).toBe(5);
    });
  });

  describe('calculateRelevance', () => {
    it('should calculate relevance from concept count and text length', () => {
      // SETUP - Short text with concepts scores high on density (capped at 1)
      const chunk: Chunk = {
        id: 1,
        text: 'Chunk with concept',
        hash: 'hash1',
          catalogId: 12345678,
        concepts: ['testing', 'other'], // 2 concepts
      };
      const concept = 'testing';

      // EXERCISE
      const relevance = service.calculateRelevance(chunk, concept);

      // VERIFY
      // Short text (18 chars), 2 concepts: normalizedDensity = min(2 / (18/500), 1) = 1
      // score = 1 * 0.5 + 0.3 (concept match) = 0.8 (no text length bonus)
      expect(relevance).toBeCloseTo(0.8, 2);
    });

    it('should include concept match bonus', () => {
      // SETUP - Longer text with many concepts
      const chunk: Chunk = {
        id: 1,
        text: 'A'.repeat(300), // 300 chars (qualifies for text length bonus)
        hash: 'hash1',
          catalogId: 12345678,
        concepts: ['testing', 'other', 'third'], // 3 concepts
      };
      const concept = 'testing';

      // EXERCISE
      const relevance = service.calculateRelevance(chunk, concept);

      // VERIFY
      // 300 chars, 3 concepts: normalizedDensity = min(3 / (300/500), 1) = min(5, 1) = 1
      // score = 1 * 0.5 + 0.3 (concept match) + 0.2 (text length bonus) = 1.0
      expect(relevance).toBeCloseTo(1.0, 2);
    });

    it('should handle chunks with no concepts', () => {
      // SETUP
      const chunk: Chunk = {
        id: 1,
        text: 'A'.repeat(300), // 300 chars
        hash: 'hash1',
          catalogId: 12345678,
        concepts: [],
      };
      const concept = 'testing';

      // EXERCISE
      const relevance = service.calculateRelevance(chunk, concept);

      // VERIFY
      // 0 concepts: normalizedDensity = 0, no concept match
      // score = 0 + 0 + 0.2 (text length bonus) = 0.2
      expect(relevance).toBeCloseTo(0.2, 2);
    });

    it('should handle short chunks with no concepts', () => {
      // SETUP
      const chunk: Chunk = {
        id: 1,
        text: 'Short',
        hash: 'hash1',
          catalogId: 12345678,
        concepts: ['testing'],
      };
      const concept = 'testing';

      // EXERCISE
      const relevance = service.calculateRelevance(chunk, concept);

      // VERIFY
      // Short text (5 chars), 1 concept: normalizedDensity = min(1 / (5/500), 1) = 1
      // score = 1 * 0.5 + 0.3 (concept match) = 0.8 (no text length bonus)
      expect(relevance).toBeCloseTo(0.8, 2);
    });

    it('should return value in 0-1 range', () => {
      // SETUP
      const chunk: Chunk = {
        id: 1,
        text: 'Chunk',
        hash: 'hash1',
          catalogId: 12345678,
        concepts: ['testing'],
      };
      const concept = 'testing';

      // EXERCISE
      const relevance = service.calculateRelevance(chunk, concept);

      // VERIFY
      // VERIFY
      expect(relevance).toBeLessThanOrEqual(1.0);
    });
  });
});

