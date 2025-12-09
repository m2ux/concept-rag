/**
 * In-memory cache for bidirectional concept ID ↔ name mapping.
 * 
 * **STATUS: OPTIONAL for runtime queries (since schema v7)**
 * 
 * With the introduction of derived `concept_names` fields in chunks and catalog tables,
 * this cache is now **optional for most query-time operations**. Tools should:
 * 1. First check if `chunk.conceptNames` or `doc.conceptNames` is populated
 * 2. Only fall back to cache resolution for backward compatibility with older databases
 * 
 * **Primary use cases for this cache:**
 * - Regeneration scripts (`scripts/rebuild_derived_names.ts`)
 * - Backward compatibility with databases lacking derived name fields
 * - Batch ID resolution during seeding operations
 * 
 * Provides O(1) lookup performance for converting between database IDs
 * and human-readable concept names, eliminating the need for database queries.
 * 
 * Uses singleton pattern to ensure single source of truth across the application.
 * 
 * @see {@link scripts/rebuild_derived_names.ts} - Uses cache for regeneration
 * @see {@link docs/database-schema.md} - Derived fields documentation
 * 
 * @example
 * ```typescript
 * // PREFERRED: Use derived field directly
 * const conceptNames = chunk.conceptNames || [];
 * 
 * // FALLBACK: Use cache for backward compatibility
 * if (conceptNames.length === 0 && chunk.conceptIds) {
 *   const cache = ConceptIdCache.getInstance();
 *   conceptNames = cache.getNames(chunk.conceptIds.map(String));
 * }
 * ```
 */

import type { IConceptIdCache, ConceptRepositoryForCache } from '../../domain/interfaces/caches/concept-id-cache.js';

/**
 * In-memory cache for bidirectional concept ID ↔ name mapping.
 * 
 * Supports both instance-based (for DI) and singleton (legacy) usage patterns.
 */
export class ConceptIdCache implements IConceptIdCache {
  private static instance: ConceptIdCache | undefined;
  
  private idToName = new Map<string, string>();
  private nameToId = new Map<string, string>();
  private initialized = false;
  private conceptCount = 0;
  private lastUpdated?: Date;

  /**
   * Create a new ConceptIdCache instance.
   * 
   * For dependency injection, create instances directly:
   * ```typescript
   * const cache = new ConceptIdCache();
   * await cache.initialize(conceptRepo);
   * ```
   * 
   * For legacy singleton usage, use getInstance().
   */
  constructor() {}

  /**
   * Get singleton instance (legacy pattern).
   * 
   * @deprecated Prefer creating instances directly for better testability.
   */
  public static getInstance(): ConceptIdCache {
    if (!ConceptIdCache.instance) {
      ConceptIdCache.instance = new ConceptIdCache();
    }
    return ConceptIdCache.instance;
  }
  
  /**
   * Reset singleton instance (for testing).
   */
  public static resetInstance(): void {
    if (ConceptIdCache.instance) {
      ConceptIdCache.instance.clear();
    }
    ConceptIdCache.instance = undefined;
  }

  /**
   * Initialize cache by loading all concepts from repository
   * 
   * @param conceptRepo - Repository to load concepts from
   * @throws Error if already initialized (call clear() first to reinitialize)
   */
  public async initialize(conceptRepo: ConceptRepositoryForCache): Promise<void> {
    if (this.initialized) {
      throw new Error('ConceptIdCache already initialized. Call clear() first to reinitialize.');
    }

    console.log('[ConceptIdCache] Loading concepts...');
    const startTime = Date.now();

    // Load all concepts from database
    const concepts = await conceptRepo.findAll();
    
    // Build bidirectional maps
    for (const concept of concepts) {
      // Concepts in domain model don't have an ID field, use the concept name as a pseudo-ID
      // When we retrieve from DB, we'll need to track IDs separately
      // For now, we'll need the actual row data with IDs from the repository
      const rawId = (concept as any).id || concept.name; // Fallback to concept name if no ID
      // Convert to string for consistent key types (LanceDB IDs are numbers but lookups use strings)
      const id = String(rawId);
      this.idToName.set(id, concept.name);
      this.nameToId.set(concept.name, id);
    }

    this.conceptCount = concepts.length;
    this.lastUpdated = new Date();
    this.initialized = true;

    const elapsed = Date.now() - startTime;
    console.log(`[ConceptIdCache] Loaded ${this.conceptCount} concepts in ${elapsed}ms`);
  }

