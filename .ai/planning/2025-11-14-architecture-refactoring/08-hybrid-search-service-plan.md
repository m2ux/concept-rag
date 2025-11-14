# HybridSearchService Extraction Plan

**Date**: November 14, 2025  
**Enhancement**: #2 from Optional Enhancements Roadmap  
**Status**: In Progress

---

## Overview

Extract hybrid search logic from `ConceptualSearchClient` into a dedicated `HybridSearchService` that follows Clean Architecture principles and integrates with the repository pattern.

---

## Current State Analysis

### What Exists Now

1. **ConceptualSearchClient** (`src/lancedb/conceptual_search_client.ts`):
   - Contains all hybrid scoring logic
   - 5 scoring signals: vector, BM25, title, concept, WordNet
   - Query expansion via QueryExpander
   - NOT integrated with clean architecture

2. **Repositories** (`src/infrastructure/lancedb/repositories/`):
   - Currently do **basic vector search only**
   - Have TODOs referencing future hybrid search integration
   - Return SearchResult with only vectorScore populated

3. **Tools**:
   - `catalog_search` - uses CatalogRepository (basic search)
   - `broad_chunks_search` - uses ChunkRepository (basic search)
   - Both have comments: "Full hybrid search will be integrated in Phase 3"

### The Problem

- Hybrid search logic is **not reusable** across repositories
- Scoring algorithms are **tightly coupled** to ConceptualSearchClient
- Repositories can't leverage the powerful multi-signal ranking
- Not testable in isolation

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                        │
├─────────────────────────────────────────────────────────┤
│  interface HybridSearchService {                        │
│    search(table, query, limit, debug): SearchResult[]   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ implements
                          │
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                    │
├─────────────────────────────────────────────────────────┤
│  class ConceptualHybridSearchService                    │
│    implements HybridSearchService {                     │
│                                                         │
│    constructor(                                         │
│      conceptRepo: ConceptRepository,                    │
│      embeddingService: EmbeddingService,                │
│      queryExpander: QueryExpander                       │
│    )                                                    │
│                                                         │
│    // Scoring Strategies:                              │
│    - vectorScore()                                      │
│    - bm25Score()                                        │
│    - titleScore()                                       │
│    - conceptScore()                                     │
│    - wordnetScore()                                     │
│    - hybridRank()                                       │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ injected into
                          │
┌─────────────────────────────────────────────────────────┐
│              Repository Implementations                 │
├─────────────────────────────────────────────────────────┤
│  LanceDBCatalogRepository                               │
│    - Uses HybridSearchService for catalog search       │
│                                                         │
│  LanceDBChunkRepository                                 │
│    - Uses HybridSearchService for chunk search         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Create Domain Interface
**File**: `src/domain/interfaces/services/hybrid-search-service.ts`

Create interface for hybrid search with:
- `search()` method for full hybrid search
- Support for debug mode
- Returns enriched SearchResult[]

**Effort**: 5 minutes

---

### Task 2: Create Scoring Strategies Module
**File**: `src/infrastructure/search/scoring-strategies.ts`

Extract individual scoring functions:
- `calculateVectorScore(distance)`
- `calculateBM25Score(terms, weights, docText, docSource)`
- `calculateTitleScore(terms, source)`
- `calculateConceptScore(expandedQuery, result)`
- `calculateWordNetScore(wordnetTerms, docText)`
- `calculateHybridScore(scores)` - weighted combination

**Effort**: 15 minutes

---

### Task 3: Create HybridSearchService Implementation
**File**: `src/infrastructure/search/conceptual-hybrid-search-service.ts`

Implement service that:
1. Takes a LanceDB table, query, limit, debug flag
2. Expands query using QueryExpander
3. Performs vector search
4. Applies all 5 scoring strategies
5. Re-ranks by hybrid score
6. Returns enriched SearchResult[]

**Dependencies**:
- ConceptRepository (for concept lookups)
- EmbeddingService (for query vectors)
- QueryExpander (for query expansion)

**Effort**: 20 minutes

---

### Task 4: Update SearchResult Model
**File**: `src/domain/models/search-result.ts`

Add optional fields for debugging:
```typescript
matchedConcepts?: string[];
expandedTerms?: string[];
```

Already exists, just verify completeness.

**Effort**: 2 minutes

---

### Task 5: Update CatalogRepository to Use Service
**File**: `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`

Inject and use HybridSearchService:
1. Add `hybridSearchService` to constructor
2. Replace basic vector search with `hybridSearchService.search()`
3. Remove comment about "Phase 3"

**Effort**: 5 minutes

---

### Task 6: Update ChunkRepository to Use Service
**File**: `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`

Same as Task 5 but for chunks table.

**Effort**: 5 minutes

---

### Task 7: Wire Service in ApplicationContainer
**File**: `src/application/container.ts`

1. Instantiate QueryExpander
2. Instantiate ConceptualHybridSearchService
3. Inject into repositories

**Effort**: 10 minutes

---

### Task 8: Update Domain Interface Exports
**Files**:
- `src/domain/interfaces/services/index.ts`
- `src/infrastructure/search/index.ts` (create)

Add barrel exports for new service.

**Effort**: 2 minutes

---

### Task 9: Test with Live Integration
**File**: `test-live-integration.ts` (already exists)

Run live tests to verify:
- `catalog_search` uses hybrid scoring
- `broad_chunks_search` uses hybrid scoring
- All 5 scores populated correctly
- Query expansion works
- Debug mode works

**Effort**: 5 minutes

---

### Task 10: (Optional) Deprecate ConceptualSearchClient
**File**: `src/lancedb/conceptual_search_client.ts`

Add deprecation notice. Keep file for now in case direct usage exists elsewhere.

**Effort**: 2 minutes

---

## Benefits

✅ **Reusable**: Single implementation shared across all repositories  
✅ **Testable**: Can be tested in isolation with mock dependencies  
✅ **Consistent**: Same scoring logic everywhere  
✅ **Maintainable**: Changes in one place affect all usages  
✅ **Clean Architecture**: Follows Dependency Inversion Principle  
✅ **Performance**: No degradation, same algorithms  

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Break existing functionality | Live integration tests catch issues |
| Performance regression | Same algorithms, no extra overhead |
| Complex refactor | Step-by-step with validation |

**Overall Risk**: Low

---

## Estimated Effort

| Phase | Time (Agentic) |
|-------|----------------|
| Planning (this doc) | 10 minutes |
| Implementation (10 tasks) | 70 minutes |
| Testing & Validation | 10 minutes |
| **Total** | **~1.5 hours** |

---

## Success Criteria

✅ HybridSearchService interface created  
✅ Scoring strategies extracted and modular  
✅ Service implementation complete  
✅ Repositories use service  
✅ ApplicationContainer wires dependencies  
✅ All 37 existing tests still pass  
✅ Live integration tests pass with hybrid scores  
✅ Debug mode works  
✅ No performance regression  

---

## Implementation Order

1. Domain interface (Task 1)
2. Scoring strategies (Task 2)
3. Service implementation (Task 3)
4. Update SearchResult if needed (Task 4)
5. Update repositories (Tasks 5-6)
6. Wire in container (Task 7)
7. Export barrel files (Task 8)
8. Test (Task 9)
9. Deprecate old client (Task 10)

**Each task ends with a git commit for incremental progress.**

---

**Status**: Ready to implement  
**Next Step**: Execute Task 1

