/**
 * Debug script for cache ID resolution
 */
import { hashToId } from '../src/infrastructure/utils/hash.js';
import * as lancedb from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';
import { LanceDBConceptRepository } from '../src/infrastructure/lancedb/repositories/lancedb-concept-repository.js';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache.js';

async function debug() {
  const conceptName = 'clean architecture';
  const id = hashToId(conceptName);
  console.log('Expected concept:', conceptName);
  console.log('Expected hash ID:', id);
  console.log('As string:', String(id));
  console.log('');

  // Create temp test DB with the same data as integration tests
  const testDbPath = path.join(os.tmpdir(), `debug-cache-${Date.now()}`);
  fs.mkdirSync(testDbPath, { recursive: true });
  
  const db = await lancedb.connect(testDbPath);
  const embeddingService = new SimpleEmbeddingService();
  
  // Create concept with hash-based ID (like integration tests)
  const conceptData = {
    id: hashToId('clean architecture'),
    name: 'clean architecture',
    vector: embeddingService.generateEmbedding('clean architecture'),
    weight: 0.85,
    catalog_ids: [12345678],
    adjacent_ids: [11111111, 22222222, 33333333]
  };
  
  console.log('Creating concept with id:', conceptData.id);
  await db.createTable('concepts', [conceptData], { mode: 'overwrite' });
  
  // Read back from DB
  const conceptsTable = await db.openTable('concepts');
  const rows = await conceptsTable.query().limit(10).toArray();
  console.log('\nConcepts in DB:');
  rows.forEach(r => {
    console.log('  id:', r.id, 'name:', r.name);
  });
  
  // Initialize cache from repository
  const conceptRepo = new LanceDBConceptRepository(conceptsTable);
  const cache = ConceptIdCache.getInstance();
  cache.clear();
  await cache.initialize(conceptRepo);
  
  console.log('\nCache stats:', cache.getStats());
  console.log('All IDs in cache:', cache.getAllIds().slice(0, 5));
  console.log('All names in cache:', cache.getAllNames().slice(0, 5));
  
  // Try to resolve concept
  const resolvedName = cache.getName(String(id));
  console.log('\nResolving ID', String(id), '->', resolvedName);
  
  // Cleanup
  fs.rmSync(testDbPath, { recursive: true, force: true });
}

debug().catch(console.error);

