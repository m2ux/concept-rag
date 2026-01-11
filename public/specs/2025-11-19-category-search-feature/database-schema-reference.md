# Database Schema Reference (With Categories Table)

**Last Updated**: 2025-11-19  
**Status**: Design specification for category feature  
**Version**: Enhanced schema with categories as first-class entities

## Overview

Concept-RAG uses **LanceDB** with four main tables stored as Apache Arrow columnar files:

```
~/.concept_rag/
├── catalog.lance/        # Document summaries and metadata
├── chunks.lance/         # Text chunks with concept tags
├── concepts.lance/       # Extracted concepts with relationships
└── categories.lance/     # 🆕 Category definitions and metadata
```

## 🆕 Categories Feature (2025-11-19)

The schema now supports **categories as first-class entities** with hash-based stable IDs:

- **New table**: `categories.lance/` stores category definitions
- **Document categories**: Categories stored on catalog and chunks tables (documents own categories)
- **Concept independence**: Concepts have NO categories (cross-domain entities)
- **Hash-based IDs**: Content hashes for perfect stability (same name → same ID forever)
- **Pure integer IDs**: Native integers in JSON (not strings) for maximum efficiency
- **Storage reduction**: 80%+ reduction (names → hash IDs)
- **Performance improvement**: 2-3x faster category filtering, 5-10% faster ID operations
- **Rich metadata**: Descriptions, hierarchy, aliases, statistics
- **Backward compatible**: Old and new formats coexist

### Key Changes

1. **New table added**: `categories` with full metadata and hash-based IDs
2. **Catalog & Chunks**: `category_ids` field added (hash-based integers, stored directly)
3. **Concepts**: NO category field (concepts are category-agnostic)
4. **Cache**: CategoryIdCache provides O(1) ID ↔ name lookups
5. **Hash stability**: All IDs generated from content hashes (deterministic, stable)
6. **Integer IDs**: All ID arrays use native integers: `[42,73,156]` not `["42","73","156"]`

---

## Table Definitions

### 1. Catalog Table

**Purpose**: Document-level summaries, metadata, and concept/category overviews

**Table Name**: `catalog` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | string | Auto-generated record ID | Plain text |
| `text` | string | Document summary (enriched with concepts) | Plain text |
| `source` | string | Full file path to document | Plain text |
| `hash` | string | Content hash for deduplication | Plain text |
| `origin_hash` | string | Origin hash from ebook metadata (publisher/source identifier) | Plain text |
| `loc` | string | Location metadata (page numbers, etc.) | JSON stringified |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |
| `concept_ids` | string | Concept integer IDs (native integers in JSON) | JSON stringified array |
| `category_ids` | string | Category integer IDs (native integers in JSON) | JSON stringified array |
| `filename_tags` | string | Tags extracted from filename (after first '--' delimiter) | JSON stringified array |
| `author` | string | Document author (not populated yet, reserved for future) | Plain text |
| `year` | string | Publication year (not populated yet, reserved for future) | Plain text |
| `publisher` | string | Publisher name (not populated yet, reserved for future) | Plain text |
| `isbn` | string | ISBN identifier (not populated yet, reserved for future) | Plain text |

**Note**: Deprecated fields (`concepts`, `concept_categories`) **removed from new schema**. Categories stored as hash-based integer IDs.

**Future metadata fields**: `author`, `year`, `publisher`, `isbn` are placeholders for future metadata extraction/enrichment. Currently unpopulated (null/empty).

**Future use cases**:
- Filter by author: "Find all books by Martin Fowler"
- Filter by year: "Show recent publications (2020-2025)"
- Filter by publisher: "Browse OReilly books"
- ISBN lookup: Direct book identification
- Bibliography generation: Export citations
- Duplicate detection: Identify same book from different sources

**New field**: `filename_tags` extracts metadata tags from filename structure.

**Filename Tag Extraction**:

Many documents use `--` delimited filenames for organization:
```
"Algorithm Design -- Computer Science -- Textbook -- 2020.pdf"
```

