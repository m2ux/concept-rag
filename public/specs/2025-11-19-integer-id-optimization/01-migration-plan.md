# Migration Plan: Integer ID Cross-References

**Date**: 2025-11-19  
**Status**: Planning  
**Risk Level**: Medium

## Executive Summary

This document outlines a phased, backward-compatible migration from text-based concept references to integer ID cross-references in the Concept-RAG database schema.

**Key principle**: Introduce new fields alongside existing ones, validate in parallel, then deprecate old fields in future major version.

## Migration Phases

### Phase 0: Pre-Migration (Preparation)

**Duration**: 2-4 hours

#### 0.1 Backup and Validation
```bash
# Backup existing database
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d)

# Document current state
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect('~/.concept_rag');
  console.log('Tables:', await db.tableNames());
  for (const name of await db.tableNames()) {
    const table = await db.openTable(name);
    console.log(\`\${name}: \${await table.countRows()} rows\`);
  }
"
```

**Outputs**:
- Backup location: `~/.concept_rag.backup.YYYYMMDD`
- Row counts saved to: `.ai/planning/2025-11-19-integer-id-optimization/pre-migration-state.json`

#### 0.2 Create Stable ID Mapping

**Problem**: Concepts table uses auto-generated IDs that may not be stable across rebuilds.

**Solution**: Generate mapping file during current database state:

```typescript
// scripts/generate_concept_id_mapping.ts
import { connect } from '@lancedb/lancedb';

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
  '.ai/planning/2025-11-19-integer-id-optimization/concept-id-mapping.json',
  JSON.stringify(mapping, null, 2)
);

console.log(`Generated mapping for ${results.length} concepts`);
```

**Validation**:
```bash
npx tsx scripts/generate_concept_id_mapping.ts

# Verify uniqueness
jq '.concept_to_id | length' concept-id-mapping.json  # Should equal total_concepts
jq '.id_to_concept | length' concept-id-mapping.json  # Should equal total_concepts
```

#### 0.3 Analyze Current Storage

```typescript
// scripts/analyze_current_storage.ts
// Calculate storage breakdown: concepts vs vectors vs metadata
// Output: storage-analysis-before.json
```

**Metrics to capture**:
- Total database size
- Size by table
- Average concept array size (bytes)
- Number of concept references
- Estimated savings potential

---

### Phase 1: Schema Extension (Backward Compatible)

**Duration**: 4-6 hours

#### 1.1 Update TypeScript Interfaces

**File**: `src/domain/models/catalog-entry.ts`

```typescript
export interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // Old format (deprecated, keep for backward compatibility)
  concepts: string;  // JSON: ["concept1", "concept2"]
  
  // New format (Phase 1)
  concept_ids?: string;  // JSON: [42, 73, 156] - Optional during migration
  
  concept_categories: string;
}
```

**File**: `src/domain/models/chunk.ts`

```typescript
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // Old format (deprecated)
  concepts: string;  // JSON: ["concept1", "concept2"]
  
  // New format (Phase 1)
  concept_ids?: string;  // JSON: [42, 73] - Optional during migration
  
  concept_categories: string;
  concept_density: number;
}
```

**File**: `src/domain/models/concept.ts`

```typescript
export interface Concept {
  id: string;
  concept: string;
  concept_type: string;
  category: string;
  
  // Old format (deprecated)
  sources: string;  // JSON: ["/path/doc1.pdf", "/path/doc2.pdf"]
  
  // New format (Phase 1)
  catalog_ids?: string;  // JSON: ["5", "12", "23"] - Optional during migration
  
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

#### 1.2 Update Schema Validators

**File**: `src/infrastructure/lancedb/utils/schema-validators.ts`

```typescript
export function validateCatalogEntry(entry: any): entry is CatalogEntry {
  return (
    typeof entry.id === 'string' &&
    typeof entry.text === 'string' &&
    typeof entry.source === 'string' &&
    typeof entry.hash === 'string' &&
    typeof entry.concepts === 'string' &&
    // NEW: concept_ids is optional
    (entry.concept_ids === undefined || typeof entry.concept_ids === 'string') &&
    Array.isArray(entry.vector)
  );
}

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

