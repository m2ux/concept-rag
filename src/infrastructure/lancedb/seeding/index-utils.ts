/**
 * LanceDB Index Utilities
 * 
 * Utilities for creating and optimizing vector indexes on LanceDB tables.
 */

import * as lancedb from '@lancedb/lancedb';

/**
 * Calculate optimal number of partitions based on dataset size.
 * 
 * Rule of thumb: ~100-200 vectors per partition for good cluster quality.
 * 
 * @param dataSize - Number of vectors in the dataset
 * @returns Recommended number of partitions
 */
export function calculatePartitions(dataSize: number): number {
  if (dataSize < 100) return 2;
  if (dataSize < 500) return Math.max(2, Math.floor(dataSize / 100));
  if (dataSize < 1000) return Math.max(4, Math.floor(dataSize / 150));
  if (dataSize < 5000) return Math.max(8, Math.floor(dataSize / 300));
  if (dataSize < 10000) return Math.max(32, Math.floor(dataSize / 300));
  if (dataSize < 50000) return Math.max(64, Math.floor(dataSize / 400));
  return 256; // Default for very large datasets (50k+ vectors)
}

/**
 * Minimum dataset size required for IVF_PQ index creation.
 * Below this threshold, brute-force search is used instead.
 */
export const MIN_VECTORS_FOR_INDEX = 256;

/**
 * Create an optimized IVF_PQ vector index on a LanceDB table.
 * 
 * IVF_PQ (Inverted File with Product Quantization) provides good recall
 * with significantly reduced memory footprint and faster searches.
 * 
 * @param table - LanceDB table to create index on
 * @param dataSize - Number of vectors in the table
 * @param numPartitions - Number of partitions for IVF
 * @param tableName - Name of the table (for logging)
 * @param options - Optional configuration
 * @param options.numSubVectors - Number of sub-vectors for PQ (default: 16 for 384-dim)
 * @param options.silent - Suppress console output
 */
export async function createOptimizedIndex(
  table: lancedb.Table,
  dataSize: number,
  numPartitions: number,
  tableName: string,
  options: {
    numSubVectors?: number;
    silent?: boolean;
  } = {}
): Promise<void> {
  const { numSubVectors = 16, silent = false } = options;
  
  try {
    // IVF_PQ requires at least 256 rows for PQ training
    if (dataSize < MIN_VECTORS_FOR_INDEX) {
      if (!silent) {
        console.log(`⏭️  Skipping index - dataset too small (${dataSize} < ${MIN_VECTORS_FOR_INDEX})`);
      }
      return;
    }
    
    if (!silent) {
      console.log(`🔧 Creating optimized index for ${tableName} (${dataSize} vectors, ${numPartitions} partitions)...`);
    }
    
    await table.createIndex("vector", {
      config: lancedb.Index.ivfPq({
        numPartitions: numPartitions,
        numSubVectors: numSubVectors,
      })
    });
    
    if (!silent) {
      console.log(`✅ Index created (IVF_PQ) successfully`);
    }
  } catch (error: any) {
    // If index creation fails, log warning but continue (table is still usable without index)
    if (!silent) {
      console.warn(`⚠️  Index creation failed: ${error.message}`);
      console.warn(`   Table is still functional, searches will use brute-force (slower but accurate)`);
    }
  }
}

/**
 * Conditionally create an index if the dataset is large enough.
 * 
 * @param table - LanceDB table
 * @param dataSize - Number of vectors
 * @param tableName - Table name for logging
 * @param options - Optional configuration
 */
export async function createIndexIfNeeded(
  table: lancedb.Table,
  dataSize: number,
  tableName: string,
  options: { silent?: boolean } = {}
): Promise<void> {
  if (dataSize >= MIN_VECTORS_FOR_INDEX) {
    const numPartitions = calculatePartitions(dataSize);
    await createOptimizedIndex(table, dataSize, numPartitions, tableName, options);
  } else if (!options.silent) {
    console.log(`⏭️  Skipping index creation (${dataSize} vectors < ${MIN_VECTORS_FOR_INDEX} minimum for IVF_PQ)`);
  }
}