**Parsing logic**:
```typescript
function extractFilenameTags(source: string): string[] {
  const filename = path.basename(source, path.extname(source));
  const parts = filename.split('--').map(p => p.trim());
  
  // First part is the name, rest are tags
  return parts.slice(1);  // ["Computer Science", "Textbook", "2020"]
}
```

**Use cases**:
- Filter by tag: "Show me all textbooks"
- Browse by year: "Find documents from 2020"
- Subject filtering: "Computer Science" tagged documents
- Metadata enrichment without parsing content

**Field Evolution**:

```typescript
// OLD FORMAT (pre-migration)
{
  concepts: '["microservices","API gateway","service mesh"]',
  concept_categories: '["software architecture","distributed systems","cloud computing"]'
  // ~130 bytes total
}

// NEW FORMAT (clean schema - hash-based IDs + filename tags)
{
  concept_ids: '[3842615478,1829374562,4920581736]',  // Hash-based integers, ~30 bytes
  category_ids: '[7362849501,4829304857]',  // Hash-based integers, ~20 bytes
  filename_tags: '["Software Architecture","OReilly","2019"]'  // NEW: ~30 bytes
  // Total: ~80 bytes vs ~130 bytes = 38% reduction
}
```

**Example Row (New Schema)**:

```typescript
{
  id: "0",
  text: "This book covers microservice architecture patterns including...\n\nKey Concepts: service mesh, API gateway, event sourcing\nCategories: software engineering, distributed systems",
  source: "/home/user/books/Microservices Patterns -- Software Architecture -- OReilly -- 2019.pdf",
  hash: "abc123def456",
  origin_hash: null,  // Reserved for ebook origin metadata
  loc: '{"lines":{"from":1,"to":350}}',
  vector: [0.123, -0.456, 0.789, ...], // 384 dimensions
  
  // Concepts (hash-based IDs)
  concept_ids: '[3842615478,1829374562,4920581736]',  // hash("API gateway"), hash("microservices"), hash("service mesh")
  
  // Categories (STORED on document, hash-based IDs)
  category_ids: '[7362849501,4829304857]',  // hash("software engineering"), hash("distributed systems")
  
  // Filename tags (extracted from filename structure)
  filename_tags: '["Software Architecture","OReilly","2019"]',  // Everything after first '--'
  
  // Bibliographic metadata (reserved for future population)
  author: null,      // To be populated later
  year: null,        // To be populated later
  publisher: null,   // To be populated later
  isbn: null         // To be populated later
}
```

**Typical Size**: 1 entry per document (~100-1000 entries for typical library)

---

### Filename Tags Feature

**Purpose**: Extract and store metadata tags embedded in document filenames

Many users organize documents with structured filenames:
```
"Book Name -- Topic -- Publisher -- Year.pdf"
"Algorithm Design -- Computer Science -- Textbook -- MIT -- 2023.epub"
"Microservices Patterns -- Software Architecture -- OReilly -- 2019.pdf"
```

**Extraction Logic**:

```typescript
function extractFilenameTags(source: string): string[] {
  // Get filename without path and extension
  const filename = path.basename(source, path.extname(source));
  
  // Split by '--' delimiter
  const parts = filename.split('--').map(part => part.trim());
  
  // First part is the name, rest are tags
  if (parts.length <= 1) {
    return [];  // No tags present
  }
  
  return parts.slice(1);
}
```

**Examples**:

| Filename | Extracted Tags |
|----------|----------------|
| `"Book Title.pdf"` | `[]` (no tags) |
| `"Book -- Topic.pdf"` | `["Topic"]` |
| `"Book -- Topic -- Author -- Year.pdf"` | `["Topic", "Author", "Year"]` |
| `"Algorithm Design -- CS -- Textbook -- 2023.epub"` | `["CS", "Textbook", "2023"]` |

