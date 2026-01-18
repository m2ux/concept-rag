# Code Locations Map

**Date**: 2025-11-19  
**Purpose**: Comprehensive inventory of all code requiring updates for integer ID optimization

## Overview

This document maps every file, function, and code location that needs modification to implement integer ID cross-references. Use this as a checklist during implementation.

## Legend

- 🔴 **Critical**: Must be updated (breaks without changes)
- 🟡 **Important**: Should be updated (works but suboptimal)
- 🟢 **Optional**: Nice to have (enhancement)
- 🆕 **New File**: File to be created

---

## Domain Layer

### Models (Schema Definitions)

#### 🔴 `src/domain/models/catalog-entry.ts`

**Current**:
```typescript
export interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  concepts: string;  // JSON array of concept names
  concept_categories: string;
}
```

**Changes Required**:
```typescript
export interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // DEPRECATED: Will be removed in v2.0.0
  concepts: string;  // JSON array of concept names
  
  // NEW: Phase 1
  concept_ids?: string;  // JSON array of concept IDs (optional during migration)
  
  concept_categories: string;
}
```

**Lines to modify**: Interface definition (~lines 5-15)

---

#### 🔴 `src/domain/models/chunk.ts`

**Current**:
```typescript
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  concepts: string;  // JSON array of concept names
  concept_categories: string;
  concept_density: number;
}
```

**Changes Required**:
```typescript
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // DEPRECATED: Will be removed in v2.0.0
  concepts: string;  // JSON array of concept names
  
  // NEW: Phase 1
  concept_ids?: string;  // JSON array of concept IDs (optional during migration)
  
  concept_categories: string;
  concept_density: number;
}
```

**Lines to modify**: Interface definition (~lines 5-15)

---

#### 🔴 `src/domain/models/concept.ts`

**Current**:
```typescript
export interface Concept {
  id: string;
  concept: string;
  concept_type: string;
  category: string;
  sources: string;  // JSON array of source paths
  related_concepts: string;
  synonyms: string;
  broader_terms: string;
  narrower_terms: string;
  weight: number;
  chunk_count: number;
  enrichment_source: string;
  vector: number[];
}
```

**Changes Required**:
```typescript
export interface Concept {
  id: string;
  concept: string;
  concept_type: string;
  category: string;
  
  // DEPRECATED: Will be removed in v2.0.0
  sources: string;  // JSON array of source paths
  
  // NEW: Phase 1
  catalog_ids?: string;  // JSON array of catalog IDs (optional during migration)
  
  related_concepts: string;
  synonyms: string;
  broader_terms: string;
  narrower_terms: string;
  weight: number;
  chunk_count: number;
  enrichment_source: string;
  vector: number[];
}
```

**Lines to modify**: Interface definition (~lines 5-20)

---

### Repository Interfaces

#### 🔴 `src/domain/interfaces/catalog-repository.ts`

**Changes Required**:
```typescript
export interface CatalogRepository {
  // Existing methods...
  search(params: SearchParams): Promise<CatalogEntry[]>;
  findBySource(source: string): Promise<CatalogEntry | null>;
  
  // NEW: Helper methods for concept resolution
  getConceptNames(entry: CatalogEntry): Promise<string[]>;
  getConceptIds(entry: CatalogEntry): string[] | undefined;
}
```

**Lines to modify**: Add new methods to interface (~lines 15-20)

---

#### 🔴 `src/domain/interfaces/chunk-repository.ts`

**Changes Required**:
```typescript
export interface ChunkRepository {
  // Existing methods...
  search(params: SearchParams): Promise<Chunk[]>;
  findBySource(source: string, params?: QueryParams): Promise<Chunk[]>;
  
  // NEW: Helper methods for concept resolution
  getConceptNames(chunk: Chunk): Promise<string[]>;
  getConceptIds(chunk: Chunk): string[] | undefined;
}
```

**Lines to modify**: Add new methods to interface (~lines 15-20)

---

#### 🔴 `src/domain/interfaces/concept-repository.ts`

