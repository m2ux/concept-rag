import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import { EmbeddingCache } from '../cache/embedding-cache.js';

/**
 * Simple local embedding service using character and word hashing
 * 
 * This is the existing embedding algorithm extracted from
 * hybrid_search_client.ts and query_expander.ts to eliminate duplication.
 * 
 * **Caching:**
 * Optionally uses EmbeddingCache to avoid redundant computation.
 * When cache is enabled, generates embeddings only for cache misses.
 */
export class SimpleEmbeddingService implements EmbeddingService {
  /** Model identifier for cache keys */
  private readonly MODEL_ID = 'simple-hash-v1';
  
  /** Optional embedding cache */
  private cache?: EmbeddingCache;
  
  /**
   * Create a new SimpleEmbeddingService.
   * 
   * @param cache - Optional embedding cache for performance optimization
   */
  constructor(cache?: EmbeddingCache) {
    this.cache = cache;
  }
  
  generateEmbedding(text: string): number[] {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(text, this.MODEL_ID);
      if (cached) {
        return cached;
      }
    }
    
    // Generate embedding
    const embedding = this.computeEmbedding(text);
    
    // Cache result
    if (this.cache) {
      this.cache.set(text, this.MODEL_ID, embedding);
    }
    
    return embedding;
  }
  
  /**
   * Compute embedding without caching (internal use).
   */
  private computeEmbedding(text: string): number[] {
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