export function validateConcept(concept: any): concept is Concept {
  return (
    typeof concept.id === 'string' &&
    typeof concept.concept === 'string' &&
    typeof concept.sources === 'string' &&
    // NEW: catalog_ids is optional
    (concept.catalog_ids === undefined || typeof concept.catalog_ids === 'string') &&
    Array.isArray(concept.vector)
  );
}
```

#### 1.3 Create ConceptIdCache

**File**: `src/infrastructure/cache/concept-id-cache.ts`

See `02-concept-id-cache-design.md` for full implementation.

```typescript
export class ConceptIdCache {
  private static instance: ConceptIdCache;
  private idToName = new Map<string, string>();
  private nameToId = new Map<string, string>();
  private initialized = false;

  async initialize(conceptRepo: ConceptRepository): Promise<void> {
    // Load all concepts into memory
  }

  getId(conceptName: string): string | undefined {
    // O(1) lookup
  }

  getIds(conceptNames: string[]): string[] {
    // Batch lookup
  }

  getName(conceptId: string): string | undefined {
    // O(1) lookup
  }

  getNames(conceptIds: string[]): string[] {
    // Batch lookup
  }
}
```

#### 1.4 Update Dependency Injection

**File**: `src/application/container.ts`

```typescript
import { ConceptIdCache } from '../infrastructure/cache/concept-id-cache';

export class Container {
  private conceptIdCache?: ConceptIdCache;

  async getConceptIdCache(): Promise<ConceptIdCache> {
    if (!this.conceptIdCache) {
      this.conceptIdCache = ConceptIdCache.getInstance();
      const conceptRepo = await this.getConceptRepository();
      await this.conceptIdCache.initialize(conceptRepo);
    }
    return this.conceptIdCache;
  }
}
```

---

### Phase 2: Ingestion Pipeline Updates

**Duration**: 6-8 hours

#### 2.1 Update Main Seeding Script

**File**: `hybrid_fast_seed.ts`

**Location**: Around lines 977-1087 (`createLanceTableWithSimpleEmbeddings`)

```typescript
// Add concept ID resolution
import { ConceptIdCache } from './src/infrastructure/cache/concept-id-cache';

// Initialize cache early in seed process
const conceptIdCache = ConceptIdCache.getInstance();
await conceptIdCache.initialize(conceptRepository);

// When creating catalog entries
async function enrichCatalogEntry(entry: any, concepts: string[]) {
  // OLD: Keep for backward compatibility
  entry.concepts = JSON.stringify(concepts);
  
  // NEW: Add concept IDs
  const conceptIds = conceptIdCache.getIds(concepts).filter(id => id !== undefined);
  entry.concept_ids = JSON.stringify(conceptIds);
  
  return entry;
}

// When creating chunk entries
async function enrichChunk(chunk: any, concepts: string[]) {
  // OLD: Keep for backward compatibility
  chunk.concepts = JSON.stringify(concepts);
  
  // NEW: Add concept IDs
  const conceptIds = conceptIdCache.getIds(concepts).filter(id => id !== undefined);
  chunk.concept_ids = JSON.stringify(conceptIds);
  
  return chunk;
}

// When creating concept entries - add catalog ID mapping
async function enrichConceptEntry(
  concept: any, 
  sources: string[], 
  sourceToIdMap: Map<string, string>
) {
  // OLD: Keep for backward compatibility
  concept.sources = JSON.stringify(sources);
  
  // NEW: Add catalog IDs
  const catalogIds = sources
    .map(source => sourceToIdMap.get(source))
    .filter(id => id !== undefined);
  concept.catalog_ids = JSON.stringify(catalogIds);
  
  return concept;
}

// Build source-to-catalog-ID mapping after catalog table created
const sourceToIdMap = new Map<string, string>();
for (const catalogEntry of catalogEntries) {
  sourceToIdMap.set(catalogEntry.source, catalogEntry.id);
}
```

**Critical**: Concepts table must be populated BEFORE catalog/chunks can reference concept IDs. Catalog table must be populated BEFORE concepts can reference catalog IDs.

**Updated flow**:
```
1. Extract concepts from documents
2. Create catalog table (with sources)
3. Build source → catalog_id mapping
4. Create concepts table (with catalog_ids AND sources)
5. Initialize ConceptIdCache from concepts table
6. Update catalog entries (add concept_ids)
7. Create chunk entries (with concept_ids)
```

#### 2.2 Update Concept Extraction

**File**: `src/concepts/concept_index.ts`

No changes needed - concept extraction logic unchanged. Still generates concept names, we just add ID resolution step afterward.

#### 2.3 Update Standalone Scripts

Scripts that rebuild database need same changes:

- `scripts/rebuild_concept_index_standalone.ts`
- `scripts/reenrich_chunks_with_concepts.ts`
- `scripts/repair_missing_concepts.ts`

Pattern:
```typescript
// Initialize cache after concepts table created
const conceptIdCache = ConceptIdCache.getInstance();
await conceptIdCache.initialize(conceptRepository);