**Changes Required**:
```typescript
export interface ConceptRepository {
  // Existing methods...
  findById(id: string): Promise<Concept | null>;
  search(params: SearchParams): Promise<Concept[]>;
  
  // NEW: For cache initialization
  findAll(): Promise<Concept[]>;  // May already exist
  
  // NEW: Helper methods for document resolution (optional)
  getCatalogIds(concept: Concept): string[] | undefined;
  getSources(concept: Concept): string[];  // Fallback to old format
}
```

**Lines to modify**: Add findAll() and helper methods (~lines 10-20)

---

## Infrastructure Layer

### Cache Implementation

#### 🆕 `src/infrastructure/cache/concept-id-cache.ts`

**New file**: See `02-concept-id-cache-design.md` for full implementation

**Lines**: ~300 lines total

---

### Repository Implementations

#### 🔴 `src/infrastructure/lancedb/catalog-repository.ts`

**Current structure** (~200 lines):
- Constructor
- search()
- findBySource()
- add()
- update()
- delete()

**Changes Required**:

**1. Constructor - Add cache dependency**:
```typescript
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private conceptIdCache: ConceptIdCache  // NEW
  ) {}
}
```
**Lines**: ~10-15

**2. Add helper methods**:
```typescript
async getConceptNames(entry: CatalogEntry): Promise<string[]> {
  // Prefer new format
  if (entry.concept_ids) {
    const ids = JSON.parse(entry.concept_ids) as string[];
    return this.conceptIdCache.getNames(ids);
  }
  
  // Fallback to old format
  if (entry.concepts) {
    return JSON.parse(entry.concepts) as string[];
  }
  
  return [];
}

getConceptIds(entry: CatalogEntry): string[] | undefined {
  if (entry.concept_ids) {
    return JSON.parse(entry.concept_ids) as string[];
  }
  return undefined;
}
```
**Lines**: Add after existing methods (~line 100)

**3. Update search() to enrich results** (optional):
```typescript
async search(params: SearchParams): Promise<CatalogEntry[]> {
  // ... existing vector search logic ...
  
  // Optionally enrich with concept names
  const enriched = await Promise.all(
    results.map(async (entry) => ({
      ...entry,
      _conceptNames: await this.getConceptNames(entry)  // Temporary property
    }))
  );
  
  return enriched;
}
```
**Lines**: ~50-80 (within search method)

---

#### 🔴 `src/infrastructure/lancedb/chunk-repository.ts`

**Similar changes to CatalogRepository**:

1. Add `conceptIdCache` to constructor
2. Add `getConceptNames()` helper
3. Add `getConceptIds()` helper
4. Update search methods to enrich results

**Lines affected**: ~10-15 (constructor), ~100-120 (helpers)

---

#### 🔴 `src/infrastructure/lancedb/concept-repository.ts`

**Changes Required**:

**Add findAll() method** (if not exists):
```typescript
async findAll(): Promise<Concept[]> {
  const results = await this.table
    .toArray();
  
  return results.map(this.mapRowToConcept);
}
```

**Lines**: Add after existing methods (~line 80)

---

### Schema Validators

#### 🔴 `src/infrastructure/lancedb/utils/schema-validators.ts`

**Current**: Validates required fields

**Changes Required**:

**Update validateCatalogEntry**:
```typescript
export function validateCatalogEntry(entry: any): entry is CatalogEntry {
  return (
    typeof entry.id === 'string' &&
    typeof entry.text === 'string' &&
    typeof entry.source === 'string' &&
    typeof entry.hash === 'string' &&
    typeof entry.concepts === 'string' &&
    // NEW: concept_ids is optional during migration
    (entry.concept_ids === undefined || typeof entry.concept_ids === 'string') &&
    Array.isArray(entry.vector) &&
    typeof entry.concept_categories === 'string'
  );
}
```

