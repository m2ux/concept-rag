# Migration Plan: Schema Normalization

**Date**: 2025-11-26  
**Status**: Ready for Implementation  
**Risk Level**: Medium (database rebuild required)

## Overview

This migration removes redundant fields from the database schema. Unlike the previous integer ID migration which was additive (keeping old fields), this migration is **subtractive** - we remove legacy fields entirely.

**Strategy:** Clean rebuild rather than in-place migration.

---

## Pre-Migration Checklist

- [ ] All current tests passing
- [ ] Production database backed up
- [ ] Test database backed up
- [ ] Sample docs folder available for seeding
- [ ] Migration plan reviewed

---

## Phase 1: Code Preparation (Estimated: 4 hours)

### 1.1 Update Domain Models

**Files to modify:**

| File | Changes |
|------|---------|
| `src/domain/models/chunk.ts` | Remove `concepts` union type, keep only ID-based |
| `src/domain/models/concept.ts` | Remove `conceptType`, update interface |

**Example - chunk.ts:**

```typescript
// BEFORE
export interface Chunk {
  concepts?: string[] | any;  // Union type for legacy support
  conceptCategories?: string[];
  // ...
}

// AFTER
export interface Chunk {
  conceptIds?: number[];      // ID-based only
  categoryIds?: number[];     // ID-based only
  // ...
}
```

### 1.2 Update Repository Layer

**Files to modify:**

| File | Changes |
|------|---------|
| `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts` | Remove fallback logic |
| `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts` | Remove parseConceptsField |
| `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts` | Remove sources/category mapping |

**Example - Remove fallback in chunk repository:**

```typescript
// BEFORE
private mapRowToChunk(row: any): Chunk {
  let concepts: string[] = [];
  if (row.concept_ids) {
    // NEW FORMAT
    const conceptIds = parseJsonField(row.concept_ids);
    concepts = this.conceptIdCache.getNames(conceptIds);
  } else {
    // OLD FORMAT - FALLBACK
    concepts = parseJsonField(row.concepts);
  }
  // ...
}

// AFTER
private mapRowToChunk(row: any): Chunk {
  const conceptIds = row.concept_ids || [];
  const concepts = this.conceptIdCache.getNames(conceptIds);
  // ...
}
```

### 1.3 Update Schema Validators

**File:** `src/infrastructure/lancedb/utils/schema-validators.ts`

```typescript
// Remove validation for deprecated fields
export function validateChunkRow(row: any): void {
  validateRequiredFields(row, ['text', 'source'], 'chunk');
  
  // Remove: validation for row.concepts (text)
  // Keep: validation for row.concept_ids (optional)
  
  const vectorField = detectVectorField(row);
  if (!vectorField) {
    throw new SchemaValidationError(...);
  }
  validateEmbeddings(row, vectorField, 'chunk');
}
```

### 1.4 Update Concept Extraction

**File:** `src/concepts/concept_extractor.ts`

Remove `technical_terms` and `related_concepts` from extraction output:

```typescript
// BEFORE
return {
  primary_concepts: Array.from(mergedConcepts),
  categories: Array.from(mergedCategories).slice(0, 7),
  related_concepts: Array.from(mergedRelated).slice(0, 50)
};

// AFTER
return {
  primary_concepts: Array.from(mergedConcepts),
  categories: Array.from(mergedCategories).slice(0, 7)
  // related_concepts removed - derived from concepts table
};
```

**File:** `src/concepts/types.ts`

```typescript
// BEFORE
export interface ConceptMetadata {
  primary_concepts: string[];
  categories: string[];
  related_concepts: string[];
}

// AFTER
export interface ConceptMetadata {
  primary_concepts: string[];
  categories: string[];
  // related_concepts removed
}
```

### 1.5 Update Concept Index Builder

**File:** `src/concepts/concept_index.ts`

Remove `concept_type` handling:

```typescript
// BEFORE
private addOrUpdateConcept(
  map: Map<string, ConceptRecord>,
  concept: string,
  conceptType: 'thematic' | 'terminology',
  ...
) {
  // ...
  concept_type: conceptType,
}

// AFTER
private addOrUpdateConcept(
  map: Map<string, ConceptRecord>,
  concept: string,
  ...
) {
  // ...
  // concept_type removed
}
```

### 1.6 Update Seeding Pipeline

**File:** `hybrid_fast_seed.ts`

Remove population of deprecated fields:

