/**
 * Complete Test Database Schema
 * 
 * Adds ALL missing fields to existing test database per planning docs:
 * 1. concept_ids to catalog (hash-based integers)
 * 2. concept_ids to chunks (hash-based integers)
 * 3. Convert concepts.id from string to number (hash-based)
 * 4. Convert concepts.catalog_ids to integers
 * 5. Add reserved fields to catalog
 */

import { connect } from '@lancedb/lancedb';
import { hashToId } from '../src/infrastructure/utils/hash';
import * as path from 'path';

async function completeSchema() {
    console.log('\n🔧 COMPLETING TEST DATABASE SCHEMA');
    console.log('='.repeat(80));
    
    const dbPath = `${process.env.HOME}/.concept_rag_test`;
    const db = await connect(dbPath);
    
    // ========== STEP 1: Update Concepts Table ==========
    console.log('\n1️⃣  Updating concepts table with hash-based IDs...');
    const conceptsTable = await db.openTable('concepts');
    const conceptRows = await conceptsTable.query().limit(100000).toArray();
    
    console.log(`  📊 Processing ${conceptRows.length} concepts...`);
    
    const updatedConcepts = conceptRows.map(row => {
        // Generate hash-based integer ID from concept name
        const conceptId = hashToId(row.concept);
        
        // Convert catalog_ids to integers (hash source paths)
        let catalogIds: number[] = [];
        if (row.sources) {
            try {
                const sources: string[] = JSON.parse(row.sources);
                catalogIds = sources.map(source => hashToId(source));
            } catch (e) {
                console.warn(`  ⚠️  Error parsing sources for ${row.concept}`);
            }
        }
        
        return {
            id: conceptId,  // NUMBER (hash-based)
            concept: row.concept,
            concept_type: row.concept_type,
            category: row.category || '',  // Keep for backward compat
            sources: row.sources,  // Keep for backward compat
            catalog_ids: JSON.stringify(catalogIds),  // INTEGER array
            related_concepts: row.related_concepts,
            synonyms: row.synonyms,
            broader_terms: row.broader_terms,
            narrower_terms: row.narrower_terms,
            weight: row.weight,
            chunk_count: row.chunk_count,
            enrichment_source: row.enrichment_source,
            vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector)
        };
    });
    
    await db.dropTable('concepts');
    await db.createTable('concepts', updatedConcepts, { mode: 'overwrite' });
    console.log(`  ✅ Concepts table updated: ${conceptRows.length} concepts with hash-based integer IDs`);
    
    // ========== STEP 2: Update Catalog Table ==========
    console.log('\n2️⃣  Updating catalog with concept_ids and reserved fields...');
    const catalogTable = await db.openTable('catalog');
    const catalogRows = await catalogTable.query().limit(10000).toArray();
    
    console.log(`  📊 Processing ${catalogRows.length} catalog entries...`);
    
    const updatedCatalog = catalogRows.map(row => {
        // Extract concept names from concepts field
        let conceptIds: number[] = [];
        if (row.concepts) {
            try {
                const concepts = JSON.parse(row.concepts);
                const conceptNames = concepts.primary_concepts || [];
                conceptIds = conceptNames.map((name: string) => hashToId(name));
            } catch (e) {
                console.warn(`  ⚠️  Error parsing concepts for ${path.basename(row.source)}`);
            }
        }
        
        // Extract filename tags
        const filename = (row.source || '').split('/').pop() || '';
        const filenameParts = filename.replace(/\.(pdf|epub)$/i, '').split('--').map((p: string) => p.trim());
        const filenameTags = filenameParts.length > 1 ? filenameParts.slice(1) : [];
        
        return {
            id: row.id,
            text: row.text,
            source: row.source,
            hash: row.hash,
            loc: row.loc,
            vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector),
            concepts: row.concepts,
            concept_ids: JSON.stringify(conceptIds),  // NEW: hash-based integers
            concept_categories: row.concept_categories || JSON.stringify([]),
            category_ids: row.category_ids || JSON.stringify([]),
            filename_tags: JSON.stringify(filenameTags),  // NEW
            origin_hash: '',  // Reserved
            author: '',  // Reserved
            year: '',  // Reserved
            publisher: '',  // Reserved
            isbn: ''  // Reserved
        };
    });
    
    await db.dropTable('catalog');
    await db.createTable('catalog', updatedCatalog, { mode: 'overwrite' });
    console.log(`  ✅ Catalog updated: ${catalogRows.length} entries with concept_ids and reserved fields`);
    
    // ========== STEP 3: Update Chunks Table ==========
    console.log('\n3️⃣  Updating chunks with concept_ids...');
    const chunksTable = await db.openTable('chunks');
    const chunkRows = await chunksTable.query().limit(100000).toArray();
    
    console.log(`  📊 Processing ${chunkRows.length} chunks...`);
    
    const updatedChunks = chunkRows.map(chunk => {
        // Extract concept names from concepts field
        let conceptIds: number[] = [];
        if (chunk.concepts) {
            try {
                const concepts = JSON.parse(chunk.concepts);
                if (Array.isArray(concepts)) {
                    conceptIds = concepts.map((name: string) => hashToId(name));
                }
            } catch (e) {
                // Skip malformed data
            }
        }
        
        return {
            id: chunk.id,
            text: chunk.text,
            source: chunk.source,
            hash: chunk.hash,
            loc: chunk.loc,
            vector: Array.isArray(chunk.vector) ? chunk.vector : Array.from(chunk.vector),
            concepts: chunk.concepts || JSON.stringify([]),
            concept_ids: JSON.stringify(conceptIds),  // NEW: hash-based integers
            concept_categories: chunk.concept_categories || JSON.stringify([]),
            category_ids: chunk.category_ids || JSON.stringify([]),
            concept_density: chunk.concept_density || 0
        };
    });
    
    await db.dropTable('chunks');
    await db.createTable('chunks', updatedChunks, { mode: 'overwrite' });
    
    // Recreate index
    if (updatedChunks.length >= 256) {
        console.log(`  🔧 Recreating vector index...`);
        const chunksTableNew = await db.openTable('chunks');
        const numPartitions = Math.max(2, Math.floor(updatedChunks.length / 100));
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
    
    console.log(`  ✅ Chunks updated: ${chunkRows.length} chunks with concept_ids`);
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(80));
    console.log('✅ SCHEMA COMPLETION SUCCESSFUL');
    console.log(`   - Concepts: ${conceptRows.length} with hash-based integer IDs`);
    console.log(`   - Catalog: ${catalogRows.length} with concept_ids and reserved fields`);
    console.log(`   - Chunks: ${chunkRows.length} with concept_ids`);
    console.log(`   - Ready for validation`);
}

await completeSchema();

