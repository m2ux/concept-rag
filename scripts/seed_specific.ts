#!/usr/bin/env tsx

import * as lancedb from '@lancedb/lancedb';
import { Document } from "@langchain/core/documents";
import { ConceptExtractor } from '../src/concepts/concept_extractor.js';
import { ConceptChunkMatcher } from '../src/concepts/concept_chunk_matcher.js';
import { ConceptIndexBuilder } from '../src/concepts/concept_index.js';

/**
 * Seed specific documents (by hash prefix or filename pattern)
 * 
 * This script is useful when:
 * - Documents were never processed (skipped during initial seeding)
 * - A document had partial chunk failures during seeding
 * - You've fixed a bug and want to re-seed specific documents
 * - You want to update concepts for documents matching a pattern
 * 
 * Usage:
 *   # Seed by hash prefix
 *   npx tsx scripts/seed_specific.ts --hash 3cde 5c78
 * 
 *   # Seed by filename pattern
 *   npx tsx scripts/seed_specific.ts --pattern "Transaction Processing"
 * 
 *   # Seed by source path
 *   npx tsx scripts/seed_specific.ts --source "DistributedSystems/Transaction Processing_"
 */

interface TargetDocument {
  entry: any;
  reason: string;
}

async function main() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const hashPrefixes: string[] = [];
  const patterns: string[] = [];
  const sources: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--hash') {
      // Collect all following args until next flag or end
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        hashPrefixes.push(args[i].toLowerCase());
        i++;
      }
      i--; // Back up one since loop will increment
    } else if (args[i] === '--pattern') {
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        patterns.push(args[i]);
        i++;
      }
      i--;
    } else if (args[i] === '--source') {
      i++;
      while (i < args.length && !args[i].startsWith('--')) {
        sources.push(args[i]);
        i++;
      }
      i--;
    }
  }
  
  if (hashPrefixes.length === 0 && patterns.length === 0 && sources.length === 0) {
    console.error(`❌ No targets specified. Use --hash, --pattern, or --source`);
    console.error(`\nExamples:`);
    console.error(`  npx tsx scripts/seed_specific.ts --hash 3cde 5c78`);
    console.error(`  npx tsx scripts/seed_specific.ts --pattern "Transaction Processing"`);
    console.error(`  npx tsx scripts/seed_specific.ts --source "DistributedSystems/Transaction"`);
    process.exit(1);
  }
  
  console.log(`🔧 Seeding specific documents`);
  console.log(`📂 Database: ${dbPath}\n`);
  
  if (hashPrefixes.length > 0) {
    console.log(`🔍 Target hash prefixes: ${hashPrefixes.join(', ')}`);
  }
  if (patterns.length > 0) {
    console.log(`🔍 Target patterns: ${patterns.join(', ')}`);
  }
  if (sources.length > 0) {
    console.log(`🔍 Target sources: ${sources.join(', ')}`);
  }
  console.log();
  
  const db = await lancedb.connect(dbPath);
  const catalogTable = await db.openTable('catalog');
  const chunksTable = await db.openTable('chunks');
  
  // Load all catalog entries
  console.log('📚 Loading catalog entries...');
  const allCatalog = await catalogTable.query().limit(100000).toArray();
  console.log(`  ✅ Loaded ${allCatalog.length} entries\n`);
  
  // Find matching documents
  console.log('🔍 Finding matching documents...');
  const targets: TargetDocument[] = [];
  
  for (const entry of allCatalog) {
    let matched = false;
    let reason = '';
    
    // Check hash prefixes
    if (hashPrefixes.length > 0 && entry.hash) {
      for (const prefix of hashPrefixes) {
        if (entry.hash.toLowerCase().startsWith(prefix)) {
          matched = true;
          reason = `Hash matches prefix: ${prefix}`;
          break;
        }
      }
    }
    
    // Check filename patterns
    if (!matched && patterns.length > 0 && entry.source) {
      const filename = entry.source.split('/').pop() || entry.source;
      for (const pattern of patterns) {
        if (filename.includes(pattern)) {
          matched = true;
          reason = `Filename matches pattern: ${pattern}`;
          break;
        }
      }
    }
    
    // Check source paths
    if (!matched && sources.length > 0 && entry.source) {
      for (const source of sources) {
        if (entry.source.includes(source)) {
          matched = true;
          reason = `Source path matches: ${source}`;
          break;
        }
      }
    }
    
    if (matched) {
      targets.push({ entry, reason });
    }
  }
  
  console.log(`  ✅ Found ${targets.length} matching documents\n`);
  
  if (targets.length === 0) {
    console.log('❌ No matching documents found');
    return;
  }
  
  // Show what will be seeded
  console.log('📋 Documents to seed:');
  targets.forEach((item, idx) => {
    const filename = item.entry.source.split('/').pop();
    const hashPrefix = item.entry.hash.substring(0, 8);
    const currentConcepts = (() => {
      try {
        const concepts = typeof item.entry.concepts === 'string' 
          ? JSON.parse(item.entry.concepts)
          : item.entry.concepts;
        return concepts.primary_concepts?.length || 0;
      } catch {
        return 0;
      }
    })();
    console.log(`  ${idx + 1}. [${hashPrefix}] ${filename}`);
    console.log(`     Current concepts: ${currentConcepts}`);
    console.log(`     Reason: ${item.reason}`);
  });
  
  console.log(`\n🔄 Starting seeding...\n`);
  
  const extractor = new ConceptExtractor(apiKey);
  await extractor.checkRateLimits();
  
  const seededDocs: Document[] = [];
  const failedDocs: string[] = [];
  
  for (let i = 0; i < targets.length; i++) {
    const { entry, reason } = targets[i];
    const filename = entry.source.split('/').pop();
    
    console.log(`\n[${i + 1}/${targets.length}] 🔧 Seeding: ${filename}`);
    console.log(`   Previous: ${reason}`);
    
    try {
      // Load chunks for this document
      const docChunks = await chunksTable
        .query()
        .where(`source = "${entry.source}"`)
        .limit(10000)
        .toArray();
      
      if (docChunks.length === 0) {
        console.log(`   ⚠️  No chunks found - skipping`);
        failedDocs.push(filename);
        continue;
      }
      
      // Recreate documents from chunks
      const docs = docChunks.map((chunk: any) => 
        new Document({
          pageContent: chunk.text || '',
          metadata: {
            source: entry.source,
            hash: entry.hash,
            loc: typeof chunk.loc === 'string' ? JSON.parse(chunk.loc) : chunk.loc
          }
        })
      );
      
      console.log(`   📦 Loaded ${docs.length} chunks`);
      
      // Extract concepts with the fixed code
      console.log(`   🤖 Extracting concepts...`);
      const concepts = await extractor.extractConcepts(docs);
      
      const conceptCount = concepts.primary_concepts?.length || 0;
      console.log(`   ✅ Extracted ${conceptCount} concepts`);
      
      if (conceptCount === 0) {
        console.log(`   ⚠️  No concepts extracted - keeping original`);
        failedDocs.push(filename);
        continue;
      }
      
      // Create document with new concepts
      seededDocs.push(new Document({
        pageContent: '',
        metadata: {
          source: entry.source,
          hash: entry.hash,
          concepts: concepts
        }
      }));
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      failedDocs.push(filename);
    }
  }
  
  console.log(`\n\n📊 Seeding Summary:`);
  console.log(`   - Documents processed: ${targets.length}`);
  console.log(`   - Successfully seeded: ${seededDocs.length}`);
  console.log(`   - Failed: ${failedDocs.length}`);
  
  if (failedDocs.length > 0) {
    console.log(`\n⚠️  Failed documents:`);
    failedDocs.forEach(name => console.log(`   - ${name}`));
  }
  
  if (seededDocs.length === 0) {
    console.log(`\n❌ No documents successfully seeded`);
    return;
  }
  
  // Update catalog
  console.log(`\n📝 Updating catalog with seeded concepts...`);
  
  for (const doc of seededDocs) {
    const source = doc.metadata.source;
    const concepts = doc.metadata.concepts;
    
    try {
      // Find original entry to preserve other fields
      const originalEntry = targets.find(item => item.entry.source === source)?.entry;
      
      if (!originalEntry) continue;
      
      // Update the concepts field
      await catalogTable
        .update()
        .where(`source = "${source}"`)
        .set({ concepts: JSON.stringify(concepts) })
        .execute();
      
      console.log(`   ✅ Updated: ${source.split('/').pop()}`);
    } catch (error) {
      console.error(`   ❌ Failed to update ${source}: ${error}`);
    }
  }
  
  // Enrich chunks
  console.log(`\n🔄 Enriching chunks for seeded documents...`);
  
  const matcher = new ConceptChunkMatcher();
  let totalUpdated = 0;
  
  for (const doc of seededDocs) {
    const source = doc.metadata.source;
    const documentConcepts = doc.metadata.concepts;
    
    console.log(`   📦 Processing chunks for: ${source.split('/').pop()}`);
    
    // Load chunks
    const chunks = await chunksTable
      .query()
      .where(`source = "${source}"`)
      .limit(10000)
      .toArray();
    
    console.log(`      Found ${chunks.length} chunks`);
    
    // Re-enrich each chunk
    for (const chunk of chunks) {
      const matched = matcher.matchConceptsToChunk(
        chunk.text || '',
        documentConcepts
      );
      
      await chunksTable
        .update()
        .where(`id = "${chunk.id}"`)
        .set({
          concepts: JSON.stringify(matched.concepts),
          concept_categories: JSON.stringify(matched.categories),
          concept_density: matched.concept_density
        })
        .execute();
      
      totalUpdated++;
    }
    
    console.log(`      ✅ Updated ${chunks.length} chunks`);
  }
  
  console.log(`   ✅ Total chunks updated: ${totalUpdated}`);
  
  // Rebuild concept index
  console.log(`\n🧠 Rebuilding concept index...`);
  
  const allCatalogFresh = await catalogTable.query().limit(100000).toArray();
  const allChunks = await chunksTable.query().limit(1000000).toArray();
  
  const docs = allChunks.map((chunk: any) => 
    new Document({
      pageContent: chunk.text || '',
      metadata: {
        source: chunk.source,
        concepts: typeof chunk.concepts === 'string' ? JSON.parse(chunk.concepts) : chunk.concepts,
        concept_categories: typeof chunk.concept_categories === 'string' 
          ? JSON.parse(chunk.concept_categories) 
          : chunk.concept_categories,
        concept_density: chunk.concept_density
      }
    })
  );
  
  const conceptBuilder = new ConceptIndexBuilder();
  const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogFresh, docs);
  
  console.log(`   ✅ Built ${conceptRecords.length} concept records`);
  
  // Drop and recreate concepts table
  try {
    await db.dropTable('concepts');
    console.log(`   🗑️  Dropped old concepts table`);
  } catch (e) {
    // Table might not exist
  }
  
  const conceptsTable = await db.createTable('concepts', conceptRecords, { mode: 'create' });
  console.log(`   ✅ Created new concepts table with ${conceptRecords.length} records`);
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`\n📊 Final Summary:`);
  console.log(`   - Documents seeded: ${seededDocs.length}`);
  console.log(`   - Chunks updated: ${totalUpdated}`);
  console.log(`   - Concepts in index: ${conceptRecords.length}`);
}

main().catch(console.error);

