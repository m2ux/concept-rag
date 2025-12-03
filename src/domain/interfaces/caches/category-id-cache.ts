/**
 * Interface for category ID cache operations.
 * 
 * Provides O(1) bidirectional lookup between category IDs and names/aliases,
 * eliminating the need for database queries during category resolution.
 * 
 * **Design Pattern**: Repository/Cache pattern
 * - Abstracts caching implementation
 * - Enables testing with fake implementations
 * - Supports dependency injection
 * 
 * **Use Cases**:
 * - Convert category names/aliases to IDs for database queries
 * - Convert category IDs to names for display
 * - Batch conversions for efficiency
 * 
 * @example
 * ```typescript
 * // Production usage
 * const cache: ICategoryIdCache = CategoryIdCache.getInstance();
 * await cache.initialize(categoryRepository);
 * 
 * const id = cache.getId("software engineering");
 * const name = cache.getName(id);
 * 
 * // Test usage with fake
 * class FakeCategoryIdCache implements ICategoryIdCache {
 *   private map = new Map([[1, "test category"]]);
 *   // ... implement interface
 * }
 * ```
 */
export interface ICategoryIdCache {
  /**
   * Initialize cache by loading all categories from repository.
   * 
   * @param categoryRepo - Repository to load categories from
   * @throws Error if already initialized (call clear() first to reinitialize)
   */
  initialize(categoryRepo: CategoryRepositoryForCache): Promise<void>;
  
  /**
   * Get category ID from name or alias.
   * 
   * Tries name first, then alias if name not found.
   * 
   * @param nameOrAlias - Category name or alias (case-insensitive)
   * @returns Category ID or undefined if not found
   * @throws Error if cache not initialized
   */
  getId(nameOrAlias: string): number | undefined;
  
  /**
   * Get category name from ID.
   * 
   * @param categoryId - Database category ID
   * @returns Category name or undefined if not found
   * @throws Error if cache not initialized
   */
  getName(categoryId: number): string | undefined;
  
  /**
   * Get full category object by ID.
   * 
   * @param categoryId - Database category ID
   * @returns Category object or undefined if not found
   * @throws Error if cache not initialized
   */
  getCategory(categoryId: number): any | undefined;
  
  /**
   * Get all categories, optionally filtered and sorted.
   * 
   * @param options - Filter and sort options
   * @param options.search - Optional search term for name/description
   * @param options.sortBy - Sort order: 'name', 'popularity', or 'documentCount'
   * @param options.limit - Maximum number of categories to return
   * @returns Array of categories
   * @throws Error if cache not initialized
   */
  getCategories(options?: {
    search?: string;
    sortBy?: 'name' | 'popularity' | 'documentCount';
    limit?: number;
  }): any[];
  
  /**
   * Find category by name (exact match).
   * 
   * @param name - Category name (case-insensitive)
   * @returns Category object or undefined if not found
   * @throws Error if cache not initialized
   */
  findByName(name: string): any | undefined;
  
  /**
   * Find category by alias.
   * 
   * @param alias - Category alias (case-insensitive)
   * @returns Category object or undefined if not found
   * @throws Error if cache not initialized
   */
  findByAlias(alias: string): any | undefined;
  
  /**
   * Check if cache has been initialized.
   */
  isInitialized(): boolean;
  
  /**
   * Get cache statistics.
   * 
   * @returns Statistics object with categoryCount, memorySizeEstimate, etc.
   */
  getStats(): {
    initialized: boolean;
    categoryCount: number;
    lastUpdated?: Date;
    memorySizeEstimate: number;
  };
  
  /**
   * Clear cache (allows reinitialization).
   */
  clear(): void;
  
  /**
   * Check if category exists by name or alias.
   * 
   * @param nameOrAlias - Category name or alias
   * @throws Error if cache not initialized
   */
  has(nameOrAlias: string): boolean;
  
  /**
   * Get all category IDs (for debugging).
   * 
   * @throws Error if cache not initialized
   */
  getAllIds(): number[];
  
  /**
   * Get all category names (for debugging).
   * 
   * @throws Error if cache not initialized
   */
  getAllNames(): string[];
}

/**
 * Repository interface for initializing the cache.
 * Only requires findAll() method to load all categories.
 */
export interface CategoryRepositoryForCache {
  findAll(): Promise<any[]>;
}
