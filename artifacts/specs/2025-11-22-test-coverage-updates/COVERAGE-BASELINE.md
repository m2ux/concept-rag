# Test Coverage Baseline Analysis

**Date:** 2025-11-21  
**Status:** Baseline Assessment  
**Task:** Task 1.2 - Run baseline coverage report to identify gaps

## Current Test Status

### Test Count
- **Total Tests:** 120 (119 passing, 1 pre-existing failure)
- **Unit Tests:** 50 tests
  - field-parsers.test.ts: 14 tests
  - simple-embedding-service.test.ts: 9 tests
  - conceptual-hybrid-search-service.test.ts: 18 tests (NEW)
  - concept-search.test.ts: 9 tests
- **Integration Tests:** 70 tests
  - Repository integration tests: 50 tests
  - Concept search regression tests: 20 tests

### Test Execution
- **Unit test execution time:** < 50ms (very fast)
- **Integration test execution time:** ~35 seconds
- **Total test suite time:** ~35 seconds

## Coverage Analysis

### Files with Tests ✅

1. **Infrastructure Layer:**
   - `src/infrastructure/lancedb/utils/field-parsers.ts` - ✅ 14 tests
   - `src/infrastructure/embeddings/simple-embedding-service.ts` - ✅ 9 tests
   - `src/infrastructure/search/conceptual-hybrid-search-service.ts` - ✅ 18 tests (NEW)

2. **Tools Layer:**
   - `src/tools/operations/concept-search.ts` - ✅ 9 tests

3. **Repositories (Integration):**
   - `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts` - ✅ 13 integration tests
   - `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts` - ✅ 20 integration tests
   - `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts` - ✅ 17 integration tests

### Files Needing Tests ⚠️

#### Domain Services (High Priority)
1. **`src/domain/services/catalog-search-service.ts`** - ❌ No tests
   - Service for catalog search operations
   - Should have unit tests with mocks

2. **`src/domain/services/chunk-search-service.ts`** - ❌ No tests
   - Service for chunk search operations
   - Should have unit tests with mocks

3. **`src/domain/services/concept-search-service.ts`** - ❌ No tests
   - Service for concept search operations
   - Should have unit tests with mocks

#### Infrastructure Services
4. **`src/infrastructure/search/scoring-strategies.ts`** - ❌ No tests
   - Core scoring algorithms (vector, BM25, title, concept, WordNet)
   - Critical for search quality
   - Should have comprehensive unit tests

5. **`src/concepts/query_expander.ts`** - ❌ No tests
   - Query expansion logic
   - WordNet and corpus expansion
   - Should have unit tests

6. **`src/concepts/concept_extractor.ts`** - ❌ No tests
   - Concept extraction from text
   - Should have unit tests

7. **`src/concepts/concept_enricher.ts`** - ❌ No tests
   - Concept enrichment logic
   - Should have unit tests

8. **`src/concepts/concept_chunk_matcher.ts`** - ❌ No tests
   - Matching concepts to chunks
   - Should have unit tests

#### Application Layer
9. **`src/application/container.ts`** - ❌ No tests
   - Dependency injection container
   - Should have integration tests for DI wiring

#### Document Loaders
10. **`src/infrastructure/document-loaders/pdf-loader.ts`** - ❌ No tests
11. **`src/infrastructure/document-loaders/epub-loader.ts`** - ❌ No tests
12. **`src/infrastructure/document-loaders/markdown-loader.ts`** - ❌ No tests
13. **`src/infrastructure/document-loaders/txt-loader.ts`** - ❌ No tests
14. **`src/infrastructure/document-loaders/document-loader-factory.ts`** - ❌ No tests

#### Cache Services
15. **`src/infrastructure/cache/concept-id-cache.ts`** - ❌ No tests
16. **`src/infrastructure/cache/category-id-cache.ts`** - ❌ No tests

#### Utilities
17. **`src/infrastructure/utils/*`** - ❌ Need to check what utilities exist

#### MCP Tools (Contract Tests Needed)
18. **`src/tools/operations/catalog-search.ts`** - ⚠️ Needs contract tests
19. **`src/tools/operations/chunks-search.ts`** - ⚠️ Needs contract tests
20. **`src/tools/operations/broad-chunks-search.ts`** - ⚠️ Needs contract tests
21. **`src/tools/operations/concept-search.ts`** - ✅ Has tests, but needs contract tests
22. **`src/tools/operations/extract-concepts.ts`** - ⚠️ Needs contract tests
23. **`src/tools/operations/category-search.ts`** - ⚠️ Needs contract tests
24. **`src/tools/operations/list-categories.ts`** - ⚠️ Needs contract tests
25. **`src/tools/operations/list-concepts-in-category.ts`** - ⚠️ Needs contract tests

## Priority Recommendations

### Priority 1: Core Search Logic (HIGH)
1. **scoring-strategies.ts** - Critical for search quality
   - Test all scoring functions
   - Test edge cases (empty inputs, null values)
   - Test score normalization

2. **query_expander.ts** - Critical for search quality
   - Test query expansion logic
   - Test WordNet integration
   - Test corpus expansion

### Priority 2: Domain Services (HIGH)
3. **catalog-search-service.ts** - Core domain logic
4. **chunk-search-service.ts** - Core domain logic
5. **concept-search-service.ts** - Core domain logic

### Priority 3: Concept Processing (MEDIUM)
6. **concept_extractor.ts** - Concept extraction
7. **concept_enricher.ts** - Concept enrichment
8. **concept_chunk_matcher.ts** - Concept matching

### Priority 4: Infrastructure (MEDIUM)
9. **Document loaders** - File processing
10. **Cache services** - Performance critical
11. **Application container** - DI wiring

### Priority 5: Contract Tests (MEDIUM)
12. **All MCP tools** - API contract validation

## Estimated Coverage Gaps

Based on file analysis:
- **Domain services:** ~0% coverage (3 services, 0 tests)
- **Scoring strategies:** ~0% coverage (critical file, 0 tests)
- **Query expansion:** ~0% coverage (critical file, 0 tests)
- **Concept processing:** ~0% coverage (3 files, 0 tests)
- **Document loaders:** ~0% coverage (4 loaders, 0 tests)
- **MCP tools:** ~11% coverage (1 of 8 tools has tests, needs contract tests)

## Next Steps

1. ✅ **Completed:** Unit tests for ConceptualHybridSearchService
2. **Next:** Unit tests for scoring-strategies.ts
3. **Then:** Unit tests for query_expander.ts
4. **Then:** Unit tests for domain search services
5. **Finally:** Contract tests for MCP tools

## Notes

- Coverage reporting is configured but summary output may need investigation
- One pre-existing test failure (case sensitivity in integration test) - not blocking
- Test infrastructure is solid with good mock helpers available
- Integration tests provide good coverage of repository layer

---

**Next Action:** Create unit tests for scoring-strategies.ts (highest priority)

