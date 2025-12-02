import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  
  const tables = await db.tableNames();
  console.log("Tables:", tables);
  
  for (const tableName of tables) {
    const table = await db.openTable(tableName);
    const count = await table.countRows();
    console.log(`  ${tableName}: ${count} rows`);
    
    // Show first record structure
    const sample = await table.query().limit(1).toArray();
    if (sample.length > 0) {
      console.log(`    Fields: ${Object.keys(sample[0]).join(', ')}`);
    }
  }
}

main().catch(console.error);
