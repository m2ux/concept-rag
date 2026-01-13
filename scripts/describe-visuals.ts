/**
 * Describe Visuals Script
 * 
 * Generates semantic descriptions for extracted visuals using Vision LLM.
 * Updates the visuals table with:
 * - Semantic description
 * - Updated embeddings
 * - Extracted concepts
 * - Linked chunk IDs
 * 
 * Usage:
 *   npx tsx scripts/describe-visuals.ts [options]
 * 
 * Options:
 *   --dbpath <path>    Database path (default: ~/.concept_rag)
 *   --catalog-id <id>  Describe visuals for specific catalog ID
 *   --limit <n>        Limit number of visuals to process
 *   --redescribe       Re-describe visuals that already have descriptions
 *   --model <name>     Vision model to use (default: anthropic/claude-sonnet-4)
 *   --dry-run          Show what would be processed without calling API
 *   --cleanup          Remove stale visual records with missing image files
 * 
 * Examples:
 *   npx tsx scripts/describe-visuals.ts
 *   npx tsx scripts/describe-visuals.ts --catalog-id 12345678
 *   npx tsx scripts/describe-visuals.ts --redescribe --limit 10
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import minimist from 'minimist';
import { createVisionLLMService } from '../src/infrastructure/visual-extraction/vision-llm-service.js';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';
import { hashToId } from '../src/infrastructure/utils/hash.js';

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const dbPath = args.dbpath || path.join(os.homedir(), '.concept_rag');
const catalogIdFilter = args['catalog-id'] ? parseInt(args['catalog-id'], 10) : undefined;
const limit = args.limit ? parseInt(args.limit, 10) : undefined;
const redescribe = args.redescribe || false;
const visionModel = args.model as string | undefined;
const dryRun = args['dry-run'] || false;
const cleanupStale = args.cleanup || false;

// Rate limiting: Vision API calls per second
const RATE_LIMIT_DELAY_MS = 2000;

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract simple concepts from a description.
 * Uses keyword extraction for MVP - can be enhanced with LLM later.
 */
function extractConceptsFromDescription(description: string): string[] {
  // Common technical terms to look for
  const technicalPatterns = [
    /dependency injection/gi,
    /microservices?/gi,
    /architecture/gi,
    /design patterns?/gi,
    /data flow/gi,
    /state machine/gi,
    /sequence diagram/gi,
    /class diagram/gi,
    /flowchart/gi,
    /workflow/gi,
    /api/gi,
    /database/gi,
    /components?/gi,
    /modules?/gi,
    /layers?/gi,
    /interfaces?/gi,
    /services?/gi,
    /controllers?/gi,
    /repositories?/gi,
    /entities/gi,
    /domain/gi,
    /infrastructure/gi,
    /presentation/gi,
    /business logic/gi,
    /use cases?/gi,
    /clean architecture/gi,
    /hexagonal/gi,
    /onion/gi,
    /mvc/gi,
    /mvvm/gi,
    /solid/gi,
    /dry/gi,
    /kiss/gi,
  ];

  const concepts = new Set<string>();
  
  for (const pattern of technicalPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      for (const match of matches) {
        concepts.add(match.toLowerCase());
      }
    }
  }

  return Array.from(concepts).slice(0, 10);  // Limit to 10 concepts
}