```typescript
// BEFORE - catalog entry
{
  concepts: JSON.stringify({
    primary_concepts: concepts,
    technical_terms: [],
    categories: categories,
    related_concepts: []
  }),
  concept_ids: JSON.stringify(conceptIds),
  concept_categories: JSON.stringify(categories),
  category_ids: JSON.stringify(categoryIds)
}

// AFTER - catalog entry
{
  concept_ids: conceptIds,      // Native array
  category_ids: categoryIds,    // Native array
  title: ''                     // Reserved for future use
}
```

---

## Phase 2: Update MCP Tools (Estimated: 2 hours)

### 2.1 Tools Requiring Updates

| Tool | File | Changes |
|------|------|---------|
| `catalog_search` | `conceptual_catalog_search.ts` | Remove concepts blob access |
| `chunks_search` | `conceptual_chunks_search.ts` | Remove concepts text access |
| `concept_search` | `concept_search.ts` | Remove concept_type references |
| `extract_concepts` | `document_concepts_extract.ts` | Update output format |
| `source_concepts` | `source_concepts.ts` | Remove sources field access |

### 2.2 Update extract_concepts Output

**File:** `src/tools/operations/document_concepts_extract.ts`

The tool currently reads from the JSON blob. Update to derive data:

```typescript
// BEFORE
const concepts = JSON.parse(doc.concepts);
return {
  primary_concepts: concepts.primary_concepts,
  technical_terms: concepts.technical_terms,
  related_concepts: concepts.related_concepts,
  categories: concepts.categories
};

// AFTER
const conceptNames = conceptIdCache.getNames(doc.concept_ids);
const categoryNames = categoryIdCache.getNames(doc.category_ids);
const relatedConcepts = await deriveRelatedConcepts(doc.concept_ids);
return {
  primary_concepts: conceptNames,
  categories: categoryNames,
  related_concepts: relatedConcepts
  // technical_terms removed (was never populated)
};
```

### 2.3 Add Helper for Related Concepts

**File:** `src/domain/services/concept-service.ts` (new or existing)

```typescript
export async function deriveRelatedConcepts(
  conceptIds: number[],
  conceptRepo: ConceptRepository,
  limit: number = 20
): Promise<string[]> {
  const concepts = await conceptRepo.findByIds(conceptIds);
  const related = new Set<string>();
  
  for (const concept of concepts) {
    for (const r of concept.relatedConcepts || []) {
      related.add(r);
    }
  }
  
  return Array.from(related).slice(0, limit);
}
```

---

## Phase 3: Update Tests (Estimated: 2 hours)

### 3.1 Test Files Requiring Updates

| File | Changes |
|------|---------|
| `src/__tests__/test-helpers/integration-test-data.ts` | Remove deprecated fields |
| `src/__tests__/integration/*.test.ts` | Update assertions |
| `src/infrastructure/lancedb/repositories/__tests__/*.test.ts` | Update mocks |

### 3.2 Update Test Data Builders

**File:** `src/__tests__/test-helpers/integration-test-data.ts`

```typescript
// BEFORE
export interface IntegrationChunkData {
  /** @deprecated Use concept_ids instead */
  concepts: string;
  concept_ids?: string;
  concept_categories: string;
  // ...
}

// AFTER
export interface IntegrationChunkData {
  concept_ids: number[];
  category_ids: number[];
  // Removed: concepts, concept_categories
}
```

---

## Phase 4: Migration Scripts (Estimated: 3 hours)

### 4.1 Create Migration Script

**File:** `scripts/migrate_to_normalized_schema.ts`

This script transforms the legacy schema to the new normalized schema:

```typescript
/**
 * Migration Script: Legacy Schema → Normalized Schema
 * 
 * Transforms:
 * - Catalog: Remove concepts blob, concept_ids, concept_categories, loc, filename_tags
 *            Rename source → filename (slug only)
 * - Chunks:  Remove concepts, concept_categories, concept_density
 *            Replace source → catalog_id
 * - Concepts: Remove sources, category, concept_type, chunk_count, enrichment_source
 *             Change related_concepts → related_concept_ids
 */

import { connect } from '@lancedb/lancedb';
import { hashToId } from '../src/infrastructure/utils/hash';

async function migrateToNormalizedSchema(dbPath: string) {
  console.log('\n🔄 SCHEMA MIGRATION: Legacy → Normalized');
  console.log('='.repeat(70));
  console.log(`Database: ${dbPath}`);
  
  const db = await connect(dbPath);
  
  // ========== PHASE 1: Migrate Catalog ==========
  console.log('\n📄 Phase 1: Migrating catalog table...');
  
  const catalogTable = await db.openTable('catalog');
  const catalogRows = await catalogTable.query().limit(100000).toArray();
  console.log(`  Found ${catalogRows.length} catalog entries`);
  
  // Build source → id mapping for chunks migration
  const sourceToId = new Map<string, number>();
  
  const migratedCatalog = catalogRows.map(row => {
    // Extract filename slug from full path
    const filename = (row.source || '').split('/').pop() || row.source;
    const id = hashToId(filename);
    
    sourceToId.set(row.source, id);
    
    // Parse category_ids (may be JSON string or array)
    let categoryIds: number[] = [];
    if (row.category_ids) {
      try {
        categoryIds = typeof row.category_ids === 'string' 
          ? JSON.parse(row.category_ids) 
          : row.category_ids;
      } catch (e) {}
    }
    
    return {
      id: id,
      filename: filename,
      hash: row.hash,
      text: row.text,
      vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector),
      category_ids: categoryIds,
      // Reserved fields
      title: '',
      author: '',
      year: '',
      publisher: '',
      isbn: ''
      // REMOVED: concepts, concept_ids, concept_categories, loc, filename_tags, source
    };
  });
  
  await db.dropTable('catalog');
  await db.createTable('catalog', migratedCatalog, { mode: 'overwrite' });
  console.log(`  ✅ Catalog migrated: ${migratedCatalog.length} entries`);
  
  // ========== PHASE 2: Migrate Chunks ==========
  console.log('\n📝 Phase 2: Migrating chunks table...');
  
  const chunksTable = await db.openTable('chunks');
  const chunkRows = await chunksTable.query().limit(500000).toArray();
  console.log(`  Found ${chunkRows.length} chunks`);
  
  const migratedChunks = chunkRows.map(row => {
    // Resolve source path to catalog_id
    const catalogId = sourceToId.get(row.source) || hashToId(row.source);
    
    // Parse concept_ids
    let conceptIds: number[] = [];
    if (row.concept_ids) {
      try {
        conceptIds = typeof row.concept_ids === 'string'
          ? JSON.parse(row.concept_ids)
          : row.concept_ids;
      } catch (e) {}
    }
    
    // Parse category_ids
    let categoryIds: number[] = [];
    if (row.category_ids) {
      try {
        categoryIds = typeof row.category_ids === 'string'
          ? JSON.parse(row.category_ids)
          : row.category_ids;
      } catch (e) {}
    }
    
    return {
      id: row.id,
      catalog_id: catalogId,
      hash: row.hash,
      text: row.text,
      vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector),
      concept_ids: conceptIds,
      category_ids: categoryIds,
      loc: row.loc || '{}'
      // REMOVED: source, concepts, concept_categories, concept_density
    };
  });
  
  await db.dropTable('chunks');
  await db.createTable('chunks', migratedChunks, { mode: 'overwrite' });
  console.log(`  ✅ Chunks migrated: ${migratedChunks.length} entries`);
  
  // Recreate vector index
  if (migratedChunks.length >= 256) {
    console.log('  🔧 Creating vector index...');
    const newChunksTable = await db.openTable('chunks');
    await newChunksTable.createIndex('vector', {
      config: { type: 'ivf_pq', numPartitions: Math.max(2, Math.floor(migratedChunks.length / 100)), numSubVectors: 16 }
    });
    console.log('  ✅ Vector index created');
  }
  
  // ========== PHASE 3: Migrate Concepts ==========
  console.log('\n🧠 Phase 3: Migrating concepts table...');
  
  const conceptsTable = await db.openTable('concepts');
  const conceptRows = await conceptsTable.query().limit(100000).toArray();
  console.log(`  Found ${conceptRows.length} concepts`);
  
  // Build concept name → id mapping for related_concept_ids
  const conceptNameToId = new Map<string, number>();
  conceptRows.forEach(row => {
    conceptNameToId.set(row.concept.toLowerCase(), row.id || hashToId(row.concept));
  });
  
  const migratedConcepts = conceptRows.map(row => {
    // Parse catalog_ids
    let catalogIds: number[] = [];
    if (row.catalog_ids) {
      try {
        catalogIds = typeof row.catalog_ids === 'string'
          ? JSON.parse(row.catalog_ids)
          : row.catalog_ids;
      } catch (e) {}
    }
    
    // Convert related_concepts to related_concept_ids
    let relatedConceptIds: number[] = [];
    if (row.related_concepts) {
      try {
        const relatedNames = typeof row.related_concepts === 'string'
          ? JSON.parse(row.related_concepts)
          : row.related_concepts;
        relatedConceptIds = relatedNames
          .map((name: string) => conceptNameToId.get(name.toLowerCase()))
          .filter((id: number | undefined) => id !== undefined);
      } catch (e) {}
    }
    
    // Parse WordNet fields
    const parseJsonArray = (val: any): string[] => {
      if (!val) return [];
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch (e) { return []; }
    };
    
    return {
      id: row.id || hashToId(row.concept),
      concept: row.concept,
      catalog_ids: catalogIds,
      related_concept_ids: relatedConceptIds,
      synonyms: parseJsonArray(row.synonyms),
      broader_terms: parseJsonArray(row.broader_terms),
      narrower_terms: parseJsonArray(row.narrower_terms),
      weight: row.weight || 0,
      vector: Array.isArray(row.vector) ? row.vector : Array.from(row.vector)
      // REMOVED: sources, category, concept_type, chunk_count, enrichment_source
    };
  });
  
  await db.dropTable('concepts');
  await db.createTable('concepts', migratedConcepts, { mode: 'overwrite' });
  console.log(`  ✅ Concepts migrated: ${migratedConcepts.length} entries`);
  
  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(70));
  console.log('✅ MIGRATION COMPLETE');
  console.log(`  Catalog: ${migratedCatalog.length} entries`);
  console.log(`  Chunks: ${migratedChunks.length} entries`);
  console.log(`  Concepts: ${migratedConcepts.length} entries`);
}

// Run migration
const dbPath = process.argv[2] || `${process.env.HOME}/.concept_rag_test`;
await migrateToNormalizedSchema(dbPath);
```

