/**
 * In-memory cache for catalog ID → source path mapping.
 * 
 * **STATUS: OPTIONAL for concept lookups (since schema v7)**
 * 
 * With the introduction of derived `catalog_titles` field in the concepts table,
 * this cache is now **optional for concept-to-source resolution**. Tools should:
 * 1. First check if `concept.catalogTitles` is populated for document listings
 * 2. Use this cache primarily for chunk → source resolution (chunks don't store source)
 * 
 * **Primary use cases for this cache:**
 * - Resolving chunk.catalogId → source path (chunks don't store source)
 * - Regeneration scripts (`scripts/rebuild_derived_names.ts`)
 * - Backward compatibility with databases lacking derived name fields
 * 
 * Provides O(1) lookup for resolving catalog IDs to source paths,
 * used when displaying chunk results (chunks no longer store source).
 * 
 * Uses singleton pattern to ensure single source of truth across the application.
 * 
 * @see {@link scripts/rebuild_derived_names.ts} - Uses cache for regeneration
 * @see {@link docs/database-schema.md} - Derived fields documentation
 * 
 * @example
 * ```typescript
 * // For concepts: PREFERRED - use derived field directly
 * const sources = concept.catalogTitles || [];
 * 
 * // For chunks: still need cache (chunks don't store source)
 * const cache = CatalogSourceCache.getInstance();
 * const source = cache.getSource(chunk.catalogId);
 * ```
 */

import { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';

/**
 * In-memory cache for catalog ID → source path mapping.
 * Singleton pattern ensures single source of truth.
 */
export class CatalogSourceCache {
  private static instance: CatalogSourceCache;
  
  private idToSource = new Map<number, string>();
  private initialized = false;
  private catalogCount = 0;
  private lastUpdated?: Date;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CatalogSourceCache {
    if (!CatalogSourceCache.instance) {
      CatalogSourceCache.instance = new CatalogSourceCache();
    }
    return CatalogSourceCache.instance;
  }

  /**
   * Initialize cache by loading all catalog entries from repository
   */
  public async initialize(catalogRepo: CatalogRepository): Promise<void> {
    if (this.initialized) {
      return; // Already initialized, skip
    }

    console.log('[CatalogSourceCache] Loading catalog entries...');
    const startTime = Date.now();

    // Load all catalog entries via search with empty query
    const entries = await catalogRepo.search({ text: '', limit: 100000 });
    
    // Build ID → source map
    for (const entry of entries) {
      if (entry.id && entry.source) {
        this.idToSource.set(entry.id, entry.source);
      }
    }

    this.catalogCount = this.idToSource.size;
    this.initialized = true;
    this.lastUpdated = new Date();

    const elapsed = Date.now() - startTime;
    console.log(`[CatalogSourceCache] Loaded ${this.catalogCount} catalog entries in ${elapsed}ms`);
  }

  /**
   * Get source path by catalog ID
   */
  public getSource(catalogId: number): string | undefined {
    this.ensureInitialized();
    return this.idToSource.get(catalogId);
  }

  /**
   * Get multiple source paths by catalog IDs
   */
  public getSources(catalogIds: number[]): (string | undefined)[] {
    this.ensureInitialized();
    return catalogIds.map(id => this.idToSource.get(id));
  }

  /**
   * Get source path or fallback
   */
  public getSourceOrDefault(catalogId: number, defaultValue: string = 'Unknown'): string {
    return this.getSource(catalogId) ?? defaultValue;
  }

  /**
   * Add a new catalog entry to cache (for dynamic updates)
   */
  public addEntry(catalogId: number, source: string): void {
    this.ensureInitialized();
    this.idToSource.set(catalogId, source);
    this.catalogCount = this.idToSource.size;
  }

  /**
   * Check if cache is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get cache statistics
   */
  public getStats(): { catalogCount: number; lastUpdated?: Date } {
    return {
      catalogCount: this.catalogCount,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Clear cache (for testing or reinitialization)
   */
  public clear(): void {
    this.idToSource.clear();
    this.initialized = false;
    this.catalogCount = 0;
    this.lastUpdated = undefined;
  }

  /**
   * Reset singleton (for testing)
   */
  public static resetInstance(): void {
    if (CatalogSourceCache.instance) {
      CatalogSourceCache.instance.clear();
    }
    CatalogSourceCache.instance = undefined as any;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CatalogSourceCache not initialized. Call initialize() first.');
    }
  }
}
