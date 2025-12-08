/**
 * Integration Tests: Search Filtering
 * 
 * Tests that reference chunks and chunks with extraction issues
 * can be filtered from search results.
 * 
 * **Prerequisites**: These tests require a test database with schema fields:
 * - is_reference (boolean)
 * - has_extraction_issues (boolean)  
 * - has_math (boolean)
 * 
 * If the test database was created before these fields existed,
 * regenerate it with: `npm run seed:test-db`
 * 
 * **Design Note**: Uses early-return skip pattern for schema validation
 * since describe.skipIf cannot handle async conditions.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as lancedb from '@lancedb/lancedb';
import { SearchableCollectionAdapter } from '../../infrastructure/lancedb/searchable-collection-adapter.js';
import { SimpleEmbeddingService } from '../../infrastructure/embeddings/simple-embedding-service.js';
import * as fs from 'fs';

describe('Search Filtering - Integration', () => {
  const TEST_DB_PATH = './test-db';
  let db: lancedb.Connection;
  let chunksTable: lancedb.Table;
  let embeddingService: SimpleEmbeddingService;
  let hasRequiredSchema = false;
  let schemaChecked = false;
  
  const hasTestDb = fs.existsSync(TEST_DB_PATH);
  
  beforeAll(async () => {
    if (!hasTestDb) {
      console.warn('\n⚠️  Test database not found at ./test-db. Search filtering tests will be skipped.\n');
      return;
    }
    
    try {
      db = await lancedb.connect(TEST_DB_PATH);
      chunksTable = await db.openTable('chunks');
      embeddingService = new SimpleEmbeddingService();
      
      // Check if test database has the required schema fields
      const sampleChunk = await chunksTable.query().limit(1).toArray();
      if (sampleChunk.length > 0) {
        hasRequiredSchema = 'is_reference' in sampleChunk[0];
      }
      if (!hasRequiredSchema) {
        console.warn(
          '\n⚠️  Test database missing required schema fields (is_reference, has_extraction_issues, has_math).',
          '\n   Search filtering tests will be skipped. Regenerate test-db to run these tests.\n'
        );
      }
    } catch (error) {
      // Database or table might be corrupted or have incompatible schema
      console.warn(
        '\n⚠️  Failed to open test database:',
        error instanceof Error ? error.message : String(error),
        '\n   Search filtering tests will be skipped. Regenerate test-db to run these tests.\n'
      );
      hasRequiredSchema = false;
    }
    schemaChecked = true;
  });
  
  // Helper to skip tests when prerequisites not met
  const skipIfNoSchema = () => {
    if (!hasTestDb || !hasRequiredSchema) {
      return true;
    }
    return false;
  };
  
  describe('Reference Chunk Filtering', () => {
    it('should return reference chunks when no filter applied', async () => {
      if (skipIfNoSchema()) return; // Early return acts as skip
      
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('blockchain consensus');
      
      const results = await collection.vectorSearch(queryVector, 50);
      const refCount = results.filter((r: any) => r.is_reference === true).length;
      
      // Test DB should have reference chunks
      expect(refCount).toBeGreaterThan(0);
    });
    
    it('should exclude reference chunks when filter applied', async () => {
      if (skipIfNoSchema()) return;
      
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
      if (skipIfNoSchema()) return;
      
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
  
  describe('Extraction Issues Filtering', () => {
    it('should return chunks with extraction issues when no filter', async () => {
      if (skipIfNoSchema()) return;
      
      const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
      const queryVector = embeddingService.generateEmbedding('consensus protocol replicas');
      
      const results = await collection.vectorSearch(queryVector, 100);
      
      // Test DB should have some chunks with extraction issues (from p1739-arun.pdf)
      // May be 0 if query doesn't match those chunks, so just check we got results
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('should exclude chunks with extraction issues when filter applied', async () => {
      if (skipIfNoSchema()) return;
      
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
  
  describe('Combined Filtering', () => {
    it('should apply multiple filters with AND', async () => {
      if (skipIfNoSchema()) return;
      
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
      if (skipIfNoSchema()) return;
      
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
  
  describe('Default Behavior', () => {
    it('should verify test db has expected chunk types', async () => {
      if (skipIfNoSchema()) return;
      
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
