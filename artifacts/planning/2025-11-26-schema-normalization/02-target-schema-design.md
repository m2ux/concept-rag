# Target Schema Design: Normalized Structure

**Date**: 2025-11-26  
**Status**: Proposed

## Design Goals

1. **Single source of truth** - Each piece of data stored once
2. **ID-based references** - All cross-references use hash-based integer IDs
3. **No dead code** - Remove fields that are never used
4. **Derivable data not stored** - Related concepts computed at query time

---

## Target Schema

### 1. Catalog Table

```typescript
interface CatalogEntry {
  // Identity
  id: number;                      // Hash of filename (FNV-1a)
  filename: string;                // Filename slug (e.g., "clean-architecture.pdf")
  hash: string;                    // Content hash (deduplication)
  
  // Content
  text: string;                    // LLM-generated summary
  vector: Float32Array;            // 384-dim embedding of summary
  
  // Relationships (ID-based only)
  category_ids: number[];          // Categories (hash-based IDs)
  // NOTE: concept_ids NOT stored - derived from chunks
  
  // Reserved for future use
  title?: string;                  // Document title (extracted or from metadata)
  author?: string;
  year?: string;
  publisher?: string;
  isbn?: string;
}
```

**Removed Fields:**
- ~~`concepts`~~ - JSON blob, redundant
- ~~`concept_categories`~~ - String array replaced by `category_ids`
- ~~`concept_ids`~~ - Derivable from union of chunk concept_ids
- ~~`filename_tags`~~ - Not needed

**Renamed Fields:**
- `source` → `filename` - Renamed and changed from full path to filename slug (e.g., `"clean-architecture.pdf"` instead of `"/home/user/docs/clean-architecture.pdf"`)

**Additional Removals:**
- ~~`loc`~~ - Not meaningful for document-level entries (only useful for chunks)

**Benefits of filename slug:**
- Portable across machines (no absolute paths)
- Shorter strings = less storage
- Cleaner display in results
- Hash ID based on slug ensures stability

**Derived Data:**
```typescript
// Get document concepts by aggregating from chunks
async function getDocumentConcepts(source: string): Promise<number[]> {
  const chunks = await chunksTable.query()
    .where(`source = '${source}'`)
    .select(['concept_ids'])
    .toArray();
  
  const conceptIds = new Set<number>();
  chunks.forEach(c => c.concept_ids?.forEach(id => conceptIds.add(id)));
  return Array.from(conceptIds);
}
```

**Type Changes:**
- `id`: string → number (hash-based)
- `concept_ids`: string (JSON) → number[] (native array)
- `category_ids`: string (JSON) → number[] (native array)

### 2. Chunks Table

```typescript
interface Chunk {
  // Identity
  id: string;                      // Auto-generated chunk ID
  catalog_id: number;              // Parent document ID (matches catalog.id)
  hash: string;                    // Chunk content hash
  
  // Content
  text: string;                    // Chunk text (100-500 words)
  vector: Float32Array;            // 384-dim embedding
  
  // Relationships (ID-based only)
  concept_ids: number[];           // Concepts in this chunk
  category_ids: number[];          // Inherited from parent document
  
  // Metadata
  loc: string;                     // JSON location (page, offset)
  // concept_density: REMOVED - compute on demand
}
```

**Computing concept_density on demand:**
```typescript
function computeConceptDensity(chunk: Chunk): number {
  const wordCount = chunk.text.split(/\s+/).length;
  const conceptCount = chunk.concept_ids?.length || 0;
  return wordCount > 0 ? conceptCount / wordCount : 0;
}
```

**Removed Fields:**
- ~~`concepts`~~ - String array replaced by `concept_ids`
- ~~`concept_categories`~~ - String array replaced by `category_ids`

### 3. Concepts Table

```typescript
interface Concept {
  // Identity
  id: number;                      // Hash of concept name (FNV-1a)
  concept: string;                 // Concept name (unique)
  
  // Relationships (ID-based only)
  catalog_ids: number[];           // Documents containing this concept
  
  // Relationships
  related_concept_ids: number[];   // Related concepts (from corpus co-occurrence)
  
  // Semantic enrichment (from WordNet - text, may not exist in corpus)
  synonyms: string[];              // WordNet synonyms
  broader_terms: string[];         // WordNet hypernyms
  narrower_terms: string[];        // WordNet hyponyms
  
  // Statistics
  weight: number;                  // Importance (0-1)
  // chunk_count: REMOVED - compute on demand
  // enrichment_source: REMOVED - debugging metadata, not used
  
  // Vector
  vector: Float32Array;            // 384-dim concept embedding
}
```

**Computing chunk_count on demand:**
```typescript
async function getConceptChunkCount(conceptId: number): Promise<number> {
  return await chunksTable.query()
    .where(`array_contains(concept_ids, ${conceptId})`)
    .count();
}
```

**Removed Fields:**
- ~~`sources`~~ - String array replaced by `catalog_ids`
- ~~`category`~~ - Concepts are category-agnostic
- ~~`concept_type`~~ - Always 'thematic', distinction not implemented

**Note on `concept_type` removal:**

The thematic/terminology distinction was never implemented. Options:

1. **Remove entirely** (recommended) - Simplify schema
2. **Implement properly** - Would require:
   - Processing `technical_terms` in concept extraction
   - Different query expansion behavior
   - Additional storage for type field
   
Decision: **Remove** - The distinction adds complexity without proven value.

### 4. Categories Table

```typescript
interface Category {
  // Identity
  id: number;                      // Hash of category name
  category: string;                // Category name
  
  // Metadata
  description: string;             // Human-readable description
  parent_category_id: number | null; // Hierarchy support
  aliases: string[];               // Alternative names
  related_categories: number[];    // Co-occurring categories
  
  // Statistics
  document_count: number;          // Documents in category
  chunk_count: number;             // Chunks in category
  concept_count: number;           // Unique concepts (computed)
  
  // Vector
  vector: Float32Array;            // 384-dim category embedding
}
```

**No changes** - Categories table is already normalized.

---

## Schema Comparison

### Catalog: Before vs After

| Field | Before | After | Change |
|-------|--------|-------|--------|
| `id` | string | number | Type change |
| `text` | string | string | No change |
| `source` | string (full path) | `filename` string | **RENAMED** + changed to slug |
| `hash` | string | string | No change |
| `loc` | string | string | No change |
| `vector` | Float32Array | Float32Array | No change |
| `concepts` | string (JSON blob) | - | **REMOVED** |
| `concept_ids` | string (JSON) | - | **REMOVED** (derive from chunks) |
| `concept_categories` | string (JSON) | - | **REMOVED** |
| `category_ids` | string (JSON) | number[] | Type change |
| `filename_tags` | string | - | **REMOVED** |
| `title` | - | string | **ADDED** (reserved) |
| Reserved fields | string | string | No change |

### Chunks: Before vs After

| Field | Before | After | Change |
|-------|--------|-------|--------|
| `id` | string | string | No change |
| `text` | string | string | No change |
| `source` | string (full path) | `catalog_id` number | **RENAMED** to ID reference |
| `hash` | string | string | No change |
| `loc` | string | string | No change |
| `vector` | Float32Array | Float32Array | No change |
| `concepts` | string (JSON) | - | **REMOVED** |
| `concept_ids` | string (JSON) | number[] | Type change |
| `concept_categories` | string (JSON) | - | **REMOVED** |
| `category_ids` | string (JSON) | number[] | Type change |
| `concept_density` | number | - | **REMOVED** (compute on demand) |

### Concepts: Before vs After

| Field | Before | After | Change |
|-------|--------|-------|--------|
| `id` | number | number | No change |
| `concept` | string | string | No change |
| `concept_type` | string | - | **REMOVED** |
| `category` | string | - | **REMOVED** |
| `sources` | string (JSON) | - | **REMOVED** |
| `catalog_ids` | string (JSON) | number[] | Type change |
| `related_concepts` | string (JSON) | `related_concept_ids` number[] | **RENAMED** to ID-based |
| `synonyms` | string (JSON) | string[] | Type change |
| `broader_terms` | string (JSON) | string[] | Type change |
| `narrower_terms` | string (JSON) | string[] | Type change |
| `weight` | number | number | No change |
| `chunk_count` | number | - | **REMOVED** (compute on demand) |
| `enrichment_source` | string | - | **REMOVED** (unused metadata) |
| `vector` | Float32Array | Float32Array | No change |

---

## Data Flow Changes

### Current Flow (With Redundancy)

```
LLM Extraction
     │
     ▼
┌─────────────────────────────────────┐
│ { primary_concepts, technical_terms,│
│   categories, related_concepts }    │
└─────────────────────────────────────┘
     │
     ├──► concepts (JSON blob) ──► catalog table
     ├──► concept_ids ──────────► catalog table  ← DUPLICATE
     ├──► concept_categories ───► catalog table
     └──► category_ids ─────────► catalog table  ← DUPLICATE
```

### Target Flow (No Redundancy)

```
LLM Extraction
     │
     ▼
┌─────────────────────────────────────┐
│ { primary_concepts, categories }    │  ← Simplified output
└─────────────────────────────────────┘
     │
     ├──► Hash to category_ids ──► catalog table
     │
     └──► Hash to concept_ids ──► chunks table (per chunk)
                                      │
                                      ▼
                              Document concepts = 
                              union(chunk.concept_ids)
```

---

## Query Pattern Changes

### Getting Concept Names for a Document

**Before (read from JSON blob):**
```typescript
const concepts = JSON.parse(doc.concepts);
return concepts.primary_concepts;
```

**After (aggregate from chunks, resolve via cache):**
```typescript
// Step 1: Get concept IDs from all chunks (using catalog_id for fast lookup)
const chunks = await chunksTable.query()
  .where(`catalog_id = ${doc.id}`)
  .select(['concept_ids'])
  .toArray();

const conceptIds = new Set<number>();
chunks.forEach(c => c.concept_ids?.forEach(id => conceptIds.add(id)));

// Step 2: Resolve to names
return conceptIdCache.getNames(Array.from(conceptIds));
```

**Performance note:** Integer comparison is ~10x faster than string. Adds ~10-20ms vs direct read, but ensures single source of truth.

### Getting Related Concepts

**Before (read from catalog):**
```typescript
const concepts = JSON.parse(doc.concepts);
return concepts.related_concepts;  // Stale snapshot
```

**After (compute from concepts table):**
```typescript
const conceptIds = doc.concept_ids;
const concepts = await conceptRepo.findByIds(conceptIds);
const related = new Set<string>();
concepts.forEach(c => c.related_concepts.forEach(r => related.add(r)));
return Array.from(related);  // Always fresh
```

---

## LanceDB Storage Format

Note: LanceDB stores arrays natively. The target schema uses:

- `number[]` instead of `string` (JSON-serialized array)
- This is more efficient and enables native array operations

**Example row format:**

```javascript
// Before (JSON strings)
{
  concept_ids: "[123, 456, 789]",      // String
  category_ids: "[101, 102]"           // String
}

// After (native arrays)
{
  concept_ids: [123, 456, 789],        // Array<number>
  category_ids: [101, 102]             // Array<number>
}
```

---

## Migration Considerations

### Backward Compatibility

**Not maintained** - This is a clean-break migration:
- Remove fallback code paths
- Update all consumers
- Rebuild database from source documents

### Data Reconstruction

All removed data can be reconstructed:

| Removed Field | Reconstruction Method |
|--------------|----------------------|
| `concepts.primary_concepts` | `conceptIdCache.getNames(concept_ids)` |
| `concepts.technical_terms` | Not needed (dead code) |
| `concepts.categories` | `categoryIdCache.getNames(category_ids)` |
| `concepts.related_concepts` | Aggregate from concepts table |
| `concept_categories` | `categoryIdCache.getNames(category_ids)` |
| `sources` | `catalogIdCache.getPaths(catalog_ids)` |
| `category` | Query categories table if needed |

---

## Validation Queries

After migration, verify:

```typescript
// 1. All catalog entries have concept_ids
const catalog = await db.openTable('catalog');
const withIds = await catalog.query()
  .where('concept_ids IS NOT NULL')
  .toArray();
assert(withIds.length === await catalog.countRows());

// 2. No legacy fields exist
const sample = (await catalog.query().limit(1).toArray())[0];
assert(!('concepts' in sample));
assert(!('concept_categories' in sample));

// 3. Concept resolution works
const names = conceptIdCache.getNames(sample.concept_ids);
assert(names.length > 0);

// 4. No concepts have legacy fields
const concepts = await db.openTable('concepts');
const conceptSample = (await concepts.query().limit(1).toArray())[0];
assert(!('sources' in conceptSample));
assert(!('category' in conceptSample));
assert(!('concept_type' in conceptSample));
```


