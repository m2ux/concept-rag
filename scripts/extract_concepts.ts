import * as lancedb from "@lancedb/lancedb";
import { createSimpleEmbedding } from "../dist/lancedb/hybrid_search_client.js";
import * as fs from "fs";

/**
 * Generic concept extraction script
 * Usage: npx tsx scripts/extract_concepts.ts <document_query> [output_format]
 * 
 * Examples:
 *   npx tsx scripts/extract_concepts.ts "Sun Tzu Art of War"
 *   npx tsx scripts/extract_concepts.ts "healthcare system" markdown
 *   npx tsx scripts/extract_concepts.ts "Christopher Alexander" json
 */

const DB_PATH = process.env.CONCEPT_RAG_DB || process.env.HOME + "/.concept_rag";

async function extractAndFormatConcepts(documentQuery: string, outputFormat: string = "markdown") {
    console.log(`📂 Connecting to database: ${DB_PATH}`);
    const db = await lancedb.connect(DB_PATH);
    const catalogTable = await db.openTable("catalog");
    
    // Use vector search to find document
    console.log(`🔍 Searching for document: "${documentQuery}"`);
    const queryVector = createSimpleEmbedding(documentQuery);
    const results = await catalogTable
        .vectorSearch(queryVector)
        .limit(10)
        .toArray();
    
    if (results.length === 0) {
        console.error("❌ No documents found matching query");
        process.exit(1);
    }
    
    // Show top matches
    console.log(`\n📚 Found ${results.length} potential matches:\n`);
    results.forEach((doc: any, idx: number) => {
        const filename = doc.source.split('/').pop();
        const distance = doc._distance?.toFixed(3) || 'N/A';
        console.log(`  ${idx + 1}. ${filename} (distance: ${distance})`);
    });
    
    // Use the best match
    const doc = results[0];
    const filename = doc.source.split('/').pop();
    console.log(`\n✅ Selected: ${filename}\n`);
    
    if (!doc.concepts) {
        console.error("❌ No concepts found for this document");
        console.error("   This document may not have been processed with concept extraction");
        process.exit(1);
    }
    
    // Parse the concepts
    const concepts = typeof doc.concepts === 'string' 
        ? JSON.parse(doc.concepts) 
        : doc.concepts;
    
    // Calculate totals
    const totalConcepts = 
        (concepts.primary_concepts?.length || 0) +
        (concepts.related_concepts?.length || 0);
    
    console.log(`📊 Concept Statistics:`);
    console.log(`   - Concepts: ${concepts.primary_concepts?.length || 0}`);
    console.log(`   - Related: ${concepts.related_concepts?.length || 0}`);
    console.log(`   - Total: ${totalConcepts}\n`);
    
    // Generate output filename
    const sanitizedFilename = filename
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    const outputExt = outputFormat === "json" ? "json" : "md";
    const outputPath = `${sanitizedFilename}_concepts.${outputExt}`;
    
    // Format and save
    if (outputFormat === "json") {
        const jsonOutput = {
            document: doc.source,
            document_hash: doc.hash,
            extracted_at: new Date().toISOString(),
            total_concepts: totalConcepts,
            primary_concepts: concepts.primary_concepts || [],
            related_concepts: concepts.related_concepts || [],
            categories: concepts.categories || [],
            summary: concepts.summary || ""
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    } else {
        // Markdown format
        let markdown = `# Concepts Extracted from Document\n\n`;
        markdown += `**Document:** ${filename}\n\n`;
        markdown += `**Full Path:** ${doc.source}\n\n`;
        markdown += `**Total Concepts:** ${totalConcepts}\n\n`;
        markdown += `**Extracted:** ${new Date().toISOString()}\n\n`;
        markdown += `---\n\n`;
        
        // Primary concepts
        if (concepts.primary_concepts && concepts.primary_concepts.length > 0) {
            markdown += `## Primary Concepts (${concepts.primary_concepts.length})\n\n`;
            markdown += `| # | Concept |\n`;
            markdown += `|---|---------|\n`;
            concepts.primary_concepts.forEach((concept: string, idx: number) => {
                markdown += `| ${idx + 1} | ${concept} |\n`;
            });
            markdown += `\n`;
        }
        
        // Related concepts
        if (concepts.related_concepts && concepts.related_concepts.length > 0) {
            markdown += `## Related Concepts (${concepts.related_concepts.length})\n\n`;
            markdown += `| # | Concept |\n`;
            markdown += `|---|---------|\n`;
            concepts.related_concepts.forEach((concept: string, idx: number) => {
                markdown += `| ${idx + 1} | ${concept} |\n`;
            });
            markdown += `\n`;
        }
        
        // Categories
        if (concepts.categories && concepts.categories.length > 0) {
            markdown += `## Categories (${concepts.categories.length})\n\n`;
            concepts.categories.forEach((category: string) => {
                markdown += `- ${category}\n`;
            });
            markdown += `\n`;
        }
        
        // Summary
        if (concepts.summary) {
            markdown += `## Summary\n\n`;
            markdown += `${concepts.summary}\n`;
        }
        
        fs.writeFileSync(outputPath, markdown);
    }
    
    console.log(`✅ Concepts exported to: ${outputPath}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: npx tsx scripts/extract_concepts.ts <document_query> [output_format]");
    console.error("\nExamples:");
    console.error('  npx tsx scripts/extract_concepts.ts "Sun Tzu Art of War"');
    console.error('  npx tsx scripts/extract_concepts.ts "healthcare system" markdown');
    console.error('  npx tsx scripts/extract_concepts.ts "Christopher Alexander" json');
    process.exit(1);
}

const documentQuery = args[0];
const outputFormat = args[1] || "markdown";

if (!["json", "markdown"].includes(outputFormat)) {
    console.error(`Invalid output format: ${outputFormat}`);
    console.error('Must be "json" or "markdown"');
    process.exit(1);
}

extractAndFormatConcepts(documentQuery, outputFormat).catch(console.error);


