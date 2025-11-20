/**
 * CategoryIdCache
 * 
 * In-memory cache for fast O(1) category ID ↔ name lookups and metadata access.
 * Implements singleton pattern for application-wide shared cache.
 * 
 * Features:
 * - Bidirectional ID ↔ name mapping
 * - Alias resolution
 * - Metadata access (descriptions, statistics, hierarchy)
 * - Batch operations
 * - Search and filtering
 * 
 * Design:
 * - Documents have categories (stored on catalog/chunks)
 * - Concepts have NO categories (category-agnostic, cross-domain)
 * - No reverse index needed (categories don't derive from concepts)
 */

import type { CategoryRepository } from '../../domain/interfaces/category-repository';
import type { Category } from '../../domain/models/category';

export class CategoryIdCache {
  private static instance: CategoryIdCache;
  
  // Core mappings
  private idToName: Map<number, string> = new Map();
  private nameToId: Map<string, number> = new Map();
  private idToMetadata: Map<number, Category> = new Map();
  
  // Alias mappings
  private aliasToId: Map<string, number> = new Map();
  
  // Hierarchy mappings
  private idToChildren: Map<number, number[]> = new Map();
  
  private initialized = false;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CategoryIdCache {
    if (!CategoryIdCache.instance) {
      CategoryIdCache.instance = new CategoryIdCache();
    }
    return CategoryIdCache.instance;
  }
  
  /**
   * Initialize cache from repository
   */
  public async initialize(categoryRepo: CategoryRepository): Promise<void> {
    console.log('🔄 Initializing CategoryIdCache...');
    
    const categories = await categoryRepo.findAll();
    console.log(`  📊 Loading ${categories.length} categories into cache...`);
    
    // Clear existing data
    this.idToName.clear();
    this.nameToId.clear();
    this.idToMetadata.clear();
    this.aliasToId.clear();
    this.idToChildren.clear();
    
    // Build mappings
    for (const category of categories) {
      // ID ↔ name
      this.idToName.set(category.id, category.category);
      this.nameToId.set(category.category.toLowerCase(), category.id);
      
      // Metadata
      this.idToMetadata.set(category.id, category);
      
      // Aliases
      for (const alias of category.aliases) {
        this.aliasToId.set(alias.toLowerCase(), category.id);
      }
      
      // Hierarchy
      if (category.parentCategoryId !== null) {
        if (!this.idToChildren.has(category.parentCategoryId)) {
          this.idToChildren.set(category.parentCategoryId, []);
        }
        this.idToChildren.get(category.parentCategoryId)!.push(category.id);
      }
    }
    
    this.initialized = true;
    
    const stats = this.getStats();
    console.log(`✅ CategoryIdCache initialized:`);
    console.log(`   - Categories: ${stats.categoryCount}`);
    console.log(`   - Aliases: ${stats.aliasCount}`);
    console.log(`   - Memory: ${Math.round(stats.memorySizeEstimate / 1024)} KB`);
  }
  
  /**
   * Check if cache is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get category ID by name
   */
  public getId(name: string): number | undefined {
    return this.nameToId.get(name.toLowerCase());
  }
  
  /**
   * Get category name by ID
   */
  public getName(id: number): string | undefined {
    return this.idToName.get(id);
  }
  
  /**
   * Get category IDs for multiple names
   */
  public getIds(names: string[]): number[] {
    return names
      .map(name => this.getId(name))
      .filter((id): id is number => id !== undefined);
  }
  
  /**
   * Get category names for multiple IDs
   */
  public getNames(ids: number[]): string[] {
    return ids
      .map(id => this.getName(id))
      .filter((name): name is string => name !== undefined);
  }
  
  /**
   * Get category ID by alias
   */
  public getIdByAlias(alias: string): number | undefined {
    return this.aliasToId.get(alias.toLowerCase());
  }
  
  /**
   * Get category metadata
   */
  public getMetadata(id: number): Category | undefined {
    return this.idToMetadata.get(id);
  }
  
  /**
   * Get category description
   */
  public getDescription(id: number): string | undefined {
    return this.idToMetadata.get(id)?.description;
  }
  
  /**
   * Get category statistics
   */
  public getStatistics(id: number): {
    documentCount: number;
    chunkCount: number;
    conceptCount: number;
  } | undefined {
    const metadata = this.idToMetadata.get(id);
    if (!metadata) return undefined;
    
    return {
      documentCount: metadata.documentCount,
      chunkCount: metadata.chunkCount,
      conceptCount: metadata.conceptCount
    };
  }
  
  /**
   * Get child category IDs
   */
  public getChildren(parentId: number): number[] {
    return this.idToChildren.get(parentId) || [];
  }
  
  /**
   * Get hierarchy path from root to category (inclusive)
   */
  public getHierarchyPath(id: number): number[] {
    const path: number[] = [];
    let currentId: number | null = id;
    
    // Prevent infinite loops
    const visited = new Set<number>();
    
    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      path.unshift(currentId);
      
      const metadata = this.idToMetadata.get(currentId);
      currentId = metadata?.parentCategoryId ?? null;
    }
    
    return path;
  }
  
  /**
   * Get hierarchy path as names
   */
  public getHierarchyPathNames(id: number): string[] {
    return this.getHierarchyPath(id)
      .map(id => this.getName(id))
      .filter((name): name is string => name !== undefined);
  }
  
  /**
   * Get all category names
   */
  public getAllNames(): string[] {
    return Array.from(this.nameToId.keys());
  }
  
  /**
   * Get all category IDs
   */
  public getAllIds(): number[] {
    return Array.from(this.idToName.keys());
  }
  
  /**
   * Search categories by name
   */
  public searchByName(query: string): Category[] {
    const lowerQuery = query.toLowerCase();
    const results: Category[] = [];
    
    for (const metadata of this.idToMetadata.values()) {
      if (
        metadata.category.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))
      ) {
        results.push(metadata);
      }
    }
    
    return results;
  }
  
  /**
   * Get top categories by document count
   */
  public getTopCategories(limit: number): Category[] {
    return Array.from(this.idToMetadata.values())
      .sort((a, b) => b.documentCount - a.documentCount)
      .slice(0, limit);
  }
  
  /**
   * Export all categories with metadata
   */
  public exportAll(): Category[] {
    return Array.from(this.idToMetadata.values());
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): {
    categoryCount: number;
    aliasCount: number;
    memorySizeEstimate: number;
  } {
    // Estimate memory usage
    const categoryMemory = this.idToMetadata.size * 300; // ~300 bytes per category
    const aliasMemory = this.aliasToId.size * 50; // ~50 bytes per alias
    const hierarchyMemory = this.idToChildren.size * 40; // ~40 bytes per parent
    
    return {
      categoryCount: this.idToMetadata.size,
      aliasCount: this.aliasToId.size,
      memorySizeEstimate: categoryMemory + aliasMemory + hierarchyMemory
    };
  }
  
  /**
   * Clear cache (for testing)
   */
  public clear(): void {
    this.idToName.clear();
    this.nameToId.clear();
    this.idToMetadata.clear();
    this.aliasToId.clear();
    this.idToChildren.clear();
    this.initialized = false;
  }
}

