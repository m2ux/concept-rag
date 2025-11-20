/**
 * Compare Actual Schema vs Planned Schema
 * 
 * Comprehensive validation of database schema against planning documents
 */

import { connect } from '@lancedb/lancedb';

async function compareSchema() {
    console.log('\n📋 SCHEMA COMPARISON: ACTUAL vs PLANNED');
    console.log('='.repeat(80));
    
    const dbPath = `${process.env.HOME}/.concept_rag_test`;
    const db = await connect(dbPath);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // ========== CATALOG TABLE ==========
    console.log('\n📄 CATALOG TABLE');
    console.log('-'.repeat(80));
    
    const catalogTable = await db.openTable('catalog');
    const catalogSample = (await catalogTable.query().limit(1).toArray())[0];
    const catalogFields = Object.keys(catalogSample);
    
    console.log('Actual fields:', catalogFields.join(', '));
    
    const requiredCatalogFields = [
        'id', 'text', 'source', 'hash', 'loc', 'vector',
        'concept_ids', 'category_ids', 'filename_tags',
        'origin_hash', 'author', 'year', 'publisher', 'isbn'
    ];
    
    requiredCatalogFields.forEach(field => {
        if (field in catalogSample) {
            console.log(`  ✅ ${field}`);
        } else if (['origin_hash', 'author', 'year', 'publisher', 'isbn', 'filename_tags'].includes(field)) {
            console.log(`  ⚠️  ${field} (reserved for future)`);
            warnings.push(`Catalog missing ${field} (reserved field)`);
        } else {
            console.log(`  ❌ ${field} MISSING`);
            issues.push(`Catalog missing required field: ${field}`);
        }
    });
    
    // Check concept_ids type
    if ('concept_ids' in catalogSample && catalogSample.concept_ids) {
        const conceptIds = JSON.parse(catalogSample.concept_ids);
        console.log(`\n  concept_ids check:`);
        console.log(`    - Is array: ${Array.isArray(conceptIds)}`);
        console.log(`    - Length: ${conceptIds.length}`);
        if (conceptIds.length > 0) {
            console.log(`    - First element type: ${typeof conceptIds[0]}`);
            if (typeof conceptIds[0] !== 'number') {
                issues.push('Catalog concept_ids should contain integers, not strings');
            } else {
                console.log(`    ✅ Contains integer IDs`);
            }
        }
    }
    
    // Check category_ids type
    if ('category_ids' in catalogSample && catalogSample.category_ids) {
        const categoryIds = JSON.parse(catalogSample.category_ids);
        console.log(`\n  category_ids check:`);
        console.log(`    - Is array: ${Array.isArray(categoryIds)}`);
        console.log(`    - Length: ${categoryIds.length}`);
        if (categoryIds.length > 0) {
            console.log(`    - First element type: ${typeof categoryIds[0]}`);
            if (typeof categoryIds[0] !== 'number') {
                issues.push('Catalog category_ids should contain integers, not strings');
            } else {
                console.log(`    ✅ Contains integer IDs`);
            }
        }
    }
    
    // ========== CHUNKS TABLE ==========
    console.log('\n\n📝 CHUNKS TABLE');
    console.log('-'.repeat(80));
    
    const chunksTable = await db.openTable('chunks');
    const chunkSample = (await chunksTable.query().limit(1).toArray())[0];
    const chunkFields = Object.keys(chunkSample);
    
    console.log('Actual fields:', chunkFields.join(', '));
    
    const requiredChunkFields = [
        'id', 'text', 'source', 'hash', 'loc', 'vector',
        'concept_ids', 'category_ids', 'concept_density'
    ];
    
    requiredChunkFields.forEach(field => {
        if (field in chunkSample) {
            console.log(`  ✅ ${field}`);
        } else {
            console.log(`  ❌ ${field} MISSING`);
            issues.push(`Chunks missing required field: ${field}`);
        }
    });
    
    // Check concept_ids on chunks
    if ('concept_ids' in chunkSample && chunkSample.concept_ids) {
        const conceptIds = JSON.parse(chunkSample.concept_ids);
        console.log(`\n  concept_ids check:`);
        console.log(`    - Is array: ${Array.isArray(conceptIds)}`);
        if (conceptIds.length > 0) {
            console.log(`    - Length: ${conceptIds.length}`);
            console.log(`    - First element type: ${typeof conceptIds[0]}`);
            if (typeof conceptIds[0] !== 'number') {
                issues.push('Chunks concept_ids should contain integers, not strings');
            } else {
                console.log(`    ✅ Contains integer IDs`);
            }
        }
    }
    
    // ========== CONCEPTS TABLE ==========
    console.log('\n\n🧠 CONCEPTS TABLE');
    console.log('-'.repeat(80));
    
    const conceptsTable = await db.openTable('concepts');
    const conceptSample = (await conceptsTable.query().limit(1).toArray())[0];
    const conceptFields = Object.keys(conceptSample);
    
    console.log('Actual fields:', conceptFields.join(', '));
    
    // Check ID type (CRITICAL)
    console.log(`\n  ⚠️  CRITICAL: Concept ID type check:`);
    console.log(`    - ID value: ${conceptSample.id}`);
    console.log(`    - ID type: ${typeof conceptSample.id}`);
    
    if (typeof conceptSample.id !== 'number') {
        issues.push('❌ CRITICAL: Concepts.id should be NUMBER (hash-based), not string!');
        console.log(`    ❌ WRONG: Should be number (hash-based), is ${typeof conceptSample.id}`);
    } else {
        console.log(`    ✅ Correct: ID is number (hash-based)`);
    }
    
    // Check catalog_ids type
    if ('catalog_ids' in conceptSample && conceptSample.catalog_ids) {
        const catalogIds = JSON.parse(conceptSample.catalog_ids);
        console.log(`\n  catalog_ids check:`);
        console.log(`    - Is array: ${Array.isArray(catalogIds)}`);
        if (catalogIds.length > 0) {
            console.log(`    - Length: ${catalogIds.length}`);
            console.log(`    - First element type: ${typeof catalogIds[0]}`);
            if (typeof catalogIds[0] !== 'number') {
                issues.push('Concepts catalog_ids should contain integers, not strings');
            } else {
                console.log(`    ✅ Contains integer IDs`);
            }
        }
    }
    
    // Check for category_id field (should NOT exist)
    if ('category_id' in conceptSample) {
        issues.push('Concepts should NOT have category_id field');
        console.log(`  ❌ Has category_id field (should be category-agnostic)`);
    } else {
        console.log(`  ✅ NO category_id field (concepts are category-agnostic)`);
    }
    
    // ========== CATEGORIES TABLE ==========
    console.log('\n\n📊 CATEGORIES TABLE');
    console.log('-'.repeat(80));
    
    const categoriesTable = await db.openTable('categories');
    const categorySample = (await categoriesTable.query().limit(1).toArray())[0];
    
    console.log('Actual fields:', Object.keys(categorySample).join(', '));
    
    console.log(`\n  Category ID type check:`);
    console.log(`    - ID value: ${categorySample.id}`);
    console.log(`    - ID type: ${typeof categorySample.id}`);
    
    if (typeof categorySample.id !== 'number') {
        issues.push('Categories.id should be number (hash-based)');
    } else {
        console.log(`    ✅ ID is number (hash-based)`);
    }
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(80));
    console.log('SCHEMA COMPARISON SUMMARY');
    console.log('='.repeat(80));
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ Schema matches plan perfectly!');
    } else {
        if (issues.length > 0) {
            console.log(`\n❌ CRITICAL ISSUES (${issues.length}):`);
            issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
            warnings.forEach(warning => console.log(`   - ${warning}`));
        }
    }
}

await compareSchema();

