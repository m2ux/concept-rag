/**
 * Migration script to add visuals table to existing database
 * 
 * This script safely augments a production database by:
 * 1. Creating the `visuals` table with proper schema
 * 2. Creating the `images/` directory for storing extracted diagrams
 * 
 * **Non-destructive:** Does NOT modify existing tables (catalog, chunks, concepts, categories)
 * 
 * Usage:
 *   npx tsx scripts/add-visuals-table.ts [--dbpath <path>]
 * 
 * Options:
 *   --dbpath  Path to database directory (default: ~/.concept_rag)
 *   --force   Recreate visuals table if it already exists
 * 
 * Examples:
 *   npx tsx scripts/add-visuals-table.ts
 *   npx tsx scripts/add-visuals-table.ts --dbpath /path/to/db
 *   npx tsx scripts/add-visuals-table.ts --force
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import minimist from 'minimist';

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const dbPath = args.dbpath || path.join(os.homedir(), '.concept_rag');
const force = args.force || false;

/**
 * Create an empty row with proper schema for the visuals table.
 * LanceDB infers schema from the first row inserted.
 * 
 * Note: 
 * - LanceDB prefers regular number arrays for vectors, not Float32Array.
 * - Empty arrays cannot be used for type inference, so we use [0] placeholder.
 */
function createSchemaRow(): Record<string, unknown> {
  // Create a 384-dim zero vector as a regular array
  const zeroVector = new Array(384).fill(0);
  
  return {
    id: 0,
    catalog_id: 0,
    catalog_title: '',
    image_path: '',
    description: '',
    vector: zeroVector,
    visual_type: 'diagram',
    page_number: 0,
    bounding_box: '',
    // Use [0] placeholder for type inference (will be deleted)
    concept_ids: [0],
    concept_names: [''],
    chunk_ids: [0]
  };
}

async function migrate() {
  console.log('🎨 Diagram Awareness Migration');
  console.log('================================\n');
  
  // Verify database exists
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    console.error('   Run seeding first to create the database.');
    process.exit(1);
  }
  
  console.log(`📦 Connecting to database: ${dbPath}`);
  const db = await lancedb.connect(dbPath);
  
  // List existing tables
  const existingTables = await db.tableNames();
  console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
  
  // Verify core tables exist
  const requiredTables = ['catalog', 'chunks', 'concepts', 'categories'];
  const missingTables = requiredTables.filter(t => !existingTables.includes(t));
  
  if (missingTables.length > 0) {
    console.error(`\n❌ Missing required tables: ${missingTables.join(', ')}`);
    console.error('   This database appears incomplete. Run seeding first.');
    process.exit(1);
  }
  
  // Check if visuals table already exists
  if (existingTables.includes('visuals')) {
    if (force) {
      console.log('\n⚠️  Visuals table exists. --force specified, dropping and recreating...');
      await db.dropTable('visuals');
    } else {
      console.log('\n✅ Visuals table already exists.');
      console.log('   Use --force to drop and recreate.');
      
      // Show current stats
      const visuals = await db.openTable('visuals');
      const count = await visuals.countRows();
      console.log(`   Current row count: ${count}`);
      
      // Verify images directory
      const imagesDir = path.join(dbPath, 'images');
      if (fs.existsSync(imagesDir)) {
        console.log(`   Images directory exists: ${imagesDir}`);
      }
      
      process.exit(0);
    }
  }
  
  // Create images directory
  const imagesDir = path.join(dbPath, 'images');
  console.log(`\n📁 Creating images directory: ${imagesDir}`);
  
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('   ✅ Created');
  } else {
    console.log('   ✅ Already exists');
  }
  
  // Create visuals table with schema
  console.log('\n📊 Creating visuals table...');
  
  // Create with schema row, then delete it
  const schemaRow = createSchemaRow();
  const visualsTable = await db.createTable('visuals', [schemaRow]);
  
  // Delete the schema row (id = 0)
  await visualsTable.delete('id = 0');
  
  console.log('   ✅ Visuals table created');
  
  // Verify schema
  const schema = await visualsTable.schema();
  console.log('\n📋 Table schema:');
  for (const field of schema.fields) {
    console.log(`   - ${field.name}: ${field.type}`);
  }
  
  // Final stats
  console.log('\n================================');
  console.log('✅ Migration complete!\n');
  
  console.log('📊 Database summary:');
  for (const tableName of [...requiredTables, 'visuals']) {
    const table = await db.openTable(tableName);
    const count = await table.countRows();
    const marker = tableName === 'visuals' ? ' ★ NEW' : '';
    console.log(`   ${tableName}: ${count} rows${marker}`);
  }
  
  console.log('\n📁 Storage structure:');
  console.log(`   ${dbPath}/`);
  console.log('   ├── catalog.lance/');
  console.log('   ├── chunks.lance/');
  console.log('   ├── concepts.lance/');
  console.log('   ├── categories.lance/');
  console.log('   ├── visuals.lance/     ★ NEW');
  console.log('   └── images/            ★ NEW');
  
  console.log('\n🎯 Next steps:');
  console.log('   1. Run extract-visuals.ts to extract diagrams from documents');
  console.log('   2. Run describe-visuals.ts to generate semantic descriptions');
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  if (err.stack) {
    console.error('\nStack trace:');
    console.error(err.stack);
  }
  process.exit(1);
});

