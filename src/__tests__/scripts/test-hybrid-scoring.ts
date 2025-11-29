import lancedb from "@lancedb/lancedb";

// Simple embedding generator
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
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

function calculateVectorScore(distance: number): number {
  const score = 1 - (distance || 0);
  return Math.max(0, Math.min(score, 1));
}

function wordBoundaryMatch(text: string, term: string): boolean {
  const pattern = new RegExp(`\\b${term}\\b`, 'i');
  return pattern.test(text);
}

function calculateTitleScore(terms: string[], source: string): number {
  if (!source || terms.length === 0) return 0;
  const filename = source.split('/').pop() || source;
  const filenameWithoutExt = filename.split('.').slice(0, -1).join('.');
  const titleParts = filenameWithoutExt.split('--').map(s => s.trim()).filter(s => s.length > 0);
  const titleText = titleParts.join(' ').toLowerCase();

  let matches = 0;
  for (const term of terms) {
    const termLower = term.toLowerCase();
    if (wordBoundaryMatch(titleText, termLower)) {
      matches += 1;
    }
  }
  return Math.min(matches / terms.length, 1.0);
}

function calculateBM25(terms: string[], text: string): number {
  if (!text || terms.length === 0) return 0;
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  
  let termMatches = 0;
  for (const term of terms) {
    const termLower = term.toLowerCase();
    for (const word of words) {
      if (word === termLower || (termLower.length >= 4 && word.includes(termLower))) {
        termMatches++;
        break;
      }
    }
  }
  return termMatches / terms.length;
}

async function main() {
  const db = await lancedb.connect("./test_db");
  const catalog = await db.openTable("catalog");
  
  const queryText = "architecture";
  const queryTerms = [queryText];
  const queryVector = createSimpleEmbedding(queryText);
  
  const results = await catalog
    .vectorSearch(queryVector)
    .limit(30)
    .toArray();
  
  console.log("Query:", queryText);
  console.log("\nHybrid Scores (30% vector + 30% BM25 + 25% title + 15% WordNet):\n");
  
  const scored = results.map(r => {
    const vectorScore = calculateVectorScore(r._distance || 0);
    const titleScore = calculateTitleScore(queryTerms, r.source || '');
    const bm25Score = calculateBM25(queryTerms, r.text || '');
    const wordnetScore = 0;  // Not calculated here
    
    const hybridScore = 
      (vectorScore * 0.30) +
      (bm25Score * 0.30) +
      (titleScore * 0.25) +
      (wordnetScore * 0.15);
    
    return {
      title: (r.title || 'Unknown').substring(0, 50),
      vectorScore,
      bm25Score,
      titleScore,
      hybridScore
    };
  });
  
  // Sort by hybrid score
  scored.sort((a, b) => b.hybridScore - a.hybridScore);
  
  for (const s of scored) {
    console.log(`  ${s.title}...`);
    console.log(`    Vector: ${s.vectorScore.toFixed(3)}, BM25: ${s.bm25Score.toFixed(3)}, Title: ${s.titleScore.toFixed(3)}`);
    console.log(`    Hybrid: ${s.hybridScore.toFixed(3)}`);
    console.log();
  }
}

main().catch(console.error);