**Storage**:
```typescript
{
  source: "/books/Microservices Patterns -- Software Architecture -- OReilly -- 2019.pdf",
  filename_tags: '["Software Architecture","OReilly","2019"]'  // JSON array
}
```

**Use Cases**:

1. **Filter by publisher**: Find all "OReilly" books
   ```typescript
   catalogTable.filter(doc => {
     const tags = JSON.parse(doc.filename_tags || '[]');
     return tags.includes("OReilly");
   });
   ```

2. **Filter by year**: Find documents from 2023
   ```typescript
   catalogTable.filter(doc => {
     const tags = JSON.parse(doc.filename_tags || '[]');
     return tags.includes("2023");
   });
   ```

3. **Filter by subject tags**: Find "Textbook" materials
   ```typescript
   catalogTable.filter(doc => {
     const tags = JSON.parse(doc.filename_tags || '[]');
     return tags.includes("Textbook");
   });
   ```

4. **Tag statistics**: Most common publishers, years, topics
   ```typescript
   const allTags = documents.flatMap(doc => 
     JSON.parse(doc.filename_tags || '[]')
   );
   const tagCounts = countOccurrences(allTags);
   ```

**Benefits**:
- ✅ Leverages existing user organization patterns
- ✅ No additional AI processing needed
- ✅ Lightweight (typically 2-4 tags per document)
- ✅ Fast filtering (simple string matching)
- ✅ Complements AI-extracted categories

**Typical tags**:
- Publishers: "OReilly", "Manning", "Packt"
- Document type: "Textbook", "Reference", "Tutorial"
- Year: "2020", "2023"
- Subject area: "Computer Science", "Healthcare"
- Series: "In Action", "Cookbook"

---

### 2. Chunks Table

**Purpose**: Text segments extracted from documents, enriched with concept and category metadata

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
| `concept_ids` | string | Concept integer IDs (native integers in JSON) | JSON stringified array |
| `category_ids` | string | Category integer IDs (native integers in JSON, inherited from parent) | JSON stringified array |
| `concept_density` | number | Density of concepts (0-1) | Float |

**Note**: Deprecated fields (`concepts`, `concept_categories`) **removed from new schema**. Categories stored as hash-based integer IDs, inherited from parent document.

**Field Evolution**:

```typescript
// OLD FORMAT (pre-migration)
{
  concepts: '["API gateway","microservices","request routing"]',
  concept_categories: '["software engineering","distributed systems"]'
  // ~100 bytes total
}

// NEW FORMAT (clean schema - hash-based IDs)
{
  concept_ids: '[3842615478,1829374562,4920581736]',  // Hash-based integers, ~30 bytes
  category_ids: '[7362849501,4829304857]'  // Hash-based integers (inherited from parent doc), ~20 bytes
  // Total: ~50 bytes vs ~100 bytes = 50% reduction
}
```

**Example Row (New Schema)**:

```typescript
{
  id: "42",
  text: "The API Gateway pattern provides a single entry point for clients to access microservices. It handles request routing, composition, and protocol translation.",
  source: "/home/user/books/Microservices Patterns.pdf",
  hash: "def789ghi012",
  loc: '{"lines":{"from":145,"to":150}}',
  vector: [0.234, -0.567, 0.890, ...], // 384 dimensions
  
  // Concepts (hash-based IDs)
  concept_ids: '[3842615478,1829374562,4920581736,8273645091]',  // Native integers
  
  // Categories (INHERITED from parent document)
  category_ids: '[7362849501,4829304857]',  // hash("software engineering"), hash("distributed systems")
  // Inherited from parent catalog entry - same categories as document
  
  concept_density: 0.15
}
```

---

### 3. Concepts Table

**Purpose**: Unique concepts extracted across all documents with relationships and statistics

