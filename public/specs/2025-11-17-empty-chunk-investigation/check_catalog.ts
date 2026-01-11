/**
 * Check catalog table for the document containing "exaptive bootstrapping"
 */

import * as lancedb from '@lancedb/lancedb';

async function checkCatalog() {
  const dbPath = process.env.CONCEPT_RAG_DB || process.env.HOME + '/.concept_rag';
  const db = await lancedb.connect(dbPath);
  
  console.log('🔍 Checking catalog table for source document\n');
  
  const sourceFile = '~/Documents/ebooks/Philosophy/Complexity Perspectives in Innovation and Social Change -- David Lane, Robert Maxfield, Dwight Read, Sander van der -- Methodos Series 7, 1, 2009 -- 9781282006263 -- 8874df2df88d27d00d277e6c4ffb2e0a.pdf';
  
  // Check catalog
  const catalogTable = await db.openTable('catalog');
  const allCatalog = await catalogTable.query().limit(10000).toArray();
  
  console.log(`Total catalog entries: ${allCatalog.length}`);
  
  const catalogEntry = allCatalog.find((c: any) => c.source === sourceFile);
  
  if (catalogEntry) {
    console.log('\n✅ Found catalog entry for source document:');
    console.log('   source:', catalogEntry.source.substring(catalogEntry.source.lastIndexOf('/') + 1));
    console.log('   concepts type:', typeof catalogEntry.concepts);
    
    try {
      const concepts = typeof catalogEntry.concepts === 'string' 
        ? JSON.parse(catalogEntry.concepts) 
        : catalogEntry.concepts;
      
      console.log('   has primary_concepts:', concepts.primary_concepts ? 'yes' : 'no');
      if (concepts.primary_concepts) {
        console.log(`   primary_concepts count: ${concepts.primary_concepts.length}`);
        const hasExaptive = concepts.primary_concepts.includes('exaptive bootstrapping');
        console.log(`   contains "exaptive bootstrapping": ${hasExaptive ? 'YES' : 'NO'}`);
        
        if (hasExaptive) {
          console.log('\n   First 10 concepts from this document:');
          concepts.primary_concepts.slice(0, 10).forEach((c: string, i: number) => {
            console.log(`      ${i + 1}. ${c}`);
          });
        }
      }
    } catch (e) {
      console.log('   Error parsing concepts:', e);
    }
  } else {
    console.log('\n❌ No catalog entry found for source document');
  }
  
  // Check chunks
  console.log('\n' + '='.repeat(80));
  console.log('Checking chunks table...');
  const chunksTable = await db.openTable('chunks');
  const allChunks = await chunksTable.query().limit(100000).toArray();
  
  console.log(`Total chunks: ${allChunks.length}`);
  
  const chunksFromSource = allChunks.filter((c: any) => c.source === sourceFile);
  console.log(`Chunks from this source: ${chunksFromSource.length}`);
  
  if (chunksFromSource.length === 0) {
    console.log('\n🔴 CONFIRMED: Document is in catalog but has NO chunks!');
    console.log('\nThis explains the issue:');
    console.log('   1. Document was indexed → created catalog entry with concepts');
    console.log('   2. Concept index was built from catalog → includes "exaptive bootstrapping"');
    console.log('   3. But chunks for this document were never created or were deleted');
    console.log('   4. Result: Concept exists but no chunks to return');
  }
  
  // Check how many other documents have this issue
  console.log('\n' + '='.repeat(80));
  console.log('Checking for other affected documents...\n');
  
  const catalogSources = new Set(allCatalog.map((c: any) => c.source));
  const chunkSources = new Set(allChunks.map((c: any) => c.source));
  
  const catalogWithoutChunks: string[] = [];
  for (const source of catalogSources) {
    if (!chunkSources.has(source)) {
      catalogWithoutChunks.push(source);
    }
  }
  
  console.log(`📊 Documents in catalog: ${catalogSources.size}`);
  console.log(`📊 Documents with chunks: ${chunkSources.size}`);
  console.log(`📊 Documents in catalog but NO chunks: ${catalogWithoutChunks.length}`);
  
  if (catalogWithoutChunks.length > 0) {
    console.log('\n🔴 SYSTEM-WIDE ISSUE: Multiple documents affected');
    console.log('\nSample affected documents:');
    catalogWithoutChunks.slice(0, 5).forEach((source, i) => {
      console.log(`   ${i + 1}. ${source.substring(source.lastIndexOf('/') + 1)}`);
    });
    
    if (catalogWithoutChunks.length > 5) {
      console.log(`   ... and ${catalogWithoutChunks.length - 5} more`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`
The concept index is built from the CATALOG table, which contains
document-level concept summaries. However, the CHUNKS table contains
the actual text chunks that need to be searched.

The issue occurs when:
1. A document is processed → creates catalog entry
2. Concept index is built → uses catalog
3. Chunks are missing → either not created or deleted

This creates a mismatch where concepts exist but have no searchable chunks.

IMPACT:
- ${catalogWithoutChunks.length} documents affected
- Unknown number of concepts affected
- Concept searches return 0 results despite showing chunk_count > 0

SOLUTION:
Need to either:
A) Re-chunk the missing documents, OR
B) Remove orphaned concepts from the concept index, OR  
C) Fix the chunk count calculation to only count existing chunks
  `);
}

checkCatalog().catch(console.error);









