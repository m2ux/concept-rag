/**
 * Regression Tests for Concept Search
 * 
 * This test suite ensures the concept search fix (direct field filtering instead 
 * of vector search) continues to work correctly for different concept types.
 * 
 * **Context**: Previously, concept search used vector similarity between concept 
 * embeddings (short phrases) and chunk embeddings (full paragraphs), which failed
 * because they're not semantically similar enough in vector space.
 * 
 * **Fix**: Use direct field filtering on chunks.concepts field.
 * 
 * **Issue**: See .ai/planning/2025-11-17-empty-chunk-investigation/INVESTIGATION_REPORT.md
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import { LanceDBChunkRepository } from '../../infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBConceptRepository } from '../../infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../../infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../../concepts/query_expander.js';
import { createSimpleEmbedding } from '../../lancedb/hybrid_search_client.js';
import { hashToId } from '../../infrastructure/utils/hash.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Concept Search Regression Tests', () => {
  let dbPath: string;
  let db: any; // lancedb.Database type not exported
  let chunkRepo: LanceDBChunkRepository;
  let conceptRepo: LanceDBConceptRepository;
  
  beforeAll(async () => {
    // Create temporary database for testing
    dbPath = path.join(os.tmpdir(), `concept-search-regression-${Date.now()}`);
    db = await lancedb.connect(dbPath);
    
    // Create concept ID mapping using hashToId for consistent lookups
    const conceptId = (name: string) => hashToId(name.toLowerCase());
    
    // Create test data covering all three impact categories
    const testChunks = [
      // 🔴 High Impact: Abstract/theoretical concepts
      {
        id: 'chunk-abstract-1',
        text: 'The theory of exaptive bootstrapping explains how innovations occur in cascades through positive feedback dynamics in agent-artifact space.',
        source: '/test/complexity-innovation.pdf',
        hash: 'hash-abstract-1',
        loc: '{}',
        vector: createSimpleEmbedding('exaptive bootstrapping theory innovation'),
        concept_ids: [conceptId('exaptive bootstrapping'), conceptId('innovation'), conceptId('agent-artifact space')],
        category_ids: [conceptId('complex systems science'), conceptId('innovation theory')]
      },
      {
        id: 'chunk-abstract-2',
        text: 'The ideality index represents the ratio of useful functions to harmful effects in a technical system.',
        source: '/test/triz-methodology.pdf',
        hash: 'hash-abstract-2',
        loc: '{}',
        vector: createSimpleEmbedding('ideality index triz technical systems'),
        concept_ids: [conceptId('ideality index'), conceptId('triz methodology'), conceptId('technical system evolution')],
        category_ids: [conceptId('innovation methodology'), conceptId('systems engineering')]
      },
      {
        id: 'chunk-abstract-3',
        text: 'Dialectical thinking involves understanding contradictions and their resolution through synthesis.',
        source: '/test/philosophy-dialectics.pdf',
        hash: 'hash-abstract-3',
        loc: '{}',
        vector: createSimpleEmbedding('dialectical thinking contradictions philosophy'),
        concept_ids: [conceptId('dialectical thinking'), conceptId('contradiction resolution'), conceptId('synthesis')],
        category_ids: [conceptId('philosophy'), conceptId('critical thinking')]
      },
      {
        id: 'chunk-abstract-4',
        text: 'Another paragraph discussing exaptive bootstrapping and its role in socio-technical transitions.',
        source: '/test/complexity-innovation.pdf',
        hash: 'hash-abstract-4',
        loc: '{}',
        vector: createSimpleEmbedding('exaptive bootstrapping socio-technical transitions'),
        concept_ids: [conceptId('exaptive bootstrapping'), conceptId('socio-technical transitions')],
        category_ids: [conceptId('complex systems science')]
      },
      
      // 🟡 Medium Impact: Common technical terms
      {
        id: 'chunk-medium-1',
        text: 'A REST API provides a standardized interface for client-server communication using HTTP methods.',
        source: '/test/web-architecture.pdf',
        hash: 'hash-medium-1',
        loc: '{}',
        vector: createSimpleEmbedding('REST API interface HTTP'),
        concept_ids: [conceptId('rest api'), conceptId('api design'), conceptId('http methods')],
        category_ids: [conceptId('web development'), conceptId('software architecture')]
      },
      {
        id: 'chunk-medium-2',
        text: 'The repository pattern abstracts data access logic from business logic.',
        source: '/test/design-patterns.pdf',
        hash: 'hash-medium-2',
        loc: '{}',
        vector: createSimpleEmbedding('repository pattern data access'),
        concept_ids: [conceptId('repository pattern'), conceptId('design pattern'), conceptId('data access')],
        category_ids: [conceptId('software design'), conceptId('architecture patterns')]
      },
      {
        id: 'chunk-medium-3',
        text: 'Dependency injection enables loose coupling by providing dependencies externally.',
        source: '/test/solid-principles.pdf',
        hash: 'hash-medium-3',
        loc: '{}',
        vector: createSimpleEmbedding('dependency injection loose coupling'),
        concept_ids: [conceptId('dependency injection'), conceptId('loose coupling'), conceptId('solid principles')],
        category_ids: [conceptId('software design'), conceptId('best practices')]
      },
      {
        id: 'chunk-medium-4',
        text: 'Another section about dependency injection and its benefits for testability.',
        source: '/test/testing-strategies.pdf',
        hash: 'hash-medium-4',
        loc: '{}',
        vector: createSimpleEmbedding('dependency injection testability'),
        concept_ids: [conceptId('dependency injection'), conceptId('testability'), conceptId('unit testing')],
        category_ids: [conceptId('software testing')]
      },
      {
        id: 'chunk-medium-5',
        text: 'The API interface defines the contract between different software components.',
        source: '/test/interface-design.pdf',
        hash: 'hash-medium-5',
        loc: '{}',
        vector: createSimpleEmbedding('API interface contract components'),
        concept_ids: [conceptId('api interface'), conceptId('software contract'), conceptId('component design')],
        category_ids: [conceptId('software architecture')]
      },
      
      // 🟢 Low Impact: Very specific terms
      {
        id: 'chunk-low-1',
        text: 'React.useState is a hook that lets you add state to function components.',
        source: '/test/react-hooks.pdf',
        hash: 'hash-low-1',
        loc: '{}',
        vector: createSimpleEmbedding('React.useState hook state management'),
        concept_ids: [conceptId('react.usestate'), conceptId('react hooks'), conceptId('state management')],
        category_ids: [conceptId('react'), conceptId('frontend development')]
      },
      {
        id: 'chunk-low-2',
        text: 'PostgreSQL transaction isolation levels include Read Committed and Serializable.',
        source: '/test/postgres-transactions.pdf',
        hash: 'hash-low-2',
        loc: '{}',
        vector: createSimpleEmbedding('PostgreSQL transaction isolation'),
        concept_ids: [conceptId('postgresql transaction isolation'), conceptId('read committed'), conceptId('serializable')],
        category_ids: [conceptId('database'), conceptId('postgresql')]
      },
      {
        id: 'chunk-low-3',
        text: 'The typescript.compilerOptions.strict flag enables all strict type checking options.',
        source: '/test/typescript-config.pdf',
        hash: 'hash-low-3',
        loc: '{}',
        vector: createSimpleEmbedding('TypeScript strict mode compiler options'),
        concept_ids: [conceptId('typescript.compileroptions.strict'), conceptId('strict type checking'), conceptId('typescript configuration')],
        category_ids: [conceptId('typescript'), conceptId('configuration')]
      },
      {
        id: 'chunk-low-4',
        text: 'Using React.useState multiple times allows you to manage multiple state variables independently.',
        source: '/test/react-patterns.pdf',
        hash: 'hash-low-4',
        loc: '{}',
        vector: createSimpleEmbedding('React.useState multiple state variables'),
        concept_ids: [conceptId('react.usestate'), conceptId('state management'), conceptId('react patterns')],
        category_ids: [conceptId('react')]
      }
    ];
    
    const testConcepts = [
      // 🔴 High Impact: Abstract/theoretical
      {
        id: conceptId('exaptive bootstrapping'),
        concept: 'exaptive bootstrapping',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('exaptive bootstrapping'),
        weight: 1.0,
      },
      {
        id: conceptId('ideality index'),
        concept: 'ideality index',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('ideality index'),
        weight: 0.8,
      },
      {
        id: conceptId('dialectical thinking'),
        concept: 'dialectical thinking',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('dialectical thinking'),
        weight: 0.85,
      },
      
      // 🟡 Medium Impact: Common technical terms
      {
        id: conceptId('rest api'),
        concept: 'rest api',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('rest api'),
        weight: 0.75,
      },
      {
        id: conceptId('repository pattern'),
        concept: 'repository pattern',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('repository pattern'),
        weight: 0.78,
      },
      {
        id: conceptId('dependency injection'),
        concept: 'dependency injection',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('dependency injection'),
        weight: 0.82,
      },
      {
        id: conceptId('api interface'),
        concept: 'api interface',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('api interface'),
        weight: 0.70,
      },
      
      // 🟢 Low Impact: Very specific terms
      {
        id: conceptId('react.usestate'),
        concept: 'react.usestate',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('react.usestate'),
        weight: 0.65,
      },
      {
        id: conceptId('postgresql transaction isolation'),
        concept: 'postgresql transaction isolation',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('postgresql transaction isolation'),
        weight: 0.60,
      },
      {
        id: conceptId('typescript.compileroptions.strict'),
        concept: 'typescript.compileroptions.strict',
        catalog_ids: [12345678],
        adjacent_ids: [0],
        vector: createSimpleEmbedding('typescript.compileroptions.strict'),
        weight: 0.58,
      }
    ];
    
    // Create tables
    const chunksTable = await db.createTable('chunks', testChunks);
    const conceptsTable = await db.createTable('concepts', testConcepts);
    
    // Initialize repositories
    conceptRepo = new LanceDBConceptRepository(conceptsTable);
    const embeddingService = new SimpleEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    
    // Initialize ConceptIdCache for integer ID resolution
    const { ConceptIdCache } = await import('../../infrastructure/cache/concept-id-cache.js');
    const conceptIdCache = ConceptIdCache.getInstance();
    await conceptIdCache.initialize(conceptRepo);
    
    chunkRepo = new LanceDBChunkRepository(
      chunksTable,
      conceptRepo,
      embeddingService,
      hybridSearchService,
      conceptIdCache
    );
  }, 30000);
  
  afterAll(async () => {
    // Cleanup temporary database
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath, { recursive: true, force: true });
    }
  });
  
  describe('🔴 High Impact: Abstract/Theoretical Concepts', () => {
    it('should find chunks for "exaptive bootstrapping"', async () => {
      // This was the original failing test case
      const results = await chunkRepo.findByConceptName('exaptive bootstrapping', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(2); // Two chunks contain this concept
      
      // Verify all results actually contain the concept
      results.forEach(chunk => {
        expect(chunk.concepts).toBeDefined();
        expect(chunk.concepts!.some((c: string) => 
          c.toLowerCase().includes('exaptive bootstrapping')
        )).toBe(true);
      });
      
      // Verify they're from the correct source
      expect(results[0].source).toBe('/test/complexity-innovation.pdf');
    });
    
    it('should find chunks for "ideality index"', async () => {
      const results = await chunkRepo.findByConceptName('ideality index', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].text).toContain('ideality index');
      expect(results[0].concepts).toContain('ideality index');
    });
    
    it('should find chunks for "dialectical thinking"', async () => {
      const results = await chunkRepo.findByConceptName('dialectical thinking', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      // Case-insensitive check since text may have different capitalization
      expect(results[0].text.toLowerCase()).toContain('dialectical thinking');
      expect(results[0].concepts).toContain('dialectical thinking');
    });
    
    it('should handle case-insensitive search for abstract concepts', async () => {
      const lower = await chunkRepo.findByConceptName('exaptive bootstrapping', 10);
      const upper = await chunkRepo.findByConceptName('EXAPTIVE BOOTSTRAPPING', 10);
      const mixed = await chunkRepo.findByConceptName('Exaptive Bootstrapping', 10);
      
      expect(lower.length).toBe(2);
      expect(upper.length).toBe(2);
      expect(mixed.length).toBe(2);
    });
  });
  
  describe('🟡 Medium Impact: Common Technical Terms', () => {
    it('should find chunks for "rest api"', async () => {
      const results = await chunkRepo.findByConceptName('rest api', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].concepts).toContain('rest api');
    });
    
    it('should find chunks for "repository pattern"', async () => {
      const results = await chunkRepo.findByConceptName('repository pattern', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].text).toContain('repository pattern');
    });
    
    it('should find chunks for "dependency injection"', async () => {
      const results = await chunkRepo.findByConceptName('dependency injection', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(2); // Two chunks contain this concept
      
      results.forEach(chunk => {
        expect(chunk.concepts).toBeDefined();
        expect(chunk.concepts!.some((c: string) => 
          c.toLowerCase().includes('dependency injection')
        )).toBe(true);
      });
    });
    
    it('should find chunks for "api interface"', async () => {
      const results = await chunkRepo.findByConceptName('api interface', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].concepts).toContain('api interface');
    });
    
    it('should respect limit for common terms', async () => {
      const results = await chunkRepo.findByConceptName('dependency injection', 1);
      
      expect(results.length).toBe(1);
    });
  });
  
  describe('🟢 Low Impact: Very Specific Terms', () => {
    it('should find chunks for "react.usestate"', async () => {
      const results = await chunkRepo.findByConceptName('react.usestate', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      
      results.forEach(chunk => {
        expect(chunk.concepts).toBeDefined();
        expect(chunk.concepts!.some((c: string) => 
          c.toLowerCase().includes('react.usestate')
        )).toBe(true);
      });
    });
    
    it('should find chunks for "postgresql transaction isolation"', async () => {
      const results = await chunkRepo.findByConceptName('postgresql transaction isolation', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].text).toContain('PostgreSQL transaction isolation');
    });
    
    it('should find chunks for "typescript.compileroptions.strict"', async () => {
      const results = await chunkRepo.findByConceptName('typescript.compileroptions.strict', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].concepts).toContain('typescript.compileroptions.strict');
    });
    
    it('should handle special characters in concept names', async () => {
      // react.usestate contains a dot
      const results = await chunkRepo.findByConceptName('react.usestate', 10);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });
  
  describe('Cross-Category Validation', () => {
    it('should return correct count for all concept types', async () => {
      const concepts = [
        { name: 'exaptive bootstrapping', expected: 2 },
        { name: 'ideality index', expected: 1 },
        { name: 'dependency injection', expected: 2 },
        { name: 'rest api', expected: 1 },
        { name: 'react.usestate', expected: 2 },
        { name: 'postgresql transaction isolation', expected: 1 }
      ];
      
      for (const { name, expected } of concepts) {
        const results = await chunkRepo.findByConceptName(name, 10);
        expect(results.length).toBe(expected);
      }
    });
    
    it('should return empty array for non-existent concepts in all categories', async () => {
      const nonExistent = [
        'non-existent-abstract-concept',
        'non-existent-technical-term',
        'non-existent-specific-term'
      ];
      
      for (const concept of nonExistent) {
        const results = await chunkRepo.findByConceptName(concept, 10);
        expect(results).toEqual([]);
      }
    });
    
    it('should sort results by concept count', async () => {
      const results = await chunkRepo.findByConceptName('exaptive bootstrapping', 10);
      
      expect(results.length).toBeGreaterThan(1);
      
      // Verify results are sorted by concept count (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].concepts?.length || 0).toBeGreaterThanOrEqual(results[i + 1].concepts?.length || 0);
      }
    });
  });
  
  describe('Performance and Edge Cases', () => {
    it('should handle search within reasonable time', async () => {
      const start = Date.now();
      await chunkRepo.findByConceptName('dependency injection', 10);
      const elapsed = Date.now() - start;
      
      // Should complete within 2 seconds even with filtering
      expect(elapsed).toBeLessThan(2000);
    });
    
    it('should handle empty concept name', async () => {
      const results = await chunkRepo.findByConceptName('', 10);
      
      expect(results).toBeDefined();
      expect(results).toEqual([]);
    });
    
    it('should handle whitespace-only concept name', async () => {
      const results = await chunkRepo.findByConceptName('   ', 10);
      
      expect(results).toBeDefined();
      expect(results).toEqual([]);
    });
    
    it('should validate all returned chunks contain the requested concept', async () => {
      const testConcepts = [
        'exaptive bootstrapping',
        'dependency injection',
        'react.usestate'
      ];
      
      for (const conceptName of testConcepts) {
        const results = await chunkRepo.findByConceptName(conceptName, 10);
        
        // Every result must contain the concept
        results.forEach(chunk => {
          const hasConceptName = chunk.concepts!.some((c: string) =>
            c.toLowerCase().includes(conceptName.toLowerCase()) ||
            conceptName.toLowerCase().includes(c.toLowerCase())
          );
          
          expect(hasConceptName).toBe(true);
        });
      }
    });
  });
});