**Update validateChunk**:
```typescript
export function validateChunk(chunk: any): chunk is Chunk {
  return (
    typeof chunk.id === 'string' &&
    typeof chunk.text === 'string' &&
    typeof chunk.source === 'string' &&
    typeof chunk.concepts === 'string' &&
    // NEW: concept_ids is optional
    (chunk.concept_ids === undefined || typeof chunk.concept_ids === 'string') &&
    typeof chunk.concept_density === 'number' &&
    Array.isArray(chunk.vector)
  );
}
```

**Lines**: ~20-50

---

## Application Layer

### Dependency Injection Container

#### 🔴 `src/application/container.ts`

**Current structure** (~150 lines):
- Database connection
- Repository getters
- Service initialization

**Changes Required**:

**1. Import cache**:
```typescript
import { ConceptIdCache } from '../infrastructure/cache/concept-id-cache';
```
**Lines**: ~5-15 (imports)

**2. Add cache property**:
```typescript
export class Container {
  private db?: Database;
  private catalogRepo?: CatalogRepository;
  private chunkRepo?: ChunkRepository;
  private conceptRepo?: ConceptRepository;
  private conceptIdCache?: ConceptIdCache;  // NEW
}
```
**Lines**: ~20-30 (class properties)

**3. Add cache getter**:
```typescript
async getConceptIdCache(): Promise<ConceptIdCache> {
  if (!this.conceptIdCache) {
    this.conceptIdCache = ConceptIdCache.getInstance();
    const conceptRepo = await this.getConceptRepository();
    await this.conceptIdCache.initialize(conceptRepo);
  }
  return this.conceptIdCache;
}
```
**Lines**: Add after repository getters (~line 80)

**4. Update repository constructors**:
```typescript
async getCatalogRepository(): Promise<CatalogRepository> {
  if (!this.catalogRepo) {
    const db = await this.getDatabase();
    const table = await db.openTable('catalog');
    const cache = await this.getConceptIdCache();  // NEW
    this.catalogRepo = new LanceDBCatalogRepository(table, cache);  // Add cache param
  }
  return this.catalogRepo;
}

async getChunkRepository(): Promise<ChunkRepository> {
  if (!this.chunkRepo) {
    const db = await this.getDatabase();
    const table = await db.openTable('chunks');
    const cache = await this.getConceptIdCache();  // NEW
    this.chunkRepo = new LanceDBChunkRepository(table, cache);  // Add cache param
  }
  return this.chunkRepo;
}
```
**Lines**: ~50-70 (within existing methods)

---

## Ingestion / Seeding Scripts

### Main Seeding Script

#### 🔴 `hybrid_fast_seed.ts`

**File size**: ~1200 lines  
**Complexity**: High (main seeding logic)

**Changes Required**:

**1. Import cache** (~line 15):
```typescript
import { ConceptIdCache } from './src/infrastructure/cache/concept-id-cache';
```

**2. Initialize cache after concepts table created** (~line 400, after concept extraction):
```typescript
// After creating concepts table
console.log('Initializing concept ID cache...');
const conceptIdCache = ConceptIdCache.getInstance();
await conceptIdCache.initialize(conceptRepository);
console.log(`Concept ID cache initialized with ${conceptIdCache.getStats().conceptCount} concepts`);
```

**3. Update catalog entry creation** (~line 600-700 in `enrichCatalogEntry` or similar):
```typescript
// When creating catalog entries
async function createCatalogEntry(doc: Document, concepts: string[]) {
  const entry = {
    // ... existing fields ...
    
    // OLD: Keep for backward compatibility
    concepts: JSON.stringify(concepts),
    
    // NEW: Add concept IDs
    concept_ids: JSON.stringify(conceptIdCache.getIds(concepts)),
  };
  
  return entry;
}
```

**4. Update chunk creation** (~line 800-900 in chunk processing):
```typescript
// When creating chunks
async function createChunk(text: string, concepts: string[]) {
  const chunk = {
    // ... existing fields ...
    
    // OLD: Keep for backward compatibility
    concepts: JSON.stringify(concepts),
    
    // NEW: Add concept IDs
    concept_ids: JSON.stringify(conceptIdCache.getIds(concepts)),
  };
  
  return chunk;
}
```

**Critical**: Ensure concepts table is fully populated BEFORE initializing cache.

