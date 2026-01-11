# Categories Table Design

**Date**: 2025-11-19  
**Purpose**: Define schema for categories table and relationships  
**Status**: Design specification

## Overview

The `categories` table will be a new first-class table in the LanceDB database, storing unique categories with rich metadata and relationships. This design follows the patterns established in the [integer-id-optimization](../2025-11-19-integer-id-optimization/) work.

## Design Principles

1. **Vector Database Native**: Embedded arrays, not junction tables
2. **Backward Compatible**: Coexist with existing `concept_categories` fields
3. **Data Locality**: Keep category IDs embedded with vectors
4. **Cache-First**: O(1) lookups via CategoryIdCache
5. **Minimal Joins**: Pre-aggregate statistics, avoid query-time joins

## Database Structure

### Updated Table Layout

```
~/.concept_rag/
├── catalog.lance/        # Document summaries (MODIFIED)
│   ├── concept_categories  (OLD: category names)
│   └── category_ids        (NEW: category IDs)
│
├── chunks.lance/         # Text chunks (MODIFIED)
│   ├── concept_categories  (OLD: category names)
│   └── category_ids        (NEW: category IDs)
│
├── concepts.lance/       # Extracted concepts (MODIFIED)
│   ├── category            (OLD: single category name)
│   └── category_id         (NEW: single category ID)
│
└── categories.lance/     # 🆕 NEW: Category definitions
    ├── id
    ├── category
    ├── description
    ├── parent_category_id
    ├── aliases
    ├── document_count
    ├── chunk_count
    ├── concept_count
    └── vector
```

## Categories Table Schema

### Full Schema Definition

| Field | Type | Description | Storage Format | Example |
|-------|------|-------------|----------------|---------|
| `id` | string | Auto-generated category ID | Plain text | "5" |
| `category` | string | Normalized category name | Plain text | "software architecture" |
| `description` | string | What this category encompasses | Plain text | "Patterns and principles for structuring software systems" |
| `parent_category_id` | string | Parent category for hierarchy | Plain text | "3" (→ "software engineering") |
| `aliases` | string | Alternative names | JSON array | ["software design", "system architecture"] |
| `related_categories` | string | Frequently co-occurring category IDs | JSON array | [4829304857, 9283746512] |
| `document_count` | number | Number of documents in this category | Integer | 47 |
| `chunk_count` | number | Number of chunks tagged with this category | Integer | 2,350 |
| `concept_count` | number | Number of concepts in this category | Integer | 156 |
| `vector` | number[] | 384-dimensional embedding | Array of floats | [0.123, -0.456, ...] |

**Fields removed** (not needed for stability):
- ❌ Evolution tracking: `first_seen`, `last_seen`, `rebuild_count`, `peak_*`

**Rationale**:
- Hash-based IDs provide stability without evolution tracking
- Usage statistics kept for efficient category search and sorting
- Statistics precomputed during rebuild (fast queries, no on-demand calculation)

### Example Row

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

### Field Details

#### `id` (Primary Key)
- **Type**: string (numeric)
- **Generation**: Sequential during table creation
- **Stability**: Deterministic based on category name sorting
- **Example**: "0", "1", "2", ...
- **Usage**: Referenced in `category_ids` arrays

#### `category` (Unique Name)
- **Type**: string
- **Normalization**: Lowercase, trimmed
- **Constraints**: Must be unique across table
- **Example**: "software architecture", "machine learning", "web development"
- **Validation**: Non-empty, no leading/trailing spaces

#### `description`
- **Type**: string
- **Purpose**: Human-readable explanation
- **Generation**: AI-generated or manual
- **Example**: "Patterns and principles for structuring software systems"
- **Optional**: Can be empty string initially

#### `parent_category_id`
- **Type**: string (references `categories.id`)
- **Purpose**: Enable category hierarchy
- **Nullable**: Yes (root categories have no parent)
- **Example**: "software architecture" → parent: "software engineering"
- **Validation**: Must reference valid category ID (or null)

**Hierarchy example**:
```
software engineering (id: 3, parent: null)
  ├─ software architecture (id: 5, parent: 3)
  │    ├─ microservices (id: 12, parent: 5)
  │    └─ design patterns (id: 18, parent: 5)
  ├─ web development (id: 8, parent: 3)
  └─ database design (id: 15, parent: 3)
```