### 4.2 Create Schema Validation Script

**File:** `scripts/validate_normalized_schema.ts`

```typescript
/**
 * Validates that database matches normalized schema
 */

import { connect } from '@lancedb/lancedb';

async function validateNormalizedSchema(dbPath: string) {
  console.log('\n📋 SCHEMA VALIDATION: Normalized Structure');
  console.log('='.repeat(70));
  
  const db = await connect(dbPath);
  const results: { check: string; passed: boolean; details?: string }[] = [];
  
  // ========== CATALOG CHECKS ==========
  const catalog = await db.openTable('catalog');
  const catalogSample = (await catalog.query().limit(1).toArray())[0];
  const catalogFields = Object.keys(catalogSample);
  
  // Required fields
  results.push({ check: 'catalog.id exists', passed: 'id' in catalogSample });
  results.push({ check: 'catalog.filename exists', passed: 'filename' in catalogSample });
  results.push({ check: 'catalog.hash exists', passed: 'hash' in catalogSample });
  results.push({ check: 'catalog.text exists', passed: 'text' in catalogSample });
  results.push({ check: 'catalog.vector exists', passed: 'vector' in catalogSample });
  results.push({ check: 'catalog.category_ids exists', passed: 'category_ids' in catalogSample });
  
  // Removed fields
  results.push({ check: 'catalog.source removed', passed: !('source' in catalogSample) });
  results.push({ check: 'catalog.concepts removed', passed: !('concepts' in catalogSample) });
  results.push({ check: 'catalog.concept_ids removed', passed: !('concept_ids' in catalogSample) });
  results.push({ check: 'catalog.concept_categories removed', passed: !('concept_categories' in catalogSample) });
  results.push({ check: 'catalog.loc removed', passed: !('loc' in catalogSample) });
  results.push({ check: 'catalog.filename_tags removed', passed: !('filename_tags' in catalogSample) });
  
  // Type checks
  results.push({ check: 'catalog.id is number', passed: typeof catalogSample.id === 'number' });
  results.push({ check: 'catalog.category_ids is array', passed: Array.isArray(catalogSample.category_ids) });
  
  // ========== CHUNKS CHECKS ==========
  const chunks = await db.openTable('chunks');
  const chunkSample = (await chunks.query().limit(1).toArray())[0];
  
  // Required fields
  results.push({ check: 'chunks.id exists', passed: 'id' in chunkSample });
  results.push({ check: 'chunks.catalog_id exists', passed: 'catalog_id' in chunkSample });
  results.push({ check: 'chunks.text exists', passed: 'text' in chunkSample });
  results.push({ check: 'chunks.vector exists', passed: 'vector' in chunkSample });
  results.push({ check: 'chunks.concept_ids exists', passed: 'concept_ids' in chunkSample });
  results.push({ check: 'chunks.category_ids exists', passed: 'category_ids' in chunkSample });
  
  // Removed fields
  results.push({ check: 'chunks.source removed', passed: !('source' in chunkSample) });
  results.push({ check: 'chunks.concepts removed', passed: !('concepts' in chunkSample) });
  results.push({ check: 'chunks.concept_categories removed', passed: !('concept_categories' in chunkSample) });
  results.push({ check: 'chunks.concept_density removed', passed: !('concept_density' in chunkSample) });
  
  // Type checks
  results.push({ check: 'chunks.catalog_id is number', passed: typeof chunkSample.catalog_id === 'number' });
  results.push({ check: 'chunks.concept_ids is array', passed: Array.isArray(chunkSample.concept_ids) });
  
  // ========== CONCEPTS CHECKS ==========
  const concepts = await db.openTable('concepts');
  const conceptSample = (await concepts.query().limit(1).toArray())[0];
  
  // Required fields
  results.push({ check: 'concepts.id exists', passed: 'id' in conceptSample });
  results.push({ check: 'concepts.concept exists', passed: 'concept' in conceptSample });
  results.push({ check: 'concepts.catalog_ids exists', passed: 'catalog_ids' in conceptSample });
  results.push({ check: 'concepts.related_concept_ids exists', passed: 'related_concept_ids' in conceptSample });
  
  // Removed fields
  results.push({ check: 'concepts.sources removed', passed: !('sources' in conceptSample) });
  results.push({ check: 'concepts.category removed', passed: !('category' in conceptSample) });
  results.push({ check: 'concepts.concept_type removed', passed: !('concept_type' in conceptSample) });
  results.push({ check: 'concepts.chunk_count removed', passed: !('chunk_count' in conceptSample) });
  results.push({ check: 'concepts.enrichment_source removed', passed: !('enrichment_source' in conceptSample) });
  results.push({ check: 'concepts.related_concepts removed', passed: !('related_concepts' in conceptSample) });
  
  // Type checks
  results.push({ check: 'concepts.related_concept_ids is array', passed: Array.isArray(conceptSample.related_concept_ids) });
  
  // ========== REPORT ==========
  console.log('\nResults:');
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${r.check}`);
    if (r.passed) passed++; else failed++;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`${passed} passed, ${failed} failed`);
  
  return failed === 0;
}