async function main() {
  console.log('📝 Visual Description Generator');
  console.log('================================\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey && !dryRun) {
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
  if (!tables.includes('visuals')) {
    console.error('❌ Visuals table not found. Run add-visuals-table.ts first.');
    process.exit(1);
  }
  if (!tables.includes('concepts')) {
    console.error('❌ Concepts table not found.');
    process.exit(1);
  }
  if (!tables.includes('chunks')) {
    console.error('❌ Chunks table not found.');
    process.exit(1);
  }

  const visuals = await db.openTable('visuals');
  const concepts = await db.openTable('concepts');
  const chunks = await db.openTable('chunks');

  // Cleanup stale records if requested
  if (cleanupStale) {
    console.log('\n🧹 Cleaning up stale visual records...');
    const allVisuals = await visuals.query().limit(100000).toArray();
    let removedCount = 0;
    
    for (const visual of allVisuals) {
      const imagePath = path.join(dbPath, visual.image_path);
      if (!fs.existsSync(imagePath)) {
        await visuals.delete(`id = ${visual.id}`);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`   Removed ${removedCount} stale records`);
    } else {
      console.log('   No stale records found');
    }
    
    const visualCount = await visuals.countRows();
    console.log(`   Visuals table now has ${visualCount} rows`);
  }

  // Get visuals to process
  let visualEntries: any[] = [];
  
  if (catalogIdFilter) {
    const entries = await visuals.query().where(`catalog_id = ${catalogIdFilter}`).toArray();
    visualEntries = entries;
  } else {
    const allEntries = await visuals.query().limit(10000).toArray();
    visualEntries = allEntries;
  }

  // Filter by description status
  if (!redescribe) {
    visualEntries = visualEntries.filter((v: any) => 
      !v.description || 
      v.description.includes('pending description') ||
      v.description.includes('description unavailable')
    );
  }

  if (limit && visualEntries.length > limit) {
    visualEntries = visualEntries.slice(0, limit);
  }

  console.log(`🖼️  Found ${visualEntries.length} visuals to process`);
  
  if (visualEntries.length === 0) {
    console.log('   No visuals need description.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('\n🔍 Dry run mode - showing what would be processed:\n');
    for (const entry of visualEntries.slice(0, 10)) {
      console.log(`   📷 Visual ${entry.id}`);
      console.log(`      Page: ${entry.page_number}, Type: ${entry.visual_type}`);
      console.log(`      Image: ${entry.image_path}`);
    }
    if (visualEntries.length > 10) {
      console.log(`   ... and ${visualEntries.length - 10} more`);
    }
    console.log('\n   Run without --dry-run to generate descriptions.');
    process.exit(0);
  }

  // Create services
  const visionService = createVisionLLMService({
    apiKey,
    model: visionModel
  });
  const embeddingService = new SimpleEmbeddingService();

  // Build concept name lookup
  console.log('\n📚 Loading concept index...');
  const conceptEntries = await concepts.query().limit(100000).toArray();
  const conceptNameToId = new Map<string, number>();
  for (const c of conceptEntries) {
    if (c.name) {
      conceptNameToId.set(c.name.toLowerCase(), c.id);
    }
  }
  console.log(`   Loaded ${conceptNameToId.size} concepts`);

  // Build chunk lookup by catalog_id and page
  console.log('📄 Loading chunk index...');
  const chunkEntries = await chunks.query().limit(100000).toArray();
  const chunksByPage = new Map<string, number[]>();  // "catalogId-page" -> chunk IDs
  for (const chunk of chunkEntries) {
    if (chunk.catalog_id && chunk.page_number) {
      const key = `${chunk.catalog_id}-${chunk.page_number}`;
      if (!chunksByPage.has(key)) {
        chunksByPage.set(key, []);
      }
      chunksByPage.get(key)!.push(chunk.id);
    }
  }
  console.log(`   Indexed chunks for ${chunksByPage.size} pages`);

  let processed = 0;
  let errors = 0;
  let skippedMissing = 0;

  // Process each visual
  for (let i = 0; i < visualEntries.length; i++) {
    const visual = visualEntries[i];
    const imagePath = path.join(dbPath, visual.image_path);

    // Check image exists - silently skip missing images (stale records)
    if (!fs.existsSync(imagePath)) {
      skippedMissing++;
      continue;
    }

    console.log(`\n[${i + 1}/${visualEntries.length}] 📷 Visual ${visual.id}`);
    console.log(`   Page ${visual.page_number}, Type: ${visual.visual_type}`);

    try {
      // Generate description
      process.stdout.write('   🔍 Generating description...');
      const descResult = await visionService.describeVisual(imagePath);
      console.log(' ✅');

      // Extract concepts from description
      const extractedConcepts = [
        ...descResult.concepts,
        ...extractConceptsFromDescription(descResult.description)
      ];
      const uniqueConcepts = [...new Set(extractedConcepts.map(c => c.toLowerCase()))];

      // Map concept names to IDs
      const conceptIds: number[] = [];
      const conceptNames: string[] = [];
      for (const conceptName of uniqueConcepts) {
        const conceptId = conceptNameToId.get(conceptName);
        if (conceptId) {
          conceptIds.push(conceptId);
          conceptNames.push(conceptName);
        }
      }

      // Find chunks on same page
      const pageKey = `${visual.catalog_id}-${visual.page_number}`;
      const chunkIds = chunksByPage.get(pageKey) || [];

      // Generate embedding for description
      const vector = embeddingService.generateEmbedding(descResult.description);

      // Update visual record
      // LanceDB doesn't support update, so we delete and re-add
      await visuals.delete(`id = ${visual.id}`);
      
      await visuals.add([{
        id: visual.id,
        catalog_id: visual.catalog_id,
        catalog_title: visual.catalog_title,
        image_path: visual.image_path,
        description: descResult.description,
        vector,
        visual_type: descResult.type,
        page_number: visual.page_number,
        bounding_box: visual.bounding_box || '',
        concept_ids: conceptIds.length > 0 ? conceptIds : [0],
        concept_names: conceptNames.length > 0 ? conceptNames : [''],
        chunk_ids: chunkIds.length > 0 ? chunkIds : [0]
      }]);

      console.log(`   📝 Description: ${descResult.description.substring(0, 80)}...`);
      console.log(`   🏷️  Concepts: ${conceptNames.length > 0 ? conceptNames.join(', ') : 'none'}`);
      console.log(`   📄 Linked chunks: ${chunkIds.length}`);

      processed++;

      // Rate limiting
      if (i < visualEntries.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }

    } catch (error: any) {
      console.log(` ❌ Error: ${error.message}`);
      errors++;
    }
  }

  // Final summary
  console.log('\n================================');
  console.log('✅ Description generation complete!\n');
  console.log('📊 Summary:');
  console.log(`   Visuals processed: ${processed}`);
  if (skippedMissing > 0) {
    console.log(`   Skipped (stale records): ${skippedMissing}`);
  }
  if (errors > 0) {
    console.log(`   Errors: ${errors}`);
  }

  // Verify visuals table
  const visualCount = await visuals.countRows();
  console.log(`\n   Visuals table: ${visualCount} rows`);
}

main().catch(err => {
  console.error('\n❌ Description generation failed:', err.message);
  if (err.stack) {
    console.error('\nStack trace:');
    console.error(err.stack);
  }
  process.exit(1);
});

