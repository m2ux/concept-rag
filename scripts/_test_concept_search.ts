/**
 * Test hierarchical concept search on test_db
 */
import * as lancedb from '@lancedb/lancedb';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { LanceDBPageRepository } from '../src/infrastructure/lancedb/repositories/lancedb-page-repository.js';
import { LanceDBChunkRepository } from '../src/infrastructure/lancedb/repositories/lancedb-chunk-repository.js';
import { LanceDBCatalogRepository } from '../src/infrastructure/lancedb/repositories/lancedb-catalog-repository.js';
import { HierarchicalConceptService } from '../src/domain/services/hierarchical-concept-service.js';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache.js';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';
import { ConceptualHybridSearchService } from '../src/infrastructure/search/conceptual-hybrid-search-service.js';
import { QueryExpander } from '../src/concepts/query_expander.js';

const TEST_CONCEPTS = [
  'strategy',                    // Design Patterns - well matched
  'nine situations framework',   // Art of War - 21 pages
  'operational planning',        // Art of War - 12 pages
  'design patterns',             // Clean Architecture
  'principle of deception'       // Art of War - 9 pages
];

async function main() {
  console.log('🧪 HIERARCHICAL CONCEPT SEARCH TEST\n');
  console.log('='.repeat(70));
  
  // Connect to test database
  const db = await lancedb.connect('./test_db');
  
  // Open tables
  const conceptsTable = await db.openTable('concepts');
  const pagesTable = await db.openTable('pages');
  const chunksTable = await db.openTable('chunks');
  const catalogTable = await db.openTable('catalog');
  
  // Initialize caches and services
  const conceptRepo = new LanceDBConceptRepository(conceptsTable);
  const conceptIdCache = ConceptIdCache.getInstance();
  await conceptIdCache.initialize(conceptRepo);
  
  const embeddingService = new SimpleEmbeddingService();
  const queryExpander = new QueryExpander(conceptsTable, embeddingService);
  const hybridSearchService = new ConceptualHybridSearchService(embeddingService, queryExpander);
  
  const pageRepo = new LanceDBPageRepository(pagesTable, conceptIdCache);
  const chunkRepo = new LanceDBChunkRepository(chunksTable, conceptRepo, embeddingService, hybridSearchService, conceptIdCache);
  const catalogRepo = new LanceDBCatalogRepository(catalogTable, hybridSearchService);
  
  // Create hierarchical service
  const hierarchicalService = new HierarchicalConceptService(
    conceptRepo,
    pageRepo,
    chunkRepo,
    catalogRepo
  );
  
  console.log(`\n📊 Database stats:`);
  console.log(`   Concepts: ${await conceptsTable.countRows()}`);
  console.log(`   Pages: ${await pagesTable.countRows()}`);
  console.log(`   Chunks: ${await chunksTable.countRows()}`);
  console.log(`   Catalog: ${await catalogTable.countRows()}\n`);
  
  // Run queries
  for (const concept of TEST_CONCEPTS) {
    console.log('\n' + '─'.repeat(70));
    console.log(`\n🔍 Query: "${concept}"\n`);
    
    try {
      const result = await hierarchicalService.search({
        concept,
        maxSources: 3,
        maxChunks: 5
      });
      
      // Display results
      console.log(`📖 Concept: ${result.concept} (ID: ${result.conceptId})`);
      console.log(`📝 Summary: ${result.summary || '(no summary)'}`);
      
      if (result.relatedConcepts.length > 0) {
        console.log(`🔗 Related: ${result.relatedConcepts.slice(0, 5).join(', ')}`);
      }
      
      if (result.synonyms.length > 0) {
        console.log(`📚 Synonyms: ${result.synonyms.join(', ')}`);
      }
      
      console.log(`\n📄 Sources (${result.sources.length}):`);
      for (const src of result.sources) {
        console.log(`   • ${src.title}`);
        console.log(`     Pages: ${src.pageNumbers.slice(0, 10).join(', ')}${src.pageNumbers.length > 10 ? '...' : ''}`);
      }
      
      console.log(`\n📦 Chunks (${result.chunks.length} of ${result.totalChunks}):`);
      for (const chunk of result.chunks.slice(0, 3)) {
        const preview = chunk.chunk.text.substring(0, 150).replace(/\n/g, ' ');
        console.log(`   • [Page ${chunk.pageNumber}] density=${chunk.conceptDensity.toFixed(3)}`);
        console.log(`     "${preview}..."`);
      }
      
      console.log(`\n✅ Stats: ${result.totalPages} pages, ${result.totalChunks} chunks`);
      
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test complete\n');
}

main().catch(console.error);

