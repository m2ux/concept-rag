# 30. 46 Auto-Extracted Categories

**Date:** 2025-11-19  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Category Search Feature (November 19, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-19-category-search-feature/
- Git Commits: 55ccee3c07e9a72c36a7b9330e3d899c426b6804, 449e52bb75cdbc8f65d381bc8e3bf7d6745169da (November 19, 2024)

## Context and Problem Statement

The system had rich concept metadata but documents weren't organized into domains/categories [Gap: no domain organization]. Manual category assignment would be time-consuming for 165 documents [Problem: manual work], and categories needed to reflect actual corpus content [Requirement: corpus-driven].

**The Core Problem:** How to organize 165 documents into meaningful categories that reflect the corpus's actual domains? [Planning: Category extraction strategy]

**Decision Drivers:**
* 165 documents need categorization [Scope: full corpus]
* Manual categorization impractical [Constraint: time]
* Categories should reflect actual content [Requirement: accurate]
* Concept extraction already provides domain metadata [Opportunity: existing data]
* Need stable, meaningful taxonomy [Requirement: quality]

## Alternative Options

* **Option 1: Auto-Extract from Concept Metadata** - Use existing concept extraction
* **Option 2: Manual Curation** - Humans assign categories
* **Option 3: Filename-Based** - Parse categories from file paths
* **Option 4: LLM Classification** - Separate LLM call per document
* **Option 5: Predefined Taxonomy** - Force documents into fixed categories

## Decision Outcome

**Chosen option:** "Auto-Extract from Concept Metadata (Option 1)", because concept extraction already identifies document domains [ADR-0007], extraction is zero additional cost, and results in 46 meaningful categories discovered from actual corpus content.

### Category Discovery Process

**Extraction:** [Source: Concept extraction includes categories]
```typescript
// Concept extraction (Claude Sonnet 4.5) already returns:
{
  primary_concepts: string[],
  technical_terms: string[],
  categories: string[],  // ← Domain categories identified
  related_concepts: string[]
}
```
[Existing: Part of concept extraction since October 13]

**Aggregation:** [Source: Category extraction script]
```typescript
// 1. Extract all category mentions from concept metadata
const allCategories = new Set();
for (const doc of documents) {
  doc.concept_metadata.categories.forEach(cat => {
    allCategories.add(cat.toLowerCase().trim());
  });
}

// 2. Count documents per category
const categoryStats = {};
for (const category of allCategories) {
  categoryStats[category] = documents.filter(doc =>
    doc.concept_metadata.categories.includes(category)
  ).length;
}

// 3. Result: 46 unique categories with document counts
```
[Source: `scripts/extract_categories.ts`]

### 46 Categories Discovered

**Top Categories:** [Source: `.ai/planning/2025-11-19-category-search-feature/IMPLEMENTATION-COMPLETE.md`, lines 94-107]

| Category | Documents | Chunks |
|----------|-----------|---------|
| embedded systems engineering | 5 | 4,921 |
| software engineering | 5 | 4,074 |
| real-time systems | 4 | 5,007 |
| computer architecture | 3 | 2,660 |
| distributed systems | 3 | 4,561 |
| systems engineering | 2 | 3,766 |
| Plus 40 more categories... | | |

**Long Tail:** [Source: lines 107]
- 36 categories with 1-3 documents each
- Includes: numerical analysis, blockchain technology, mathematical physics, control theory, etc.

**Total:** 46 unique categories [Source: line 90]

### Category Quality

**Examples:** [Real categories from corpus]
- ✅ "software engineering" (broad domain)
- ✅ "distributed systems" (specific subdomain)
- ✅ "embedded systems engineering" (specialized field)
- ✅ "blockchain technology" (emerging tech)
- ✅ "mathematical physics" (interdisciplinary)

**Characteristics:**
- Domain-appropriate granularity
- Reflect actual corpus content
- Technically meaningful
- Not overly broad or narrow

### Consequences

**Positive:**
* **Zero additional cost:** Categories from existing extraction [Benefit: free]
* **46 categories:** Meaningful taxonomy discovered [Result: validated count]
* **Corpus-driven:** Reflects actual content [Quality: accurate]
* **Auto-generated:** No manual categorization needed [Efficiency: automatic]
* **Statistics available:** Document/chunk/concept counts per category [Feature: analytics]
* **Hierarchical potential:** Can add parent categories later [Extensibility: growth]
* **Browsable:** Via category_search tool [Feature: accessible] [ADR-0029]

**Negative:**
* **No hierarchy:** Flat list (no parent/child initially) [Limitation: flat taxonomy]
* **LLM-dependent:** Quality depends on Claude's categorization [Dependency: LLM]
* **Granularity variance:** Some categories very specific, others broad [Inconsistency: varied granularity]
* **No consolidation:** "software engineering" vs. "software architecture" (separate) [Issue: similar categories]

**Neutral:**
* **46 is manageable:** Not too many, not too few [Size: appropriate]
* **Can evolve:** Categories can be merged/split later [Process: iterative]

### Confirmation

**Production Statistics:** [Source: `IMPLEMENTATION-COMPLETE.md`, lines 84-107]
- **Categories table:** 46 unique categories
- **Top category:** embedded systems engineering (5 documents, 4,921 chunks)
- **Average:** ~3.6 documents per category (165 docs / 46 categories)
- **Long tail:** Most categories have 1-3 documents (specialized domains)

**Validation:**
- All categories have descriptions
- All have document counts
- All have embeddings for semantic similarity
- Hash-based IDs generated (stable)

## Pros and Cons of the Options

### Option 1: Auto-Extract from Metadata - Chosen

**Pros:**
* Zero additional cost (existing extraction)
* 46 meaningful categories [Validated]
* Corpus-driven (accurate)
* No manual work
* Statistics available
* Production validated

**Cons:**
* No hierarchy (flat)
* LLM-dependent quality
* Granularity variance
* Some similar categories

### Option 2: Manual Curation

Human assigns categories to each document.

**Pros:**
* Perfect accuracy (human judgment)
* Consistent granularity
* Can create hierarchy
* Domain expert knowledge

**Cons:**
* **Time-intensive:** Hours for 165 documents [Effort: impractical]
* **Subjective:** Different people categorize differently [Consistency: variance]
* **Not scalable:** New documents require manual work [Maintenance: burden]
* **Why automate?:** Against automation goal [Philosophy: manual work]

### Option 3: Filename-Based

Parse categories from file paths or naming conventions.

**Pros:**
* Simple extraction (regex)
* Fast (no LLM)
* Stable (filename-based)

**Cons:**
* **Filename inconsistency:** Not all files follow conventions [Problem: unreliable]
* **Limited information:** Filename doesn't capture full domain [Limitation: incomplete]
* **User-dependent:** Relies on user organization [Problem: variable quality]
* **Shallow:** Can't infer categories from content [Gap: surface-level]

### Option 4: LLM Classification

Separate LLM call specifically for categorization.

**Pros:**
* Dedicated classification prompt
* Could use hierarchical taxonomy
* Fine-tuned categorization

**Cons:**
* **Additional cost:** $0.041 × 165 docs = $6.77 [Cost: unnecessary]
* **Already done:** Concept extraction includes categories [Redundancy: duplicate]
* **Same LLM:** Claude already doing this [Duplication: same model]
* **Why twice?:** Concept metadata sufficient [Logic: redundant]

### Option 5: Predefined Taxonomy

Force documents into ACM/Dewey/custom fixed taxonomy.

**Pros:**
* Consistent granularity
* Hierarchical structure
* Standard classification

**Cons:**
* **Mismatch:** Fixed taxonomy may not fit corpus [Problem: Procrustean bed]
* **Forces categorization:** Documents forced into wrong categories [Quality: inaccurate]
* **Not corpus-driven:** Ignores actual content [Problem: prescriptive]
* **Corpus-driven better:** Let content determine categories [Philosophy: bottom-up]

## Implementation Notes

### Category Extraction Script

**Script:** `scripts/extract_categories.ts` [Source: Implementation]
```typescript
// Load all catalog entries
const docs = await catalogTable.toArray();

// Extract categories from concept metadata
const categories = new Set();
docs.forEach(doc => {
  if (doc.concept_metadata?.categories) {
    doc.concept_metadata.categories.forEach(cat => {
      categories.add(cat.toLowerCase().trim());
    });
  }
});

// Count documents per category
// Generate category descriptions
// Create categories table
```

### Category Table Creation

**Script:** `scripts/create_categories_table.ts` [Source: Implementation]
- Generates 46 category records
- Hash-based IDs (FNV-1a)
- Embeddings for each category
- Statistics (document_count, chunk_count, concept_count)

### Categories Table Schema

**Structure:** [Source: `FINAL-DESIGN-SUMMARY.md`, lines 53-57]
```typescript
{
  id: number,                // Hash-based (FNV-1a)
  category: string,          // "software engineering"
  description: string,       // Auto-generated description
  parentCategoryId?: number, // For future hierarchy
  aliases: string[],         // Alternative names
  relatedCategories: string[],
  document_count: number,    // 1-5 documents
  chunk_count: number,       // 1K-5K chunks
  concept_count: number,     // Unique concepts in category
  embeddings: Float32Array   // 384-dim category vector
}
```

### Future Enhancements

**Potential Improvements:**
- Merge similar categories ("software engineering" + "software architecture")
- Add hierarchy (parent/child relationships)
- Category descriptions (currently basic)
- Category embeddings for similarity
- Cross-category relationships

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Extraction includes categories
- [ADR-0027: Hash-Based IDs](adr0027-hash-based-integer-ids.md) - IDs for categories
- [ADR-0028: Category Storage](adr0028-category-storage-strategy.md) - Storage on documents
- [ADR-0029: Category Search Tools](adr0029-category-search-tools.md) - Tools to browse categories

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)
- [ADR-0027: Hash-Based IDs](adr0027-hash-based-integer-ids.md)
- [ADR-0029: Category Tools](adr0029-category-search-tools.md)

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 19, 2024
- Git commits: 55ccee3c, 449e52bb
- Documented in: IMPLEMENTATION-COMPLETE.md lines 84-107

**Traceability:** .ai/planning/2025-11-19-category-search-feature/
