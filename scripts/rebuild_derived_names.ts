#!/usr/bin/env tsx
/**
 * Rebuild Derived Name Fields
 * 
 * This script regenerates all denormalized name fields in the database:
 * - chunks.concept_names from concept_ids → concepts.name
 * - catalog.concept_names from concept_ids → concepts.name
 * - catalog.category_names from category_ids → categories.category
 * - concepts.catalog_titles from catalog_ids → catalog.source
 * 
 * These are DERIVED fields for display and text search. They can be
 * regenerated at any time from the canonical ID fields.
 * 
 * See: .ai/planning/2025-11-28-schema-redesign/README.md
 * 
 * Usage:
 *   npx tsx scripts/rebuild_derived_names.ts [--dbpath <path>] [--table <table>]
 * 
 * Options:
 *   --dbpath <path>  Database path (default: ~/.concept_rag)
 *   --table <table>  Only rebuild specific table (chunks, catalog, concepts)
 *   --dry-run        Show what would be done without making changes
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import { homedir } from 'os';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const DB_PATH = argv['dbpath'] || path.join(homedir(), '.concept_rag');
const TARGET_TABLE = argv['table'] || 'all';
const DRY_RUN = argv['dry-run'] || false;

interface ConceptIdToNameMap {
    get(id: number): string | undefined;
}

interface CategoryIdToNameMap {
    get(id: number): string | undefined;
}

interface CatalogIdToSourceMap {
    get(id: number): string | undefined;
}

/**
 * Parse array field from LanceDB (handles native array, Arrow Vector, JSON string)
 */
function parseArrayField<T>(value: any): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * Build concept ID → name mapping from concepts table
 */
async function buildConceptIdToNameMap(db: lancedb.Connection): Promise<Map<number, string>> {
    console.log("  📚 Loading concepts table...");
    const conceptsTable = await db.openTable('concepts');
    const concepts = await conceptsTable.query().limit(200000).toArray();
    
    const map = new Map<number, string>();
    for (const c of concepts) {
        const id = typeof c.id === 'number' ? c.id : parseInt(c.id, 10);
        const name = c.name || c.concept || '';
        if (id && name) {
            map.set(id, name);
        }
    }
    
    console.log(`  ✅ Loaded ${map.size} concepts`);
    return map;
}

/**
 * Build category ID → name mapping from categories table
 */
async function buildCategoryIdToNameMap(db: lancedb.Connection): Promise<Map<number, string>> {
    console.log("  📚 Loading categories table...");
    try {
        const categoriesTable = await db.openTable('categories');
        const categories = await categoriesTable.query().limit(10000).toArray();
        
        const map = new Map<number, string>();
        for (const c of categories) {
            const id = typeof c.id === 'number' ? c.id : parseInt(c.id, 10);
            const name = c.category || '';
            if (id && name) {
                map.set(id, name);
            }
        }
        
        console.log(`  ✅ Loaded ${map.size} categories`);
        return map;
    } catch (e) {
        console.log("  ⚠️  Categories table not found, skipping category name resolution");
        return new Map();
    }
}

/**
 * Build catalog ID → source path mapping from catalog table
 */
async function buildCatalogIdToSourceMap(db: lancedb.Connection): Promise<Map<number, string>> {
    console.log("  📚 Loading catalog table...");
    const catalogTable = await db.openTable('catalog');
    const catalog = await catalogTable.query().limit(100000).toArray();
    
    const map = new Map<number, string>();
    for (const c of catalog) {
        const id = typeof c.id === 'number' ? c.id : parseInt(c.id, 10);
        const source = c.source || '';
        if (id && source) {
            map.set(id, source);
        }
    }
    
    console.log(`  ✅ Loaded ${map.size} catalog entries`);
    return map;
}

/**
 * Rebuild concept_names in chunks table
 */
