/**
 * Embedding Cache
 * 
 * Caches embedding vectors to reduce API calls and computation costs.
 * Unlike search results, embeddings don't expire (same text always produces
 * same embedding), so no TTL is used.
 * 
 * **Features:**
 * - Deterministic cache key from text + model hash
 * - No TTL (embeddings are immutable for given text/model)
 * - LRU eviction for bounded memory usage
 * - Per-model caching (different models produce different embeddings)
 * - Metrics tracking for cost savings analysis
 * 
 * **Use Cases:**
 * - Caching embeddings from SimpleEmbeddingService
 * - Future: Caching OpenAI/HuggingFace embeddings
 * - Reducing API costs (40-80% fewer calls expected)
 * 
 * **Performance Impact:**
 * - Expected cache hit rate: 70-80%
 * - Eliminates redundant embedding generation
 * - Significant cost savings for paid embedding APIs
 * 
 * @example
 * ```typescript
 * const cache = new EmbeddingCache(10000);
 * 
 * // Check cache before generating embedding
 * const cached = cache.get('hello world', 'simple-hash-v1');
 * if (cached) {
 *   return cached;
 * }
 * 
 * // Generate and cache
 * const embedding = service.generateEmbedding('hello world');
 * cache.set('hello world', 'simple-hash-v1', embedding);
 * ```
 */

import { LRUCache } from './lru-cache.js';
import { createHash } from 'crypto';

/**
 * Cache for embedding vectors with per-model storage.
 * 
 * Embeddings are immutable (same text + model always produces same vector),
 * so no TTL is needed. Uses LRU eviction when size limit is reached.
 */
export class EmbeddingCache {
  /** Underlying LRU cache */
  private cache: LRUCache<string, number[]>;
  
  /**
   * Create a new embedding cache.
   * 
   * @param maxSize - Maximum number of cached embeddings (default: 10000)
   */
  constructor(maxSize: number = 10000) {
    // No TTL - embeddings don't expire
    this.cache = new LRUCache(maxSize);
  }
  
  /**
   * Generate deterministic cache key from text and model.
   * 
   * Uses SHA-256 hash of text to:
   * - Handle long texts efficiently (bounded key size)
   * - Ensure deterministic keys (same text → same key)
   * - Support per-model caching (key includes model)
   * 
   * @param text - Text that was embedded
   * @param model - Model identifier (e.g., 'simple-hash-v1', 'text-embedding-ada-002')
   * @returns Cache key (format: 'model:textHash')
   */
  private getCacheKey(text: string, model: string): string {
    // Hash text for efficiency (especially for long texts)
    const textHash = createHash('sha256')
      .update(text)
      .digest('hex');
    
    return `${model}:${textHash}`;
  }
  
  /**
   * Get cached embedding vector.
   * 
   * @param text - Text to get embedding for
   * @param model - Model identifier
   * @returns Cached embedding vector or undefined if not found
   */
  get(text: string, model: string): number[] | undefined {
    const key = this.getCacheKey(text, model);
    return this.cache.get(key);
  }
  
  /**
   * Cache embedding vector.
   * 
   * Note: No TTL is set since embeddings are immutable.
   * 
   * @param text - Text that was embedded
   * @param model - Model identifier
   * @param embedding - Embedding vector to cache
   */
  set(text: string, model: string, embedding: number[]): void {
    const key = this.getCacheKey(text, model);
    // No TTL - embeddings don't expire
    this.cache.set(key, embedding);
  }
  
  /**
   * Check if text embedding is cached for given model.
   * 
   * @param text - Text to check
   * @param model - Model identifier
   * @returns true if cached
   */
  has(text: string, model: string): boolean {
    const key = this.getCacheKey(text, model);
    return this.cache.has(key);
  }
  
  /**
   * Delete cached embedding.
   * 
   * Rarely needed since embeddings are immutable, but provided for
   * cases where model implementation changes.
   * 
   * @param text - Text to delete embedding for
   * @param model - Model identifier
   * @returns true if entry was deleted
   */
  delete(text: string, model: string): boolean {
    const key = this.getCacheKey(text, model);
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cached embeddings.
   * 
   * Useful when model implementation changes or for memory management.
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache performance metrics.
   * 
   * Useful for analyzing cost savings:
   * - High hit rate = fewer API calls = lower costs
   * - Evictions = cache might be too small
   * 
   * @returns Cache metrics (hits, misses, hit rate, etc.)
   */
  getMetrics() {
    return this.cache.getMetrics();
  }
  
  /**
   * Reset metrics counters.
   */
  resetMetrics(): void {
    this.cache.resetMetrics();
  }
  
  /**
   * Get current cache size.
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Estimate memory usage of cached embeddings.
   * 
   * Rough estimate: each embedding is ~384 floats * 8 bytes = 3KB
   * Plus overhead for keys and metadata.
   * 
   * @returns Estimated memory usage in bytes
   */
  estimateMemoryUsage(): number {
    // Each number[] is ~384 floats * 8 bytes = 3072 bytes
    // Plus ~100 bytes overhead per entry (key, metadata)
    const bytesPerEntry = 3072 + 100;
    return this.cache.size * bytesPerEntry;
  }
}
