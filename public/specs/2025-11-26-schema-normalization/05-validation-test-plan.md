# Validation Test Plan

**Date**: 2025-11-26  
**Status**: Ready for Execution

## Overview

This document defines the validation strategy to confirm the schema normalization is complete and all functionality works correctly.

---

## Test Environment

### Database
- **Path**: `~/.concept_rag_test`
- **Source**: Seeded from `sample-docs/` folder
- **Expected documents**: ~5-10 sample documents

### Prerequisites
- Clean database rebuild after code changes
- All dependencies installed
- Test framework available (`vitest`)

---

## Phase 1: Schema Validation

### 1.1 Automated Schema Check

**Script**: `scripts/validate_normalized_schema.ts`

**Checks**:

| Check | Table | Field | Expected |
|-------|-------|-------|----------|
| No concepts blob | catalog | `concepts` | NOT present |
| No concept_categories | catalog | `concept_categories` | NOT present |
| concept_ids is array | catalog | `concept_ids` | Array type |
| category_ids is array | catalog | `category_ids` | Array type |
| No concepts text | chunks | `concepts` | NOT present |
| No concept_categories | chunks | `concept_categories` | NOT present |
| concept_ids is array | chunks | `concept_ids` | Array type |
| category_ids is array | chunks | `category_ids` | Array type |
| No sources | concepts | `sources` | NOT present |
| No category | concepts | `category` | NOT present |
| No concept_type | concepts | `concept_type` | NOT present |
| catalog_ids is array | concepts | `catalog_ids` | Array type |

**Run**:
```bash
npx tsx scripts/validate_normalized_schema.ts
```

**Expected output**:
```
📋 SCHEMA VALIDATION
============================================================
✅ catalog_no_concepts_blob
✅ catalog_no_concept_categories
✅ catalog_concept_ids_is_array
✅ catalog_category_ids_is_array
✅ chunks_no_concepts_text
✅ chunks_no_concept_categories
✅ chunks_concept_ids_is_array
✅ chunks_category_ids_is_array
✅ concepts_no_sources
✅ concepts_no_category
✅ concepts_no_concept_type
✅ concepts_catalog_ids_is_array
============================================================
✅ ALL CHECKS PASSED
```

### 1.2 Manual Database Inspection

```bash
npx tsx scripts/inspect_test_db.ts
```

**Verify**:
- Catalog fields list does not include deprecated fields
- Chunks fields list does not include deprecated fields
- Concepts fields list does not include deprecated fields

---

## Phase 2: Unit Tests

### 2.1 Run Full Test Suite

```bash
npm test
```

**Expected**: All tests pass

### 2.2 Key Test Files to Verify

| Test File | Focus |
|-----------|-------|
| `lancedb-chunk-repository.test.ts` | Chunk mapping without fallback |
| `lancedb-catalog-repository.test.ts` | Catalog without concepts blob |
| `lancedb-concept-repository.test.ts` | Concept without sources/category |
| `concept-search-service.test.ts` | Search without concept_type |
| `concept-id-cache.test.ts` | ID resolution |

---

## Phase 3: Integration Tests

### 3.1 Run Integration Suite

```bash
npm run test:integration
```

**Expected**: All integration tests pass

### 3.2 Database Seeding Test

**Test**: Seed sample-docs to fresh database

```bash
# Remove existing test database
rm -rf ~/.concept_rag_test

# Seed from sample docs
npx tsx hybrid_fast_seed.ts \
  --db-path ~/.concept_rag_test \
  --docs-path sample-docs/
```

**Expected**:
- No errors during seeding
- All documents processed
- Concepts indexed
- Categories created

**Verify**:
```bash
npx tsx -e "
const { connect } = require('@lancedb/lancedb');
const db = await connect('${process.env.HOME}/.concept_rag_test');
const tables = await db.tableNames();
console.log('Tables:', tables);

for (const name of tables) {
  const table = await db.openTable(name);
  console.log(\`\${name}: \${await table.countRows()} rows\`);
}
"
```

---

## Phase 4: MCP Tool Validation

### 4.1 Tool Test Matrix

For each tool, verify:
1. Tool executes without error
2. Response is valid JSON
3. Response contains expected fields
4. Data is correctly resolved (IDs → names)

### 4.2 catalog_search

**Test Query**: `"architecture"`

**Expected Response**:
```json
{
  "results": [
    {
      "source": "/path/to/doc.pdf",
      "preview": "...",
      "score": 0.85,
      "matched_concepts": ["clean architecture", "..."]
    }
  ]
}
```

**Verify**:
- `matched_concepts` are resolved names (not IDs)
- No `concepts` blob in response
- Score fields present

### 4.3 chunks_search

**Test Query**: `"dependency injection"` with source filter

**Expected Response**:
```json
{
  "results": [
    {
      "text": "...",
      "source": "...",
      "concepts": ["dependency injection", "..."],
      "concept_density": 0.15
    }
  ]
}
```

**Verify**:
- `concepts` field contains resolved names
- `concept_density` present
- Text content present

### 4.4 broad_chunks_search

**Test Query**: `"software design patterns"`

**Expected Response**:
```json
{
  "total_results": 10,
  "results": [...]
}
```

**Verify**:
- Cross-document results returned
- Concepts resolved to names

### 4.5 concept_search

**Test Query**: `"testing"`