async function rebuildChunksConceptNames(
    db: lancedb.Connection,
    conceptIdToName: ConceptIdToNameMap,
    dryRun: boolean
): Promise<number> {
    console.log("\n📦 Rebuilding chunks.concept_names...");
    
    const chunksTable = await db.openTable('chunks');
    const chunks = await chunksTable.query().limit(1000000).toArray();
    console.log(`  📊 Processing ${chunks.length} chunks...`);
    
    let updatedCount = 0;
    const batchSize = 5000;
    const updates: any[] = [];
    
    for (const chunk of chunks) {
        const conceptIds = parseArrayField<number>(chunk.concept_ids);
        
        // Resolve concept IDs to names
        const conceptNames = conceptIds
            .map(id => conceptIdToName.get(id))
            .filter((name): name is string => name !== undefined);
        
        // Check if update is needed
        const existingNames = parseArrayField<string>(chunk.concept_names);
        const needsUpdate = JSON.stringify(conceptNames.sort()) !== JSON.stringify(existingNames.sort());
        
        if (needsUpdate) {
            updatedCount++;
            if (!dryRun) {
                updates.push({
                    ...chunk,
                    concept_names: conceptNames.length > 0 ? conceptNames : ['']
                });
            }
        }
        
        // Process in batches
        if (updates.length >= batchSize) {
            console.log(`  🔄 Updating batch of ${updates.length} chunks...`);
            // Delete and re-add (LanceDB doesn't support in-place updates well)
            for (const u of updates) {
                await chunksTable.delete(`id = ${u.id}`);
            }
            await chunksTable.add(updates);
            updates.length = 0;
        }
    }
    
    // Process remaining updates
    if (updates.length > 0 && !dryRun) {
        console.log(`  🔄 Updating final batch of ${updates.length} chunks...`);
        for (const u of updates) {
            await chunksTable.delete(`id = ${u.id}`);
        }
        await chunksTable.add(updates);
    }
    
    console.log(`  ✅ ${dryRun ? 'Would update' : 'Updated'} ${updatedCount} chunks`);
    return updatedCount;
}

/**
 * Rebuild concept_names and category_names in catalog table
 */
async function rebuildCatalogDerivedNames(
    db: lancedb.Connection,
    conceptIdToName: ConceptIdToNameMap,
    categoryIdToName: CategoryIdToNameMap,
    dryRun: boolean
): Promise<number> {
    console.log("\n📄 Rebuilding catalog.concept_names and catalog.category_names...");
    
    const catalogTable = await db.openTable('catalog');
    const catalog = await catalogTable.query().limit(100000).toArray();
    console.log(`  📊 Processing ${catalog.length} catalog entries...`);
    
    let updatedCount = 0;
    const updates: any[] = [];
    
    for (const doc of catalog) {
        const conceptIds = parseArrayField<number>(doc.concept_ids);
        const categoryIds = parseArrayField<number>(doc.category_ids);
        
        // Resolve concept IDs to names
        const conceptNames = conceptIds
            .map(id => conceptIdToName.get(id))
            .filter((name): name is string => name !== undefined);
        
        // Resolve category IDs to names
        const categoryNames = categoryIds
            .map(id => categoryIdToName.get(id))
            .filter((name): name is string => name !== undefined);
        
        // Check if update is needed
        const existingConceptNames = parseArrayField<string>(doc.concept_names);
        const existingCategoryNames = parseArrayField<string>(doc.category_names);
        
        const conceptNamesChanged = JSON.stringify(conceptNames.sort()) !== JSON.stringify(existingConceptNames.sort());
        const categoryNamesChanged = JSON.stringify(categoryNames.sort()) !== JSON.stringify(existingCategoryNames.sort());
        
        if (conceptNamesChanged || categoryNamesChanged) {
            updatedCount++;
            if (!dryRun) {
                updates.push({
                    ...doc,
                    concept_names: conceptNames.length > 0 ? conceptNames : [''],
                    category_names: categoryNames.length > 0 ? categoryNames : ['']
                });
            }
        }
    }
    
    // Apply updates
    if (updates.length > 0 && !dryRun) {
        console.log(`  🔄 Updating ${updates.length} catalog entries...`);
        for (const u of updates) {
            await catalogTable.delete(`id = ${u.id}`);
        }
        await catalogTable.add(updates);
    }
    
    console.log(`  ✅ ${dryRun ? 'Would update' : 'Updated'} ${updatedCount} catalog entries`);
    return updatedCount;
}

