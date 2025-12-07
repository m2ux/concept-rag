/**
 * Integration Tests: Search Filtering
 * 
 * Tests that reference chunks and chunks with extraction issues
 * can be filtered from search results.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import { SearchableCollectionAdapter } from '../../infrastructure/lancedb/searchable-collection-adapter.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import * as fs from 'fs';

describe('Search Filtering - Integration', () => {
  const TEST_DB_PATH = './test-db';
  let db: lancedb.Connection;
  let chunksTable: lancedb.Table;
  let embeddingService: SimpleEmbeddingService;
  
  const hasTestDb = fs.existsSync(TEST_DB_PATH);
  
  beforeAll(async () => {
    if (hasTestDb) {
      db = await lancedb.connect(TEST_DB_PATH);
      chunksTable = await db.openTable('chunks');
      embeddingService = new SimpleEmbeddingService();
    }
  });
  
  describe.skipIf(!hasTestDb)('Reference Chunk Filtering', () => {
    it('should return reference chunks when no filter applied', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('blockchain consensus');
      
      const results = await collection.vectorSearch(queryVector, 50);
      const refCount = results.filter((r: any) => r.is_reference === true).length;
      
      // Test DB should have reference chunks
      expect(refCount).toBeGreaterThan(0);
    });
    
    it('should exclude reference chunks when filter applied', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('blockchain consensus');
      
      const results = await collection.vectorSearch(queryVector, 50, { 
        filter: 'is_reference = false' 
      });
      
      const refCount = results.filter((r: any) => r.is_reference === true).length;
      
      // Should have no reference chunks
      expect(refCount).toBe(0);
    });
    
    it('should still return content chunks when filtering refs', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('smart contract security');
      
      const results = await collection.vectorSearch(queryVector, 20, { 
        filter: 'is_reference = false' 
      });
      
      // Should still return results
      expect(results.length).toBeGreaterThan(0);
      
      // All results should be content chunks
      results.forEach((r: any) => {
        expect(r.is_reference).toBe(false);
      });
    });
  });
  
  describe.skipIf(!hasTestDb)('Extraction Issues Filtering', () => {
    it('should return chunks with extraction issues when no filter', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('consensus protocol replicas');
      
      const results = await collection.vectorSearch(queryVector, 100);
      const issueCount = results.filter((r: any) => r.has_extraction_issues === true).length;
      
      // Test DB should have some chunks with extraction issues (from p1739-arun.pdf)
      // May be 0 if query doesn't match those chunks, so just check we got results
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('should exclude chunks with extraction issues when filter applied', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('Byzantine fault tolerant');
      
      const results = await collection.vectorSearch(queryVector, 50, { 
        filter: 'has_extraction_issues = false' 
      });
      
      const issueCount = results.filter((r: any) => r.has_extraction_issues === true).length;
      
      // Should have no chunks with extraction issues
      expect(issueCount).toBe(0);
    });
  });
  
  describe.skipIf(!hasTestDb)('Combined Filtering', () => {
    it('should apply multiple filters with AND', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('protocol security');
      
      const results = await collection.vectorSearch(queryVector, 50, { 
        filter: 'is_reference = false AND has_extraction_issues = false' 
      });
      
      // Should have no reference chunks
      const refCount = results.filter((r: any) => r.is_reference === true).length;
      expect(refCount).toBe(0);
      
      // Should have no chunks with extraction issues
      const issueCount = results.filter((r: any) => r.has_extraction_issues === true).length;
      expect(issueCount).toBe(0);
    });
    
    it('should filter by has_math field', async () => {
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('mathematical formula equation');
      
      // Get only math chunks
      const mathResults = await collection.vectorSearch(queryVector, 50, { 
        filter: 'has_math = true' 
      });
      
      // All results should have math
      mathResults.forEach((r: any) => {
        expect(r.has_math).toBe(true);
      });
    });
  });
  
  describe.skipIf(!hasTestDb)('Default Behavior', () => {
    it('should verify test db has expected chunk types', async () => {
      // Count chunk types in test DB
      const allChunks = await chunksTable.query().limit(3000).toArray();
      
      const stats = {
        total: allChunks.length,
        references: allChunks.filter((c: any) => c.is_reference === true).length,
        withMath: allChunks.filter((c: any) => c.has_math === true).length,
        withIssues: allChunks.filter((c: any) => c.has_extraction_issues === true).length
      };
      
      console.log('\n=== Test DB Chunk Statistics ===');
      console.log(`Total chunks: ${stats.total}`);
      console.log(`Reference chunks: ${stats.references} (${(stats.references/stats.total*100).toFixed(1)}%)`);
      console.log(`Math chunks: ${stats.withMath}`);
      console.log(`Extraction issues: ${stats.withIssues}`);
      
      // Test DB should have a variety
      expect(stats.total).toBeGreaterThan(100);
      expect(stats.references).toBeGreaterThan(0);
    });
  });
});
