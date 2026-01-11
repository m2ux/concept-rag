# Database Schema Reference

## Overview

Concept-RAG uses **LanceDB** with three main tables stored as Apache Arrow columnar files:

```
~/.concept_rag/
├── catalog.lance/        # Document summaries and metadata
├── chunks.lance/         # Text chunks with concept tags
└── concepts.lance/       # Extracted concepts with relationships
```

## Table Definitions

### 1. Catalog Table

**Purpose**: Document-level summaries, metadata, and concept overviews

**Table Name**: `catalog` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | string | Auto-generated record ID | Plain text |
| `text` | string | Document summary (enriched with concepts) | Plain text |
| `source` | string | Full file path to document | Plain text |
| `hash` | string | Content hash for deduplication | Plain text |
| `loc` | string | Location metadata (page numbers, etc.) | JSON stringified |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |
| `concepts` | string | Rich concept metadata | JSON stringified object |
| `concept_categories` | string | Semantic categories | JSON stringified array |

**Concepts Field Structure** (when parsed from JSON):

```typescript
{
  primary_concepts: string[],      // Main concepts (e.g., ["microservices", "REST API"])
  categories: string[],            // Semantic categories (e.g., ["software architecture"])
  related_concepts: string[],      // Related concepts
  technical_terms?: string[],      // Optional technical terminology
  summary?: string                 // Optional document summary
}
```

**Example Row**:

```typescript
{
  id: "0",
  text: "This book covers microservice architecture patterns including...\n\nKey Concepts: service mesh, API gateway, event sourcing\nCategories: software architecture, distributed systems",
  source: "/home/user/books/Microservices Patterns.pdf",
  hash: "abc123def456",
  loc: '{"lines":{"from":1,"to":350}}',
  vector: [0.123, -0.456, 0.789, ...], // 384 dimensions
  concepts: '{"primary_concepts":["microservices","service mesh","API gateway"],"categories":["software architecture"],"related_concepts":["distributed systems","scalability"]}',
  concept_categories: '["software architecture","distributed systems"]'
}
```

**Typical Size**: 1 entry per document (~100-1000 entries for typical library)

---

### 2. Chunks Table

**Purpose**: Text segments extracted from documents, enriched with concept metadata

**Table Name**: `chunks` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | string | Auto-generated chunk ID | Plain text |
| `text` | string | Chunk content (typically 100-500 words) | Plain text |
| `source` | string | Full file path to source document | Plain text |
| `hash` | string | Content hash for deduplication | Plain text |
| `loc` | string | Location metadata (page, line numbers) | JSON stringified |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |
| `concepts` | string | Array of concept names in this chunk | JSON stringified array |
| `concept_categories` | string | Semantic categories for this chunk | JSON stringified array |
| `concept_density` | number | Density of concepts (0-1) | Float |

**Example Row**:

```typescript
{
  id: "42",
  text: "The API Gateway pattern provides a single entry point for clients to access microservices. It handles request routing, composition, and protocol translation.",
  source: "/home/user/books/Microservices Patterns.pdf",
  hash: "def789ghi012",
  loc: '{"lines":{"from":145,"to":150}}',
  vector: [0.234, -0.567, 0.890, ...], // 384 dimensions
  concepts: '["API gateway","microservices","request routing","protocol translation"]',
  concept_categories: '["software architecture","distributed systems","design patterns"]',
  concept_density: 0.15
}
```

**Typical Size**: 10-50 chunks per document (~1,000-50,000 entries for typical library)

---

### 3. Concepts Table

**Purpose**: Unique concepts extracted across all documents with relationships and statistics

**Table Name**: `concepts` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | string | Auto-generated concept ID | Plain text |
| `concept` | string | The concept name (normalized) | Plain text |
| `concept_type` | string | Type: "thematic" or "terminology" | Plain text |
| `category` | string | Primary semantic category | Plain text |
| `sources` | string | List of source documents containing concept | JSON stringified array |
| `related_concepts` | string | Co-occurring concepts | JSON stringified array |
| `synonyms` | string | WordNet synonyms | JSON stringified array |
| `broader_terms` | string | WordNet hypernyms (broader concepts) | JSON stringified array |
| `narrower_terms` | string | WordNet hyponyms (narrower concepts) | JSON stringified array |
| `weight` | number | Importance weight (based on frequency) | Float |
| `chunk_count` | number | Number of chunks containing this concept | Integer |
| `enrichment_source` | string | Source of enrichment: "corpus", "wordnet", or "hybrid" | Plain text |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |

**Example Row**:

```typescript
{
  id: "123",
  concept: "API gateway",
  concept_type: "thematic",
  category: "software architecture",
  sources: '["/home/user/books/Microservices Patterns.pdf","/home/user/books/Cloud Native.pdf"]',
  related_concepts: '["microservices","service mesh","load balancing"]',
  synonyms: '["API proxy","gateway service"]',
  broader_terms: '["architectural pattern","integration pattern"]',
  narrower_terms: '["edge gateway","backend gateway"]',
  weight: 0.85,
  chunk_count: 47,
  enrichment_source: "hybrid",
  vector: [0.345, -0.678, 0.901, ...] // 384 dimensions
}
```

**Typical Size**: 80-150 concepts per document (~8,000-150,000 entries for typical library)

---

## Field Type Details

### Vector Embeddings

- **Model**: Xenova/all-MiniLM-L6-v2 (local, CPU-based)
- **Dimensions**: 384
- **Generation**: Created during ingestion for all text content
- **Purpose**: Semantic similarity search using cosine distance

### JSON Stringified Fields

All JSON fields are stored as strings in LanceDB but parsed to objects/arrays when retrieved:

