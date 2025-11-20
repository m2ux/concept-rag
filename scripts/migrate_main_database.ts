/**
 * Migrate Main Database to Category Search Schema
 * 
 * Runs complete migration on main database using proven scripts
 */

import { execSync } from 'child_process';

const MAIN_DB = `${process.env.HOME}/.concept_rag`;

async function migrateMainDatabase() {
    console.log('\n🚀 MAIN DATABASE MIGRATION');
    console.log('='.repeat(80));
    console.log(`Database: ${MAIN_DB}`);
    console.log('='.repeat(80));
    
    // Step 1: Add concept_ids and update concepts table
    console.log('\n📊 Step 1/2: Adding concept_ids and fixing concepts table...');
    console.log('-'.repeat(80));
    
    const completeSchema = await import('./complete_test_db_schema.js');
    // The script will run on MAIN_DB
    process.env.DB_PATH = MAIN_DB;
    
    // Import and run the completion function
    const { connect } = await import('@lancedb/lancedb');
    const { hashToId } = await import('../src/infrastructure/utils/hash.js');
    
    const db = await connect(MAIN_DB);
    
    // Update concepts table
    console.log('\n  🧠 Updating concepts table...');
    const conceptsTable = await db.openTable('concepts');
    const conceptRows = await conceptsTable.query().limit(100000).toArray();
    console.log(`    Processing ${conceptRows.length} concepts...`);
    
    const updatedConcepts = conceptRows.map((row: any) => {
        const conceptId = hashToId(row.concept);
        let catalogIds: number[] = [];
        if (row.sources) {
            try {
                const sources: string[] = JSON.parse(row.sources);
                catalogIds = sources.map(source => hashToId(source));
            } catch (e) {}
        }
        
        return {
            id: conceptId,
            concept: row.concept,
            concept_type: row.concept_type,
            category: row.category || '',
            sources: row.sources,
            catalog_ids: JSON.stringify(catalogIds),
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
    console.log(`    ✅ Concepts updated: ${conceptRows.length} with hash-based IDs`);
    
    // Update catalog table
    console.log('\n  📄 Updating catalog table...');
    const catalogTable = await db.openTable('catalog');
    const catalogRows = await catalogTable.query().limit(10000).toArray();
    console.log(`    Processing ${catalogRows.length} catalog entries...`);
    
    const updatedCatalog = catalogRows.map((row: any) => {
        let conceptIds: number[] = [];
        if (row.concepts) {
            try {
                const concepts = JSON.parse(row.concepts);
                const conceptNames = concepts.primary_concepts || [];
                conceptIds = conceptNames.map((name: string) => hashToId(name));
            } catch (e) {}
        }
        
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
            concept_ids: JSON.stringify(conceptIds),
            concept_categories: row.concept_categories || JSON.stringify([]),
            category_ids: row.category_ids || JSON.stringify([]),
            filename_tags: JSON.stringify(filenameTags),
            origin_hash: '',
            author: '',
            year: '',
            publisher: '',
            isbn: ''
        };
    });
    
    await db.dropTable('catalog');
    await db.createTable('catalog', updatedCatalog, { mode: 'overwrite' });
    console.log(`    ✅ Catalog updated: ${catalogRows.length} entries`);
    
    // Update chunks table
    console.log('\n  📝 Updating chunks table...');
    const chunksTable = await db.openTable('chunks');
    const chunkRows = await chunksTable.query().limit(200000).toArray();
    console.log(`    Processing ${chunkRows.length} chunks...`);
    
    const updatedChunks = chunkRows.map((chunk: any) => {
        let conceptIds: number[] = [];
        if (chunk.concepts) {
            try {
                const concepts = JSON.parse(chunk.concepts);
                if (Array.isArray(concepts)) {
                    conceptIds = concepts.map((name: string) => hashToId(name));
                }
            } catch (e) {}
        }
        
        return {
            id: chunk.id,
            text: chunk.text,
            source: chunk.source,
            hash: chunk.hash,
            loc: chunk.loc,
            vector: Array.isArray(chunk.vector) ? chunk.vector : Array.from(chunk.vector),
            concepts: chunk.concepts || JSON.stringify([]),
            concept_ids: JSON.stringify(conceptIds),
            concept_categories: chunk.concept_categories || JSON.stringify([]),
            category_ids: chunk.category_ids || JSON.stringify([]),
            concept_density: chunk.concept_density || 0
        };
    });
    
    await db.dropTable('chunks');
    console.log(`    Creating chunks table with ${updatedChunks.length} rows...`);
    await db.createTable('chunks', updatedChunks, { mode: 'overwrite' });
    
    if (updatedChunks.length >= 256) {
        console.log(`    🔧 Recreating vector index...`);
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
            console.log(`    ✅ Index created`);
        } catch (e: any) {
            console.warn(`    ⚠️  Index creation: ${e.message}`);
        }
    }
    
    console.log(`    ✅ Chunks updated: ${chunkRows.length}`);
    
    console.log('\n✅ Step 1/2 Complete: concept_ids added to all tables');
    
    // Step 2: Add categories table and category_ids
    console.log('\n📊 Step 2/2: Creating categories table and adding category_ids...');
    console.log('-'.repeat(80));
    
    execSync(`npx tsx scripts/add_categories_to_test_db.ts --db-path ${MAIN_DB}`, {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
}

await migrateMainDatabase();

