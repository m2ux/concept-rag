#!/usr/bin/env npx tsx
/**
 * Verify MCP tools work with migrated database
 */

import { connect } from '@lancedb/lancedb';
import { LanceDBCatalogRepository } from '../src/infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBChunkRepository } from '../src/infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../src/infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../src/concepts/query_expander.js';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache.js';
import * as path from 'path';

async function verifyMCPTools() {
  const dbPath = process.argv[2] || './db/test';
  console.log('\n🔍 Verifying MCP tools with migrated database');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);

  const db = await connect(dbPath);

  const catalogTable = await db.openTable('catalog');
  const conceptsTable = await db.openTable('concepts');
  const chunksTable = await db.openTable('chunks');

  // Initialize services first
  const embeddingService = new SimpleEmbeddingService();
  const queryExpander = new QueryExpander(conceptsTable, embeddingService);
  const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);

  // Initialize repositories (catalog and concept repos need hybridSearchService)
  const catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
  const conceptRepo = new LanceDBConceptRepository(conceptsTable);

  // Initialize cache
  const conceptIdCache = ConceptIdCache.getInstance();
  conceptIdCache.clear();
  await conceptIdCache.initialize(conceptRepo);

  const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService, hybridSearchService, conceptIdCache);

  let passed = 0;
  let failed = 0;

  // Test catalog search
  console.log('\n📄 Testing catalog_search...');
  try {
    const catalogResults = await catalogRepo.search({ text: 'architecture', limit: 3 });
    console.log(`  ✅ Found ${catalogResults.length} results`);
    if (catalogResults[0]) {
      console.log(`     Source: ${catalogResults[0].source}`);
      const hasCategoryIds = Array.isArray(catalogResults[0].categoryIds);
      console.log(`     Has categoryIds: ${hasCategoryIds}`);
      if (hasCategoryIds) passed++; else failed++;
    }
    passed++;
  } catch (err) {
    console.log(`  ❌ Error: ${err}`);
    failed++;
  }

  // Test chunk search by source
  console.log('\n📝 Testing chunks by source...');
  try {
    // Get first catalog entry to get a valid source
    const firstDoc = (await catalogRepo.search({ text: '', limit: 1 }))[0];
    if (firstDoc) {
      const chunkResults = await chunkRepo.findBySource(firstDoc.source, 3);
      console.log(`  ✅ Found ${chunkResults.length} chunks for "${firstDoc.source.split('/').pop()}"`);
      if (chunkResults[0]) {
        const hasConceptIds = Array.isArray(chunkResults[0].conceptIds);
        const hasCategoryIds = Array.isArray(chunkResults[0].categoryIds);
        console.log(`     Has conceptIds: ${hasConceptIds}`);
        console.log(`     Has categoryIds: ${hasCategoryIds}`);
        if (hasConceptIds && hasCategoryIds) passed++; else failed++;
      }
      passed++;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err}`);
    failed++;
  }

  // Test concept search
  console.log('\n🧠 Testing concept lookup...');
  try {
    // Get first concept
    const firstConcept = (await conceptsTable.query().limit(1).toArray())[0];
    if (firstConcept) {
      const conceptOpt = await conceptRepo.findByName(firstConcept.concept);
      // Import Option helpers
      const { isSome, toNullable } = await import('../src/domain/functional/option.js');
      if (isSome(conceptOpt)) {
        const conceptResults = toNullable(conceptOpt)!;
        console.log(`  ✅ Found concept: "${conceptResults.concept}"`);
        const hasCatalogIds = Array.isArray(conceptResults.catalogIds);
        const hasRelatedIds = Array.isArray(conceptResults.relatedConceptIds);
        console.log(`     Has catalogIds: ${hasCatalogIds}`);
        console.log(`     Has relatedConceptIds: ${hasRelatedIds}`);
        if (hasCatalogIds && hasRelatedIds) passed++; else failed++;
        passed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err}`);
    failed++;
  }

  // Test findByConceptName (critical for concept_chunks tool)
  console.log('\n🔎 Testing findByConceptName...');
  try {
    // Get a concept that exists
    const sampleConcept = (await conceptsTable.query().limit(1).toArray())[0];
    if (sampleConcept) {
      const chunks = await chunkRepo.findByConceptName(sampleConcept.concept, 5);
      console.log(`  ✅ Found ${chunks.length} chunks for concept "${sampleConcept.concept}"`);
      passed++;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ MCP tool verification PASSED');
  } else {
    console.log('\n❌ MCP tool verification FAILED - some checks did not pass');
  }

  return failed === 0;
}

verifyMCPTools()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Verification error:', err);
    process.exit(1);
  });

