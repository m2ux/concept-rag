# Code Changes Manifest

**Date**: 2025-11-26  
**Status**: Reference Document

This document lists all files requiring modification for the schema normalization.

---

## Summary

| Category | Files | Estimated Changes |
|----------|-------|-------------------|
| Domain Models | 3 | Medium |
| Repository Layer | 3 | High |
| Services | 2 | Medium |
| MCP Tools | 6 | Medium |
| Concept Pipeline | 3 | Medium |
| Seeding | 1 | High |
| Schema Validators | 1 | Low |
| Test Helpers | 2 | Medium |
| Test Files | 10+ | Low |
| Scripts | 3 | Medium |
| **Total** | ~35 files | |

---

## 1. Domain Models

### `src/domain/models/catalog-entry.ts` (if exists) or relevant interface

**Changes:**
- Add `title?: string` (reserved for future use)
- Remove deprecated fields

### `src/domain/models/chunk.ts`

**Changes:**
- Remove `concepts?: string[] | any` union type
- Add `conceptIds?: number[]`
- Remove `conceptCategories?: string[]`
- Add `categoryIds?: number[]`

```typescript
// Remove
concepts?: string[] | any;
conceptCategories?: string[];

// Add
conceptIds?: number[];
categoryIds?: number[];
```

### `src/domain/models/concept.ts`

**Changes:**
- Remove `conceptType` field
- Change `sources` to non-existent (data via `catalogIds`)
- Ensure all arrays are properly typed

```typescript
// Remove
conceptType: 'thematic' | 'terminology';
sources: string[];
category: string;

// Keep (already correct)
relatedConcepts: string[];
synonyms?: string[];
// ...
```

### `src/domain/models/search-result.ts`

**Changes:**
- Verify inherits from updated `Chunk` interface

---

## 2. Repository Layer

### `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`

**Changes:**
- Remove fallback to `concepts` text field
- Remove fallback to `concept_categories` text field
- Update `mapRowToChunk()` to use only ID-based fields

**Key function:**
```typescript
private mapRowToChunk(row: any): Chunk {
  // REMOVE: Fallback logic for row.concepts
  // REMOVE: Fallback logic for row.concept_categories
  // USE: row.concept_ids directly (native array)
  // USE: row.category_ids directly (native array)
}
```

### `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`

**Changes:**
- Remove `parseConceptsField()` method entirely
- Update `docToSearchResult()` to not include concepts blob
- Update `getConceptsInCategory()` to use only `concept_ids`

**Remove method:**
```typescript
// DELETE ENTIRELY
private parseConceptsField(doc: any): any {
  // This whole method goes away
}
```

### `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`

**Changes:**
- Remove mapping of `sources` field
- Remove mapping of `category` field
- Remove mapping of `concept_type` field
- Update `mapRowToConcept()` to use only retained fields

**Update mapping:**
```typescript
private mapRowToConcept(row: any): Concept {
  return {
    // Keep
    concept: row.concept,
    catalogIds: row.catalog_ids,  // Native array
    relatedConcepts: row.related_concepts,
    // ...
    
    // REMOVE
    // conceptType: row.concept_type,
    // sources: parseJsonField(row.sources),
    // category: row.category,
  };
}
```

---

## 3. Services

### `src/infrastructure/search/conceptual-hybrid-search-service.ts`

**Changes:**
- Remove passing of `row.concepts` to results
- Use concept_ids for concept resolution

### `src/domain/services/concept-sources-service.ts`

**Changes:**
- Update source attribution to use `catalog_ids` not `sources`
- Remove reading of `concepts.primary_concepts` from catalog

---

## 4. MCP Tools

### `src/tools/operations/conceptual_catalog_search.ts`

**Changes:**
- Update result formatting to resolve concepts from IDs

### `src/tools/operations/conceptual_chunks_search.ts`

**Changes:**
- Update result formatting to resolve concepts from IDs

### `src/tools/operations/concept_search.ts`

**Changes:**
- Remove `concept_type` from response if present
- Update chunk concept display

### `src/tools/operations/document_concepts_extract.ts`

**Changes:**
- Major rewrite to derive data instead of reading blob
- Remove `technical_terms` from output
- Compute `related_concepts` from concepts table

**New logic:**
```typescript
const conceptNames = conceptIdCache.getNames(doc.concept_ids);
const categoryNames = categoryIdCache.getNames(doc.category_ids);
const relatedConcepts = await deriveRelatedConcepts(conceptIds, conceptRepo);

return {
  primary_concepts: conceptNames,
  categories: categoryNames,
  related_concepts: relatedConcepts
  // technical_terms: REMOVED
};
```

### `src/tools/operations/source_concepts.ts`

**Changes:**
- Use `catalog_ids` instead of `sources` for attribution

### `src/tools/operations/concept_sources.ts`

**Changes:**
- Same as source_concepts - use ID-based references

---

## 5. Concept Pipeline

### `src/concepts/concept_extractor.ts`

**Changes:**
- Simplify extraction output structure
- Remove `technical_terms` from extraction
- Remove `related_concepts` from extraction (derived later)

**Update extraction result:**
```typescript
// BEFORE
return {
  primary_concepts: [...],
  categories: [...],
  related_concepts: [...]  // REMOVE
};

// AFTER
return {
  primary_concepts: [...],
  categories: [...]
};
```

