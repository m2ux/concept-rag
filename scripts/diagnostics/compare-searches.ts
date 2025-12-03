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
  
  // Find all concepts that might relate to "software architecture"
  const allConcepts = await concepts.query().limit(100000).toArray();
  
  const architectureRelated = allConcepts.filter(c => {
    const name = (c.name || '').toLowerCase();
    const summary = (c.summary || '').toLowerCase();
    return name.includes('architect') || 
           name.includes('software') ||
           summary.includes('architecture') ||
           summary.includes('software design');
  });
  
  console.log(`Found ${architectureRelated.length} concepts related to architecture/software:\n`);
  
  for (const c of architectureRelated.slice(0, 15)) {
    const catalogTitles = parseArray(c.catalog_titles);
    const titles = catalogTitles.filter(t => t).map(t => {
      // Extract just the book name
      const parts = t.split('/').pop()?.split(' -- ');
      return parts?.[0] || t;
    });
    
    console.log(`  "${c.name}"`);
    console.log(`    In: ${titles.join(', ') || 'unknown'}`);
  }
  
  if (architectureRelated.length > 15) {
    console.log(`  ... and ${architectureRelated.length - 15} more`);
  }
}

main().catch(console.error);
