import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./db/test");
  const catalog = await db.openTable("catalog");
  const records = await catalog.query().limit(100).toArray();
  
  console.log("Catalog record fields for first entry:\n");
  const first = records[0];
  for (const [key, value] of Object.entries(first)) {
    let display = value;
    if (typeof value === 'string') {
      display = value.length > 100 ? value.substring(0, 100) + '...' : value;
    } else if (Array.isArray(value)) {
      display = `Array(${value.length})`;
    } else if (value && typeof value === 'object' && 'toArray' in value) {
      display = `Vector(${value.toArray().length})`;
    }
    console.log(`  ${key}: ${display}`);
  }
  
  console.log("\n\nChecking 'summary' field for all records:");
  for (const r of records) {
    console.log(`\n  ${r.title}:`);
    console.log(`    summary: ${(r.summary || 'EMPTY').substring(0, 150)}...`);
  }
}

main().catch(console.error);