  /**
   * Get concept ID from name
   * 
   * @param conceptName - Human-readable concept name
   * @returns Concept ID or undefined if not found
   * 
   * @example
   * ```typescript
   * const id = cache.getId("API gateway");  // "123"
   * ```
   */
  public getId(conceptName: string): string | undefined {
    this.ensureInitialized();
    return this.nameToId.get(conceptName);
  }

  /**
   * Get multiple concept IDs from names
   * 
   * @param conceptNames - Array of concept names
   * @returns Array of concept IDs (undefined entries filtered out)
   * 
   * @example
   * ```typescript
   * const ids = cache.getIds(["API gateway", "microservices"]);  // ["123", "456"]
   * ```
   */
  public getIds(conceptNames: string[]): string[] {
    this.ensureInitialized();
    return conceptNames
      .map(name => this.nameToId.get(name))
      .filter((id): id is string => id !== undefined);
  }

  /**
   * Get concept name from ID
   * 
   * @param conceptId - Database concept ID
   * @returns Human-readable concept name or undefined if not found
   * 
   * @example
   * ```typescript
   * const name = cache.getName("123");  // "API gateway"
   * ```
   */
  public getName(conceptId: string): string | undefined {
    this.ensureInitialized();
    return this.idToName.get(conceptId);
  }

  /**
   * Get multiple concept names from IDs
   * 
   * @param conceptIds - Array of concept IDs
   * @returns Array of concept names (undefined entries filtered out)
   * 
   * @example
   * ```typescript
   * const names = cache.getNames(["123", "456"]);  // ["API gateway", "microservices"]
   * ```
   */
  public getNames(conceptIds: string[]): string[] {
    this.ensureInitialized();
    return conceptIds
      .map(id => this.idToName.get(id))
      .filter((name): name is string => name !== undefined);
  }

  /**
   * Check if cache has been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get cache statistics
   */
  public getStats() {
    return {
      initialized: this.initialized,
      conceptCount: this.conceptCount,
      lastUpdated: this.lastUpdated,
      memorySizeEstimate: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear cache (allows reinitialization)
   */
  public clear(): void {
    this.idToName.clear();
    this.nameToId.clear();
    this.initialized = false;
    this.conceptCount = 0;
    this.lastUpdated = undefined;
    console.log('[ConceptIdCache] Cache cleared');
  }

  /**
   * Add a new concept to cache (for dynamic updates)
   * 
   * @param id - Concept ID
   * @param conceptName - Concept name
   */
  public addConcept(id: string, conceptName: string): void {
    this.ensureInitialized();
    
    if (this.nameToId.has(conceptName)) {
      console.warn(`[ConceptIdCache] Concept "${conceptName}" already exists, skipping`);
      return;
    }

    this.idToName.set(id, conceptName);
    this.nameToId.set(conceptName, id);
    this.conceptCount++;
  }

  /**
   * Update concept name (for renames)
   * 
   * @param conceptId - ID of concept to update
   * @param newName - New concept name
   */
  public updateConcept(conceptId: string, newName: string): void {
    this.ensureInitialized();
    
    // Remove old name mapping
    const oldName = this.idToName.get(conceptId);
    if (oldName) {
      this.nameToId.delete(oldName);
    }

    // Add new mappings
    this.idToName.set(conceptId, newName);
    this.nameToId.set(newName, conceptId);
  }

  /**
   * Remove concept from cache
   * 
   * @param conceptId - ID of concept to remove
   */
  public removeConcept(conceptId: string): void {
    this.ensureInitialized();
    
    const name = this.idToName.get(conceptId);
    if (name) {
      this.nameToId.delete(name);
    }
    this.idToName.delete(conceptId);
    this.conceptCount--;
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: 2 map entries * (key size + value size + overhead)
    // Average concept name: 20 characters = 40 bytes
    // ID: 3-10 characters = 20 bytes
    // Map overhead per entry: ~40 bytes
    // Total per concept: ~140 bytes * 2 maps = ~280 bytes
    return this.conceptCount * 280;
  }

  /**
   * Ensure cache is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ConceptIdCache not initialized. Call initialize() first.');
    }
  }

  /**
   * Get all concept IDs (for debugging)
   */
  public getAllIds(): string[] {
    this.ensureInitialized();
    return Array.from(this.idToName.keys());
  }

  /**
   * Get all concept names (for debugging)
   */
  public getAllNames(): string[] {
    this.ensureInitialized();
    return Array.from(this.nameToId.keys());
  }

  /**
   * Check if concept name exists
   */
  public hasName(conceptName: string): boolean {
    this.ensureInitialized();
    return this.nameToId.has(conceptName);
  }

  /**
   * Check if concept ID exists
   */
  public hasId(conceptId: string): boolean {
    this.ensureInitialized();
    return this.idToName.has(conceptId);
  }
}

