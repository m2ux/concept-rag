/**
 * Test concept queries against db/test
 */
import * as lancedb from '@lancedb/lancedb';

async function testConceptQueries() {
    const db = await lancedb.connect('./db/test');
    const concepts = await db.openTable('concepts');
    
    // Get all concepts
    const all = await concepts.query().limit(200).toArray();
    
    console.log('=== CONCEPT SUMMARY TEST ===');
    console.log(`Total concepts: ${all.length}`);
    console.log(`Concepts with summaries: ${all.filter(c => c.summary && c.summary.length > 0).length}`);
    console.log('');
    
    // Test text search (BM25-like) on concept names and summaries
    const testQueries = [
        'deception',
        'spy',
        'cost',
        'supply',
        'terrain',
        'attack',
        'morale',
    ];
    
    console.log('=== SUBSTRING SEARCH ON CONCEPT NAMES ===');
    for (const query of testQueries) {
        const matches = all.filter(c => 
            c.name?.toLowerCase().includes(query) || 
            c.summary?.toLowerCase().includes(query)
        );
        
        console.log(`\nQuery: "${query}" (${matches.length} matches)`);
        for (const m of matches.slice(0, 3)) {
            console.log(`  • ${m.name}`);
            console.log(`    ${m.summary?.substring(0, 80)}...`);
        }
    }
    
    // Show some summaries to demonstrate alignment
    console.log('\n\n=== CONCEPT-SUMMARY ALIGNMENT SAMPLES ===');
    const samples = all.slice(0, 20);
    for (const c of samples) {
        console.log(`\n• ${c.name}`);
        console.log(`  ${c.summary || '(no summary)'}`);
    }
}

testConceptQueries().catch(console.error);

