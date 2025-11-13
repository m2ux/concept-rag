import * as lancedb from '@lancedb/lancedb';
import { Document } from "@langchain/core/documents";
import { ConceptExtractor } from '../src/concepts/concept_extractor.js';
import { ConceptChunkMatcher } from '../src/concepts/concept_chunk_matcher.js';
import { ConceptIndexBuilder } from '../src/concepts/concept_index.js';

/**
 * Repair script for documents with missing or incomplete concepts
 * 
 * This script:
 * 1. Identifies documents with no concepts or very few concepts
 * 2. Re-extracts concepts from those documents
 * 3. Updates catalog entries
 * 4. Re-enriches affected chunks
 * 5. Rebuilds concept index
 * 
 * Safe: Only touches documents that need repair
 * 
 * Usage: npx tsx scripts/repair_missing_concepts.ts [--min-concepts 10]
 */

const MIN_CONCEPTS = process.argv.includes('--min-concepts') 
  ? parseInt(process.argv[process.argv.indexOf('--min-concepts') + 1]) 
  : 10;

async function main() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    process.exit(1);
  }
  
  console.log(`🔧 Repairing documents with missing/incomplete concepts`);
  console.log(`📂 Database: ${dbPath}`);
  console.log(`📊 Minimum concepts threshold: ${MIN_CONCEPTS}\n`);
  
  const db = await lancedb.connect(dbPath);
  const catalogTable = await db.openTable('catalog');
  const chunksTable = await db.openTable('chunks');
  
  // Load all catalog entries
  console.log('📚 Loading catalog entries...');
  const allCatalog = await catalogTable.query().limit(100000).toArray();
  console.log(`  ✅ Loaded ${allCatalog.length} entries\n`);
  
  // Identify documents needing repair
  console.log('🔍 Identifying documents needing repair...');
  const needsRepair: Array<{entry: any, reason: string, conceptCount: number}> = [];
  
  for (const entry of allCatalog) {
    if (!entry.concepts) {
      needsRepair.push({entry, reason: 'No concepts field', conceptCount: 0});
      continue;
    }
    
    try {
      const concepts = typeof entry.concepts === 'string' 
        ? JSON.parse(entry.concepts)
        : entry.concepts;
      
      const conceptCount = concepts.primary_concepts?.length || 0;
      
      if (conceptCount === 0) {
        needsRepair.push({entry, reason: 'Empty concepts', conceptCount: 0});
      } else if (conceptCount < MIN_CONCEPTS) {
        needsRepair.push({entry, reason: `Only ${conceptCount} concepts`, conceptCount});
      }
    } catch (e) {
      needsRepair.push({entry, reason: 'Invalid concepts JSON', conceptCount: 0});
    }
  }
  
  console.log(`  ✅ Found ${needsRepair.length} documents needing repair\n`);
  
  if (needsRepair.length === 0) {
    console.log('🎉 All documents have sufficient concepts!');
    return;
  }
  
  // Show what needs repair
  console.log('📋 Documents to repair:');
  needsRepair.forEach((item, idx) => {
    const filename = item.entry.source.split('/').pop();
    console.log(`  ${idx + 1}. ${filename}`);
    console.log(`     Reason: ${item.reason}`);
  });
  
  console.log(`\n🔄 Starting concept re-extraction...\n`);
  
  const extractor = new ConceptExtractor(apiKey);
  await extractor.checkRateLimits();
  
  const repairedDocs: Document[] = [];
  const failedDocs: string[] = [];
  
  for (let i = 0; i < needsRepair.length; i++) {
    const {entry, reason} = needsRepair[i];
    const filename = entry.source.split('/').pop();
    
    console.log(`\n[${i + 1}/${needsRepair.length}] 🔧 Repairing: ${filename}`);
    console.log(`   Previous state: ${reason}`);
    
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
      
      // Extract concepts
      console.log(`   🤖 Extracting concepts...`);
      const concepts = await extractor.extractConcepts(docs);
      
      const conceptCount = concepts.primary_concepts?.length || 0;
      console.log(`   ✅ Extracted ${conceptCount} concepts`);
      
      if (conceptCount === 0) {
        console.log(`   ⚠️  Still no concepts - may need manual review`);
        failedDocs.push(filename);
        continue;
      }
      
      // Create repaired document
      repairedDocs.push(new Document({
        pageContent: entry.text || '',
        metadata: {
          source: entry.source,
          hash: entry.hash,
          concepts: concepts
        }
      }));
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      failedDocs.push(filename);
    }
  }
  
  console.log(`\n\n📊 Repair Summary:`);
  console.log(`   - Documents repaired: ${repairedDocs.length}`);
  console.log(`   - Documents failed: ${failedDocs.length}`);
  
  if (failedDocs.length > 0) {
    console.log(`\n⚠️  Failed documents:`);
    failedDocs.forEach(name => console.log(`   - ${name}`));
  }
  
  if (repairedDocs.length === 0) {
    console.log(`\n❌ No documents successfully repaired`);
    return;
  }
  
  // Update catalog entries
  console.log(`\n📝 Updating catalog with repaired concepts...`);
  
  for (const doc of repairedDocs) {
    const source = doc.metadata.source;
    const hash = doc.metadata.hash;
    
    try {
      // Delete old entry
      await catalogTable.delete(`hash = "${hash}"`);
      
      // Add updated entry with all original fields
      const originalEntry = needsRepair.find(item => item.entry.source === source)?.entry;
      if (originalEntry) {
        await catalogTable.add([{
          ...originalEntry,
          concepts: JSON.stringify(doc.metadata.concepts)
        }]);
      }
    } catch (e: any) {
      console.log(`   ⚠️  Failed to update ${source.split('/').pop()}: ${e.message}`);
    }
  }
  
  console.log(`  ✅ Catalog updated\n`);
  
  // Re-enrich chunks for repaired documents
  console.log(`🔄 Re-enriching chunks for repaired documents...`);
  
  const matcher = new ConceptChunkMatcher();
  let chunksUpdated = 0;
  
  for (const doc of repairedDocs) {
    const source = doc.metadata.source;
    const concepts = doc.metadata.concepts;
    
    // Get chunks for this document
    const docChunks = await chunksTable
      .query()
      .where(`source = "${source}"`)
      .limit(10000)
      .toArray();
    
    // Delete old chunks
    await chunksTable.delete(`source = "${source}"`);
    
    // Re-add with enriched concepts
    const enrichedChunks = docChunks.map((chunk: any) => {
      const matched = matcher.matchConceptsToChunk(chunk.text || '', concepts);
      
      return {
        ...chunk,
        concepts: JSON.stringify(matched.concepts),
        concept_categories: JSON.stringify(matched.categories),
        concept_density: matched.concept_density
      };
    });
    
    await chunksTable.add(enrichedChunks);
    chunksUpdated += enrichedChunks.length;
  }
  
  console.log(`  ✅ Re-enriched ${chunksUpdated} chunks\n`);
  
  // Rebuild concept index
  console.log(`🧠 Rebuilding concept index...`);
  
  // Load ALL catalog records
  const allCatalogDocs = (await catalogTable.query().limit(100000).toArray())
    .filter((r: any) => r.concepts)
    .map((r: any) => new Document({
      pageContent: r.text || '',
      metadata: {
        source: r.source,
        hash: r.hash,
        concepts: typeof r.concepts === 'string' ? JSON.parse(r.concepts) : r.concepts
      }
    }));
  
  // Load ALL chunks
  const allChunks = (await chunksTable.query().limit(1000000).toArray())
    .map((c: any) => new Document({
      pageContent: c.text || '',
      metadata: {
        source: c.source,
        hash: c.hash,
        concepts: c.concepts ? JSON.parse(c.concepts) : [],
        concept_categories: c.concept_categories ? JSON.parse(c.concept_categories) : [],
        concept_density: c.concept_density || 0
      }
    }));
  
  const conceptBuilder = new ConceptIndexBuilder();
  const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogDocs, allChunks);
  
  // Drop and recreate
  try {
    await db.dropTable('concepts');
  } catch (e) {
    // Table might not exist
  }
  
  await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts');
  console.log(`  ✅ Concept index rebuilt\n`);
  
  console.log(`✅ Repair complete!`);
  console.log(`\n💡 Run health check to verify:`);
  console.log(`   npx tsx scripts/check_database_health.ts`);
}

main().catch(console.error);









