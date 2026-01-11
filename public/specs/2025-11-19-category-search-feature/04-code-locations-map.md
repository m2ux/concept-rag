# Code Locations Map: Category Search Feature

**Date**: 2025-11-19  
**Purpose**: Quick reference for where to make code changes  
**Status**: Implementation guide

## Overview

This document maps out exactly which files need to be created or modified for the category search feature implementation. Use this as a checklist during implementation.

## New Files to Create

### Domain Layer

#### 1. Category Model
**File**: `src/domain/models/category.ts`  
**Status**: ❌ New  
**Purpose**: TypeScript interface for Category entity  
**Size**: ~80 lines

```typescript
export interface Category {
  id: string;
  category: string;
  description: string;
  parentCategoryId: string | null;
  aliases: string[];
  relatedCategories: string[];
  documentCount: number;
  chunkCount: number;
  conceptCount: number;
  embeddings: number[];
}
```

#### 2. CategoryRepository Interface
**File**: `src/domain/interfaces/category-repository.ts`  
**Status**: ❌ New  
**Purpose**: Repository interface for category operations  
**Size**: ~60 lines

```typescript
export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  // ... other methods
}
```

### Infrastructure Layer

#### 3. LanceDBCategoryRepository
**File**: `src/infrastructure/lancedb/repositories/lancedb-category-repository.ts`  
**Status**: ❌ New  
**Purpose**: LanceDB implementation of CategoryRepository  
**Size**: ~200 lines  
**Pattern**: Similar to `lancedb-concept-repository.ts`

**Key sections**:
- Constructor with Table injection
- CRUD operations
- Row-to-model mapping
- Query methods

#### 4. CategoryIdCache
**File**: `src/infrastructure/cache/category-id-cache.ts`  
**Status**: ❌ New  
**Purpose**: In-memory cache for category ID ↔ name/metadata mapping  
**Size**: ~400 lines  
**Pattern**: Similar to `concept-id-cache.ts` but with extended metadata

**Key features**:
- Singleton pattern
- Bidirectional maps (ID ↔ name)
- Alias resolution
- Metadata access
- Hierarchy operations

### Tools Layer

#### 5. Category Search Tool
**File**: `src/tools/operations/category-search.ts`  
**Status**: ❌ New  
**Purpose**: MCP tool for searching by category  
**Size**: ~150 lines

**Function signature**:
```typescript
export async function categorySearch(
  params: CategorySearchParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  chunkRepo: ChunkRepository,
  conceptRepo: ConceptRepository
): Promise<string>
```

#### 6. List Categories Tool
**File**: `src/tools/operations/list-categories.ts`  
**Status**: ❌ New  
**Purpose**: MCP tool for listing all categories with statistics  
**Size**: ~80 lines

```typescript
export async function listCategories(
  categoryCache: CategoryIdCache,
  sortBy?: 'name' | 'popularity' | 'documentCount'
): Promise<string>
```

#### 7. List Concepts in Category Tool
**File**: `src/tools/operations/list-concepts-in-category.ts`  
**Status**: ❌ New  
**Purpose**: MCP tool for listing concepts in a category  
**Size**: ~120 lines

```typescript
export async function listConceptsInCategory(
  params: ListConceptsInCategoryParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  conceptRepo: ConceptRepository
): Promise<string>
```

### Scripts

#### 7. Extract Categories Script
**File**: `scripts/extract_categories.ts`  
**Status**: ❌ New  
**Purpose**: Extract unique categories from existing database  
**Size**: ~150 lines  
**Usage**: Run before migration to generate category mapping

#### 8. Create Categories Table Script
**File**: `scripts/create_categories_table.ts`  
**Status**: ❌ New  
**Purpose**: Generate and populate categories table  
**Size**: ~250 lines  
**Usage**: Run during migration to create categories table

#### 9. Validate Category Migration Script
**File**: `scripts/validate_category_migration.ts`  
**Status**: ❌ New  
**Purpose**: Verify migration completed successfully  
**Size**: ~200 lines

### Tests