```typescript
// In database
concepts: '["microservices","API gateway"]'

// After parsing (in application code)
concepts: ["microservices", "API gateway"]
```

### Hash Fields

- **Algorithm**: Content-based hash (likely MD5 or SHA-256)
- **Purpose**: Deduplication, change detection
- **Applies to**: Both full documents (catalog) and chunks

---

## Indexing Strategy

### Vector Indexes

All tables use **IVF_PQ** (Inverted File with Product Quantization) indexes on the `vector` field for fast approximate nearest neighbor (ANN) search:

- **Minimum dataset size**: 256 vectors (required for PQ training)
- **Partitions**: Dynamic based on dataset size
  - < 100 vectors: 2 partitions
  - 100-500: 2-5 partitions
  - 500-1000: 4-7 partitions
  - 1000-5000: 8-17 partitions
  - 5000-10000: 32-33 partitions
  - 10000-50000: 64-125 partitions
  - 50000+: 256 partitions

### Source Filtering

Queries often filter by `source` field to limit searches to specific documents.

---

## Storage Format

### Apache Arrow

- **Format**: Columnar storage (efficient for analytics)
- **Compression**: Built-in Arrow compression
- **Benefits**:
  - Fast columnar scans
  - Efficient memory usage
  - Zero-copy reads
  - Cross-language compatibility

### Size Estimates

| Library Size | Catalog | Chunks | Concepts | Total |
|--------------|---------|--------|----------|-------|
| 10 docs | ~1 MB | ~4 MB | ~5 MB | ~10 MB |
| 100 docs | ~10 MB | ~40 MB | ~50 MB | ~100 MB |
| 1000 docs | ~100 MB | ~400 MB | ~500 MB | ~1 GB |

*Actual size depends on document length, chunk size, and concept density*

---

## Table Relationships

```
Document (PDF/EPUB)
    ↓
    ├─→ Catalog Entry (1 per document)
    │     - Summary
    │     - Concepts overview
    │     - Categories
    │
    ├─→ Chunks (10-50 per document)
    │     - Text segments
    │     - Concept tags
    │     - Categories
    │
    └─→ Concepts (extracted and indexed)
          - Unique concepts across library
          - Relationships & statistics
          - Source documents
```

### Linking Fields

- **Catalog ↔ Chunks**: Linked by `source` field (file path)
- **Chunks → Concepts**: Linked by concept names in `concepts` array
- **Concepts → Documents**: Linked by `sources` array (file paths)

---

## Schema Evolution

### Version Compatibility

Current schema version is **implicit** (no version field). Future schema changes should:

1. Add migration scripts to `scripts/migrate_*.ts`
2. Maintain backward compatibility where possible
3. Document breaking changes in CHANGELOG.md

### Adding New Fields

To add a field to a table:

1. Update ingestion code (`hybrid_fast_seed.ts`)
2. Update TypeScript interfaces (`src/domain/models/`)
3. Update validation (`src/infrastructure/lancedb/utils/schema-validators.ts`)
4. Provide migration script for existing databases

### Current Limitations

- **No explicit document titles**: Derived from `source` filename
- **No author metadata**: Not extracted during ingestion
- **No publication date**: Not stored
- **No explicit versioning**: Schema changes require full rebuild

---

## Access Patterns

### By Repository

Each table has a dedicated repository:

| Table | Repository | Interface |
|-------|-----------|-----------|
| catalog | `LanceDBCatalogRepository` | `CatalogRepository` |
| chunks | `LanceDBChunkRepository` | `ChunkRepository` |
| concepts | `LanceDBConceptRepository` | `ConceptRepository` |

### Common Operations

**Document Discovery**:
```typescript
// Search catalog for documents about a topic
const docs = await catalogRepo.search({ text: "microservices", limit: 5 });
```

**Chunk Retrieval**:
```typescript
// Find chunks in a specific document
const chunks = await chunkRepo.findBySource("/path/to/doc.pdf", { limit: 10 });
```

**Concept Lookup**:
```typescript
// Find chunks tagged with a concept
const results = await conceptRepo.findChunksByConcept("API gateway", { limit: 20 });
```

**Category Search** (new):
```typescript
// Find chunks in a semantic category
const results = await chunkRepo.findByCategory("software engineering", 100);
```

---

## Tools and Scripts

### Inspection

```bash
# List all tables
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect('~/.concept_rag');
  console.log(await db.tableNames());
"

# Count rows in a table
npx tsx -e "
  const lancedb = require('@lancedb/lancedb');
  const db = await lancedb.connect('~/.concept_rag');
  const table = await db.openTable('chunks');
  console.log(await table.countRows());
"
```

### Maintenance Scripts

| Script | Purpose |
|--------|---------|
| `hybrid_fast_seed.ts` | Full database rebuild/seeding |
| `scripts/rebuild_concept_index_standalone.ts` | Rebuild concepts table only |
| `scripts/reenrich_chunks_with_concepts.ts` | Re-enrich chunks with updated concepts |
| `scripts/rebuild_indexes.ts` | Rebuild vector indexes |
| `scripts/repair_missing_concepts.ts` | Fix chunks missing concept metadata |

---

## References

### Code Locations

- **Table creation**: `hybrid_fast_seed.ts` lines 977-1087 (`createLanceTableWithSimpleEmbeddings`)
- **Concept table**: `src/concepts/concept_index.ts` lines 204-273 (`createConceptTable`)
- **Schema interfaces**: `src/__tests__/test-helpers/integration-test-data.ts` lines 19-56
- **Validators**: `src/infrastructure/lancedb/utils/schema-validators.ts`
- **Table names**: `src/config.ts` lines 6-8

### Documentation

- Setup guide: `SETUP.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- FAQ: `FAQ.md` section "Technical Details"
- Domain models: `src/domain/models/`






