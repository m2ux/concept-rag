import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./db/test");
  const catalog = await db.openTable("catalog");
  // LanceDB defaults to limit 10 without explicit limit
  const records = await catalog.query().limit(100000).toArray();
  
  console.log("=== All Catalog Entries ===\n");
  for (const r of records) {
    const text = r.text || '';
    console.log("Title:", r.title);
    console.log("Source:", r.source?.split('/').pop());
    console.log("Contains 'architecture':", text.toLowerCase().includes('architecture'));
    console.log("---");
  }
}

main().catch(console.error);
