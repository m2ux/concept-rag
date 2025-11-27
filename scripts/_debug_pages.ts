import * as lancedb from '@lancedb/lancedb';

async function debug() {
  const db = await lancedb.connect('./test_db');
  const pages = await db.openTable('pages');
  
  // Get ALL Design Patterns pages
  const dpPages = await pages.query()
    .where('catalog_id = 3')
    .limit(500)
    .toArray();
  
  console.log(`📚 Design Patterns: ${dpPages.length} pages total\n`);
  
  let pagesWithConcepts = 0;
  let totalConceptEntries = 0;
  
  for (const page of dpPages) {
    const conceptIds = page.concept_ids?.toArray 
      ? Array.from(page.concept_ids.toArray())
      : (page.concept_ids || []);
    const validIds = (conceptIds as number[]).filter((id: number) => id !== 0);
    
    if (validIds.length > 0) {
      pagesWithConcepts++;
      totalConceptEntries += validIds.length;
    }
  }
  
  console.log(`Pages with concepts: ${pagesWithConcepts}/${dpPages.length}`);
  console.log(`Total concept entries: ${totalConceptEntries}`);
  
  // Also check Art of War
  console.log('\n---');
  const aowPages = await pages.query()
    .where('catalog_id = 0')
    .limit(200)
    .toArray();
  
  console.log(`📚 Art of War: ${aowPages.length} pages total`);
  
  let aowPagesWithConcepts = 0;
  let aowTotalConcepts = 0;
  
  for (const page of aowPages) {
    const conceptIds = page.concept_ids?.toArray 
      ? Array.from(page.concept_ids.toArray())
      : (page.concept_ids || []);
    const validIds = (conceptIds as number[]).filter((id: number) => id !== 0);
    
    if (validIds.length > 0) {
      aowPagesWithConcepts++;
      aowTotalConcepts += validIds.length;
    }
  }
  
  console.log(`Pages with concepts: ${aowPagesWithConcepts}/${aowPages.length}`);
  console.log(`Total concept entries: ${aowTotalConcepts}`);
}
debug();

