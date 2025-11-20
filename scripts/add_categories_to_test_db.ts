/**
 * Add Categories to Existing Test Database
 * 
 * Updates existing test database to add:
 * 1. Categories table with hash-based IDs
 * 2. category_ids field to catalog entries
 * 3. category_ids field to chunks (inherited from catalog)
 * 
 * This avoids re-running the full ingestion which takes 20+ minutes.
 */

import { connect } from '@lancedb/lancedb';
import { hashToId, generateStableId } from '../src/infrastructure/utils/hash';
import * as path from 'path';

// Simple embedding function (same as in hybrid_fast_seed.ts)
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function createSimpleEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    for (let i = 0; i < Math.min(words.length, 100); i++) {
        const word = words[i];
        const hash = simpleHash(word);
        embedding[hash % 384] += 1;
    }
    
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
        const charCode = chars.charCodeAt(i);
        embedding[charCode % 384] += 0.1;
    }
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
}

async function addCategoriesToTestDatabase() {
    console.log('\n🔧 ADDING CATEGORIES TO DATABASE');
    console.log('='.repeat(80));
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    let dbPath = `${process.env.HOME}/.concept_rag_test`;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--db-path' && i + 1 < args.length) {
            dbPath = args[i + 1];
            i++;
        }
    }
    
    console.log(`Database: ${dbPath}`);
    console.log('='.repeat(80));
    
    const db = await connect(dbPath);
    
    // Step 1: Extract categories from catalog
    console.log('\n1️⃣  Extracting categories from catalog...');
    const catalogTable = await db.openTable('catalog');
    const totalCatalog = await catalogTable.countRows();
    console.log(`  📊 Total catalog entries: ${totalCatalog}`);
    const catalogRows = await catalogTable.query().limit(Math.max(totalCatalog, 10000)).toArray();
    
    const categorySet = new Set<string>();
    const categoryStats = new Map<string, {
        documentCount: number;
        sources: Set<string>;
    }>();
    
    // Track which catalog entry has which categories
    const catalogCategoryMap = new Map<string, string[]>();
    
    for (const row of catalogRows) {
        if (row.concepts) {
            try {
                const concepts = JSON.parse(row.concepts);
                const categories = concepts.categories || [];
                catalogCategoryMap.set(row.id, categories);
                
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
                console.warn(`  ⚠️  Error parsing concepts for ${path.basename(row.source)}`);
            }
        }
    }
    
    console.log(`  ✅ Found ${categorySet.size} unique categories`);
    
    if (categorySet.size === 0) {
        console.log('  ⚠️  No categories found, cannot proceed');
        return;
    }
    
    // Step 2: Generate stable hash-based IDs
    console.log('\n2️⃣  Generating hash-based category IDs...');
    const sortedCategories = Array.from(categorySet).sort();
    const existingIds = new Set<number>();
    const categoryIdMap = new Map<string, number>();
    const categoryRecords = [];
    
    for (const category of sortedCategories) {
        const categoryId = generateStableId(category, existingIds);
        existingIds.add(categoryId);
        categoryIdMap.set(category, categoryId);
        
        const description = `Concepts and practices related to ${category}`;
        const embeddingText = `${category}: ${description}`;
        const vector = createSimpleEmbedding(embeddingText);
        
        const stats = categoryStats.get(category)!;
        
        categoryRecords.push({
            id: categoryId,
            category: category,
            description: description,
            parent_category_id: 0, // Use 0 as null placeholder
            aliases: JSON.stringify([]),
            related_categories: JSON.stringify([]),
            document_count: stats.documentCount,
            chunk_count: 0, // Will be calculated from chunks
            concept_count: 0, // Will be calculated from concepts
            vector: vector
        });
    }
    
    console.log(`  ✅ Generated ${categoryRecords.length} category records with hash IDs`);
    
    // Step 3: Create categories table
    console.log('\n3️⃣  Creating categories table...');
    try {
        await db.dropTable('categories');
        console.log('  🗑️  Dropped existing categories table');
    } catch (e) {
        // Table doesn't exist
    }
    
    await db.createTable('categories', categoryRecords, { mode: 'overwrite' });
    console.log(`  ✅ Categories table created with ${categoryRecords.length} categories`);
    
    // Step 4: Update catalog with category_ids
    console.log('\n4️⃣  Updating catalog entries with category_ids...');
    const updatedCatalogRows = catalogRows.map(row => {
        const categories = catalogCategoryMap.get(row.id) || [];
        const categoryIds = categories.map(cat => categoryIdMap.get(cat) || hashToId(cat));
        
        return {
            id: row.id,
            text: row.text,
            source: row.source,
            hash: row.hash,
            loc: row.loc,
            vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector),
            concepts: row.concepts,
            concept_categories: categories.length > 0 ? JSON.stringify(categories) : JSON.stringify([]),
            category_ids: categoryIds.length > 0 ? JSON.stringify(categoryIds) : JSON.stringify([])
        };
    });
    
    await db.dropTable('catalog');
    await db.createTable('catalog', updatedCatalogRows, { mode: 'overwrite' });
    console.log(`  ✅ Updated ${catalogRows.length} catalog entries with category_ids`);
    
    // Step 5: Update chunks with category_ids (inherited from parent catalog)
    console.log('\n5️⃣  Updating chunks with category_ids...');
    const chunksTable = await db.openTable('chunks');
    const totalChunks = await chunksTable.countRows();
    console.log(`  📊 Total chunks in table: ${totalChunks}`);
    
    if (totalChunks > 100000) {
        console.log(`  ⚠️  Large table (${totalChunks} chunks) - this may take a minute...`);
    }
    
    const chunkRows = await chunksTable.query().limit(Math.max(totalChunks, 100000)).toArray();
    
    // Build source -> categories map from catalog
    const sourceCategoriesMap = new Map<string, { categories: string[], categoryIds: number[] }>();
    for (const row of catalogRows) {
        const categories = catalogCategoryMap.get(row.id) || [];
        const categoryIds = categories.map(cat => categoryIdMap.get(cat) || hashToId(cat));
        sourceCategoriesMap.set(row.source, { categories, categoryIds });
    }
    
    console.log(`  🔄 Processing ${chunkRows.length} chunks...`);
    const updatedChunkRows = chunkRows.map(chunk => {
        const sourceData = sourceCategoriesMap.get(chunk.source);
        
        return {
            id: chunk.id,
            text: chunk.text,
            source: chunk.source,
            hash: chunk.hash,
            loc: chunk.loc,
            vector: Array.isArray(chunk.vector) ? chunk.vector : Array.from(chunk.vector),
            concepts: chunk.concepts || JSON.stringify([]),
            concept_categories: sourceData ? JSON.stringify(sourceData.categories) : JSON.stringify([]),
            category_ids: sourceData ? JSON.stringify(sourceData.categoryIds) : JSON.stringify([]),
            concept_density: chunk.concept_density || 0
        };
    });
    
    console.log(`  🔄 Rebuilding chunks table with ${updatedChunkRows.length} chunks...`);
    await db.dropTable('chunks');
    await db.createTable('chunks', updatedChunkRows, { mode: 'overwrite' });
    
    // Recreate index
    if (updatedChunkRows.length >= 256) {
        console.log(`  🔧 Recreating vector index...`);
        const chunksTableNew = await db.openTable('chunks');
        const numPartitions = Math.max(2, Math.floor(updatedChunkRows.length / 100));
        try {
            await chunksTableNew.createIndex("vector", {
                config: {
                    type: 'ivf_pq',
                    numPartitions: numPartitions,
                    numSubVectors: 16
                }
            });
            console.log(`  ✅ Index created`);
        } catch (e: any) {
            console.warn(`  ⚠️  Index creation failed: ${e.message}`);
        }
    }
    
    console.log(`  ✅ Updated ${updatedChunkRows.length} chunks with category_ids`);
    
    // Step 6: Update category statistics
    console.log('\n6️⃣  Calculating category statistics...');
    
    const categoryChunkCount = new Map<number, number>();
    for (const chunk of updatedChunkRows) {
        if (chunk.category_ids && chunk.category_ids !== '[]') {
            try {
                const categoryIds: number[] = JSON.parse(chunk.category_ids);
                for (const catId of categoryIds) {
                    categoryChunkCount.set(catId, (categoryChunkCount.get(catId) || 0) + 1);
                }
            } catch (e) {
                // Skip malformed data
            }
        }
    }
    
    // Update categories table with chunk counts
    const finalCategoryRecords = categoryRecords.map(cat => ({
        ...cat,
        chunk_count: categoryChunkCount.get(cat.id) || 0
    }));
    
    await db.dropTable('categories');
    await db.createTable('categories', finalCategoryRecords, { mode: 'overwrite' });
    
    console.log(`  ✅ Updated category statistics`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST DATABASE UPDATE COMPLETE');
    console.log(`   - Categories table: ${categoryRecords.length} categories`);
    console.log(`   - Catalog entries: ${catalogRows.length} updated`);
    console.log(`   - Chunks: ${updatedChunkRows.length} updated`);
    console.log(`   - Ready for validation`);
    
    // Show top categories
    const topCategories = finalCategoryRecords
        .sort((a, b) => b.document_count - a.document_count)
        .slice(0, 10);
    
    console.log('\n📊 Top 10 Categories by Document Count:');
    topCategories.forEach((cat, idx) => {
        console.log(`   ${idx + 1}. ${cat.category} (id: ${cat.id})`);
        console.log(`      - Documents: ${cat.document_count}`);
        console.log(`      - Chunks: ${cat.chunk_count}`);
    });
}

await addCategoriesToTestDatabase();

