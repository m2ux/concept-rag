/**
 * Search Result Cache
 * 
 * Caches search results to reduce query latency for repeated searches.
 * Uses LRU eviction with TTL to ensure results stay reasonably fresh.
 * 
 * **Features:**
 * - Deterministic cache key generation from query + options
 * - Default 5-minute TTL for freshness
 * - LRU eviction for bounded memory usage
 * - Metrics tracking for cache effectiveness
 * 
 * **Use Cases:**
 * - Catalog search caching
 * - Concept search caching
 * - Chunk search caching
 * - Any search operation with stable results
 * 
 * @example
 * ```typescript
 * const cache = new SearchResultCache<SearchResult[]>(1000);
 * 
 * // Check cache before search
 * const cached = cache.get('microservices', { limit: 5 });
 * if (cached) {
 *   return cached;
 * }
 * 
 * // Execute search and cache results
 * const results = await repository.search({ text: 'microservices', limit: 5 });
 * cache.set('microservices', { limit: 5 }, results);
 * ```
 */

import { LRUCache } from './lru-cache.js';
import { createHash } from 'crypto';

/**
 * Generic search options interface
 */
export interface SearchOptions {
  /** Maximum number of results */
  limit?: number;
  
  /** Any additional search parameters */
  [key: string]: any;
}

/**
 * Cache for search results with TTL and LRU eviction.
 * 
 * @typeParam T - Type of search results (e.g., SearchResult[], Chunk[])
 */
export class SearchResultCache<T> {
  /** Underlying LRU cache */
  private cache: LRUCache<string, T>;
  
  /** Default TTL for cache entries (milliseconds) */
  private defaultTTL: number;
  
  /**
   * Create a new search result cache.
   * 
   * @param maxSize - Maximum number of cached searches (default: 1000)
   * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(maxSize: number = 1000, ttlMs: number = 5 * 60 * 1000) {
    this.cache = new LRUCache(maxSize);
    this.defaultTTL = ttlMs;
  }
  
  /**
   * Generate deterministic cache key from query and options.
   * 
   * Uses SHA-256 hash of query + sorted options JSON to ensure:
   * - Same query/options always produces same key
   * - Different options produce different keys
   * - Key length is bounded (64 hex chars)
   * 
   * @param query - Search query text
   * @param options - Search options
   * @returns Cache key (SHA-256 hex string)
   */
  private getCacheKey(query: string, options: SearchOptions): string {
    // Sort options keys for deterministic JSON
    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        acc[key] = options[key];
        return acc;
      }, {} as SearchOptions);
    
    const content = `${query}:${JSON.stringify(sortedOptions)}`;
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Get cached search results.
   * 
   * @param query - Search query text
   * @param options - Search options used for the query
   * @returns Cached results or undefined if not found/expired
   */
  get(query: string, options: SearchOptions): T | undefined {
    const key = this.getCacheKey(query, options);
    return this.cache.get(key);
  }
  
  /**
   * Cache search results.
   * 
   * @param query - Search query text
   * @param options - Search options used for the query
   * @param results - Search results to cache
   * @param ttlMs - Optional custom TTL (overrides default)
   */
  set(query: string, options: SearchOptions, results: T, ttlMs?: number): void {
    const key = this.getCacheKey(query, options);
    this.cache.set(key, results, ttlMs ?? this.defaultTTL);
  }
  
  /**
   * Check if query/options are cached.
   * 
   * @param query - Search query text
   * @param options - Search options
   * @returns true if cached and not expired
   */
  has(query: string, options: SearchOptions): boolean {
    const key = this.getCacheKey(query, options);
    return this.cache.has(key);
  }
  
  /**
   * Invalidate cached results for specific query.
   * 
   * Note: Currently requires exact query + options match.
   * For broad invalidation, use clear().
   * 
   * @param query - Search query text
   * @param options - Search options
   * @returns true if entry was deleted
   */
  invalidate(query: string, options: SearchOptions): boolean {
    const key = this.getCacheKey(query, options);
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cached results.
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache performance metrics.
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
}

