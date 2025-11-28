import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  const chunks = await db.openTable("chunks");
  
  // Get total count first
  const count = await chunks.countRows();
  console.log(`Total chunks in table: ${count}`);
  
  // Query all records with explicit high limit
  const allRecords = await chunks.query().limit(100000).toArray();
  console.log(`Query with limit(100000) returned: ${allRecords.length} records`);
  
  // Check catalog_title distribution
  const titleCounts = new Map<string, number>();
  for (const r of allRecords) {
    const title = r.catalog_title || 'EMPTY/NULL';
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  }
  
  console.log("\nChunks by catalog_title:");
  for (const [title, cnt] of titleCounts.entries()) {
    console.log(`  "${title.substring(0, 60)}...": ${cnt}`);
  }
}

main().catch(console.error);
