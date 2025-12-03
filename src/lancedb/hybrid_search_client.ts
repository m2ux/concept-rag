import * as lancedb from "@lancedb/lancedb";

export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;

// Simple local embedding function (same as in hybrid_fast_seed.ts)
export function createSimpleEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    for (let i = 0; i < Math.min(words.length, 100); i++) {
        const word = words[i];
        const hash = simpleHash(word);
        embedding[hash % 384] += 1;
    }
    
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
        const charCode = chars.charCodeAt(i);
        embedding[charCode % 384] += 0.1;
    }
    
    embedding[0] = text.length / 1000;
    embedding[1] = words.length / 100;
    embedding[2] = (text.match(/\./g) || []).length / 10;
    
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
}

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// BM25-like scoring for text relevance
export function calculateBM25Score(queryTerms: string[], documentText: string, documentSource: string): number {
    const k1 = 1.5; // Term frequency saturation
    const b = 0.75; // Length normalization
    
    const combinedText = `${documentText} ${documentSource}`.toLowerCase();
    const docWords = combinedText.split(/\s+/);
    const avgDocLength = 100; // Approximate average document length
    const docLength = docWords.length;
    
    let score = 0;
    
    for (const term of queryTerms) {
        const termLower = term.toLowerCase();
        
        // Count term frequency in document
        let termFreq = 0;
        for (const word of docWords) {
            if (word.includes(termLower)) {
                termFreq += 1;
            }
        }
        
        if (termFreq > 0) {
            // BM25 formula
            const numerator = termFreq * (k1 + 1);
            const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
            score += numerator / denominator;
        }
    }
    
    return score;
}

// Extract filename/title from source path
export function extractTitle(sourcePath: string): string {
    const parts = sourcePath.split('/');
    const filename = parts[parts.length - 1];
    // Remove file extension and common separators
    return filename
        .replace(/\.pdf$/i, '')
        .replace(/--/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Check if query terms appear in title
export function titleMatchScore(queryTerms: string[], sourcePath: string): number {
    const title = extractTitle(sourcePath).toLowerCase();
    let score = 0;
    
    for (const term of queryTerms) {
        const termLower = term.toLowerCase();
        if (title.includes(termLower)) {
            // Exact phrase match in title gets highest boost
            score += 10;
        }
    }
    
    return score;
}

// Hybrid search combining vector similarity and keyword matching
export async function hybridSearchTable(
    table: lancedb.Table, 
    queryText: string, 
    limit: number = 5
): Promise<any[]> {
    try {
        // Extract key terms from query
        const queryTerms = queryText
            .split(/\s+/)
            .filter(term => term.length > 2) // Filter out very short words
            .map(term => term.replace(/[^\w\s]/g, '')); // Remove punctuation
        
        // 1. Vector search - get more results than needed
        const queryVector = createSimpleEmbedding(queryText);
        const vectorResults = await table
            .vectorSearch(queryVector)
            .limit(limit * 3) // Get 3x results for reranking
            .toArray();
        
        // 2. Calculate hybrid scores
        const scoredResults = vectorResults.map((result: any) => {
            const vectorScore = 1 - (result._distance || 0); // Convert distance to similarity
            const bm25Score = calculateBM25Score(queryTerms, result.text || '', result.source || '');
            const titleScore = titleMatchScore(queryTerms, result.source || '');
            
            // Weighted combination:
            // - Vector similarity: 40%
            // - BM25 text matching: 30%
            // - Title matching: 30%
            const hybridScore = (vectorScore * 0.4) + (bm25Score * 0.3) + (titleScore * 0.3);
            
            return {
                ...result,
                _vector_score: vectorScore,
                _bm25_score: bm25Score,
                _title_score: titleScore,
                _hybrid_score: hybridScore,
                _distance: 1 - hybridScore // Convert back to distance for consistency
            };
        });
        
        // 3. Re-rank by hybrid score and return top results
        scoredResults.sort((a, b) => b._hybrid_score - a._hybrid_score);
        
        return scoredResults.slice(0, limit);
    } catch (error) {
        console.error('Hybrid search error:', error);
        throw error;
    }
}

// Original simple search (kept for backward compatibility)
export async function searchTable(table: lancedb.Table, queryText: string, limit: number = 5): Promise<any[]> {
    try {
        const queryVector = createSimpleEmbedding(queryText);
        const results = await table
            .vectorSearch(queryVector)
            .limit(limit)
            .toArray();
        
        return results;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

export async function connectToLanceDB(databaseUrl: string, chunksTableName: string, catalogTableName: string) {
  try {
    console.error(`Connecting to database: ${databaseUrl}`);
    client = await lancedb.connect(databaseUrl);

    chunksTable = await client.openTable(chunksTableName);
    catalogTable = await client.openTable(catalogTableName);

    console.error("✅ Connected to LanceDB with hybrid search enabled");

  } catch (error) {
    console.error("LanceDB connection error:", error);
    throw error;
  }
}

export async function closeLanceDB() {
  await client?.close();
}
