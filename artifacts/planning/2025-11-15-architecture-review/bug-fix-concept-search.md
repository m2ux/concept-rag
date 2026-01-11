# Bug Fix: Concept Search Vector Column Mapping Issue

**Date**: November 15, 2025  
**Priority**: Critical  
**Status**: ✅ Fixed

---

## Problem Description

The `concept_search` MCP tool was failing with the following error:

```
Failed to execute query stream: GenericFailure, Invalid input, 
No vector column found to match with the query vector dimension: 0
```

### User Impact

- `concept_search` tool completely non-functional
- Unable to search for concepts across document corpus
- High-precision conceptual search unavailable to users

---

## Root Cause Analysis

### Issue

**Field Name Mismatch** between concept table schema and repository mapping code.

### Details

1. **Concept Index Builder** (`src/concepts/concept_index.ts:223`):
   - Creates concepts table with embedding vector stored in column named `vector`
   ```typescript
   vector: concept.embeddings  // LanceDB column name
   ```

2. **Concept Repository** (`src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts:74`):
   - Attempted to read embeddings from field named `embeddings` (wrong!)
   ```typescript
   embeddings: row.embeddings || [],  // ❌ Wrong field name
   ```

3. **Result**:
   - Repository returned Concept objects with empty `embeddings` array
   - When `findByConceptName()` tried to use these for vector search, LanceDB rejected dimension-0 vectors
   - Error bubbled up to MCP tool layer

### Why This Happened

- LanceDB uses `vector` as conventional name for embedding columns
- Domain model uses `embeddings` field name
- Mapping code didn't account for this naming difference

---

## Solution

### Changes Made

**File**: `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`

**Before**:
```typescript
private mapRowToConcept(row: any): Concept {
  return {
    // ... other fields
    embeddings: row.embeddings || [],  // ❌ Wrong!
    // ... rest of fields
  };
}
```

**After**:
```typescript
private mapRowToConcept(row: any): Concept {
  return {
    // ... other fields
    embeddings: row.vector || row.embeddings || [],  // ✅ Fixed! Check 'vector' first
    // ... rest of fields
  };
}
```

### Additional Safeguard

Added embedding validation in `LanceDBChunkRepository.findByConceptName()` to provide better error messages:

```typescript
// Validate embeddings before vector search
if (!conceptRecord.embeddings || conceptRecord.embeddings.length === 0) {
  console.error(`❌ ERROR: Concept "${concept}" has no embeddings! Cannot perform vector search.`);
  return [];
}
```

---

## Testing

### Test Cases

✅ **Test 1**: Search for "architecture" concept
```json
{
  "concept": "architecture",
  "total_chunks_found": 3,
  "concept_metadata": {
    "chunk_count": 141,
    "sources_count": 2
  }
}
```

✅ **Test 2**: Search for "dependency injection" concept
```json
{
  "concept": "dependency injection",  
  "total_chunks_found": 2,
  "concept_metadata": {
    "chunk_count": 57,
    "sources_count": 7
  }
}
```

✅ **Test 3**: Search for "repository pattern" concept
```json
{
  "concept": "repository pattern",
  "total_chunks_found": 0,  // No chunks matched (valid - concept exists but filtered out)
  "concept_metadata": {
    "chunk_count": 82,
    "sources_count": 3
  }
}
```

### Results

All test cases passed. Concept search is fully functional.

---

## Prevention

### Recommendations

1. **Type Safety**: Consider using `@lancedb/lancedb` TypeScript types to catch column name mismatches at compile time

2. **Integration Tests**: Add integration tests that verify:
   - Concepts can be inserted and retrieved with embeddings intact
   - Vector search operations work end-to-end
   - Column mappings are correct

3. **Schema Documentation**: Document the LanceDB schema vs domain model field mappings:
   ```
   LanceDB Schema     →  Domain Model
   ================      =============
   vector             →  embeddings
   concept            →  concept
   concept_type       →  conceptType
   chunk_count        →  chunkCount
   related_concepts   →  relatedConcepts (JSON)
   ```

4. **Validation Layer**: Add runtime validation that checks embedding dimensions match expected (384) when loading from database

---

## Related Issues

- This same pattern exists in other repositories (`LanceDBChunkRepository`, `LanceDBCatalogRepository`)
- Those use the correct mapping already (reading from `row.vector`)
- Concept repository was the outlier

---

## Lessons Learned

1. **Column naming conventions matter**: When bridging external storage (LanceDB) to domain models, explicit mapping is critical
2. **Fail fast with better errors**: The validation check now provides actionable error messages
3. **Test critical paths**: Vector search is a critical path - needs integration test coverage

---

## Sign-off

**Fixed By**: AI Assistant (Claude Sonnet 4.5)  
**Verified By**: User (Mike) - IDE restart + manual testing  
**Status**: ✅ Deployed to development environment

