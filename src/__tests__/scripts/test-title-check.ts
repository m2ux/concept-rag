import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./db/test");
  const catalog = await db.openTable("catalog");
  const records = await catalog.query().limit(100).toArray();
  
  console.log("Catalog records:\n");
  for (const r of records) {
    console.log(`  Title field: "${r.title}"`);
    console.log(`  Source: ${r.source?.substring(0, 80)}...`);
    console.log(`  Text preview: ${(r.text || '').substring(0, 100)}...`);
    console.log();
  }
}

main().catch(console.error);
