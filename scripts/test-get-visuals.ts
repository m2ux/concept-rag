/**
 * Test get_visuals functionality with test database
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import { LanceDBVisualRepository } from '../src/infrastructure/lancedb/repositories/lancedb-visual-repository.js';

const TEST_DB_PATH = path.join(process.cwd(), 'db/test');

async function main() {
  console.log('🧪 Testing get_visuals functionality\n');
  
  const db = await lancedb.connect(TEST_DB_PATH);
  const visualsTable = await db.openTable('visuals');
  const repo = new LanceDBVisualRepository(visualsTable);
  
  // Test 1: Find by concept name
  console.log('=== Test 1: Find by concept name (blockchain) ===');
  const blockchainVisuals = await repo.findByConceptName('blockchain', 10);
  console.log(`Found ${blockchainVisuals.length} visuals`);
  blockchainVisuals.forEach(v => {
    console.log(`  - [${v.visualType}] ${v.description.substring(0, 60)}...`);
    console.log(`    Concepts: ${v.conceptNames?.join(', ')}`);
  });
  
  // Test 2: Find by visual type
  console.log('\n=== Test 2: Find by visual type (diagram) ===');
  const diagrams = await repo.findByType('diagram', 10);
  console.log(`Found ${diagrams.length} diagrams`);
  diagrams.forEach(v => {
    console.log(`  - Page ${v.pageNumber}: ${v.description.substring(0, 50)}...`);
  });
  
  // Test 3: Find by concept (architecture)
  console.log('\n=== Test 3: Find by concept (architecture) ===');
  const archVisuals = await repo.findByConceptName('architecture', 10);
  console.log(`Found ${archVisuals.length} visuals`);
  archVisuals.forEach(v => {
    console.log(`  - [${v.visualType}] ${v.description.substring(0, 50)}...`);
  });
  
  // Test 4: Find by catalog ID
  console.log('\n=== Test 4: Find by catalog ID (3155035939) ===');
  const catalogVisuals = await repo.findByCatalogId(3155035939, 10);
  console.log(`Found ${catalogVisuals.length} visuals for catalog`);
  catalogVisuals.forEach(v => {
    console.log(`  - [${v.visualType}] Page ${v.pageNumber}`);
  });
  
  // Test 5: Total count
  console.log('\n=== Test 5: Total count ===');
  const count = await repo.count();
  console.log(`Total visuals: ${count}`);
  
  console.log('\n✅ All tests passed!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