**Table Name**: `concepts` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | number | Hash-based concept ID (stable across rebuilds) | Integer |
| `concept` | string | The concept name (normalized) | Plain text |
| `concept_type` | string | Type: "thematic" or "terminology" | Plain text |
| `catalog_ids` | string | Catalog entry IDs (native integers in JSON) | JSON stringified array |
| `related_concepts` | string | Co-occurring concepts | JSON stringified array |
| `synonyms` | string | WordNet synonyms | JSON stringified array |
| `broader_terms` | string | WordNet hypernyms (broader concepts) | JSON stringified array |
| `narrower_terms` | string | WordNet hyponyms (narrower concepts) | JSON stringified array |
| `weight` | number | Importance weight (based on frequency) | Float |
| `chunk_count` | number | Number of chunks containing this concept | Integer |
| `enrichment_source` | string | Source: "corpus", "wordnet", or "hybrid" | Plain text |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |

**Note**: Deprecated fields (`category` string, `sources` paths) **removed from new schema**. Concepts have NO categories (category-agnostic). Only hash-based integer IDs used.

**Field Evolution**:

```typescript
// OLD FORMAT (pre-migration)
{
  id: "42",  // Sequential ID (unstable)
  category: "software architecture",  // STRING (~23 bytes) - INCORRECT MODEL
  sources: '["/home/user/books/Microservices.pdf","/home/user/books/Cloud.pdf"]'  // ~80 bytes
  // Total: ~103 bytes
}

// NEW FORMAT (clean schema - hash-based IDs, no categories)
{
  id: 3842615478,  // Hash-based ID (stable), ~10 digits
  catalog_ids: '[4920581736,8473625190]'  // Hash-based integers, ~20 bytes
  // Total: ~20 bytes vs ~103 bytes = 81% reduction
  // NO category field - concepts are cross-domain!
}
```

**Example Row (New Schema)**:

```typescript
{
  id: 3842615478,  // hash("API gateway") - STABLE
  concept: "API gateway",
  concept_type: "thematic",
  
  // NO category field - concepts are category-agnostic!
  // This concept can appear in documents of any category:
  // - Software engineering
  // - Cloud computing
  // - DevOps
  // - Enterprise architecture
  
  // Source documents (hash-based IDs)
  catalog_ids: '[4920581736,8473625190,1928374651]',  // 3 documents across potentially different categories
  
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

---

### 4. Categories Table 🆕

**Purpose**: Category definitions with metadata, hierarchy, and usage statistics

**Table Name**: `categories` (defined in `src/config.ts`)

**Schema**:

| Field | Type | Description | Storage Format |
|-------|------|-------------|----------------|
| `id` | string | Auto-generated category ID | Plain text |
| `category` | string | Normalized category name (unique) | Plain text |
| `description` | string | Human-readable explanation | Plain text |
| `parent_category_id` | string | Parent category for hierarchy (nullable) | Plain text |
| `aliases` | string | Alternative names | JSON stringified array |
| `related_categories` | string | Frequently co-occurring category IDs | JSON stringified array |
| `document_count` | number | Number of documents in this category | Integer |
| `chunk_count` | number | Number of chunks tagged with this category | Integer |
| `concept_count` | number | Number of concepts in this category | Integer |
| `vector` | number[] | 384-dimensional embedding vector | Array of floats |

**Note**: Evolution tracking fields (first_seen, last_seen) **not included** - hash-based IDs provide stability without needing lifecycle metrics.

**Example Row**:

```typescript
{
  id: 1829374562,  // hash("software architecture")
  category: "software architecture",
  description: "Patterns, principles, and practices for designing and structuring software systems at scale",
  parent_category_id: 7362849501,  // hash("software engineering")
  aliases: '["software design","system architecture","architectural patterns"]',
  related_categories: '[4829304857,9283746512,8473625190]',  // Hashes of related categories
  document_count: 47,
  chunk_count: 2350,
  concept_count: 156,
  vector: [0.234, -0.567, 0.890, ...] // 384 dimensions
}
```

**Typical Size**: 15-50 categories for typical library (~3-20 KB total)

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
// In database (storage)
category_ids: '["5","12","8"]'
aliases: '["software design","system architecture"]'

// After parsing (in application code)
category_ids: ["5", "12", "8"]
aliases: ["software design", "system architecture"]
```

