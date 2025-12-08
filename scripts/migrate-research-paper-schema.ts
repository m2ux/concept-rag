/**
 * Migration script to add research paper support columns to existing database
 * 
 * Catalog additions: document_type, doi, arxiv_id, venue, keywords, abstract, authors
 * Chunks additions: is_reference, has_math, has_extraction_issues
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';

async function migrate() {
  const dbPath = process.argv[2] || path.join(os.homedir(), '.concept_rag');
  const db = await lancedb.connect(dbPath);
  
  console.log(`📦 Starting schema migration for ${dbPath}...\n`);
  
  // === Migrate Catalog Table ===
  console.log('📚 Migrating catalog table...');
  const catalog = await db.openTable('catalog');
  const catalogCount = await catalog.countRows();
  console.log(`   Found ${catalogCount} documents`);
  
  // Process in batches to handle large datasets
  const batchSize = 50;
  const migratedCatalog: any[] = [];
  
  // LanceDB defaults to 10 results, so we need to set a high limit
  const catalogRows = await catalog.query().limit(catalogCount).toArray();
  
  // Helper to convert Arrow vectors to JS arrays
  function toArray(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val instanceof Float32Array || val instanceof Int32Array || val instanceof Float64Array) {
      return Array.from(val);
    }
    if (val.toArray) return Array.from(val.toArray());
    if (typeof val[Symbol.iterator] === 'function') return Array.from(val);
    return [];
  }
  
  for (const row of catalogRows) {
    const vector = toArray(row.vector);
    const concept_ids = toArray(row.concept_ids);
    const category_ids = toArray(row.category_ids);
    const concept_names = toArray(row.concept_names);
    const category_names = toArray(row.category_names);
    
    migratedCatalog.push({
      id: row.id,
      hash: row.hash,
      vector,
      source: row.source,
      summary: row.summary || '',
      origin_hash: row.origin_hash || '',
      title: row.title || '',
      author: row.author || '',
      year: row.year || null,
      publisher: row.publisher || '',
      isbn: row.isbn || '',
      concept_ids,
      concept_names,
      category_ids,
      category_names,
      // New columns with defaults for existing books
      document_type: 'book',
      doi: '',
      arxiv_id: '',
      venue: '',
      keywords: '',  // comma-separated string
      abstract: '',
      authors: ''    // comma-separated string
    });
  }
  
  console.log(`   Processed ${migratedCatalog.length} documents`);
  
  // Drop and recreate with new schema
  await db.dropTable('catalog');
  await db.createTable('catalog', migratedCatalog);
  console.log('   ✅ Catalog migrated');
  
  // Verify catalog schema
  const newCatalog = await db.openTable('catalog');
  const catalogSchema = await newCatalog.schema();
  console.log(`   Columns: ${catalogSchema.fields.map(f => f.name).join(', ')}`);
  
  // === Migrate Chunks Table ===
  console.log('\n📄 Migrating chunks table...');
  const chunks = await db.openTable('chunks');
  const chunksCount = await chunks.countRows();
  console.log(`   Found ${chunksCount} chunks`);
  
  const chunksRows = await chunks.query().limit(chunksCount).toArray();
  const migratedChunks: any[] = [];
  
  for (const row of chunksRows) {
    const vector = toArray(row.vector);
    const concept_ids = toArray(row.concept_ids);
    const concept_names = toArray(row.concept_names);
    
    migratedChunks.push({
      id: row.id,
      hash: row.hash,
      vector,
      text: row.text,
      page_number: row.page_number,
      concept_ids,
      concept_names,
      concept_density: row.concept_density || 0,
      catalog_id: row.catalog_id,
      catalog_title: row.catalog_title || '',
      // New columns
      is_reference: false,
      has_math: false,
      has_extraction_issues: false
    });
  }
  
  console.log(`   Processed ${migratedChunks.length} chunks`);
  
  // Drop and recreate with new schema
  await db.dropTable('chunks');
  await db.createTable('chunks', migratedChunks);
  console.log('   ✅ Chunks migrated');
  
  // Verify chunks schema
  const newChunks = await db.openTable('chunks');
  const chunksSchema = await newChunks.schema();
  console.log(`   Columns: ${chunksSchema.fields.map(f => f.name).join(', ')}`);
  
  console.log('\n🎉 Schema migration complete!');
  
  // Final stats
  const finalCatalogCount = await newCatalog.countRows();
  const finalChunksCount = await newChunks.countRows();
  console.log(`\n📊 Final stats:`);
  console.log(`   Catalog: ${finalCatalogCount} documents`);
  console.log(`   Chunks: ${finalChunksCount} chunks`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