#### `aliases`
- **Type**: string (JSON array)
- **Purpose**: Alternative names for same category
- **Example**: `["ML", "machine learning", "statistical learning"]`
- **Usage**: Search by alias, resolve to canonical name
- **Validation**: All aliases must be unique across categories

#### `related_categories`
- **Type**: string (JSON array of category IDs)
- **Purpose**: Co-occurrence relationships
- **Generation**: Calculated from document co-occurrence
- **Example**: `["12", "18", "8"]` (IDs of related categories)
- **Usage**: Category recommendations, related searches

**Calculation logic**:
```typescript
// For each category, find categories that frequently appear together
// Example: "software architecture" often co-occurs with "distributed systems"
const coOccurrence = new Map<string, number>();
for (const doc of documents) {
  const categories = doc.category_ids;
  for (const cat1 of categories) {
    for (const cat2 of categories) {
      if (cat1 !== cat2) {
        coOccurrence.set(`${cat1},${cat2}`, (coOccurrence.get(`${cat1},${cat2}`) || 0) + 1);
      }
    }
  }
}
// Take top 5-10 most frequent co-occurrences
```

#### `document_count`, `chunk_count`, `concept_count`
- **Type**: number (integer)
- **Purpose**: Usage statistics
- **Generation**: Aggregated from references
- **Update**: Recalculated during database rebuild
- **Example**: 
  - `document_count: 47` (47 catalog entries reference this category)
  - `chunk_count: 2350` (2350 chunks reference this category)
  - `concept_count: 156` (156 concepts have this as primary category)

**Calculation**:
```typescript
document_count = COUNT(catalog WHERE category_ids CONTAINS id)
chunk_count = COUNT(chunks WHERE category_ids CONTAINS id)
concept_count = COUNT(concepts WHERE category_id = id)
```

#### `vector`
- **Type**: number[] (384 dimensions)
- **Model**: Xenova/all-MiniLM-L6-v2
- **Purpose**: Semantic similarity search between categories
- **Generation**: Embed category name + description
- **Usage**: Find semantically similar categories, vector-based category suggestions

**Embedding source**:
```typescript
// Combine name and description for rich embedding
const embeddingText = `${category}: ${description}`;
// Example: "software architecture: Patterns and principles for structuring software systems"
const vector = await embedder.embed(embeddingText);
```

## Relationships & Cross-References

### Catalog Table Structure

**Complete catalog entry** (with all new fields):

```typescript
interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  origin_hash: string | null; // Origin hash from ebook metadata
  loc: string;
  vector: number[];
  concept_ids: number[];     // Hash-based concept IDs
  category_ids: number[];    // Hash-based category IDs
  filename_tags: string[];   // Tags extracted from filename
  
  // Bibliographic metadata (reserved for future)
  author: string | null;     // Not populated yet
  year: string | null;       // Not populated yet
  publisher: string | null;  // Not populated yet
  isbn: string | null;       // Not populated yet
}
```

**Filename tags extraction**:
```typescript
// Example filename: "Microservices Patterns -- Software Architecture -- OReilly -- 2019.pdf"
// Extracted name: "Microservices Patterns"
// Extracted tags: ["Software Architecture", "OReilly", "2019"]

function extractFilenameTags(source: string): string[] {
  const filename = path.basename(source, path.extname(source));
  const parts = filename.split('--').map(p => p.trim());
  return parts.slice(1);  // Skip first part (name), return rest as tags
}
```

### Categories ↔ Catalog

**Catalog table changes**:

```typescript
// OLD FORMAT (deprecated, backward compatible)
{
  concept_categories: '["software architecture","distributed systems","cloud computing"]'
}

// NEW FORMAT (optimized)
{
  concept_categories: '["software architecture","distributed systems","cloud computing"]',  // Keep
  category_ids: '["5","12","8"]'  // NEW: References to categories.id
}
```

**Relationship**:
- **Type**: Many-to-many (embedded array, not junction table)
- **Cardinality**: 1 catalog entry → 2-3 categories (typical)
- **Implementation**: `category_ids` JSON array on catalog table
- **Reverse lookup**: `categories.document_count` (pre-aggregated)

**Query patterns**:
```typescript
// Find all documents in category "software architecture" (id: 5)
const docs = await catalogTable
  .where(`array_contains(category_ids, "5")`)
  .toArray();

// Get categories for a document
const categoryIds = JSON.parse(doc.category_ids);
const categories = categoryCache.getNames(categoryIds);
```

