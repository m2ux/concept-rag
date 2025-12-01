/**
 * Populate Category Statistics
 * 
 * Updates chunk_count and concept_count for all categories in the database.
 * These statistics were not computed during initial database creation.
 * 
 * Usage: npx tsx scripts/populate_category_stats.ts
 */

import { connect, Table } from '@lancedb/lancedb';

async function populateCategoryStats() {
  const dbPath = process.env.CONCEPT_RAG_DB_PATH || `${process.env.HOME}/.concept_rag`;
  console.log(`\n📊 Populating Category Statistics`);
  console.log(`Database: ${dbPath}`);
  console.log('='.repeat(60));
  
  const db = await connect(dbPath);
  const categoriesTable = await db.openTable('categories');
  const catalogTable = await db.openTable('catalog');
  const chunksTable = await db.openTable('chunks');
  
  // Load all categories
  const categories = await categoriesTable.query().limit(10000).toArray();
  console.log(`\nFound ${categories.length} categories to process`);
  
  // Load all catalog entries (documents)
  console.log('\nLoading catalog entries...');
  const catalogEntries = await catalogTable.query().limit(10000).toArray();
  console.log(`Loaded ${catalogEntries.length} catalog entries`);
  
  // Load all chunks
  console.log('\nLoading chunks...');
  const chunks = await chunksTable.query().limit(1000000).toArray();
  console.log(`Loaded ${chunks.length} chunks`);
  
  // Build lookup maps
  console.log('\nBuilding lookup maps...');
  
  // Map: categoryId -> { docIds, conceptIds, chunkCount }
  const categoryStats = new Map<number, {
    docIds: Set<string>;
    conceptIds: Set<number>;
    chunkCount: number;
  }>();
  
  // Initialize stats for all categories
  for (const cat of categories) {
    categoryStats.set(cat.id, {
      docIds: new Set(),
      conceptIds: new Set(),
      chunkCount: 0
    });
  }
  
  // Process catalog entries to get documents and concepts per category
  for (const doc of catalogEntries) {
    if (!doc.category_ids) continue;
    
    try {
      const categoryIds: number[] = JSON.parse(doc.category_ids);
      
      // Get concept IDs from this document
      let docConceptIds: number[] = [];
      if (doc.concept_ids) {
        docConceptIds = JSON.parse(doc.concept_ids);
      } else if (doc.concepts) {
        // Old format: hash concept names
        const concepts = JSON.parse(doc.concepts);
        const names = concepts.primary_concepts || [];
        docConceptIds = names.map((name: string) => hashConceptName(name));
      }
      
      // Update stats for each category this document belongs to
      for (const catId of categoryIds) {
        const stats = categoryStats.get(catId);
        if (stats) {
          stats.docIds.add(doc.id);
          docConceptIds.forEach(id => stats.conceptIds.add(id));
        }
      }
    } catch {
      // Skip malformed entries
    }
  }
  
  // Process chunks to get chunk counts per category
  // First, build a map of source -> categoryIds from catalog
  const sourceToCategoryIds = new Map<string, number[]>();
  for (const doc of catalogEntries) {
    if (doc.source && doc.category_ids) {
      try {
        sourceToCategoryIds.set(doc.source, JSON.parse(doc.category_ids));
      } catch {
        // Skip
      }
    }
  }
  
  // Count chunks per category
  for (const chunk of chunks) {
    const categoryIds = sourceToCategoryIds.get(chunk.source);
    if (categoryIds) {
      for (const catId of categoryIds) {
        const stats = categoryStats.get(catId);
        if (stats) {
          stats.chunkCount++;
        }
      }
    }
  }
  
  // Update categories table
  console.log('\nUpdating categories table...');
  let updated = 0;
  let unchanged = 0;
  
  for (const cat of categories) {
    const stats = categoryStats.get(cat.id);
    if (!stats) continue;
    
    const newChunkCount = stats.chunkCount;
    const newConceptCount = stats.conceptIds.size;
    
    // Only update if values changed
    if (cat.chunk_count !== newChunkCount || cat.concept_count !== newConceptCount) {
      // Update the category row
      await categoriesTable.update({
        where: `id = ${cat.id}`,
        values: {
          chunk_count: newChunkCount,
          concept_count: newConceptCount
        }
      });
      updated++;
      
      if (updated <= 10) {
        console.log(`  ✓ ${cat.category}: chunks ${cat.chunk_count} → ${newChunkCount}, concepts ${cat.concept_count} → ${newConceptCount}`);
      }
    } else {
      unchanged++;
    }
  }
  
  if (updated > 10) {
    console.log(`  ... and ${updated - 10} more categories updated`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration complete!`);
  console.log(`   Updated: ${updated} categories`);
  console.log(`   Unchanged: ${unchanged} categories`);
}

/**
 * Hash a concept name to generate an integer ID (FNV-1a)
 */
function hashConceptName(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

populateCategoryStats().catch(console.error);




