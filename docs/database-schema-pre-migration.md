# Concept-RAG Database Schema (Pre-Migration)

**Last Updated:** 2025-11-28  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Pre-normalization (restored from backup 2025-11-27)

## Overview

This document describes the database schema as it existed **before** the schema normalization migration. This is the schema restored from `.concept_rag.backup.pre_migration.20251127_124308`.

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │       │   chunks    │       │  concepts   │       │  categories  │
│ (255 rows)  │       │(471,454 rows)│      │(59,587 rows)│       │  (687 rows)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
```

### Key Characteristics

- **Mixed ID types**: `catalog.id` and `chunks.id` are strings; `concepts.id` and `categories.id` are numeric
- **Denormalized data**: `chunks` table contains `source` path (duplicated from catalog)
- **JSON-encoded arrays**: Many array fields stored as JSON strings (not native arrays)
- **Legacy field names**: Uses `concept` instead of `name` in concepts table

---

## Tables

### 1. Catalog Table

**Purpose:** Document-level metadata and summaries for document discovery.  
**Row Count:** 255 documents

| Column | LanceDB Type | JavaScript Type | Description |
|--------|--------------|-----------------|-------------|
| `id` | `Utf8` | `string` | String-based ID (sequential numeric string) |
| `source` | `Utf8` | `string` | Document file path (unique identifier) |
| `hash` | `Utf8` | `string` | SHA-256 content hash for deduplication |
| `summary` | `Utf8` | `string` | LLM-generated document summary |
| `vector` | `FixedSizeList[384]<Float32>` | `Float32Array` | 384-dimensional embedding of summary |
| `category_ids` | `List<Float64>` | `number[]` | Native array of category integer IDs |

#### Notes
- `id` is a string type (e.g., `"1"`, `"2"`) not an integer
- `category_ids` is a native LanceDB array (not JSON-encoded)
- No `concept_ids` field - concepts not linked at document level

#### Example Record

```javascript
{
  id: "1",  // String type
  source: "/home/mike/Documents/ebooks/DistributedSystems/Distributed Computing.pdf",
  hash: "143eab4f60e22219b3c44a83376cca45eb757d439db8aefcd9e2f711b3eb6216",
  summary: "This document is the proceedings of the 16th International Conference on Distributed Computing...",
  vector: Float32Array(384),
  category_ids: [2726112975, 3405947310, 3533156218]  // Native array
}
```

---

### 2. Chunks Table

**Purpose:** Text segments for fine-grained retrieval and semantic search.  
**Row Count:** 471,454 chunks

| Column | LanceDB Type | JavaScript Type | Description |
|--------|--------------|-----------------|-------------|
| `id` | `Utf8` | `string` | String-based ID (sequential numeric string) |
| `text` | `Utf8` | `string` | Chunk text content |
| `source` | `Utf8` | `string` | Document file path (**denormalized**) |
| `hash` | `Utf8` | `string` | Content hash for deduplication |
| `loc` | `Utf8` | `string` | JSON-encoded location info |
| `vector` | `FixedSizeList[384]<Float32>` | `Float32Array` | 384-dimensional embedding |
| `concepts` | `Utf8` | `string` | JSON array of concept names |
| `concept_categories` | `Utf8` | `string` | JSON array of category names |
| `category_ids` | `Utf8` | `string` | JSON array of category IDs |
| `concept_density` | `Float64` | `number` | Density of concepts in chunk (0-1) |

#### Notes
- `id` is a string type (e.g., `"0"`, `"1"`)
- `source` is **denormalized** (duplicated from catalog) - normalization removes this
- `loc` contains JSON: `{"pageNumber":1,"lines":{"from":1,"to":7}}`
- `concepts`, `concept_categories`, `category_ids` are JSON strings (not native arrays)
- No `catalog_id` foreign key - uses `source` path for relationship

#### Example Record

```javascript
{
  id: "0",  // String type
  text: "Solid Mechanics and Its Applications...",
  source: "/home/mike/Documents/ebooks/DistributedSystems/Continuous and Distributed Systems.pdf",  // Denormalized
  hash: "259055934f97a91838934dcc3f83292849a923579cfc3e4eb502cfaac7376bd2",
  loc: '{"pageNumber":1,"lines":{"from":1,"to":7}}',  // JSON string
  vector: Float32Array(384),
  concepts: '["solid mechanics","continuous and distributed systems","operator theory"]',  // JSON string
  concept_categories: '["systems thinking","systems engineering"]',  // JSON string
  category_ids: '[2726112975,3405947310,3533156218]',  // JSON string (not native array!)
  concept_density: 0.58
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment.  
**Row Count:** 59,587 concepts

| Column | LanceDB Type | JavaScript Type | Description |
|--------|--------------|-----------------|-------------|
| `id` | `Float64` | `number` | Hash-based integer ID (FNV-1a) |
| `concept` | `Utf8` | `string` | Concept name (**not** `name`) |
| `concept_type` | `Utf8` | `string` | Type: "thematic", "technical", etc. |
| `category` | `Utf8` | `string` | Primary category name |
| `sources` | `Utf8` | `string` | JSON array of source file paths |
| `catalog_ids` | `Utf8` | `string` | JSON array of catalog entry IDs |
| `related_concepts` | `Utf8` | `string` | JSON array of related concept names |
| `synonyms` | `Utf8` | `string` | JSON array of synonyms |
| `broader_terms` | `Utf8` | `string` | JSON array of hypernyms (WordNet) |
| `narrower_terms` | `Utf8` | `string` | JSON array of hyponyms (WordNet) |
| `weight` | `Float64` | `number` | Importance weight (0-1) |
| `chunk_count` | `Float64` | `number` | Number of chunks containing concept |
| `enrichment_source` | `Utf8` | `string` | Source of enrichment: "corpus", "wordnet" |
| `vector` | `FixedSizeList[384]<Float32>` | `Float32Array` | 384-dimensional concept embedding |

#### Notes
- Uses `concept` field name (normalized schema uses `name`)
- All array fields are **JSON strings** (not native arrays)
- `sources` stores full file paths (redundant with `catalog_ids`)
- No `adjacent_ids` or `related_ids` fields (co-occurrence linking)
- No `chunk_ids` field for direct chunk linkage
- No `summary` field for concept descriptions

#### Example Record

```javascript
{
  id: 591741419,  // Integer (hash-based)
  concept: "software engineering discipline",  // Not "name"
  concept_type: "thematic",
  category: "software engineering",
  sources: '["/home/mike/Ebooks/Engineering/A Discipline for Software Engineering.pdf"]',  // JSON string
  catalog_ids: '[1062967063]',  // JSON string
  related_concepts: '["systems engineering","project management","risk management"]',  // JSON string
  synonyms: '[]',  // JSON string (empty)
  broader_terms: '[]',
  narrower_terms: '[]',
  weight: 1,
  chunk_count: 0,
  enrichment_source: "corpus",
  vector: Float32Array(384)
}
```

---

### 4. Categories Table

**Purpose:** Taxonomy of semantic categories with hierarchy for domain browsing.  
**Row Count:** 687 categories

| Column | LanceDB Type | JavaScript Type | Description |
|--------|--------------|-----------------|-------------|
| `id` | `Float64` | `number` | Hash-based integer ID (FNV-1a) |
| `category` | `Utf8` | `string` | Normalized category name |
| `description` | `Utf8` | `string` | Human-readable description |
| `summary` | `Utf8` | `string` | LLM-generated summary |
| `parent_category_id` | `Float64` | `number` | Parent category ID (0 for root) |
| `aliases` | `List<Utf8>` | `string[]` | Native array of alternative names |
| `related_categories` | `List<Float64>` | `number[]` | Native array of related category IDs |
| `document_count` | `Float64` | `number` | Documents in this category |
| `chunk_count` | `Float64` | `number` | Chunks tagged with category |
| `concept_count` | `Float64` | `number` | Unique concepts in category |
| `vector` | `FixedSizeList[384]<Float32>` | `Float32Array` | 384-dimensional embedding |

#### Notes
- `aliases` and `related_categories` are **native arrays** (not JSON)
- `parent_category_id` uses `0` for root (not `null`)
- Has denormalized counts (`document_count`, `chunk_count`, `concept_count`)

#### Example Record

```javascript
{
  id: 2709793376,
  category: "analog and mixed-signal design",
  description: "Concepts and practices related to analog and mixed-signal design",
  summary: "Analog and mixed-signal design encompasses the development of circuits...",
  parent_category_id: 0,  // Root category
  aliases: [""],  // Native array (empty placeholder)
  related_categories: [0],  // Native array (empty placeholder)
  document_count: 1,
  chunk_count: 0,
  concept_count: 0,
  vector: Float32Array(384)
}
```

---

## Relationships (Pre-Migration)

```
Catalog ─────────────────── Chunks       // Via source path (denormalized)
    └── category_ids ────── Categories   // Via native array

Chunks ────────────────────── source ──── Catalog    // String path match
    └── concepts (JSON) ────── Concepts              // String name match
    └── category_ids (JSON) ── Categories            // ID match

Concepts ── sources (JSON) ── Catalog    // File path strings
    └── catalog_ids (JSON) ── Catalog    // Integer ID match
    └── related_concepts ──── Concepts   // String name match
```

### Key Differences from Normalized Schema

| Aspect | Pre-Migration | Post-Migration (Normalized) |
|--------|---------------|----------------------------|
| Catalog ID | `string` ("1", "2") | `number` (hash-based) |
| Chunks ID | `string` ("0", "1") | `number` (hash-based) |
| Chunks.source | Present (denormalized) | Removed (use `catalog_id`) |
| Chunks.loc | JSON string | Removed (use `page_number`) |
| Chunks.concepts | JSON string | Removed (use `concept_ids`) |
| Chunks.catalog_id | Not present | Required foreign key |
| Chunks.concept_ids | Not present | Native array of integers |
| Concepts field name | `concept` | `name` |
| Concepts.sources | JSON string paths | Removed |
| Concepts.adjacent_ids | Not present | Native array |
| Concepts.related_ids | Not present | Native array |
| Concepts.chunk_ids | Not present | Native array |
| Concepts.summary | Not present | LLM-generated description |
| Array encoding | Mixed (JSON + native) | All native arrays |

---

## Statistics

| Table | Row Count | Storage |
|-------|-----------|---------|
| catalog | 255 | ~1.5 MB |
| chunks | 471,454 | ~900 MB |
| concepts | 59,587 | ~50 MB |
| categories | 687 | ~1 MB |
| **Total** | **531,983** | **~950 MB** |

---

## Migration Path

To migrate from this pre-migration schema to the normalized schema:

```bash
# This database is the pre-migration backup
# Location: ~/.concept_rag

# To migrate to normalized schema:
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag

# Add lexical linking (related_ids)
npx tsx scripts/link_related_concepts.ts --db ~/.concept_rag

# Validate migration
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag
```

### Migration Changes Required

1. **ID type conversion**: Convert string IDs to hash-based integers
2. **Add catalog_id to chunks**: Link chunks to catalog via integer foreign key
3. **Remove denormalized source**: Remove `source` from chunks table
4. **Convert loc to page_number**: Extract page number from JSON loc
5. **Add concept_ids to chunks**: Native integer array replacing JSON concepts
6. **Rename concept to name**: In concepts table
7. **Add chunk_ids to concepts**: Track which chunks contain each concept
8. **Add adjacent_ids/related_ids**: Co-occurrence and lexical linking
9. **Convert JSON arrays**: All arrays to native LanceDB format

---

## Related Documentation

- [Current Schema (Post-Migration)](database-schema.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Migration Script: `scripts/migrate_to_normalized_schema.ts`

