/**
 * Test the actual search logic with real data to find the bug
 */

import * as lancedb from '@lancedb/lancedb';

function parseJsonField(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return [];
}

function chunkContainsConcept(chunk: any, concept: string): boolean {
  const concepts = parseJsonField(chunk.concepts);
  
  if (!concepts || concepts.length === 0) {
    return false;
  }
  
  return concepts.some((c: string) => {
    const cLower = c.toLowerCase();
    return cLower === concept || 
           cLower.includes(concept) || 
           concept.includes(cLower);
  });
}

async function testSearchLogic() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  const db = await lancedb.connect(dbPath);
  
  console.log('🔍 Testing search logic with real data\n');
  
  // Step 1: Get concept record
  const conceptsTable = await db.openTable('concepts');
  const conceptRecords = await conceptsTable
    .query()
    .where("concept = 'exaptive bootstrapping'")
    .limit(1)
    .toArray();
  
  if (conceptRecords.length === 0) {
    console.log('❌ Concept not found');
    return;
  }
  
  const concept = conceptRecords[0];
  console.log('✅ Found concept:', concept.concept);
  console.log('   Embeddings:', concept.vector ? `yes (${concept.vector.length}D)` : 'no');
  
  // Step 2: Vector search (same as repository)
  console.log('\n' + '='.repeat(80));
  console.log('STEP 1: Vector search for candidates');
  console.log('='.repeat(80));
  
  const chunksTable = await db.openTable('chunks');
  const candidates = await chunksTable
    .vectorSearch(concept.vector)
    .limit(20)  // Using limit * 3 as in the repo
    .toArray();
  
  console.log(`Found ${candidates.length} candidates from vector search\n`);
  
  // Step 3: Filter with chunkContainsConcept logic
  console.log('=' + '='.repeat(79));
  console.log('STEP 2: Filter candidates with chunkContainsConcept()');
  console.log('='.repeat(80));
  
  const conceptLower = 'exaptive bootstrapping';
  console.log(`Looking for concept: "${conceptLower}"\n`);
  
  let matches = 0;
  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i];
    
    console.log(`Candidate ${i + 1}:`);
    console.log(`   Source: ${row.source.substring(row.source.lastIndexOf('/') + 1, row.source.lastIndexOf('/') + 50)}...`);
    console.log(`   Concepts field type: ${typeof row.concepts}`);
    console.log(`   Concepts field value: ${typeof row.concepts === 'string' ? row.concepts.substring(0, 100) : JSON.stringify(row.concepts).substring(0, 100)}...`);
    
    // Parse concepts
    const concepts = parseJsonField(row.concepts);
    console.log(`   Parsed concepts length: ${concepts.length}`);
    
    if (concepts.length > 0) {
      console.log(`   First 3 concepts: ${concepts.slice(0, 3).join(', ')}`);
      
      // Check if it matches
      const hasMatch = chunkContainsConcept(row, conceptLower);
      console.log(`   Contains "${conceptLower}": ${hasMatch ? 'YES ✅' : 'NO'}`);
      
      if (hasMatch) {
        matches++;
        // Show which concept matched
        for (const c of concepts) {
          const cLower = c.toLowerCase();
          if (cLower === conceptLower || cLower.includes(conceptLower) || conceptLower.includes(cLower)) {
            console.log(`   Matching concept: "${c}"`);
          }
        }
      }
    } else {
      console.log(`   No concepts in chunk`);
    }
    
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log(`Total candidates: ${candidates.length}`);
  console.log(`Matches found: ${matches}`);
  
  if (matches === 0) {
    console.log(`\n🔴 BUG CONFIRMED: The filtering logic is not finding any matches`);
    console.log(`\nPossible issues:`);
    console.log(`   1. Vector search not returning the right chunks`);
    console.log(`   2. Concept string comparison logic has a bug`);
    console.log(`   3. Concept names in chunks don't match the concept name in concept table`);
    
    // Let's check: find chunks that we KNOW have the concept
    console.log(`\n` + '='.repeat(80));
    console.log('VERIFICATION: Load chunks we know have the concept');
    console.log('='.repeat(80));
    
    const allChunks = await chunksTable.query().limit(300000).toArray();
    const sourceFile = '~/Documents/ebooks/Philosophy/Complexity Perspectives in Innovation and Social Change -- David Lane, Robert Maxfield, Dwight Read, Sander van der -- Methodos Series 7, 1, 2009 -- 9781282006263 -- 8874df2df88d27d00d277e6c4ffb2e0a.pdf';
    const sourceChunks = allChunks.filter((c: any) => c.source === sourceFile);
    
    console.log(`\nLoaded ${allChunks.length.toLocaleString()} total chunks`);
    console.log(`Found ${sourceChunks.length} from the source document`);
    
    let enrichedWithExaptive = 0;
    const exampleMatches: any[] = [];
    
    for (const chunk of sourceChunks) {
      if (chunkContainsConcept(chunk, conceptLower)) {
        enrichedWithExaptive++;
        if (exampleMatches.length < 3) {
          const concepts = parseJsonField(chunk.concepts);
          exampleMatches.push({
            id: chunk.id,
            concepts: concepts.filter((c: string) => 
              c.toLowerCase().includes('exaptive') || c.toLowerCase().includes('bootstrapping')
            )
          });
        }
      }
    }
    
    console.log(`\nChunks with "exaptive bootstrapping": ${enrichedWithExaptive}`);
    
    if (enrichedWithExaptive > 0) {
      console.log(`\n✅ Chunks with the concept DO exist!`);
      console.log(`\nExample matching concepts:`);
      exampleMatches.forEach((ex, i) => {
        console.log(`   ${i + 1}. Chunk ${ex.id}:`);
        ex.concepts.forEach((c: string) => {
          console.log(`      - "${c}"`);
        });
      });
      
      console.log(`\n🔴 ROOT CAUSE IDENTIFIED:`);
      console.log(`   The vector search is not returning the chunks that contain the concept!`);
      console.log(`   This means the concept's embedding vector is not similar enough to`);
      console.log(`   the chunk embeddings, even though the chunks contain the concept.`);
      console.log(`\n   This suggests an embedding quality issue or vector space mismatch.`);
    }
  } else {
    console.log(`\n✅ Search logic is working! Found ${matches} matches.`);
  }
}

testSearchLogic().catch(console.error);









