# Concept Search by Category: Feasibility Analysis

**Date**: 2025-11-19  
**Question**: Should categories table have `concept_ids` field for concept-by-category search?  
**Status**: Analysis

## The Requirement

**User Need**: "Search for concepts by category"

**Example Query**: "Show me all concepts that appear in software engineering documents"

---

## Current Schema Analysis

### What We Have

**Categories Table**:
```typescript
{
  id: number,              // hash("software engineering")
  category: string,
  // ... metadata
}
```

**Catalog Table** (documents):
```typescript
{
  id: string,
  source: string,
  concept_ids: [3842615478, 1829374562, ...],  // Concepts in this doc
  category_ids: [7362849501, 4829304857]        // Categories this doc belongs to
}
```

**Concepts Table**:
```typescript
{
  id: 3842615478,  // hash("API gateway")
  concept: "API gateway",
  catalog_ids: [doc1, doc2, ...]  // Documents containing this concept
}
```

### The Relationship Chain

```
Category "software engineering" (id: 7362849501)
  ↓
  Documents with category_ids containing 7362849501
  ↓
  Concepts mentioned in those documents (via concept_ids)
```

**Key insight**: The relationship already exists through the catalog table!

---

## Approach 1: Store concept_ids on Categories (Redundant)

### Implementation

**Add field to categories table**:
```typescript
{
  id: 7362849501,
  category: "software engineering",
  concept_ids: [3842615478, 1829374562, 4920581736, ...]  // NEW FIELD
  // 100-200 concepts per category
}
```

**Population logic** (during rebuild):
```typescript
async function populateConceptIds(categoryId: number): Promise<number[]> {
  // Find all documents in this category
  const docs = await catalogTable.toArray()
    .filter(doc => {
      const categories: number[] = JSON.parse(doc.category_ids);
      return categories.includes(categoryId);
    });
  
  // Collect unique concepts from these documents
  const uniqueConcepts = new Set<number>();
  for (const doc of docs) {
    const concepts: number[] = JSON.parse(doc.concept_ids);
    concepts.forEach(id => uniqueConcepts.add(id));
  }
  
  return Array.from(uniqueConcepts);
}
```

### Query Implementation

```typescript
// Find concepts in category "software engineering"
const category = await categoriesTable.where(`id = 7362849501`).first();
const conceptIds: number[] = JSON.parse(category.concept_ids);
const concepts = await conceptsTable.where(`id IN [${conceptIds.join(',')}]`).toArray();

// Time: ~10ms
```

### Storage Impact

**Per category**:
- 100-200 concepts per category
- Each concept ID: ~10 digits = 10 bytes
- Total: ~1-2 KB per category

**50 categories**:
- Total: ~50-100 KB

**Context**: Database is ~700 MB  
**Impact**: 0.007-0.014% of database

### Pros
- ✅ Fast queries (~10ms)
- ✅ Pre-aggregated, no scanning

### Cons
- ❌ Redundant data (concepts already linked via catalog)
- ❌ Must recalculate during every rebuild
- ❌ Can become stale (if catalog changes)
- ❌ Another field to maintain
- ❌ Duplicate information (concept → catalog → category relationship already exists)

---

## Approach 2: Query-Time Computation (No Redundancy)

### Implementation

**NO new field on categories table**

**Query logic**:
```typescript
async function getConceptsInCategory(categoryId: number) {
  // Step 1: Find all documents in this category
  const docs = await catalogTable.toArray()
    .filter(doc => {
      const categories: number[] = JSON.parse(doc.category_ids);
      return categories.includes(categoryId);
    });
  
  // Step 2: Collect unique concepts from these documents
  const uniqueConceptIds = new Set<number>();
  for (const doc of docs) {
    const concepts: number[] = JSON.parse(doc.concept_ids);
    concepts.forEach(id => uniqueConceptIds.add(id));
  }
  
  // Step 3: Fetch concept details (if needed)
  const conceptIds = Array.from(uniqueConceptIds);
  const concepts = await conceptsTable
    .where(`id IN [${conceptIds.join(',')}]`)
    .toArray();
  
  return concepts;
}
```

### Performance Analysis

**Small library** (100 documents):
- Scan catalog: ~20ms
- Aggregate concepts: ~2ms
- Fetch concepts: ~5ms
- **Total**: ~27ms

**Medium library** (1,000 documents):
- Scan catalog: ~100ms
- Aggregate concepts: ~10ms
- Fetch concepts: ~20ms
- **Total**: ~130ms

**Large library** (10,000 documents):
- Scan catalog: ~500ms
- Aggregate concepts: ~50ms
- Fetch concepts: ~100ms
- **Total**: ~650ms

