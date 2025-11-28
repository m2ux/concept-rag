import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  const chunks = await db.openTable("chunks");
  const records = await chunks.query().toArray();
  
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
