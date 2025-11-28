# Concept-RAG Database Schema

**Last Updated:** 2025-11-28  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v6 (pages table removed, concept_ids added to catalog)

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
- **Compute on demand**: Statistics derived via queries, not pre-stored
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
| `summary` | `string` | LLM-generated document summary |
| `hash` | `string` | SHA-256 content hash for deduplication |
| `vector` | `Float32Array` | 384-dimensional embedding of summary |
| `concept_ids` | `number[]` | Native array of concept IDs (foreign keys to concepts table) |
| `concept_names` | `string[]` | **DERIVED:** Concept names for display and text search |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `category_names` | `string[]` | **DERIVED:** Category names for display and text search |
| `origin_hash` | `string` | *Reserved:* Hash of original file before processing |
| `author` | `string` | *Reserved:* Document author(s) |
| `year` | `number` | *Reserved:* Publication year |
| `publisher` | `string` | *Reserved:* Publisher name |
| `isbn` | `string` | *Reserved:* ISBN (string for flexibility with hyphens/prefixes) |

#### Example Record

```typescript
{
  id: 3847293847,
  source: "/home/user/ebooks/Clean Architecture.pdf",
  summary: "Comprehensive guide to Clean Architecture principles...",
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  vector: Float32Array(384),
  concept_ids: [2938475683, 1029384756, 3847293900],  // Document-level concepts
  concept_names: ["clean architecture", "dependency injection", "solid principles"],  // DERIVED
  category_ids: [1847362847, 2938476523],
  category_names: ["software architecture", "design patterns"],  // DERIVED
  // Reserved bibliographic fields (for future use)
  origin_hash: "",
  author: "",
  year: 0,
  publisher: "",
  isbn: ""
}
```

---

### 2. Chunks Table

**Purpose:** Text segments for fine-grained retrieval and semantic search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of source-hash-index) |
| `catalog_id` | `number` | **Required.** Hash-based catalog entry ID (foreign key to catalog) |
| `text` | `string` | Chunk text content (typically 100-500 words) |
| `hash` | `string` | Content hash for deduplication |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs (for concept-chunk linkage) |
| `concept_names` | `string[]` | **DERIVED:** Concept names for display and text search |
| `chunk_index` | `number` | Sequential index within document |
| `page_number` | `number` | Page number in source document (from PDF loader) |
| `concept_density` | `number` | Density of concepts in chunk (0-1) |

> **Note:** The `source` field was removed in v4. Use `catalog_id` to lookup the source path from the catalog table. At runtime, use `CatalogSourceCache` for efficient `catalogId` → `source` resolution.
> 
> **Note:** The `category_ids` field was removed - use `catalog_id` → `catalog.category_ids` for category lookup.
>
> **Note:** The `concepts` (string[]) field was removed. Use `concept_ids` with `ConceptIdCache.getNames()` to resolve concept names when needed for display.

#### Example Record

```typescript
{
  id: 2938475612,  // hash-based integer
  catalog_id: 3847293847,  // REQUIRED - lookup source and categories from catalog
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  concept_names: ["clean architecture", "separation of concerns", "dependency rule"],  // DERIVED
  chunk_index: 15,
  page_number: 15,  // directly from PDF loader
  concept_density: 0.75
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment. **Canonical source** - populated by LLM extraction.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `name` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated one-sentence summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
| `catalog_titles` | `string[]` | **DERIVED:** Document titles (source paths) for display |
| `chunk_ids` | `number[]` | Native array of chunk IDs where concept appears |
| `adjacent_ids` | `number[]` | Co-occurrence links (concepts appearing together in documents) |
| `related_ids` | `number[]` | Lexical links (concepts sharing significant words) |
| `synonyms` | `string[]` | Native array of synonyms (from WordNet) |
| `broader_terms` | `string[]` | Native array of hypernyms (from WordNet) |
| `narrower_terms` | `string[]` | Native array of hyponyms (from WordNet) |
| `weight` | `number` | Importance weight (0-1, based on frequency/centrality) |
| `vector` | `Float32Array` | 384-dimensional concept embedding |

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
  summary: "A software design approach that separates concerns into layers...",
  catalog_ids: [1029384756, 2938475612],
  catalog_titles: ["/home/user/ebooks/Clean Architecture.pdf", "/home/user/ebooks/DDD.pdf"],  // DERIVED
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
IDs (concept_ids, catalog_ids, etc.)    →  SOURCE OF TRUTH
Names (concept_names, catalog_titles)   →  PRIMARY FOR QUERIES
```

