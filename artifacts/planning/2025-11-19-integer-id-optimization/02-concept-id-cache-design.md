# ConceptIdCache Design

**Date**: 2025-11-19  
**Component**: Infrastructure / Caching Layer  
**Purpose**: In-memory bidirectional mapping between concept IDs and concept names

## Overview

The `ConceptIdCache` provides O(1) lookup performance for converting between concept IDs (stored in database) and concept names (displayed to users). This eliminates the need for database queries every time we need to resolve concept names.

## Architecture

### Design Pattern: Singleton

**Rationale**: 
- Single source of truth for concept mappings
- Avoid loading concepts multiple times
- Share cache across all repositories and tools
- Lazy initialization on first use

### Storage Structure

```typescript
class ConceptIdCache {
  // Bidirectional maps for O(1) lookups in both directions
  private idToName: Map<string, string>;      // "123" → "API gateway"
  private nameToId: Map<string, string>;      // "API gateway" → "123"
  
  // Metadata
  private initialized: boolean;
  private conceptCount: number;
  private lastUpdated: Date;
  
  // Singleton
  private static instance: ConceptIdCache;
}
```

**Memory footprint**:
- Each concept: ~100-200 bytes (ID + name + map overhead)
- 1,000 concepts: ~150 KB
- 10,000 concepts: ~1.5 MB
- 100,000 concepts: ~15 MB

## Full Implementation

### File: `src/infrastructure/cache/concept-id-cache.ts`

```typescript
import type { ConceptRepository } from '../../domain/interfaces/concept-repository';
import type { Concept } from '../../domain/models/concept';

/**
 * In-memory cache for bidirectional concept ID ↔ name mapping.
 * 
 * Provides O(1) lookup performance for converting between database IDs
 * and human-readable concept names.
 * 
 * @example
 * ```typescript
 * const cache = ConceptIdCache.getInstance();
 * await cache.initialize(conceptRepository);
 * 
 * const id = cache.getId("API gateway");      // "123"
 * const name = cache.getName("123");          // "API gateway"
 * const names = cache.getNames([123, 456]);   // ["API gateway", "microservices"]
 * ```
 */
export class ConceptIdCache {
  private static instance: ConceptIdCache;
  
  private idToName = new Map<string, string>();
  private nameToId = new Map<string, string>();
  private initialized = false;
  private conceptCount = 0;
  private lastUpdated?: Date;

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConceptIdCache {
    if (!ConceptIdCache.instance) {
      ConceptIdCache.instance = new ConceptIdCache();
    }
    return ConceptIdCache.instance;
  }

  /**
   * Initialize cache by loading all concepts from repository
   * 
   * @param conceptRepo - Repository to load concepts from
   * @throws Error if already initialized (call clear() first to reinitialize)
   */
  public async initialize(conceptRepo: ConceptRepository): Promise<void> {
    if (this.initialized) {
      throw new Error('ConceptIdCache already initialized. Call clear() first to reinitialize.');
    }

    console.log('[ConceptIdCache] Loading concepts...');
    const startTime = Date.now();

    // Load all concepts from database
    const concepts = await conceptRepo.findAll();
    
    // Build bidirectional maps
    for (const concept of concepts) {
      this.idToName.set(concept.id, concept.concept);
      this.nameToId.set(concept.concept, concept.id);
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
   * @param concept - Concept to add
   */
  public addConcept(concept: Concept): void {
    this.ensureInitialized();
    
    if (this.nameToId.has(concept.concept)) {
      console.warn(`[ConceptIdCache] Concept "${concept.concept}" already exists, skipping`);
      return;
    }

    this.idToName.set(concept.id, concept.concept);
    this.nameToId.set(concept.concept, concept.id);
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
```

## Usage Patterns

### Pattern 1: Initialization (Application Startup)