**Expected Response**:
```json
{
  "concept": "testing",
  "found": true,
  "chunk_count": 5,
  "related_concepts": ["test driven development", "..."],
  "chunks": [...]
}
```

**Verify**:
- `related_concepts` derived from concepts table (not stale blob)
- No `concept_type` in response
- Chunks have resolved concept names

### 4.6 extract_concepts

**Test Query**: Document about "clean architecture"

**Expected Response**:
```json
{
  "document": "...",
  "total_concepts": 25,
  "primary_concepts": ["clean architecture", "..."],
  "categories": ["software architecture"],
  "related_concepts": ["hexagonal architecture", "..."]
}
```

**Verify**:
- NO `technical_terms` field (removed)
- `related_concepts` computed from concepts table
- `primary_concepts` resolved from IDs

### 4.7 source_concepts

**Test Query**: `"testing"`

**Expected Response**:
```json
{
  "concepts_searched": ["testing"],
  "source_count": 3,
  "sources": [
    {
      "source": "/path/to/doc.pdf",
      "primary_concepts": ["..."]
    }
  ]
}
```

**Verify**:
- Sources resolved from `catalog_ids` (not `sources` field)
- Concept attribution correct

### 4.8 category_search

**Test Query**: `"software architecture"`

**Expected Response**:
```json
{
  "category": "software architecture",
  "document_count": 5,
  "documents": [...]
}
```

**Verify**:
- Documents found via `category_ids`
- Category stats accurate

### 4.9 list_categories

**Expected Response**:
```json
{
  "categories": [
    {
      "name": "software architecture",
      "document_count": 5,
      "chunk_count": 150
    }
  ]
}
```

**Verify**:
- All categories listed
- Counts accurate

---

## Phase 5: Data Integrity Checks

### 5.1 Concept ID Resolution

**Test**: All concept_ids in catalog resolve to valid names

```typescript
const catalog = await db.openTable('catalog');
const conceptCache = await container.getConceptIdCache();

const entries = await catalog.query().limit(100).toArray();
for (const entry of entries) {
  const names = conceptCache.getNames(entry.concept_ids);
  // Verify no undefined values
  assert(names.every(n => n !== undefined));
  // Verify names are strings
  assert(names.every(n => typeof n === 'string'));
}
```

### 5.2 Category ID Resolution

**Test**: All category_ids resolve to valid categories

```typescript
const categoryCache = await container.getCategoryIdCache();

for (const entry of entries) {
  const names = categoryCache.getNames(entry.category_ids);
  assert(names.every(n => n !== undefined));
}
```

### 5.3 Catalog ID Resolution (Concepts)

**Test**: All catalog_ids in concepts table resolve to valid documents

```typescript
const concepts = await db.openTable('concepts');
const conceptRows = await concepts.query().limit(1000).toArray();

for (const concept of conceptRows) {
  // Each catalog_id should correspond to a real document
  for (const catalogId of concept.catalog_ids) {
    const doc = await catalogTable.query()
      .where(`id = ${catalogId}`)
      .limit(1)
      .toArray();
    assert(doc.length === 1);
  }
}
```

### 5.4 Related Concepts Derivation

**Test**: Related concepts can be derived for any document

```typescript
const entry = (await catalog.query().limit(1).toArray())[0];
const conceptIds = entry.concept_ids;

const concepts = await conceptRepo.findByIds(conceptIds);
const related = new Set();
concepts.forEach(c => c.relatedConcepts.forEach(r => related.add(r)));

// Should have some related concepts
assert(related.size > 0);
```

---

## Phase 6: Performance Verification

### 6.1 Query Latency

Measure key operations:

| Operation | Target | Measurement |
|-----------|--------|-------------|
| catalog_search | < 200ms | Time full query |
| chunks_search | < 200ms | Time full query |
| concept_search | < 100ms | Time full query |
| ID resolution (batch) | < 10ms | Time cache lookup |

### 6.2 Memory Usage

Monitor memory during:
- Database connection
- Cache initialization
- Query execution

**Expected**: No significant increase from before migration

---

## Phase 7: Regression Checklist

### Functionality Regression

- [ ] Can seed new documents
- [ ] Can search catalog
- [ ] Can search chunks
- [ ] Can search concepts
- [ ] Can extract concepts from document
- [ ] Can find sources for concept
- [ ] Can browse by category
- [ ] Can list categories

### Data Regression

- [ ] Same number of documents indexed
- [ ] Same number of chunks created
- [ ] Same number of concepts extracted
- [ ] Related concepts still populated
- [ ] WordNet enrichment still works

---

## Test Execution Checklist

### Pre-Test

- [ ] Code changes complete
- [ ] `npm run build` succeeds
- [ ] Dependencies up to date

### Execution

- [ ] Phase 1: Schema validation PASSED
- [ ] Phase 2: Unit tests PASSED
- [ ] Phase 3: Integration tests PASSED
- [ ] Phase 4: All MCP tools validated
- [ ] Phase 5: Data integrity confirmed
- [ ] Phase 6: Performance acceptable
- [ ] Phase 7: No regressions found

### Post-Test

- [ ] Test results documented
- [ ] Issues logged (if any)
- [ ] Sign-off obtained

---

## Issue Tracking

If issues are found, document:

| Issue | Tool/Test | Description | Severity | Resolution |
|-------|-----------|-------------|----------|------------|
| | | | | |

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | | | |
| Reviewer | | | |


