### Categories ↔ Chunks

**Chunks table changes**:

```typescript
// OLD FORMAT
{
  concept_categories: '["software architecture","distributed systems"]'
}

// NEW FORMAT
{
  concept_categories: '["software architecture","distributed systems"]',  // Keep
  category_ids: '["5","12"]'  // NEW: References to categories.id
}
```

**Relationship**:
- **Type**: Many-to-many (embedded array)
- **Cardinality**: 1 chunk → 2-3 categories (inherited from parent doc)
- **Implementation**: `category_ids` JSON array on chunks table
- **Reverse lookup**: `categories.chunk_count` (pre-aggregated)

**Query patterns**:
```typescript
// Find all chunks in category "software architecture" (id: 5)
const chunks = await chunksTable
  .where(`array_contains(category_ids, "5")`)
  .toArray();
```

### Categories ↔ Concepts

**Concepts table changes**:

```typescript
// OLD FORMAT (singular string)
{
  category: "software architecture"
}

// NEW FORMAT (singular ID)
{
  category: "software architecture",  // Keep for backward compatibility
  category_id: "5"  // NEW: Reference to categories.id
}
```

**Relationship**:
- **Type**: Many-to-one (each concept has ONE primary category)
- **Cardinality**: Many concepts → 1 category
- **Implementation**: `category_id` (singular) field on concepts table
- **Reverse lookup**: `categories.concept_count` (pre-aggregated)

**Query patterns**:
```typescript
// Find all concepts in category "software architecture" (id: 5)
const concepts = await conceptsTable
  .where('category_id = "5"')
  .toArray();

// Get category for a concept
const categoryName = categoryCache.getName(concept.category_id);
```

**Note**: Concepts use **singular** `category_id`, unlike catalog/chunks which use **plural** `category_ids` arrays.

## Indexing Strategy

### Vector Index

**Type**: IVF_PQ (Inverted File with Product Quantization)

**Configuration**:
```typescript
await categoriesTable.createIndex({
  column: 'vector',
  type: 'ivf_pq',
  num_partitions: 2,  // Small table, few partitions needed
  num_sub_vectors: 8
});
```

**Usage**: Semantic similarity search for category suggestions

**Example query**:
```typescript
// Find categories semantically similar to "microservices"
const similar = await categoriesTable
  .search(microservicesVector)
  .limit(5)
  .toArray();
```

### Potential Additional Indexes

LanceDB doesn't support traditional B-tree indexes, but we can optimize:

1. **Sorted IDs**: Generate IDs in sorted order for binary search
2. **Category name uniqueness**: Validated at insertion time
3. **Parent category references**: Validated during table creation

## Data Generation

### Phase 1: Extract Unique Categories

```typescript
// scripts/generate_categories_table.ts

import { connect } from '@lancedb/lancedb';

async function extractUniqueCategories() {
  const db = await connect('~/.concept_rag');
  
  // Collect from catalog
  const catalogTable = await db.openTable('catalog');
  const catalogRows = await catalogTable.toArray();
  
  const categorySet = new Set<string>();
  for (const row of catalogRows) {
    if (row.concept_categories) {
      const categories = JSON.parse(row.concept_categories);
      categories.forEach(cat => categorySet.add(cat));
    }
  }
  
  // Collect from chunks
  const chunksTable = await db.openTable('chunks');
  const chunkRows = await chunksTable.toArray();
  
  for (const row of chunkRows) {
    if (row.concept_categories) {
      const categories = JSON.parse(row.concept_categories);
      categories.forEach(cat => categorySet.add(cat));
    }
  }
  
  // Collect from concepts
  const conceptsTable = await db.openTable('concepts');
  const conceptRows = await conceptsTable.toArray();
  
  for (const row of conceptRows) {
    if (row.category) {
      categorySet.add(row.category);
    }
  }
  
  return Array.from(categorySet).sort();  // Deterministic order
}
```

### Phase 2: Generate Metadata

