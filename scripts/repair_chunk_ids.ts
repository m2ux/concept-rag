#!/usr/bin/env tsx
/**
 * Repair script to populate chunk_ids in the concepts table
 * by doing a reverse lookup from chunks.concept_ids → concepts.chunk_ids
 */
import * as lancedb from '@lancedb/lancedb';

async function repairChunkIds() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  console.log(`\n🔧 Repairing chunk_ids in concepts table`);
  console.log(`📂 Database: ${dbPath}\n`);
  
  const db = await lancedb.connect(dbPath);
  
  // Step 1: Check chunks table has concept_ids
  console.log('📊 Step 1: Checking chunks table...');
  const chunksTable = await db.openTable('chunks');
  const chunks = await chunksTable.query().limit(500000).toArray();
  console.log(`  Found ${chunks.length} chunks`);
  
  // Verify chunks have concept_ids
  let chunksWithConcepts = 0;
  for (const chunk of chunks) {
    const conceptIds = parseArrayField(chunk.concept_ids);
    if (conceptIds.length > 0 && !(conceptIds.length === 1 && conceptIds[0] === 0)) {
      chunksWithConcepts++;
    }
  }
  console.log(`  Chunks with real concept_ids: ${chunksWithConcepts}/${chunks.length}`);
  
  if (chunksWithConcepts === 0) {
    console.error('\n❌ No chunks have concept_ids populated. Cannot proceed.');
    console.error('   The chunks table needs concept_ids before we can build reverse mapping.');
    return;
  }
  
  // Step 2: Build reverse mapping: concept_id → chunk_ids
  console.log('\n🔗 Step 2: Building concept → chunk_ids mapping...');
  const conceptToChunkIds = new Map<number, number[]>();
  
  for (const chunk of chunks) {
    const chunkId = typeof chunk.id === 'number' ? chunk.id : parseInt(chunk.id);
    const conceptIds = parseArrayField(chunk.concept_ids);
    
    // Skip placeholder values
    if (conceptIds.length === 1 && conceptIds[0] === 0) continue;
    
    for (const conceptId of conceptIds) {
      if (!conceptToChunkIds.has(conceptId)) {
        conceptToChunkIds.set(conceptId, []);
      }
      conceptToChunkIds.get(conceptId)!.push(chunkId);
    }
  }
  
  console.log(`  Built mapping for ${conceptToChunkIds.size} concepts`);
  
  // Show some stats
  const chunkCounts = Array.from(conceptToChunkIds.values()).map(arr => arr.length);
  const avgChunks = chunkCounts.reduce((a, b) => a + b, 0) / chunkCounts.length;
  const maxChunks = Math.max(...chunkCounts);
  console.log(`  Average chunks per concept: ${avgChunks.toFixed(1)}`);
  console.log(`  Max chunks for a concept: ${maxChunks}`);
  
  // Step 3: Load and update concepts
  console.log('\n📝 Step 3: Updating concepts table...');
  const conceptsTable = await db.openTable('concepts');
  const concepts = await conceptsTable.query().limit(100000).toArray();
  console.log(`  Found ${concepts.length} concepts`);
  
  // Update each concept with chunk_ids
  const updatedConcepts = concepts.map(concept => {
    const conceptId = typeof concept.id === 'number' ? concept.id : parseInt(concept.id);
    const chunkIds = conceptToChunkIds.get(conceptId) || [];
    
    // Ensure non-empty array for LanceDB (use placeholder if empty)
    const finalChunkIds = chunkIds.length > 0 ? chunkIds : [0];
    
    return {
      ...concept,
      // Convert Arrow vectors to native arrays
      catalog_ids: parseArrayField(concept.catalog_ids),
      chunk_ids: finalChunkIds,
      related_concept_ids: parseArrayField(concept.related_concept_ids),
      synonyms: parseStringArrayField(concept.synonyms),
      broader_terms: parseStringArrayField(concept.broader_terms),
      narrower_terms: parseStringArrayField(concept.narrower_terms),
      vector: parseArrayField(concept.vector),
    };
  });
  
  // Count how many will have real chunk_ids
  const withRealChunks = updatedConcepts.filter(c => 
    c.chunk_ids.length > 0 && !(c.chunk_ids.length === 1 && c.chunk_ids[0] === 0)
  ).length;
  
  console.log(`  Concepts that will have real chunk_ids: ${withRealChunks}/${concepts.length}`);
  
  // Step 4: Recreate table with updated data
  console.log('\n💾 Step 4: Saving updated concepts table...');
  await db.dropTable('concepts');
  await db.createTable('concepts', updatedConcepts, { mode: 'create' });
  
  console.log('\n✅ Done! Concepts table now has chunk_ids populated.');
  console.log(`   ${withRealChunks} concepts linked to chunks`);
}

function parseArrayField<T>(field: any): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'object' && 'toArray' in field) {
    return Array.from(field.toArray());
  }
  return [];
}

function parseStringArrayField(field: any): string[] {
  if (!field) return [''];  // Placeholder for LanceDB
  if (Array.isArray(field)) return field.length > 0 ? field : [''];
  if (typeof field === 'object' && 'toArray' in field) {
    const arr = Array.from(field.toArray()) as string[];
    return arr.length > 0 ? arr : [''];
  }
  return [''];
}

repairChunkIds().catch(console.error);

