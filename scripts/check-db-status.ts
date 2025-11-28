import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  
  const catalog = await db.openTable("catalog");
  const chunks = await db.openTable("chunks");
  const concepts = await db.openTable("concepts");
  
  const catalogRecords = await catalog.query().toArray();
  const chunkRecords = await chunks.query().toArray();
  const conceptRecords = await concepts.query().toArray();
  
  console.log("=== Database Status ===");
  console.log(`Catalog entries: ${catalogRecords.length}`);
  console.log(`Chunks: ${chunkRecords.length}`);
  console.log(`Concepts: ${conceptRecords.length}`);
  
  console.log("\n=== Chunks per document ===");
  const chunksByDoc = new Map<string, number>();
  for (const c of chunkRecords) {
    const title = c.catalog_title || 'Unknown';
    chunksByDoc.set(title, (chunksByDoc.get(title) || 0) + 1);
  }
  for (const [title, count] of chunksByDoc) {
    console.log(`  ${title}: ${count}`);
  }
  
  console.log("\n=== Catalog entries ===");
  for (const c of catalogRecords) {
    console.log(`  ${c.title}`);
  }
}

main().catch(console.error);