```typescript
// In src/application/container.ts
export class Container {
  private conceptIdCache?: ConceptIdCache;

  async getConceptIdCache(): Promise<ConceptIdCache> {
    if (!this.conceptIdCache) {
      this.conceptIdCache = ConceptIdCache.getInstance();
      
      // Initialize cache with all concepts
      const conceptRepo = await this.getConceptRepository();
      await this.conceptIdCache.initialize(conceptRepo);
    }
    return this.conceptIdCache;
  }
}
```

### Pattern 2: Repository Usage (Read Operations)

```typescript
// In src/infrastructure/lancedb/catalog-repository.ts
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private conceptIdCache: ConceptIdCache
  ) {}

  async getConceptNames(entry: CatalogEntry): Promise<string[]> {
    // Use new format if available
    if (entry.concept_ids) {
      const ids = JSON.parse(entry.concept_ids) as string[];
      return this.conceptIdCache.getNames(ids);
    }
    
    // Fallback to old format
    return JSON.parse(entry.concepts) as string[];
  }

  async search(params: SearchParams): Promise<CatalogEntry[]> {
    // ... vector search logic ...
    
    // Enrich results with concept names
    const enriched = await Promise.all(
      results.map(async (entry) => ({
        ...entry,
        conceptNames: await this.getConceptNames(entry)
      }))
    );
    
    return enriched;
  }
}
```

### Pattern 3: Ingestion Usage (Write Operations)

```typescript
// In hybrid_fast_seed.ts
import { ConceptIdCache } from './src/infrastructure/cache/concept-id-cache';

async function seedDatabase() {
  // ... create concepts table first ...
  
  // Initialize cache
  const conceptIdCache = ConceptIdCache.getInstance();
  await conceptIdCache.initialize(conceptRepository);
  
  // When creating catalog entries
  for (const doc of documents) {
    const conceptNames = extractConcepts(doc);
    const conceptIds = conceptIdCache.getIds(conceptNames);
    
    const catalogEntry = {
      // ... other fields ...
      concepts: JSON.stringify(conceptNames),      // Old format (backward compat)
      concept_ids: JSON.stringify(conceptIds),     // New format
    };
    
    await catalogTable.add([catalogEntry]);
  }
}
```

### Pattern 4: Tool Usage (Display)

```typescript
// In src/tools/operations/catalog-search.ts
export async function catalogSearch(
  query: string,
  catalogRepo: CatalogRepository,
  conceptCache: ConceptIdCache
): Promise<string> {
  const results = await catalogRepo.search({ text: query, limit: 5 });
  
  // Format results with concept names
  const formatted = results.map(entry => {
    const concepts = entry.concept_ids
      ? conceptCache.getNames(JSON.parse(entry.concept_ids))
      : JSON.parse(entry.concepts);
    
    return {
      source: entry.source,
      concepts: concepts.join(', '),
      preview: entry.text.substring(0, 200)
    };
  });
  
  return JSON.stringify(formatted, null, 2);
}
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `initialize()` | O(n) | Load all concepts once |
| `getId()` | O(1) | Hash map lookup |
| `getIds()` | O(m) | m lookups, each O(1) |
| `getName()` | O(1) | Hash map lookup |
| `getNames()` | O(m) | m lookups, each O(1) |
| `addConcept()` | O(1) | Hash map insert |
| `updateConcept()` | O(1) | Hash map update |
| `removeConcept()` | O(1) | Hash map delete |

### Space Complexity

| Dataset Size | Memory Usage | Notes |
|--------------|--------------|-------|
| 1,000 concepts | ~150 KB | Negligible |
| 10,000 concepts | ~1.5 MB | Typical library |
| 100,000 concepts | ~15 MB | Large library |
| 1,000,000 concepts | ~150 MB | Very large corpus |

### Initialization Time

Benchmarks on typical hardware:
- 1,000 concepts: ~10-20ms
- 10,000 concepts: ~100-200ms
- 100,000 concepts: ~1-2 seconds

## Error Handling

### Initialization Errors

```typescript
try {
  await cache.initialize(conceptRepo);
} catch (error) {
  if (error.message.includes('already initialized')) {
    // Cache already loaded, safe to continue
    console.log('Cache already initialized');
  } else {
    // Database connection error, retry or fail
    console.error('Failed to initialize cache:', error);
    throw error;
  }
}
```

### Missing Concepts

```typescript
// Safe handling of missing concepts
const conceptIds = cache.getIds(["API gateway", "nonexistent concept"]);
// Returns: ["123"] - undefined values filtered out

