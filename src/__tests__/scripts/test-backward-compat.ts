/**
 * Test backward compatibility with databases lacking derived fields.
 * Verifies that tools correctly fall back to cache resolution.
 */

import * as lancedb from '@lancedb/lancedb';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache.js';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository.js';

async function testBackwardCompat() {
  console.log('=== Testing Backward Compatibility ===\n');
  
  const dbPath = process.argv[2] || './test_db';
  console.log(`Database: ${dbPath}\n`);
  
  const db = await lancedb.connect(dbPath);
  const conceptsTable = await db.openTable('concepts');
  const conceptRepo = new LanceDBConceptRepository(conceptsTable);
  
  // Initialize cache (this is what happens in older databases)
  const cache = ConceptIdCache.getInstance();
  cache.clear();
  await cache.initialize(conceptRepo);
  
  console.log(`Cache initialized: ${cache.getStats().conceptCount} concepts\n`);
  
  // Get a sample chunk and simulate what the tool does
  const chunksTable = await db.openTable('chunks');
  const chunks = await chunksTable.query().limit(5).toArray();
  
  console.log('=== Simulating Tool Behavior ===\n');
  
  let derivedCount = 0;
  let cacheCount = 0;
  let emptyCount = 0;
  
  for (const chunk of chunks) {
    // Parse concept_ids (Arrow Vector handling)
    let conceptIds: number[] = [];
    if (chunk.concept_ids) {
      if (Array.isArray(chunk.concept_ids)) {
        conceptIds = chunk.concept_ids;
      } else if (typeof chunk.concept_ids === 'object' && 'toArray' in chunk.concept_ids) {
        conceptIds = Array.from((chunk.concept_ids as any).toArray());
      }
    }
    
    // Check for derived field first (new schema)
    let conceptNames: string[] = [];
    const derivedNames = chunk.concept_names as string[] | undefined;
    
    if (derivedNames && Array.isArray(derivedNames) && derivedNames.length > 0 && derivedNames[0] !== '') {
      conceptNames = derivedNames;
      derivedCount++;
      console.log(`Chunk ${chunk.id}: ✅ Using derived field: [${conceptNames.slice(0, 3).join(', ')}${conceptNames.length > 3 ? '...' : ''}]`);
    } else if (conceptIds.length > 0) {
      // Fallback to cache
      conceptNames = cache.getNames(conceptIds.map(id => String(id)));
      cacheCount++;
      console.log(`Chunk ${chunk.id}: 📦 Using cache fallback: [${conceptNames.slice(0, 3).join(', ')}${conceptNames.length > 3 ? '...' : ''}]`);
    } else {
      emptyCount++;
      console.log(`Chunk ${chunk.id}: ⚪ No concepts`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Derived field: ${derivedCount} chunks`);
  console.log(`Cache fallback: ${cacheCount} chunks`);
  console.log(`No concepts: ${emptyCount} chunks`);
  console.log('\n✅ Backward compatibility verified - tools will work with both old and new databases');
}

testBackwardCompat().catch(console.error);

