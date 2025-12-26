#!/usr/bin/env npx tsx
/**
 * Populate meta content classification fields for existing chunks.
 * 
 * This script runs MetaContentDetector on all existing chunks and updates
 * the following fields:
 * - is_toc: True if chunk is from table of contents
 * - is_front_matter: True if chunk is from front matter (copyright, preface, etc.)
 * - is_back_matter: True if chunk is from back matter (index, glossary, etc.)
 * - is_meta_content: Aggregate flag (any of the above)
 * 
 * Usage: npx tsx scripts/populate-meta-content.ts [db_path]
 * Default db_path: ./db/test
 * 
 * @see ADR-0053 for design rationale
 */

import * as lancedb from '@lancedb/lancedb';
import { MetaContentDetector } from '../src/infrastructure/document-loaders/meta-content-detector.js';

function parseArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    return [];
}

async function main() {
    const dbPath = process.argv[2] || './db/test';
    
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
    
    // Build source -> total pages map for position-based detection
    const sourceTotalPagesMap = new Map<string, number>();
    for (const chunk of allChunks) {
        const source = chunk.catalog_title || '';
        const pageNum = chunk.page_number ?? 1;
        if (source) {
            const current = sourceTotalPagesMap.get(source) ?? 0;
            sourceTotalPagesMap.set(source, Math.max(current, pageNum));
        }
    }
    
    console.log(`📚 Found ${sourceTotalPagesMap.size} unique sources`);
    
    // Analyze each chunk with MetaContentDetector
    const metaDetector = new MetaContentDetector();
    let tocCount = 0;
    let frontCount = 0;
    let backCount = 0;
    let alreadySet = 0;
    const updatedChunks: any[] = [];
    
    for (const chunk of allChunks) {
        const source = chunk.catalog_title || '';
        const pageNumber = chunk.page_number ?? 1;
        const totalPages = sourceTotalPagesMap.get(source) ?? 100;
        const text = chunk.text || '';
        
        // Check if already classified
        const hasExisting = chunk.is_meta_content !== undefined && chunk.is_meta_content !== null;
        
        // Run detection
        const analysis = metaDetector.analyze(text, pageNumber, totalPages);
        
        if (hasExisting && chunk.is_meta_content === analysis.isMetaContent) {
            alreadySet++;
        }
        
        if (analysis.isToc) tocCount++;
        if (analysis.isFrontMatter) frontCount++;
        if (analysis.isBackMatter) backCount++;
        
        // Build updated record - preserve all existing fields
        const record: any = {
            id: chunk.id,
            text: chunk.text || '',
            hash: chunk.hash || '',
            catalog_id: chunk.catalog_id || 0,
            catalog_title: chunk.catalog_title || '',
            page_number: chunk.page_number || 1,
            concept_ids: parseArray(chunk.concept_ids),
            concept_names: parseArray(chunk.concept_names),
            concept_density: chunk.concept_density ?? 0,
            vector: parseArray(chunk.vector),
            // Existing classification fields (ADR-0046)
            is_reference: chunk.is_reference ?? false,
            has_extraction_issues: chunk.has_extraction_issues ?? false,
            has_math: chunk.has_math ?? false,
            // New meta content fields (ADR-0053)
            is_toc: analysis.isToc,
            is_front_matter: analysis.isFrontMatter,
            is_back_matter: analysis.isBackMatter,
            is_meta_content: analysis.isMetaContent
        };
        
        // Ensure arrays have placeholder values for LanceDB schema inference
        if (record.concept_ids.length === 0) record.concept_ids = [0];
        if (record.concept_names.length === 0) record.concept_names = [''];
        
        updatedChunks.push(record);
    }
    
    const metaTotal = tocCount + frontCount + backCount;
    console.log(`\n📑 Meta content detection results:`);
    console.log(`   • ${tocCount} ToC chunks`);
    console.log(`   • ${frontCount} front matter chunks`);
    console.log(`   • ${backCount} back matter chunks`);
    console.log(`   • ${metaTotal} total meta content chunks (${(metaTotal / allChunks.length * 100).toFixed(1)}%)`);
    console.log(`   • ${alreadySet} chunks already had correct classification`);
    
    if (metaTotal === 0 && alreadySet === allChunks.length) {
        console.log('\n✅ No meta content detected and all chunks already classified!');
        return;
    }
    
    // LanceDB doesn't support in-place updates, so we need to recreate the table
    console.log('\n🔄 Recreating chunks table with meta content fields...');
    
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
    
    // Show sample meta content chunks
    const metaChunks = await newTable.query()
        .where('is_meta_content = true')
        .limit(5)
        .toArray();
    
    if (metaChunks.length > 0) {
        console.log('\n📊 Sample meta content chunks:');
        for (const c of metaChunks) {
            const type = c.is_toc ? 'ToC' : c.is_front_matter ? 'Front' : 'Back';
            const preview = (c.text || '').substring(0, 80).replace(/\n/g, ' ');
            console.log(`   [${type}] ${preview}...`);
        }
    }
    
    console.log('\n✅ Done!');
}

main().catch(console.error);

