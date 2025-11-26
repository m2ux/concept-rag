#!/usr/bin/env npx tsx
/**
 * Validates that database matches the normalized schema.
 * 
 * Checks for:
 * - Required fields present
 * - Deprecated fields removed
 * - Correct data types (arrays vs JSON strings)
 */

import { connect } from '@lancedb/lancedb';
import * as path from 'path';

interface ValidationResult {
  check: string;
  passed: boolean;
  details?: string;
}

async function validateNormalizedSchema(dbPath: string) {
  console.log('\n📋 SCHEMA VALIDATION: Normalized Structure');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);
  
  const db = await connect(dbPath);
  const results: ValidationResult[] = [];
  
  // Get table names
  const tableNames = await db.tableNames();
  console.log(`\nTables found: ${tableNames.join(', ')}`);
  
  // ========== CATALOG CHECKS ==========
  if (tableNames.includes('catalog')) {
    console.log('\n📄 Validating catalog table...');
    const catalog = await db.openTable('catalog');
    const catalogSample = (await catalog.query().limit(1).toArray())[0];
    
    if (catalogSample) {
      const catalogFields = Object.keys(catalogSample);
      console.log(`  Fields: ${catalogFields.join(', ')}`);
      
      // Required fields
      results.push({ check: 'catalog.id exists', passed: 'id' in catalogSample });
      results.push({ check: 'catalog.text exists', passed: 'text' in catalogSample });
      results.push({ check: 'catalog.hash exists', passed: 'hash' in catalogSample });
      results.push({ check: 'catalog.vector exists', passed: 'vector' in catalogSample });
      
      // Category IDs should be array
      if ('category_ids' in catalogSample) {
        const isArray = Array.isArray(catalogSample.category_ids);
        results.push({ 
          check: 'catalog.category_ids is array', 
          passed: isArray,
          details: isArray ? undefined : `Got type: ${typeof catalogSample.category_ids}`
        });
      }
      
      // Deprecated fields should NOT exist
      results.push({ 
        check: 'catalog.concepts removed', 
        passed: !('concepts' in catalogSample),
        details: 'concepts' in catalogSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'catalog.concept_ids removed', 
        passed: !('concept_ids' in catalogSample),
        details: 'concept_ids' in catalogSample ? 'Field still exists (should derive from chunks)' : undefined
      });
      results.push({ 
        check: 'catalog.concept_categories removed', 
        passed: !('concept_categories' in catalogSample),
        details: 'concept_categories' in catalogSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'catalog.filename_tags removed', 
        passed: !('filename_tags' in catalogSample),
        details: 'filename_tags' in catalogSample ? 'Field still exists' : undefined
      });
    } else {
      results.push({ check: 'catalog has data', passed: false, details: 'Table is empty' });
    }
  } else {
    results.push({ check: 'catalog table exists', passed: false });
  }
  
  // ========== CHUNKS CHECKS ==========
  if (tableNames.includes('chunks')) {
    console.log('\n📝 Validating chunks table...');
    const chunks = await db.openTable('chunks');
    const chunkSample = (await chunks.query().limit(1).toArray())[0];
    
    if (chunkSample) {
      const chunkFields = Object.keys(chunkSample);
      console.log(`  Fields: ${chunkFields.join(', ')}`);
      
      // Required fields
      results.push({ check: 'chunks.id exists', passed: 'id' in chunkSample });
      results.push({ check: 'chunks.text exists', passed: 'text' in chunkSample });
      results.push({ check: 'chunks.hash exists', passed: 'hash' in chunkSample });
      results.push({ check: 'chunks.vector exists', passed: 'vector' in chunkSample });
      
      // concept_ids should be array
      if ('concept_ids' in chunkSample) {
        const isArray = Array.isArray(chunkSample.concept_ids);
        results.push({ 
          check: 'chunks.concept_ids is array', 
          passed: isArray,
          details: isArray ? undefined : `Got type: ${typeof chunkSample.concept_ids}`
        });
      }
      
      // category_ids should be array
      if ('category_ids' in chunkSample) {
        const isArray = Array.isArray(chunkSample.category_ids);
        results.push({ 
          check: 'chunks.category_ids is array', 
          passed: isArray,
          details: isArray ? undefined : `Got type: ${typeof chunkSample.category_ids}`
        });
      }
      
      // Deprecated fields should NOT exist
      results.push({ 
        check: 'chunks.concepts removed', 
        passed: !('concepts' in chunkSample),
        details: 'concepts' in chunkSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'chunks.concept_categories removed', 
        passed: !('concept_categories' in chunkSample),
        details: 'concept_categories' in chunkSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'chunks.concept_density removed', 
        passed: !('concept_density' in chunkSample),
        details: 'concept_density' in chunkSample ? 'Field still exists' : undefined
      });
    } else {
      results.push({ check: 'chunks has data', passed: false, details: 'Table is empty' });
    }
  } else {
    results.push({ check: 'chunks table exists', passed: false });
  }
  
  // ========== CONCEPTS CHECKS ==========
  if (tableNames.includes('concepts')) {
    console.log('\n🧠 Validating concepts table...');
    const concepts = await db.openTable('concepts');
    const conceptSample = (await concepts.query().limit(1).toArray())[0];
    
    if (conceptSample) {
      const conceptFields = Object.keys(conceptSample);
      console.log(`  Fields: ${conceptFields.join(', ')}`);
      
      // Required fields
      results.push({ check: 'concepts.id exists', passed: 'id' in conceptSample });
      results.push({ check: 'concepts.concept exists', passed: 'concept' in conceptSample });
      results.push({ check: 'concepts.vector exists', passed: 'vector' in conceptSample });
      
      // catalog_ids should be array
      if ('catalog_ids' in conceptSample) {
        const isArray = Array.isArray(conceptSample.catalog_ids);
        results.push({ 
          check: 'concepts.catalog_ids is array', 
          passed: isArray,
          details: isArray ? undefined : `Got type: ${typeof conceptSample.catalog_ids}`
        });
      }
      
      // related_concept_ids should be array
      if ('related_concept_ids' in conceptSample) {
        const isArray = Array.isArray(conceptSample.related_concept_ids);
        results.push({ 
          check: 'concepts.related_concept_ids is array', 
          passed: isArray,
          details: isArray ? undefined : `Got type: ${typeof conceptSample.related_concept_ids}`
        });
      }
      
      // Deprecated fields should NOT exist
      results.push({ 
        check: 'concepts.sources removed', 
        passed: !('sources' in conceptSample),
        details: 'sources' in conceptSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'concepts.category removed', 
        passed: !('category' in conceptSample),
        details: 'category' in conceptSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'concepts.concept_type removed', 
        passed: !('concept_type' in conceptSample),
        details: 'concept_type' in conceptSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'concepts.chunk_count removed', 
        passed: !('chunk_count' in conceptSample),
        details: 'chunk_count' in conceptSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'concepts.enrichment_source removed', 
        passed: !('enrichment_source' in conceptSample),
        details: 'enrichment_source' in conceptSample ? 'Field still exists' : undefined
      });
      results.push({ 
        check: 'concepts.related_concepts removed', 
        passed: !('related_concepts' in conceptSample),
        details: 'related_concepts' in conceptSample ? 'Field still exists (use related_concept_ids)' : undefined
      });
    } else {
      results.push({ check: 'concepts has data', passed: false, details: 'Table is empty' });
    }
  } else {
    results.push({ check: 'concepts table exists', passed: false });
  }
  
  // ========== REPORT ==========
  console.log('\n' + '='.repeat(70));
  console.log('Results:\n');
  
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    const details = r.details ? ` (${r.details})` : '';
    console.log(`  ${icon} ${r.check}${details}`);
    if (r.passed) passed++; else failed++;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ Schema validation PASSED - database matches normalized schema');
  } else {
    console.log('\n❌ Schema validation FAILED - some checks did not pass');
    console.log('   Run migration script or re-seed to update schema');
  }
  
  return failed === 0;
}

// Run validation
const dbPath = process.argv[2] || path.join(process.env.HOME || '', '.concept_rag_test');
validateNormalizedSchema(dbPath)
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Validation error:', err);
    process.exit(1);
  });

