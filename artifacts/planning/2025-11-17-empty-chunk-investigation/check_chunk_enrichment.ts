/**
 * Check if chunks from the source document are enriched with "exaptive bootstrapping"
 */

import * as lancedb from '@lancedb/lancedb';

async function checkEnrichment() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  const db = await lancedb.connect(dbPath);
  
  const sourceFile = '~/Documents/ebooks/Philosophy/Complexity Perspectives in Innovation and Social Change -- David Lane, Robert Maxfield, Dwight Read, Sander van der -- Methodos Series 7, 1, 2009 -- 9781282006263 -- 8874df2df88d27d00d277e6c4ffb2e0a.pdf';
  
  console.log('🔍 Checking chunk enrichment for "exaptive bootstrapping"\n');
  console.log('Source:', sourceFile.substring(sourceFile.lastIndexOf('/') + 1), '\n');
  
  const chunksTable = await db.openTable('chunks');
  
  // Load ALL chunks (need to increase limit)
  console.log('Loading all chunks from database...');
  const allChunks = await chunksTable.query().limit(300000).toArray();
  console.log(`Loaded ${allChunks.length.toLocaleString()} chunks\n`);
  
  const sourceChunks = allChunks.filter((c: any) => c.source === sourceFile);
  console.log(`Chunks from this source: ${sourceChunks.length}`);
  
  if (sourceChunks.length === 0) {
    console.log('❌ No chunks found from this source');
    return;
  }
  
  // Check enrichment status
  let chunksWithConcepts = 0;
  let chunksWithEmptyConcepts = 0;
  let chunksWithExaptiveBootstrapping = 0;
  let chunksWithRelatedConcepts = 0;
  
  const relatedConcepts = [
    'complex adaptive systems',
    'socio-technical transitions', 
    'evolutionary economics',
    'innovation',
    'social change'
  ];
  
  const exampleChunksWithExaptive: any[] = [];
  const exampleChunksWithRelated: any[] = [];
  
  for (const chunk of sourceChunks) {
    if (!chunk.concepts || chunk.concepts === '[]') {
      chunksWithEmptyConcepts++;
      continue;
    }
    
    try {
      const conceptsList = typeof chunk.concepts === 'string' 
        ? JSON.parse(chunk.concepts)
        : chunk.concepts;
      
      if (!Array.isArray(conceptsList) || conceptsList.length === 0) {
        chunksWithEmptyConcepts++;
        continue;
      }
      
      chunksWithConcepts++;
      
      // Check for "exaptive bootstrapping"
      const hasExaptive = conceptsList.some((c: string) => 
        c.toLowerCase().includes('exaptive') || c.toLowerCase().includes('bootstrapping')
      );
      
      if (hasExaptive) {
        chunksWithExaptiveBootstrapping++;
        if (exampleChunksWithExaptive.length < 3) {
          exampleChunksWithExaptive.push({
            text: chunk.text.substring(0, 150),
            concepts: conceptsList
          });
        }
      }
      
      // Check for related concepts
      const hasRelated = conceptsList.some((c: string) =>
        relatedConcepts.some(rc => c.toLowerCase().includes(rc.toLowerCase()))
      );
      
      if (hasRelated) {
        chunksWithRelatedConcepts++;
        if (exampleChunksWithRelated.length < 3 && !hasExaptive) {
          exampleChunksWithRelated.push({
            text: chunk.text.substring(0, 150),
            concepts: conceptsList.slice(0, 5)
          });
        }
      }
      
    } catch (e) {
      chunksWithEmptyConcepts++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ENRICHMENT STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total chunks from source: ${sourceChunks.length}`);
  console.log(`Chunks with concepts: ${chunksWithConcepts} (${(chunksWithConcepts / sourceChunks.length * 100).toFixed(1)}%)`);
  console.log(`Chunks with empty concepts: ${chunksWithEmptyConcepts} (${(chunksWithEmptyConcepts / sourceChunks.length * 100).toFixed(1)}%)`);
  console.log(`Chunks with "exaptive" or "bootstrapping": ${chunksWithExaptiveBootstrapping}`);
  console.log(`Chunks with related concepts: ${chunksWithRelatedConcepts}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('ISSUE DIAGNOSIS');
  console.log('='.repeat(80));
  
  if (chunksWithExaptiveBootstrapping === 0) {
    console.log(`
🔴 CONFIRMED: Chunks are NOT enriched with "exaptive bootstrapping"

The document catalog contains "exaptive bootstrapping" as a primary concept,
but NONE of the ${sourceChunks.length} chunks have this concept in their concepts field.

This means:
1. The concept was extracted from the document summary (catalog)
2. The concept index was built from the catalog
3. BUT: The chunks were never enriched with this concept

This is the ROOT CAUSE of the empty search results.
    `);
    
    if (chunksWithConcepts > 0) {
      console.log(`However, ${chunksWithConcepts} chunks DO have other concepts, so they ARE enriched.`);
      console.log(`\nThis suggests the concept-to-chunk matching algorithm did not match`);
      console.log(`"exaptive bootstrapping" to any chunks, possibly because:`);
      console.log(`  - The term appears infrequently in the text`);
      console.log(`  - The matching threshold is too high`);
      console.log(`  - The term only appears in specific sections not captured in chunks`);
      
      if (chunksWithRelatedConcepts > 0) {
        console.log(`\n✅ Related concepts ARE present in ${chunksWithRelatedConcepts} chunks:`);
        console.log(`\nExample chunks with related concepts:`);
        exampleChunksWithRelated.forEach((ex, i) => {
          console.log(`\n${i + 1}. "${ex.text}..."`);
          console.log(`   Concepts: ${ex.concepts.join(', ')}`);
        });
      }
    } else {
      console.log(`\n🔴 WORSE: NO chunks from this document have ANY concepts!`);
      console.log(`This means the chunks were never enriched at all.`);
    }
  } else {
    console.log(`\n✅ Found ${chunksWithExaptiveBootstrapping} chunks with exaptive/bootstrapping concepts`);
    console.log(`\nExample chunks:`);
    exampleChunksWithExaptive.forEach((ex, i) => {
      console.log(`\n${i + 1}. "${ex.text}..."`);
      console.log(`   Concepts: ${ex.concepts.slice(0, 5).join(', ')}`);
    });
    
    console.log(`\n⚠️  But the concept search still returns 0 results.`);
    console.log(`This suggests an issue with the concept matching logic in findByConceptName()`);
  }
  
  // Check the actual text for the term
  console.log('\n' + '='.repeat(80));
  console.log('TEXT ANALYSIS');
  console.log('='.repeat(80));
  
  let chunksContainingExaptiveInText = 0;
  const exampleTextMatches: string[] = [];
  
  for (const chunk of sourceChunks) {
    const text = chunk.text.toLowerCase();
    if (text.includes('exaptive') || text.includes('bootstrapping')) {
      chunksContainingExaptiveInText++;
      if (exampleTextMatches.length < 3) {
        // Find the sentence containing the term
        const sentences = chunk.text.split(/[.!?]/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('exaptive') || sentence.toLowerCase().includes('bootstrapping')) {
            exampleTextMatches.push(sentence.trim());
            break;
          }
        }
      }
    }
  }
  
  console.log(`\nChunks containing "exaptive" or "bootstrapping" in text: ${chunksContainingExaptiveInText}`);
  
  if (chunksContainingExaptiveInText > 0) {
    console.log(`\n✅ The terms DO appear in the actual chunk text!`);
    console.log(`\nExample sentences:`);
    exampleTextMatches.forEach((sentence, i) => {
      console.log(`\n${i + 1}. "${sentence}"`);
    });
    
    console.log(`\n💡 This confirms the enrichment process failed to tag these chunks.`);
    console.log(`\nThe concept extraction found "exaptive bootstrapping" at the document level,`);
    console.log(`but the chunk-to-concept matching did not tag the individual chunks.`);
  } else {
    console.log(`\n⚠️  The terms do NOT appear in any chunk text!`);
    console.log(`\nThis is unusual - the concept was extracted from the document but`);
    console.log(`doesn't appear in any chunk. Possible reasons:`);
    console.log(`  - Term appears in document metadata or title`);
    console.log(`  - Term appears in skipped sections (headers, footers, TOC)`);
    console.log(`  - Concept extraction is too aggressive/hallucinating`);
  }
}

checkEnrichment().catch(console.error);









