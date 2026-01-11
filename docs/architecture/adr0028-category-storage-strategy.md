# 28. Category Storage Strategy (Categories on Documents)

**Date:** 2025-11-19  
**Status:** Accepted (Corrected Design)  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Category Search Feature - Design Correction (November 19, 2025)

**Sources:**
- Planning: [2025-11-19-category-search-feature](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-19-category-search-feature/)
- Git Commits: 3a59541d3ae93ec7e4055fe17b17eef6752f1d42, 55ccee3c07e9a72c36a7b9330e3d899c426b6804 (November 19, 2024)

## Context and Problem Statement

During category feature planning, the initial design placed `category_id` field on concepts table [Initial wrong design: [FINAL-DESIGN-SUMMARY.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-19-category-search-feature/FINAL-DESIGN-SUMMARY.md), lines 95-101]. This was architecturally incorrect because concepts are cross-domain entities (e.g., "testing" appears in software engineering, embedded systems, etc.) [Problem: concepts span categories].

**The Core Problem:** Should categories be a property of concepts or documents? [Planning: `FINAL-DESIGN-SUMMARY.md`, design correction]

**Decision Drivers:**
* Concepts are cross-domain (single concept, multiple categories) [Observation: concept nature]
* Documents belong to specific domains [Observation: document nature]
* Category search needs: "Find documents in category X" [Use case: primary query]
* Concept aggregation: "What concepts appear in category X?" [Use case: secondary, computed]
* Storage efficiency [Goal: no redundancy]

## Alternative Options

* **Option 1: Categories on Documents** - category_ids in catalog/chunks tables
* **Option 2: Categories on Concepts** - category_id field in concepts table
* **Option 3: Junction Table** - Many-to-many document_categories table
* **Option 4: Both** - Categories on concepts AND documents
* **Option 5: Derived** - Compute categories from concepts at query time

## Decision Outcome

**Chosen option:** "Categories on Documents (Option 1)", because categories are a property of documents (a book is "about" distributed systems), while concepts are cross-domain entities that appear in multiple categories.

### Corrected Design

**Documents Have Categories:** [Source: `FINAL-DESIGN-SUMMARY.md`, lines 11-16]
```typescript
CatalogEntry {
  concept_ids: number[],      // Concepts mentioned in document
  category_ids: number[]      // Categories document belongs to (e.g., [software engineering, distributed systems])
}

Chunk {
  concept_ids: number[],      // Concepts in this chunk
  category_ids: number[]      // Inherited from parent document
}
```

**Concepts Are Category-Agnostic:** [Source: lines 19-26]
```typescript
Concept {
  id: number,                 // hash-based
  concept: string,            // "testing", "consensus", etc.
  // NO category field!       // Concepts span multiple categories
  catalog_ids: number[]       // Documents containing this concept
}
```

**Categories Table:** [Source: lines 29-36]
```typescript
Category {
  id: number,                 // hash-based (e.g., 3612017291 for "software engineering")
  category: string,           // Category name
  description: string,        // Category description
  document_count: number,     // Documents in this category
  chunk_count: number,        // Total chunks
  concept_count: number       // Unique concepts in category (computed)
}
```

### Storage Method

**Direct Storage (Not Derived):** [Source: `FINAL-DESIGN-SUMMARY.md`, lines 42-48]
- Categories stored directly on catalog/chunks
- NOT computed from concepts
- NOT stored in junction table
- Simple array field: `category_ids: number[]`

**Why Direct:** [Rationale]
1. Fast queries: `category_ids.includes(categoryId)` = O(1) check
2. No joins: Single table query
3. Explicit: What you store is what you get
4. Inherited: Chunks inherit from parent document

### Query Patterns

**Find Documents in Category:** [Source: `FINAL-DESIGN-SUMMARY.md`, lines 79-90]
```typescript
const categoryId = hashToId("software engineering");  // 3612017291

const docs = await catalogTable
  .filter(doc => {
    const categories: number[] = JSON.parse(doc.category_ids);
    return categories.includes(categoryId);
  })
  .toArray();
```

**Simple!** Direct filter, no joins, no derivation [Benefit: simplicity]

**Find Concepts in Category:** [Source: `IMPLEMENTATION-COMPLETE.md`, repository method]
```typescript
// 1. Find documents in category
const docs = await catalogTable.filter(/* as above */);

// 2. Aggregate concept IDs from documents
const conceptIds = new Set();
docs.forEach(doc => {
  const ids: number[] = JSON.parse(doc.concept_ids);
  ids.forEach(id => conceptIds.add(id));
});

// 3. Resolve concept names
const concepts = await Promise.all(
  Array.from(conceptIds).map(id => conceptCache.getNameById(id))
);
```

**Computed at Query Time:** [Design: aggregation on demand]

### Consequences

**Positive:**
* **Architecturally correct:** Categories belong to documents [Design: proper domain modeling]
* **Concepts cross-domain:** Can appear in multiple categories [Reality: concept nature]
* **Simple queries:** Direct filter on category_ids [Performance: fast] [Source: `FINAL-DESIGN-SUMMARY.md`, line 90]
* **No redundancy:** Categories stored once per document [Efficiency: no duplication]
* **Flexible:** Document can have multiple categories [Feature: multi-categorization]
* **Chunk inheritance:** Chunks automatically get parent's categories [Feature: automatic]