#### 10. CategoryIdCache Unit Tests
**File**: `src/__tests__/infrastructure/cache/category-id-cache.test.ts`  
**Status**: ❌ New  
**Purpose**: Comprehensive tests for CategoryIdCache  
**Size**: ~400 lines

**Test suites**:
- Basic ID ↔ name lookups
- Alias resolution
- Metadata access
- Hierarchy operations
- Cache management
- Error handling

#### 11. LanceDBCategoryRepository Tests
**File**: `src/__tests__/infrastructure/lancedb/repositories/lancedb-category-repository.test.ts`  
**Status**: ❌ New  
**Purpose**: Tests for category repository  
**Size**: ~300 lines

#### 12. Category Search Integration Tests
**File**: `src/__tests__/integration/category-search.integration.test.ts`  
**Status**: ❌ New  
**Purpose**: End-to-end tests for category search feature  
**Size**: ~250 lines

---

## Files to Modify

### Domain Models

#### 13. Catalog Entry Model
**File**: `src/domain/models/catalog-entry.ts`  
**Status**: ✏️ Modify  
**Lines**: ~30 total, add ~5 lines  
**Changes**:

```typescript
export interface CatalogEntry {
  // ... existing fields ...
  
  // Categories (integer ID optimization) - ADD THESE
  concept_categories: string;  // OLD: category names array
  category_ids?: string;  // NEW: category integer IDs array
}
```

**Location**: Add after `concept_ids` field (~line 25)

#### 14. Chunk Model
**File**: `src/domain/models/chunk.ts`  
**Status**: ✏️ Modify  
**Lines**: ~56 total, add ~5 lines  
**Changes**:

```typescript
export interface Chunk {
  // ... existing fields ...
  
  // Categories - ADD THESE
  concept_categories: string;  // OLD: category names
  category_ids?: string;  // NEW: category IDs
}
```

**Location**: Add after `concept_ids` field (~line 47)

#### 15. Concept Model
**File**: `src/domain/models/concept.ts`  
**Status**: ✏️ Modify  
**Lines**: ~77 total, add ~3 lines  
**Changes**:

```typescript
export interface Concept {
  // ... existing fields ...
  
  // Category (singular) - ADD THIS
  category: string;  // OLD: category name
  category_id?: string;  // NEW: category ID
}
```

**Location**: Add after `conceptType` field (~line 43)

### Infrastructure

#### 16. Schema Validators
**File**: `src/infrastructure/lancedb/utils/schema-validators.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
// Add new validator
export function validateCategoryRow(row: any): void {
  // ... validation logic ...
}

// Update existing validators
export function validateCatalogEntry(entry: any): void {
  // ... existing validations ...
  
  // ADD: category_ids is optional
  if (entry.category_ids !== undefined && typeof entry.category_ids !== 'string') {
    throw new Error('catalog.category_ids must be string (JSON array)');
  }
}

export function validateChunkRow(row: any): void {
  // ... existing validations ...
  
  // ADD: category_ids is optional
  if (row.category_ids !== undefined && typeof row.category_ids !== 'string') {
    throw new Error('chunk.category_ids must be string (JSON array)');
  }
}

export function validateConceptRow(row: any): void {
  // ... existing validations ...
  
  // ADD: category_id is optional (singular)
  if (row.category_id !== undefined && typeof row.category_id !== 'string') {
    throw new Error('concept.category_id must be string');
  }
}
```

**Locations**:
- `validateCategoryRow`: Add at end (~line 320)
- `validateCatalogEntry`: Add validation around line 260
- `validateChunkRow`: Add validation around line 280
- `validateConceptRow`: Add validation around line 300

#### 17. LanceDBCatalogRepository
**File**: `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private categoryIdCache: CategoryIdCache  // ADD
  ) {}

  // ADD: Category resolution methods
  async getCategoryNames(entry: CatalogEntry): Promise<string[]> {
    if (entry.category_ids) {
      const ids = JSON.parse(entry.category_ids);
      return this.categoryIdCache.getNames(ids);
    }
    return JSON.parse(entry.concept_categories || '[]');
  }

  // ADD: Find by category
  async findByCategory(categoryId: string): Promise<CatalogEntry[]> {
    const rows = await this.table.toArray();
    return rows.filter(row => {
      if (row.category_ids) {
        const ids = JSON.parse(row.category_ids);
        return ids.includes(categoryId);
      }
      return false;
    }).map(row => this.mapRowToCatalogEntry(row));
  }
}
```