**Lines affected**: ~15 (imports), ~400 (cache init), ~600-700 (catalog), ~800-900 (chunks)

---

### Standalone Scripts

#### 🔴 `scripts/rebuild_concept_index_standalone.ts`

**Changes Required**:
- Import ConceptIdCache
- Initialize after building concepts table
- Use cache when updating chunks/catalog with concept_ids

**Lines affected**: ~20-30

---

#### 🔴 `scripts/reenrich_chunks_with_concepts.ts`

**Purpose**: Re-enrich existing chunks with concepts

**Changes Required**:
- Initialize cache at start
- Add concept_ids field when updating chunks
- Keep old concepts field

**Lines affected**: ~40-60

---

#### 🔴 `scripts/repair_missing_concepts.ts`

**Changes Required**:
- Initialize cache
- Populate concept_ids when repairing

**Lines affected**: ~30-40

---

#### 🟢 `scripts/rebuild_indexes.ts`

**Changes Required**: Minimal (just rebuilds vector indexes)

**Lines affected**: None (unless we add new indexes)

---

## MCP Tools Layer

### Tool Registry

#### 🔴 `src/tools/conceptual_registry.ts`

**Changes Required**:

**1. Import cache**:
```typescript
import { ConceptIdCache } from '../infrastructure/cache/concept-id-cache';
```

**2. Initialize cache**:
```typescript
export class ConceptualRegistry {
  async initialize() {
    // ... existing initialization ...
    
    // Initialize concept ID cache
    const cache = await this.container.getConceptIdCache();
    console.log(`[MCP] Concept cache loaded: ${cache.getStats().conceptCount} concepts`);
  }
}
```

**Lines**: ~30-50

---

### Individual Tool Files

#### 🔴 `src/tools/operations/catalog-search.ts`

**Changes Required**:

Update result formatting to use concept names:
```typescript
export async function catalogSearch(args: CatalogSearchArgs) {
  const results = await catalogRepo.search({ text: args.text, limit: 5 });
  
  // Format results with concept names
  const formatted = await Promise.all(
    results.map(async (entry) => ({
      source: entry.source,
      concepts: await catalogRepo.getConceptNames(entry),  // NEW: Use helper
      preview: entry.text.substring(0, 200),
      // ...
    }))
  );
  
  return JSON.stringify(formatted, null, 2);
}
```

**Lines**: ~40-60 (result formatting)

---

#### 🔴 `src/tools/operations/chunks-search.ts`

**Changes Required**: Similar to catalog-search.ts

```typescript
const formatted = await Promise.all(
  results.map(async (chunk) => ({
    source: chunk.source,
    concepts: await chunkRepo.getConceptNames(chunk),  // NEW
    text: chunk.text,
    // ...
  }))
);
```

**Lines**: ~50-70

---

#### 🔴 `src/tools/operations/broad-chunks-search.ts`

**Changes Required**: Same pattern as chunks-search.ts

**Lines**: ~60-80

---

#### 🔴 `src/tools/operations/concept-search.ts`

**Changes Required**:

May need to support searching by concept ID as well as name:

```typescript
export async function conceptSearch(args: ConceptSearchArgs) {
  // NEW: Support both name and ID
  let conceptName = args.concept;
  
  if (!isNaN(Number(args.concept))) {
    // If numeric, treat as ID and resolve to name
    const cache = await container.getConceptIdCache();
    conceptName = cache.getName(args.concept) || args.concept;
  }
  
  // ... rest of search logic ...
}
```

**Lines**: ~20-40 (input handling)

---

#### 🔴 `src/tools/operations/extract-concepts.ts`

**Changes Required**: Format output with both IDs and names

```typescript
const concepts = await conceptRepo.findBySource(source);

const formatted = {
  primary_concepts: concepts.map(c => ({
    id: c.id,          // NEW: Include ID
    name: c.concept,
    category: c.category
  })),
  // ...
};
```

**Lines**: ~80-100 (formatting)

---

#### 🟡 `src/tools/operations/category-search.ts`

