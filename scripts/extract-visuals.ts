/**
 * Extract Visuals Script
 * 
 * Extracts diagrams from PDF documents in the catalog and stores them
 * as grayscale images with metadata in the visuals table.
 * 
 * Only diagrams with semantic meaning are stored:
 * - Flowcharts, UML, architecture diagrams
 * - Charts and graphs
 * - Tables
 * - Technical figures
 * 
 * Photos, screenshots, and decorative images are filtered out.
 * 
 * Usage:
 *   npx tsx scripts/extract-visuals.ts [options]
 * 
 * Options:
 *   --dbpath <path>    Database path (default: ~/.concept_rag)
 *   --source <name>    Extract from specific document (partial match on title)
 *   --catalog-id <id>  Extract from specific catalog ID
 *   --limit <n>        Limit number of documents to process
 *   --dpi <n>          Rendering DPI (default: 150)
 *   --dry-run          Show what would be extracted without saving
 *   --resume           Skip documents that already have visuals in the database
 * 
 * Examples:
 *   npx tsx scripts/extract-visuals.ts
 *   npx tsx scripts/extract-visuals.ts --source "Clean Architecture"
 *   npx tsx scripts/extract-visuals.ts --catalog-id 12345678
 *   npx tsx scripts/extract-visuals.ts --limit 5 --dry-run
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import minimist from 'minimist';
import { VisualExtractor } from '../src/infrastructure/visual-extraction/visual-extractor.js';
import { isPdfToolsAvailable } from '../src/infrastructure/visual-extraction/pdf-page-renderer.js';
import { hashToId } from '../src/infrastructure/utils/hash.js';
import { serializeBoundingBox } from '../src/domain/models/visual.js';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const dbPath = args.dbpath || path.join(os.homedir(), '.concept_rag');
const sourceFilter = args.source as string | undefined;
const catalogIdFilter = args['catalog-id'] ? parseInt(args['catalog-id'], 10) : undefined;
const limit = args.limit ? parseInt(args.limit, 10) : undefined;
const renderDpi = args.dpi ? parseInt(args.dpi, 10) : 150;
const dryRun = args['dry-run'] || false;
const resumeMode = args.resume || false;

async function main() {
  console.log('🖼️  Visual Extraction');
  console.log('=====================\n');

  // Check prerequisites
  if (!isPdfToolsAvailable()) {
    console.error('❌ pdftoppm not found. Install poppler-utils:');
    console.error('   Ubuntu/Debian: sudo apt install poppler-utils');
    console.error('   macOS: brew install poppler');
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable is required');
    console.error('   Get an API key from https://openrouter.ai/');
    process.exit(1);
  }

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
  if (!tables.includes('catalog')) {
    console.error('❌ Catalog table not found');
    process.exit(1);
  }
  if (!tables.includes('visuals')) {
    console.error('❌ Visuals table not found. Run add-visuals-table.ts first.');
    process.exit(1);
  }

  const catalog = await db.openTable('catalog');
  const visuals = await db.openTable('visuals');

  // Get catalog entries to process
  let catalogEntries: any[] = [];
  
  if (catalogIdFilter) {
    const entries = await catalog.query().where(`id = ${catalogIdFilter}`).toArray();
    catalogEntries = entries;
  } else {
    const allEntries = await catalog.query().limit(10000).toArray();
    
    if (sourceFilter) {
      const filterLower = sourceFilter.toLowerCase();
      catalogEntries = allEntries.filter((e: any) => 
        (e.title || '').toLowerCase().includes(filterLower) ||
        (e.source || '').toLowerCase().includes(filterLower)
      );
    } else {
      catalogEntries = allEntries;
    }
  }

  if (limit && catalogEntries.length > limit) {
    catalogEntries = catalogEntries.slice(0, limit);
  }

  // In resume mode, filter out documents that already have visuals
  let skippedCount = 0;
  if (resumeMode) {
    console.log('🔄 Resume mode: checking for already-processed documents...');
    const existingVisuals = await visuals.query().select(['catalog_id']).limit(100000).toArray();
    const processedCatalogIds = new Set(existingVisuals.map((v: any) => v.catalog_id));
    
    const originalCount = catalogEntries.length;
    catalogEntries = catalogEntries.filter((e: any) => !processedCatalogIds.has(e.id));
    skippedCount = originalCount - catalogEntries.length;
    
    if (skippedCount > 0) {
      console.log(`   ⏭️  Skipping ${skippedCount} documents with existing visuals`);
    }
  }

  console.log(`📚 Found ${catalogEntries.length} documents to process`);
  
  if (catalogEntries.length === 0) {
    console.log('   No documents matched the filter criteria.');
    if (resumeMode && skippedCount > 0) {
      console.log(`   (${skippedCount} documents already have visuals)`);
    }
    process.exit(0);
  }

  if (dryRun) {
    console.log('\n🔍 Dry run mode - showing what would be processed:\n');
    for (const entry of catalogEntries) {
      console.log(`   📄 ${entry.title || 'Untitled'}`);
      console.log(`      Source: ${entry.source || 'Unknown'}`);
      console.log(`      ID: ${entry.id}`);
    }
    console.log('\n   Run without --dry-run to extract visuals.');
    process.exit(0);
  }

  // Create extractor and embedding service
  const extractor = new VisualExtractor(dbPath, {
    apiKey,
    config: { renderDpi }
  });
  const embeddingService = new SimpleEmbeddingService();

  let totalVisuals = 0;
  let totalFiltered = 0;
  let totalErrors = 0;

  // Process each document
  for (let i = 0; i < catalogEntries.length; i++) {
    const entry = catalogEntries[i];
    const title = entry.title || 'Untitled';
    const source = entry.source || '';
    const catalogId = entry.id;

    console.log(`\n[${i + 1}/${catalogEntries.length}] 📄 ${title}`);
    
    // Check if source file exists and is a PDF
    if (!source || !source.toLowerCase().endsWith('.pdf')) {
      console.log('   ⏭️  Skipping (not a PDF)');
      continue;
    }

    if (!fs.existsSync(source)) {
      console.log(`   ⚠️  Source file not found: ${source}`);
      continue;
    }

    // Build document info for intuitive folder naming
    const documentInfo = {
      title,
      author: entry.author || undefined,
      year: entry.year || undefined,
      id: catalogId
    };

    // Extract visuals
    const result = await extractor.extractFromPdf(source, catalogId, documentInfo, {
      onProgress: (stage, current, total, message) => {
        const stageIcon = stage === 'rendering' ? '📷' :
                         stage === 'classifying' ? '🔍' :
                         stage === 'extracting' ? '✂️' : '🏷️';
        process.stdout.write(`\r   ${stageIcon} ${stage}: ${current}/${total} ${message || ''}`.padEnd(80));
      }
    });

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(80) + '\r');

    // Report results
    console.log(`   📁 Folder: ${result.folderSlug}`);
    console.log(`   ✅ Extracted: ${result.visuals.length} visuals, Filtered: ${result.imagesFiltered} non-semantic images`);
    
    if (result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${result.errors.length}`);
      for (const error of result.errors.slice(0, 3)) {
        console.log(`      - ${error}`);
      }
      if (result.errors.length > 3) {
        console.log(`      ... and ${result.errors.length - 3} more`);
      }
    }

    // Add visuals to database
    for (const visual of result.visuals) {
      // Generate ID
      const visualId = hashToId(`${catalogId}-${visual.pageNumber}-${visual.visualIndex}`);
      
      // Create placeholder description (will be filled by describe-visuals.ts)
      const description = `Visual on page ${visual.pageNumber} (pending description)`;
      const vector = embeddingService.generateEmbedding(description);

      const visualRecord = {
        id: visualId,
        catalog_id: catalogId,
        catalog_title: title,
        image_path: visual.imagePath,
        description,
        vector,
        visual_type: visual.type,
        page_number: visual.pageNumber,
        bounding_box: serializeBoundingBox(visual.boundingBox),
        concept_ids: [0],  // Placeholder
        concept_names: [''],  // Placeholder
        chunk_ids: [0]  // Placeholder - will be linked later
      };

      try {
        await visuals.add([visualRecord]);
      } catch (addError: any) {
        console.log(`   ⚠️  Failed to add visual: ${addError.message}`);
        totalErrors++;
      }
    }

    totalVisuals += result.visuals.length;
    totalFiltered += result.imagesFiltered;
    totalErrors += result.errors.length;
  }

  // Final summary
  console.log('\n=====================');
  console.log('✅ Extraction complete!\n');
  console.log('📊 Summary:');
  console.log(`   Documents processed: ${catalogEntries.length}`);
  console.log(`   Visuals extracted: ${totalVisuals}`);
  console.log(`   Non-semantic filtered: ${totalFiltered}`);
  if (totalErrors > 0) {
    console.log(`   Errors: ${totalErrors}`);
  }

  // Verify visuals table
  const visualCount = await visuals.countRows();
  console.log(`\n   Visuals table: ${visualCount} rows`);

  console.log('\n🎯 Next steps:');
  console.log('   Run describe-visuals.ts to generate semantic descriptions');
}

main().catch(err => {
  console.error('\n❌ Extraction failed:', err.message);
  if (err.stack) {
    console.error('\nStack trace:');
    console.error(err.stack);
  }
  process.exit(1);
});

