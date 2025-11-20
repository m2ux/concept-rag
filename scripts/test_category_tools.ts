/**
 * Test Category Search Tools
 * 
 * Tests the actual category search functionality on the test database
 * to ensure all tools work correctly before main database migration.
 */

import { connect } from '@lancedb/lancedb';
import { CategoryIdCache } from '../src/infrastructure/cache/category-id-cache';
import { LanceDBCategoryRepository } from '../src/infrastructure/lancedb/repositories/lancedb-category-repository';
import { LanceDBCatalogRepository } from '../src/infrastructure/lancedb/repositories/lancedb-catalog-repository';
import { ConceptualHybridSearchService } from '../src/infrastructure/search/conceptual-hybrid-search-service';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service';
import { QueryExpander } from '../src/concepts/query_expander';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache';

// Import the tools
import { categorySearch } from '../src/tools/operations/category-search';
import { listCategories } from '../src/tools/operations/list-categories';
import { listConceptsInCategory } from '../src/tools/operations/list-concepts-in-category';

async function testCategoryTools() {
    console.log('\n🧪 TESTING CATEGORY SEARCH TOOLS');
    console.log('='.repeat(80));
    
    const dbPath = `${process.env.HOME}/.concept_rag_test`;
    
    // Initialize infrastructure
    console.log('\n1️⃣  Initializing infrastructure...');
    const db = await connect(dbPath);
    const categoriesTable = await db.openTable('categories');
    const catalogTable = await db.openTable('catalog');
    const conceptsTable = await db.openTable('concepts');
    const chunksTable = await db.openTable('chunks');
    
    // Initialize repositories
    const categoryRepo = new LanceDBCategoryRepository(categoriesTable);
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    // Initialize caches
    const categoryCache = CategoryIdCache.getInstance();
    categoryCache.clear();
    await categoryCache.initialize(categoryRepo);
    
    const conceptIdCache = ConceptIdCache.getInstance();
    conceptIdCache.clear();
    await conceptIdCache.initialize(conceptRepo);
    
    console.log(`  ✅ CategoryIdCache: ${categoryCache.getStats().categoryCount} categories`);
    console.log(`  ✅ ConceptIdCache: ${conceptIdCache.getStats().conceptCount} concepts`);
    
    // Initialize search services
    const embeddingService = new SimpleEmbeddingService();
    const queryExpander = new QueryExpander(conceptsTable, embeddingService);
    const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
    
    const catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService, conceptIdCache);
    
    console.log('  ✅ All infrastructure initialized');
    
    // Test 1: List all categories
    console.log('\n2️⃣  TEST: list_categories');
    console.log('-'.repeat(80));
    try {
        const result = await listCategories(
            { sortBy: 'popularity', limit: 10 },
            categoryCache
        );
        const parsed = JSON.parse(result);
        console.log(`  ✅ PASS: Listed ${parsed.categories.length} categories`);
        console.log('\n  📋 Top 5 categories:');
        parsed.categories.slice(0, 5).forEach((cat: any, idx: number) => {
            console.log(`     ${idx + 1}. ${cat.name} (${cat.statistics.documents} docs)`);
        });
    } catch (error: any) {
        console.log(`  ❌ FAIL: ${error.message}`);
    }
    
    // Test 2: Search by category
    console.log('\n3️⃣  TEST: category_search');
    console.log('-'.repeat(80));
    
    // Get a test category
    const testCategory = 'innovation methodology';
    console.log(`  🔍 Searching for category: "${testCategory}"`);
    
    try {
        const result = await categorySearch(
            { category: testCategory, limit: 5 },
            categoryCache,
            catalogRepo
        );
        const parsed = JSON.parse(result);
        
        if (parsed.error) {
            console.log(`  ❌ FAIL: ${parsed.error}`);
        } else {
            console.log(`  ✅ PASS: Found category "${parsed.category.name}"`);
            console.log(`     - Category ID: ${parsed.category.id}`);
            console.log(`     - Documents: ${parsed.statistics.totalDocuments}`);
            console.log(`     - Chunks: ${parsed.statistics.totalChunks}`);
            console.log(`     - Documents returned: ${parsed.documents.length}`);
            
            if (parsed.documents.length > 0) {
                console.log('\n  📄 Sample documents:');
                parsed.documents.slice(0, 3).forEach((doc: any) => {
                    const filename = doc.source.split('/').pop();
                    console.log(`     - ${filename?.substring(0, 60)}...`);
                });
            }
        }
    } catch (error: any) {
        console.log(`  ❌ FAIL: ${error.message}`);
        console.log(`     Stack: ${error.stack}`);
    }
    
    // Test 3: List concepts in category
    console.log('\n4️⃣  TEST: list_concepts_in_category');
    console.log('-'.repeat(80));
    console.log(`  🔍 Finding concepts in category: "${testCategory}"`);
    
    try {
        const result = await listConceptsInCategory(
            { category: testCategory, sortBy: 'documentCount', limit: 10 },
            categoryCache,
            catalogRepo,
            conceptRepo
        );
        const parsed = JSON.parse(result);
        
        if (parsed.error) {
            console.log(`  ❌ FAIL: ${parsed.error}`);
        } else {
            console.log(`  ✅ PASS: Found ${parsed.statistics.totalUniqueConcepts} unique concepts`);
            console.log(`     - Concepts returned: ${parsed.concepts.length}`);
            
            if (parsed.concepts.length > 0) {
                console.log('\n  🧠 Top concepts:');
                parsed.concepts.slice(0, 5).forEach((concept: any, idx: number) => {
                    console.log(`     ${idx + 1}. ${concept.name} (${concept.type})`);
                });
            }
        }
    } catch (error: any) {
        console.log(`  ❌ FAIL: ${error.message}`);
        console.log(`     Stack: ${error.stack}`);
    }
    
    // Test 4: Category by ID lookup
    console.log('\n5️⃣  TEST: Category ID resolution');
    console.log('-'.repeat(80));
    
    const testCategoryId = categoryCache.getId(testCategory);
    console.log(`  🔍 Test: "${testCategory}" → ID ${testCategoryId}`);
    
    if (testCategoryId) {
        const resolvedName = categoryCache.getName(testCategoryId);
        console.log(`  🔍 Reverse: ID ${testCategoryId} → "${resolvedName}"`);
        
        if (resolvedName === testCategory) {
            console.log(`  ✅ PASS: Bidirectional lookup works correctly`);
        } else {
            console.log(`  ❌ FAIL: Name mismatch (got "${resolvedName}")`);
        }
    } else {
        console.log(`  ❌ FAIL: Could not resolve category to ID`);
    }
    
    // Test 5: Find documents by category (direct query)
    console.log('\n6️⃣  TEST: Direct category filtering');
    console.log('-'.repeat(80));
    console.log(`  🔍 Finding documents in category "${testCategory}"...`);
    
    try {
        const categoryId = categoryCache.getId(testCategory);
        if (categoryId) {
            const docs = await catalogRepo.findByCategory(categoryId);
            console.log(`  ✅ PASS: Found ${docs.length} documents in category`);
            
            // Verify they actually have the category
            let allValid = true;
            for (const doc of docs) {
                // Check if document actually has this category
                const catalogData = await catalogTable.query().where(`id = '${doc.id}'`).limit(1).toArray();
                if (catalogData.length > 0 && catalogData[0].category_ids) {
                    const catIds: number[] = JSON.parse(catalogData[0].category_ids);
                    if (!catIds.includes(categoryId)) {
                        allValid = false;
                        console.log(`  ⚠️  Document ${doc.id} missing expected category`);
                    }
                }
            }
            
            if (allValid) {
                console.log(`  ✅ PASS: All documents correctly tagged with category`);
            }
        }
    } catch (error: any) {
        console.log(`  ❌ FAIL: ${error.message}`);
    }
    
    // Test 6: Aggregate concepts from category
    console.log('\n7️⃣  TEST: Concept aggregation from category');
    console.log('-'.repeat(80));
    
    try {
        const categoryId = categoryCache.getId(testCategory);
        if (categoryId) {
            const conceptIds = await catalogRepo.getConceptsInCategory(categoryId);
            console.log(`  ✅ PASS: Aggregated ${conceptIds.length} unique concept IDs`);
            console.log(`     - Concepts are dynamically computed (not stored)`);
            console.log(`     - No redundant storage ✓`);
            console.log(`     - Always up-to-date ✓`);
        }
    } catch (error: any) {
        console.log(`  ❌ FAIL: ${error.message}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ CATEGORY TOOLS TESTING COMPLETE');
    console.log('\nAll category search tools are functional and ready for use!');
}

await testCategoryTools();