// Add concept_ids when updating chunks/catalog
const conceptIds = conceptIdCache.getIds(conceptNames);
entry.concept_ids = JSON.stringify(conceptIds);
```

---

### Phase 3: Repository Layer Updates

**Duration**: 4-6 hours

#### 3.1 Update CatalogRepository

**File**: `src/domain/interfaces/catalog-repository.ts`

Add helper methods:
```typescript
export interface CatalogRepository {
  // ... existing methods
  
  // NEW: Concept name resolution helpers
  getConceptNames(entry: CatalogEntry): Promise<string[]>;
  getConceptIds(entry: CatalogEntry): string[] | undefined;
}
```

**File**: `src/infrastructure/lancedb/catalog-repository.ts`

```typescript
export class LanceDBCatalogRepository implements CatalogRepository {
  constructor(
    private table: Table,
    private conceptIdCache: ConceptIdCache
  ) {}

  async getConceptNames(entry: CatalogEntry): Promise<string[]> {
    // Prefer new format
    if (entry.concept_ids) {
      const ids = JSON.parse(entry.concept_ids);
      return this.conceptIdCache.getNames(ids);
    }
    
    // Fallback to old format
    if (entry.concepts) {
      return JSON.parse(entry.concepts);
    }
    
    return [];
  }

  getConceptIds(entry: CatalogEntry): string[] | undefined {
    if (entry.concept_ids) {
      return JSON.parse(entry.concept_ids);
    }
    return undefined;
  }

  // Update search methods to use concept_ids when available
  async search(params: SearchParams): Promise<SearchResult[]> {
    // ... existing vector search logic
    
    // Enrich results with concept names
    for (const result of results) {
      result.conceptNames = await this.getConceptNames(result);
    }
    
    return results;
  }
}
```

#### 3.2 Update ChunkRepository

**File**: `src/infrastructure/lancedb/chunk-repository.ts`

Same pattern as CatalogRepository:
```typescript
async getConceptNames(chunk: Chunk): Promise<string[]> {
  if (chunk.concept_ids) {
    const ids = JSON.parse(chunk.concept_ids);
    return this.conceptIdCache.getNames(ids);
  }
  return JSON.parse(chunk.concepts || '[]');
}
```

Update all methods that return chunks to include concept name resolution.

#### 3.3 Update Search Services

**File**: `src/domain/services/hybrid-search-service.ts`

```typescript
export class HybridSearchService {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // ... existing search logic
    
    // Enrich results with concept names (uses new format if available)
    for (const result of results) {
      result.concepts = await this.chunkRepository.getConceptNames(result);
    }
    
    return results;
  }
}
```

---

### Phase 4: MCP Tools Update

**Duration**: 4-6 hours

#### 4.1 Update Tool Initialization

**File**: `src/tools/conceptual_registry.ts`

```typescript
export class ConceptualRegistry {
  private conceptIdCache?: ConceptIdCache;

  async initialize() {
    // ... existing initialization
    
    // Initialize concept ID cache
    this.conceptIdCache = ConceptIdCache.getInstance();
    await this.conceptIdCache.initialize(this.conceptRepository);
  }
}
```

#### 4.2 Update Individual Tools

All tools that display concepts need to use `getConceptNames()` helper:

**Files to update**:
- `src/tools/operations/catalog-search.ts`
- `src/tools/operations/chunks-search.ts`
- `src/tools/operations/broad-chunks-search.ts`
- `src/tools/operations/concept-search.ts`
- `src/tools/operations/extract-concepts.ts`
- `src/tools/operations/category-search.ts` (if implemented)

**Pattern**:
```typescript
// Before formatting results for display
const conceptNames = await catalogRepository.getConceptNames(entry);