/**
 * Rebuild catalog_titles in concepts table
 */
async function rebuildConceptsCatalogTitles(
    db: lancedb.Connection,
    catalogIdToSource: CatalogIdToSourceMap,
    dryRun: boolean
): Promise<number> {
    console.log("\n🧠 Rebuilding concepts.catalog_titles...");
    
    const conceptsTable = await db.openTable('concepts');
    const concepts = await conceptsTable.query().limit(200000).toArray();
    console.log(`  📊 Processing ${concepts.length} concepts...`);
    
    let updatedCount = 0;
    const batchSize = 5000;
    const updates: any[] = [];
    
    for (const concept of concepts) {
        const catalogIds = parseArrayField<number>(concept.catalog_ids);
        
        // Resolve catalog IDs to source paths (titles)
        const catalogTitles = catalogIds
            .map(id => catalogIdToSource.get(id))
            .filter((source): source is string => source !== undefined);
        
        // Check if update is needed
        const existingTitles = parseArrayField<string>(concept.catalog_titles);
        const needsUpdate = JSON.stringify(catalogTitles.sort()) !== JSON.stringify(existingTitles.sort());
        
        if (needsUpdate) {
            updatedCount++;
            if (!dryRun) {
                updates.push({
                    ...concept,
                    catalog_titles: catalogTitles.length > 0 ? catalogTitles : ['']
                });
            }
        }
        
        // Process in batches
        if (updates.length >= batchSize) {
            console.log(`  🔄 Updating batch of ${updates.length} concepts...`);
            for (const u of updates) {
                await conceptsTable.delete(`id = ${u.id}`);
            }
            await conceptsTable.add(updates);
            updates.length = 0;
        }
    }
    
    // Process remaining updates
    if (updates.length > 0 && !dryRun) {
        console.log(`  🔄 Updating final batch of ${updates.length} concepts...`);
        for (const u of updates) {
            await conceptsTable.delete(`id = ${u.id}`);
        }
        await conceptsTable.add(updates);
    }
    
    console.log(`  ✅ ${dryRun ? 'Would update' : 'Updated'} ${updatedCount} concepts`);
    return updatedCount;
}

async function main() {
    console.log("🔧 Rebuild Derived Name Fields\n");
    console.log(`📂 Database: ${DB_PATH}`);
    console.log(`📋 Target: ${TARGET_TABLE}`);
    console.log(`🔍 Dry run: ${DRY_RUN}\n`);
    
    const db = await lancedb.connect(DB_PATH);
    
    // Build lookup maps
    console.log("📚 Building lookup maps...\n");
    const conceptIdToName = await buildConceptIdToNameMap(db);
    const categoryIdToName = await buildCategoryIdToNameMap(db);
    const catalogIdToSource = await buildCatalogIdToSourceMap(db);
    
    let totalUpdated = 0;
    
    // Rebuild each table's derived fields
    if (TARGET_TABLE === 'all' || TARGET_TABLE === 'chunks') {
        totalUpdated += await rebuildChunksConceptNames(db, conceptIdToName, DRY_RUN);
    }
    
    if (TARGET_TABLE === 'all' || TARGET_TABLE === 'catalog') {
        totalUpdated += await rebuildCatalogDerivedNames(db, conceptIdToName, categoryIdToName, DRY_RUN);
    }
    
    if (TARGET_TABLE === 'all' || TARGET_TABLE === 'concepts') {
        totalUpdated += await rebuildConceptsCatalogTitles(db, catalogIdToSource, DRY_RUN);
    }
    
    console.log(`\n🎉 Derived names rebuild completed!`);
    console.log(`   Total records ${DRY_RUN ? 'that would be' : ''} updated: ${totalUpdated}`);
    
    if (DRY_RUN) {
        console.log(`\n💡 Run without --dry-run to apply changes.`);
    }
}

main().catch((error) => {
    console.error("❌ Rebuild failed:", error);
    process.exit(1);
});

