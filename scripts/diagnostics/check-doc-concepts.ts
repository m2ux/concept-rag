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
  const catalog = await db.openTable("catalog");
  
  const records = await catalog.query().limit(100).toArray();
  
  console.log("Concepts per document:\n");
  
  for (const r of records) {
    const conceptNames = parseArray(r.concept_names);
    const archConcepts = conceptNames.filter(c => 
      c.toLowerCase().includes('architect') || 
      c.toLowerCase().includes('design') ||
      c.toLowerCase().includes('software')
    );
    
    console.log(`📚 ${r.title}`);
    console.log(`   Total concepts: ${conceptNames.filter(c => c).length}`);
    console.log(`   Architecture/Design/Software related:`);
    for (const c of archConcepts.slice(0, 10)) {
      console.log(`     - ${c}`);
    }
    if (archConcepts.length > 10) {
      console.log(`     ... and ${archConcepts.length - 10} more`);
    }
    console.log();
  }
}

main().catch(console.error);
