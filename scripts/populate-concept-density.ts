#!/usr/bin/env npx tsx
/**
 * Populate concept_density for existing chunks without re-seeding.
 * Formula: concept_ids.length / (word_count / 10)
 */

import * as lancedb from '@lancedb/lancedb';

function parseArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    return [];
}

async function main() {
    const dbPath = process.argv[2] || './test_db';
    
    console.log(`📂 Database: ${dbPath}`);
    
    const db = await lancedb.connect(dbPath);
    const tables = await db.tableNames();
    
    if (!tables.includes('chunks')) {
        console.error('❌ No chunks table found.');
        process.exit(1);
    }
    
    const chunksTable = await db.openTable('chunks');
    const allChunks = await chunksTable.query().limit(100000).toArray();
    
    console.log(`📊 Found ${allChunks.length} chunks`);
    
    // Calculate concept_density for each chunk
    let updated = 0;
    let alreadySet = 0;
    const updatedChunks: any[] = [];
    
    for (const chunk of allChunks) {
        const conceptIds = parseArray(chunk.concept_ids).filter((id: number) => id !== 0);
        const text = chunk.text || '';
        const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
        
        // Calculate density: concepts per 10 words
        const density = wordCount > 0 ? conceptIds.length / (wordCount / 10) : 0;
        
        // Check if already set
        if (chunk.concept_density !== undefined && chunk.concept_density !== null && chunk.concept_density !== 0) {
            alreadySet++;
        } else {
            updated++;
        }
        
        // Build updated record - convert Arrow vectors to regular arrays
        const record: any = {
            id: chunk.id,
            text: chunk.text || '',
            hash: chunk.hash || '',
            catalog_id: chunk.catalog_id || 0,
            catalog_title: chunk.catalog_title || '',
            page_number: chunk.page_number || 1,
            concept_ids: parseArray(chunk.concept_ids),
            concept_names: parseArray(chunk.concept_names),
            concept_density: density,
            vector: parseArray(chunk.vector)
        };
        
        // Ensure arrays have placeholder values for LanceDB schema inference
        if (record.concept_ids.length === 0) record.concept_ids = [0];
        if (record.concept_names.length === 0) record.concept_names = [''];
        
        updatedChunks.push(record);
    }
    
    console.log(`📈 Calculating concept_density...`);
    console.log(`   • ${updated} chunks need updating`);
    console.log(`   • ${alreadySet} chunks already had density set`);
    
    if (updated === 0 && alreadySet === allChunks.length) {
        console.log('✅ All chunks already have concept_density set!');
        return;
    }
    
    // LanceDB doesn't support in-place updates, so we need to recreate the table
    console.log('🔄 Recreating chunks table with concept_density...');
    
    // Drop and recreate
    await db.dropTable('chunks');
    await db.createTable('chunks', updatedChunks, { mode: 'create' });
    
    // Recreate index if table is large enough
    const newTable = await db.openTable('chunks');
    const count = await newTable.countRows();
    if (count >= 256) {
        console.log('🔧 Recreating vector index...');
        const numPartitions = Math.max(1, Math.floor(Math.sqrt(count)));
        await newTable.createIndex('vector', {
            config: lancedb.Index.ivfPq({
                numPartitions,
                numSubVectors: 16
            })
        });
        console.log(`✅ Index created with ${numPartitions} partitions`);
    }
    
    // Show sample densities
    const samples = await newTable.query().limit(10).toArray();
    console.log('\n📊 Sample concept densities:');
    for (const s of samples.slice(0, 5)) {
        const concepts = parseArray(s.concept_ids).filter((id: number) => id !== 0).length;
        const words = (s.text || '').split(/\s+/).length;
        console.log(`   • ${concepts} concepts in ${words} words = density ${s.concept_density?.toFixed(3) || 0}`);
    }
    
    // Show distribution
    const densities = samples.map(s => s.concept_density || 0);
    const avgDensity = densities.reduce((a, b) => a + b, 0) / densities.length;
    console.log(`\n📈 Average density (sample): ${avgDensity.toFixed(3)}`);
    
    console.log('\n✅ Done!');
}

main().catch(console.error);
