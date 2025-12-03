import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./db/test");
  const chunks = await db.openTable("chunks");
  // LanceDB defaults to limit 10 without explicit limit
  const records = await chunks.query().limit(1000000).toArray();
  
  // Get unique catalog titles
  const titles = new Set<string>();
  for (const r of records) {
    titles.add(r.catalog_title || 'EMPTY');
  }
  
  console.log(`=== Unique catalog_titles in chunks (${titles.size} total) ===\n`);
  for (const title of titles) {
    const count = records.filter(r => r.catalog_title === title).length;
    console.log(`"${title}": ${count} chunks`);
  }
}

main().catch(console.error);
