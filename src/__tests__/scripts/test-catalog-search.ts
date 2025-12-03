import lancedb from "@lancedb/lancedb";

// Simple embedding generator (same as in simple-embedding.ts)
function createSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const dimensions = 384;
  const embedding = new Array(dimensions).fill(0);
  
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const baseIdx = (charCode * (i + 1)) % dimensions;
      embedding[baseIdx] += 1;
      embedding[(baseIdx + 1) % dimensions] += 0.5;
      embedding[(baseIdx + 2) % dimensions] += 0.25;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

async function main() {
  const db = await lancedb.connect("./db/test");
  const catalog = await db.openTable("catalog");
  
  // Generate query embedding
  const queryText = "architecture";
  const queryVector = createSimpleEmbedding(queryText);
  
  console.log("Query:", queryText);
  console.log("Vector dimension:", queryVector.length);
  
  // Do vector search
  const results = await catalog
    .vectorSearch(queryVector)
    .limit(30)  // Get extra for reranking
    .toArray();
  
  console.log(`\nVector search returned ${results.length} results:\n`);
  
  for (const r of results) {
    const title = r.title || r.source?.split('/').pop() || 'Unknown';
    console.log(`  Title: ${title.substring(0, 60)}...`);
    console.log(`    Distance: ${r._distance?.toFixed(4)}`);
    console.log(`    Has 'architecture' in text: ${(r.text || '').toLowerCase().includes('architecture')}`);
    console.log(`    Has 'architecture' in title: ${(r.title || '').toLowerCase().includes('architecture')}`);
    console.log();
  }
}

main().catch(console.error);
