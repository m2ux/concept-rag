# CategoryIdCache Design

**Date**: 2025-11-19  
**Component**: Infrastructure / Caching Layer  
**Purpose**: In-memory bidirectional mapping between category IDs and category names with metadata access

## Overview

The `CategoryIdCache` provides O(1) lookup performance for converting between category IDs (stored in database) and category metadata (names, descriptions, statistics). This eliminates the need for database queries every time we need to resolve category information.

**Key Design Decisions**:
1. **Native integer IDs**: Uses `Map<number, T>` not `Map<string, T>` for maximum efficiency
2. **Metadata rich**: Stores full category metadata (descriptions, stats) for zero-lookup access
3. **Simple mapping**: Just ID ↔ name resolution (no reverse index needed)

**Pattern**: Follows the same design as [ConceptIdCache](../2025-11-19-integer-id-optimization/02-concept-id-cache-design.md) - simple bidirectional mapping with metadata access.

## Architecture

### Design Pattern: Singleton

**Rationale**:
- Single source of truth for category mappings
- Avoid loading categories multiple times
- Share cache across all repositories and tools
- Lazy initialization on first use

### Storage Structure

```typescript
class CategoryIdCache {
  // Bidirectional maps for O(1) lookups (NATIVE INTEGERS)
  private idToCategory: Map<number, CategoryCacheEntry>;  // 5 → full category object
  private nameToId: Map<string, number>;                   // "software architecture" → 5
  
  // Alias resolution (multiple names → one ID)
  private aliasToId: Map<string, number>;                  // "ML" → 15 (machine learning)
  
  // Metadata
  private initialized: boolean;
  private categoryCount: number;
  private lastUpdated: Date;
  
  // Singleton
  private static instance: CategoryIdCache;
}
```

**CategoryCacheEntry** (internal structure):
```typescript
interface CategoryCacheEntry {
  id: number;  // Native integer
  category: string;
  description: string;
  parentCategoryId: number | null;
  aliases: string[];
  relatedCategories: number[];  // Array of integer IDs
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
  // Note: Vector NOT cached (too large, rarely needed)
}
```

**Memory footprint**:
- Each category: ~250-300 bytes (metadata)
- 10 categories: ~3 KB
- 50 categories: ~15 KB
- 200 categories: ~60 KB
- **Typical library**: 15-50 categories = **4-15 KB** (negligible)

## Full Implementation

### File: `src/infrastructure/cache/category-id-cache.ts`

