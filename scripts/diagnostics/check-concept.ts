import lancedb from "@lancedb/lancedb";

function parseArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && 'toArray' in value) {
    return Array.from(value.toArray());
  }
  return [];
}

async function main() {
  const db = await lancedb.connect("./db/test");
  const concepts = await db.openTable("concepts");
  
  // Search for "software architecture" concept
  const results = await concepts.query()
    .where("name LIKE '%software%architecture%' OR name LIKE '%architecture%'")
    .limit(100)
    .toArray();
  
  console.log(`Found ${results.length} concepts matching 'architecture':\n`);
  
  for (const r of results) {
    const catalogTitles = parseArray(r.catalog_titles);
    const catalogIds = parseArray(r.catalog_ids);
    
    console.log(`  Name: "${r.name}"`);
    console.log(`    ID: ${r.id}`);
    console.log(`    Catalog IDs: ${catalogIds.filter(id => id !== 0).join(', ') || 'none'}`);
    console.log(`    Catalog Titles: ${catalogTitles.filter(t => t).join(', ') || 'none'}`);
    console.log(`    Summary: ${(r.summary || '').substring(0, 100)}...`);
    console.log();
  }
}

main().catch(console.error);
