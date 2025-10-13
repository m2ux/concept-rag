// Test suite for conceptual search
// Run after: npm run build
import { ConceptExtractor } from '../src/concepts/concept_extractor.js';
import { Document } from "@langchain/core/documents";
// Test queries for technical content
const testQueries = [
    {
        query: "thread synchronization mechanisms",
        description: "Should expand with: mutex, semaphore, lock, concurrent, parallel",
        expectedConcepts: ["mutex", "semaphore", "lock", "concurrent"]
    },
    {
        query: "sorting algorithm efficiency",
        description: "Should expand with: quicksort, mergesort, big o, complexity",
        expectedConcepts: ["quicksort", "mergesort", "complexity"]
    },
    {
        query: "database transaction isolation",
        description: "Should expand with: acid, serializable, commit, rollback",
        expectedConcepts: ["acid", "transaction", "commit"]
    },
    {
        query: "implement authentication system",
        description: "Should expand with: OAuth, JWT, session, login, security",
        expectedConcepts: ["authentication", "security", "login"]
    }
];
async function runBasicTests() {
    console.log('🧪 Conceptual Search Test Suite\n');
    console.log('='.repeat(60));
    // Test 1: Concept Extraction
    console.log('\n📊 Test 1: Concept Extraction');
    console.log('-'.repeat(60));
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.log('❌ OPENROUTER_API_KEY not set, skipping concept extraction test');
    }
    else {
        try {
            const extractor = new ConceptExtractor(apiKey);
            const testDoc = new Document({
                pageContent: `
This document discusses concurrent programming patterns in modern systems.
Key topics include thread synchronization using mutexes and semaphores,
preventing race conditions, and avoiding deadlocks. The material covers
both theoretical aspects and practical implementations in various programming
languages including Java, C++, and Python.
                `.trim()
            });
            console.log('  Extracting concepts from sample text...');
            const concepts = await extractor.extractConcepts([testDoc]);
            console.log('  ✅ Primary Concepts:', concepts.primary_concepts.join(', '));
            console.log('  ✅ Technical Terms:', concepts.technical_terms.join(', '));
            console.log('  ✅ Categories:', concepts.categories.join(', '));
            console.log('  ✅ Related Concepts:', concepts.related_concepts.join(', '));
        }
        catch (error) {
            console.log('  ❌ Error:', error.message);
        }
    }
    // Test 2: WordNet Integration
    console.log('\n📚 Test 2: WordNet Integration');
    console.log('-'.repeat(60));
    try {
        const { WordNetService } = await import('../src/wordnet/wordnet_service.js');
        const wordnet = new WordNetService();
        const testWords = ['algorithm', 'function', 'thread'];
        for (const word of testWords) {
            console.log(`  Testing word: "${word}"`);
            const synsets = await wordnet.getSynsets(word);
            if (synsets.length > 0) {
                const mainSynset = synsets[0];
                console.log(`    ✅ Synonyms: ${mainSynset.synonyms.slice(0, 3).join(', ')}`);
                console.log(`    ✅ Hypernyms: ${mainSynset.hypernyms.slice(0, 2).join(', ')}`);
            }
            else {
                console.log(`    ⚠️  Not found in WordNet`);
            }
        }
    }
    catch (error) {
        console.log('  ❌ Error:', error.message);
    }
    // Test 3: Query Expansion
    console.log('\n🔍 Test 3: Query Expansion (Requires Database)');
    console.log('-'.repeat(60));
    console.log('  To test query expansion:');
    console.log('  1. Run: npm run build');
    console.log('  2. Seed database: npx tsx hybrid_fast_seed.ts --dbpath ~/.lance_mcp_test --filesdir ~/Documents/sample-docs --overwrite');
    console.log('  3. Test search with debug: use MCP inspector or Cursor');
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Queries to Try:');
    console.log('='.repeat(60));
    testQueries.forEach((test, idx) => {
        console.log(`\n${idx + 1}. Query: "${test.query}"`);
        console.log(`   ${test.description}`);
    });
    console.log('\n✅ Basic tests completed!');
    console.log('\n📖 Next Steps:');
    console.log('  1. Build project: npm run build');
    console.log('  2. Seed database with concept extraction');
    console.log('  3. Test with MCP inspector or integrate with Cursor');
}
// Run tests
runBasicTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