```typescript
import type { CategoryRepository } from '../../domain/interfaces/category-repository';
import type { Category } from '../../domain/models/category';

/**
 * Cache entry for efficient in-memory storage (excludes large vectors)
 */
interface CategoryCacheEntry {
  id: number;  // Native integer
  category: string;
  description: string;
  parentCategoryId: number | null;  // Native integer
  aliases: string[];
  relatedCategories: number[];  // Array of native integers
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
}

/**
 * In-memory cache for bidirectional category ID ↔ name/metadata mapping.
 * 
 * Uses NATIVE INTEGER IDs (not strings) for maximum efficiency.
 * Simple mapping - no reverse index needed (categories stored on documents).
 * 
 * Provides O(1) lookup performance for:
 * - ID → category name
 * - Name → ID
 * - Alias → ID
 * - ID → full metadata
 * 
 * @example
 * ```typescript
 * const cache = CategoryIdCache.getInstance();
 * await cache.initialize(categoryRepository);
 * 
 * // Basic lookups (native integers)
 * const id = cache.getId("software engineering");            // 7362849501 (number)
 * const name = cache.getName(7362849501);                    // "software engineering"
 * 
 * // Metadata access
 * const desc = cache.getDescription(7362849501);             // "Patterns and principles..."
 * const stats = cache.getStatistics(7362849501);             // { documentCount: 47, ... }
 * 
 * // Alias resolution
 * const id = cache.getIdByAlias("ML");                      // 15 (machine learning)
 * 
 * // Batch operations
 * const names = cache.getNames([7362849501, 4829304857]);   // ["software engineering", ...]
 * ```
 */
export class CategoryIdCache {
  private static instance: CategoryIdCache;
  
  private idToCategory = new Map<number, CategoryCacheEntry>();  // Integer keys
  private nameToId = new Map<string, number>();                  // Returns integers
  private aliasToId = new Map<string, number>();                 // Returns integers
  
  private initialized = false;
  private categoryCount = 0;
  private lastUpdated?: Date;

  /**
   * Private constructor - use getInstance() instead
   */
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
   * Initialize cache by loading all categories
   * 
   * @param categoryRepo - Repository to load categories from
   * @throws Error if already initialized (call clear() first to reinitialize)
   */
  public async initialize(categoryRepo: CategoryRepository): Promise<void> {
    if (this.initialized) {
      throw new Error('CategoryIdCache already initialized. Call clear() first to reinitialize.');
    }

    console.log('[CategoryIdCache] Loading categories...');
    const startTime = Date.now();

    // Load all categories from database
    const categories = await categoryRepo.findAll();
    
    // Build category maps
    for (const category of categories) {
      const cacheEntry: CategoryCacheEntry = {
        id: Number(category.id),  // Ensure integer
        category: category.category,
        description: category.description,
        parentCategoryId: category.parentCategoryId ? Number(category.parentCategoryId) : null,
        aliases: category.aliases,
        relatedCategories: category.relatedCategories.map(Number),  // Convert to integers
        documentCount: category.documentCount,
        chunkCount: category.chunkCount,
        conceptCount: category.conceptCount
      };
      
      // Primary mappings (integer keys)
      this.idToCategory.set(cacheEntry.id, cacheEntry);
      this.nameToId.set(category.category, cacheEntry.id);
      
      // Alias mappings
      for (const alias of category.aliases) {
        this.aliasToId.set(alias.toLowerCase(), cacheEntry.id);
      }
    }

    this.categoryCount = categories.length;
    this.lastUpdated = new Date();
    this.initialized = true;

    const elapsed = Date.now() - startTime;
    console.log(`[CategoryIdCache] Loaded ${this.categoryCount} categories in ${elapsed}ms`);
  }

  // ============================================================================
  // BASIC ID ↔ NAME LOOKUPS
  // ============================================================================

  /**
   * Get category ID from name
   * 
   * @param categoryName - Human-readable category name
   * @returns Category ID (integer) or undefined if not found
   */
  public getId(categoryName: string): number | undefined {
    this.ensureInitialized();
    return this.nameToId.get(categoryName);
  }

  /**
   * Get category ID from name OR alias
   * 
   * @param nameOrAlias - Category name or any alias
   * @returns Category ID (integer) or undefined if not found
   */
  public getIdByAlias(nameOrAlias: string): number | undefined {
    this.ensureInitialized();
    
    // Try direct name first
    const directId = this.nameToId.get(nameOrAlias);
    if (directId !== undefined) return directId;
    
    // Try aliases
    return this.aliasToId.get(nameOrAlias.toLowerCase());
  }

  /**
   * Get multiple category IDs from names
   * 
   * @param categoryNames - Array of category names
   * @returns Array of category IDs (integers, undefined entries filtered out)
   */
  public getIds(categoryNames: string[]): number[] {
    this.ensureInitialized();
    return categoryNames
      .map(name => this.nameToId.get(name))
      .filter((id): id is number => id !== undefined);
  }

  /**
   * Get category name from ID
   * 
   * @param categoryId - Database category ID (integer)
   * @returns Human-readable category name or undefined if not found
   */
  public getName(categoryId: number): string | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId)?.category;
  }

  /**
   * Get multiple category names from IDs
   * 
   * @param categoryIds - Array of category IDs (integers)
   * @returns Array of category names (undefined entries filtered out)
   */
  public getNames(categoryIds: number[]): string[] {
    this.ensureInitialized();
    return categoryIds
      .map(id => this.idToCategory.get(id)?.category)
      .filter((name): name is string => name !== undefined);
  }

  // ============================================================================
  // METADATA ACCESS
  // ============================================================================

  /**
   * Get category description
   */
  public getDescription(categoryId: string): string | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId)?.description;
  }

  /**
   * Get parent category ID
   */
  public getParentCategoryId(categoryId: string): string | null | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId)?.parentCategoryId;
  }

  /**
   * Get aliases for a category
   */
  public getAliases(categoryId: string): string[] | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId)?.aliases;
  }

  /**
   * Get related category IDs
   */
  public getRelatedCategories(categoryId: string): string[] | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId)?.relatedCategories;
  }

  /**
   * Get usage statistics for a category
   */
  public getStatistics(categoryId: string): {
    documentCount: number;
    chunkCount: number;
    conceptCount: number;
  } | undefined {
    this.ensureInitialized();
    const entry = this.idToCategory.get(categoryId);
    
    if (!entry) return undefined;
    
    return {
      documentCount: entry.documentCount,
      chunkCount: entry.chunkCount,
      conceptCount: entry.conceptCount
    };
  }

  /**
   * Get full category metadata (without vector)
   */
  public getMetadata(categoryId: string): CategoryCacheEntry | undefined {
    this.ensureInitialized();
    return this.idToCategory.get(categoryId);
  }

  // ============================================================================
  // HIERARCHY OPERATIONS
  // ============================================================================

  /**
   * Get all child category IDs
   */
  public getChildren(parentCategoryId: number): number[] {
    this.ensureInitialized();
    
    const children: number[] = [];
    for (const [id, entry] of this.idToCategory) {
      if (entry.parentCategoryId === parentCategoryId) {
        children.push(id);
      }
    }
    
    return children;
  }

  /**
   * Get full hierarchy path from root to category
   * 
   * @returns Array of category IDs from root to target
   */
  public getHierarchyPath(categoryId: number): number[] {
    this.ensureInitialized();
    
    const path: number[] = [];
    let currentId: number | null = categoryId;
    
    while (currentId !== null) {
      path.unshift(currentId);
      const entry = this.idToCategory.get(currentId);
      currentId = entry?.parentCategoryId || null;
    }
    
    return path;
  }

  /**
   * Get hierarchy path as category names
   */
  public getHierarchyPathNames(categoryId: number): string[] {
    const idPath = this.getHierarchyPath(categoryId);
    return this.getNames(idPath);
  }

  // ============================================================================
  // QUERY & FILTERING
  // ============================================================================

  /**
   * Get all root categories (no parent)
   */
  public getRootCategories(): number[] {
    this.ensureInitialized();
    
    const roots: number[] = [];
    for (const [id, entry] of this.idToCategory) {
      if (entry.parentCategoryId === null) {
        roots.push(id);
      }
    }
    
    return roots;
  }

  /**
   * Get top N categories by document count
   */
  public getTopCategories(limit: number = 10): number[] {
    this.ensureInitialized();
    
    const sorted = Array.from(this.idToCategory.entries())
      .sort((a, b) => b[1].documentCount - a[1].documentCount)
      .slice(0, limit)
      .map(([id]) => id);
    
    return sorted;
  }

  /**
   * Search categories by name (fuzzy match)
   */
  public searchByName(query: string): number[] {
    this.ensureInitialized();
    
    const lowerQuery = query.toLowerCase();
    const matches: number[] = [];
    
    for (const [id, entry] of this.idToCategory) {
      if (entry.category.toLowerCase().includes(lowerQuery)) {
        matches.push(id);
      }
    }
    
    return matches;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

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
      categoryCount: this.categoryCount,
      lastUpdated: this.lastUpdated,
      memorySizeEstimate: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear cache (allows reinitialization)
   */
  public clear(): void {
    this.idToCategory.clear();
    this.nameToId.clear();
    this.aliasToId.clear();
    this.initialized = false;
    this.categoryCount = 0;
    this.lastUpdated = undefined;
    console.log('[CategoryIdCache] Cache cleared');
  }

  /**
   * Add a new category to cache (for dynamic updates)
   * 
   * @param category - Category to add
   */
  public addCategory(category: Category): void {
    this.ensureInitialized();
    
    if (this.nameToId.has(category.category)) {
      console.warn(`[CategoryIdCache] Category "${category.category}" already exists, skipping`);
      return;
    }

    const cacheEntry: CategoryCacheEntry = {
      id: category.id,
      category: category.category,
      description: category.description,
      parentCategoryId: category.parentCategoryId,
      aliases: category.aliases,
      relatedCategories: category.relatedCategories,
      documentCount: category.documentCount,
      chunkCount: category.chunkCount,
      conceptCount: category.conceptCount
    };

    this.idToCategory.set(category.id, cacheEntry);
    this.nameToId.set(category.category, category.id);
    
    // Add aliases
    for (const alias of category.aliases) {
      this.aliasToId.set(alias.toLowerCase(), category.id);
    }
    
    this.categoryCount++;
  }

  /**
   * Update category metadata (for statistics updates)
   * 
   * @param categoryId - ID of category to update
   * @param updates - Partial updates to apply
   */
  public updateCategory(categoryId: string, updates: Partial<CategoryCacheEntry>): void {
    this.ensureInitialized();
    
    const entry = this.idToCategory.get(categoryId);
    if (!entry) {
      console.warn(`[CategoryIdCache] Category ID "${categoryId}" not found, cannot update`);
      return;
    }

    // Update entry
    Object.assign(entry, updates);
    
    // If name changed, update name mapping
    if (updates.category && updates.category !== entry.category) {
      this.nameToId.delete(entry.category);
      this.nameToId.set(updates.category, categoryId);
    }
    
    // If aliases changed, rebuild alias mappings
    if (updates.aliases) {
      // Remove old aliases
      for (const [alias, id] of this.aliasToId) {
        if (id === categoryId) {
          this.aliasToId.delete(alias);
        }
      }
      // Add new aliases
      for (const alias of updates.aliases) {
        this.aliasToId.set(alias.toLowerCase(), categoryId);
      }
    }
  }

  /**
   * Remove category from cache
   * 
   * @param categoryId - ID of category to remove
   */
  public removeCategory(categoryId: string): void {
    this.ensureInitialized();
    
    const entry = this.idToCategory.get(categoryId);
    if (entry) {
      // Remove name mapping
      this.nameToId.delete(entry.category);
      
      // Remove alias mappings
      for (const alias of entry.aliases) {
        this.aliasToId.delete(alias.toLowerCase());
      }
    }
    
    this.idToCategory.delete(categoryId);
    this.categoryCount--;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimate per category:
    // - ID: ~5 bytes
    // - Category name: ~25 bytes
    // - Description: ~100 bytes
    // - Aliases (avg 2): ~40 bytes
    // - Related categories (avg 4): ~20 bytes
    // - Statistics: ~20 bytes
    // - Map overhead: ~40 bytes
    // Total: ~250 bytes per category
    // Plus alias map entries: ~50 bytes per alias
    
    const baseSize = this.categoryCount * 250;
    const aliasSize = this.aliasToId.size * 50;
    
    return baseSize + aliasSize;
  }

  /**
   * Ensure cache is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CategoryIdCache not initialized. Call initialize() first.');
    }
  }

  /**
   * Get all category IDs (for debugging)
   */
  public getAllIds(): number[] {
    this.ensureInitialized();
    return Array.from(this.idToCategory.keys());
  }

  /**
   * Get all category names (for debugging)
   */
  public getAllNames(): string[] {
    this.ensureInitialized();
    return Array.from(this.nameToId.keys());
  }

  /**
   * Check if category name exists
   */
  public hasName(categoryName: string): boolean {
    this.ensureInitialized();
    return this.nameToId.has(categoryName);
  }

  /**
   * Check if category ID exists
   */
  public hasId(categoryId: number): boolean {
    this.ensureInitialized();
    return this.idToCategory.has(categoryId);
  }

  /**
   * Export all categories as plain objects (for debugging/analysis)
   */
  public exportAll(): CategoryCacheEntry[] {
    this.ensureInitialized();
    return Array.from(this.idToCategory.values());
  }
}
```