const dbPath = process.argv[2] || `${process.env.HOME}/.concept_rag_test`;
const success = await validateNormalizedSchema(dbPath);
process.exit(success ? 0 : 1);
```

### 4.3 Backup Existing Database

```bash
# Backup test database
cp -r ~/.concept_rag_test ~/.concept_rag_test.backup.$(date +%Y%m%d_%H%M%S)

# Backup main database (if exists)
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d_%H%M%S)
```

### 4.4 Run Migration on Test Database

```bash
# Run migration
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag_test

# Validate schema
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag_test
```

### 4.5 Verify Migration Results

```bash
# Check row counts
npx tsx -e "
const { connect } = require('@lancedb/lancedb');
const db = await connect(process.env.HOME + '/.concept_rag_test');
for (const name of await db.tableNames()) {
  const table = await db.openTable(name);
  console.log(name + ': ' + await table.countRows() + ' rows');
}
"

# Inspect sample data
npx tsx scripts/inspect_test_db.ts
```

---

## Phase 5: Fresh Seed Test (Estimated: 1 hour)

After migration scripts are validated, test fresh seeding with the new schema:

### 5.1 Clean Database and Seed Fresh

```bash
# Remove test database
rm -rf ~/.concept_rag_test

# Seed from sample docs with updated seeding script
npx tsx hybrid_fast_seed.ts --db-path ~/.concept_rag_test --docs-path sample-docs/
```

### 5.2 Validate Fresh Seed

```bash
# Validate schema
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag_test
```

Expected: All checks pass

---

## Phase 5: Validation Testing (Estimated: 2 hours)

### 5.1 Run All Unit Tests

```bash
npm test
```

### 5.2 Run Integration Tests

```bash
npm run test:integration
```

### 5.3 Manual Tool Validation

Test each MCP tool against the rebuilt database:

```bash
# Start MCP server
npm run dev

