import * as lancedb from "@lancedb/lancedb";
import * as defaults from '../config.js'

export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;

// Simple local embedding function (same as in hybrid_fast_seed.ts)
export function createSimpleEmbedding(text: string): number[] {
    // Create a simple 384-dimensional embedding using character/word features
    const embedding = new Array(384).fill(0);
    
    // Use text characteristics to create a unique vector
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    // Fill embedding with features based on text content
    for (let i = 0; i < Math.min(words.length, 100); i++) {
        const word = words[i];
        const hash = simpleHash(word);
        embedding[hash % 384] += 1;
    }
    
    // Add character-level features
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
        const charCode = chars.charCodeAt(i);
        embedding[charCode % 384] += 0.1;
    }
    
    // Add length and structure features
    embedding[0] = text.length / 1000; // Normalized length
    embedding[1] = words.length / 100; // Normalized word count
    embedding[2] = (text.match(/\./g) || []).length / 10; // Sentence count
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
}

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Simple vector search function
export async function searchTable(table: lancedb.Table, queryText: string, limit: number = 5): Promise<any[]> {
    try {
        // Create embedding for the query
        const queryVector = createSimpleEmbedding(queryText);
        
        // Perform vector search
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

    console.error("✅ Connected to LanceDB with simple embeddings");

  } catch (error) {
    console.error("LanceDB connection error:", error);
    throw error;
  }
}

export async function closeLanceDB() {
  await client?.close();
}

