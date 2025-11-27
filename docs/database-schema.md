# Concept-RAG Database Schema

**Last Updated:** 2025-11-27  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v2 (catalog.text → summary, concept/category summaries added)

## Overview

Concept-RAG uses a four-table normalized architecture optimized for concept-heavy workloads:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │──────<│   chunks    │       │  concepts   │       │  categories  │
│ (documents) │       │  (segments) │       │   (index)   │       │  (taxonomy)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
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
| `id` | `string` | Unique chunk identifier |
| `source` | `string` | Document source path (for backward compatibility) |
| `catalog_id` | `number` | Hash-based catalog entry ID (foreign key) |
| `text` | `string` | Chunk text content (typically 100-500 words) |
| `hash` | `string` | Content hash for deduplication |
| `loc` | `string` | JSON-stringified location metadata (page, offset) |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `chunk_index` | `number` | Sequential index within document |

#### Example Record

```typescript
{
  id: "chunk-456",
  source: "/home/user/ebooks/Clean Architecture.pdf",
  catalog_id: 3847293847,
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  loc: '{"pageNumber":15,"from":1200,"to":1850}',
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  category_ids: [1847362847],
  chunk_index: 15
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment from WordNet and corpus analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `concept` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated one-sentence summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
| `related_concept_ids` | `number[]` | Native array of related concept IDs (corpus co-occurrence) |
| `synonyms` | `string[]` | Native array of synonyms (from WordNet) |
| `broader_terms` | `string[]` | Native array of hypernyms (from WordNet) |
| `narrower_terms` | `string[]` | Native array of hyponyms (from WordNet) |
| `weight` | `number` | Importance weight (0-1, based on frequency/centrality) |
| `vector` | `Float32Array` | 384-dimensional concept embedding |

#### Example Record

```typescript
{
  id: 3847293847,
  concept: "clean architecture",
  summary: "A software design approach that separates concerns into layers with dependencies pointing inward toward domain logic.",
  catalog_ids: [1029384756, 2938475612],
  related_concept_ids: [2938475683, 1029384756, 3847293900],
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
  summary: "The high-level structure and organization of software systems, including components, relationships, and design principles.",
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
Catalog (N) >─────< (N) Categories   // Documents belong to categories (via category_ids)
Chunks (N) >──────< (N) Concepts     // Chunks tagged with concepts (via concept_ids)
Chunks (N) >──────< (N) Categories   // Chunks tagged with categories (via category_ids)
Concepts (N) >────< (N) Catalog      // Concepts appear in documents (via catalog_ids)
Categories (N) ───< (1) Categories   // Hierarchical parent-child (via parent_category_id)
```

### Querying Relationships

```typescript
// Find chunks by concept ID
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find documents in a category
const docs = await catalogTable
  .query()
  .where(`array_contains(category_ids, ${categoryId})`)
  .toArray();

// Find concepts in a document (via chunks)
const conceptIds = new Set<number>();
const chunks = await chunksTable
  .query()
  .where(`catalog_id = ${catalogId}`)
  .toArray();
for (const chunk of chunks) {
  chunk.concept_ids.forEach(id => conceptIds.add(id));
}
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

---

## Schema Changes (Normalization)

The following changes were made in ADR-0043 and subsequent updates:

### Catalog Table
| Change | Details |
|--------|---------|
| `text` → `summary` | Renamed for semantic clarity |
| `concepts` | Removed - derive from chunks' concept_ids |
| `concept_ids` | Removed - derive from chunks |
| `concept_categories` | Replaced by category_ids |
| `loc` | Removed - not needed at document level |
| `filename_tags` | Removed - never implemented |

### Chunks Table
| Change | Details |
|--------|---------|
| `concepts` | Removed - replaced by concept_ids |
| `concept_categories` | Removed - replaced by category_ids |
| `concept_density` | Removed - compute on demand if needed |

### Concepts Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |
| `concept_type` | Removed - never used in queries |
| `category` | Removed - derive from associated chunks |
| `sources` | Replaced by catalog_ids |
| `related_concepts` | Replaced by related_concept_ids |
| `chunk_count` | Removed - compute on demand |
| `enrichment_source` | Removed - never used |

### Categories Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |

---

## Migration

To migrate from legacy schema to normalized schema:

```bash
# Backup first!
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d)

# Run migration
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag

# Validate
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag

# Verify tools
npx tsx scripts/verify_mcp_tools.ts ~/.concept_rag
```

---

## Related Documentation

- [ADR-0002: LanceDB Vector Storage](architecture/adr0002-lancedb-vector-storage.md)
- [ADR-0009: Three-Table Architecture](architecture/adr0009-three-table-architecture.md)
- [ADR-0027: Hash-Based Integer IDs](architecture/adr0027-hash-based-integer-ids.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Domain Models: `src/domain/models/`
- Schema Validators: `src/infrastructure/lancedb/utils/schema-validators.ts`
- Migration Script: `scripts/migrate_to_normalized_schema.ts`
- Validation Script: `scripts/validate_normalized_schema.ts`

**Last Updated:** 2025-11-27  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v2 (catalog.text → summary, concept/category summaries added)

## Overview

Concept-RAG uses a four-table normalized architecture optimized for concept-heavy workloads:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │──────<│   chunks    │       │  concepts   │       │  categories  │
│ (documents) │       │  (segments) │       │   (index)   │       │  (taxonomy)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
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
| `id` | `string` | Unique chunk identifier |
| `source` | `string` | Document source path (for backward compatibility) |
| `catalog_id` | `number` | Hash-based catalog entry ID (foreign key) |
| `text` | `string` | Chunk text content (typically 100-500 words) |
| `hash` | `string` | Content hash for deduplication |
| `loc` | `string` | JSON-stringified location metadata (page, offset) |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `chunk_index` | `number` | Sequential index within document |

#### Example Record

```typescript
{
  id: "chunk-456",
  source: "/home/user/ebooks/Clean Architecture.pdf",
  catalog_id: 3847293847,
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  loc: '{"pageNumber":15,"from":1200,"to":1850}',
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  category_ids: [1847362847],
  chunk_index: 15
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment from WordNet and corpus analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `concept` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated one-sentence summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
| `related_concept_ids` | `number[]` | Native array of related concept IDs (corpus co-occurrence) |
| `synonyms` | `string[]` | Native array of synonyms (from WordNet) |
| `broader_terms` | `string[]` | Native array of hypernyms (from WordNet) |
| `narrower_terms` | `string[]` | Native array of hyponyms (from WordNet) |
| `weight` | `number` | Importance weight (0-1, based on frequency/centrality) |
| `vector` | `Float32Array` | 384-dimensional concept embedding |

#### Example Record

```typescript
{
  id: 3847293847,
  concept: "clean architecture",
  summary: "A software design approach that separates concerns into layers with dependencies pointing inward toward domain logic.",
  catalog_ids: [1029384756, 2938475612],
  related_concept_ids: [2938475683, 1029384756, 3847293900],
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
  summary: "The high-level structure and organization of software systems, including components, relationships, and design principles.",
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
Catalog (N) >─────< (N) Categories   // Documents belong to categories (via category_ids)
Chunks (N) >──────< (N) Concepts     // Chunks tagged with concepts (via concept_ids)
Chunks (N) >──────< (N) Categories   // Chunks tagged with categories (via category_ids)
Concepts (N) >────< (N) Catalog      // Concepts appear in documents (via catalog_ids)
Categories (N) ───< (1) Categories   // Hierarchical parent-child (via parent_category_id)
```

### Querying Relationships

```typescript
// Find chunks by concept ID
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find documents in a category
const docs = await catalogTable
  .query()
  .where(`array_contains(category_ids, ${categoryId})`)
  .toArray();

// Find concepts in a document (via chunks)
const conceptIds = new Set<number>();
const chunks = await chunksTable
  .query()
  .where(`catalog_id = ${catalogId}`)
  .toArray();
for (const chunk of chunks) {
  chunk.concept_ids.forEach(id => conceptIds.add(id));
}
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

---

## Schema Changes (Normalization)

The following changes were made in ADR-0043 and subsequent updates:

### Catalog Table
| Change | Details |
|--------|---------|
| `text` → `summary` | Renamed for semantic clarity |
| `concepts` | Removed - derive from chunks' concept_ids |
| `concept_ids` | Removed - derive from chunks |
| `concept_categories` | Replaced by category_ids |
| `loc` | Removed - not needed at document level |
| `filename_tags` | Removed - never implemented |

### Chunks Table
| Change | Details |
|--------|---------|
| `concepts` | Removed - replaced by concept_ids |
| `concept_categories` | Removed - replaced by category_ids |
| `concept_density` | Removed - compute on demand if needed |

### Concepts Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |
| `concept_type` | Removed - never used in queries |
| `category` | Removed - derive from associated chunks |
| `sources` | Replaced by catalog_ids |
| `related_concepts` | Replaced by related_concept_ids |
| `chunk_count` | Removed - compute on demand |
| `enrichment_source` | Removed - never used |

### Categories Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |

---

## Migration

To migrate from legacy schema to normalized schema:

```bash
# Backup first!
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d)

# Run migration
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag

# Validate
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag

# Verify tools
npx tsx scripts/verify_mcp_tools.ts ~/.concept_rag
```

---

## Related Documentation

- [ADR-0002: LanceDB Vector Storage](architecture/adr0002-lancedb-vector-storage.md)
- [ADR-0009: Three-Table Architecture](architecture/adr0009-three-table-architecture.md)
- [ADR-0027: Hash-Based Integer IDs](architecture/adr0027-hash-based-integer-ids.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Domain Models: `src/domain/models/`
- Schema Validators: `src/infrastructure/lancedb/utils/schema-validators.ts`
- Migration Script: `scripts/migrate_to_normalized_schema.ts`
- Validation Script: `scripts/validate_normalized_schema.ts`

**Last Updated:** 2025-11-27  
**Database:** LanceDB (embedded vector database)  
**Embedding Model:** all-MiniLM-L6-v2 (384 dimensions)  
**Schema Version:** Normalized v2 (catalog.text → summary, concept/category summaries added)

## Overview

Concept-RAG uses a four-table normalized architecture optimized for concept-heavy workloads:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   catalog   │──────<│   chunks    │       │  concepts   │       │  categories  │
│ (documents) │       │  (segments) │       │   (index)   │       │  (taxonomy)  │
└─────────────┘       └─────────────┘       └─────────────┘       └──────────────┘
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
| `id` | `string` | Unique chunk identifier |
| `source` | `string` | Document source path (for backward compatibility) |
| `catalog_id` | `number` | Hash-based catalog entry ID (foreign key) |
| `text` | `string` | Chunk text content (typically 100-500 words) |
| `hash` | `string` | Content hash for deduplication |
| `loc` | `string` | JSON-stringified location metadata (page, offset) |
| `vector` | `Float32Array` | 384-dimensional embedding |
| `concept_ids` | `number[]` | Native array of concept integer IDs |
| `category_ids` | `number[]` | Native array of category integer IDs |
| `chunk_index` | `number` | Sequential index within document |

#### Example Record

```typescript
{
  id: "chunk-456",
  source: "/home/user/ebooks/Clean Architecture.pdf",
  catalog_id: 3847293847,
  text: "Clean architecture emphasizes separation of concerns...",
  hash: "def456",
  loc: '{"pageNumber":15,"from":1200,"to":1850}',
  vector: Float32Array(384),
  concept_ids: [3847293847, 1928374652, 2837465928],
  category_ids: [1847362847],
  chunk_index: 15
}
```

---

### 3. Concepts Table

**Purpose:** Deduplicated concept index with semantic enrichment from WordNet and corpus analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based integer ID (FNV-1a of concept name) |
| `concept` | `string` | Concept name (unique, lowercase, e.g., "dependency injection") |
| `summary` | `string` | LLM-generated one-sentence summary of the concept |
| `catalog_ids` | `number[]` | Native array of catalog entry integer IDs |
| `related_concept_ids` | `number[]` | Native array of related concept IDs (corpus co-occurrence) |
| `synonyms` | `string[]` | Native array of synonyms (from WordNet) |
| `broader_terms` | `string[]` | Native array of hypernyms (from WordNet) |
| `narrower_terms` | `string[]` | Native array of hyponyms (from WordNet) |
| `weight` | `number` | Importance weight (0-1, based on frequency/centrality) |
| `vector` | `Float32Array` | 384-dimensional concept embedding |

#### Example Record

```typescript
{
  id: 3847293847,
  concept: "clean architecture",
  summary: "A software design approach that separates concerns into layers with dependencies pointing inward toward domain logic.",
  catalog_ids: [1029384756, 2938475612],
  related_concept_ids: [2938475683, 1029384756, 3847293900],
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
  summary: "The high-level structure and organization of software systems, including components, relationships, and design principles.",
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
Catalog (N) >─────< (N) Categories   // Documents belong to categories (via category_ids)
Chunks (N) >──────< (N) Concepts     // Chunks tagged with concepts (via concept_ids)
Chunks (N) >──────< (N) Categories   // Chunks tagged with categories (via category_ids)
Concepts (N) >────< (N) Catalog      // Concepts appear in documents (via catalog_ids)
Categories (N) ───< (1) Categories   // Hierarchical parent-child (via parent_category_id)
```

### Querying Relationships

```typescript
// Find chunks by concept ID
const chunks = await chunksTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();

// Find documents in a category
const docs = await catalogTable
  .query()
  .where(`array_contains(category_ids, ${categoryId})`)
  .toArray();

// Find concepts in a document (via chunks)
const conceptIds = new Set<number>();
const chunks = await chunksTable
  .query()
  .where(`catalog_id = ${catalogId}`)
  .toArray();
for (const chunk of chunks) {
  chunk.concept_ids.forEach(id => conceptIds.add(id));
}
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

---

## Schema Changes (Normalization)

The following changes were made in ADR-0043 and subsequent updates:

### Catalog Table
| Change | Details |
|--------|---------|
| `text` → `summary` | Renamed for semantic clarity |
| `concepts` | Removed - derive from chunks' concept_ids |
| `concept_ids` | Removed - derive from chunks |
| `concept_categories` | Replaced by category_ids |
| `loc` | Removed - not needed at document level |
| `filename_tags` | Removed - never implemented |

### Chunks Table
| Change | Details |
|--------|---------|
| `concepts` | Removed - replaced by concept_ids |
| `concept_categories` | Removed - replaced by category_ids |
| `concept_density` | Removed - compute on demand if needed |

### Concepts Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |
| `concept_type` | Removed - never used in queries |
| `category` | Removed - derive from associated chunks |
| `sources` | Replaced by catalog_ids |
| `related_concepts` | Replaced by related_concept_ids |
| `chunk_count` | Removed - compute on demand |
| `enrichment_source` | Removed - never used |

### Categories Table
| Change | Details |
|--------|---------|
| `summary` | **Added** - LLM-generated one-sentence summary |

---

## Migration

To migrate from legacy schema to normalized schema:

```bash
# Backup first!
cp -r ~/.concept_rag ~/.concept_rag.backup.$(date +%Y%m%d)

# Run migration
npx tsx scripts/migrate_to_normalized_schema.ts ~/.concept_rag

# Validate
npx tsx scripts/validate_normalized_schema.ts ~/.concept_rag

# Verify tools
npx tsx scripts/verify_mcp_tools.ts ~/.concept_rag
```

---

## Related Documentation

- [ADR-0002: LanceDB Vector Storage](architecture/adr0002-lancedb-vector-storage.md)
- [ADR-0009: Three-Table Architecture](architecture/adr0009-three-table-architecture.md)
- [ADR-0027: Hash-Based Integer IDs](architecture/adr0027-hash-based-integer-ids.md)
- [ADR-0043: Schema Normalization](architecture/adr0043-schema-normalization.md)
- Domain Models: `src/domain/models/`
- Schema Validators: `src/infrastructure/lancedb/utils/schema-validators.ts`
- Migration Script: `scripts/migrate_to_normalized_schema.ts`
- Validation Script: `scripts/validate_normalized_schema.ts`
