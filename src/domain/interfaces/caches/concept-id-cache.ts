/**
 * Interface for concept ID cache operations.
 * 
 * Provides O(1) bidirectional lookup between concept IDs and names,
 * eliminating the need for database queries during ID resolution.
 * 
 * **Design Pattern**: Repository/Cache pattern
 * - Abstracts caching implementation
 * - Enables testing with fake implementations
 * - Supports dependency injection
 * 
 * **Use Cases**:
 * - Convert concept names to IDs for database queries
 * - Convert concept IDs to names for display
 * - Batch conversions for efficiency
 * 
 * @example
 * ```typescript
 * // Production usage
 * const cache: IConceptIdCache = ConceptIdCache.getInstance();
 * await cache.initialize(conceptRepository);
 * 
 * const id = cache.getId("API gateway");
 * const name = cache.getName(id);
 * 
 * // Test usage with fake
 * class FakeConceptIdCache implements IConceptIdCache {
 *   private map = new Map([["123", "test concept"]]);
 *   // ... implement interface
 * }
 * ```
 */
export interface IConceptIdCache {
  /**
   * Initialize cache by loading all concepts from repository.
   * 
   * @param conceptRepo - Repository to load concepts from
   * @throws Error if already initialized (call clear() first to reinitialize)
   */
  initialize(conceptRepo: ConceptRepositoryForCache): Promise<void>;
  
  /**
   * Get concept ID from name.
   * 
   * @param conceptName - Human-readable concept name
   * @returns Concept ID or undefined if not found
   * @throws Error if cache not initialized
   */
  getId(conceptName: string): string | undefined;
  
  /**
   * Get multiple concept IDs from names.
   * 
   * @param conceptNames - Array of concept names
   * @returns Array of concept IDs (undefined entries filtered out)
   * @throws Error if cache not initialized
   */
  getIds(conceptNames: string[]): string[];
  
  /**
   * Get concept name from ID.
   * 
   * @param conceptId - Database concept ID
   * @returns Human-readable concept name or undefined if not found
   * @throws Error if cache not initialized
   */
  getName(conceptId: string): string | undefined;
  
  /**
   * Get multiple concept names from IDs.
   * 
   * @param conceptIds - Array of concept IDs
   * @returns Array of concept names (undefined entries filtered out)
   * @throws Error if cache not initialized
   */
  getNames(conceptIds: string[]): string[];
  
  /**
   * Check if cache has been initialized.
   */
  isInitialized(): boolean;
  
  /**
   * Get cache statistics.
   * 
   * @returns Statistics object with conceptCount, memorySizeEstimate, etc.
   */
  getStats(): {
    initialized: boolean;
    conceptCount: number;
    lastUpdated?: Date;
    memorySizeEstimate: number;
  };
  
  /**
   * Clear cache (allows reinitialization).
   */
  clear(): void;
  
  /**
   * Add a new concept to cache (for dynamic updates).
   * 
   * @param id - Concept ID
   * @param conceptName - Concept name
   * @throws Error if cache not initialized
   */
  addConcept(id: string, conceptName: string): void;
  
  /**
   * Update concept name (for renames).
   * 
   * @param conceptId - ID of concept to update
   * @param newName - New concept name
   * @throws Error if cache not initialized
   */
  updateConcept(conceptId: string, newName: string): void;
  
  /**
   * Remove concept from cache.
   * 
   * @param conceptId - ID of concept to remove
   * @throws Error if cache not initialized
   */
  removeConcept(conceptId: string): void;
  
  /**
   * Check if concept name exists.
   * 
   * @param conceptName - Concept name to check
   * @throws Error if cache not initialized
   */
  hasName(conceptName: string): boolean;
  
  /**
   * Check if concept ID exists.
   * 
   * @param conceptId - Concept ID to check
   * @throws Error if cache not initialized
   */
  hasId(conceptId: string): boolean;
  
  /**
   * Get all concept IDs (for debugging).
   * 
   * @throws Error if cache not initialized
   */
  getAllIds(): string[];
  
  /**
   * Get all concept names (for debugging).
   * 
   * @throws Error if cache not initialized
   */
  getAllNames(): string[];
}

/**
 * Repository interface for initializing the cache.
 * Only requires findAll() method to load all concepts.
 */
export interface ConceptRepositoryForCache {
  findAll(): Promise<any[]>;
}