**Runtime queries use TEXT arrays** (fast, human-readable, no cache lookups):
```typescript
// GOOD: Query on denormalized names
chunks.query().where(`array_contains(concept_names, 'dependency injection')`)
concepts.query().where(`array_contains(catalog_titles, 'Clean Architecture')`)
```

### Derived Field Summary

| Table | Field | Type | Regeneration Source |
|-------|-------|------|---------------------|
| `chunks` | `concept_names` | `string[]` | `concept_ids` → `concepts.name` |
| `catalog` | `concept_names` | `string[]` | `concept_ids` → `concepts.name` |
| `catalog` | `category_names` | `string[]` | `category_ids` → `categories.category` |
| `concepts` | `catalog_titles` | `string[]` | `catalog_ids` → `catalog.source` |

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
│ concepts table  │  Find concept by name → get ID and catalog_ids
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ catalog table   │  Find documents where concept appears
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ chunks table    │  Find chunks from those documents with concept_id
└─────────────────┘
```

### Querying Relationships

```typescript
// Find chunks by concept ID
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find documents with a concept
const docs = await catalogTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find documents in a category
const docs = await catalogTable
  .query()
  .where(`array_contains(category_ids, ${categoryId})`)
  .toArray();

// Find lexically related concepts
const concept = await conceptsTable.query().where(`id = ${conceptId}`).toArray();
const relatedIds = concept[0].related_ids;
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
| 2025-11-28 | Removed `source` and `loc` from chunks, `catalog_id` required | - |
| 2025-11-28 | Removed `concepts` (string[]) from chunks, use `concept_ids` + cache | - |
| 2025-11-28 | Removed pages table, added `concept_ids` to catalog (four-table) | - |
| 2025-11-28 | Added derived name fields for queries: `concept_names`, `category_names`, `catalog_titles` | - |

---

## Schema Changes (v6 - November 2025)

### Catalog Table Changes
| Change | Details |
|--------|---------|
| `concept_ids` | **Added** - Document-level concept IDs (foreign keys to concepts table) |

### Removed: Pages Table
The pages table was removed. Concept-document associations are now stored via:
- `catalog.concept_ids` - concepts in each document
- `concepts.catalog_ids` - documents where each concept appears
- `chunks.concept_ids` - concepts in each chunk

### Concepts Table
| Field | Description |
|-------|-------------|
| `catalog_ids` | Documents where this concept appears (bidirectional with catalog.concept_ids) |

### Chunks Table Changes
| Change | Details |
|--------|---------|
| `source` | **Removed** - Use `catalog_id` to lookup source from catalog |
| `loc` | **Removed** - Page info now in `page_number` directly |
| `category_ids` | **Removed** - Use `catalog_id` → `catalog.category_ids` |
| `concepts` (string[]) | **Removed** - Use `concept_ids` with `ConceptIdCache` to resolve names |
| `catalog_id` | **Now required** - Foreign key to catalog table |
| `page_number` | **Added** - Populated directly from PDF loader |
| `concept_density` | **Restored** - For ranking |

### Source Resolution

With `source` removed from chunks, use the `CatalogSourceCache` for display:

```typescript
import { CatalogSourceCache } from './infrastructure/cache/catalog-source-cache.js';

// Initialize once at startup
const cache = CatalogSourceCache.getInstance();
await cache.initialize(catalogRepo);

// Resolve catalogId to source path
const sourcePath = cache.getSource(chunk.catalogId);
```

---

## Migration

To migrate from legacy schema to normalized schema:

```bash
# Backup first!
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d)

# Run migration
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag

# Run lexical linking
npx tsx scripts/link_related_concepts.ts --db ~/.concept_rag

# Validate
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag
```

---

## Related Documentation

- [ADR-0002: LanceDB Vector Storage](architecture/adr0002-lancedb-vector-storage.md)
- [ADR-0009: Three-Table Architecture](architecture/adr0009-three-table-architecture.md)
- [ADR-0027: Hash-Based Integer IDs](architecture/adr0027-hash-based-integer-ids.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Domain Models: `src/domain/models/`
- Schema Validators: `src/infrastructure/lancedb/utils/schema-validators.ts`
- Source Cache: `src/infrastructure/cache/catalog-source-cache.ts`
- Migration Script: `scripts/migrate_to_normalized_schema.ts`
- Lexical Linking: `scripts/link_related_concepts.ts`
- Derived Fields Regeneration: `scripts/rebuild_derived_names.ts`
