import * as lancedb from '@lancedb/lancedb';

async function main() {
  const db = await lancedb.connect('./db/test');
  
  // List documents
  const catalog = await db.openTable('catalog');
  const docs = await catalog.query().limit(50).toArray();
  console.log('=== Documents in db/test ===');
  docs.forEach((d: any, i: number) => {
    const title = d.title || d.source?.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Unknown';
    console.log(`${i+1}. ${title}`);
  });
  console.log(`\nTotal: ${docs.length} documents\n`);
  
  // List some concepts
  const concepts = await db.openTable('concepts');
  const allConcepts = await concepts.query().limit(200).toArray();
  console.log('=== Sample Concepts (first 50) ===');
  allConcepts.slice(0, 50).forEach((c: any, i: number) => {
    console.log(`${i+1}. ${c.name}`);
  });
  console.log(`\nTotal concepts: ${allConcepts.length}`);
  
  // List categories
  const categories = await db.openTable('categories');
  const allCats = await categories.query().limit(50).toArray();
  console.log('\n=== Categories ===');
  allCats.forEach((c: any, i: number) => {
    console.log(`${i+1}. ${c.category}`);
  });
}

main().catch(console.error);
