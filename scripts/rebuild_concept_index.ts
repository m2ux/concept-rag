#!/usr/bin/env tsx
/**
 * Rebuild concept index from existing catalog and chunks
 * 
 * This script regenerates the concepts table without re-extracting concepts.
 * It uses the existing concept_names stored in catalog records.
 * 
 * Useful after:
 * - Fixing bugs in concept index building logic (like the query limit bug)
 * - Fixing catalog_id mapping issues
 * - Database maintenance
 * 
 * Does NOT require API key since we're not extracting new concepts.
 * 
 * Schema compatibility (v7):
 * - Catalog: uses `summary` (not `text`), `concept_names` (array), `category_names` (array)
 * - Chunks: uses `text`, `concept_ids` (array), `concept_names` (array), `catalog_id`
 * - Concepts: rebuilt from catalog concept_names
 * 
 * Usage:
 *   npx tsx scripts/rebuild_concept_index.ts [--dbpath <path>]
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import { homedir } from 'os';
import { Document } from "@langchain/core/documents";
import { ConceptIndexBuilder } from '../src/concepts/concept_index.js';
import { hashToId } from '../src/infrastructure/utils/hash.js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const DB_PATH = argv['dbpath'] || path.join(homedir(), '.concept_rag');

/**
 * Parse array field from LanceDB (handles native arrays, Arrow Vectors, JSON strings)
 */
function parseArrayField(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return []; }
    }
    return [];
}

async function rebuildConceptIndex() {
    console.log("🔧 Rebuilding Concept Index from Existing Data\n");
    console.log(`📂 Database: ${DB_PATH}\n`);
    
    const db = await lancedb.connect(DB_PATH);
    
    // Open tables
    const catalogTable = await db.openTable('catalog');
    const chunksTable = await db.openTable('chunks');
    
    // Load ALL catalog records (LanceDB defaults to limit 10!)
    console.log("📚 Loading catalog entries...");
    const catalogRecords = await catalogTable.query().limit(100000).toArray();
    console.log(`  ✅ Loaded ${catalogRecords.length} catalog entries`);
    
    // Build source → catalog ID map from ACTUAL catalog table IDs (foreign key constraint)
    const sourceToCatalogId = new Map<string, number>();
    for (const r of catalogRecords) {
        if (r.source && r.id !== undefined) {
            sourceToCatalogId.set(r.source, typeof r.id === 'number' ? r.id : parseInt(r.id, 10));
        }
    }
    console.log(`  ✅ Built source→catalogId map with ${sourceToCatalogId.size} entries`);
    
    // Convert catalog records to Document format compatible with ConceptIndexBuilder
    // Schema v7: catalog uses `summary` (not `text`) and `concept_names` (not `concepts`)
    const catalogDocs = catalogRecords
        .filter((r: any) => {
            const conceptNames = parseArrayField(r.concept_names);
            // Filter out placeholder values [0] or ['']
            const validConcepts = conceptNames.filter((n: any) => n && n !== '' && n !== 0);
            return r.source && validConcepts.length > 0;
        })
        .map((r: any) => {
            // Reconstruct the concepts metadata structure from stored concept_names
            const conceptNames = parseArrayField(r.concept_names)
                .filter((n: any) => n && n !== '' && n !== 0);
            const categoryNames = parseArrayField(r.category_names)
                .filter((n: any) => n && n !== '' && n !== 0);
            
            // Build ConceptMetadata structure expected by ConceptIndexBuilder
            const concepts = {
                primary_concepts: conceptNames,  // Array of concept name strings
                categories: categoryNames,
                related_concepts: []  // Not stored, will be rebuilt
            };
            
            return new Document({
                pageContent: r.summary || '',  // Schema v7: catalog uses 'summary' not 'text'
                metadata: {
                    source: r.source,
                    hash: r.hash,
                    concepts: concepts
                }
            });
        });
    
    console.log(`  ✅ Found ${catalogDocs.length} entries with concepts\n`);
    
    if (catalogDocs.length === 0) {
        console.error("❌ No catalog entries with concepts found!");
        console.error("   Check that catalog records have concept_names populated.");
        process.exit(1);
    }
    
    // Load ALL chunks (LanceDB defaults to limit 10!)
    console.log("📦 Loading ALL chunks for concept counting...");
    const allChunkRecords = await chunksTable.query().limit(1000000).toArray();
    console.log(`  ✅ Loaded ${allChunkRecords.length} chunks`);
    
    // Count chunks with concepts
    const chunksWithConcepts = allChunkRecords.filter((chunk: any) => {
        const conceptIds = parseArrayField(chunk.concept_ids);
        // Filter out placeholder values [0]
        return conceptIds.filter((id: any) => id && id !== 0).length > 0;
    });
    console.log(`  ✅ Found ${chunksWithConcepts.length} chunks with concept metadata\n`);
    
    // Build concept index using actual catalog IDs (foreign key constraint)
    console.log("🧠 Building concept index from ALL data...");
    const conceptBuilder = new ConceptIndexBuilder();
    const conceptRecords = await conceptBuilder.buildConceptIndex(catalogDocs, sourceToCatalogId);
    
    console.log(`  ✅ Built ${conceptRecords.length} unique concept records\n`);
    
    // Build chunk_ids for each concept (reverse mapping from chunks → concepts)
    console.log("🔗 Building concept → chunk_ids mapping...");
    const conceptToChunkIds = new Map<number, number[]>();
    
    for (const chunk of allChunkRecords) {
        const chunkId = chunk.id;
        const conceptIds = parseArrayField(chunk.concept_ids)
            .filter((id: any) => id && id !== 0);
        
        for (const conceptId of conceptIds) {
            if (!conceptToChunkIds.has(conceptId)) {
                conceptToChunkIds.set(conceptId, []);
            }
            conceptToChunkIds.get(conceptId)!.push(chunkId);
        }
    }
    
    // Update concept records with chunk_ids
    for (const concept of conceptRecords) {
        const conceptId = hashToId(concept.name.toLowerCase().trim());
        const chunkIds = conceptToChunkIds.get(conceptId) || [];
        concept.chunk_ids = chunkIds;
    }
    
    const conceptsWithChunks = conceptRecords.filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
    console.log(`  ✅ Mapped ${conceptsWithChunks} concepts to ${allChunkRecords.length} chunks\n`);
    
    // Show top concepts by document count
    console.log("🔝 Top concepts by document count:\n");
    const topConcepts = conceptRecords
        .filter(c => c.catalog_ids && c.catalog_ids.length > 0)
        .sort((a, b) => (b.catalog_ids?.length ?? 0) - (a.catalog_ids?.length ?? 0))
        .slice(0, 10);
    
    topConcepts.forEach((c, idx) => {
        console.log(`  ${(idx + 1).toString().padStart(2)}. "${c.name}" - ${c.catalog_ids?.length ?? 0} docs, ${c.chunk_ids?.length ?? 0} chunks`);
    });
    console.log();
    
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
    
    // Verify the rebuild
    const conceptsTable = await db.openTable('concepts');
    const verifyCount = await conceptsTable.countRows();
    console.log(`📊 Verification: ${verifyCount} concepts in rebuilt table`);
    
    console.log("\n🎉 Concept index rebuild completed!");
}

rebuildConceptIndex().catch((error) => {
    console.error("❌ Rebuild failed:", error);
    process.exit(1);
});
