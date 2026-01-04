/**
 * Update Image Metadata Script
 * 
 * Adds embedded metadata (EXIF) to existing extracted images.
 * This script reads metadata from the visuals table and embeds it
 * into the corresponding PNG files.
 * 
 * Metadata embedded:
 * - Title (document title)
 * - Author
 * - Year
 * - Page number
 * - Image index
 * - Catalog ID
 * 
 * Usage:
 *   npx tsx scripts/update-image-metadata.ts [options]
 * 
 * Options:
 *   --dbpath <path>    Database path (default: ~/.concept_rag)
 *   --catalog-id <id>  Update images for specific catalog ID only
 *   --dry-run          Show what would be updated without making changes
 *   --limit <n>        Limit number of images to process
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import minimist from 'minimist';
import { embedMetadataInPng, type ImageEmbeddedMetadata } from '../src/infrastructure/visual-extraction/image-processor.js';

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const dbPath = args.dbpath || path.join(os.homedir(), '.concept_rag');
const catalogIdFilter = args['catalog-id'] ? parseInt(args['catalog-id'], 10) : undefined;
const dryRun = args['dry-run'] || false;
const limit = args.limit ? parseInt(args.limit, 10) : undefined;

interface VisualRecord {
  id: number;
  catalog_id: number;
  catalog_title: string;
  image_path: string;
  page_number: number;
}

interface CatalogRecord {
  id: number;
  title: string;
  author?: string;
  year?: number;
  source?: string;
}

async function main() {
  console.log('🖼️  Update Image Metadata');
  console.log('=========================\n');

  // Verify database exists
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  // Connect to database
  console.log(`📦 Connecting to database: ${dbPath}`);
  const db = await lancedb.connect(dbPath);

  // Verify tables exist
  const tables = await db.tableNames();
  if (!tables.includes('visuals')) {
    console.error('❌ Visuals table not found');
    process.exit(1);
  }
  if (!tables.includes('catalog')) {
    console.error('❌ Catalog table not found');
    process.exit(1);
  }

  const visualsTable = await db.openTable('visuals');
  const catalogTable = await db.openTable('catalog');

  // Get visuals to update
  let visuals: VisualRecord[];
  if (catalogIdFilter) {
    visuals = await visualsTable.query()
      .where(`catalog_id = ${catalogIdFilter}`)
      .select(['id', 'catalog_id', 'catalog_title', 'image_path', 'page_number'])
      .limit(limit || 100000)
      .toArray() as VisualRecord[];
  } else {
    visuals = await visualsTable.query()
      .select(['id', 'catalog_id', 'catalog_title', 'image_path', 'page_number'])
      .limit(limit || 100000)
      .toArray() as VisualRecord[];
  }

  console.log(`📚 Found ${visuals.length} images to update\n`);

  if (visuals.length === 0) {
    console.log('   No images found matching criteria.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('🔍 Dry run mode - showing what would be updated:\n');
  }

  // Build catalog lookup for author/year info
  const catalogIds = [...new Set(visuals.map(v => v.catalog_id))];
  const catalogLookup = new Map<number, CatalogRecord>();
  
  for (const catId of catalogIds) {
    const entries = await catalogTable.query()
      .where(`id = ${catId}`)
      .select(['id', 'title', 'author', 'year', 'source'])
      .limit(1)
      .toArray() as CatalogRecord[];
    
    if (entries.length > 0) {
      catalogLookup.set(catId, entries[0]);
    }
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < visuals.length; i++) {
    const visual = visuals[i];
    const catalog = catalogLookup.get(visual.catalog_id);
    
    // Build full image path
    const imagePath = path.join(dbPath, visual.image_path);
    
    // Parse image index from filename (e.g., p42_v0.png -> 0)
    const filename = path.basename(visual.image_path);
    const indexMatch = filename.match(/v(\d+)\.png$/);
    const imageIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0;

    // Progress indicator
    const progress = `[${i + 1}/${visuals.length}]`;
    
    if (!fs.existsSync(imagePath)) {
      console.log(`${progress} ⚠️  Skipping (file not found): ${visual.image_path}`);
      skipped++;
      continue;
    }

    // Build metadata
    const metadata: ImageEmbeddedMetadata = {
      title: catalog?.title || visual.catalog_title,
      author: catalog?.author,
      year: catalog?.year,
      pageNumber: visual.page_number,
      imageIndex,
      catalogId: visual.catalog_id,
      source: catalog?.source
    };

    if (dryRun) {
      console.log(`${progress} Would update: ${visual.image_path}`);
      console.log(`         Title: ${metadata.title}`);
      console.log(`         Author: ${metadata.author || 'N/A'}`);
      console.log(`         Year: ${metadata.year || 'N/A'}`);
      console.log(`         Page: ${metadata.pageNumber}, Index: ${metadata.imageIndex}`);
      updated++;
    } else {
      try {
        await embedMetadataInPng(imagePath, metadata);
        updated++;
        
        // Show progress every 10 images or for first/last
        if (i === 0 || i === visuals.length - 1 || (i + 1) % 10 === 0) {
          console.log(`${progress} ✅ Updated: ${visual.image_path}`);
        }
      } catch (error: any) {
        console.log(`${progress} ❌ Error: ${visual.image_path} - ${error.message}`);
        errors++;
      }
    }
  }

  // Summary
  console.log('\n=========================');
  console.log('✅ Metadata update complete!\n');
  console.log('📊 Summary:');
  console.log(`   Images processed: ${visuals.length}`);
  console.log(`   Successfully updated: ${updated}`);
  if (skipped > 0) {
    console.log(`   Skipped (not found): ${skipped}`);
  }
  if (errors > 0) {
    console.log(`   Errors: ${errors}`);
  }

  if (dryRun) {
    console.log('\n   Run without --dry-run to apply changes.');
  }
}

main().catch(err => {
  console.error('\n❌ Script failed:', err.message);
  if (err.stack) {
    console.error('\nStack trace:');
    console.error(err.stack);
  }
  process.exit(1);
});

