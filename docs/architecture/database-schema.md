# Database Schema & Field Mappings

**Last Updated**: November 15, 2025  
**Database**: LanceDB v0.15.0  
**Purpose**: Document the mapping between LanceDB table schemas and TypeScript domain models

---

## Overview

This document provides the authoritative reference for field mappings between LanceDB table columns and TypeScript domain model properties. Understanding these mappings is critical when:

- Implementing new repository methods
- Debugging data retrieval issues
- Modifying domain models
- Adding new fields to tables

---

## ⚠️ Critical Naming Conventions

### Vector/Embeddings Field

**IMPORTANT**: LanceDB uses `vector` as the column name for embedding vectors, but our domain models use `embeddings` as the property name.

```typescript
// ❌ WRONG - Will result in empty array
embeddings: row.embeddings || []

// ✅ CORRECT - Check 'vector' first (LanceDB convention)
embeddings: row.vector || row.embeddings || []
```

**Rationale**: LanceDB follows the convention of naming vector columns `vector` for automatic vector search detection. Our domain uses `embeddings` for semantic clarity.

---

## Chunks Table

### Schema

| LanceDB Column | Type | Nullable | Description |
|----------------|------|----------|-------------|
| `id` | string | No | Unique identifier (UUID or hash-based) |
| `text` | string | No | Text content of the chunk (100-500 words) |
| `source` | string | No | Source document path (absolute or relative) |
| `hash` | string | No | Content hash for deduplication (SHA-256) |
| `vector` | float[] | No | 384-dimensional embedding vector |
| `concepts` | string | Yes | JSON array of concept names |
| `concept_categories` | string | Yes | JSON array of category names |
| `concept_density` | float | Yes | Concept density score (0.0-1.0) |

### Domain Model Mapping

```typescript
interface Chunk {
  id: string;                      // → row.id
  text: string;                    // → row.text
  source: string;                  // → row.source
  hash: string;                    // → row.hash
  embeddings?: number[];           // → row.vector ⚠️ NOTE THE NAME DIFFERENCE
  concepts?: string[];             // → JSON.parse(row.concepts)
  conceptCategories?: string[];    // → JSON.parse(row.concept_categories)
  conceptDensity?: number;         // → row.concept_density
}
```

### Mapping Code Example

```typescript
private mapRowToChunk(row: any): Chunk {
  return {
    id: row.id || '',
    text: row.text || '',
    source: row.source || '',
    hash: row.hash || '',
    concepts: parseJsonField(row.concepts),              // Handles JSON parsing
    conceptCategories: parseJsonField(row.concept_categories),
    conceptDensity: row.concept_density || 0,
    embeddings: row.vector || row.embeddings || []       // ⚠️ Check 'vector' first!
  };
}
```

### JSON Fields

The following fields are stored as JSON strings in LanceDB:

- **`concepts`**: Array of concept names, e.g., `["machine learning", "neural networks"]`
- **`concept_categories`**: Array of category names, e.g., `["AI", "computer science"]`

**Parsing**: Use the `parseJsonField()` utility from `src/infrastructure/lancedb/utils/field-parsers.ts`

---

## Catalog Table

### Schema

| LanceDB Column | Type | Nullable | Description |
|----------------|------|----------|-------------|
| `id` | string | No | Unique document identifier |
| `text` | string | No | Document summary or full text |
| `source` | string | No | Source document path |
| `hash` | string | No | Document content hash |
| `vector` | float[] | No | 384-dimensional embedding of summary |
| `concepts` | string | Yes | JSON object with rich concept metadata |
| `concept_categories` | string | Yes | JSON array of document categories |
| `concept_density` | float | Yes | Overall concept density |

### Domain Model Mapping

```typescript
interface Chunk {  // Note: Catalog uses Chunk interface
  id: string;                      // → row.id
  text: string;                    // → row.text (document summary)
  source: string;                  // → row.source
  hash: string;                    // → row.hash
  embeddings?: number[];           // → row.vector ⚠️
  concepts?: any;                  // → JSON.parse(row.concepts) - Rich object!
  conceptCategories?: string[];    // → JSON.parse(row.concept_categories)
  conceptDensity?: number;         // → row.concept_density
}
```

### Concepts Field Structure (Catalog)

**IMPORTANT**: In the catalog table, `concepts` is a **rich object**, not a simple array:

```typescript
interface CatalogConcepts {
  primary_concepts: string[];      // Main concepts (e.g., ["clean architecture"])
  technical_terms?: string[];      // Technical vocabulary
  related_concepts?: string[];     // Related semantic concepts
  categories?: string[];           // Semantic categories
  summary?: string;                // Document summary
}
```

Example value:
```json
{
  "primary_concepts": ["software architecture", "clean code"],
  "technical_terms": ["dependency injection", "SOLID principles"],
  "related_concepts": ["design patterns", "refactoring"],
  "categories": ["software engineering", "best practices"],
  "summary": "A guide to writing maintainable software..."
}
```

---

## Concepts Table

### Schema

| LanceDB Column | Type | Nullable | Description |
|----------------|------|----------|-------------|
| `id` | string | No | Sequential ID (e.g., "0", "1", "2") |
| `concept` | string | No | Concept name (lowercase, trimmed) |
| `concept_type` | string | No | Type: "thematic" or "terminology" |
| `category` | string | No | Semantic category (e.g., "software engineering") |
| `sources` | string | Yes | JSON array of source document paths |
| `related_concepts` | string | Yes | JSON array of related concept names |
| `synonyms` | string | Yes | JSON array of synonyms (from WordNet) |
| `broader_terms` | string | Yes | JSON array of hypernyms (from WordNet) |
| `narrower_terms` | string | Yes | JSON array of hyponyms (from WordNet) |
| `vector` | float[] | No | 384-dimensional concept embedding |
| `weight` | float | No | Importance weight (based on frequency) |
| `chunk_count` | integer | No | Number of chunks containing this concept |
| `enrichment_source` | string | No | "corpus", "wordnet", or "hybrid" |

### Domain Model Mapping

```typescript
interface Concept {
  concept: string;                  // → row.concept
  conceptType: 'thematic' | 'terminology'; // → row.concept_type
  category: string;                 // → row.category
  sources: string[];                // → JSON.parse(row.sources)
  relatedConcepts: string[];        // → JSON.parse(row.related_concepts)
  synonyms?: string[];              // → JSON.parse(row.synonyms)
  broaderTerms?: string[];          // → JSON.parse(row.broader_terms)
  narrowerTerms?: string[];         // → JSON.parse(row.narrower_terms)
  embeddings: number[];             // → row.vector ⚠️
  weight: number;                   // → row.weight
  chunkCount?: number;              // → row.chunk_count
  enrichmentSource: 'corpus' | 'wordnet' | 'hybrid'; // → row.enrichment_source
}
```

### Mapping Code Example

```typescript
private mapRowToConcept(row: any): Concept {
  return {
    concept: row.concept || '',
    conceptType: row.concept_type || 'thematic',
    category: row.category || '',
    sources: parseJsonField(row.sources),
    relatedConcepts: parseJsonField(row.related_concepts),
    synonyms: parseJsonField(row.synonyms),
    broaderTerms: parseJsonField(row.broader_terms),
    narrowerTerms: parseJsonField(row.narrower_terms),
    embeddings: row.vector || row.embeddings || [],   // ⚠️ Check 'vector' first!
    weight: row.weight || 0,
    chunkCount: row.chunk_count || 0,
    enrichmentSource: row.enrichment_source || 'corpus'
  };
}
```

---

## Common Pitfalls & Solutions

### 1. Vector vs Embeddings Field Name

**Problem**: Forgetting that LanceDB uses `vector` but domain uses `embeddings`

**Symptoms**:
- Empty embeddings array in domain objects
- "No vector column found to match with the query vector dimension: 0" error
- Vector search operations failing

**Solution**:
```typescript
// Always check 'vector' first, then 'embeddings' as fallback
embeddings: row.vector || row.embeddings || []
```

### 2. JSON Field Parsing

**Problem**: Trying to use JSON fields as if they're already parsed

**Symptoms**:
- Type errors (string is not assignable to array)
- Runtime errors when calling array methods

**Solution**:
```typescript
// ❌ WRONG - row.concepts is a string
concepts: row.concepts || []

// ✅ CORRECT - Parse the JSON string
concepts: parseJsonField(row.concepts)
```

### 3. Null vs Undefined Handling

**Problem**: LanceDB may return `undefined` for missing fields

**Symptoms**:
- Unexpected undefined values in domain objects
- Type errors when expecting arrays

