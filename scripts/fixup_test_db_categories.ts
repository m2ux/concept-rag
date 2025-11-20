/**
 * Fixup Test Database Categories
 * 
 * Adds categories table and category_ids to existing test database
 * by extracting categories from the concepts field.
 */

import { connect } from '@lancedb/lancedb';
import { hashToId, generateStableId } from '../src/infrastructure/utils/hash';

async function fixupTestDatabase() {
  console.log('\n🔧 FIXING UP TEST DATABASE');
  console.log('='.repeat(80));
  
  const dbPath = `${process.env.HOME}/.concept_rag_test`;
  const db = await connect(dbPath);
  
  // Step 1: Extract categories from catalog
  console.log('\n1️⃣  Extracting categories from catalog...');
  const catalogTable = await db.openTable('catalog');
  const catalogRows = await catalogTable.query().toArray();
  
  const categorySet = new Set<string>();
  const categoryStats = new Map<string, {
    documentCount: number;
    sources: Set<string>;
  }>();
  
  for (const row of catalogRows) {
    if (row.concepts) {
      try {
        const concepts = JSON.parse(row.concepts);
        const categories = concepts.categories || [];
        
        for (const cat of categories) {
          categorySet.add(cat);
          if (!categoryStats.has(cat)) {
            categoryStats.set(cat, {
              documentCount: 0,
              sources: new Set()
            });
          }
          const stats = categoryStats.get(cat)!;
          stats.documentCount++;
          stats.sources.add(row.source);
        }
      } catch (e) {
        console.warn(`  ⚠️  Error parsing concepts for ${row.source}`);
      }
    }
  }
  
  console.log(`  ✅ Found ${categorySet.size} unique categories`);
  
  if (categorySet.size === 0) {
    console.log('  ⚠️  No categories found, cannot create categories table');
    return;
  }
  
  // Step 2: Generate stable hash-based IDs and build category map
  console.log('\n2️⃣  Generating hash-based category IDs...');
  const sortedCategories = Array.from(categorySet).sort();
  const existingIds = new Set<number>();
  const categoryIdMap = new Map<string, number>();
  const categoryRecords = [];
  
  for (const category of sortedCategories) {
    const categoryId = generateStableId(category, existingIds);
    existingIds.add(categoryId);
    categoryIdMap.set(category, categoryId);
  }
  
  console.log(`  ✅ Generated ${categoryIdMap.size} stable IDs`);
  
  // Step 3: Create simple placeholder embeddings for categories (for testing)
  console.log('\n3️⃣  Creating category embeddings...');
  
  function createSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for testing (384 dimensions)
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 384] += charCode / 1000;
    }
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  for (const category of sortedCategories) {
    const categoryId = categoryIdMap.get(category)!;
    const description = `Concepts and practices related to ${category}`;
    const embeddingText = `${category}: ${description}`;
    
    const vector = createSimpleEmbedding(embeddingText);
    
    const stats = categoryStats.get(category)!;
    
    categoryRecords.push({
      id: categoryId,
      category: category,
      description: description,
      parent_category_id: 0, // Use 0 as null placeholder (LanceDB can't infer type from all nulls)
      aliases: JSON.stringify([]),
      related_categories: JSON.stringify([]),
      document_count: stats.documentCount,
      chunk_count: 0, // Will be calculated from chunks
      concept_count: 0, // Will be calculated from concepts
      vector: vector
    });
  }
  
  console.log(`  ✅ Created ${categoryRecords.length} category records`);
  
  // Step 4: Create categories table
  console.log('\n4️⃣  Creating categories table...');
  try {
    await db.dropTable('categories');
  } catch (e) {
    // Table doesn't exist
  }
  
  const categoriesTable = await db.createTable('categories', categoryRecords, { mode: 'overwrite' });
  console.log(`  ✅ Categories table created with ${categoryRecords.length} categories`);
  
  // Step 5: Update catalog entries with concept_categories and category_ids
  console.log('\n5️⃣  Updating catalog entries...');
  
  // Drop and recreate catalog with new fields
  const updatedCatalogRows = catalogRows.map(row => {
    const updated: any = {
      id: row.id,
      text: row.text,
      source: row.source,
      hash: row.hash,
      loc: row.loc,
      vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector), // Ensure vector is array
      concepts: row.concepts
    };
    
    if (row.concepts) {
      try {
        const concepts = JSON.parse(row.concepts);
        const categories = concepts.categories || [];
        
        if (categories.length > 0) {
          updated.concept_categories = JSON.stringify(categories);
          
          const categoryIds = categories.map((cat: string) => 
            categoryIdMap.get(cat) || hashToId(cat)
          );
          updated.category_ids = JSON.stringify(categoryIds);
        }
      } catch (e) {
        // Skip malformed entries
      }
    }
    
    return updated;
  });
  
  await db.dropTable('catalog');
  await db.createTable('catalog', updatedCatalogRows, { mode: 'overwrite' });
  
  console.log(`  ✅ Updated ${catalogRows.length} catalog entries`);
  
  // Step 6: Calculate chunk_count and concept_count for categories
  console.log('\n6️⃣  Calculating category statistics...');
  
  const chunksTable = await db.openTable('chunks');
  const chunkRows = await chunksTable.query().toArray();
  
  const categorychunkCount = new Map<number, number>();
  for (const chunk of chunkRows) {
    if (chunk.category_ids) {
      try {
        const categoryIds: number[] = JSON.parse(chunk.category_ids);
        for (const catId of categoryIds) {
          categorychunkCount.set(catId, (categorychunkCount.get(catId) || 0) + 1);
        }
      } catch (e) {
        // Skip
      }
    }
  }
  
  // Update chunk_count in categories
  const finalCategoryRecords = categoryRecords.map(cat => {
    return {
      ...cat,
      chunk_count: categorychunkCount.get(cat.id) || 0
    };
  });
  
  await db.dropTable('categories');
  await db.createTable('categories', finalCategoryRecords, { mode: 'overwrite' });
  
  console.log(`  ✅ Updated category statistics`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST DATABASE FIXUP COMPLETE');
  console.log(`   - Categories table: ${categoryRecords.length} categories`);
  console.log(`   - Catalog entries: ${catalogRows.length} updated`);
  console.log(`   - Ready for validation`);
}

await fixupTestDatabase();

