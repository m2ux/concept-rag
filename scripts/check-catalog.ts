import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  const catalog = await db.openTable("catalog");
  const records = await catalog.query().toArray();
  
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
