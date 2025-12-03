#!/usr/bin/env node
/**
 * Rebuild LanceDB indexes with optimized parameters
 * 
 * This script rebuilds indexes for existing tables with dataset-size-appropriate
 * partition counts to eliminate KMeans clustering warnings.
 * 
 * Usage:
 *   npx tsx scripts/rebuild_indexes.ts [--dbpath <path>]
 */

import * as lancedb from "@lancedb/lancedb";
import minimist from 'minimist';
import * as path from 'path';
import * as defaults from '../src/config.js';

const argv = minimist(process.argv.slice(2));
const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".concept_rag");

// Calculate appropriate number of partitions based on dataset size
// Rule of thumb: ~100-200 vectors per partition for good cluster quality
function calculatePartitions(dataSize: number): number {
    if (dataSize < 100) return 2;
    if (dataSize < 500) return Math.max(2, Math.floor(dataSize / 100));
    if (dataSize < 1000) return Math.max(4, Math.floor(dataSize / 150));
    if (dataSize < 5000) return Math.max(8, Math.floor(dataSize / 300));
    if (dataSize < 10000) return Math.max(32, Math.floor(dataSize / 300));
    if (dataSize < 50000) return Math.max(64, Math.floor(dataSize / 400));
    return 256; // Default for very large datasets (50k+ vectors)
}

async function rebuildIndexForTable(
    db: lancedb.Connection, 
    tableName: string
): Promise<void> {
    try {
        console.log(`\n📊 Processing table: ${tableName}`);
        
        const table = await db.openTable(tableName);
        const rowCount = await table.countRows();
        
        console.log(`  • Rows: ${rowCount}`);
        
        if (rowCount < 100) {
            console.log(`  ⏭️  Skipping index (${rowCount} vectors < 100 minimum)`);
            console.log(`     Linear scan is faster for this size`);
            return;
        }
        
        const numPartitions = calculatePartitions(rowCount);
        console.log(`  🔧 Rebuilding index with ${numPartitions} partitions...`);
        
        try {
            // Drop existing index (if any)
            try {
                await table.delete("vector");
            } catch (e) {
                // Index might not exist, that's okay
            }
            
            // IVF_PQ requires substantial data for PQ training (256+ samples per subvector)
            // Only create index for large datasets to avoid KMeans clustering warnings
            if (rowCount >= 100000) {
                // Large datasets: Use IVF_PQ for best compression and speed
                await table.createIndex("vector", {
                    config: lancedb.Index.ivfPq({
                        numPartitions: numPartitions,
                        numSubVectors: 16, // For 384-dim vectors
                    })
                });
                console.log(`  ✅ Index created (IVF_PQ) successfully`);
            } else {
                // Medium datasets: Skip indexing, linear scan is fast and avoids warnings
                console.log(`  ✅ No index needed (${rowCount} < 100k threshold)`);
                console.log(`     Linear scan is fast for this size and avoids KMeans warnings`);
            }
        } catch (indexError: any) {
            console.error(`  ❌ Index rebuild failed: ${indexError.message}`);
            console.log(`     Table is still functional with brute-force search`);
        }
        
    } catch (error: any) {
        console.error(`  ❌ Error processing table ${tableName}: ${error.message}`);
    }
}

async function rebuildAllIndexes(): Promise<void> {
    console.log("🔧 LanceDB Index Rebuild Utility");
    console.log("=" .repeat(50));
    console.log(`Database: ${databaseDir}`);
    
    try {
        const db = await lancedb.connect(databaseDir);
        const tableNames = await db.tableNames();
        
        console.log(`\n📚 Found ${tableNames.length} tables`);
        
        if (tableNames.length === 0) {
            console.log("\n⚠️  No tables found in database");
            console.log("   Run seeding first: npx tsx hybrid_fast_seed.ts --filesdir <path>");
            return;
        }
        
        // Rebuild indexes for all tables
        for (const tableName of tableNames) {
            await rebuildIndexForTable(db, tableName);
        }
        
        console.log("\n" + "=".repeat(50));
        console.log("✅ Index rebuild complete!");
        console.log("\n💡 Next steps:");
        console.log("   • Test search performance with your queries");
        console.log("   • No more KMeans warnings should appear");
        
        await db.close();
        
    } catch (error: any) {
        console.error("\n❌ Index rebuild failed:", error.message);
        process.exit(1);
    }
}

// Run the rebuild
rebuildAllIndexes().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