```typescript
async function generateCategoryMetadata(uniqueCategories: string[]) {
  const embedder = await createEmbedder();
  const categoryRecords = [];
  
  for (let i = 0; i < uniqueCategories.length; i++) {
    const category = uniqueCategories[i];
    
    // Generate description (AI or predefined)
    const description = await generateCategoryDescription(category);
    
    // Generate embedding
    const embeddingText = `${category}: ${description}`;
    const vector = await embedder.embed(embeddingText);
    
    // Calculate statistics
    const stats = await calculateCategoryStats(category);
    
    // Determine parent category (AI or rule-based)
    const parentCategoryId = await inferParentCategory(category, uniqueCategories);
    
    // Find related categories
    const relatedCategoryIds = await findRelatedCategories(category, stats);
    
    categoryRecords.push({
      id: i.toString(),
      category: category,
      description: description,
      parent_category_id: parentCategoryId,
      aliases: JSON.stringify(await findAliases(category)),
      related_categories: JSON.stringify(relatedCategoryIds),
      document_count: stats.documentCount,
      chunk_count: stats.chunkCount,
      concept_count: stats.conceptCount,
      vector: vector
    });
  }
  
  return categoryRecords;
}
```

### Phase 3: Create Table

```typescript
async function createCategoriesTable(db: Connection) {
  const uniqueCategories = await extractUniqueCategories();
  const categoryRecords = await generateCategoryMetadata(uniqueCategories);
  
  console.log(`Creating categories table with ${categoryRecords.length} categories`);
  
  const table = await db.createTable('categories', categoryRecords, {
    mode: 'overwrite'
  });
  
  // Create vector index
  await table.createIndex({
    column: 'vector',
    type: 'ivf_pq',
    num_partitions: Math.max(2, Math.ceil(categoryRecords.length / 100)),
    num_sub_vectors: 8
  });
  
  return table;
}
```

## Statistics Calculation

### Document Count

```typescript
async function calculateDocumentCount(categoryId: string): Promise<number> {
  const catalogTable = await db.openTable('catalog');
  const rows = await catalogTable.toArray();
  
  let count = 0;
  for (const row of rows) {
    if (row.category_ids) {
      const ids = JSON.parse(row.category_ids);
      if (ids.includes(categoryId)) {
        count++;
      }
    }
  }
  
  return count;
}
```

### Chunk Count

```typescript
async function calculateChunkCount(categoryId: string): Promise<number> {
  const chunksTable = await db.openTable('chunks');
  const rows = await chunksTable.toArray();
  
  let count = 0;
  for (const row of rows) {
    if (row.category_ids) {
      const ids = JSON.parse(row.category_ids);
      if (ids.includes(categoryId)) {
        count++;
      }
    }
  }
  
  return count;
}
```

### Concept Count

```typescript
async function calculateConceptCount(categoryId: string): Promise<number> {
  const conceptsTable = await db.openTable('concepts');
  const rows = await conceptsTable.toArray();
  
  let count = 0;
  for (const row of rows) {
    if (row.category_id === categoryId) {
      count++;
    }
  }
  
  return count;
}
```

## TypeScript Interfaces

### Category Model

**File**: `src/domain/models/category.ts`

```typescript
/**
 * Domain model representing a semantic category.
 * 
 * Categories are first-class entities that classify concepts, documents,
 * and chunks into semantic domains. They support:
 * - Hierarchical organization (parent-child relationships)
 * - Aliases (alternative names)
 * - Usage statistics (document/chunk/concept counts)
 * - Semantic similarity (via vector embeddings)
 * 
 * @example
 * ```typescript
 * const category: Category = {
 *   id: '5',
 *   category: 'software architecture',
 *   description: 'Patterns and principles for structuring software systems',
 *   parentCategoryId: '3',  // → 'software engineering'
 *   aliases: ['software design', 'system architecture'],
 *   relatedCategories: ['distributed systems', 'design patterns'],
 *   documentCount: 47,
 *   chunkCount: 2350,
 *   conceptCount: 156,
 *   embeddings: [0.1, 0.2, ...]
 * };
 * ```
 */
export interface Category {
  /** Unique identifier */
  id: string;
  
  /** Normalized category name (lowercase, trimmed) */
  category: string;
  
  /** Human-readable description of what this category encompasses */
  description: string;
  
  /** Parent category ID for hierarchical organization (null for root categories) */
  parentCategoryId: string | null;
  
  /** Alternative names and aliases for this category */
  aliases: string[];
  
  /** Related category IDs (frequently co-occurring) */
  relatedCategories: string[];
  
  /** Number of catalog entries (documents) in this category */
  documentCount: number;
  
  /** Number of chunks tagged with this category */
  chunkCount: number;
  
  /** Number of concepts classified under this category */
  conceptCount: number;
  
  /** 384-dimensional vector embedding for semantic similarity */
  embeddings: number[];
}
```

