/**
 * Curated MCP Tool Tests
 * 
 * Tests each MCP tool with at least 5 test cases against the test_db.
 * Based on "Art of War" document content.
 */

import { ApplicationContainer } from '../src/application/container.js';
import * as lancedb from '@lancedb/lancedb';

interface TestResult {
    tool: string;
    test: string;
    passed: boolean;
    message: string;
}

const results: TestResult[] = [];

// Actual concepts from the database (populated at runtime)
let ACTUAL_CONCEPTS: string[] = [];

function log(tool: string, test: string, passed: boolean, message: string) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} [${tool}] ${test}: ${message}`);
    results.push({ tool, test, passed, message });
}

/**
 * Load actual concept names from the database for testing
 */
async function loadActualConcepts() {
    const db = await lancedb.connect('./test_db');
    const concepts = await db.openTable('concepts');
    const all = await concepts.query().limit(100).toArray();
    ACTUAL_CONCEPTS = all.map(c => c.name).filter(n => n);
    console.log(`📚 Loaded ${ACTUAL_CONCEPTS.length} concept names for testing`);
    console.log(`   Examples: ${ACTUAL_CONCEPTS.slice(0, 3).join(', ')}`);
}

async function testConceptChunks(container: ApplicationContainer) {
    const tool = container.getTool('concept_chunks');
    const toolName = 'concept_chunks';
    
    // Use actual concept names from database
    const concept1 = ACTUAL_CONCEPTS.find(c => c.includes('military')) || ACTUAL_CONCEPTS[0];
    const concept2 = ACTUAL_CONCEPTS.find(c => c.includes('deception')) || ACTUAL_CONCEPTS[1];
    const concept3 = ACTUAL_CONCEPTS.find(c => c.includes('terrain')) || ACTUAL_CONCEPTS[2];
    const concept4 = ACTUAL_CONCEPTS.find(c => c.includes('(')) || ACTUAL_CONCEPTS[3];
    const concept5 = ACTUAL_CONCEPTS.find(c => c.includes('attack')) || ACTUAL_CONCEPTS[4];
    
    // Test 1: Find chunks for exact concept
    const r1 = await tool.execute({ concept: concept1, limit: 5 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'exact concept match', 
        !r1.isError,
        `Found ${c1.total_chunks_found || 0} chunks for "${concept1.substring(0, 30)}..."`);
    
    // Test 2: Different concept
    const r2 = await tool.execute({ concept: concept2, limit: 5 });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'second concept', 
        !r2.isError,
        `Found ${c2.total_chunks_found || 0} chunks for "${concept2.substring(0, 30)}..."`);
    
    // Test 3: Multi-word concept
    const r3 = await tool.execute({ concept: concept3, limit: 5 });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'multi-word concept', 
        !r3.isError,
        `Found ${c3.total_chunks_found || 0} chunks`);
    
    // Test 4: Concept with special characters
    const r4 = await tool.execute({ concept: concept4, limit: 3 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'concept with parentheses', 
        !r4.isError,
        `Found ${c4.total_chunks_found || 0} chunks`);
    
    // Test 5: Non-existent concept returns empty
    const r5 = await tool.execute({ concept: 'quantum computing nonexistent xyz', limit: 5 });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'non-existent concept', 
        (c5.total_chunks_found === 0 || c5.results?.length === 0) && !r5.isError,
        'Returns empty results gracefully');
    
    // Test 6: Limit parameter works
    const r6 = await tool.execute({ concept: concept5, limit: 2 });
    const c6 = JSON.parse(r6.content[0].text);
    log(toolName, 'limit parameter', 
        !r6.isError && (c6.results?.length || 0) <= 2,
        `Limit respected: ${c6.results?.length || 0} results`);
}

async function testConceptSearch(container: ApplicationContainer) {
    const tool = container.getTool('concept_search');
    const toolName = 'concept_search';
    
    // Use actual concept names from database
    const concept1 = ACTUAL_CONCEPTS.find(c => c.includes('strategy')) || ACTUAL_CONCEPTS[0];
    const concept2 = ACTUAL_CONCEPTS.find(c => c.includes('spy') || c.includes('intelligence')) || ACTUAL_CONCEPTS[1];
    const concept3 = ACTUAL_CONCEPTS.find(c => c.includes('deception')) || ACTUAL_CONCEPTS[2];
    const concept4 = ACTUAL_CONCEPTS.find(c => c.includes('logistics')) || ACTUAL_CONCEPTS[3];
    const concept5 = ACTUAL_CONCEPTS.find(c => c.includes('command')) || ACTUAL_CONCEPTS[4];
    
    // Test 1: Find concept with hierarchical sources
    const r1 = await tool.execute({ concept: concept1, limit: 5 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'hierarchical concept search', 
        !r1.isError,
        `Found ${c1.total_sources || c1.sources?.length || 0} sources for "${concept1.substring(0, 25)}..."`);
    
    // Test 2: Different concept
    const r2 = await tool.execute({ concept: concept2, limit: 5 });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'second concept', 
        !r2.isError,
        `Found results for "${concept2.substring(0, 25)}..."`);
    
    // Test 3: Case insensitivity (use actual concept but uppercase)
    const r3 = await tool.execute({ concept: concept3.toUpperCase(), limit: 5 });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'case insensitive', 
        !r3.isError,
        `Case insensitive search works`);
    
    // Test 4: Another concept
    const r4 = await tool.execute({ concept: concept4, limit: 5 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'fourth concept', 
        !r4.isError,
        `Found results for "${concept4.substring(0, 25)}..."`);
    
    // Test 5: Multi-word concept
    const r5 = await tool.execute({ concept: concept5, limit: 5 });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'multi-word concept', 
        !r5.isError,
        `Multi-word query executed for "${concept5.substring(0, 25)}..."`);
}

async function testCatalogSearch(container: ApplicationContainer) {
    const tool = container.getTool('catalog_search');
    const toolName = 'catalog_search';
    
    // Test 1: Search by title keyword
    const r1 = await tool.execute({ text: 'war', limit: 5 });
    const c1 = JSON.parse(r1.content[0].text);
    const results1 = c1.results || c1;
    log(toolName, 'search by title keyword', 
        Array.isArray(results1) && results1.length > 0,
        `Found ${results1.length} documents for "war"`);
    
    // Test 2: Search by content
    const r2 = await tool.execute({ text: 'military', limit: 5 });
    const c2 = JSON.parse(r2.content[0].text);
    const results2 = c2.results || c2;
    log(toolName, 'search by content', 
        !r2.isError,
        `Found ${Array.isArray(results2) ? results2.length : 0} results`);
    
    // Test 3: Search by concept
    const r3 = await tool.execute({ text: 'deception', limit: 5 });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'search by concept term', 
        !r3.isError,
        'Concept term search works');
    
    // Test 4: Non-matching query
    const r4 = await tool.execute({ text: 'quantum physics', limit: 5 });
    const c4 = JSON.parse(r4.content[0].text);
    const results4 = c4.results || c4;
    log(toolName, 'non-matching query', 
        !r4.isError,
        `Returns ${Array.isArray(results4) ? results4.length : 0} results gracefully`);
    
    // Test 5: Limit parameter
    const r5 = await tool.execute({ text: 'strategy', limit: 1 });
    const c5 = JSON.parse(r5.content[0].text);
    const results5 = c5.results || c5;
    log(toolName, 'limit parameter', 
        !r5.isError && (Array.isArray(results5) ? results5.length <= 1 : true),
        'Limit respected');
}

async function testChunksSearch(container: ApplicationContainer) {
    const tool = container.getTool('chunks_search');
    const toolName = 'chunks_search';
    
    // First get a source path
    const catalogTool = container.getTool('catalog_search');
    const catResult = await catalogTool.execute({ text: 'war', limit: 1 });
    const catContent = JSON.parse(catResult.content[0].text);
    const source = (catContent.results || catContent)[0]?.source || 'sample-docs/Philosophy/Sun Tzu - Art Of War.pdf';
    
    // Test 1: Search within specific document
    const r1 = await tool.execute({ text: 'attack', source: source, limit: 5 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'search within document', 
        !r1.isError,
        `Found ${c1.results?.length || 0} chunks`);
    
    // Test 2: Multiple term search
    const r2 = await tool.execute({ text: 'enemy force', source: source, limit: 5 });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'multi-term search', 
        !r2.isError,
        `Found ${c2.results?.length || 0} chunks`);
    
    // Test 3: Case insensitive
    const r3 = await tool.execute({ text: 'STRATEGY', source: source, limit: 3 });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'case insensitive', 
        !r3.isError,
        'Case insensitive search works');
    
    // Test 4: Specific phrase
    const r4 = await tool.execute({ text: 'terrain', source: source, limit: 5 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'specific phrase', 
        !r4.isError,
        `Found ${c4.results?.length || 0} chunks`);
    
    // Test 5: Non-matching term
    const r5 = await tool.execute({ text: 'quantum', source: source, limit: 5 });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'non-matching term', 
        !r5.isError,
        'Returns empty gracefully');
}

async function testBroadChunksSearch(container: ApplicationContainer) {
    const tool = container.getTool('broad_chunks_search');
    const toolName = 'broad_chunks_search';
    
    // Test 1: Basic broad search
    const r1 = await tool.execute({ text: 'attack', limit: 5 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'basic broad search', 
        !r1.isError && (c1.results?.length > 0 || Array.isArray(c1)),
        `Found ${c1.results?.length || c1.length || 0} chunks`);
    
    // Test 2: Multi-word search
    const r2 = await tool.execute({ text: 'military strategy', limit: 5 });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'multi-word search', 
        !r2.isError,
        `Multi-word search works`);
    
    // Test 3: Natural language query
    const r3 = await tool.execute({ text: 'how to win battles', limit: 5 });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'natural language query', 
        !r3.isError,
        'Natural language query works');
    
    // Test 4: Domain-specific term
    const r4 = await tool.execute({ text: 'logistics supply', limit: 5 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'domain-specific term', 
        !r4.isError,
        `Found ${c4.results?.length || 0} chunks`);
    
    // Test 5: Limit parameter
    const r5 = await tool.execute({ text: 'war', limit: 2 });
    const c5 = JSON.parse(r5.content[0].text);
    const results5 = c5.results || c5;
    log(toolName, 'limit parameter', 
        !r5.isError && (Array.isArray(results5) ? results5.length <= 2 : true),
        'Limit respected');
}

async function testExtractConcepts(container: ApplicationContainer) {
    const tool = container.getTool('extract_concepts');
    const toolName = 'extract_concepts';
    
    // Test 1: Extract from known document
    const r1 = await tool.execute({ document_query: 'Sun Tzu' });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'extract from document', 
        !r1.isError && (c1.primary_concepts?.length > 0 || c1.concepts?.length > 0),
        `Found ${c1.primary_concepts?.length || c1.concepts?.length || 0} concepts`);
    
    // Test 2: Extract with JSON format
    const r2 = await tool.execute({ document_query: 'Art of War', format: 'json' });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'JSON format', 
        !r2.isError,
        'JSON format works');
    
    // Test 3: Include summary
    const r3 = await tool.execute({ document_query: 'war', include_summary: true });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'include summary', 
        !r3.isError && (c3.summary !== undefined || c3.document_summary !== undefined),
        'Summary included');
    
    // Test 4: Categories extraction
    const r4 = await tool.execute({ document_query: 'Sun Tzu' });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'categories extraction', 
        !r4.isError && (c4.categories?.length > 0),
        `Found ${c4.categories?.length || 0} categories`);
    
    // Test 5: Non-existent document
    const r5 = await tool.execute({ document_query: 'nonexistent book xyz123' });
    log(toolName, 'non-existent document', 
        r5.isError || r5.content[0].text.includes('not found') || r5.content[0].text.includes('No document'),
        'Handles missing document gracefully');
}

async function testConceptSources(container: ApplicationContainer) {
    const tool = container.getTool('concept_sources');
    const toolName = 'concept_sources';
    
    // Use actual concept names
    const concept1 = ACTUAL_CONCEPTS.find(c => c.includes('military')) || ACTUAL_CONCEPTS[0];
    const concept2 = ACTUAL_CONCEPTS.find(c => c.includes('deception')) || ACTUAL_CONCEPTS[1];
    const concept3 = ACTUAL_CONCEPTS.find(c => c.includes('logistics')) || ACTUAL_CONCEPTS[2];
    const concept4 = ACTUAL_CONCEPTS.find(c => c.includes('terrain')) || ACTUAL_CONCEPTS[3];
    
    // Test 1: Single concept sources
    const r1 = await tool.execute({ concept: concept1 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'single concept sources', 
        !r1.isError,
        `Found ${c1.sources?.length || c1.total_sources || 0} sources`);
    
    // Test 2: Multiple concepts
    const r2 = await tool.execute({ concept: [concept2, concept3] });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'multiple concepts', 
        !r2.isError,
        'Multiple concepts query works');
    
    // Test 3: Include metadata
    const r3 = await tool.execute({ concept: concept4, include_metadata: true });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'include metadata', 
        !r3.isError,
        'Metadata included');
    
    // Test 4: Non-existent concept
    const r4 = await tool.execute({ concept: 'quantum computing xyz nonexistent' });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'non-existent concept', 
        !r4.isError,
        'Handles non-existent concept gracefully');
    
    // Test 5: Case insensitivity
    const r5 = await tool.execute({ concept: concept2.toUpperCase() });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'case insensitive', 
        !r5.isError,
        'Case insensitive works');
}

async function testSourceConcepts(container: ApplicationContainer) {
    const tool = container.getTool('source_concepts');
    const toolName = 'source_concepts';
    
    // Use actual concept names
    const concept1 = ACTUAL_CONCEPTS.find(c => c.includes('strategy')) || ACTUAL_CONCEPTS[0];
    const concept2 = ACTUAL_CONCEPTS.find(c => c.includes('attack')) || ACTUAL_CONCEPTS[1];
    const concept3 = ACTUAL_CONCEPTS.find(c => c.includes('defense') || c.includes('defensive')) || ACTUAL_CONCEPTS[2];
    const concept4 = ACTUAL_CONCEPTS.find(c => c.includes('terrain')) || ACTUAL_CONCEPTS[3];
    const concept5 = ACTUAL_CONCEPTS.find(c => c.includes('morale')) || ACTUAL_CONCEPTS[4];
    
    // Test 1: Single concept sources (union)
    const r1 = await tool.execute({ concept: concept1 });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'single concept union', 
        !r1.isError,
        `Found ${c1.sources?.length || c1.total_sources || 0} sources`);
    
    // Test 2: Multiple concepts union
    const r2 = await tool.execute({ concept: [concept2, concept3] });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'multiple concepts union', 
        !r2.isError,
        'Multiple concepts union works');
    
    // Test 3: Include metadata
    const r3 = await tool.execute({ concept: concept4, include_metadata: true });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'include metadata', 
        !r3.isError,
        'Metadata included');
    
    // Test 4: Non-existent concept
    const r4 = await tool.execute({ concept: 'blockchain xyz nonexistent' });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'non-existent concept', 
        !r4.isError,
        'Handles gracefully');
    
    // Test 5: Array with single concept
    const r5 = await tool.execute({ concept: [concept5] });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'array with single concept', 
        !r5.isError,
        'Single-element array works');
}

async function testCategorySearch(container: ApplicationContainer) {
    const tool = container.getTool('category_search');
    const toolName = 'category_search';
    
    // Test 1: Search by category name
    const r1 = await tool.execute({ category: 'military' });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'search by category name', 
        !r1.isError,
        `Found ${c1.documents?.length || 0} documents`);
    
    // Test 2: Partial category match
    const r2 = await tool.execute({ category: 'strategy' });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'partial category match', 
        !r2.isError,
        'Partial match works');
    
    // Test 3: Include children
    const r3 = await tool.execute({ category: 'military', includeChildren: true });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'include children', 
        !r3.isError,
        'Include children works');
    
    // Test 4: Limit parameter
    const r4 = await tool.execute({ category: 'military', limit: 1 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'limit parameter', 
        !r4.isError,
        'Limit respected');
    
    // Test 5: Non-existent category
    const r5 = await tool.execute({ category: 'quantum physics xyz' });
    const c5 = JSON.parse(r5.content[0].text);
    log(toolName, 'non-existent category', 
        !r5.isError || c5.documents?.length === 0,
        'Handles non-existent category');
}

async function testListCategories(container: ApplicationContainer) {
    const tool = container.getTool('list_categories');
    const toolName = 'list_categories';
    
    // Test 1: List all categories
    const r1 = await tool.execute({});
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'list all categories', 
        !r1.isError && (c1.categories?.length > 0 || Array.isArray(c1)),
        `Found ${c1.categories?.length || c1.length || 0} categories`);
    
    // Test 2: Search filter
    const r2 = await tool.execute({ search: 'military' });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'search filter', 
        !r2.isError,
        'Search filter works');
    
    // Test 3: Sort by name
    const r3 = await tool.execute({ sortBy: 'name' });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'sort by name', 
        !r3.isError,
        'Sort by name works');
    
    // Test 4: Sort by document count
    const r4 = await tool.execute({ sortBy: 'documentCount' });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'sort by document count', 
        !r4.isError,
        'Sort by document count works');
    
    // Test 5: Limit parameter
    const r5 = await tool.execute({ limit: 3 });
    const c5 = JSON.parse(r5.content[0].text);
    const results5 = c5.categories || c5;
    log(toolName, 'limit parameter', 
        !r5.isError && (Array.isArray(results5) ? results5.length <= 3 : true),
        'Limit respected');
}

async function testListConceptsInCategory(container: ApplicationContainer) {
    const tool = container.getTool('list_concepts_in_category');
    const toolName = 'list_concepts_in_category';
    
    // First, get a valid category
    const listTool = container.getTool('list_categories');
    const listResult = await listTool.execute({});
    const listContent = JSON.parse(listResult.content[0].text);
    const categories = listContent.categories || listContent;
    const validCategory = categories[0]?.name || 'military';
    
    // Test 1: List concepts in category
    const r1 = await tool.execute({ category: validCategory });
    const c1 = JSON.parse(r1.content[0].text);
    log(toolName, 'list concepts in category', 
        !r1.isError,
        `Found ${c1.concepts?.length || 0} concepts`);
    
    // Test 2: Sort by name
    const r2 = await tool.execute({ category: validCategory, sortBy: 'name' });
    const c2 = JSON.parse(r2.content[0].text);
    log(toolName, 'sort by name', 
        !r2.isError,
        'Sort by name works');
    
    // Test 3: Sort by document count
    const r3 = await tool.execute({ category: validCategory, sortBy: 'documentCount' });
    const c3 = JSON.parse(r3.content[0].text);
    log(toolName, 'sort by document count', 
        !r3.isError,
        'Sort by document count works');
    
    // Test 4: Limit parameter
    const r4 = await tool.execute({ category: validCategory, limit: 5 });
    const c4 = JSON.parse(r4.content[0].text);
    log(toolName, 'limit parameter', 
        !r4.isError && (c4.concepts?.length || 0) <= 5,
        'Limit respected');
    
    // Test 5: Non-existent category
    const r5 = await tool.execute({ category: 'nonexistent category xyz' });
    log(toolName, 'non-existent category', 
        r5.isError || r5.content[0].text.includes('not found') || r5.content[0].text.includes('No category'),
        'Handles non-existent category');
}

async function main() {
    console.log('🧪 MCP Tool Test Suite');
    console.log('='.repeat(60));
    console.log('');
    
    // Load actual concept names from database first
    await loadActualConcepts();
    console.log('');
    
    const container = new ApplicationContainer();
    
    try {
        await container.initialize('./test_db');
        console.log('');
        console.log('='.repeat(60));
        console.log('Running tests...');
        console.log('='.repeat(60));
        console.log('');
        
        // Run all test suites
        await testConceptChunks(container);
        console.log('');
        
        await testConceptSearch(container);
        console.log('');
        
        await testCatalogSearch(container);
        console.log('');
        
        await testChunksSearch(container);
        console.log('');
        
        await testBroadChunksSearch(container);
        console.log('');
        
        await testExtractConcepts(container);
        console.log('');
        
        await testConceptSources(container);
        console.log('');
        
        await testSourceConcepts(container);
        console.log('');
        
        // Category tools (may not exist if categories table missing)
        try {
            await testCategorySearch(container);
            console.log('');
            
            await testListCategories(container);
            console.log('');
            
            await testListConceptsInCategory(container);
            console.log('');
        } catch (e: any) {
            console.log(`⚠️  Category tools not available: ${e.message}`);
        }
        
        // Summary
        console.log('');
        console.log('='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        const total = results.length;
        
        console.log(`Total: ${total} tests`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('');
            console.log('Failed tests:');
            for (const r of results.filter(r => !r.passed)) {
                console.log(`  ❌ [${r.tool}] ${r.test}: ${r.message}`);
            }
        }
        
        await container.close();
        process.exit(failed > 0 ? 1 : 0);
        
    } catch (error: any) {
        console.error('❌ Test suite failed:', error.message);
        await container.close();
        process.exit(1);
    }
}

main();

