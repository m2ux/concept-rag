# Concept-RAG Database Schema

**Last Updated:** 2025-11-28  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v4 (source removed from chunks, catalogId required)

## Overview

Concept-RAG uses a five-table normalized architecture optimized for concept-heavy workloads:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │──────<│   chunks    │       │  concepts   │       │  categories  │
│ (documents) │       │  (segments) │       │   (index)   │       │  (taxonomy)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
      │                     │                     │                      │
      │               ┌─────────────┐             │                      │
      └──────────────>│   pages     │<────────────┘                      │
                      │ (page-level)│                                    │
                      └─────────────┘                                    │
                            │                                            │
                            └────────────────────────────────────────────┘
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
| `category_ids` | `number[]` | Native array of category integer IDs |

#### Example Record

```typescript
{
  id: 3847293847,
  source: "/home/user/ebooks/Clean Architecture.pdf",
  summary: "Comprehensive guide to Clean Architecture principles...",
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  vector: Float32Array(384),
  category_ids: [1847362847, 2938476523]
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
| `loc` | `string` | JSON-stringified location metadata (page, offset) |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `chunk_index` | `number` | Sequential index within document |
| `page_number` | `number` | Page number for hierarchical retrieval |
| `concept_density` | `number` | Density of concepts in chunk (0-1) |

> **Note:** The `source` field was removed in v4. Use `catalog_id` to lookup the source path from the catalog table. At runtime, use `CatalogSourceCache` for efficient `catalogId` → `source` resolution.

#### Example Record

```typescript
{
  id: 2938475612,  // hash-based integer
  catalog_id: 3847293847,  // REQUIRED - lookup source from catalog
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  loc: '{"pageNumber":15,"from":1200,"to":1850}',
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  category_ids: [1847362847],
  chunk_index: 15,
  page_number: 15,
  concept_density: 0.75
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment. **Canonical source** - populated by LLM extraction.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `concept` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated one-sentence summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
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
  concept: "clean architecture",
  summary: "A software design approach that separates concerns into layers...",
  catalog_ids: [1029384756, 2938475612],
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

### 4. Pages Table

**Purpose:** Page-level concept attribution for hierarchical retrieval.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of "catalogId-pageNum") |
| `catalog_id` | `number` | Parent document ID (foreign key) |
| `page_number` | `number` | Page number within document |
| `concept_ids` | `number[]` | Native array of concept IDs on this page |
| `text_preview` | `string` | First ~500 chars of page content |
| `vector` | `Float32Array` | 384-dimensional embedding of page content |

#### Example Record

```typescript
{
  id: 1029384756,
  catalog_id: 3847293847,
  page_number: 15,
  concept_ids: [2938475683, 1029384756, 3847293900],
  text_preview: "Clean architecture emphasizes separation of concerns...",
  vector: Float32Array(384)
}
```

---

### 5. Categories Table

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

## Relationships

```
Catalog (1) ──────< (N) Chunks       // One document has many chunks (via catalog_id)
Catalog (1) ──────< (N) Pages        // One document has many pages (via catalog_id)
Catalog (N) >─────< (N) Categories   // Documents belong to categories (via category_ids)
Chunks (N) >──────< (N) Concepts     // Chunks tagged with concepts (via concept_ids)
Chunks (N) >──────< (N) Categories   // Chunks tagged with categories (via category_ids)
Pages (N) >───────< (N) Concepts     // Pages contain concepts (via concept_ids)
Concepts (N) >────< (N) Catalog      // Concepts appear in documents (via catalog_ids)
Concepts (N) >────< (N) Concepts     // Adjacent concepts (via adjacent_ids)
Concepts (N) >────< (N) Concepts     // Related concepts (via related_ids)
Categories (N) ───< (1) Categories   // Hierarchical parent-child (via parent_category_id)
```

### Hierarchical Concept Retrieval Flow

```
concept_search("strategy pattern")
       │
       ▼
┌─────────────────┐
│ concepts table  │  Find concept by name → get ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  pages table    │  Find pages with concept_id → get page numbers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ chunks table    │  Find chunks on those pages → return content
└─────────────────┘
```

### Querying Relationships

```typescript
// Find chunks by concept ID
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find pages by concept ID
const pages = await pagesTable
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
| **Pages** | ~50,000 (estimated) |
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
| 2025-11-28 | Added pages table, lexical linking (five-table architecture) | - |
| 2025-11-28 | Removed `source` from chunks, `catalog_id` required | - |

---

## Schema Changes (v3 - November 2025)

### New: Pages Table
| Field | Description |
|-------|-------------|
| `id` | Hash-based ID from "catalogId-pageNum" |
| `catalog_id` | Parent document ID |
| `page_number` | Page number in document |
| `concept_ids` | Concepts on this page (LLM-extracted) |
| `text_preview` | First ~500 chars |
| `vector` | Page embedding |

### Concepts Table Changes
| Change | Details |
|--------|---------|
| `related_concept_ids` → `adjacent_ids` | Renamed for clarity (co-occurrence) |
| `related_ids` | **Added** - Lexical links (shared words) |
| `chunk_ids` | **Added** - Direct chunk references |

### Chunks Table Changes
| Change | Details |
|--------|---------|
| `source` | **Removed** - Use `catalog_id` to lookup source from catalog |
| `catalog_id` | **Now required** - Foreign key to catalog table |
| `page_number` | **Added** - For hierarchical retrieval |
| `concept_density` | **Restored** - For ranking |

### Source Resolution (v4)

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

# Seed pages table
npx tsx scripts/seed_pages_table.ts --db ~/.concept_rag

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
- Pages Seeding: `scripts/seed_pages_table.ts`
- Lexical Linking: `scripts/link_related_concepts.ts`