**Changes Required** (if implemented): Use getConceptNames() helper

**Lines**: TBD (new tool)

---

## Testing

### Unit Tests

#### 🆕 `src/__tests__/infrastructure/cache/concept-id-cache.test.ts`

**New file**: ~400 lines  
See `02-concept-id-cache-design.md` for full test suite

---

#### 🔴 `src/__tests__/infrastructure/lancedb/catalog-repository.test.ts`

**Changes Required**:

**1. Add cache mock**:
```typescript
describe('LanceDBCatalogRepository', () => {
  let mockCache: ConceptIdCache;
  
  beforeEach(() => {
    mockCache = {
      getNames: vi.fn((ids) => ids.map(id => `concept_${id}`)),
      getIds: vi.fn((names) => names.map((_, i) => `${i}`)),
      // ...
    } as unknown as ConceptIdCache;
  });
});
```

**2. Update repository instantiation**:
```typescript
const repo = new LanceDBCatalogRepository(mockTable, mockCache);
```

**3. Add tests for new methods**:
```typescript
describe('getConceptNames', () => {
  it('should resolve concept IDs to names', async () => {
    const entry = {
      concept_ids: '["1", "2", "3"]',
      concepts: '["old1", "old2", "old3"]'
    };
    
    const names = await repo.getConceptNames(entry);
    expect(names).toEqual(['concept_1', 'concept_2', 'concept_3']);
  });
  
  it('should fallback to concepts field if concept_ids missing', async () => {
    const entry = {
      concepts: '["concept1", "concept2"]'
    };
    
    const names = await repo.getConceptNames(entry);
    expect(names).toEqual(['concept1', 'concept2']);
  });
});
```

**Lines**: ~100-150 (new tests)

---

#### 🔴 `src/__tests__/infrastructure/lancedb/chunk-repository.test.ts`

**Changes Required**: Similar to catalog-repository.test.ts

**Lines**: ~100-150

---

### Integration Tests

#### 🆕 `src/__tests__/integration/integer-id-migration.test.ts`

**New file**: ~200 lines

```typescript
describe('Integer ID Migration Integration', () => {
  it('should seed database with both concepts and concept_ids', async () => {
    // Full seeding test
  });
  
  it('should resolve concept IDs correctly in queries', async () => {
    // End-to-end query test
  });
  
  it('should maintain backward compatibility', async () => {
    // Test old format still works
  });
  
  it('should perform better with integer IDs', async () => {
    // Performance benchmark
  });
});
```

---

#### 🔴 `src/__tests__/integration/seeding.test.ts`

**Changes Required** (if exists):
- Update assertions to check for concept_ids field
- Verify both old and new formats populated

**Lines**: ~50-80

---

### Test Helpers

#### 🔴 `src/__tests__/test-helpers/integration-test-data.ts`

**Changes Required**:

Update test fixtures to include concept_ids:

```typescript
export const mockCatalogEntry: CatalogEntry = {
  id: '1',
  text: 'Test document',
  source: '/test/doc.pdf',
  concepts: '["test concept", "another concept"]',
  concept_ids: '["1", "2"]',  // NEW
  // ...
};

export const mockChunk: Chunk = {
  id: '1',
  text: 'Test chunk',
  concepts: '["test concept"]',
  concept_ids: '["1"]',  // NEW
  // ...
};
```

**Lines**: ~20-60

---

## Scripts and Utilities

### New Utility Scripts

#### 🆕 `scripts/generate_concept_id_mapping.ts`

**Purpose**: Generate stable concept ID mapping before migration

**Lines**: ~80 lines

```typescript
import { connect } from '@lancedb/lancedb';

async function generateMapping() {
  const db = await connect('~/.concept_rag');
  const conceptsTable = await db.openTable('concepts');
  const results = await conceptsTable.toArray();
  
  const mapping = {
    concept_to_id: {} as Record<string, string>,
    id_to_concept: {} as Record<string, string>,
    generated_at: new Date().toISOString(),
    total_concepts: results.length
  };
  
  for (const row of results) {
    mapping.concept_to_id[row.concept] = row.id;
    mapping.id_to_concept[row.id] = row.concept;
  }
  
  await Bun.write(
    '.engineering/artifacts/planning/2025-11-19-integer-id-optimization/concept-id-mapping.json',
    JSON.stringify(mapping, null, 2)
  );
  
  console.log(`Generated mapping for ${results.length} concepts`);
}

await generateMapping();
```

