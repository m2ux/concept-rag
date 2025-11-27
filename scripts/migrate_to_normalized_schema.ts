#!/usr/bin/env npx tsx
/**
 * Migration Script: Legacy Schema → Normalized Schema
 * 
 * Transforms:
 * - Catalog: Remove concepts blob, concept_categories, loc, filename_tags
 * - Chunks:  Remove concepts, concept_categories, concept_density
 * - Concepts: Remove sources, category, concept_type, chunk_count, enrichment_source
 *             Change related_concepts → related_concept_ids
 * 
 * Usage:
 *   npx tsx scripts/migrate_to_normalized_schema.ts [db-path]
 *   npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag_test
 */

import { connect } from '@lancedb/lancedb';
import * as path from 'path';
import { hashToId } from '../src/infrastructure/utils/hash.js';

interface MigrationStats {
  catalog: { before: number; after: number };
  chunks: { before: number; after: number };
  concepts: { before: number; after: number };
}

/**
 * Parse a field that may be a native array, Arrow Vector, or JSON string
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
 * Convert Arrow Vector to native array if needed
 */
function toNativeArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && 'toArray' in value) {
    return Array.from(value.toArray());
  }
  return [];
}

async function migrateToNormalizedSchema(dbPath: string): Promise<boolean> {
  console.log('\n🔄 SCHEMA MIGRATION: Legacy → Normalized');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);
  console.log(`Started: ${new Date().toISOString()}`);
  
  const stats: MigrationStats = {
    catalog: { before: 0, after: 0 },
    chunks: { before: 0, after: 0 },
    concepts: { before: 0, after: 0 }
  };
  
  try {
    const db = await connect(dbPath);
    const tableNames = await db.tableNames();
    console.log(`\nTables found: ${tableNames.join(', ')}`);
    
    // ========== PHASE 1: Build mappings ==========
    console.log('\n📊 Phase 0: Building reference mappings...');
    
    // Build source → catalog_id mapping (for chunks migration)
    const sourceToId = new Map<string, number>();
    
    // Build concept name → concept_id mapping (for related_concepts migration)
    const conceptNameToId = new Map<string, number>();
    
    if (tableNames.includes('catalog')) {
      const catalogTable = await db.openTable('catalog');
      const catalogRows = await catalogTable.query().limit(100000).toArray();
      for (const row of catalogRows) {
        const source = row.source || row.filename || '';
        const id = row.id || hashToId(source);
        sourceToId.set(source, id);
      }
      console.log(`  Built source→id mapping: ${sourceToId.size} entries`);
    }
    
    if (tableNames.includes('concepts')) {
      const conceptsTable = await db.openTable('concepts');
      const conceptRows = await conceptsTable.query().limit(100000).toArray();
      for (const row of conceptRows) {
        const id = row.id || hashToId(row.concept);
        conceptNameToId.set(row.concept.toLowerCase(), id);
      }
      console.log(`  Built concept→id mapping: ${conceptNameToId.size} entries`);
    }
    
    // ========== PHASE 1: Migrate Catalog ==========
    if (tableNames.includes('catalog')) {
      console.log('\n📄 Phase 1: Migrating catalog table...');
      
      const catalogTable = await db.openTable('catalog');
      const catalogRows = await catalogTable.query().limit(100000).toArray();
      stats.catalog.before = catalogRows.length;
      console.log(`  Found ${catalogRows.length} catalog entries`);
      
      const migratedCatalog = catalogRows.map(row => {
        // Keep source field (needed for now, will be renamed to filename later)
        const source = row.source || row.filename || '';
        const id = row.id || hashToId(source);
        
        // Parse category_ids - ensure non-empty for Arrow schema inference
        let categoryIds = parseArrayField<number>(row.category_ids);
        if (categoryIds.length === 0) {
          categoryIds = [0]; // Placeholder for schema inference
        }
        
        return {
          id: id,
          source: source,  // Keep for backward compatibility
          hash: row.hash || '',
          text: row.text || '',
          vector: toNativeArray(row.vector),
          category_ids: categoryIds
          // REMOVED: concepts, concept_ids, concept_categories, loc, filename_tags
        };
      });
      
      // Recreate table with migrated data
      await db.dropTable('catalog');
      await db.createTable('catalog', migratedCatalog, { mode: 'overwrite' });
      stats.catalog.after = migratedCatalog.length;
      console.log(`  ✅ Catalog migrated: ${migratedCatalog.length} entries`);
    }
    
    // ========== PHASE 2: Migrate Chunks ==========
    if (tableNames.includes('chunks')) {
      console.log('\n📝 Phase 2: Migrating chunks table...');
      
      const chunksTable = await db.openTable('chunks');
      const chunkRows = await chunksTable.query().limit(1000000).toArray();
      stats.chunks.before = chunkRows.length;
      console.log(`  Found ${chunkRows.length} chunks`);
      
      const migratedChunks = chunkRows.map(row => {
        // Resolve source path to catalog_id - ensure it's always a valid number
        let catalogId = sourceToId.get(row.source);
        if (catalogId === undefined || catalogId === null) {
          catalogId = row.source ? hashToId(row.source) : 0;
        }
        // Ensure it's a number (not NaN or undefined)
        if (typeof catalogId !== 'number' || isNaN(catalogId)) {
          catalogId = 0;
        }
        
        // Parse concept_ids - check both concept_ids (new) and concepts (legacy)
        let conceptIds = parseArrayField<number>(row.concept_ids);
        if (conceptIds.length === 0 || (conceptIds.length === 1 && conceptIds[0] === 0)) {
          // Try to convert from legacy concepts field (array of concept names)
          const conceptNames = parseArrayField<string>(row.concepts);
          if (conceptNames.length > 0) {
            conceptIds = conceptNames
              .map(name => conceptNameToId.get(name.toLowerCase().trim()))
              .filter((id): id is number => id !== undefined && id !== null);
          }
        }
        // Ensure non-empty for Arrow schema inference
        if (conceptIds.length === 0) {
          conceptIds = [0]; // Placeholder, will be filtered out in queries
        }
        
        // Parse category_ids - ensure non-empty for Arrow schema inference
        let categoryIds = parseArrayField<number>(row.category_ids);
        if (categoryIds.length === 0) {
          categoryIds = [0]; // Placeholder, will be filtered out in queries
        }
        
        return {
          id: row.id || '',
          source: row.source || '',  // Keep for backward compatibility
          catalog_id: Number(catalogId),  // Explicit number conversion
          hash: row.hash || '',
          text: row.text || '',
          vector: toNativeArray(row.vector),
          concept_ids: conceptIds,
          category_ids: categoryIds,
          chunk_index: typeof row.chunk_index === 'number' ? row.chunk_index : 0,
          loc: row.loc || '{}'
          // REMOVED: concepts, concept_categories, concept_density
        };
      });
      
      // Recreate table with migrated data
      await db.dropTable('chunks');
      await db.createTable('chunks', migratedChunks, { mode: 'overwrite' });
      stats.chunks.after = migratedChunks.length;
      console.log(`  ✅ Chunks migrated: ${migratedChunks.length} entries`);
      
      // Recreate vector index if enough data
      if (migratedChunks.length >= 256) {
        console.log('  🔧 Creating vector index...');
        const newChunksTable = await db.openTable('chunks');
        await newChunksTable.createIndex('vector', {
          config: { 
            type: 'ivf_pq', 
            numPartitions: Math.max(2, Math.floor(migratedChunks.length / 100)), 
            numSubVectors: 16 
          }
        });
        console.log('  ✅ Vector index created');
      }
    }
    
    // ========== PHASE 3: Migrate Concepts ==========
    if (tableNames.includes('concepts')) {
      console.log('\n🧠 Phase 3: Migrating concepts table...');
      
      const conceptsTable = await db.openTable('concepts');
      const conceptRows = await conceptsTable.query().limit(100000).toArray();
      stats.concepts.before = conceptRows.length;
      console.log(`  Found ${conceptRows.length} concepts`);
      
      const migratedConcepts = conceptRows.map(row => {
        const id = row.id || hashToId(row.concept);
        
        // Parse catalog_ids - ensure non-empty for Arrow schema inference
        let catalogIds = parseArrayField<number>(row.catalog_ids);
        if (catalogIds.length === 0) {
          catalogIds = [0]; // Placeholder for schema inference
        }
        
        // Convert related_concepts (names) to related_concept_ids
        let relatedConceptIds: number[] = [];
        const relatedConcepts = parseArrayField<string>(row.related_concepts);
        if (relatedConcepts.length > 0) {
          relatedConceptIds = relatedConcepts
            .map(name => conceptNameToId.get(name.toLowerCase()))
            .filter((id): id is number => id !== undefined);
        }
        // Also include any existing related_concept_ids
        const existingRelatedIds = parseArrayField<number>(row.related_concept_ids);
        relatedConceptIds = [...new Set([...relatedConceptIds, ...existingRelatedIds])];
        // Ensure non-empty for Arrow schema inference
        if (relatedConceptIds.length === 0) {
          relatedConceptIds = [0]; // Placeholder for schema inference
        }
        
        // Parse WordNet fields - ensure non-empty for Arrow schema inference
        let synonyms = parseArrayField<string>(row.synonyms);
        if (synonyms.length === 0) synonyms = [''];
        let broaderTerms = parseArrayField<string>(row.broader_terms);
        if (broaderTerms.length === 0) broaderTerms = [''];
        let narrowerTerms = parseArrayField<string>(row.narrower_terms);
        if (narrowerTerms.length === 0) narrowerTerms = [''];
        
        return {
          id: id,
          concept: row.concept || '',
          catalog_ids: catalogIds,
          related_concept_ids: relatedConceptIds,
          synonyms: synonyms,
          broader_terms: broaderTerms,
          narrower_terms: narrowerTerms,
          weight: row.weight || 0,
          vector: toNativeArray(row.vector)
          // REMOVED: sources, category, concept_type, chunk_count, enrichment_source, related_concepts
        };
      });
      
      // Recreate table with migrated data
      await db.dropTable('concepts');
      await db.createTable('concepts', migratedConcepts, { mode: 'overwrite' });
      stats.concepts.after = migratedConcepts.length;
      console.log(`  ✅ Concepts migrated: ${migratedConcepts.length} entries`);
    }
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION COMPLETE');
    console.log(`  Catalog: ${stats.catalog.before} → ${stats.catalog.after} entries`);
    console.log(`  Chunks: ${stats.chunks.before} → ${stats.chunks.after} entries`);
    console.log(`  Concepts: ${stats.concepts.before} → ${stats.concepts.after} entries`);
    console.log(`\nCompleted: ${new Date().toISOString()}`);
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run validation: npx tsx scripts/validate_normalized_schema.ts');
    console.log('   2. Test MCP tools to verify functionality');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error('\nRollback: Restore from backup');
    return false;
  }
}

// Run migration
const dbPath = process.argv[2] || path.join(process.env.HOME || '', '.concept_rag_test');
migrateToNormalizedSchema(dbPath)
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });

