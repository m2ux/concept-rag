# Schema Normalization Discussion Summary

**Date:** 2025-11-26  
**Context:** Planning session for database schema normalization

---

## Overview

This chat session focused on identifying and documenting redundancies in the LanceDB schema, with the goal of normalizing the database structure to eliminate duplicate data, reduce storage, and improve consistency.

## Optimizations Identified

A total of **16 optimizations** were identified through iterative discussion:

| # | Table | Field | Issue | Resolution |
|---|-------|-------|-------|------------|
| 1 | Catalog | `concepts` (JSON blob) | Rich metadata, partially redundant | Flatten to ID arrays |
| 2 | Catalog | `concept_ids` | Derivable from chunks | Remove |
| 3 | Catalog | `concept_categories` | Redundant with `category_ids` | Remove |
| 4 | Catalog | `related_concepts` | Derivable from concepts table | Remove |
| 5 | Chunks | `concepts` (text) | Redundant with `concept_ids` | Remove |
| 6 | Chunks | `concept_categories` | Redundant with `category_ids` | Remove |
| 7 | Concepts | `sources` (text) | Redundant with `catalog_ids` | Remove |
| 8 | Concepts | `category` | Concepts are category-agnostic | Remove |
| 9 | Concepts | `concept_type` | Always 'thematic' (dead code) | Remove |
| 10 | Catalog | `filename_tags` | Unused | Remove |
| 11 | Catalog | `loc` | Meaningless at document level | Remove |
| 12 | Catalog | `source` | Full path stored | Rename to `filename`, store slug only |
| 13 | Chunks | `source` | String-based lookup | Replace with `catalog_id` (integer) |
| 14 | Concepts | `chunk_count` | Derivable from chunks | Remove, compute on demand |
| 15 | Concepts | `enrichment_source` | Unused debugging metadata | Remove |
| 16 | Concepts | `related_concepts` | Text-based | Change to `related_concept_ids` (integers) |
| 17 | Chunks | `concept_density` | Derivable from concept_ids/text | Remove, compute on demand |

## Key Decisions

### 1. Text vs ID-based Fields
- **Decision:** Migrate all concept and category references to integer IDs
- **Rationale:** Smaller storage, faster lookups, referential integrity

### 2. Derived Fields
- **Decision:** Remove stored fields that can be computed on demand
- **Fields affected:** `chunk_count`, `concept_density`, `enrichment_source`
- **Rationale:** Prevents stale data, reduces storage, simplifies schema

### 3. Catalog Source Field
- **Decision:** Rename `source` → `filename`, store only filename slug (not full path)
- **Rationale:** Portability, cleaner display, reduced storage

### 4. Chunks-to-Catalog Relationship
- **Decision:** Replace `source` (string) with `catalog_id` (integer hash)
- **Rationale:** Faster lookups, consistent with ID patterns, smaller storage

### 5. Related Concepts
- **Decision:** Change from text array to integer ID array
- **Rationale:** Related concepts ARE concepts in our table (from corpus co-occurrence), so they should use IDs
- **Note:** WordNet fields (`synonyms`, `broader_terms`, `narrower_terms`) stay as text because they may not exist in our corpus

## Target Schema Summary

### Catalog Table
```typescript
interface CatalogEntry {
  id: number;           // Hash of filename
  filename: string;     // Filename slug only
  hash: string;
  text: string;
  vector: Float32Array;
  category_ids: number[];
  title?: string;       // Reserved for future use
}
```

### Chunks Table
```typescript
interface Chunk {
  id: string;
  catalog_id: number;   // Replaces source
  hash: string;
  text: string;
  vector: Float32Array;
  concept_ids: number[];
  category_ids: number[];
  loc: string;
}
```

### Concepts Table
```typescript
interface Concept {
  id: number;
  concept: string;
  catalog_ids: number[];
  related_concept_ids: number[];  // Changed from string[]
  synonyms: string[];             // Stays text (WordNet)
  broader_terms: string[];        // Stays text (WordNet)
  narrower_terms: string[];       // Stays text (WordNet)
  weight: number;
  vector: Float32Array;
}
```

## Migration Strategy

The planning documents include:

1. **Migration scripts** (`scripts/migrate_to_normalized_schema.ts`)
   - Transforms legacy schema to normalized schema
   - Builds source→catalog_id mapping
   - Converts related_concepts to related_concept_ids
   - Preserves all data relationships

2. **Validation scripts** (`scripts/validate_normalized_schema.ts`)
   - Checks required fields exist
   - Verifies deprecated fields removed
   - Validates correct types

3. **Test workflow**
   - Backup existing database
   - Run migration on test database
   - Validate schema
   - Test fresh seed with sample-docs

## Compute-on-Demand Functions

Several fields will be computed rather than stored:

```typescript
// Chunk count for a concept
async function getConceptChunkCount(conceptId: number): Promise<number> {
  return await chunksTable.query()
    .where(`array_contains(concept_ids, ${conceptId})`)
    .count();
}

// Concept density for a chunk
function computeConceptDensity(chunk: Chunk): number {
  const wordCount = chunk.text.split(/\s+/).length;
  const conceptCount = chunk.concept_ids?.length || 0;
  return wordCount > 0 ? conceptCount / wordCount : 0;
}

// Concept IDs for a catalog entry (derived from its chunks)
async function getCatalogConceptIds(catalogId: number): Promise<number[]> {
  const chunks = await chunksTable.query()
    .where(`catalog_id = ${catalogId}`)
    .select(['concept_ids'])
    .toArray();
  return [...new Set(chunks.flatMap(c => c.concept_ids))];
}
```

## Files Created/Updated

- `00-chat-summary.md` (this file)
- `01-current-schema-analysis.md` - Updated with all redundancies
- `02-target-schema-design.md` - Updated with final target schema
- `03-migration-plan.md` - Updated with migration scripts
- `04-code-changes-manifest.md` - Files requiring modification
- `05-validation-test-plan.md` - Testing strategy
- `README.md` - Updated timeline and overview

## Next Steps

1. Review planning documents for completeness
2. Implement Phase 1: Domain model changes
3. Implement Phase 2: Repository updates
4. Implement Phase 3: Tool updates
5. Create and test migration scripts
6. Run migration on test database
7. Validate all tools work correctly
8. Update documentation

