---

## 🆕 Integer ID Infrastructure

### CategoryIdCache

**Purpose**: In-memory O(1) bidirectional mapping between category IDs, names, metadata, and reverse index

**Location**: `src/infrastructure/cache/category-id-cache.ts`

**Initialization**: Automatic during application startup (loads categories + builds concept index)

**Performance**:
- Lookup: O(1) hash map operations
- Memory: ~300 bytes per category + reverse index (~20 KB for 50 categories with 10K concepts)
- Initialization: ~30-60ms for 50 categories + 10K concepts

**Features**:
- ID ↔ name resolution (with native integers)
- Alias resolution (e.g., "ML" → "machine learning")
- Metadata access (descriptions, statistics)
- Hierarchy traversal
- Search and filtering

**Usage Example**:

```typescript
import { CategoryIdCache } from './infrastructure/cache/category-id-cache';

// Automatic initialization in container
const cache = CategoryIdCache.getInstance();

// Basic lookups (returns/accepts native integers)
const id = cache.getId("software architecture");  // 5 (number)
const name = cache.getName(5);  // "software architecture"

// Alias resolution
const id = cache.getIdByAlias("ML");  // 15 (machine learning)

// Metadata access
const desc = cache.getDescription(5);  // "Patterns and principles..."
const stats = cache.getStatistics(5);  // { documentCount: 47, ... }

// Batch operations (integers)
const names = cache.getNames([5, 12, 8]);  
// ["software architecture", "distributed systems", "cloud computing"]

// Hierarchy
const children = cache.getChildren(3);  // [5, 8, 15] (child category IDs)
const path = cache.getHierarchyPathNames(5);  
// ["software engineering", "software architecture"]
```

### Repository Integration

Repositories automatically resolve category IDs to names:

```typescript
// In LanceDBCatalogRepository.getCategoryNames()
if (entry.category_ids) {
  // NEW FORMAT: Resolve IDs to names via cache
  const categoryIds = JSON.parse(entry.category_ids);
  categories = this.categoryIdCache.getNames(categoryIds);
} else {
  // OLD FORMAT: Use names directly
  categories = JSON.parse(entry.concept_categories);
}
```

This ensures **transparent backward compatibility** - application code receives category names regardless of storage format.

---

## Table Relationships

```
Document (PDF/EPUB)
    ↓
    ├─→ Catalog Entry (1 per document)
    │     - Summary
    │     - Concepts (via concept_ids)
    │     - Categories (via category_ids) 🆕
    │
    ├─→ Chunks (10-50 per document)
    │     - Text segments
    │     - Concept tags (via concept_ids)
    │     - Categories (via category_ids) 🆕
    │
    ├─→ Concepts (extracted and indexed)
    │     - Unique concepts
    │     - Category (via category_id) 🆕
    │     - Relationships
    │
    └─→ Categories (semantic domains) 🆕
          - Category definitions
          - Hierarchy
          - Statistics
```

### Linking Fields

**Catalog ↔ Categories** (DIRECT STORAGE):
- **Link**: `catalog.category_ids` → `categories.id`
- **Type**: Many-to-many (stored as embedded array)
- **Cardinality**: 1 catalog entry → 2-3 categories (typical)
- **Storage**: Hash-based integer IDs array on catalog table
- **Reverse**: `categories.document_count` (pre-aggregated during rebuild)

**Chunks ↔ Categories** (INHERITED):
- **Link**: `chunks.category_ids` → `categories.id`
- **Type**: Many-to-many (copied from parent document)
- **Cardinality**: 1 chunk → 2-3 categories (same as parent)
- **Storage**: Hash-based integer IDs array (copied from catalog entry)
- **Reverse**: `categories.chunk_count` (pre-aggregated during rebuild)

**Concepts ↔ Categories** (NONE):
- **Link**: No direct relationship
- **Concepts are category-agnostic**: Can appear in documents of any category
- **Example**: Concept "optimization" appears in software, healthcare, business, ML documents
- **Reverse**: `categories.concept_count` = unique concepts mentioned in category's documents

**Category Hierarchy** (SELF-REFERENTIAL):
- **Link**: `categories.parent_category_id` → `categories.id`
- **Type**: Self-referential (tree structure)
- **Nullable**: Yes (root categories have no parent)

---

## Indexing Strategy

### Vector Indexes

All tables use **IVF_PQ** (Inverted File with Product Quantization) indexes on the `vector` field:

| Table | Typical Size | Partitions | Notes |
|-------|--------------|------------|-------|
| Catalog | 10-1000 | 2-10 | Small, few partitions |
| Chunks | 1K-100K | 8-256 | Large, many partitions |
| Concepts | 1K-20K | 8-64 | Medium |
| **Categories** 🆕 | **10-200** | **2-4** | **Very small** |

---

## Storage Format & Size Estimates

### Apache Arrow

- **Format**: Columnar storage (efficient for analytics)
- **Compression**: Built-in Arrow compression
- **Benefits**: Fast scans, efficient memory, zero-copy reads

### Size Estimates (With Category Optimization)

| Library Size | Catalog | Chunks | Concepts | Categories 🆕 | Total (Old) | Total (New) | Savings |
|--------------|---------|--------|----------|---------------|-------------|-------------|---------|
| 10 docs | ~1 MB | ~4 MB | ~5 MB | ~3 KB | ~10 MB | ~7.3 MB | **27%** |
| 100 docs | ~10 MB | ~40 MB | ~50 MB | ~15 KB | ~100 MB | ~70 MB | **30%** |
| 1000 docs | ~100 MB | ~400 MB | ~500 MB | ~60 KB | ~1 GB | ~700 MB | **30%** |

**Category-Specific Savings**:
- Catalog: Categories **removed** (derived from concepts) = **100% reduction**
- Chunks: Categories **removed** (derived from concepts) = **100% reduction**
- Concepts `category_id`: Native integer vs string = **~96% reduction** (1 byte vs ~23 bytes)
- Concept/catalog IDs: Native integers vs strings = **35% reduction** per array
- Overall category storage: **~95% reduction** (removed from catalog/chunks, minimal on concepts)

---

## Access Patterns

### By Repository

| Table | Repository | Interface |
|-------|-----------|-----------|
| catalog | `LanceDBCatalogRepository` | `CatalogRepository` |
| chunks | `LanceDBChunkRepository` | `ChunkRepository` |
| concepts | `LanceDBConceptRepository` | `ConceptRepository` |
| **categories** 🆕 | **`LanceDBCategoryRepository`** | **`CategoryRepository`** |

### Common Operations

**Category Search** 🆕:
```typescript
// Find all documents in a category (direct query)
const docs = await catalogRepo.findByCategory(7362849501);  // software engineering (hash ID)
// Direct filter: WHERE category_ids contains 7362849501
// Simple and fast - no concept mediation!

// Find concepts in a category (query through documents)
const conceptIds = await catalogRepo.getConceptsInCategory(7362849501);
// 1. Find docs with this category
// 2. Collect unique concept IDs from those docs
// Performance: ~30-130ms (acceptable)

// Find all documents with a concept (cross-category search)
const docs = await catalogRepo.findByConcept(3842615478);  // "API gateway"
// Returns documents from ANY category that mention this concept
// Shows concept's reach across domains

// Get category metadata
const category = await categoryRepo.findById(7362849501);
const stats = categoryCache.getStatistics(7362849501);

// Get categories for a document (already stored)
const categoryIds: number[] = JSON.parse(doc.category_ids);
const categoryNames = categoryCache.getNames(categoryIds);
// Direct read - no computation needed!
```