**Negative:**
* **Concept aggregation:** Computing concepts-in-category requires query-time aggregation [Trade-off: computed]
* **Initial design wrong:** Had to correct during planning [Process: iteration] [Source: lines 95-101]
* **No concept→category direct link:** Must go through documents [Path: indirect]

**Neutral:**
* **46 categories:** Auto-extracted from corpus [Result: `IMPLEMENTATION-COMPLETE.md`, line 90]
* **Category assignment:** Based on concept extraction [Method: derived from concepts, then stored]

### Confirmation

**Design Correction:** [Source: `FINAL-DESIGN-SUMMARY.md`, lines 95-105]

**Initial Design (Wrong):**
```typescript
Concept { category_id: number }  // ❌ One category per concept
Documents derive categories from concepts  // ❌ Backward
```

**Corrected Design (Right):**
```typescript
CatalogEntry { category_ids: number[] }  // ✅ Documents have categories
Concepts have NO category field           // ✅ Cross-domain
```

**Why Wrong:** Concepts span multiple categories [Source: line 98-99]
**Correction Made:** During planning before implementation [Source: line 95]

**Validation:** [Source: `IMPLEMENTATION-COMPLETE.md`, lines 32-38]
- Schema validation: Verified concepts have NO category_id field
- Functional tests: Category search working correctly
- Production: 46 categories on 165 documents

## Pros and Cons of the Options

### Option 1: Categories on Documents - Chosen

**Pros:**
* Architecturally correct (documents have domains)
* Concepts cross-domain (realistic)
* Simple queries (direct filter)
* No redundancy
* Multi-category support
* Production validated [46 categories]

**Cons:**
* Concept aggregation computed
* Initial design wrong (corrected)
* Indirect concept→category link

### Option 2: Categories on Concepts

Put category_id field on concepts table.

**Pros:**
* Direct concept→category link
* Simple concept queries

**Cons:**
* **Architecturally wrong:** Concept can appear in multiple categories [Problem: fundamental]
* **Forces single category:** Can't have "testing" in both software & embedded [Limitation: incorrect model]
* **Initial design:** This was wrong approach [History: rejected] [Source: FINAL-DESIGN-SUMMARY lines 98-99]
* **Real world:** "consensus" appears in distributed systems, blockchain, organization theory [Reality: cross-domain]

### Option 3: Junction Table

Many-to-many document_categories table.

**Pros:**
* Normalized database design
* Explicit relationships
* Standard pattern

**Cons:**
* **Extra table:** More complexity [Trade-off: another table]
* **Joins required:** Query performance hit [Performance: slower]
* **Array columns work:** LanceDB supports arrays natively [Alternative: built-in]
* **Simpler solution:** Direct array storage better [Decision: arrays sufficient]

### Option 4: Both

Categories on concepts AND documents.

**Pros:**
* Maximum flexibility
* Direct links everywhere

**Cons:**
* **Redundant:** Duplicate information [Problem: storage waste]
* **Consistency:** Must keep in sync [Risk: divergence]
* **Confusing:** Which is source of truth? [Architecture: unclear]
* **Over-engineering:** Not needed [Complexity: unnecessary]

### Option 5: Derived (Compute at Query)

No category storage, compute from concepts.

**Pros:**
* No storage needed
* Always consistent
* No sync issues

**Cons:**
* **Slow:** Must analyze concepts for every query [Performance: expensive]
* **Complex:** Aggregation logic required [Complexity: computational]
* **CPU intensive:** Lots of computation [Resource: wasteful]
* **Storage available:** Why not store it? [Trade-off: storage cheap]

## Implementation Notes

### Category Assignment During Seeding

**Process:** [Source: Seeding logic]
```typescript
// 1. Extract concepts from document
const concepts = await extractConcepts(document);  // Claude Sonnet 4.5

// 2. Determine document categories from concepts
const categories = inferCategoriesFromConcepts(concepts);  // "software engineering", "testing"

// 3. Convert to hash-based IDs
const category_ids = categories.map(cat => hashToId(cat));

// 4. Store on catalog
await catalogTable.add({
  source: document.path,
  concept_ids: conceptIds,
  category_ids: category_ids  // Stored directly
});
```

### 46 Categories Auto-Extracted

**Discovery:** [Source: `IMPLEMENTATION-COMPLETE.md`, lines 94-107]
- 46 unique categories across 165 documents
- Auto-extracted from concept metadata
- Top categories: embedded systems (5 docs), software engineering (5 docs), real-time systems (4 docs)
- Long tail: 36 categories with 1-3 documents each

## Related Decisions

- [ADR-0027: Hash-Based IDs](adr0027-hash-based-integer-ids.md) - ID generation for categories
- [ADR-0029: Category Search Tools](adr0029-category-search-tools.md) - Tools query category_ids
- [ADR-0030: 46 Auto-Extracted Categories](adr0030-auto-extracted-categories.md) - Category discovery

## References

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 19, 2024
- Git commits: 3a59541d, 55ccee3c
- Design documented: FINAL-DESIGN-SUMMARY.md lines 7-48

**Traceability:** [2025-11-19-category-search-feature](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-19-category-search-feature/)


