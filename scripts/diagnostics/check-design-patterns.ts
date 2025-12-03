import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./db/test");
  const chunks = await db.openTable("chunks");
  // LanceDB defaults to limit 10 without explicit limit
  const records = await chunks.query().limit(1000000).toArray();
  
  // Find Design Patterns chunks
  const dpChunks = records.filter(r => 
    (r.catalog_title || '').toLowerCase().includes('design patterns')
  );
  
  console.log(`=== Design Patterns Book: ${dpChunks.length} chunks ===\n`);
  
  // Show first 3 chunks
  for (let i = 0; i < Math.min(3, dpChunks.length); i++) {
    const chunk = dpChunks[i];
    console.log(`Chunk ${i + 1}:`);
    console.log(chunk.text?.substring(0, 300) + '...');
    console.log('---');
  }
  
  // Search for specific terms
  const terms = ['architecture', 'pattern', 'design', 'object'];
  console.log('\n=== Term frequency in Design Patterns chunks ===');
  for (const term of terms) {
    const count = dpChunks.filter(c => 
      (c.text || '').toLowerCase().includes(term)
    ).length;
    console.log(`"${term}": ${count} chunks`);
  }
}

main().catch(console.error);