**List Categories** 🆕:
```typescript
// Get all categories
const categories = await categoryRepo.findAll();

// Get top categories
const topCategories = categoryCache.getTopCategories(10);

// Search categories
const matches = categoryCache.searchByName("software");
```

---

## Performance Characteristics

### Query Performance (With Category Optimization)

| Operation | Old Format | New Format | Improvement |
|-----------|------------|------------|-------------|
| Category filtering | Slow (string match) | Fast (integer ==) | **2-3x faster** |
| Category name display | Instant (embedded) | Instant (cache O(1)) | No change |
| List all categories | Must scan all docs | Query categories table | **10x+ faster** |
| Category statistics | Must aggregate | Precomputed | **Instant** |

---

## Schema Evolution

### Current Version (2025-11-19)

**Status**: Categories feature design complete  
**Migration Type**: Clean rebuild (not in-place)  
**Deprecated Fields**: Removed from new schema

### Approach to Backward Compatibility

Since this migration performs a **complete database rebuild** (not in-place update):

**New Schema** (After Phase 7):
- **Deprecated fields removed** from storage (`concepts`, `concept_categories`, `category`, `sources`)
- Only optimized fields in database (`concept_ids`, `category_id`, `catalog_ids`)
- Maximum storage efficiency
- Clean schema with no redundancy

**Reading Old Databases**:
- TypeScript interfaces keep deprecated fields as **optional** (type safety)
- Repositories check field existence before reading
- Can read pre-migration backups if restored
- Graceful fallback to old format if present

**Repository Pattern** (Handles Both):
```typescript
// Example: Reading concepts from catalog entry
if (entry.concept_ids) {
  // NEW: Resolve integer IDs to names
  return conceptCache.getNames(JSON.parse(entry.concept_ids));
} else if (entry.concepts) {
  // OLD: Use names directly (fallback)
  return JSON.parse(entry.concepts);
}
```

**Migration Strategy**:
- Clean rebuild, not gradual transition
- Backup available for rollback
- TypeScript types support both formats
- No data loss risk

---

## Tools and Scripts

### Category Management

```bash
# Extract categories from existing database
npx tsx scripts/extract_categories.ts

# Create categories table
npx tsx scripts/create_categories_table.ts

# Validate category migration
npx tsx scripts/validate_category_migration.ts

# Check category statistics
npx tsx -e "
  const { CategoryIdCache } = await import('./dist/infrastructure/cache/category-id-cache.js');
  const cache = CategoryIdCache.getInstance();
  if (cache.isInitialized()) {
    const stats = cache.getStats();
    console.log('Categories cached:', stats.categoryCount);
  }
"
```

---

## Summary of Category Feature

### What Changed

1. **New Table**: `categories` with rich metadata and hierarchy
2. **New Fields**: `category_ids` stored on catalog and chunks (hash-based integers)
3. **Concepts**: NO category field (concepts are category-agnostic, cross-domain)
4. **Infrastructure**: CategoryIdCache for fast ID ↔ name lookups
5. **Hash-based IDs**: All IDs generated from content hashes (perfect stability)
6. **Tools**: `category_search` and `list_categories` MCP tools

### What Didn't Change

- **Vector search**: Same ANN algorithm and performance
- **Concept extraction**: Concepts extracted as before (no categories on concepts)
- **Document categorization**: Already extracted at document level
- **Data locality**: Metadata still embedded with vectors
- **Backward compatibility**: Old databases still work via repository fallback

### Expected Impact

- **Storage**: 50-60% reduction in category field sizes (hash IDs vs names)
- **Stability**: Perfect ID stability across rebuilds (hash-based)
- **Performance**: 2-3x faster category filtering (integer comparisons)
- **Features**: Category search, hierarchy, aliases, rich metadata
- **Usability**: Browse by category, cross-domain concept search
- **Simplicity**: Direct category queries (no derivation logic)

---

**Last Updated**: 2025-11-19  
**Implementation Status**: Design complete, ready for implementation  
**Migration Status**: Not yet migrated (backward compatible design)

