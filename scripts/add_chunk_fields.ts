#!/usr/bin/env tsx
/**
 * Migration Script: Add page_number and concept_density to Chunks Table
 * 
 * Uses batch processing to avoid memory issues. Creates new table, then swaps.
 * 
 * Usage:
 *   npx tsx scripts/add_chunk_fields.ts [--db <path>] [--dry-run]
 * 
 * ALWAYS run on test_db first:
 *   npx tsx scripts/add_chunk_fields.ts --db ./test_db --dry-run
 *   npx tsx scripts/add_chunk_fields.ts --db ./test_db
 */

import * as lancedb from '@lancedb/lancedb';

// Configuration
const DEFAULT_DB_PATH = process.env.CONCEPT_RAG_DB || `${process.env.HOME}/.concept_rag`;
const BATCH_SIZE = 5000;

function calculateConceptDensity(conceptIds: number[], text: string): number {
  const realConceptCount = conceptIds.filter(id => id !== 0).length;
  if (realConceptCount === 0) return 0;
  
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length || 1;
  const density = (realConceptCount / wordCount) * 10;
  return Math.min(density, 1.0);
}

function parseArrayField<T>(field: any): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'object' && 'toArray' in field) {
    return Array.from(field.toArray());
  }
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return []; }
  }
  return [];
}

function extractPageNumber(locField: any): number | null {
  if (!locField) return null;
  try {
    const loc = typeof locField === 'string' ? JSON.parse(locField) : locField;
    return loc?.pageNumber ?? null;
  } catch { return null; }
}

