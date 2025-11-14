import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';

/**
 * Simple local embedding service using character and word hashing
 * 
 * This is the existing embedding algorithm extracted from
 * hybrid_search_client.ts and query_expander.ts to eliminate duplication.
 */
export class SimpleEmbeddingService implements EmbeddingService {
  generateEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    // Word-based features
    for (let i = 0; i < Math.min(words.length, 100); i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    }
    
    // Character-based features
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
      const charCode = chars.charCodeAt(i);
      embedding[charCode % 384] += 0.1;
    }
    
    // Document-level features
    embedding[0] = text.length / 1000;
    embedding[1] = words.length / 100;
    embedding[2] = (text.match(/\./g) || []).length / 10;
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