// Use conceptNames in formatted output
return {
  source: entry.source,
  concepts: conceptNames,  // Human-readable names
  // ...
};
```

---

### Phase 5: Testing and Validation

**Duration**: 6-8 hours

#### 5.1 Unit Tests

**New test file**: `src/__tests__/infrastructure/cache/concept-id-cache.test.ts`

```typescript
describe('ConceptIdCache', () => {
  it('should map concept names to IDs', async () => {
    // Test basic mapping
  });

  it('should map concept IDs to names', async () => {
    // Test reverse mapping
  });

  it('should handle batch operations', async () => {
    // Test getIds() and getNames()
  });

  it('should handle missing concepts gracefully', async () => {
    // Test undefined returns
  });

  it('should maintain singleton instance', async () => {
    // Test getInstance()
  });
});
```

**Update existing tests**:
- `src/__tests__/infrastructure/lancedb/catalog-repository.test.ts`
- `src/__tests__/infrastructure/lancedb/chunk-repository.test.ts`

Add tests for:
- Reading entries with `concept_ids` field
- Fallback to `concepts` field when `concept_ids` missing
- Concept name resolution via cache

#### 5.2 Integration Tests

**New test file**: `src/__tests__/integration/integer-id-migration.test.ts`

```typescript
describe('Integer ID Migration', () => {
  it('should seed database with both concepts and concept_ids', async () => {
    // Run seeding
    // Verify both fields populated
    // Verify they match (same concepts, different format)
  });

  it('should resolve concept IDs to names correctly', async () => {
    // Query catalog
    // Verify concept names match original extraction
  });

  it('should handle queries with integer IDs', async () => {
    // Search by concept ID
    // Verify results
  });

  it('should maintain backward compatibility', async () => {
    // Create entry with only 'concepts' field
    // Verify tools still work
  });
});
```

#### 5.3 Migration Validation Script

**File**: `scripts/validate_migration.ts`

```typescript
import { connect } from '@lancedb/lancedb';
import { ConceptIdCache } from '../src/infrastructure/cache/concept-id-cache';

async function validateMigration() {
  const db = await connect('~/.concept_rag');
  
  // Check catalog table
  const catalog = await db.openTable('catalog');
  const catalogRows = await catalog.toArray();
  
  let catalogWithIds = 0;
  let catalogWithoutIds = 0;
  let catalogMismatches = 0;
  
  for (const row of catalogRows) {
    if (row.concept_ids) {
      catalogWithIds++;
      
      // Verify concept_ids matches concepts
      const oldConcepts = JSON.parse(row.concepts);
      const newIds = JSON.parse(row.concept_ids);
      const resolvedConcepts = conceptCache.getNames(newIds);
      
      if (!arraysEqual(oldConcepts, resolvedConcepts)) {
        console.error(`Mismatch in catalog row ${row.id}`);
        console.error(`  Old: ${oldConcepts}`);
        console.error(`  New: ${resolvedConcepts}`);
        catalogMismatches++;
      }
    } else {
      catalogWithoutIds++;
    }
  }
  
  console.log('Catalog validation:');
  console.log(`  Total rows: ${catalogRows.length}`);
  console.log(`  With concept_ids: ${catalogWithIds}`);
  console.log(`  Without concept_ids: ${catalogWithoutIds}`);
  console.log(`  Mismatches: ${catalogMismatches}`);
  
  // Repeat for chunks table
  // ...
  
  return catalogMismatches === 0 && chunkMismatches === 0;
}

const success = await validateMigration();
process.exit(success ? 0 : 1);
```

**Run after migration**:
```bash
npx tsx scripts/validate_migration.ts
```

#### 5.4 Performance Benchmarking

**File**: `scripts/benchmark_migration.ts`

```typescript
import Benchmark from 'benchmark';

// Benchmark concept filtering
const suite = new Benchmark.Suite();

