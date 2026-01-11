/**
 * Investigation script for empty chunk results issue
 * 
 * Issue: Concept metadata exists (showing 9 chunks) but concept_search returns 0 results
 * Concept: "exaptive bootstrapping"
 * 
 * This script investigates:
 * 1. Does the concept exist in the concepts table?
 * 2. What are its metadata values (chunk_count, sources, weight)?
 * 3. Do chunks actually contain this concept in their concepts field?
 * 4. Is there a data integrity issue between concept index and chunk data?
 */

import * as lancedb from '@lancedb/lancedb';

async function investigate() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  console.log(`🔍 Investigating empty chunk results issue`);
  console.log(`📂 Database: ${dbPath}\n`);
  
  const db = await lancedb.connect(dbPath);
  
  // STEP 1: Check if concept exists
  console.log('=' .repeat(80));
  console.log('STEP 1: Check concept record');
  console.log('='.repeat(80));
  
  const conceptsTable = await db.openTable('concepts');
  const conceptRecords = await conceptsTable
    .query()
    .where("concept = 'exaptive bootstrapping'")
    .limit(1)
    .toArray();
  
  if (conceptRecords.length === 0) {
    console.log('❌ Concept "exaptive bootstrapping" not found in concepts table');
    return;
  }
  
  const concept = conceptRecords[0];
  console.log('✅ Found concept record:');
  console.log('   concept:', concept.concept);
  console.log('   chunk_count:', concept.chunk_count);
  console.log('   weight:', concept.weight);
  console.log('   category:', concept.category);
  console.log('   sources:', concept.sources ? JSON.parse(concept.sources) : []);
  console.log('   related_concepts:', concept.related_concepts ? JSON.parse(concept.related_concepts).slice(0, 5) : []);
  console.log('   has embeddings:', concept.vector ? `yes (${concept.vector.length}D)` : 'no');
  
  // STEP 2: Check chunks table structure
  console.log('\n' + '='.repeat(80));
  console.log('STEP 2: Check chunks table structure');
  console.log('='.repeat(80));
  
  const chunksTable = await db.openTable('chunks');
  const totalChunks = await chunksTable.countRows();
  console.log(`Total chunks in database: ${totalChunks.toLocaleString()}`);
  
  // Sample some chunks to see the concepts field format
  const sampleChunks = await chunksTable.query().limit(5).toArray();
  console.log('\nSample chunk schema:');
  console.log('   Fields:', Object.keys(sampleChunks[0]));
  console.log('\nSample concepts field formats:');
  for (let i = 0; i < Math.min(3, sampleChunks.length); i++) {
    const chunk = sampleChunks[i];
    console.log(`   Chunk ${i + 1}:`);
    console.log(`      concepts type: ${typeof chunk.concepts}`);
    console.log(`      concepts value: ${JSON.stringify(chunk.concepts)?.substring(0, 100)}`);
    if (chunk.concepts) {
      try {
        const parsed = typeof chunk.concepts === 'string' ? JSON.parse(chunk.concepts) : chunk.concepts;
        console.log(`      concepts parsed length: ${Array.isArray(parsed) ? parsed.length : 'not an array'}`);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`      first concept: "${parsed[0]}"`);
        }
      } catch (e) {
        console.log(`      parsing error: ${e}`);
      }
    }
  }
  
  // STEP 3: Search for chunks containing "exaptive bootstrapping"
  console.log('\n' + '='.repeat(80));
  console.log('STEP 3: Search for chunks containing "exaptive bootstrapping"');
  console.log('='.repeat(80));
  
  // Try vector search using the concept's embedding
  console.log('\nAttempting vector search with concept embedding...');
  const vectorSearchResults = await chunksTable
    .vectorSearch(concept.vector)
    .limit(20)
    .toArray();
  
  console.log(`Found ${vectorSearchResults.length} candidate chunks from vector search`);
  
  // Check which ones actually contain the concept
  let matchingChunks = 0;
  let emptyConceptFields = 0;
  let parseErrors = 0;
  
  const debugChunks: any[] = [];
  
  for (const chunk of vectorSearchResults) {
    let conceptsList: string[] = [];
    
    if (!chunk.concepts) {
      emptyConceptFields++;
      continue;
    }
    
    try {
      conceptsList = typeof chunk.concepts === 'string' 
        ? JSON.parse(chunk.concepts)
        : chunk.concepts;
    } catch (e) {
      parseErrors++;
      continue;
    }
    
    if (!Array.isArray(conceptsList)) {
      parseErrors++;
      continue;
    }
    
    // Check if "exaptive bootstrapping" is in the concepts list
    const hasExaptiveBootstrapping = conceptsList.some((c: string) => {
      const cLower = c.toLowerCase();
      const targetLower = 'exaptive bootstrapping';
      return cLower === targetLower || 
             cLower.includes(targetLower) || 
             targetLower.includes(cLower);
    });
    
    if (hasExaptiveBootstrapping) {
      matchingChunks++;
      debugChunks.push({
        id: chunk.id,
        source: chunk.source,
        conceptCount: conceptsList.length,
        concepts: conceptsList
      });
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Chunks with empty concepts field: ${emptyConceptFields}`);
  console.log(`   Chunks with parsing errors: ${parseErrors}`);
  console.log(`   Chunks matching "exaptive bootstrapping": ${matchingChunks}`);
  
  if (matchingChunks > 0) {
    console.log(`\n✅ Found ${matchingChunks} chunks with the concept!`);
    console.log(`\nSample matching chunks:`);
    for (const chunk of debugChunks.slice(0, 3)) {
      console.log(`   - ${chunk.source.substring(chunk.source.lastIndexOf('/') + 1)}`);
      console.log(`     Concepts (${chunk.conceptCount}): ${chunk.concepts.slice(0, 5).join(', ')}`);
    }
  } else {
    console.log(`\n❌ NO chunks found with "exaptive bootstrapping" in their concepts field`);
    console.log(`\nThis is a DATA INTEGRITY ISSUE:`);
    console.log(`   - Concept table says: ${concept.chunk_count} chunks`);
    console.log(`   - Actual chunks found: 0`);
  }
  
  // STEP 4: Check if chunks from the concept's sources contain the concept
  console.log('\n' + '='.repeat(80));
  console.log('STEP 4: Check chunks from concept sources');
  console.log('='.repeat(80));
  
  const sources = concept.sources ? JSON.parse(concept.sources) : [];
  if (sources.length > 0) {
    const sourceFile = sources[0];
    console.log(`\nChecking chunks from: ${sourceFile.substring(sourceFile.lastIndexOf('/') + 1)}`);
    
    // Get all chunks from this source
    const sourceChunks = await chunksTable
      .query()
      .limit(10000)
      .toArray();
    
    const chunksFromSource = sourceChunks.filter((c: any) => c.source === sourceFile);
    console.log(`Found ${chunksFromSource.length} chunks from this source`);
    
    if (chunksFromSource.length > 0) {
      let chunksWithConcepts = 0;
      let chunksWithEmptyConcepts = 0;
      let chunksWithExaptive = 0;
      
      for (const chunk of chunksFromSource) {
        if (!chunk.concepts || chunk.concepts === '[]' || chunk.concepts.length === 0) {
          chunksWithEmptyConcepts++;
        } else {
          chunksWithConcepts++;
          
          try {
            const conceptsList = typeof chunk.concepts === 'string' 
              ? JSON.parse(chunk.concepts)
              : chunk.concepts;
            
            if (Array.isArray(conceptsList)) {
              const hasExaptive = conceptsList.some((c: string) => 
                c.toLowerCase().includes('exaptive bootstrapping')
              );
              if (hasExaptive) {
                chunksWithExaptive++;
              }
            }
          } catch (e) {
            // parsing error
          }
        }
      }
      
      console.log(`   Chunks with concepts: ${chunksWithConcepts}`);
      console.log(`   Chunks with empty concepts: ${chunksWithEmptyConcepts}`);
      console.log(`   Chunks with "exaptive bootstrapping": ${chunksWithExaptive}`);
    }
  }
  
  // STEP 5: Conclusion
  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION');
  console.log('='.repeat(80));
  
  if (matchingChunks === 0 && concept.chunk_count > 0) {
    console.log(`\n🔴 DATA INTEGRITY ISSUE CONFIRMED:`);
    console.log(`   The concept "exaptive bootstrapping" exists in the concepts table`);
    console.log(`   with chunk_count=${concept.chunk_count}, but NO chunks actually`);
    console.log(`   contain this concept in their concepts field.`);
    console.log(`\n📋 Possible causes:`);
    console.log(`   1. Chunks were not properly enriched with concepts`);
    console.log(`   2. Concept index was built but chunks were not updated`);
    console.log(`   3. chunk_count field in concept table is incorrect`);
    console.log(`   4. Chunks were re-indexed without concept enrichment`);
    console.log(`\n💡 Recommended fix:`);
    console.log(`   Run: npx tsx scripts/reenrich_chunks_with_concepts.ts`);
  } else if (matchingChunks > 0 && matchingChunks !== concept.chunk_count) {
    console.log(`\n⚠️  PARTIAL DATA INTEGRITY ISSUE:`);
    console.log(`   Expected ${concept.chunk_count} chunks, found ${matchingChunks}`);
  } else {
    console.log(`\n✅ Data appears consistent`);
    console.log(`   Issue may be in the search algorithm or filtering logic`);
  }
}

investigate().catch(console.error);









