# Empty Chunk Results Investigation - Summary

**Date**: 2025-11-17  
**Status**: ✅ **ROOT CAUSE IDENTIFIED**  
**Severity**: 🔴 **HIGH - Affects all concept searches**

---

## What We Found

### The Problem
When searching for the concept **"exaptive bootstrapping"**:
- Concept table shows: **9 chunks** exist
- Search returns: **0 chunks**

### The Root Cause
The `findByConceptName()` method uses **vector search with concept embeddings**, which fails because:

1. **Concept embeddings** = Short phrase vectors (e.g., "exaptive bootstrapping")
2. **Chunk embeddings** = Full paragraph vectors (100-500 words)
3. **Vector search** = Finds semantically similar embeddings

❌ **Problem**: A paragraph ABOUT "exaptive bootstrapping" is NOT semantically similar to the PHRASE "exaptive bootstrapping"

Result: Vector search returns **completely unrelated chunks** (TypeScript docs, SQL code) instead of the actual chunks containing the concept.

---

## Evidence

### ✅ Data is Correct
- Concept exists in concepts table ✓
- 9 chunks are properly enriched with "exaptive bootstrapping" ✓
- Chunks contain the term in their text ✓
- Concepts field is properly formatted ✓

### ❌ Search Algorithm is Broken
- Vector search returns 20 candidates: **0 from the target document**
- All candidates are from unrelated documents (TypeScript, Blockchain, SQL)
- Filtering finds 0 matches because none of the candidates contain the concept
- Manual scan of all chunks finds the 9 correct chunks immediately

---

## The Fix

### Recommended: Direct Field Filtering (Not Vector Search)

**Current (Broken)**:
```typescript
// Uses vector search → wrong chunks
const candidates = await this.chunksTable
  .vectorSearch(conceptRecord.embeddings)
  .limit(limit * 3)
  .toArray();
```

**Fixed (Correct)**:
```typescript
// Directly filter by concepts field → right chunks
const allChunks = await this.chunksTable.query().limit(100000).toArray();
const matches = allChunks.filter(chunk =>
  chunk.concepts.includes(conceptName)
);
```

---

## Impact

### Affected
- **ALL concept searches** in the system
- Severity varies by concept type:
  - 🔴 **High**: Abstract concepts ("exaptive bootstrapping", "ideality index")
  - 🟡 **Medium**: Common terms ("API", "interface")  
  - 🟢 **Low**: Very specific terms ("React.useState")

### Not Affected
- Catalog search (uses different algorithm)
- Broad chunks search (uses hybrid search with text matching)
- Chunk enrichment (correct)
- Concept extraction (correct)

---

## Next Steps

1. **Implement the fix** in `LanceDBChunkRepository.findByConceptName()`
2. **Test with "exaptive bootstrapping"** - should return 9 chunks
3. **Test with other concepts** - verify broader fix works
4. **Consider long-term solution**: Build inverted index for O(1) concept lookups

---

## Files

All investigation materials in: `.engineering/artifacts/planning/2025-11-17-empty-chunk-investigation/`

- `INVESTIGATION_REPORT.md` - Full detailed analysis
- `investigate_empty_chunks.ts` - Initial investigation
- `check_catalog.ts` - Data integrity check
- `check_chunk_enrichment.ts` - Enrichment verification  
- `test_search_logic.ts` - Search algorithm debugging

---

## Conclusion

This is a **search algorithm bug**, not a data integrity issue. The data is perfect; we just need to change HOW we search for it. Once fixed, concept search will work correctly for all concepts.

**Good news**: This is a straightforward fix with clear test criteria.