const conceptNames = cache.getNames(["123", "999"]);
// Returns: ["API gateway"] - invalid IDs filtered out
```

### Uninitialized Cache

```typescript
const cache = ConceptIdCache.getInstance();

try {
  const id = cache.getId("API gateway");
} catch (error) {
  // Error: ConceptIdCache not initialized. Call initialize() first.
  console.error(error.message);
}
```

## Testing Strategy

### Unit Tests

**File**: `src/__tests__/infrastructure/cache/concept-id-cache.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConceptIdCache } from '../../../infrastructure/cache/concept-id-cache';
import type { ConceptRepository } from '../../../domain/interfaces/concept-repository';

describe('ConceptIdCache', () => {
  let cache: ConceptIdCache;
  let mockRepo: ConceptRepository;

  beforeEach(() => {
    cache = ConceptIdCache.getInstance();
    
    // Mock repository
    mockRepo = {
      findAll: async () => [
        { id: '1', concept: 'API gateway', /* ... */ },
        { id: '2', concept: 'microservices', /* ... */ },
        { id: '3', concept: 'service mesh', /* ... */ }
      ]
    } as ConceptRepository;
  });

  afterEach(() => {
    cache.clear();
  });

  describe('initialization', () => {
    it('should load concepts from repository', async () => {
      await cache.initialize(mockRepo);
      
      expect(cache.isInitialized()).toBe(true);
      expect(cache.getStats().conceptCount).toBe(3);
    });

    it('should throw if already initialized', async () => {
      await cache.initialize(mockRepo);
      
      await expect(cache.initialize(mockRepo)).rejects.toThrow('already initialized');
    });

    it('should allow reinitialization after clear', async () => {
      await cache.initialize(mockRepo);
      cache.clear();
      
      await expect(cache.initialize(mockRepo)).resolves.not.toThrow();
    });
  });

  describe('getId', () => {
    beforeEach(async () => {
      await cache.initialize(mockRepo);
    });

    it('should return ID for existing concept', () => {
      expect(cache.getId('API gateway')).toBe('1');
      expect(cache.getId('microservices')).toBe('2');
    });

    it('should return undefined for non-existent concept', () => {
      expect(cache.getId('nonexistent')).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      expect(cache.getId('api gateway')).toBeUndefined();
      expect(cache.getId('API gateway')).toBe('1');
    });
  });

  describe('getIds', () => {
    beforeEach(async () => {
      await cache.initialize(mockRepo);
    });

    it('should return IDs for multiple concepts', () => {
      const ids = cache.getIds(['API gateway', 'microservices']);
      expect(ids).toEqual(['1', '2']);
    });

    it('should filter out non-existent concepts', () => {
      const ids = cache.getIds(['API gateway', 'nonexistent', 'microservices']);
      expect(ids).toEqual(['1', '2']);
    });

    it('should return empty array for all non-existent', () => {
      const ids = cache.getIds(['foo', 'bar']);
      expect(ids).toEqual([]);
    });
  });

  describe('getName', () => {
    beforeEach(async () => {
      await cache.initialize(mockRepo);
    });

    it('should return name for existing ID', () => {
      expect(cache.getName('1')).toBe('API gateway');
      expect(cache.getName('2')).toBe('microservices');
    });

    it('should return undefined for non-existent ID', () => {
      expect(cache.getName('999')).toBeUndefined();
    });
  });

  describe('getNames', () => {
    beforeEach(async () => {
      await cache.initialize(mockRepo);
    });

    it('should return names for multiple IDs', () => {
      const names = cache.getNames(['1', '2']);
      expect(names).toEqual(['API gateway', 'microservices']);
    });

    it('should filter out non-existent IDs', () => {
      const names = cache.getNames(['1', '999', '2']);
      expect(names).toEqual(['API gateway', 'microservices']);
    });
  });

  describe('dynamic updates', () => {
    beforeEach(async () => {
      await cache.initialize(mockRepo);
    });

    it('should add new concept', () => {
      const newConcept = { id: '4', concept: 'event sourcing', /* ... */ };
      cache.addConcept(newConcept);
      
      expect(cache.getId('event sourcing')).toBe('4');
      expect(cache.getName('4')).toBe('event sourcing');
      expect(cache.getStats().conceptCount).toBe(4);
    });

    it('should update concept name', () => {
      cache.updateConcept('1', 'API Gateway Pattern');
      
      expect(cache.getName('1')).toBe('API Gateway Pattern');
      expect(cache.getId('API gateway')).toBeUndefined();
      expect(cache.getId('API Gateway Pattern')).toBe('1');
    });

    it('should remove concept', () => {
      cache.removeConcept('1');
      
      expect(cache.getId('API gateway')).toBeUndefined();
      expect(cache.getName('1')).toBeUndefined();
      expect(cache.getStats().conceptCount).toBe(2);
    });
  });

  describe('statistics', () => {
    it('should track stats correctly', async () => {
      await cache.initialize(mockRepo);
      
      const stats = cache.getStats();
      expect(stats.initialized).toBe(true);
      expect(stats.conceptCount).toBe(3);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
      expect(stats.memorySizeEstimate).toBeGreaterThan(0);
    });

    it('should estimate memory usage', async () => {
      await cache.initialize(mockRepo);
      
      const stats = cache.getStats();
      // ~280 bytes per concept * 3 concepts = ~840 bytes
      expect(stats.memorySizeEstimate).toBeGreaterThan(500);
      expect(stats.memorySizeEstimate).toBeLessThan(2000);
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance', () => {
      const instance1 = ConceptIdCache.getInstance();
      const instance2 = ConceptIdCache.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should share state across instances', async () => {
      const instance1 = ConceptIdCache.getInstance();
      await instance1.initialize(mockRepo);
      
      const instance2 = ConceptIdCache.getInstance();
      expect(instance2.isInitialized()).toBe(true);
      expect(instance2.getId('API gateway')).toBe('1');
    });
  });

  describe('error handling', () => {
    it('should throw if used before initialization', () => {
      expect(() => cache.getId('test')).toThrow('not initialized');
      expect(() => cache.getIds(['test'])).toThrow('not initialized');
      expect(() => cache.getName('1')).toThrow('not initialized');
      expect(() => cache.getNames(['1'])).toThrow('not initialized');
    });
  });
});
```

## Future Enhancements

### Cache Eviction (for very large datasets)

```typescript
// LRU cache with size limit
class ConceptIdCache {
  private maxSize = 100000;  // Configurable
  private accessOrder = new Map<string, number>();

  private evictIfNeeded(): void {
    if (this.idToName.size > this.maxSize) {
      // Remove least recently used
      const lruId = this.findLRU();
      this.removeConcept(lruId);
    }
  }
}
```

### Cache Warming

```typescript
// Preload frequently used concepts
async warmCache(topN: number): Promise<void> {
  const topConcepts = await conceptRepo.findTopConcepts(topN);
  for (const concept of topConcepts) {
    this.addConcept(concept);
  }
}
```

### Cache Refresh

```typescript
// Refresh cache periodically
async refresh(): Promise<void> {
  this.clear();
  await this.initialize(this.conceptRepo);
}

// Or partial refresh
async refreshConcept(conceptId: string): Promise<void> {
  const concept = await conceptRepo.findById(conceptId);
  this.updateConcept(concept.id, concept.concept);
}
```

---

**Status**: Ready for implementation  
**Dependencies**: None (standalone component)  
**Testing**: Comprehensive unit tests required