suite.add('String-based concept filter', () => {
  // Filter by concept name (string comparison)
})
.add('ID-based concept filter', () => {
  // Filter by concept ID (integer comparison)
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run();

// Benchmark JSON parsing
// Benchmark memory usage
// Benchmark end-to-end query latency
```

**Run before and after**:
```bash
# Before migration (current database)
npx tsx scripts/benchmark_migration.ts > benchmark-before.txt

# After migration (new database)
npx tsx scripts/benchmark_migration.ts > benchmark-after.txt

# Compare
diff benchmark-before.txt benchmark-after.txt
```

---

### Phase 6: Database Migration

**Duration**: 2-4 hours (mostly waiting for rebuild)

#### 6.1 Pre-Migration Checklist

- [ ] All code changes committed
- [ ] All tests passing
- [ ] Database backed up
- [ ] Current state documented
- [ ] Concept ID mapping generated
- [ ] Migration validation script tested
- [ ] Rollback procedure documented

#### 6.2 Execute Migration

```bash
# 1. Backup current database
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d_%H%M%S)

# 2. Generate concept mapping from current state
npx tsx scripts/generate_concept_id_mapping.ts

# 3. Run updated seeding script (rebuilds database with new fields)
npx tsx hybrid_fast_seed.ts

# 4. Validate migration
npx tsx scripts/validate_migration.ts

# 5. Run benchmarks
npx tsx scripts/benchmark_migration.ts > benchmark-after.txt

# 6. Spot-check with manual queries
npx tsx -e "
  const { Container } = require('./dist/application/container');
  const container = new Container();
  const catalog = await container.getCatalogRepository();
  const results = await catalog.search({ text: 'test', limit: 5 });
  console.log(results);
"
```

#### 6.3 Post-Migration Validation

**Checklist**:
- [ ] All tables present (`catalog`, `chunks`, `concepts`)
- [ ] Row counts match pre-migration
- [ ] All catalog entries have `concept_ids` field
- [ ] All chunk entries have `concept_ids` field
- [ ] Concept names resolve correctly from IDs
- [ ] No mismatches between `concepts` and `concept_ids`
- [ ] Vector indexes rebuilt successfully
- [ ] Database size reduced by expected amount (15-25%)
- [ ] All MCP tools functional
- [ ] Integration tests pass

#### 6.4 Storage Analysis

```bash
# Compare database sizes
du -sh ~/.concept_rag.backup.*
du -sh ~/.concept_rag

# Detailed breakdown
npx tsx scripts/analyze_current_storage.ts > storage-analysis-after.json

# Compare
diff storage-analysis-before.json storage-analysis-after.json
```

---

### Phase 7: Deprecation (Future Major Version)

**Timeline**: 3-6 months after Phase 6

#### 7.1 Mark Fields as Deprecated

Update TypeScript interfaces with deprecation notices:

```typescript
export interface CatalogEntry {
  id: string;
  
  /**
   * @deprecated Use concept_ids instead. Will be removed in v2.0.0
   */
  concepts: string;
  
  concept_ids: string;  // Remove optional marker
}
```

#### 7.2 Remove Old Fields (Breaking Change)

In next major version:
1. Remove `concepts` field from schema
2. Remove fallback logic in repositories
3. Update all documentation
4. Release as v2.0.0

---

## Rollback Procedures

### Rollback from Phase 6 (Post-Migration)

If migration fails validation:

```bash
# 1. Stop all services using database

# 2. Restore backup
rm -rf ~/.concept_rag
cp -r ~/.concept_rag.backup.YYYYMMDD_HHMMSS ~/.concept_rag

# 3. Revert code changes
git reset --hard HEAD~1  # Or specific commit

# 4. Rebuild if necessary
npm run build

# 5. Validate restoration
npx tsx scripts/validate_migration.ts
```

### Rollback from Phase 3-5 (Code Changes)

If issues found during testing:

```bash
# 1. Revert commits
git revert <commit-hash>

# 2. Database unchanged (still backward compatible)
# No migration needed

# 3. Run old tests to verify
npm test
```

---

## Risk Mitigation

### High-Risk Areas

1. **Concept ID Mapping**
   - Risk: IDs change between rebuilds
   - Mitigation: Generate stable mapping, validate after rebuild
   - Detection: Compare concept counts, spot-check mappings

2. **Data Loss During Migration**
   - Risk: Corruption during database rebuild
   - Mitigation: Always backup, validate checksums
   - Detection: Row count validation, content hash comparison

3. **Performance Regression**
   - Risk: Cache lookups slower than expected
   - Mitigation: Benchmark before/after, profile hotspots
   - Detection: Automated performance tests in CI

4. **Memory Issues**
   - Risk: ConceptIdCache grows too large
   - Mitigation: Monitor memory usage, implement cache eviction if needed
   - Detection: Memory profiling during tests

### Medium-Risk Areas

1. **Backward Compatibility**
   - Risk: Old tools break with new schema
   - Mitigation: Keep both fields, comprehensive testing
   - Detection: Integration tests with old and new formats

2. **Migration Time**
   - Risk: Rebuild takes hours for large datasets
   - Mitigation: Optimize ingestion, run during maintenance window
   - Detection: Time migration on copy of production data

---

## Success Criteria

### Must Have (Go/No-Go)
- [ ] All existing tests pass
- [ ] Database size reduced by ≥15%
- [ ] No query errors or crashes
- [ ] Migration validation script passes 100%
- [ ] All MCP tools functional
- [ ] Backward compatibility maintained

### Should Have
- [ ] Concept filtering 2x faster (benchmark)
- [ ] Overall query latency unchanged or improved
- [ ] Memory usage unchanged or reduced
- [ ] Migration completes in <30 minutes

### Nice to Have
- [ ] Database size reduced by >20%
- [ ] Query latency improved by 10%+
- [ ] Cache hit rate >99%

---

## Post-Migration Tasks

1. Update documentation
   - README.md (mention integer IDs)
   - SETUP.md (migration guide)
   - database-schema-reference.md (update schema docs)

2. Update examples
   - Example queries in docs
   - Test fixtures

3. Performance monitoring
   - Add metrics to track cache hit rate
   - Monitor query latency over time
   - Track database size growth

4. Future optimizations
   - Consider Phase 2 (source path optimization)
   - Investigate further storage compression
   - Profile memory usage patterns

---

## Appendix A: File Manifest

Files created/modified by migration:

### New Files
- `src/infrastructure/cache/concept-id-cache.ts`
- `src/__tests__/infrastructure/cache/concept-id-cache.test.ts`
- `src/__tests__/integration/integer-id-migration.test.ts`
- `scripts/generate_concept_id_mapping.ts`
- `scripts/validate_migration.ts`
- `scripts/benchmark_migration.ts`
- `scripts/analyze_current_storage.ts`

### Modified Files
- `src/domain/models/catalog-entry.ts`
- `src/domain/models/chunk.ts`
- `src/domain/interfaces/catalog-repository.ts`
- `src/domain/interfaces/chunk-repository.ts`
- `src/infrastructure/lancedb/catalog-repository.ts`
- `src/infrastructure/lancedb/chunk-repository.ts`
- `src/infrastructure/lancedb/utils/schema-validators.ts`
- `src/application/container.ts`
- `hybrid_fast_seed.ts`
- All tool files in `src/tools/operations/`
- All repository test files

### Configuration Files
- `tsconfig.json` (if adding new paths)
- `package.json` (if adding benchmark dependencies)

---

## Appendix B: SQL Equivalents (Conceptual)

For developers familiar with relational databases, here's the conceptual mapping:

### Current Design (Denormalized)
```sql
-- Conceptual representation
CREATE TABLE catalog (
  id SERIAL PRIMARY KEY,
  concepts TEXT,  -- JSON array: ["concept1", "concept2"]
  ...
);
```

### New Design (Still Denormalized, but with IDs)
```sql
CREATE TABLE catalog (
  id SERIAL PRIMARY KEY,
  concept_ids TEXT,  -- JSON array: [1, 2]
  concepts TEXT,     -- Deprecated, for backward compat
  ...
);
```

### NOT Doing (Junction Table - Fully Normalized)
```sql
-- We're explicitly NOT doing this
CREATE TABLE catalog_concepts (
  catalog_id INTEGER REFERENCES catalog(id),
  concept_id INTEGER REFERENCES concepts(id),
  PRIMARY KEY (catalog_id, concept_id)
);
```

The difference: We keep the array structure (LanceDB-friendly) but use IDs instead of strings.

---

## Questions and Answers

**Q: Why not junction tables?**  
A: LanceDB is optimized for embedded arrays + vector search, not relational JOINs. Junction tables would require JOINs on every query, negating performance benefits.

**Q: What if concept IDs change?**  
A: We generate a stable mapping before migration. If database is rebuilt, we can use the same mapping to maintain consistency.

**Q: How much faster will this be?**  
A: Conservative estimate: 10-20% overall, 2-3x for concept filtering specifically. Will benchmark to confirm.

**Q: Can we roll back?**  
A: Yes, we keep backups and maintain backward compatibility. Old `concepts` field stays until v2.0.0.

**Q: What about source paths?**  
A: Phase 1 keeps them as-is. If profiling shows benefit, we can optimize in Phase 2.

---

**Status**: Ready for implementation  
**Next Steps**: Review with team, then proceed to Phase 0

