#!/usr/bin/env node
/**
 * Refresh ConceptIdCache from existing database
 * 
 * This script reloads all concepts from the database into the ConceptIdCache.
 * Useful after fixing bugs or when the cache needs to be refreshed without
 * re-running the full seeding process.
 */

import * as lancedb from '@lancedb/lancedb';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache.js';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { CONCEPTS_TABLE_NAME, DATABASE_URL } from '../src/config.js';
import * as path from 'path';
import * as os from 'os';

async function refreshConceptCache() {
  // Resolve database path (expand ~ to home directory)
  const dbPath = DATABASE_URL.startsWith('~')
    ? DATABASE_URL.replace('~', os.homedir())
    : DATABASE_URL;

  console.log('🔄 Refreshing ConceptIdCache...');
  console.log(`📁 Database: ${dbPath}`);
  console.log(`📊 Table: ${CONCEPTS_TABLE_NAME}\n`);

  try {
    // Connect to database
    const db = await lancedb.connect(dbPath);
    
    // Open concepts table
    const conceptsTable = await db.openTable(CONCEPTS_TABLE_NAME);
    
    // Create repository
    const conceptRepo = new LanceDBConceptRepository(conceptsTable);
    
    // Get cache instance and clear it
    const cache = ConceptIdCache.getInstance();
    if (cache.isInitialized()) {
      console.log('🗑️  Clearing existing cache...');
      cache.clear();
    }
    
    // Reinitialize cache
    console.log('📥 Loading concepts from database...');
    await cache.initialize(conceptRepo);
    
    // Show stats
    const stats = cache.getStats();
    console.log('\n✅ Cache refreshed successfully!');
    console.log(`   Concepts loaded: ${stats.conceptCount}`);
    console.log(`   Memory estimate: ~${Math.round(stats.memorySizeEstimate / 1024)}KB`);
    if (stats.lastUpdated) {
      console.log(`   Last updated: ${stats.lastUpdated.toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

await refreshConceptCache();