### Updated Interfaces

**File**: `src/domain/models/catalog-entry.ts`

```typescript
export interface CatalogEntry {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // Concepts (integer ID optimization)
  concepts: string;  // OLD: backward compat
  concept_ids?: string;  // NEW: integer IDs
  
  // Categories (integer ID optimization) - NEW
  concept_categories: string;  // OLD: category names array
  category_ids?: string;  // NEW: category integer IDs array
}
```

**File**: `src/domain/models/chunk.ts`

```typescript
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  
  // Concepts
  concepts: string;  // OLD
  concept_ids?: string;  // NEW
  
  // Categories - NEW
  concept_categories: string;  // OLD: category names
  category_ids?: string;  // NEW: category IDs
  
  concept_density: number;
}
```

**File**: `src/domain/models/concept.ts`

```typescript
export interface Concept {
  id: string;
  concept: string;
  concept_type: 'thematic' | 'terminology';
  
  // Category (singular) - NEW
  category: string;  // OLD: category name
  category_id?: string;  // NEW: category ID
  
  sources: string[];  // OLD
  catalog_ids?: string;  // NEW
  
  related_concepts: string[];
  synonyms?: string[];
  broader_terms?: string[];
  narrower_terms?: string[];
  weight: number;
  chunk_count?: number;
  enrichment_source: 'corpus' | 'wordnet' | 'hybrid';
  vector: number[];
}
```

## Validation

### Schema Validation

**File**: `src/infrastructure/lancedb/utils/schema-validators.ts`

```typescript
export function validateCategoryRow(row: any): void {
  if (typeof row.id !== 'string') {
    throw new Error('category.id must be string');
  }
  if (typeof row.category !== 'string' || row.category.trim() === '') {
    throw new Error('category.category must be non-empty string');
  }
  if (typeof row.description !== 'string') {
    throw new Error('category.description must be string');
  }
  if (row.parent_category_id !== null && typeof row.parent_category_id !== 'string') {
    throw new Error('category.parent_category_id must be string or null');
  }
  if (typeof row.aliases !== 'string') {
    throw new Error('category.aliases must be JSON string');
  }
  if (typeof row.related_categories !== 'string') {
    throw new Error('category.related_categories must be JSON string');
  }
  if (typeof row.document_count !== 'number') {
    throw new Error('category.document_count must be number');
  }
  if (typeof row.chunk_count !== 'number') {
    throw new Error('category.chunk_count must be number');
  }
  if (typeof row.concept_count !== 'number') {
    throw new Error('category.concept_count must be number');
  }
  if (!Array.isArray(row.vector) || row.vector.length !== 384) {
    throw new Error('category.vector must be array of 384 numbers');
  }
}
```

## Future Enhancements

### Category Hierarchy Queries

```typescript
// Get all child categories
async function getChildCategories(parentId: string): Promise<Category[]> {
  const categories = await categoriesTable.toArray();
  return categories.filter(cat => cat.parent_category_id === parentId);
}

// Get full hierarchy path
async function getCategoryPath(categoryId: string): Promise<string[]> {
  const path = [];
  let currentId = categoryId;
  
  while (currentId) {
    const category = await categoryCache.get(currentId);
    path.unshift(category.category);
    currentId = category.parent_category_id;
  }
  
  return path;
}
```

### Category Recommendations

```typescript
// Suggest categories for new document
async function suggestCategories(documentText: string): Promise<string[]> {
  const vector = await embedder.embed(documentText);
  
  const similar = await categoriesTable
    .search(vector)
    .limit(5)
    .toArray();
  
  return similar.map(cat => cat.category);
}
```

## Summary

This schema design provides:

✅ **First-class categories** with rich metadata  
✅ **Integer ID optimization** (80% storage savings)  
✅ **Hierarchical organization** via parent_category_id  
✅ **Usage statistics** (document/chunk/concept counts)  
✅ **Semantic search** via vector embeddings  
✅ **Backward compatibility** with existing fields  
✅ **Efficient queries** via embedded arrays (LanceDB-optimized)  

**Next**: Review [03-category-id-cache-design.md](./03-category-id-cache-design.md) for cache implementation details.

---

**Status**: Design complete  
**Date**: 2025-11-19

