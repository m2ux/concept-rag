/**
 * Seed Test Visuals Script
 * 
 * Populates the test database with sample visual data for testing
 * the get_visuals MCP tool and visual enrichment features.
 * 
 * Usage:
 *   npx tsx scripts/seed-test-visuals.ts
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';
import * as fs from 'fs';
import { SimpleEmbeddingService } from '../src/infrastructure/embeddings/simple-embedding-service.js';

const TEST_DB_PATH = path.join(process.cwd(), 'db/test');
const IMAGES_DIR = path.join(TEST_DB_PATH, 'images');

// Sample visuals to create - linked to actual catalog entries and concepts
const SAMPLE_VISUALS = [
  {
    catalogId: 3155035939,  // 1-s2.0-S2096720925000132-main
    catalogTitle: 'Blockchain Interoperability Survey',
    description: 'Architecture diagram showing the layered blockchain interoperability stack with cross-chain communication protocols, consensus mechanisms, and transaction routing components.',
    visualType: 'diagram',
    pageNumber: 5,
    concepts: ['blockchain', 'interoperability', 'cross-chain', 'consensus', 'architecture']
  },
  {
    catalogId: 495016259,   // 1711.03936v2
    catalogTitle: 'Deep Learning Paper',
    description: 'Neural network architecture flowchart depicting the forward propagation through convolutional layers, pooling operations, and fully connected layers for image classification.',
    visualType: 'flowchart',
    pageNumber: 3,
    concepts: ['neural network', 'deep learning', 'convolutional', 'architecture']
  },
  {
    catalogId: 3213084581,  // 2006.15918v1
    catalogTitle: 'Distributed Systems Research',
    description: 'Sequence diagram illustrating the consensus protocol message flow between distributed nodes, showing propose, prepare, commit, and acknowledge phases.',
    visualType: 'diagram',
    pageNumber: 8,
    concepts: ['distributed systems', 'consensus protocol', 'message passing']
  },
  {
    catalogId: 3974015912,  // 2204.11193v1
    catalogTitle: 'Machine Learning Framework',
    description: 'Performance comparison bar chart showing training time, inference latency, and memory usage across different model architectures and hardware configurations.',
    visualType: 'chart',
    pageNumber: 12,
    concepts: ['performance', 'machine learning', 'benchmark', 'optimization']
  },
  {
    catalogId: 4104765478,  // 2302.12125v2
    catalogTitle: 'Smart Contract Security',
    description: 'State machine diagram representing smart contract lifecycle states including deployed, active, paused, and terminated with transition conditions.',
    visualType: 'diagram',
    pageNumber: 6,
    concepts: ['smart contract', 'state machine', 'security', 'lifecycle']
  },
  {
    catalogId: 2697195125,  // 2303.10844v2
    catalogTitle: 'Cryptographic Protocols',
    description: 'Table comparing cryptographic hash functions including SHA-256, SHA-3, and BLAKE2 across security level, performance, and use cases.',
    visualType: 'table',
    pageNumber: 4,
    concepts: ['cryptography', 'hash function', 'security']
  },
  {
    catalogId: 2157974058,  // 2993600.2993611
    catalogTitle: 'API Design Patterns',
    description: 'UML class diagram showing the repository pattern implementation with interfaces, concrete implementations, and dependency injection relationships.',
    visualType: 'diagram',
    pageNumber: 7,
    concepts: ['design patterns', 'repository pattern', 'dependency injection', 'uml']
  },
  {
    catalogId: 837451997,   // 3696429
    catalogTitle: 'Database Systems',
    description: 'Entity-relationship diagram showing database schema with users, transactions, blocks, and smart contracts entities and their relationships.',
    visualType: 'figure',
    pageNumber: 10,
    concepts: ['database', 'entity relationship', 'schema', 'data modeling']
  }
];

// Simple hash function for generating IDs
function hashToId(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function main() {
  console.log('🎨 Seeding Test Visuals');
  console.log('========================\n');
  
  // Verify database exists
  if (!fs.existsSync(TEST_DB_PATH)) {
    console.error(`❌ Test database not found at: ${TEST_DB_PATH}`);
    process.exit(1);
  }
  
  // Connect to database
  console.log(`📦 Connecting to database: ${TEST_DB_PATH}`);
  const db = await lancedb.connect(TEST_DB_PATH);
  
  // Verify tables exist
  const tables = await db.tableNames();
  if (!tables.includes('visuals')) {
    console.error('❌ Visuals table not found. Run add-visuals-table.ts first.');
    process.exit(1);
  }
  
  const visuals = await db.openTable('visuals');
  const concepts = await db.openTable('concepts');
  const chunks = await db.openTable('chunks');
  
  // Build concept name to ID lookup
  console.log('📚 Building concept index...');
  const conceptEntries = await concepts.query().limit(10000).toArray();
  const conceptNameToId = new Map<string, number>();
  for (const c of conceptEntries) {
    if (c.name) {
      conceptNameToId.set(c.name.toLowerCase(), c.id);
    }
  }
  console.log(`   Found ${conceptNameToId.size} concepts`);
  
  // Build chunk lookup by catalog_id
  console.log('📄 Building chunk index...');
  const chunkEntries = await chunks.query().limit(10000).toArray();
  const chunksByCatalog = new Map<number, number[]>();
  for (const chunk of chunkEntries) {
    if (chunk.catalog_id) {
      if (!chunksByCatalog.has(chunk.catalog_id)) {
        chunksByCatalog.set(chunk.catalog_id, []);
      }
      chunksByCatalog.get(chunk.catalog_id)!.push(chunk.id);
    }
  }
  console.log(`   Indexed chunks for ${chunksByCatalog.size} documents`);
  
  // Create embedding service
  const embeddingService = new SimpleEmbeddingService();
  
  // Ensure images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  
  // Clear existing visuals
  const existingCount = await visuals.countRows();
  if (existingCount > 0) {
    console.log(`\n🗑️  Clearing ${existingCount} existing visuals...`);
    // Delete all by querying all IDs and deleting
    const existing = await visuals.query().limit(10000).toArray();
    for (const v of existing) {
      await visuals.delete(`id = ${v.id}`);
    }
  }
  
  console.log('\n📷 Creating sample visuals...\n');
  
  const visualRows: any[] = [];
  
  for (const sample of SAMPLE_VISUALS) {
    // Generate unique ID
    const id = hashToId(`${sample.catalogId}-${sample.pageNumber}-${sample.visualType}`);
    
    // Map concept names to IDs
    const conceptIds: number[] = [];
    const conceptNames: string[] = [];
    for (const conceptName of sample.concepts) {
      const conceptId = conceptNameToId.get(conceptName.toLowerCase());
      if (conceptId) {
        conceptIds.push(conceptId);
        conceptNames.push(conceptName);
      } else {
        // Include concept name even if not in DB
        conceptNames.push(conceptName);
      }
    }
    
    // Get chunk IDs for this catalog
    const chunkIds = chunksByCatalog.get(sample.catalogId)?.slice(0, 5) || [];
    
    // Generate embedding for description
    const vector = embeddingService.generateEmbedding(sample.description);
    
    // Create placeholder image path (we won't create actual images for tests)
    const imagePath = `images/${sample.catalogId}/p${sample.pageNumber}_v1.png`;
    
    console.log(`   ✅ ${sample.visualType}: "${sample.description.substring(0, 50)}..."`);
    console.log(`      Concepts: ${conceptNames.join(', ')}`);
    console.log(`      Chunks linked: ${chunkIds.length}`);
    
    visualRows.push({
      id,
      catalog_id: sample.catalogId,
      catalog_title: sample.catalogTitle,
      image_path: imagePath,
      description: sample.description,
      vector,
      visual_type: sample.visualType,
      page_number: sample.pageNumber,
      bounding_box: JSON.stringify({ x: 50, y: 100, width: 400, height: 300 }),
      concept_ids: conceptIds.length > 0 ? conceptIds : [0],
      concept_names: conceptNames.length > 0 ? conceptNames : [''],
      chunk_ids: chunkIds.length > 0 ? chunkIds : [0]
    });
  }
  
  // Add all visuals
  await visuals.add(visualRows);
  
  // Verify
  const finalCount = await visuals.countRows();
  
  console.log('\n========================');
  console.log('✅ Seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   Visuals added: ${visualRows.length}`);
  console.log(`   Total in table: ${finalCount}`);
  console.log(`   Types: diagram, flowchart, chart, table, figure`);
}

main().catch(err => {
  console.error('\n❌ Seeding failed:', err.message);
  process.exit(1);
});