### `src/concepts/concept_index.ts`

**Changes:**
- Remove `concept_type` parameter from `addOrUpdateConcept()`
- Remove `concept_type` from `ConceptRecord` creation
- Remove processing of `metadata.related_concepts` (already in concepts table)

### `src/concepts/types.ts`

**Changes:**
- Update `ConceptMetadata` interface
- Remove `ConceptType` if no longer used

```typescript
// BEFORE
export type ConceptType = 'thematic' | 'terminology';

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
// ConceptType type removed
```

---

## 6. Seeding Pipeline

### `hybrid_fast_seed.ts`

**Major changes:**
- Remove population of `concepts` JSON blob
- Remove population of `concept_categories`
- Remove population of `sources` in concepts
- Remove population of `category` in concepts
- Remove population of `concept_type` in concepts
- Change `concept_ids`, `category_ids`, `catalog_ids` to native arrays

**Catalog entry creation:**
```typescript
// BEFORE
const catalogEntry = {
  // ...
  concepts: JSON.stringify({
    primary_concepts: concepts,
    technical_terms: [],
    categories: categories,
    related_concepts: []
  }),
  concept_ids: JSON.stringify(conceptIds),
  concept_categories: JSON.stringify(categories),
  category_ids: JSON.stringify(categoryIds)
};

// AFTER
const catalogEntry = {
  // ...
  concept_ids: conceptIds,      // Native array
  category_ids: categoryIds     // Native array
};
```

**Concept entry creation:**
```typescript
// BEFORE
const conceptEntry = {
  // ...
  concept_type: 'thematic',
  category: category,
  sources: JSON.stringify(sources),
  catalog_ids: JSON.stringify(catalogIds)
};

// AFTER
const conceptEntry = {
  // ...
  catalog_ids: catalogIds       // Native array
  // concept_type, category, sources REMOVED
};
```

---

## 7. Schema Validators

### `src/infrastructure/lancedb/utils/schema-validators.ts`

**Changes:**
- Remove validation for `concepts` text field
- Remove validation for `concept_categories`
- Remove validation for `sources`
- Remove validation for `category`
- Remove validation for `concept_type`
- Update `validateChunkRow()`, `validateConceptRow()`, `validateCatalogRow()`

---

## 8. Test Helpers

### `src/__tests__/test-helpers/integration-test-data.ts`

**Changes:**
- Remove deprecated interfaces
- Update `IntegrationChunkData`
- Update `IntegrationConceptData`
- Update `IntegrationCatalogData`
- Update all builder functions

### `src/__tests__/test-helpers/mock-repositories.ts`

**Changes:**
- Update mock data structures to match new schema

---

## 9. Test Files

### Unit Tests (update assertions/mocks)

- `src/infrastructure/lancedb/repositories/__tests__/lancedb-chunk-repository.test.ts`
- `src/infrastructure/lancedb/repositories/__tests__/lancedb-catalog-repository.test.ts`
- `src/infrastructure/lancedb/repositories/__tests__/lancedb-concept-repository.test.ts`
- `src/domain/services/__tests__/concept-search-service.test.ts`
- `src/domain/services/__tests__/catalog-search-service.test.ts`
- `src/domain/services/__tests__/chunk-search-service.test.ts`
- `src/concepts/__tests__/*.test.ts`

### Integration Tests

- `src/__tests__/integration/chunk-repository.integration.test.ts`
- `src/__tests__/integration/catalog-repository.integration.test.ts`
- `src/__tests__/integration/concept-repository.integration.test.ts`
- `src/__tests__/integration/test-db-setup.ts`

---

## 10. Scripts

### `scripts/complete_test_db_schema.ts`

**Changes:**
- Remove addition of deprecated fields
- Update to new schema structure

### `scripts/compare_schema_vs_plan.ts`

**Changes:**
- Update expected fields list
- Remove checks for deprecated fields

### `scripts/inspect_test_db.ts`

**Changes:**
- Update field inspection
- Add checks for absence of deprecated fields

### New Script: `scripts/validate_normalized_schema.ts`

**Create:**
- Schema validation for normalized structure
- Check absence of all deprecated fields

---

## 11. Configuration

### `src/application/config/types.ts`

**No changes expected** - table names unchanged

### `src/config.ts`

**No changes expected** - constants unchanged

---

## Files NOT Requiring Changes

These files should work without modification:

- `src/infrastructure/cache/concept-id-cache.ts` - Already ID-based
- `src/infrastructure/cache/category-id-cache.ts` - Already ID-based
- `src/infrastructure/embeddings/*.ts` - Embedding logic unchanged
- `src/wordnet/*.ts` - WordNet enrichment unchanged
- `src/application/container.ts` - Dependency injection unchanged

---

## Change Priority Order

1. **Domain models** (foundation)
2. **Types** (ConceptMetadata, ConceptRecord)
3. **Concept pipeline** (extraction, indexing)
4. **Seeding** (hybrid_fast_seed.ts)
5. **Repositories** (data access)
6. **Services** (business logic)
7. **Tools** (MCP interface)
8. **Tests** (validation)
9. **Scripts** (utilities)

---

## Verification Checklist

After all changes:

- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run test:integration` passes
- [ ] Database seeds successfully
- [ ] All MCP tools return valid JSON
- [ ] No TypeScript errors
- [ ] No runtime errors in logs


