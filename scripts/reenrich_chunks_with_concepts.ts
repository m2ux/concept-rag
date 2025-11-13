import * as lancedb from '@lancedb/lancedb';
import { Document } from "@langchain/core/documents";
import { ConceptChunkMatcher } from '../src/concepts/concept_chunk_matcher.js';

/**
 * Re-enrich existing chunks with concept tags from catalog
 * 
 * This script:
 * 1. Loads all chunks from the database
 * 2. Loads corresponding document concepts from catalog
 * 3. Re-tags chunks with matched concepts
 * 4. Updates chunks in-place
 * 
 * Use this when chunks exist but weren't properly tagged with concepts
 * 
 * Usage: npx tsx scripts/reenrich_chunks_with_concepts.ts [--batch-size 1000]
 */

async function main() {
  const batchSize = process.argv.includes('--batch-size') 
    ? parseInt(process.argv[process.argv.indexOf('--batch-size') + 1]) 
    : 1000;
  
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  console.log(`🔄 Re-enriching chunks with concepts from catalog`);
  console.log(`📂 Database: ${dbPath}`);
  console.log(`📦 Batch size: ${batchSize}\n`);
  
  const db = await lancedb.connect(dbPath);
  
  // Load catalog with concepts
  console.log('📚 Loading catalog records with concepts...');
  const catalogTable = await db.openTable('catalog');
  const catalogRecords = await catalogTable.query().limit(100000).toArray();
  
  // Build source -> concepts map
  const sourceConceptsMap = new Map<string, any>();
  let catalogWithConcepts = 0;
  
  for (const record of catalogRecords) {
    if (record.concepts) {
      try {
        const concepts = typeof record.concepts === 'string' 
          ? JSON.parse(record.concepts)
          : record.concepts;
        
        if (concepts && concepts.primary_concepts && concepts.primary_concepts.length > 0) {
          sourceConceptsMap.set(record.source, concepts);
          catalogWithConcepts++;
        }
      } catch (e) {
        // Skip invalid concepts
      }
    }
  }
  
  console.log(`  ✅ Loaded ${catalogRecords.length} catalog records`);
  console.log(`  ✅ ${catalogWithConcepts} have valid concepts\n`);
  
  // Load all chunks
  console.log('📦 Loading all chunks...');
  const chunksTable = await db.openTable('chunks');
  const allChunks = await chunksTable.query().limit(1000000).toArray();
  
  console.log(`  ✅ Loaded ${allChunks.length.toLocaleString()} chunks\n`);
  
  // Count chunks that need enrichment
  const chunksNeedingEnrichment = allChunks.filter((chunk: any) => {
    try {
      const concepts = chunk.concepts ? JSON.parse(chunk.concepts) : [];
      return concepts.length === 0 && sourceConceptsMap.has(chunk.source);
    } catch {
      return sourceConceptsMap.has(chunk.source);
    }
  });
  
  console.log(`📊 Chunks needing enrichment: ${chunksNeedingEnrichment.length.toLocaleString()}`);
  console.log(`📊 Chunks already enriched: ${(allChunks.length - chunksNeedingEnrichment.length).toLocaleString()}\n`);
  
  if (chunksNeedingEnrichment.length === 0) {
    console.log('✅ All chunks are already enriched!');
    return;
  }
  
  // Enrich chunks
  console.log('🔄 Enriching chunks with concepts...\n');
  const matcher = new ConceptChunkMatcher();
  let enrichedCount = 0;
  let totalConceptsAdded = 0;
  const enrichedChunksMap = new Map<string, any>();
  
  // Process in batches
  for (let i = 0; i < chunksNeedingEnrichment.length; i += batchSize) {
    const batch = chunksNeedingEnrichment.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunksNeedingEnrichment.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);
    
    const updates: any[] = [];
    
    for (const chunk of batch) {
      const documentConcepts = sourceConceptsMap.get(chunk.source);
      if (!documentConcepts) continue;
      
      const matched = matcher.matchConceptsToChunk(
        chunk.text || '',
        documentConcepts
      );
      
      if (matched.concepts.length > 0) {
        updates.push({
          id: chunk.id,
          concepts: JSON.stringify(matched.concepts),
          concept_categories: JSON.stringify(matched.categories),
          concept_density: matched.concept_density
        });
        
        enrichedCount++;
        totalConceptsAdded += matched.concepts.length;
      }
    }
    
    // Store updates for later (we'll rebuild the table at the end)
    if (updates.length > 0) {
      for (const update of updates) {
        const originalChunk = batch.find(c => c.id === update.id)!;
        enrichedChunksMap.set(originalChunk.id, {
          concepts: update.concepts,
          concept_categories: update.concept_categories,
          concept_density: update.concept_density
        });
      }
      
      console.log(`  ✅ Queued ${updates.length} chunks for update`);
    }
    
    // Progress update
    const progress = Math.min((i + batchSize) / chunksNeedingEnrichment.length * 100, 100);
    console.log(`  📊 Progress: ${progress.toFixed(1)}%\n`);
  }
  
  console.log(`\n📊 Building updated chunks table...`);
  
  // Merge enriched metadata with original chunks
  const updatedChunks = allChunks.map((chunk: any) => {
    const enrichedData = enrichedChunksMap.get(chunk.id);
    
    // Ensure vector is an array (not undefined or string)
    let vector = chunk.vector;
    if (!Array.isArray(vector)) {
      // If vector is missing or invalid, create a zero vector
      console.warn(`  ⚠️  Chunk ${chunk.id} has invalid vector, creating zero vector`);
      vector = new Array(384).fill(0); // 384-dim for sentence transformers
    }
    
    if (enrichedData) {
      return {
        id: chunk.id,
        text: chunk.text || '',
        source: chunk.source || '',
        hash: chunk.hash || '',
        loc: chunk.loc || '{}',
        vector: vector,
        concepts: enrichedData.concepts,
        concept_categories: enrichedData.concept_categories,
        concept_density: enrichedData.concept_density
      };
    }
    
    // Keep existing concepts if already enriched
    return {
      id: chunk.id,
      text: chunk.text || '',
      source: chunk.source || '',
      hash: chunk.hash || '',
      loc: chunk.loc || '{}',
      vector: vector,
      concepts: chunk.concepts || '[]',
      concept_categories: chunk.concept_categories || '[]',
      concept_density: chunk.concept_density || 0
    };
  });
  
  console.log(`  ✅ Prepared ${updatedChunks.length.toLocaleString()} chunks for insertion`);
  console.log(`  🔍 Sample chunk structure:`, {
    fields: Object.keys(updatedChunks[0]),
    vectorType: Array.isArray(updatedChunks[0].vector) ? 'array' : typeof updatedChunks[0].vector,
    vectorLength: Array.isArray(updatedChunks[0].vector) ? updatedChunks[0].vector.length : 'N/A'
  });
  
  // Backup and rebuild chunks table
  console.log(`\n🗑️  Dropping old chunks table...`);
  await db.dropTable('chunks');
  
  console.log(`📊 Creating new chunks table with enriched data...`);
  const newChunksTable = await db.createTable('chunks', updatedChunks);
  
  console.log(`\n✅ Enrichment complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Total chunks: ${allChunks.length.toLocaleString()}`);
  console.log(`   - Chunks enriched: ${enrichedCount.toLocaleString()}`);
  console.log(`   - Concepts added: ${totalConceptsAdded.toLocaleString()}`);
  console.log(`   - Avg concepts per chunk: ${(totalConceptsAdded / enrichedCount).toFixed(1)}`);
  
  // Show some examples
  const exampleSource = chunksNeedingEnrichment.find(c => c.source.includes('Elliott'))?.source;
  if (exampleSource) {
    console.log(`\n🔍 Example: Checking chunks from Elliott Wave book...`);
    const updatedExample = await newChunksTable.query()
      .where(`source = "${exampleSource}"`)
      .limit(5)
      .toArray();
    
    let conceptCount = 0;
    for (const chunk of updatedExample) {
      try {
        const concepts = chunk.concepts ? JSON.parse(chunk.concepts) : [];
        if (concepts.length > 0) conceptCount++;
      } catch {}
    }
    
    console.log(`   - ${conceptCount}/${updatedExample.length} chunks now have concepts ✅`);
  }
  
  console.log(`\n💡 Next: Run concept search to verify:`);
  console.log(`   npx tsx scripts/check_database_health.ts`);
}

main().catch(console.error);

