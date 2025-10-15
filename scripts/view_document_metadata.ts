import * as lancedb from "@lancedb/lancedb";
import { createSimpleEmbedding } from "../dist/lancedb/hybrid_search_client.js";

/**
 * View full document metadata including concepts
 * Usage: npx tsx scripts/view_document_metadata.ts <document_query>
 * 
 * Examples:
 *   npx tsx scripts/view_document_metadata.ts "Sun Tzu Art of War"
 *   npx tsx scripts/view_document_metadata.ts "healthcare system"
 */

const DB_PATH = process.env.CONCEPT_RAG_DB || process.env.HOME + "/.concept_rag";

async function viewDocumentMetadata(documentQuery: string) {
    console.log(`📂 Connecting to database: ${DB_PATH}`);
    const db = await lancedb.connect(DB_PATH);
    const catalogTable = await db.openTable("catalog");
    
    // Use vector search to find document
    console.log(`🔍 Searching for document: "${documentQuery}"\n`);
    const queryVector = createSimpleEmbedding(documentQuery);
    const results = await catalogTable
        .vectorSearch(queryVector)
        .limit(10)
        .toArray();
    
    if (results.length === 0) {
        console.error("❌ No documents found matching query");
        process.exit(1);
    }
    
    // Show all matches
    console.log(`📚 Found ${results.length} matches:\n`);
    results.forEach((doc: any, idx: number) => {
        const filename = doc.source.split('/').pop();
        const distance = doc._distance?.toFixed(3) || 'N/A';
        console.log(`  ${idx + 1}. ${filename} (distance: ${distance})`);
    });
    
    // Use the best match
    const doc = results[0];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SELECTED DOCUMENT METADATA`);
    console.log('='.repeat(80));
    console.log(`\nDocument: ${doc.source}`);
    console.log(`\nHash: ${doc.hash}`);
    
    if (doc.concepts) {
        const concepts = typeof doc.concepts === 'string' 
            ? JSON.parse(doc.concepts) 
            : doc.concepts;
        
        console.log(`\nConcepts Overview:`);
        console.log(`  - Primary: ${concepts.primary_concepts?.length || 0}`);
        console.log(`  - Technical: ${concepts.technical_terms?.length || 0}`);
        console.log(`  - Related: ${concepts.related_concepts?.length || 0}`);
        console.log(`  - Categories: ${concepts.categories?.length || 0}`);
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FULL JSON METADATA`);
    console.log('='.repeat(80));
    console.log(JSON.stringify(doc, null, 2));
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: npx tsx scripts/view_document_metadata.ts <document_query>");
    console.error("\nExamples:");
    console.error('  npx tsx scripts/view_document_metadata.ts "Sun Tzu Art of War"');
    console.error('  npx tsx scripts/view_document_metadata.ts "healthcare system"');
    process.exit(1);
}

const documentQuery = args[0];
viewDocumentMetadata(documentQuery).catch(console.error);

