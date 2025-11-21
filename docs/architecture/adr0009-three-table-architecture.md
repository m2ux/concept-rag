# 9. Three-Table Architecture (Catalog, Chunks, Concepts)

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Conceptual Search Implementation (October 13, 2025)

**Sources:**
- Planning: .ai/planning/2025-10-13-conceptual-search-implementation/

## Context and Problem Statement

The initial architecture used only two tables: catalog (document summaries) and chunks (text segments) [Inferred: from evolution]. With the addition of concept extraction [ADR-0007], the system needed to store extracted concepts efficiently. The decision was whether to store concepts inline with documents, in a normalized separate table, or in a hybrid approach.

**The Core Problem:** How to store 100-200+ concepts per document efficiently while enabling fast concept-based search and cross-document concept relationships? [Planning: three-table architecture rationale]

**Decision Drivers:**
* 37,000+ concepts across 165 documents need efficient storage [Source: production database stats]
* Concepts are shared across multiple documents [Observation: cross-document concepts]
* Need for concept-based search ("find all documents about X concept") [Use case: concept_search tool]
* Avoid duplication (same concept appears in many documents) [Efficiency: normalization]
* Enable concept graph (concept relationships) [Feature: related concepts]
* Fast lookups by concept name [Performance: indexed access]

## Alternative Options

* **Option 1: Three-Table Normalized** - Catalog, Chunks, Concepts (separate)
* **Option 2: Two-Table Denormalized** - Store concepts inline with catalog/chunks
* **Option 3: Four-Table** - Add junction table for many-to-many relationships
* **Option 4: Document Store** - JSON/MongoDB-style document database
* **Option 5: Single Table** - Everything in chunks table

## Decision Outcome

**Chosen option:** "Three-Table Normalized Architecture (Option 1)", because it provides optimal balance of storage efficiency, query performance, and relationship modeling for the concept-heavy workload.

### Table Architecture

**Catalog Table** (Document-level metadata): [Source: `IMPLEMENTATION_COMPLETE.md`, lines 105-108; schema in code]
```typescript
{
  source: string,              // Document path (primary key)
  title: string,               // Extracted title
  summary: string,             // LLM-generated summary
  concepts: string[],          // Primary concepts
  concept_categories: string[],// Categories
  concept_ids: number[],       // Hash-based IDs (added Nov 19)
  category_ids: number[]       // Category IDs (added Nov 19)
}
```

**Chunks Table** (Text segments for retrieval): [Source: schema design]
```typescript
{
  id: string,                  // Chunk identifier
  text: string,                // Chunk text content
  source: string,              // Document source (foreign key)
  hash: string,                // Content hash
  vector: Float32Array,        // 384-dim embedding
  concepts: string[],          // Tagged concepts
  concept_ids: number[],       // Hash-based IDs (added Nov 19)
  concept_density: number      // Concept concentration
}
```

**Concepts Table** (Concept index): [Source: `IMPLEMENTATION_PLAN.md`, concept schema; `IMPLEMENTATION_COMPLETE.md`, lines 18-19]
```typescript
{
  id: number,                  // Hash-based ID (FNV-1a, added Nov 19)
  concept: string,             // Concept name (unique)
  concept_type: 'thematic' | 'terminology',
  category: string,            // Domain category
  sources: string[],           // Documents containing concept
  related_concepts: string[],  // Related terms from corpus
  synonyms: string[],          // From WordNet
  broader_terms: string[],     // Hypernyms
  narrower_terms: string[],    // Hyponyms
  embeddings: Float32Array,    // Concept vector
  weight: number,              // Importance (document count)
  enrichment_source: 'corpus' | 'wordnet' | 'hybrid'
}
```
[Source: Concept table schema from planning docs]

### Relationships

```
Catalog (1) ──< (N) Chunks       // One document has many chunks
Catalog (N) ──< (N) Concepts     // Documents share concepts
Chunks (N) ──< (N) Concepts      // Chunks tagged with concepts
```

**Storage Method:** [Source: implementation]
- Concepts stored as string arrays in catalog/chunks
- Separate concepts table for full concept data
- Many-to-many without explicit junction table (array columns)

### Consequences

**Positive:**
* **Storage efficiency:** Concepts deduplicated (single storage per unique concept) [Benefit: normalization]
* **Fast concept lookup:** Direct table query by concept name [Performance: indexed]
* **Cross-document search:** "Find all docs with concept X" is simple query [Feature: concept_search]
* **Concept graph:** Relationships stored centrally [Feature: related_concepts field]
* **Statistics:** Easy to compute concept frequency, co-occurrence [Analytics: weight field]
* **Scalability:** 37K concepts in production, sub-second lookups [Source: production stats]
* **Flexible:** Can add concept metadata without touching chunk/catalog tables

**Negative:**
* **Joins required:** Must join tables for full context (chunk + its concepts) [Complexity: SQL joins]
* **Update complexity:** Adding concept to document requires updating 2-3 tables [Trade-off: write complexity]
* **Array columns:** LanceDB doesn't have native foreign keys, use arrays [Limitation: no referential integrity]
* **Consistency:** Manual enforcement of referential integrity [Risk: orphaned references]

**Neutral:**
* **Three tables to manage:** More complex than two, simpler than four [Complexity: middle ground]
* **Vector storage:** Each concept has its own embedding (storage overhead) [Trade-off: concept search capability]

### Confirmation