---

#### 🆕 `scripts/validate_migration.ts`

**Purpose**: Validate concepts and concept_ids match

**Lines**: ~150 lines (see 01-migration-plan.md section 5.3)

---

#### 🆕 `scripts/benchmark_migration.ts`

**Purpose**: Compare performance before/after

**Lines**: ~100 lines

---

#### 🆕 `scripts/analyze_current_storage.ts`

**Purpose**: Calculate storage statistics

**Lines**: ~80 lines

---

## Configuration

#### 🟢 `src/config.ts`

**Current**: Table names, database paths

**Changes Required**: None (unless adding cache configuration)

**Optional additions**:
```typescript
export const CONCEPT_CACHE_MAX_SIZE = 100000;
export const CONCEPT_CACHE_ENABLED = true;
```

**Lines**: ~50-60

---

## Summary Statistics

### Files to Create
- 🆕 5 new files (~1160 lines total)
  - `src/infrastructure/cache/concept-id-cache.ts` (~300)
  - `src/__tests__/infrastructure/cache/concept-id-cache.test.ts` (~400)
  - `src/__tests__/integration/integer-id-migration.test.ts` (~200)
  - `scripts/generate_concept_id_mapping.ts` (~80)
  - `scripts/validate_migration.ts` (~150)
  - `scripts/benchmark_migration.ts` (~100)

### Files to Modify
- 🔴 23 critical files
- 🟡 2 important files
- 🟢 3 optional files

### Total Lines Changed
- ~1160 new lines
- ~800 modified lines
- ~1960 total lines of code

### Estimated Time
- Schema changes: 4 hours
- Cache implementation: 4 hours
- Repository updates: 6 hours
- Ingestion updates: 6 hours
- Tool updates: 4 hours
- Testing: 8 hours
- **Total**: ~32 hours (~4 days)

---

## Implementation Checklist

Use this checklist during implementation:

### Phase 1: Schema & Infrastructure
- [ ] Update `catalog-entry.ts` model
- [ ] Update `chunk.ts` model
- [ ] Update schema validators
- [ ] Create `concept-id-cache.ts`
- [ ] Write cache unit tests
- [ ] Update `container.ts` for DI

### Phase 2: Repositories
- [ ] Update `catalog-repository.ts` interface
- [ ] Update `chunk-repository.ts` interface
- [ ] Update `concept-repository.ts` interface
- [ ] Implement cache in LanceDB catalog repo
- [ ] Implement cache in LanceDB chunk repo
- [ ] Add findAll() to concept repo
- [ ] Update repository tests

### Phase 3: Ingestion
- [ ] Update `hybrid_fast_seed.ts`
- [ ] Update `rebuild_concept_index_standalone.ts`
- [ ] Update `reenrich_chunks_with_concepts.ts`
- [ ] Update `repair_missing_concepts.ts`
- [ ] Test full seeding pipeline

### Phase 4: Tools
- [ ] Update `conceptual_registry.ts`
- [ ] Update `catalog-search.ts`
- [ ] Update `chunks-search.ts`
- [ ] Update `broad-chunks-search.ts`
- [ ] Update `concept-search.ts`
- [ ] Update `extract-concepts.ts`
- [ ] Test all tools end-to-end

### Phase 5: Testing & Validation
- [ ] Create migration integration test
- [ ] Update test fixtures
- [ ] Run full test suite
- [ ] Create validation scripts
- [ ] Run benchmarks

### Phase 6: Migration
- [ ] Backup database
- [ ] Generate concept mapping
- [ ] Run migration
- [ ] Validate migration
- [ ] Compare performance

---

**Status**: Ready for implementation  
**Use Case**: Reference during development to ensure no files are missed