**New methods to add**:
```typescript
// Get unique concepts in a category (query through documents)
async getConceptsInCategory(categoryId: number): Promise<number[]> {
  const docs = await this.findByCategory(categoryId);
  const uniqueConcepts = new Set<number>();
  docs.forEach(doc => {
    const concepts: number[] = JSON.parse(doc.concept_ids || '[]');
    concepts.forEach(id => uniqueConcepts.add(id));
  });
  return Array.from(uniqueConcepts);
}
```

**Locations**:
- Constructor: Update around line 15
- New methods: Add after existing methods (~line 150)

#### 18. LanceDBChunkRepository
**File**: `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`  
**Status**: ✏️ Modify  
**Changes**: Similar to CatalogRepository

```typescript
export class LanceDBChunkRepository implements ChunkRepository {
  constructor(
    private table: Table,
    private categoryIdCache: CategoryIdCache  // ADD
  ) {}

  // ADD: Category resolution methods
  async getCategoryNames(chunk: Chunk): Promise<string[]> {
    if (chunk.category_ids) {
      const ids = JSON.parse(chunk.category_ids);
      return this.categoryIdCache.getNames(ids);
    }
    return JSON.parse(chunk.concept_categories || '[]');
  }

  // ADD: Find by category
  async findByCategory(categoryId: string): Promise<Chunk[]> {
    // Implementation
  }
}
```

#### 19. LanceDBConceptRepository
**File**: `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
export class LanceDBConceptRepository implements ConceptRepository {
  constructor(
    private table: Table,
    private categoryIdCache: CategoryIdCache  // ADD
  ) {}

  // ADD: Category resolution
  async getCategoryName(concept: Concept): Promise<string> {
    if (concept.category_id) {
      return this.categoryIdCache.getName(concept.category_id) || concept.category;
    }
    return concept.category;
  }

  // ADD: Find by category
  async findByCategory(categoryId: string): Promise<Concept[]> {
    const rows = await this.table
      .where(`category_id = "${categoryId}"`)
      .toArray();
    return rows.map(row => this.mapRowToConcept(row));
  }

  // UPDATE: mapRowToConcept to handle category_id
  private mapRowToConcept(row: any): Concept {
    // ... existing mapping ...
    
    // ADD: Resolve category if using new format
    const category = row.category_id 
      ? this.categoryIdCache.getName(row.category_id) || row.category
      : row.category;
    
    return {
      // ... existing fields ...
      category,
      // ... rest of fields ...
    };
  }
}
```

### Application Layer

#### 20. Container (Dependency Injection)
**File**: `src/application/container.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
import { CategoryIdCache } from '../infrastructure/cache/category-id-cache';
import { LanceDBCategoryRepository } from '../infrastructure/lancedb/repositories/lancedb-category-repository';
import type { CategoryRepository } from '../domain/interfaces/category-repository';

export class Container {
  private categoryIdCache?: CategoryIdCache;
  private categoryRepository?: CategoryRepository;

  // ADD: Category repository getter
  async getCategoryRepository(): Promise<CategoryRepository> {
    if (!this.categoryRepository) {
      const db = await this.getDatabase();
      const table = await db.openTable('categories');
      this.categoryRepository = new LanceDBCategoryRepository(table);
    }
    return this.categoryRepository;
  }

  // ADD: Category cache getter
  async getCategoryIdCache(): Promise<CategoryIdCache> {
    if (!this.categoryIdCache) {
      this.categoryIdCache = CategoryIdCache.getInstance();
      const categoryRepo = await this.getCategoryRepository();
      await this.categoryIdCache.initialize(categoryRepo);
    }
    return this.categoryIdCache;
  }

  // UPDATE: Existing repository getters to inject CategoryIdCache
  async getCatalogRepository(): Promise<CatalogRepository> {
    if (!this.catalogRepository) {
      const db = await this.getDatabase();
      const table = await db.openTable('catalog');
      const categoryCache = await this.getCategoryIdCache();  // ADD
      this.catalogRepository = new LanceDBCatalogRepository(table, categoryCache);  // MODIFY
    }
    return this.catalogRepository;
  }
  
  // Similar updates for getChunkRepository() and getConceptRepository()
}
```

