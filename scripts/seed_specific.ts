#!/usr/bin/env tsx
/**
 * Seed specific documents (by hash prefix or filename pattern)
 * 
 * Schema v7 compatible: Uses catalog_id for chunk lookups, concept_ids/concept_names
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

import * as lancedb from '@lancedb/lancedb';
import { Document } from "@langchain/core/documents";
import { ConceptExtractor } from '../src/concepts/concept_extractor.js';
import { ConceptChunkMatcher } from '../src/concepts/concept_chunk_matcher.js';
import { ConceptIndexBuilder } from '../src/concepts/concept_index.js';
import { hashToId } from '../src/infrastructure/utils/hash.js';

interface TargetDocument {
  entry: any;
  reason: string;
}

/**
 * Parse array field from LanceDB (handles native arrays, Arrow Vectors, JSON strings)
 */
function parseArrayField<T>(value: any): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && 'toArray' in value) {
    return Array.from(value.toArray());
  }
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
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
  console.log(`📂 Database: ${dbPath}`);
  
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
  console.log(`  ✅ Loaded ${allCatalog.length} entries`);
  
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
  
  console.log(`  ✅ Found ${targets.length} matching documents`);
  
  if (targets.length === 0) {
    console.log('❌ No matching documents found');
    return;
  }
  
  console.log(`🔄 Starting seeding ${targets.length} document(s)...`);
  
  const extractor = new ConceptExtractor(apiKey);
  await extractor.checkRateLimits();
  
  const seededDocs: Document[] = [];
  const failedDocs: string[] = [];
  
  for (let i = 0; i < targets.length; i++) {
    const { entry, reason } = targets[i];
    const filename = entry.source.split('/').pop();
    const catalogId = typeof entry.id === 'number' ? entry.id : parseInt(entry.id, 10);
    
    console.log(`[${i + 1}/${targets.length}] 🔧 Seeding: ${filename}`);
    console.log(`   Previous: ${reason}`);
    
    try {
      // Load chunks for this document (v7: use catalog_id instead of source)
      const docChunks = await chunksTable
        .query()
        .where(`catalog_id = ${catalogId}`)
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
          catalogId: catalogId,
          hash: entry.hash,
          concepts: concepts
        }
      }));
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      failedDocs.push(filename);
    }
  }
  
  console.log(`📊 Seeding Summary:`);
  console.log(`   - Documents processed: ${targets.length}`);
  console.log(`   - Successfully seeded: ${seededDocs.length}`);
  console.log(`   - Failed: ${failedDocs.length}`);
  
  if (failedDocs.length > 0) {
    console.log(`⚠️  Failed documents:`);
    failedDocs.forEach(name => console.log(`   - ${name}`));
  }
  
  if (seededDocs.length === 0) {
    console.log(`❌ No documents successfully seeded`);
    return;
  }
  
  // Update catalog (v7: uses concept_ids/concept_names)
  console.log(`📝 Updating catalog with seeded concepts...`);
  
  for (const doc of seededDocs) {
    const source = doc.metadata.source;
    const catalogId = doc.metadata.catalogId;
    const concepts = doc.metadata.concepts;
    
    try {
      // Find original entry to preserve other fields
      const originalEntry = targets.find(item => item.entry.source === source)?.entry;
      
      if (!originalEntry) continue;
      
      // LanceDB doesn't have update API - use delete + add pattern
      // First, get the full record to preserve all fields
      const existingRecords = await catalogTable
        .query()
        .where(`id = ${catalogId}`)
        .limit(1)
        .toArray();
      
      if (existingRecords.length === 0) {
        console.log(`   ⚠️  Record not found: ${source.split('/').pop()}`);
        continue;
      }
      
      const existingRecord = existingRecords[0];
      
      // v7: Store concept_ids and concept_names (native arrays)
      // Handle concept objects with { name, summary } or plain strings
      const rawConcepts = concepts.primary_concepts || concepts.concepts || [];
      const primaryConcepts = rawConcepts
        .map((c: any) => typeof c === 'string' ? c : c?.name)
        .filter((name: any) => typeof name === 'string' && name.trim());
      const conceptIds = primaryConcepts.map((name: string) => hashToId(name.toLowerCase().trim()));
      const conceptNames = primaryConcepts.map((name: string) => name.toLowerCase().trim());
      const categoryNames = (concepts.categories || [])
        .filter((name: any) => typeof name === 'string' && name.trim());
      
      // Convert existing Arrow Vectors to native arrays before spreading
      const vector = Array.isArray(existingRecord.vector) ? existingRecord.vector :
                     (existingRecord.vector?.toArray ? Array.from(existingRecord.vector.toArray()) : []);
      const existingCategoryIds = parseArrayField<number>(existingRecord.category_ids);
      
      // Update the concepts fields while preserving everything else
      const updatedRecord = {
        id: existingRecord.id,
        source: existingRecord.source,
        title: existingRecord.title,
        summary: existingRecord.summary || '',
        hash: existingRecord.hash,
        vector: vector,
        concept_ids: conceptIds.length > 0 ? conceptIds : [0],
        concept_names: conceptNames.length > 0 ? conceptNames : [''],
        category_ids: existingCategoryIds.length > 0 ? existingCategoryIds : [0],
        category_names: categoryNames.length > 0 ? categoryNames : [''],
        origin_hash: existingRecord.origin_hash || '',
        author: existingRecord.author || '',
        year: existingRecord.year || 0,
        publisher: existingRecord.publisher || '',
        isbn: existingRecord.isbn || ''
      };
      
      // Delete old record and add updated one
      await catalogTable.delete(`id = ${catalogId}`);
      await catalogTable.add([updatedRecord]);
      
      // Verify the update persisted
      const verifyRecord = await catalogTable.query().where(`id = ${catalogId}`).limit(1).toArray();
      const verifyNames = parseArrayField<string>(verifyRecord[0]?.concept_names);
      const validCount = verifyNames.filter(n => n && n !== '').length;
      
      console.log(`   ✅ Updated: ${source.split('/').pop()} (${validCount} concepts saved)`);
    } catch (error) {
      console.error(`   ❌ Failed to update ${source}: ${error}`);
    }
  }
  
  // Enrich chunks (v7: use catalog_id, concept_ids, concept_names)
  console.log(`🔄 Enriching chunks for seeded documents...`);
  
  const matcher = new ConceptChunkMatcher();
  let totalUpdated = 0;
  
  for (const doc of seededDocs) {
    const catalogId = doc.metadata.catalogId;
    const catalogTitle = doc.metadata.source.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
    const documentConcepts = doc.metadata.concepts;
    
    console.log(`   📦 Processing chunks for: ${catalogTitle}`);
    
    // Load chunks (v7: use catalog_id instead of source)
    const chunks = await chunksTable
      .query()
      .where(`catalog_id = ${catalogId}`)
      .limit(10000)
      .toArray();
    
    console.log(`      Found ${chunks.length} chunks`);
    
    // Enrich all chunks in memory (fast)
    console.log(`      🔄 Enriching chunks...`);
    const updatedChunks = chunks.map((chunk: any) => {
      const matched = matcher.matchConceptsToChunk(
        chunk.text || '',
        documentConcepts
      );
      
      // v7: Use concept_ids and concept_names (native arrays)
      const conceptIds = matched.concepts.map((name: string) => hashToId(name.toLowerCase().trim()));
      const conceptNames = matched.concepts.map((name: string) => name.toLowerCase().trim());
      
      // Convert vector if needed
      const vector = Array.isArray(chunk.vector) ? chunk.vector :
                     (chunk.vector?.toArray ? Array.from(chunk.vector.toArray()) : []);
      
      return {
        id: chunk.id,
        catalog_id: catalogId,
        catalog_title: catalogTitle,
        text: chunk.text || '',
        hash: chunk.hash || '',
        vector: vector,
        concept_ids: conceptIds.length > 0 ? conceptIds : [0],
        concept_names: conceptNames.length > 0 ? conceptNames : [''],
        concept_density: matched.concept_density,
        page_number: chunk.page_number || 0
      };
    });
    
    console.log(`      🗑️  Deleting old chunks...`);
    try {
      // Delete ALL chunks for this document at once (v7: use catalog_id)
      await chunksTable.delete(`catalog_id = ${catalogId}`);
      
      console.log(`      ➕  Adding updated chunks...`);
      // Add all updated chunks back in batches of 500 (LanceDB limit)
      const batchSize = 500;
      for (let i = 0; i < updatedChunks.length; i += batchSize) {
        const batch = updatedChunks.slice(i, i + batchSize);
        await chunksTable.add(batch);
        
        if ((i + batchSize) % 1000 === 0 || i + batchSize >= updatedChunks.length) {
          console.log(`      📊 Added ${Math.min(i + batchSize, updatedChunks.length)}/${updatedChunks.length} chunks`);
        }
      }
      
      totalUpdated += updatedChunks.length;
      console.log(`      ✅ Updated ${updatedChunks.length} chunks`);
    } catch (error: any) {
      console.warn(`      ⚠️  Error updating chunks: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Total chunks updated: ${totalUpdated}`);
  
  // Rebuild concept index (v7: uses concept_names arrays)
  console.log(`🧠 Rebuilding concept index...`);
  
  const allCatalogRows = await catalogTable.query().limit(100000).toArray();
  const allChunks = await chunksTable.query().limit(1000000).toArray();
  
  // Build source → catalog ID map from ACTUAL catalog table IDs (foreign key constraint)
  const sourceToCatalogId = new Map<string, number>();
  for (const r of allCatalogRows) {
    if (r.source && r.id !== undefined) {
      sourceToCatalogId.set(r.source, typeof r.id === 'number' ? r.id : parseInt(r.id, 10));
    }
  }
  console.log(`   ✅ Built source→catalogId map with ${sourceToCatalogId.size} entries`);
  
  // Transform catalog rows into Document objects for concept builder
  // v7: Use concept_names array instead of concepts JSON
  const allCatalogFresh = allCatalogRows
    .filter((row: any) => {
      const conceptNames = parseArrayField<string>(row.concept_names);
      const validConcepts = conceptNames.filter((n: any) => n && n !== '' && n !== 0);
      return row.source && validConcepts.length > 0;
    })
    .map((row: any) => {
      const conceptNames = parseArrayField<string>(row.concept_names)
        .filter((n: any) => n && n !== '' && n !== 0);
      const categoryNames = parseArrayField<string>(row.category_names)
        .filter((n: any) => n && n !== '' && n !== 0);
      
      // Build ConceptMetadata structure expected by ConceptIndexBuilder
      const concepts = {
        primary_concepts: conceptNames,
        categories: categoryNames,
        related_concepts: []
      };
      
      return new Document({
        pageContent: row.summary || '',
        metadata: {
          source: row.source,
          hash: row.hash,
          concepts: concepts
        }
      });
    });
  
  console.log(`   ✅ Found ${allCatalogFresh.length} catalog entries with concepts`);
  
  const conceptBuilder = new ConceptIndexBuilder();
  // Pass actual catalog IDs from the database (foreign key constraint)
  const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogFresh, sourceToCatalogId);
  
  // Build chunk_ids for each concept (reverse mapping from chunks → concepts)
  console.log(`   🔗 Building concept → chunk_ids mapping...`);
  const conceptToChunkIds = new Map<number, number[]>();
  
  for (const chunk of allChunks) {
    const chunkId = chunk.id;
    const conceptIds = parseArrayField<number>(chunk.concept_ids)
      .filter((id: any) => id && id !== 0);
    
    for (const conceptId of conceptIds) {
      if (!conceptToChunkIds.has(conceptId)) {
        conceptToChunkIds.set(conceptId, []);
      }
      conceptToChunkIds.get(conceptId)!.push(chunkId);
    }
  }
  
  // Update concept records with chunk_ids
  for (const concept of conceptRecords) {
    const conceptId = hashToId(concept.name.toLowerCase().trim());
    const chunkIds = conceptToChunkIds.get(conceptId) || [];
    concept.chunk_ids = chunkIds;
  }
  
  console.log(`   ✅ Built ${conceptRecords.length} concept records`);
  
  // Drop and recreate concepts table
  try {
    await db.dropTable('concepts');
    console.log(`   🗑️  Dropped old concepts table`);
  } catch (e) {
    // Table might not exist
  }
  
  await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts');
  console.log(`   ✅ Created new concepts table with ${conceptRecords.length} records`);
  
  console.log(`✅ Seeding complete!`);
  console.log(`📊 Final Summary:`);
  console.log(`   - Documents seeded: ${seededDocs.length}`);
  console.log(`   - Chunks updated: ${totalUpdated}`);
  console.log(`   - Concepts in index: ${conceptRecords.length}`);
}

main().catch(console.error);