async function main() {
  console.log('🔄 CHUNK FIELDS MIGRATION\n');
  console.log('='.repeat(60));
  
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const dbPathIdx = args.indexOf('--db');
  const dbPath = dbPathIdx >= 0 ? args[dbPathIdx + 1] : DEFAULT_DB_PATH;
  
  console.log(`📂 Database: ${dbPath}`);
  console.log(`🧪 Dry run: ${isDryRun}`);
  console.log('');
  
  const db = await lancedb.connect(dbPath);
  const tables = await db.tableNames();
  
  if (!tables.includes('chunks')) {
    console.error('❌ Chunks table not found');
    process.exit(1);
  }
  
  const chunksTable = await db.openTable('chunks');
  const totalChunks = await chunksTable.countRows();
  
  console.log(`📊 Total chunks: ${totalChunks.toLocaleString()}`);
  
  const sampleChunk = (await chunksTable.query().limit(1).toArray())[0];
  console.log(`📋 Current fields: ${Object.keys(sampleChunk).join(', ')}`);
  console.log(`   Has page_number: ${'page_number' in sampleChunk}`);
  console.log(`   Has concept_density: ${'concept_density' in sampleChunk}`);
  console.log('');
  
  if (isDryRun) {
    console.log('🧪 DRY RUN - Analyzing sample chunks...\n');
    const samples = await chunksTable.query().limit(5).toArray();
    for (const chunk of samples) {
      const conceptIds = parseArrayField<number>(chunk.concept_ids);
      const pageNumber = extractPageNumber(chunk.loc);
      const density = calculateConceptDensity(conceptIds, chunk.text || '');
      console.log(`Chunk ${chunk.id}: page=${pageNumber ?? 'N/A'}, density=${density.toFixed(3)}, concepts=${conceptIds.filter(id => id !== 0).length}`);
    }
    console.log('\nRun without --dry-run to apply changes.');
    return;
  }
  
  // Process in batches
  console.log('🔄 Processing chunks in batches...\n');
  
  const numBatches = Math.ceil(totalChunks / BATCH_SIZE);
  let processedCount = 0;
  const tempTableName = 'chunks_new';
  
  // Remove old temp table if exists
  if (tables.includes(tempTableName)) {
    await db.dropTable(tempTableName);
  }
  
  let newTable: lancedb.Table | null = null;
  
  for (let batchNum = 0; batchNum < numBatches; batchNum++) {
    const offset = batchNum * BATCH_SIZE;
    
    const batch = await chunksTable.query()
      .limit(BATCH_SIZE)
      .offset(offset)
      .toArray();
    
    if (batch.length === 0) break;
    
    const updatedBatch = batch.map(chunk => {
      const conceptIds = parseArrayField<number>(chunk.concept_ids);
      const categoryIds = parseArrayField<number>(chunk.category_ids);
      let pageNumber = chunk.page_number ?? extractPageNumber(chunk.loc) ?? 0;
      const conceptDensity = calculateConceptDensity(conceptIds, chunk.text || '');
      
      // Convert vector
      const vectorField = chunk.vector ?? chunk.embeddings;
      const vector = vectorField ? 
        (Array.isArray(vectorField) ? vectorField : 
         (vectorField.toArray ? Array.from(vectorField.toArray()) : vectorField)) 
        : [];
      
      processedCount++;
      
      return {
        id: chunk.id || '',
        source: chunk.source || '',
        catalog_id: chunk.catalog_id ?? 0,
        hash: chunk.hash || '',
        text: chunk.text || '',
        vector,
        concept_ids: conceptIds.length > 0 ? conceptIds : [0],
        category_ids: categoryIds.length > 0 ? categoryIds : [0],
        chunk_index: chunk.chunk_index ?? 0,
        loc: typeof chunk.loc === 'string' ? chunk.loc : JSON.stringify(chunk.loc || {}),
        page_number: pageNumber,
        concept_density: conceptDensity
      };
    });
    
    if (newTable === null) {
      newTable = await db.createTable(tempTableName, updatedBatch, { mode: 'create' });
    } else {
      await newTable.add(updatedBatch);
    }
    
    const pct = ((batchNum + 1) / numBatches * 100).toFixed(1);
    console.log(`   Batch ${batchNum + 1}/${numBatches} (${pct}%) - ${processedCount.toLocaleString()} chunks`);
  }
  
  // Verify new table before swapping
  const newCount = await newTable!.countRows();
  console.log(`\n✅ New table created: ${newCount.toLocaleString()} chunks`);
  
  if (newCount !== totalChunks) {
    console.error(`❌ Count mismatch! Original: ${totalChunks}, New: ${newCount}`);
    console.error('   Aborting - original table preserved.');
    await db.dropTable(tempTableName);
    process.exit(1);
  }
  
  // Swap tables
  console.log('💾 Swapping tables...');
  await db.dropTable('chunks');
  
  // Read and recreate (LanceDB doesn't have rename)
  // For small datasets this is fine; for large ones we'd need a different approach
  const allNewData = await newTable!.query().limit(totalChunks + 1000).toArray();
  
  // Clean Arrow vectors
  const cleanData = allNewData.map(row => ({
    ...row,
    vector: Array.isArray(row.vector) ? row.vector : 
            (row.vector?.toArray ? Array.from(row.vector.toArray()) : []),
    concept_ids: Array.isArray(row.concept_ids) ? row.concept_ids :
                 (row.concept_ids?.toArray ? Array.from(row.concept_ids.toArray()) : [0]),
    category_ids: Array.isArray(row.category_ids) ? row.category_ids :
                  (row.category_ids?.toArray ? Array.from(row.category_ids.toArray()) : [0])
  }));
  
  await db.createTable('chunks', cleanData, { mode: 'create' });
  await db.dropTable(tempTableName);
  
  // Verify final
  const finalTable = await db.openTable('chunks');
  const finalCount = await finalTable.countRows();
  const finalSample = (await finalTable.query().limit(1).toArray())[0];
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ MIGRATION COMPLETE\n');
  console.log(`Chunks: ${finalCount.toLocaleString()}`);
  console.log(`New fields: ${Object.keys(finalSample).join(', ')}`);
  console.log(`Sample: page_number=${finalSample.page_number}, concept_density=${finalSample.concept_density?.toFixed(3)}`);
}

main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