**Production Validation:** [Source: production database]
- **165 documents** in catalog table
- **~10,000+ chunks** in chunks table (estimate)
- **37,000+ concepts** in concepts table
- **Storage:** 324 MB total (after hash-based ID optimization)
- **Query performance:** Concept lookup < 5ms, search < 100ms

**Table Sizes:** [Source: database inspection]
- Catalog: ~165 rows (1 per document)
- Chunks: ~10K rows (variable per document)
- Concepts: ~37K rows (deduplicated across all documents)

## Pros and Cons of the Options

### Option 1: Three-Table Normalized - Chosen

**Pros:**
* Deduplicated concept storage (efficient)
* Fast concept lookups (indexed table)
* Cross-document queries simple
* Concept graph centralized
* Easy analytics (concept frequency, etc.)
* Scales to 37K+ concepts [Validated: production]

**Cons:**
* Requires joins for full data
* Updates span multiple tables
* Array columns (no real foreign keys)
* Manual referential integrity

### Option 2: Two-Table Denormalized

Store concepts inline with catalog and chunks (JSON blobs).

**Pros:**
* Simpler (fewer tables)
* No joins required
* Single write per document
* Simpler queries

**Cons:**
* **Massive duplication:** Same concept stored 100s of times [Storage: inefficient]
* **No concept graph:** Can't see all documents for a concept
* **Slow concept search:** Must scan all documents [Performance: O(n)]
* **Large storage:** Estimated 2-3x larger database [Estimate: duplication overhead]
* **Analytics impossible:** Can't compute concept statistics
* **Update nightmare:** Changing concept requires updating all documents

### Option 3: Four-Table with Junction

Add junction table for many-to-many relationships.

```
document_concepts: { document_id, concept_id }
chunk_concepts: { chunk_id, concept_id }
```

**Pros:**
* Proper normalized design
* True foreign keys
* Clear relationships
* Better referential integrity

**Cons:**
* **More complex:** Extra tables to manage
* **Query complexity:** More joins required
* **LanceDB limitation:** Not traditional relational DB [Limitation: vector DB]
* **Array columns work:** LanceDB supports arrays natively
* **Over-engineering:** Three tables sufficient

### Option 4: Document Store (MongoDB-style)

Use JSON documents with embedded concepts.

**Pros:**
* Schema flexibility
* No joins
* Easy to modify structure
* Natural JSON mapping

**Cons:**
* **Wrong tool:** LanceDB is vector DB, not document store [Misalignment: database choice]
* **Loses vector search:** Primary use case is similarity search
* **Duplication issues:** Same as Option 2
* **Query complexity:** JSON queries less efficient

### Option 5: Single Table

Everything in chunks table.

**Pros:**
* Simplest possible
* Single table to query
* No joins ever

**Cons:**
* **No document-level metadata:** Where does catalog summary go?
* **Concept duplication:** Every chunk stores same concept data [Massive duplication]
* **Huge table:** Millions of rows for large corpus [Scaling: poor]
* **Slow aggregations:** Computing document-level stats requires full scan

## Implementation Notes

### Table Creation

**Seeding Process:** [Source: `hybrid_fast_seed.ts`]
```typescript
// 1. Create catalog entry (document summary + concepts)
await catalogTable.add([{
  source: doc.path,
  title: extractedTitle,
  summary: llmSummary,
  concepts: primaryConcepts
}]);

// 2. Create chunk entries (text segments)
for (const chunk of chunks) {
  await chunksTable.add([{
    id: generateId(),
    text: chunk.text,
    source: doc.path,
    vector: embedding,
    concepts: chunkConcepts
  }]);
}

// 3. Create/update concept entries (deduplicated)
for (const concept of allExtractedConcepts) {
  await conceptsTable.upsert([{
    concept: concept.name,
    sources: [...existingSources, doc.path],
    weight: documentCount
  }]);
}
```

### Query Patterns

**Document Search:**
```typescript
// Find documents by concept (single table query)
const docs = await catalogTable
  .query()
  .where(`array_contains(concepts, '${conceptName}')`)
  .toArray();
```

**Concept Search:**
```typescript
// Find concept details (single table query)
const concept = await conceptsTable
  .query()
  .where(`concept = '${conceptName}'`)
  .limit(1)
  .toArray();

// Find chunks with concept (single table query)
const chunks = await chunksTable
  .query()
  .where(`array_contains(concepts, '${conceptName}')`)
  .limit(10)
  .toArray();
```

### Evolution

**October 13, 2025:** Initial three-table architecture [Planning: conceptual-search]

**November 19, 2025:** Optimized with hash-based integer IDs [See: ADR-0027]
- Changed concept IDs from strings to integers
- Added `concept_ids` and `category_ids` columns
- 54% storage reduction (699 MB → 324 MB)

## Related Decisions

- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md) - Database supports multiple tables
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Generates concepts to store
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md) - Enriches concepts table
- [ADR-0027: Hash-Based Integer IDs](adr0027-hash-based-integer-ids.md) - Later optimization
- [ADR-0028: Category Storage Strategy](adr0028-category-storage.md) - Similar design for categories

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)
- [ADR-0027: Hash-Based IDs](adr0027-hash-based-integer-ids.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: October 13, 2024
- Documented in: IMPLEMENTATION_COMPLETE.md lines 47-50, 105-112

**Traceability:** .ai/planning/2025-10-13-conceptual-search-implementation/