### Pros
- ✅ No redundancy (single source of truth)
- ✅ Always up-to-date (no staleness)
- ✅ Simpler schema (one less field)
- ✅ No maintenance during rebuild

### Cons
- ⚠️ Slower queries (~27-650ms depending on library size)
- ⚠️ Must scan catalog table

---

## Approach 3: Cached Query Results (Hybrid)

### Implementation

**CategoryIdCache enhancement** (in-memory only):

```typescript
class CategoryIdCache {
  // Add runtime cache
  private categoryConceptsCache = new Map<number, Set<number>>();
  
  async getConceptsForCategory(
    categoryId: number,
    catalogRepo: CatalogRepository
  ): Promise<number[]> {
    // Check cache first
    if (this.categoryConceptsCache.has(categoryId)) {
      return Array.from(this.categoryConceptsCache.get(categoryId)!);
    }
    
    // Compute (same as Approach 2)
    const docs = await catalogRepo.findByCategory(categoryId);
    const uniqueConcepts = new Set<number>();
    docs.forEach(doc => {
      doc.concept_ids.forEach(id => uniqueConcepts.add(id));
    });
    
    // Cache result
    this.categoryConceptsCache.set(categoryId, uniqueConcepts);
    
    return Array.from(uniqueConcepts);
  }
}
```

### Performance

**First query**: ~27-650ms (same as Approach 2)  
**Subsequent queries**: <1ms (cached in memory)

### Pros
- ✅ Fast after first query (<1ms)
- ✅ No database redundancy
- ✅ Always up-to-date (computed fresh)
- ✅ Memory efficient (~50-100 KB for all categories)

### Cons
- ⚠️ First query per category is slow
- ⚠️ Cache invalidated on application restart

---

## Recommendation

### Use Approach 2: Query-Time Computation ✅

**Rationale**:

