#!/usr/bin/env tsx
/**
 * Rebuild concept index from existing catalog and chunks
 * 
 * This script regenerates the concept index table without re-extracting concepts.
 * Useful after:
 * - Fixing bugs in concept index building logic
 * - Updating chunk metadata
 * - Database maintenance
 * 
 * Does NOT require API key since we're not extracting new concepts.
 * 
 * Usage:
 *   npx tsx scripts/rebuild_concept_index.ts [--dbpath <path>]
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import { homedir } from 'os';
import { Document } from "@langchain/core/documents";
import { ConceptIndexBuilder } from '../src/concepts/concept_index.js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const DB_PATH = argv['dbpath'] || path.join(homedir(), '.concept_rag');

async function rebuildConceptIndex() {
    console.log("🔧 Rebuilding Concept Index from Existing Data\n");
    console.log(`📂 Database: ${DB_PATH}\n`);
    
    const db = await lancedb.connect(DB_PATH);
    
    // Open tables
    const catalogTable = await db.openTable('catalog');
    const chunksTable = await db.openTable('chunks');
    
    // Load ALL catalog records
    console.log("📚 Loading catalog entries...");
    const catalogRecords = await catalogTable.query().limit(100000).toArray();
    console.log(`  ✅ Loaded ${catalogRecords.length} catalog entries`);
    
    // Convert to Document format and filter for those with concepts
    const catalogDocs = catalogRecords
        .filter((r: any) => r.text && r.source && r.concepts)
        .map((r: any) => {
            let concepts = r.concepts;
            if (typeof concepts === 'string') {
                try {
                    concepts = JSON.parse(concepts);
                } catch (e) {
                    concepts = null;
                }
            }
            
            return new Document({
                pageContent: r.text || '',
                metadata: {
                    source: r.source,
                    hash: r.hash,
                    concepts: concepts
                }
            });
        })
        .filter((d: Document) => d.metadata.concepts);
    
    console.log(`  ✅ Found ${catalogDocs.length} entries with concepts\n`);
    
    // Load ALL chunks
    console.log("📦 Loading ALL chunks for concept counting...");
    const allChunkRecords = await chunksTable.query().limit(1000000).toArray();
    console.log(`  ✅ Loaded ${allChunkRecords.length} chunks`);
    
    // Convert chunk records to Documents
    const allChunks = allChunkRecords.map((chunk: any) => {
        let concepts = [];
        let categories = [];
        let density = 0;
        
        try {
            concepts = chunk.concepts ? JSON.parse(chunk.concepts) : [];
            categories = chunk.concept_categories ? JSON.parse(chunk.concept_categories) : [];
            density = chunk.concept_density || 0;
        } catch (e) {
            // Keep empty defaults
        }
        
        return new Document({
            pageContent: chunk.text || '',
            metadata: {
                source: chunk.source,
                hash: chunk.hash,
                concepts: concepts,
                concept_categories: categories,
                concept_density: density
            }
        });
    });
    
    // Count chunks with concepts
    const chunksWithConcepts = allChunks.filter(c => 
        c.metadata.concepts && c.metadata.concepts.length > 0
    );
    console.log(`  ✅ Found ${chunksWithConcepts.length} chunks with concept metadata\n`);
    
    // Build concept index
    console.log("🧠 Building concept index from ALL data...");
    const conceptBuilder = new ConceptIndexBuilder();
    const conceptRecords = await conceptBuilder.buildConceptIndex(catalogDocs, allChunks);
    
    console.log(`  ✅ Built ${conceptRecords.length} unique concept records\n`);
    
    // Show top concepts by chunk count
    const topConceptsByChunks = conceptRecords
        .filter(c => (c.chunk_count ?? 0) > 0)
        .sort((a, b) => (b.chunk_count ?? 0) - (a.chunk_count ?? 0))
        .slice(0, 15);
    
    if (topConceptsByChunks.length > 0) {
        console.log(`🔝 Top 15 concepts by chunk count:\n`);
        topConceptsByChunks.forEach((c, idx) => {
            console.log(`  ${(idx + 1).toString().padStart(2)}. "${c.concept}" - ${c.chunk_count ?? 0} chunks (${c.category})`);
        });
        console.log();
    }
    
    // Check TypeScript specifically
    const typescriptConcepts = conceptRecords.filter(c => 
        c.concept.toLowerCase().includes('typescript')
    );
    
    if (typescriptConcepts.length > 0) {
        console.log(`\n📌 TypeScript-related concepts:\n`);
        typescriptConcepts.forEach(c => {
            console.log(`  • "${c.concept}"`);
            console.log(`    Documents: ${c.document_count ?? 0}`);
            console.log(`    Chunks: ${c.chunk_count ?? 0}`);
        });
        console.log();
    }
    
    // Drop and recreate concepts table
    try {
        await db.dropTable('concepts');
        console.log("🗑️  Dropped existing concepts table\n");
    } catch (e) {
        // Table didn't exist, that's fine
    }
    
    console.log("💾 Creating new concepts table...");
    await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts');
    console.log("  ✅ Concept index created successfully\n");
    
    console.log("🎉 Concept index rebuild completed!");
}

rebuildConceptIndex().catch((error) => {
    console.error("❌ Rebuild failed:", error);
    process.exit(1);
});


