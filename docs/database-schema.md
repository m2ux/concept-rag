# Concept-RAG Database Schema

**Last Updated:** 2025-11-28  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v7 (derived text fields, no ID caches needed)

## Overview

Concept-RAG uses a four-table normalized architecture optimized for concept-heavy workloads:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │──────<│   chunks    │       │  concepts   │       │  categories  │
│ (documents) │       │  (segments) │       │   (index)   │       │  (taxonomy)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
      │                     │                     │                      │
      │                     │                     │                      │
      └─────────────────────┴─────────────────────┴──────────────────────┘
                        Many-to-many via native array columns
```

### Design Principles

- **Normalization**: No redundant data - single source of truth for each piece of information
- **Hash-based IDs**: FNV-1a hashing for stable integer IDs across database rebuilds
- **Native arrays**: Many-to-many relationships stored as LanceDB native arrays (not JSON strings)
- **ID-based references**: All relationships use integer IDs (no string paths in relationships)
- **Derived text fields**: Human-readable names stored alongside IDs for direct text queries
- **No runtime caches**: Derived fields eliminate need for ID-to-name cache lookups
- **Vector storage**: 384-dimensional embeddings on all tables for semantic search
- **LLM as source**: Concepts table is populated by LLM extraction, serving as canonical source

---

## Tables

### 1. Catalog Table

**Purpose:** Document-level metadata and summaries for document discovery.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of source path) |
| `source` | `string` | Document file path (unique identifier) |
| `title` | `string` | Document title (parsed from filename) |
| `summary` | `string` | LLM-generated document summary |
| `hash` | `string` | SHA-256 content hash for deduplication |
| `vector` | `Float32Array` | 384-dimensional embedding of summary |
| `concept_ids` | `number[]` | Native array of concept IDs (foreign keys to concepts table) |
| `concept_names` | `string[]` | **DERIVED:** Concept names for display and text search |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `category_names` | `string[]` | **DERIVED:** Category names for display and text search |
| `origin_hash` | `string` | *Reserved:* Hash of original file before processing |
| `author` | `string` | Document author(s) (parsed from filename) |
| `year` | `number` | Publication year (parsed from filename) |
| `publisher` | `string` | Publisher name (parsed from filename) |
| `isbn` | `string` | ISBN (parsed from filename, preserved with hyphens) |

#### Filename Metadata Parsing

Bibliographic fields are automatically extracted from filenames using the `--` delimiter format:

```
Title -- Author -- Date -- Publisher -- ISBN -- Hash.ext
```

**Example filename:**
```
Effective software testing -- Elfriede Dustin -- December 18, 2002 -- Addison-Wesley -- 9780201794298 -- 5297d243.pdf
```

**Normalization rules:**
- Underscores (`_`) are converted to spaces
- URL-encoded spaces (`%20`, `_20`) are converted to spaces  
- Multiple consecutive spaces are collapsed to single space
- Fields that cannot be parsed are left empty (string) or zero (number)
- If no `--` delimiters exist, entire filename (without extension) becomes the title

#### Example Record

```typescript
{
  id: 3847293847,
  source: "/home/user/ebooks/Clean Architecture -- Robert Martin -- 2017 -- Pearson -- 9780134494166 -- abc123.pdf",
  title: "Clean Architecture",
  summary: "Comprehensive guide to Clean Architecture principles...",
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  vector: Float32Array(384),
  concept_ids: [2938475683, 1029384756, 3847293900],
  concept_names: ["clean architecture", "dependency injection", "solid principles"],
  category_ids: [1847362847, 2938476523],
  category_names: ["software architecture", "design patterns"],
  // Bibliographic fields (parsed from filename)
  origin_hash: "",
  author: "Robert Martin",
  year: 2017,
  publisher: "Pearson",
  isbn: "9780134494166"
}
```

---

### 2. Chunks Table

**Purpose:** Text segments for fine-grained retrieval and semantic search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of source-hash-index) |
| `catalog_id` | `number` | **Required.** Hash-based catalog entry ID (foreign key to catalog) |
| `catalog_title` | `string` | **DERIVED:** Document title from catalog (for display) |
| `text` | `string` | Chunk text content (typically 100-500 words) |
| `hash` | `string` | Content hash for deduplication |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs (for concept-chunk linkage) |
| `concept_names` | `string[]` | **DERIVED:** Concept names for display and text search |
| `concept_density` | `number` | Concept richness score: `concept_ids.length / (word_count / 10)` |
| `page_number` | `number` | Page number in source document (from PDF loader) |

> **Note:** The `source` field was removed in v7. Chunks store `catalog_title` for display and `catalog_id` for joins. Tools should use `catalog_title` directly.
> 
> **Note:** The `category_ids` field was removed - use `catalog_id` → `catalog.category_ids` for category lookup.
>
> **Note:** No ID-to-name caches are needed at runtime. Use `concept_names` and `catalog_title` directly.

#### Example Record

```typescript
{
  id: 2938475612,  // hash-based integer
  catalog_id: 3847293847,  // foreign key to catalog
  catalog_title: "Clean Architecture",  // DERIVED: for display
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  concept_names: ["clean architecture", "separation of concerns", "dependency rule"],  // DERIVED
  page_number: 15
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment. **Canonical source** - populated by LLM extraction.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `name` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated contextual summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
| `catalog_titles` | `string[]` | **DERIVED:** Document titles for display |
| `chunk_ids` | `number[]` | Native array of chunk IDs where concept appears |
| `adjacent_ids` | `number[]` | Co-occurrence links (concepts appearing together in documents) |
| `related_ids` | `number[]` | Lexical links (concepts sharing significant words) |
| `synonyms` | `string[]` | Native array of synonyms (from WordNet) |
| `broader_terms` | `string[]` | Native array of hypernyms (from WordNet) |
| `narrower_terms` | `string[]` | Native array of hyponyms (from WordNet) |
| `weight` | `number` | Importance weight (0-1, based on frequency/centrality) |
| `vector` | `Float32Array` | 384-dimensional concept embedding |

#### Concept Summaries

Concept summaries are generated during extraction (same LLM call) to ensure alignment with the source text:
- 15-30 words describing the concept in the document's context
- Domain-specific terminology from the source document
- Enables fuzzy text search on concept meanings

#### Concept Linking

Two types of concept relationships:

1. **Adjacent (co-occurrence)**: Concepts that appear together in the same document
   - E.g., "clean architecture" and "dependency injection" both in same book
   
2. **Related (lexical)**: Concepts sharing significant words (≥5 chars)
   - E.g., "military strategy" ↔ "strategy pattern" (share "strategy")

#### Example Record

```typescript
{
  id: 3847293847,
  name: "clean architecture",
  summary: "A software design approach that separates business logic from infrastructure through dependency inversion and clear boundaries.",
  catalog_ids: [1029384756, 2938475612],
  catalog_titles: ["Clean Architecture", "Domain-Driven Design"],  // DERIVED
  chunk_ids: [123456, 234567, 345678],
  adjacent_ids: [2938475683, 1029384756],  // co-occurrence
  related_ids: [1847362999, 2938476000],   // lexical links
  synonyms: ["uncle bob architecture"],
  broader_terms: ["software architecture", "system design"],
  narrower_terms: ["dependency rule", "boundary layer"],
  weight: 0.85,
  vector: Float32Array(384)
}
```

---

### 4. Categories Table

**Purpose:** Taxonomy of semantic categories with hierarchy for domain browsing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of category name) |
| `category` | `string` | Normalized category name (e.g., "software architecture") |
| `description` | `string` | Human-readable category description |
| `summary` | `string` | LLM-generated one-sentence summary of the category |
| `parent_category_id` | `number \| null` | Parent category ID (null for root categories) |
| `aliases` | `string[]` | Native array of alternative names |
| `related_categories` | `number[]` | Native array of co-occurring category IDs |
| `document_count` | `number` | Number of documents in this category |
| `chunk_count` | `number` | Number of chunks tagged with this category |
| `concept_count` | `number` | Number of unique concepts in this category |
| `vector` | `Float32Array` | 384-dimensional category embedding |