**1. Performance is Acceptable**
- 27-130ms for small-medium libraries (vast majority)
- This is fast enough for user-facing queries
- Not a hot path (users don't search concepts by category constantly)

**2. No Redundancy**
- Relationships already exist: category → documents → concepts
- Storing concept_ids duplicates this information
- Single source of truth is better

**3. Always Accurate**
- Computed from current state
- No staleness issues
- No need to update during rebuild

**4. Simpler Schema**
- One less field on categories table
- Less code to maintain
- Cleaner design

**5. Can Add Caching Later**
- If performance becomes issue, add Approach 3
- Easy to add without schema changes
- Optimize when proven necessary

---

## Implementation

### Tool: concept_search with Category Filter

**MCP Tool**: `concept_search` (enhanced)

```typescript
{
  name: 'concept_search',
  params: {
    concept: string,           // Concept name to search
    category?: string,         // NEW: Optional category filter
    limit: number
  }
}
```

**Implementation**:
```typescript
async function conceptSearch(params: {
  concept?: string,
  category?: string,
  limit: number
}) {
  let conceptIds: number[];
  
  if (params.category) {
    // Search concepts by category
    const categoryId = categoryCache.getId(params.category);
    
    // Find documents in this category
    const docs = await catalogTable.toArray()
      .filter(doc => {
        const categories: number[] = JSON.parse(doc.category_ids);
        return categories.includes(categoryId);
      });
    
    // Collect unique concepts from these documents
    const uniqueConcepts = new Set<number>();
    docs.forEach(doc => {
      const concepts: number[] = JSON.parse(doc.concept_ids);
      concepts.forEach(id => uniqueConcepts.add(id));
    });
    
    conceptIds = Array.from(uniqueConcepts);
  } else if (params.concept) {
    // Search by concept name (existing functionality)
    const conceptId = conceptCache.getId(params.concept);
    conceptIds = [conceptId];
  }
  
  // Fetch concept details
  const concepts = await conceptRepo.findByIds(conceptIds.slice(0, params.limit));
  
  return {
    category: params.category,
    conceptCount: conceptIds.length,
    concepts: concepts.map(c => ({
      id: c.id,
      name: c.concept,
      type: c.concept_type,
      documentCount: c.catalog_ids.length
    }))
  };
}
```

### Alternative: New Tool

**MCP Tool**: `list_concepts_in_category`

```typescript
{
  name: 'list_concepts_in_category',
  description: 'List all concepts that appear in documents of a specific category',
  params: {
    category: string,  // Category name or ID
    limit: number      // Max concepts to return
  }
}
```

**Example Usage**:
```typescript
// User query: "What concepts appear in software engineering documents?"
list_concepts_in_category({ category: "software engineering", limit: 50 })

// Returns:
{
  category: "software engineering",
  documentCount: 47,
  conceptCount: 156,
  concepts: [
    { id: 3842615478, name: "API gateway", documentCount: 12 },
    { id: 1829374562, name: "microservices", documentCount: 23 },
    { id: 4920581736, name: "service mesh", documentCount: 8 },
    // ... top 50 concepts in this category
  ]
}
```

---

## Performance Benchmarks

### Query: "List concepts in software engineering"

**Approach 1** (stored concept_ids):
```
- Lookup category: 1ms
- Read concept_ids: 1ms
- Fetch concepts: 10ms
Total: 12ms
```

**Approach 2** (compute on-demand):
```
- Scan catalog (1000 docs): 100ms
- Aggregate concepts: 10ms
- Fetch concepts: 20ms
Total: 130ms
```

**Difference**: 10x slower BUT still fast (<150ms)

### Is 130ms Acceptable?

**Yes, for several reasons**:

1. **User-facing acceptable**: <200ms feels instant to users
2. **Not a hot path**: Occasional query, not every page load
3. **Can optimize later**: Add caching if needed
4. **Typical queries faster**: Most libraries <1000 docs = <50ms

---

## Decision Matrix

| Factor | Store concept_ids | Compute On-Demand | Winner |
|--------|-------------------|-------------------|--------|
| **Query speed** | Fast (~10ms) | Acceptable (~130ms) | Store |
| **Storage** | +50-100 KB | 0 bytes | Compute |
| **Redundancy** | Yes (duplicate info) | No (single truth) | Compute |
| **Maintenance** | Must update on rebuild | None | Compute |
| **Staleness risk** | Possible | None | Compute |
| **Schema complexity** | More fields | Simpler | Compute |
| **Implementation** | More code | Less code | Compute |

**Score**: Store (1/7) vs Compute (6/7)

**Winner**: **Compute on-demand** (Approach 2)

---

## Recommendation: Do NOT Add concept_ids to Categories ❌

### Rationale

**1. Not Necessary**
- Can query through catalog table (relationship exists)
- Performance acceptable (<150ms for typical libraries)
- Fast enough for user-facing queries

**2. Creates Redundancy**
- Duplicates existing relationships
- Concepts → documents → categories (already linked)
- Violates single source of truth principle

**3. Maintenance Burden**
- Must recalculate during every rebuild
- Risk of becoming stale
- Another field to validate and maintain

**4. Storage Not the Issue**
- 50-100 KB is small
- But the redundancy is problematic
- Optimization without clear benefit

### Instead: Implement Efficient Query

**Add to CatalogRepository**:
```typescript
class LanceDBCatalogRepository {
  /**
   * Get unique concepts that appear in documents of a category
   */
  async getConceptsInCategory(categoryId: number): Promise<number[]> {
    const docs = await this.findByCategory(categoryId);
    
    const uniqueConcepts = new Set<number>();
    docs.forEach(doc => {
      const concepts: number[] = JSON.parse(doc.concept_ids || '[]');
      concepts.forEach(id => uniqueConcepts.add(id));
    });
    
    return Array.from(uniqueConcepts);
  }
}
```

**Add MCP Tool**:
```typescript
server.tool(
  'list_concepts_in_category',
  'List all concepts appearing in documents of a specific category',
  {
    category: { type: 'string', description: 'Category name or ID' },
    limit: { type: 'number', default: 50 }
  },
  async (params) => {
    const categoryId = categoryCache.getIdByAlias(params.category) 
      || categoryCache.getId(params.category);
    
    // Query through catalog
    const conceptIds = await catalogRepo.getConceptsInCategory(categoryId);
    
    // Fetch concept details
    const concepts = await conceptRepo.findByIds(conceptIds.slice(0, params.limit));
    
    return {
      category: categoryCache.getName(categoryId),
      conceptCount: conceptIds.length,
      concepts: concepts.map(c => ({
        name: c.concept,
        type: c.concept_type,
        documentCount: c.catalog_ids.length
      }))
    };
  }
);
```

---

## Performance: Acceptable for All Library Sizes

### Query Performance by Library Size

| Library Size | Documents | Concepts | Query Time | User Experience |
|--------------|-----------|----------|------------|-----------------|
| Small | 10-100 | ~1K | 10-30ms | Instant |
| Medium | 100-1K | ~10K | 30-130ms | Fast |
| Large | 1K-10K | ~100K | 130-650ms | Acceptable |
| Very Large | 10K+ | ~1M | 650ms+ | Consider caching |

**For 95% of libraries** (small-medium): Query time is perfectly acceptable (<150ms)

### If Performance Becomes Issue

**Option 1**: Add in-memory caching (Approach 3)
- No schema changes
- Cache in CategoryIdCache
- First query slow, rest instant

**Option 2**: Consider storing then
- But only if proven necessary
- After measuring actual usage patterns
- With clear performance requirements

**Principle**: Don't optimize prematurely

---

## Comparison: Concepts vs Documents

### Similar Pattern: concept_count on Categories

**Categories table already has**:
```typescript
{
  concept_count: number  // How many unique concepts in this category
}
```

**This is stored** because:
- Used for statistics display
- Simple integer (4 bytes)
- No staleness issues (recalculated during rebuild)

**But concept_ids would be**:
- Used for queries (less frequent than stats)
- Large array (1-2 KB)
- Could become stale between rebuilds

**Different trade-offs** - count is worth storing, IDs are not

---

## Real-World Usage Patterns

### Primary Use Cases

**1. Browse categories** → list_categories tool
- Frequency: Common
- Needs: category names and stats
- Performance: Instant (cached)

**2. Find documents by category** → category_search tool
- Frequency: Common
- Needs: Direct query on catalog.category_ids
- Performance: Fast (O(n) scan)

**3. Find concepts in category** → NEW: list_concepts_in_category
- Frequency: Occasional
- Needs: Aggregate from catalog
- Performance: Acceptable (~130ms)

**For the occasional "list concepts" query**, 130ms is perfectly fine.

---

## Alternative: Reverse the Question

### Instead of "Concepts in Category"

**Ask**: "Which categories use this concept?"

```typescript
async function getCategoriesForConcept(conceptId: number) {
  // Find documents containing this concept
  const docs = await catalogTable.toArray()
    .filter(doc => {
      const concepts: number[] = JSON.parse(doc.concept_ids);
      return concepts.includes(conceptId);
    });
  
  // Collect unique categories
  const uniqueCategories = new Set<number>();
  docs.forEach(doc => {
    const categories: number[] = JSON.parse(doc.category_ids);
    categories.forEach(id => uniqueCategories.add(id));
  });
  
  return Array.from(uniqueCategories);
}
```

**This shows**: How a concept is used across different domains!

**Example**: Concept "optimization"
- Appears in: software engineering, healthcare, business, machine learning
- **Cross-domain utility** visible

**More interesting** than just "concepts in a category"

---

## Final Recommendation

### Do NOT Add concept_ids to Categories Table ❌

**Reasons**:
1. ✅ Not necessary (can query through catalog)
2. ✅ Performance acceptable (<150ms for most libraries)
3. ✅ Avoids redundancy (single source of truth)
4. ✅ Simpler schema (one less field)
5. ✅ Less maintenance (no recalculation needed)
6. ✅ Can optimize later if proven necessary

### Instead: Add Query Method

**Add to CatalogRepository**:
```typescript
async getConceptsInCategory(categoryId: number): Promise<number[]>
```

**Add MCP Tool**:
```typescript
list_concepts_in_category({ category, limit })
```

**Performance**: Acceptable for typical use

---

## Summary

### Question
> "Should we add concept_ids field to categories table?"

### Answer
**No, not necessary.**

### Why
- Can query through catalog table (relationship exists)
- Performance acceptable without storage (~130ms)
- Avoids redundancy and maintenance burden
- Simpler schema is better
- Can add caching later if needed

### Implementation
- Add repository method for querying
- Add MCP tool for user access
- No schema changes required

---

## Implementation Added to Plan ✅

Based on this analysis, the following has been added to the implementation plan:

### New MCP Tool

**`list_concepts_in_category`** - See [05-category-search-tool.md](./05-category-search-tool.md)

**Usage**:
```typescript
list_concepts_in_category({ 
  category: "software engineering", 
  sortBy: "documentCount",
  limit: 50 
})
```

**Returns**: Top 50 concepts in software engineering documents

### New Repository Method

**`CatalogRepository.getConceptsInCategory(categoryId)`** - See [04-code-locations-map.md](./04-code-locations-map.md)

**Implementation**: Query documents by category, aggregate unique concepts

**Performance**: ~30-130ms (acceptable)

### No Schema Changes

**Categories table does NOT get concept_ids field**

**Rationale**: Query-based approach is sufficient, avoids redundancy

---

**Status**: ✅ Analysis complete, implementation added to plan  
**Decision**: Do NOT add concept_ids to categories table  
**Alternative**: Query through catalog + new MCP tool (sufficient)  
**Added**: list_concepts_in_category tool to Phase 5  
**Date**: 2025-11-19