**Solution**:
```typescript
// Use || operator to provide sensible defaults
conceptDensity: row.concept_density || 0,
concepts: parseJsonField(row.concepts),  // parseJsonField handles null/undefined
embeddings: row.vector || row.embeddings || []
```

### 4. Field Name Casing

**Problem**: LanceDB uses snake_case, domain uses camelCase

**Pattern**:
```
LanceDB:        Domain Model:
concept_type    conceptType
concept_density conceptDensity
chunk_count     chunkCount
broader_terms   broaderTerms
```

**Solution**: Always explicitly map in repository code, never rely on automatic mapping

---

## Type Safety Recommendations

### Define LanceDB Row Types

For better type safety, consider defining explicit row types:

```typescript
// src/infrastructure/lancedb/types/rows.ts

export interface LanceDBChunkRow {
  id: string;
  text: string;
  source: string;
  hash: string;
  vector: number[];              // Note: 'vector' not 'embeddings'
  concepts?: string;             // JSON string
  concept_categories?: string;   // JSON string
  concept_density?: number;
}

export interface LanceDBConceptRow {
  id: string;
  concept: string;
  concept_type: 'thematic' | 'terminology';
  category: string;
  sources?: string;              // JSON string
  related_concepts?: string;     // JSON string
  synonyms?: string;             // JSON string
  broader_terms?: string;        // JSON string
  narrower_terms?: string;       // JSON string
  vector: number[];              // Note: 'vector' not 'embeddings'
  weight: number;
  chunk_count?: number;
  enrichment_source: 'corpus' | 'wordnet' | 'hybrid';
}
```

### Use in Repository Methods

```typescript
private mapRowToChunk(row: LanceDBChunkRow): Chunk {
  // Now TypeScript will catch if you try to access wrong field names!
  return {
    id: row.id,
    text: row.text,
    source: row.source,
    hash: row.hash,
    embeddings: row.vector,  // TypeScript knows this exists
    concepts: parseJsonField(row.concepts),
    conceptCategories: parseJsonField(row.concept_categories),
    conceptDensity: row.concept_density || 0
  };
}
```

---

## Validation Checklist

When implementing new repository methods, verify:

- [ ] Using `row.vector` not `row.embeddings` for vector data
- [ ] Parsing JSON fields with `parseJsonField()` utility
- [ ] Handling null/undefined with `|| defaultValue`
- [ ] Converting snake_case to camelCase for domain models
- [ ] Returning proper domain types (Chunk, Concept, SearchResult)
- [ ] Providing sensible defaults for optional fields

---

## Field Parsing Utilities

### parseJsonField()

Location: `src/infrastructure/lancedb/utils/field-parsers.ts`

```typescript
/**
 * Parse a JSON field from LanceDB, handling null/undefined/invalid JSON
 */
export function parseJsonField(field: any): any {
  if (field === null || field === undefined) {
    return undefined;
  }
  
  if (Array.isArray(field)) {
    return field;  // Already parsed
  }
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Failed to parse JSON field:', field);
      return undefined;
    }
  }
  
  return field;  // Already an object
}
```

### escapeSqlString()

Location: `src/infrastructure/lancedb/utils/field-parsers.ts`

```typescript
/**
 * Escape single quotes in SQL strings to prevent injection
 */
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}
```

---

## Database Index Configuration

### Vector Indexes

LanceDB automatically creates vector indexes on columns named `vector`. The indexing strategy depends on dataset size:

| Dataset Size | Index Type | Configuration |
|--------------|------------|---------------|
| < 100,000 | Linear scan | No index needed (fast enough) |
| 100,000 - 1M | IVF_PQ | 256 partitions, 16 subvectors |
| > 1M | IVF_PQ | 512+ partitions, 16 subvectors |

**Note**: The seeding script (`hybrid_fast_seed.ts`) automatically configures optimal indexes based on data size.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-15 | 1.0 | Initial documentation based on architecture review |

---

## See Also

- [Architecture Review](../../.ai/planning/2025-11-15-architecture-review/01-architecture-review.md) - Full architectural analysis
- [Repository Pattern](../../.ai/planning/2025-11-15-architecture-review/01-architecture-review.md#3-repository-pattern-implementation) - Repository implementation details
- `src/infrastructure/lancedb/utils/field-parsers.ts` - Field parsing utilities
- `src/concepts/concept_index.ts` - Concept table creation logic
- `hybrid_fast_seed.ts` - Database seeding and schema creation