#### Example Record

```typescript
{
  id: 1847362847,
  category: "software architecture",
  description: "Patterns and practices for designing software systems",
  summary: "The high-level structure and organization of software systems...",
  parent_category_id: null,
  aliases: ["software design", "system architecture"],
  related_categories: [2938476523, 1029384756],
  document_count: 25,
  chunk_count: 1250,
  concept_count: 340,
  vector: Float32Array(384)
}
```

---

## Derived Fields

**DERIVED** fields are denormalized for query performance and display. They can be regenerated from canonical sources at any time.

### Design Philosophy: IDs for Truth, Names for Queries

```
IDs (concept_ids, catalog_ids, etc.)    →  SOURCE OF TRUTH (foreign keys)
Names (concept_names, catalog_title)    →  PRIMARY FOR QUERIES (human-readable)
```

**Runtime queries use TEXT fields directly** (fast, human-readable, no cache lookups):
```typescript
// Query on derived text fields - no cache needed
chunks.query().where(`array_contains(concept_names, 'dependency injection')`)
concepts.query().where(`array_contains(catalog_titles, 'Clean Architecture')`)

// Display uses derived fields directly
const title = chunk.catalog_title;  // Not: cache.getTitle(chunk.catalog_id)
const concepts = chunk.concept_names;  // Not: cache.getNames(chunk.concept_ids)
```

### Derived Field Summary

| Table | Field | Type | Regeneration Source |
|-------|-------|------|---------------------|
| `chunks` | `catalog_title` | `string` | `catalog_id` → `catalog.title` |
| `chunks` | `concept_names` | `string[]` | `concept_ids` → `concepts.name` |
| `catalog` | `concept_names` | `string[]` | `concept_ids` → `concepts.name` |
| `catalog` | `category_names` | `string[]` | `category_ids` → `categories.category` |
| `concepts` | `catalog_titles` | `string[]` | `catalog_ids` → `catalog.title` |

### Regenerating Derived Fields

Use the regeneration script to rebuild all derived name fields:

```bash
# Full regeneration
npx tsx scripts/rebuild_derived_names.ts --dbpath ~/.concept_rag

# Target specific table
npx tsx scripts/rebuild_derived_names.ts --table chunks

# Dry run to see what would change
npx tsx scripts/rebuild_derived_names.ts --dry-run
```

---

## Relationships

```
Catalog (1) ──────< (N) Chunks       // One document has many chunks (via catalog_id)
Catalog (N) >─────< (N) Categories   // Documents belong to categories (via category_ids)
Catalog (N) >─────< (N) Concepts     // Documents tagged with concepts (via concept_ids)
Chunks (N) >──────< (N) Concepts     // Chunks tagged with concepts (via concept_ids)
Concepts (N) >────< (N) Catalog      // Concepts appear in documents (via catalog_ids)
Concepts (N) >────< (N) Concepts     // Adjacent concepts (via adjacent_ids)
Concepts (N) >────< (N) Concepts     // Related concepts (via related_ids)
Categories (N) ───< (1) Categories   // Hierarchical parent-child (via parent_category_id)
```

### Concept Retrieval Flow

```
concept_search("strategy pattern")
       │
       ▼
┌─────────────────┐
│ concepts table  │  Find concept by name → get catalog_ids, catalog_titles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ catalog table   │  Documents listed in catalog_titles (no extra lookup)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ chunks table    │  Find chunks with concept_name, display catalog_title
└─────────────────┘
```

### Querying Relationships

```typescript
// Find chunks by concept name (uses derived field)
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_names, 'dependency injection')`)
  .toArray();

// Display chunk results (uses derived fields directly)
for (const chunk of chunks) {
  console.log(`Title: ${chunk.catalog_title}`);
  console.log(`Concepts: ${chunk.concept_names.join(', ')}`);
}

// Find documents with a concept
const docs = await catalogTable
  .query()
  .where(`array_contains(concept_names, 'clean architecture')`)
  .toArray();

// Find documents in a category
const docs = await catalogTable
  .query()
  .where(`array_contains(category_names, 'software architecture')`)
  .toArray();
```

---

## ID Generation

All integer IDs use **FNV-1a hashing** for deterministic, stable IDs:

```typescript
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

