# Current Schema Analysis: Redundancies and Dead Code

**Date**: 2025-11-26  
**Status**: Complete

## Executive Summary

Analysis of the current database schema reveals significant redundancy introduced during the migration to hash-based integer IDs. The migration added new ID-based fields but retained old string-based fields for "backward compatibility" - however, backward compatibility is no longer needed and these fields are now pure technical debt.

Additionally, the LLM extraction pipeline produces `technical_terms` that are **never processed** into the concepts table, making this entire extraction feature dead code.

---

## 1. Catalog Table Redundancies

### Current Schema

```typescript
catalog: {
  id: string,
  text: string,                    // Document summary
  source: string,                  // Document path
  hash: string,                    // Content hash
  loc: string,                     // Location metadata
  vector: Float32Array,            // Embedding
  
  // REDUNDANT FIELDS
  concepts: string,                // JSON blob (see structure below)
  concept_categories: string,      // JSON array of category names
  
  // AUTHORITATIVE FIELDS  
  concept_ids: string,             // JSON array of integer IDs
  category_ids: string,            // JSON array of integer IDs
  
  // RESERVED (empty)
  filename_tags: string,
  origin_hash: string,
  author: string,
  year: string,
  publisher: string,
  isbn: string
}
```

### The `concepts` JSON Blob

This field contains a nested JSON structure:

```json
{
  "primary_concepts": ["clean architecture", "dependency injection"],
  "technical_terms": ["IOC container", "service locator"],
  "categories": ["software architecture"],
  "related_concepts": ["factory pattern", "abstract factory"]
}
```

**Problems:**

| Field | Issue | Evidence |
|-------|-------|----------|
| `primary_concepts` | Redundant with `concept_ids` | Both populated during seeding |
| `technical_terms` | **DEAD CODE** - never indexed | `concept_index.ts` line 33: "All concepts are thematic" |
| `categories` | Redundant with `category_ids` | Both populated during seeding |
| `related_concepts` | Redundant - derivable from concepts table | `concept-search-service.ts` fetches from concepts table |

### Evidence: `technical_terms` Never Processed

From `src/concepts/concept_index.ts`:

```typescript
// Process primary concepts (all concepts)
for (const concept of metadata.primary_concepts || []) {
    this.addOrUpdateConcept(
        conceptMap, 
        concept,
        'thematic',  // All concepts are thematic ← HARDCODED!
        source,
        ...
    );
}
// NOTE: technical_terms is NEVER processed
```

### Evidence: Fallback Logic Confirms Redundancy

From `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`:

```typescript
// Resolve concepts: prefer new format (concept_ids) over old format (concepts)
let concepts: string[] = [];
if (row.concept_ids) {
  // NEW FORMAT: Use concept IDs and resolve to names via cache
  const conceptIds = parseJsonField(row.concept_ids);
  concepts = this.conceptIdCache.getNames(conceptIds);
} else {
  // OLD FORMAT: Use concept names directly ← FALLBACK ONLY
  concepts = parseJsonField(row.concepts);
}
```

The code explicitly treats `concepts` as legacy fallback.

---

## 2. Chunks Table Redundancies

### Current Schema

```typescript
chunks: {
  id: string,
  text: string,
  source: string,
  hash: string,
  loc: string,
  vector: Float32Array,
  concept_density: number,
  
  // REDUNDANT FIELDS
  concepts: string,               // JSON array of concept names
  concept_categories: string,     // JSON array of category names
  
  // AUTHORITATIVE FIELDS
  concept_ids: string,            // JSON array of integer IDs
  category_ids: string            // JSON array of integer IDs
}
```

**Same pattern as catalog:**
- `concepts` duplicates `concept_ids`
- `concept_categories` duplicates `category_ids`

---

## 3. Concepts Table Redundancies

### Current Schema

```typescript
concepts: {
  id: number,                     // Hash-based integer ID
  concept: string,                // Concept name
  concept_type: string,           // 'thematic' | 'terminology'
  vector: Float32Array,
  weight: number,
  chunk_count: number,
  enrichment_source: string,
  
  // REDUNDANT FIELDS
  sources: string,                // JSON array of source paths
  category: string,               // Legacy category string
  
  // AUTHORITATIVE FIELDS
  catalog_ids: string,            // JSON array of integer IDs
  
  // SEMANTIC ENRICHMENT (keep)
  related_concepts: string,
  synonyms: string,
  broader_terms: string,
  narrower_terms: string
}
```

**Problems:**

| Field | Issue |
|-------|-------|
| `sources` | Redundant with `catalog_ids` |
| `category` | Legacy - concepts are now category-agnostic |
| `concept_type` | Always 'thematic' (terminology never used) |

---

## 4. Dead Code: `concept_type` Distinction

### Intended Design

The query expander has logic for different concept types:

```typescript
// From src/concepts/query_expander.ts
if (conceptType === 'thematic') {
    // Aggressive expansion - lower threshold
    expanded.set(concept, weight * 0.85);
} else if (conceptType === 'terminology') {
    // Conservative expansion - higher threshold
    expanded.set(concept, weight * 0.7);
}
```

### Actual Reality

All concepts are hardcoded as 'thematic':

```typescript
// From src/concepts/concept_index.ts
'thematic',  // All concepts are thematic
```

**Result:** The terminology logic in query expander **never executes**.

---

## 5. Storage Impact Estimate

### Current Redundant Storage

| Table | Field | Est. Size | Notes |
|-------|-------|-----------|-------|
| catalog | `concepts` blob | ~50 KB/doc | Rich JSON structure |
| catalog | `concept_categories` | ~2 KB/doc | String array |
| chunks | `concepts` | ~500 B/chunk | String array |
| chunks | `concept_categories` | ~200 B/chunk | String array |
| concepts | `sources` | ~500 B/concept | String array |
| concepts | `category` | ~50 B/concept | String field |

### Estimated Savings

For a typical database (165 docs, 10K chunks, 37K concepts):

| Component | Current | After Removal | Savings |
|-----------|---------|---------------|---------|
| Catalog | ~9 MB | ~5 MB | ~4 MB |
| Chunks | ~7 MB | ~4 MB | ~3 MB |
| Concepts | ~20 MB | ~18 MB | ~2 MB |
| **Total** | ~36 MB | ~27 MB | **~9 MB (25%)** |

Combined with existing 324 MB database, this is modest but removes technical debt.

---

## 6. Summary of Fields to Remove

### Catalog Table

| Field | Action | Reason |
|-------|--------|--------|
| `concepts` | **REMOVE** | Redundant JSON blob |
| `concept_categories` | **REMOVE** | Use `category_ids` |
| `concept_ids` | **REMOVE** | Derivable from union of chunk concept_ids |
| `filename_tags` | **REMOVE** | Not needed |
| `loc` | **REMOVE** | Not meaningful for document-level entries |

### Chunks Table

| Field | Action | Reason |
|-------|--------|--------|
| `source` | **REPLACE** with `catalog_id` | Integer lookup faster than string |
| `concepts` | **REMOVE** | Use `concept_ids` |
| `concept_categories` | **REMOVE** | Use `category_ids` |
| `concept_density` | **REMOVE** | Compute on demand from concept_ids.length / word count |

### Concepts Table

| Field | Action | Reason |
|-------|--------|--------|
| `sources` | **REMOVE** | Use `catalog_ids` |
| `category` | **REMOVE** | Concepts are category-agnostic |
| `chunk_count` | **REMOVE** | Compute on demand |
| `enrichment_source` | **REMOVE** | Unused debugging metadata |
| `concept_type` | **KEEP but reassess** | Could implement terminology support |

---

## 7. Code Paths Using Deprecated Fields

### Files Reading `concepts` (text):

1. `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts` - Fallback
2. `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts` - parseConceptsField
3. `src/tools/operations/document_concepts_extract.ts` - Display
4. `src/domain/services/concept-sources-service.ts` - Metadata display

### Files Reading `concept_categories` (text):

1. `src/infrastructure/search/conceptual-hybrid-search-service.ts` - Result mapping
2. Various test files

### Files Reading `sources` (concepts table):

1. `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts` - Mapping
2. `src/tools/operations/source_concepts.ts` - Display

---

## Conclusion

The current schema carries significant legacy weight from the integer ID migration. The analysis confirms:

1. **All redundant fields have authoritative ID-based replacements**
2. **`technical_terms` is completely dead code**
3. **Removal is safe** - fallback logic exists but is never needed
4. **Storage savings are modest but technical debt reduction is significant**

**Recommendation:** Proceed with full removal of redundant fields and update the seeding/extraction pipeline to stop producing unused data.