# Test via MCP client or direct invocation
```

**Test Cases:**

| Tool | Test Query | Expected Result |
|------|-----------|-----------------|
| `catalog_search` | "architecture" | Returns docs with concept names resolved |
| `chunks_search` | "dependency injection", source: "clean-architecture" | Returns chunks with concepts |
| `broad_chunks_search` | "software design patterns" | Returns cross-document results |
| `concept_search` | "testing" | Returns chunks tagged with concept |
| `extract_concepts` | query: "clean architecture" | Returns primary_concepts, categories, related |
| `source_concepts` | "testing" | Returns sources via catalog_ids |
| `category_search` | "software architecture" | Returns documents in category |
| `list_categories` | - | Returns all categories with stats |

### 5.4 Create Validation Script

**File:** `scripts/validate_normalized_schema.ts`

```typescript
import { connect } from '@lancedb/lancedb';

async function validateSchema() {
  const db = await connect(process.env.DB_PATH || '~/.concept_rag_test');
  
  const checks = {
    catalog_no_concepts_blob: false,
    catalog_no_concept_categories: false,
    chunks_no_concepts_text: false,
    chunks_no_concept_categories: false,
    concepts_no_sources: false,
    concepts_no_category: false,
    concepts_no_type: false,
    concept_ids_are_arrays: false,
    category_ids_are_arrays: false
  };
  
  // Check catalog
  const catalog = await db.openTable('catalog');
  const catalogSample = (await catalog.query().limit(1).toArray())[0];
  checks.catalog_no_concepts_blob = !('concepts' in catalogSample);
  checks.catalog_no_concept_categories = !('concept_categories' in catalogSample);
  checks.concept_ids_are_arrays = Array.isArray(catalogSample.concept_ids);
  checks.category_ids_are_arrays = Array.isArray(catalogSample.category_ids);
  
  // Check chunks
  const chunks = await db.openTable('chunks');
  const chunkSample = (await chunks.query().limit(1).toArray())[0];
  checks.chunks_no_concepts_text = !('concepts' in chunkSample);
  checks.chunks_no_concept_categories = !('concept_categories' in chunkSample);
  
  // Check concepts
  const concepts = await db.openTable('concepts');
  const conceptSample = (await concepts.query().limit(1).toArray())[0];
  checks.concepts_no_sources = !('sources' in conceptSample);
  checks.concepts_no_category = !('category' in conceptSample);
  checks.concepts_no_type = !('concept_type' in conceptSample);
  
  // Report
  console.log('\n📋 SCHEMA VALIDATION');
  console.log('='.repeat(60));
  
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check}`);
    if (!passed) allPassed = false;
  }
  
  console.log('='.repeat(60));
  console.log(allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED');
  
  return allPassed;
}

const success = await validateSchema();
process.exit(success ? 0 : 1);
```

---

## Phase 6: Documentation (Estimated: 1 hour)

### 6.1 Update Schema Documentation

**File:** `.engineering/artifacts/planning/database-schema.md`

Update to reflect normalized schema.

### 6.2 Create ADR

**File:** `docs/architecture/adr0043-schema-normalization.md`

Document:
- Context: Legacy fields from integer ID migration
- Decision: Remove all redundant fields
- Consequences: Cleaner schema, ~25% storage savings, no backward compatibility

### 6.3 Update README if Needed

Note breaking change in relevant sections.

---

## Rollback Procedure

If issues are discovered:

```bash
# 1. Stop services
# 2. Restore database backup
rm -rf ~/.concept_rag_test
cp -r ~/.concept_rag_test.backup.YYYYMMDD_HHMMSS ~/.concept_rag_test

# 3. Revert code changes
git revert HEAD~N  # Where N is number of commits

# 4. Rebuild
npm run build

# 5. Verify
npm test
```

---

## Success Criteria

### Must Have
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All MCP tools return valid results
- [ ] Schema validation script passes
- [ ] No `concepts`, `concept_categories`, `sources`, `category`, `concept_type` fields in database

### Should Have
- [ ] Database size reduced (verify with `du -sh`)
- [ ] Query performance unchanged or improved
- [ ] ADR created

### Nice to Have
- [ ] Storage reduction measured and documented
- [ ] Performance benchmarks before/after

---

## Timeline

| Day | Phase | Tasks |
|-----|-------|-------|
| 1 AM | Phase 1 | Update domain models, repositories |
| 1 PM | Phase 2-3 | Update tools, tests |
| 2 AM | Phase 4 | Database rebuild |
| 2 PM | Phase 5 | Validation testing |
| 2 EOD | Phase 6 | Documentation |

**Total:** ~2 days