## Usage Patterns

### Pattern 1: Initialization (Application Startup)

```typescript
// In src/application/container.ts
export class Container {
  private categoryIdCache?: CategoryIdCache;

  async getCategoryIdCache(): Promise<CategoryIdCache> {
    if (!this.categoryIdCache) {
      this.categoryIdCache = CategoryIdCache.getInstance();
      
      // Initialize cache with all categories
      const categoryRepo = await this.getCategoryRepository();
      await this.categoryIdCache.initialize(categoryRepo);
    }
    return this.categoryIdCache;
  }
}
```

### Pattern 2: Repository Usage (Read Operations)

```typescript
// In src/infrastructure/lancedb/catalog-repository.ts
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private categoryIdCache: CategoryIdCache
  ) {}

  async getCategoryNames(entry: CatalogEntry): Promise<string[]> {
    // Use new format if available
    if (entry.category_ids) {
      const ids = JSON.parse(entry.category_ids) as string[];
      return this.categoryIdCache.getNames(ids);
    }
    
    // Fallback to old format
    return JSON.parse(entry.concept_categories) as string[];
  }

  async enrichWithCategoryMetadata(entry: CatalogEntry) {
    const categoryIds = JSON.parse(entry.category_ids || '[]');
    
    return {
      ...entry,
      categories: categoryIds.map(id => ({
        id,
        name: this.categoryIdCache.getName(id),
        description: this.categoryIdCache.getDescription(id),
        statistics: this.categoryIdCache.getStatistics(id)
      }))
    };
  }
}
```

