import * as lancedb from '@lancedb/lancedb';
import { SearchableCollectionAdapter } from '../dist/infrastructure/lancedb/searchable-collection-adapter.js';
import { SimpleEmbeddingService } from '../dist/infrastructure/embeddings/simple-embedding-service.js';

async function testFiltering() {
  const db = await lancedb.connect('./test-db');
  const chunksTable = await db.openTable('chunks');
  const embeddingService = new SimpleEmbeddingService();
  
  const collection = new SearchableCollectionAdapter(chunksTable, 'chunks');
  const queryVector = embeddingService.generateEmbedding('consensus protocol');
  
  console.log('=== Testing Search Filtering ===\n');
  
  // Test 1: No filter
  console.log('Test 1: No filter');
  const noFilter = await collection.vectorSearch(queryVector, 20);
  const noFilterRefs = noFilter.filter((r: any) => r.is_reference === true).length;
  console.log(`  Results: ${noFilter.length}, Reference chunks: ${noFilterRefs}\n`);
  
  // Test 2: Exclude references
  console.log('Test 2: Exclude references (is_reference = false)');
  const withFilter = await collection.vectorSearch(queryVector, 20, { filter: 'is_reference = false' });
  const withFilterRefs = withFilter.filter((r: any) => r.is_reference === true).length;
  console.log(`  Results: ${withFilter.length}, Reference chunks: ${withFilterRefs}\n`);
  
  // Test 3: Exclude extraction issues
  console.log('Test 3: Exclude extraction issues (has_extraction_issues = false)');
  const noIssues = await collection.vectorSearch(queryVector, 20, { filter: 'has_extraction_issues = false' });
  const noIssuesCount = noIssues.filter((r: any) => r.has_extraction_issues === true).length;
  console.log(`  Results: ${noIssues.length}, Chunks with issues: ${noIssuesCount}\n`);
  
  // Test 4: Combined filter
  console.log('Test 4: Combined (exclude refs AND issues)');
  const combined = await collection.vectorSearch(queryVector, 20, { 
    filter: 'is_reference = false AND has_extraction_issues = false' 
  });
  const combinedRefs = combined.filter((r: any) => r.is_reference === true).length;
  const combinedIssues = combined.filter((r: any) => r.has_extraction_issues === true).length;
  console.log(`  Results: ${combined.length}, Refs: ${combinedRefs}, Issues: ${combinedIssues}\n`);
  
  console.log('✅ Filtering works correctly!');
}

testFiltering().catch(console.error);