### MCP Tools

#### 21. Tool Registry
**File**: `src/tools/conceptual_registry.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
import { categorySearch } from './operations/category-search';
import { listCategories } from './operations/list-categories';

// In server setup, ADD these tools:

server.tool(
  'category_search',
  'Search for documents, chunks, and concepts by category',
  {
    category: {
      type: 'string',
      description: 'Category name, ID, or alias'
    },
    includeChildren: {
      type: 'boolean',
      description: 'Include child categories (default: false)',
      default: false
    },
    limit: {
      type: 'number',
      description: 'Max results per type (default: 10)',
      default: 10
    }
  },
  async (params) => {
    return await categorySearch(
      params,
      categoryIdCache,
      catalogRepository,
      chunkRepository,
      conceptRepository
    );
  }
);

server.tool(
  'list_categories',
  'List all categories with statistics',
  {
    sortBy: {
      type: 'string',
      description: 'Sort by: name, popularity, or documentCount',
      default: 'popularity'
    },
    limit: {
      type: 'number',
      description: 'Maximum number of categories to return',
      default: 50
    }
  },
  async (params) => {
    return await listCategories(
      categoryIdCache,
      params.sortBy,
      params.limit
    );
  }
);
```

### Seeding Scripts

#### 22. hybrid_fast_seed.ts
**File**: `hybrid_fast_seed.ts`  
**Status**: ✏️ Modify  
**Major changes in multiple locations**:

```typescript
// IMPORT at top
import { CategoryIdCache } from './src/infrastructure/cache/category-id-cache';

// AFTER concepts table created (around line 1200)
console.log('\n📊 Creating categories table...');
const categoriesTable = await createCategoriesTable(db, /* ... */);

// INITIALIZE cache (around line 1220)
const categoryCache = CategoryIdCache.getInstance();
await categoryCache.initialize(categoryRepository);

// UPDATE catalog entry creation (around line 1003)
if (doc.metadata.concept_categories) {
  baseData.concept_categories = JSON.stringify(doc.metadata.concept_categories);
  
  // ADD: category IDs
  const categoryIds = categoryCache.getIds(doc.metadata.concept_categories);
  baseData.category_ids = JSON.stringify(categoryIds);
}

// UPDATE chunk creation (around line 1302, 1707)
concept_categories: JSON.stringify(categories),  // OLD
category_ids: JSON.stringify(categoryCache.getIds(categories)),  // NEW

// UPDATE concept creation (in concept table building, around line 220 in concept_index.ts)
category: concept.category,  // OLD
category_id: categoryCache.getId(concept.category),  // NEW
```

**Key locations in hybrid_fast_seed.ts**:
- Line ~50: Add import
- Line ~1200: Create categories table
- Line ~1220: Initialize CategoryIdCache
- Line ~1003: Update catalog with category_ids
- Line ~1290-1310: Update chunks with category_ids
- Line ~1535-1560: Update chunk enrichment
- Line ~1695-1710: Update final chunk creation

### Concept Extraction

#### 23. Concept Index Builder
**File**: `src/concepts/concept_index.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
// In createConceptTable method (around line 220)
async createConceptTable(
  db: lancedb.Connection,
  concepts: ConceptRecord[],
  tableName: string = 'concepts',
  sourceToIdMap?: Map<string, string>,
  categoryCache?: CategoryIdCache  // ADD parameter
): Promise<lancedb.Table> {
  
  const data = concepts.map((concept, idx) => {
    // ... existing code ...
    
    // ADD: category_id if cache provided
    let categoryId: string | undefined;
    if (categoryCache) {
      categoryId = categoryCache.getId(concept.category);
    }
    
    return {
      // ... existing fields ...
      category: concept.category,  // OLD: keep for compatibility
      category_id: categoryId,  // NEW: add category ID
      // ... rest of fields ...
    };
  });
  
  // ... rest of method ...
}
```