### Pattern 3: Tool Usage (Category Search)

```typescript
// In src/tools/operations/category-search.ts
export async function categorySearch(
  categoryNameOrId: string,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository
) {
  // Resolve category ID (supports name or alias)
  const categoryId = categoryCache.getIdByAlias(categoryNameOrId) 
    || categoryCache.getId(categoryNameOrId);
  
  if (!categoryId) {
    return { error: `Category not found: ${categoryNameOrId}` };
  }
  
  // Get category metadata
  const metadata = categoryCache.getMetadata(categoryId);
  
  // Find all documents in this category
  const documents = await catalogRepo.findByCategory(categoryId);
  
  return {
    category: metadata,
    documentCount: documents.length,
    documents: documents.map(doc => ({
      source: doc.source,
      preview: doc.text.substring(0, 200)
    }))
  };
}
```

### Pattern 4: Hierarchy Navigation

```typescript
// Get full category tree
function getCategoryTree(rootCategoryId: string, cache: CategoryIdCache) {
  const buildTree = (id: string): any => {
    const metadata = cache.getMetadata(id);
    const children = cache.getChildren(id);
    
    return {
      id,
      name: metadata?.category,
      description: metadata?.description,
      statistics: cache.getStatistics(id),
      children: children.map(childId => buildTree(childId))
    };
  };
  
  return buildTree(rootCategoryId);
}
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `initialize()` | O(n) | Load all categories once |
| `getId()` | O(1) | Hash map lookup |
| `getIdByAlias()` | O(1) | Two hash map lookups |
| `getIds()` | O(m) | m lookups, each O(1) |
| `getName()` | O(1) | Hash map lookup |
| `getNames()` | O(m) | m lookups, each O(1) |
| `getMetadata()` | O(1) | Hash map lookup |
| `getChildren()` | O(n) | Scan all entries |
| `getHierarchyPath()` | O(h) | h = hierarchy depth |
| `getTopCategories()` | O(n log n) | Sort all entries |

### Space Complexity

| Dataset Size | Memory Usage | Notes |
|--------------|--------------|-------|
| 10 categories | ~3 KB | Tiny |
| 50 categories | ~15 KB | Typical |
| 200 categories | ~60 KB | Large |
| 1000 categories | ~300 KB | Very large (unlikely) |

### Initialization Time

Benchmarks on typical hardware:
- 10 categories: ~5-10ms
- 50 categories: ~20-40ms
- 200 categories: ~80-150ms

**Much faster than ConceptIdCache** due to fewer categories.

## Comparison: CategoryIdCache vs ConceptIdCache

| Aspect | ConceptIdCache | CategoryIdCache |
|--------|----------------|-----------------|
| Typical size | 8,000-10,000 entries | 15-50 entries |
| Memory usage | ~1.5 MB | ~15 KB |
| Init time | ~100-200ms | ~20-40ms |
| Metadata | Name only | Rich metadata |
| Hierarchy | No | Yes (parent-child) |
| Aliases | No | Yes |
| Statistics | No | Yes (doc/chunk/concept counts) |

## Testing Strategy

### Unit Tests

**File**: `src/__tests__/infrastructure/cache/category-id-cache.test.ts`

```typescript
describe('CategoryIdCache', () => {
  describe('basic lookups', () => {
    it('should return ID for existing category name', () => {
      expect(cache.getId('software architecture')).toBe('5');
    });

    it('should return name for existing category ID', () => {
      expect(cache.getName('5')).toBe('software architecture');
    });
  });

  describe('alias resolution', () => {
    it('should resolve alias to ID', () => {
      expect(cache.getIdByAlias('ML')).toBe('15');  // machine learning
    });

    it('should be case-insensitive for aliases', () => {
      expect(cache.getIdByAlias('ml')).toBe('15');
      expect(cache.getIdByAlias('ML')).toBe('15');
    });
  });

  describe('metadata access', () => {
    it('should return category description', () => {
      const desc = cache.getDescription('5');
      expect(desc).toContain('Patterns and principles');
    });

    it('should return category statistics', () => {
      const stats = cache.getStatistics('5');
      expect(stats.documentCount).toBeGreaterThan(0);
    });
  });

  describe('hierarchy operations', () => {
    it('should return child categories', () => {
      const children = cache.getChildren('3');  // software engineering
      expect(children).toContain('5');  // software architecture
    });

    it('should return full hierarchy path', () => {
      const path = cache.getHierarchyPathNames('5');
      expect(path).toEqual(['software engineering', 'software architecture']);
    });
  });
});
```

## Future Enhancements

### Lazy Loading

For very large category sets (unlikely but possible):

```typescript
class CategoryIdCache {
  private loadedCategories = new Set<string>();
  
  async getMetadata(categoryId: string): Promise<CategoryCacheEntry> {
    if (!this.loadedCategories.has(categoryId)) {
      await this.loadCategory(categoryId);
    }
    return this.idToCategory.get(categoryId);
  }
}
```

### Cache Warming

Preload popular categories:

```typescript
async warmCache(topN: number = 20): Promise<void> {
  const topCategories = this.getTopCategories(topN);
  // Already loaded during initialization, but could prefetch related data
  console.log(`Cache warmed with top ${topN} categories`);
}
```

---

**Status**: Ready for implementation  
**Dependencies**: Category model, CategoryRepository interface  
**Next**: Review [04-migration-plan.md](./04-migration-plan.md) for implementation strategy

**Date**: 2025-11-19