function hashToId(str: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0; // Unsigned 32-bit integer
}
```

**Benefits:**
- Same input → same ID (deterministic)
- No external mapping files needed
- IDs stable across database rebuilds
- Efficient integer comparisons

---

## Vector Index

The chunks table uses an IVF-PQ vector index for fast similarity search:

```typescript
await chunksTable.createIndex("vector", {
  config: {
    type: 'ivf_pq',
    numPartitions: Math.max(2, Math.floor(rowCount / 100)),
    numSubVectors: 16
  }
});
```

**Index Configuration:**
- **Type:** IVF-PQ (Inverted File with Product Quantization)
- **Partitions:** Dynamic based on table size
- **Sub-vectors:** 16 (for 384-dim embeddings)
- **Minimum rows:** 256 (required for IVF-PQ)

---

## Production Statistics (November 2025)

| Metric | Value |
|--------|-------|
| **Total Size** | 1.1 GB |
| **Documents (catalog)** | 259 |
| **Chunks** | 471,454 |
| **Concepts** | 59,587 |
| **Categories** | 687 |
| **Avg concepts per chunk** | ~3-5 |

---

## Schema Evolution

| Date | Change | ADR |
|------|--------|-----|
| 2024-11 | Initial two-table (catalog, chunks) | ADR-0002 |
| 2025-10-13 | Added concepts table (three-table architecture) | ADR-0009 |
| 2025-11-19 | Hash-based integer IDs | ADR-0027 |
| 2025-11-19 | Added categories table (four-table architecture) | ADR-0028 |
| 2025-11-26 | Schema normalization (redundant field removal) | ADR-0043 |
| 2025-11-28 | Added derived name fields: `concept_names`, `category_names`, `catalog_titles` | - |
| 2025-11-28 | Replaced `source` with `catalog_title` in chunks (v7) | - |
| 2025-11-28 | Removed ID mapping caches (ConceptIdCache, CatalogSourceCache, CategoryIdCache) | - |
| 2025-11-28 | Added `summary` field to concepts (extracted with concept) | - |

---

## Schema Changes (v7 - November 2025)

### Philosophy: Derived Text Fields Replace Caches

The v7 schema eliminates the need for runtime ID-to-name caches by storing derived text fields directly:

| Before (v6) | After (v7) |
|-------------|------------|
| `chunk.catalog_id` → `CatalogSourceCache.getSource()` | `chunk.catalog_title` (direct) |
| `chunk.concept_ids` → `ConceptIdCache.getNames()` | `chunk.concept_names` (direct) |
| `concept.catalog_ids` → cache lookup | `concept.catalog_titles` (direct) |

### Chunks Table Changes (v7)

| Change | Details |
|--------|---------|
| `source` | **Removed** - Use `catalog_title` for display |
| `catalog_title` | **Added** - Document title from catalog (derived) |
| `concept_names` | **Added** - Concept names for display (derived) |

### Removed: ID Mapping Caches

The following caches are no longer needed and have been removed:

- **ConceptIdCache** - Replaced by `concept_names` derived field
- **CatalogSourceCache** - Replaced by `catalog_title` derived field  
- **CategoryIdCache** - Replaced by `category_names` derived field

### Performance Caches (Still Used)

These performance caches remain for CPU/DB optimization:

- **EmbeddingCache** - Avoids recomputing embeddings
- **SearchResultCache** - Caches repeated search queries

---

## Related Documentation

- [ADR-0002: LanceDB Vector Storage](architecture/adr0002-lancedb-vector-storage.md)
- [ADR-0009: Three-Table Architecture](architecture/adr0009-three-table-architecture.md)
- [ADR-0027: Hash-Based Integer IDs](architecture/adr0027-hash-based-integer-ids.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Domain Models: `src/domain/models/`
- Schema Validators: `src/infrastructure/lancedb/utils/schema-validators.ts`
- Migration Script: `scripts/migrate_to_normalized_schema.ts`
- Lexical Linking: `scripts/link_related_concepts.ts`
- Derived Fields Regeneration: `scripts/rebuild_derived_names.ts`
