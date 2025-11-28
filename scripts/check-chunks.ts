import lancedb from "@lancedb/lancedb";

async function main() {
  const db = await lancedb.connect("./test_db");
  const chunks = await db.openTable("chunks");
  const records = await chunks.query().toArray();
  
  // Count chunks containing 'architecture' per document
  const archByDoc = new Map<string, number>();
  
  for (const r of records) {
    const title = r.catalog_title || 'Unknown';
    const text = r.text || '';
    const hasArch = text.toLowerCase().includes('architecture');
    
    if (hasArch) {
      archByDoc.set(title, (archByDoc.get(title) || 0) + 1);
    }
  }
  
  console.log("=== Chunks containing 'architecture' by document ===\n");
  for (const [title, count] of archByDoc.entries()) {
    console.log(`${title}: ${count} chunks`);
  }
  
  if (archByDoc.size === 0) {
    console.log("No chunks contain 'architecture'");
  }
}

main().catch(console.error);
