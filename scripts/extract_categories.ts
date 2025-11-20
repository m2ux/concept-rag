/**
 * Extract Categories Script
 * 
 * Phase 0 preparation: Extract unique categories from existing database
 * and generate mapping with statistics and hash-based IDs.
 * 
 * This script analyzes the current database to:
 * - Identify all unique categories
 * - Compute usage statistics
 * - Generate stable hash-based IDs
 * - Prepare for migration
 * 
 * Usage:
 *   npx tsx scripts/extract_categories.ts [--db-path <path>]
 * 
 * Output:
 *   .ai/planning/2025-11-19-category-search-feature/category-mapping.json
 */

import { connect } from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';
import { hashToId, generateStableId } from '../src/infrastructure/utils/hash';

interface CategoryStats {
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
  sources: Set<string>;
}

interface CategoryMapping {
  id: number;  // Hash-based stable ID
  category: string;
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
  sources: string[];
}

async function extractCategories(dbPath: string = `${process.env.HOME}/.concept_rag`) {
  console.log(`\n📊 Extracting categories from: ${dbPath}`);
  console.log('='.repeat(80));
  
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.log(`\n⚠️  Database not found at: ${dbPath}`);
    console.log('   Creating empty mapping for new installation.');
    
    const emptyMapping = {
      categories: [],
      generated_at: new Date().toISOString(),
      total_categories: 0,
      database_path: dbPath
    };
    
    const outputPath = '.ai/planning/2025-11-19-category-search-feature/category-mapping.json';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(emptyMapping, null, 2));
    
    console.log(`\n✅ Empty mapping created: ${outputPath}`);
    return emptyMapping;
  }
  
  const db = await connect(dbPath);
  
  const categorySet = new Set<string>();
  const categoryStats = new Map<string, CategoryStats>();
  
  // Extract from catalog
  console.log('\n1️⃣  Extracting from catalog table...');
  try {
    const catalogTable = await db.openTable('catalog');
    const catalogRows = await catalogTable.query().toArray();
    console.log(`   Found ${catalogRows.length} catalog entries`);
    
    for (const row of catalogRows) {
      if (row.concept_categories && row.concept_categories !== '[]') {
        try {
          const categories: string[] = JSON.parse(row.concept_categories);
          categories.forEach((cat: string) => {
            categorySet.add(cat);
            if (!categoryStats.has(cat)) {
              categoryStats.set(cat, {
                documentCount: 0,
                chunkCount: 0,
                conceptCount: 0,
                sources: new Set()
              });
            }
            const stats = categoryStats.get(cat)!;
            stats.documentCount++;
            stats.sources.add(row.source);
          });
        } catch (err) {
          console.warn(`   ⚠️  Error parsing categories for ${row.source}: ${err}`);
        }
      }
    }
    
    console.log(`   ✅ Found ${categorySet.size} unique categories in catalog`);
  } catch (err) {
    console.log(`   ⚠️  Could not read catalog table: ${err}`);
  }
  
  // Extract from chunks
  console.log('\n2️⃣  Extracting from chunks table...');
  try {
    const chunksTable = await db.openTable('chunks');
    const chunkRows = await chunksTable.query().toArray();
    console.log(`   Found ${chunkRows.length} chunk entries`);
    
    for (const row of chunkRows) {
      if (row.concept_categories && row.concept_categories !== '[]') {
        try {
          const categories: string[] = JSON.parse(row.concept_categories);
          categories.forEach((cat: string) => {
            categorySet.add(cat);
            if (categoryStats.has(cat)) {
              categoryStats.get(cat)!.chunkCount++;
            }
          });
        } catch (err) {
          // Skip malformed entries
        }
      }
    }
    
    console.log(`   ✅ Counted chunk occurrences for ${categoryStats.size} categories`);
  } catch (err) {
    console.log(`   ⚠️  Could not read chunks table: ${err}`);
  }
  
  // Extract from concepts
  console.log('\n3️⃣  Extracting from concepts table...');
  try {
    const conceptsTable = await db.openTable('concepts');
    const conceptRows = await conceptsTable.query().toArray();
    console.log(`   Found ${conceptRows.length} concept entries`);
    
    for (const row of conceptRows) {
      if (row.category && typeof row.category === 'string') {
        categorySet.add(row.category);
        if (categoryStats.has(row.category)) {
          categoryStats.get(row.category)!.conceptCount++;
        }
      }
    }
    
    console.log(`   ✅ Counted concept occurrences for ${categoryStats.size} categories`);
  } catch (err) {
    console.log(`   ⚠️  Could not read concepts table: ${err}`);
  }
  
  // Generate stable IDs using hash function
  console.log('\n4️⃣  Generating stable hash-based IDs...');
  const sortedCategories = Array.from(categorySet).sort();
  const existingIds = new Set<number>();
  const categoryMappings: CategoryMapping[] = [];
  
  let collisions = 0;
  for (const cat of sortedCategories) {
    const baseHash = hashToId(cat);
    const stableId = generateStableId(cat, existingIds);
    
    if (baseHash !== stableId) {
      collisions++;
      console.log(`   ⚠️  Collision detected for "${cat}" - using variant ID`);
    }
    
    existingIds.add(stableId);
    
    const stats = categoryStats.get(cat);
    categoryMappings.push({
      id: stableId,
      category: cat,
      documentCount: stats?.documentCount || 0,
      chunkCount: stats?.chunkCount || 0,
      conceptCount: stats?.conceptCount || 0,
      sources: Array.from(stats?.sources || [])
    });
  }
  
  console.log(`   ✅ Generated ${categoryMappings.length} stable IDs`);
  if (collisions > 0) {
    console.log(`   ⚠️  ${collisions} collisions resolved`);
  }
  
  // Create mapping object
  const mapping = {
    categories: categoryMappings,
    generated_at: new Date().toISOString(),
    total_categories: sortedCategories.length,
    database_path: dbPath,
    collision_count: collisions,
    hash_algorithm: 'FNV-1a'
  };
  
  // Save mapping
  const outputPath = '.ai/planning/2025-11-19-category-search-feature/category-mapping.json';
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  
  console.log('\n5️⃣  Category Statistics:');
  console.log(`   Total categories: ${sortedCategories.length}`);
  
  // Top 10 by document count
  const top10 = categoryMappings
    .sort((a, b) => b.documentCount - a.documentCount)
    .slice(0, 10);
  
  console.log('\n   Top 10 by document count:');
  top10.forEach((cat, idx) => {
    console.log(`   ${idx + 1}. ${cat.category}`);
    console.log(`      - Documents: ${cat.documentCount}`);
    console.log(`      - Chunks: ${cat.chunkCount}`);
    console.log(`      - Concepts: ${cat.conceptCount}`);
    console.log(`      - Hash ID: ${cat.id}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Category mapping saved: ${outputPath}`);
  console.log(`   ${sortedCategories.length} categories extracted`);
  console.log(`   ${collisions} hash collisions resolved`);
  
  return mapping;
}

// Parse command line arguments
const args = process.argv.slice(2);
let dbPath = `${process.env.HOME}/.concept_rag`;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db-path' && i + 1 < args.length) {
    dbPath = args[i + 1];
    i++;
  }
}

// Run extraction
await extractCategories(dbPath);

