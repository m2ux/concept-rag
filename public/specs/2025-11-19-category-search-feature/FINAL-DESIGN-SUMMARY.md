# Final Design Summary: Categories on Documents

**Date**: 2025-11-19  
**Status**: Finalized and ready for implementation  
**Model**: Documents have categories, concepts are category-agnostic

## Core Design (Corrected)

### The Right Model

**Documents (Catalog Entries) Have Categories**:
```typescript
CatalogEntry {
  concept_ids: number[],      // Concepts mentioned
  category_ids: number[]      // Categories this document belongs to
}
```

**Concepts Are Category-Agnostic**:
```typescript
Concept {
  id: number,                 // hash-based
  concept: string,
  // NO category field!
  catalog_ids: number[]       // Documents containing this concept (across all categories)
}
```

**Categories Define Domains**:
```typescript
Category {
  id: number,                 // hash-based
  category: string,
  description: string,
  // ... metadata
}
```

---

## Key Principles

1. **Hash-Based IDs**: FNV-1a 32-bit for perfect stability
2. **Documents Own Categories**: Stored on catalog/chunks tables
3. **Concepts Cross-Domain**: No category affiliation
4. **Direct Storage**: Categories stored, not derived
5. **Simple Queries**: Direct filter on category_ids field

---

## Schema Summary

### Categories Table (11 fields)
- id, category, description
- parentCategoryId, aliases, relatedCategories
- document_count, chunk_count, concept_count
- embeddings

### Catalog Table (adds 9 fields)
- concept_ids (hash-based integers)
- **category_ids (hash-based integers, STORED)**
- filename_tags (extracted)
- origin_hash, author, year, publisher, isbn (reserved)

### Chunks Table (adds 2 fields)
- concept_ids (hash-based integers)
- **category_ids (inherited from parent)**

### Concepts Table (NO categories)
- id (hash-based)
- concept, concept_type
- catalog_ids (hash-based integers)
- NO category field!

---

## Category Search Implementation

### Direct Query (Simple)

```typescript
// Find documents in "software engineering"
const categoryId = hashToId("software engineering");

const docs = catalogTable.filter(doc => {
  const categories: number[] = JSON.parse(doc.category_ids);
  return categories.includes(categoryId);
});
```

**No derivation, no reverse index, just direct filtering!**

---

## What Changed During Planning

### Initial (Wrong) Design
- Concepts had category_id field
- Documents derived categories from concepts
- Complex CategoryIdCache with reverse index
- Category derivation methods

### Final (Correct) Design
- **Documents have category_ids field (stored)**
- **Concepts have NO categories**
- Simple CategoryIdCache (ID ↔ name only)
- Direct category queries

### Why Corrected Model Is Better
1. ✅ Concepts reusable across domains ("optimization" in software, healthcare, business, ML)
2. ✅ Much simpler implementation (~300 lines removed)
3. ✅ Direct queries (no derivation complexity)
4. ✅ Matches reality (books are ABOUT categories, concepts APPEAR IN books)

---

## CategoryIdCache (Simplified)

### What It Does
- ID ↔ name mapping (bidirectional)
- Alias resolution ("ML" → "machine learning")
- Metadata access (descriptions, statistics)
- Hierarchy traversal

### What It Does NOT Do
- ❌ No reverse index (category → concepts)
- ❌ No category derivation
- ❌ No concept-to-category lookups

**Much simpler!**

---

## Implementation Checklist

### Phase 0: Preparation (~15 min)
- [ ] Backup database
- [ ] Extract current categories
- [ ] Create hash function utility

### Phase 0.5: Test on Sample-Docs (~30-45 min) 🛑
- [ ] Build test database
- [ ] Validate hash IDs stable
- [ ] Test category storage on catalog
- [ ] Verify concepts have NO categories
- [ ] Test category search (direct queries)
- [ ] **GET USER APPROVAL**

### Phase 1: Infrastructure (~20-30 min)
- [ ] Create Category model
- [ ] Create CategoryRepository
- [ ] Create CategoryIdCache (simplified)
- [ ] Update validators

### Phase 2: Categories Table (~20-30 min)
- [ ] Extract unique categories
- [ ] Generate hash IDs
- [ ] Create categories table
- [ ] Populate metadata

### Phase 3: Ingestion (~30-40 min)
- [ ] Update hybrid_fast_seed.ts
- [ ] Store category_ids on catalog (hash-based)
- [ ] Store category_ids on chunks (inherited)
- [ ] Concepts: NO category field

### Phase 4: Repositories (~20-30 min)
- [ ] Update CatalogRepository (findByCategory)
- [ ] Update ChunkRepository
- [ ] ConceptRepository: no category methods needed

### Phase 5: Tools (~20-25 min)
- [ ] Implement category_search tool
- [ ] Implement list_categories tool
- [ ] Implement list_concepts_in_category tool
- [ ] Add getConceptsInCategory() to CatalogRepository
- [ ] Register all tools in MCP server

### Phase 6: Testing (~30-40 min)
- [ ] CategoryIdCache tests
- [ ] Repository tests
- [ ] Integration tests
- [ ] Tool tests

### Phase 7: Main DB Migration (~20-30 min) 🛑
- [ ] Backup main database
- [ ] **GET USER CONFIRMATION**
- [ ] Execute migration
- [ ] Validate results
- [ ] **GET FINAL APPROVAL**

**Total Agent Work**: ~3-4 hours  
**Plus**: Database rebuild time + user approval waits

---

## Success Criteria

✅ Hash-based IDs stable across rebuilds  
✅ Categories stored on catalog/chunks  
✅ Concepts have NO categories  
✅ Category search returns correct documents  
✅ All tests pass  
✅ Storage reduced 50-60%  
✅ Performance improved 2-3x  

---

**Status**: ✅ Design finalized and documents updated  
**Model**: Documents have categories, concepts are cross-domain  
**Ready**: For implementation to begin  
**Date**: 2025-11-19

