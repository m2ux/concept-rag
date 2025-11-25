/**
 * LRU (Least Recently Used) Cache with TTL support
 * 
 * A generic in-memory cache that evicts the least recently used items when
 * the cache reaches its maximum size. Optionally supports time-to-live (TTL)
 * for automatic expiration of entries.
 * 
 * **Features:**
 * - O(1) get/set operations using Map
 * - Automatic LRU eviction when size limit reached
 * - Optional TTL (time-to-live) per entry
 * - Built-in metrics tracking (hits, misses, evictions, hit rate)
 * - Bounded memory usage
 * 
 * **Use Cases:**
 * - Search result caching
 * - Embedding caching
 * - Query result memoization
 * - Any temporary data storage with size limits
 * 
 * @example
 * ```typescript
 * // Create cache with max 1000 entries
 * const cache = new LRUCache<string, SearchResult[]>(1000);
 * 
 * // Store with 5 minute TTL
 * cache.set('query:hello', results, 5 * 60 * 1000);
 * 
 * // Retrieve (undefined if expired or not found)
 * const cached = cache.get('query:hello');
 * 
 * // Check metrics
 * const metrics = cache.getMetrics();
 * console.log(`Hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
 * ```
 * 
 * @typeParam K - Key type (must be valid Map key)
 * @typeParam V - Value type
 */

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  /** Number of cache hits (successful gets) */
  hits: number;
  
  /** Number of cache misses (failed gets) */
  misses: number;
  
  /** Number of entries evicted due to size limit */
  evictions: number;
  
  /** Current number of entries in cache */
  size: number;
  
  /** Hit rate (hits / (hits + misses)), 0-1 range */
  hitRate: number;
  
  /** Maximum cache size */
  maxSize: number;
}

/**
 * Internal cache entry with metadata
 */
interface CacheEntry<V> {
  /** Cached value */
  value: V;
  
  /** Timestamp when entry was created */
  timestamp: number;
  
  /** Optional expiration timestamp (ms since epoch) */
  expiresAt?: number;
}

/**
 * LRU Cache implementation with size limits and TTL support.
 * 
 * Uses JavaScript Map which maintains insertion order. When an item is accessed,
 * it's deleted and re-inserted to move it to the end (most recently used position).
 * When the cache is full, the first item (least recently used) is evicted.
 */
export class LRUCache<K, V> {
  /** Internal storage maintaining insertion order */
  private cache: Map<K, CacheEntry<V>>;
  
  /** Maximum number of entries allowed */
  private maxSize: number;
  
  /** Performance metrics */
  private metrics: CacheMetrics;
  
  /**
   * Create a new LRU cache.
   * 
   * @param maxSize - Maximum number of entries (default: 1000)
   */
  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      maxSize
    };
  }
  
  /**
   * Get value from cache.
   * 
   * If the entry exists and is not expired, it's moved to the end (most recently used).
   * Expired entries are automatically removed.
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    // Miss: not found or expired
    if (!entry || this.isExpired(entry)) {
      this.metrics.misses++;
      this.updateHitRate();
      
      // Clean up expired entry
      if (entry) {
        this.cache.delete(key);
        this.metrics.size = this.cache.size;
      }
      
      return undefined;
    }
    
    // Hit: move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.metrics.hits++;
    this.updateHitRate();
    
    return entry.value;
  }
  
  /**
   * Store value in cache with optional TTL.
   * 
   * If the cache is at capacity and the key doesn't exist, the least recently
   * used entry (first in map) is evicted before adding the new entry.
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Optional time-to-live in milliseconds
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Evict LRU if at capacity and key is new
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        this.metrics.evictions++;
      }
    }
    
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined
    };
    
    // Delete first to ensure it's added at the end
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.metrics.size = this.cache.size;
  }
  
  /**
   * Check if key exists in cache (without updating access time).
   * 
   * Note: Does not affect LRU ordering or metrics.
   * 
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.metrics.size = this.cache.size;
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete entry from cache.
   * 
   * @param key - Cache key
   * @returns true if entry was deleted, false if not found
   */
  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.size = this.cache.size;
    }
    return deleted;
  }
  
  /**
   * Clear all entries from cache.
   * 
   * Does not reset metrics (use resetMetrics() for that).
   */
  clear(): void {
    this.cache.clear();
    this.metrics.size = 0;
  }
  
  /**
   * Get current cache metrics.
   * 
   * Returns a copy to prevent external mutation.
   * 
   * @returns Cache performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics counters.
   * 
   * Useful for testing or periodic metric resets.
   */
  resetMetrics(): void {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
    this.metrics.evictions = 0;
    this.metrics.hitRate = 0;
  }
  
  /**
   * Get all keys in cache (ordered from LRU to MRU).
   * 
   * @returns Array of cache keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get current cache size.
   * 
   * @returns Number of entries in cache
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Check if entry is expired.
   * 
   * @param entry - Cache entry
   * @returns true if entry has expired
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }
  
  /**
   * Update hit rate metric.
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
}