### Configuration

#### 24. Config File
**File**: `src/config.ts`  
**Status**: ✏️ Modify  
**Changes**:

```typescript
export const TABLE_NAMES = {
  catalog: 'catalog',
  chunks: 'chunks',
  concepts: 'concepts',
  categories: 'categories'  // ADD
};
```

**Location**: Around line 8

### Documentation

#### 25. Tool Selection Guide
**File**: `tool-selection-guide.md`  
**Status**: ✏️ Modify  
**Changes**: Add documentation for new category_search and list_categories tools

#### 26. Usage Guide
**File**: `USAGE.md`  
**Status**: ✏️ Modify  
**Changes**: Add examples of category search usage

#### 27. README
**File**: `README.md`  
**Status**: ✏️ Modify  
**Changes**: Mention category search feature in features list

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `src/domain/models/category.ts`
- [ ] Create `src/domain/interfaces/category-repository.ts`
- [ ] Create `src/infrastructure/lancedb/repositories/lancedb-category-repository.ts`
- [ ] Create `src/infrastructure/cache/category-id-cache.ts`
- [ ] Update `src/infrastructure/lancedb/utils/schema-validators.ts`
- [ ] Update domain models (catalog-entry, chunk, concept)
- [ ] Update `src/application/container.ts`

### Phase 2: Scripts
- [ ] Create `scripts/extract_categories.ts`
- [ ] Create `scripts/create_categories_table.ts`
- [ ] Create `scripts/validate_category_migration.ts`

### Phase 3: Repositories
- [ ] Update `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`
- [ ] Update `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`
- [ ] Update `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`

### Phase 4: Ingestion
- [ ] Update `hybrid_fast_seed.ts`
- [ ] Update `src/concepts/concept_index.ts`
- [ ] Update `rebuild_concept_index_standalone.ts`

### Phase 5: Tools
- [ ] Create `src/tools/operations/category-search.ts`
- [ ] Create `src/tools/operations/list-categories.ts`
- [ ] Update `src/tools/conceptual_registry.ts`

### Phase 6: Tests
- [ ] Create `src/__tests__/infrastructure/cache/category-id-cache.test.ts`
- [ ] Create `src/__tests__/infrastructure/lancedb/repositories/lancedb-category-repository.test.ts`
- [ ] Create `src/__tests__/integration/category-search.integration.test.ts`
- [ ] Update existing integration tests

### Phase 7: Documentation
- [ ] Update `tool-selection-guide.md`
- [ ] Update `USAGE.md`
- [ ] Update `README.md`
- [ ] Create/update database schema documentation

---

## File Size Summary

| Type | New Files | Modified Files | Total Lines Added |
|------|-----------|----------------|-------------------|
| Domain | 2 | 3 | ~150 |
| Infrastructure | 2 | 4 | ~900 |
| Tools | 2 | 1 | ~300 |
| Scripts | 3 | 2 | ~800 |
| Tests | 3 | 2 | ~1,000 |
| Documentation | 0 | 3 | ~200 |
| **Total** | **12 new** | **15 modified** | **~3,350 lines** |

---

## Quick Reference: Line Numbers

| File | Current Lines | Lines Added | New Total | Key Sections |
|------|---------------|-------------|-----------|--------------|
| catalog-entry.ts | ~30 | +5 | ~35 | Line 25: add category_ids |
| chunk.ts | ~56 | +5 | ~61 | Line 47: add category_ids |
| concept.ts | ~77 | +3 | ~80 | Line 43: add category_id |
| schema-validators.ts | ~320 | +60 | ~380 | Lines 260, 280, 300, 320 |
| container.ts | ~150 | +40 | ~190 | Lines 80, 120 |
| hybrid_fast_seed.ts | ~1700 | +150 | ~1850 | Lines 50, 1200, 1220, 1003, 1300, 1700 |
| concept_index.ts | ~286 | +20 | ~306 | Line 220 |

---

**Status**: Ready for implementation  
**Usage**: Follow checklist in order, refer to line numbers for modifications  
**Date**: 2025-11-19

