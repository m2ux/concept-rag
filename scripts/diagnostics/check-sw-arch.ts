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
  
  // Find software architecture concept
  const results = await concepts.query()
    .where("name = 'software architecture'")
    .limit(100)
    .toArray();
  
  if (results.length === 0) {
    console.log("'software architecture' concept not found");
    return;
  }
  
  const c = results[0];
  const relatedConcepts = parseArray(c.related_concepts).filter(x => x && x !== '');
  const relatedIds = parseArray(c.related_ids).filter(x => x && x !== 0);
  const catalogTitles = parseArray(c.catalog_titles).filter(x => x && x !== '');
  
  console.log("'software architecture' concept:\n");
  console.log(`  Related concepts (${relatedConcepts.length}):`);
  for (const rc of relatedConcepts.slice(0, 10)) {
    console.log(`    - ${rc}`);
  }
  if (relatedConcepts.length > 10) {
    console.log(`    ... and ${relatedConcepts.length - 10} more`);
  }
  
  console.log(`\n  Catalog titles (${catalogTitles.length}):`);
  for (const t of catalogTitles) {
    console.log(`    - ${t.substring(0, 60)}...`);
  }
}

main().catch(console.error);
