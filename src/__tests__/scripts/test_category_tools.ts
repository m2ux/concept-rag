/**
 * Test Category Search Tools
 * 
 * Tests the actual category search functionality on the test database
 * using the ApplicationContainer for proper dependency injection.
 */

import { ApplicationContainer } from '../../application/container.js';

async function testCategoryTools() {
    console.log('\n🧪 TESTING CATEGORY SEARCH TOOLS');
    console.log('='.repeat(80));
    
    const dbPath = process.argv[2] || './db/test';
    
    // Initialize infrastructure via ApplicationContainer
    console.log('\n1️⃣  Initializing infrastructure...');
    const container = new ApplicationContainer();
    await container.initialize(dbPath);
    
    // Verify category tools are registered
    const categoryRepo = container.getCategoryRepository();
    if (!categoryRepo) {
        console.error('❌ Categories table not found. Run seeding first.');
        process.exit(1);
    }
    
    console.log('  ✅ All infrastructure initialized');
    
    // Test 1: Category Search
    console.log('\n2️⃣  Testing category_search...');
    try {
        const categorySearchTool = container.getTool('category_search');
        const result = await categorySearchTool.execute({ 
            category: 'software engineering', 
            limit: 5 
        });
        console.log('  Query: "software engineering"');
        if (result.isError) {
            console.log('  ⚠️  No results or error:', JSON.parse(result.content[0].text));
        } else {
            const data = JSON.parse(result.content[0].text);
            console.log('  ✅ Found documents:', data.statistics?.total_documents || 0);
        }
    } catch (error) {
        console.error('  ❌ Error:', error);
    }
    
    // Test 2: List Categories
    console.log('\n3️⃣  Testing list_categories...');
    try {
        const listCategoriesTool = container.getTool('list_categories');
        const result = await listCategoriesTool.execute({ limit: 10 });
        if (result.isError) {
            console.log('  ⚠️  Error:', JSON.parse(result.content[0].text));
        } else {
            const data = JSON.parse(result.content[0].text);
            const categories = Array.isArray(data) ? data : data.categories || [];
            console.log(`  ✅ Found ${categories.length} categories`);
            categories.slice(0, 5).forEach((cat: any, i: number) => {
                console.log(`     ${i + 1}. ${cat.name} (${cat.document_count || 0} docs)`);
            });
        }
    } catch (error) {
        console.error('  ❌ Error:', error);
    }
    
    // Test 3: List Concepts in Category
    console.log('\n4️⃣  Testing list_concepts_in_category...');
    try {
        const listConceptsTool = container.getTool('list_concepts_in_category');
        const result = await listConceptsTool.execute({ 
            category: 'software architecture', 
            limit: 10 
        });
        if (result.isError) {
            console.log('  ⚠️  Error or no results:', JSON.parse(result.content[0].text));
        } else {
            const data = JSON.parse(result.content[0].text);
            const concepts = Array.isArray(data) ? data : data.concepts || [];
            console.log(`  ✅ Found ${concepts.length} concepts in "software architecture"`);
            concepts.slice(0, 5).forEach((c: any, i: number) => {
                console.log(`     ${i + 1}. ${c.name || c}`);
            });
        }
    } catch (error) {
        console.error('  ❌ Error:', error);
    }
    
    // Cleanup
    console.log('\n5️⃣  Cleanup...');
    await container.close();
    console.log('  ✅ Container closed');
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 ALL TESTS COMPLETED');
}

testCategoryTools().catch(console.error);
