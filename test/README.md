# Test Suite Documentation

This document provides a comprehensive reference for all tests in the concept-rag project.

## Running Tests

```bash
# Run all tests
npm test

# Run specific test category
npm test -- src/__tests__/e2e/          # E2E tests
npm test -- src/__tests__/integration/  # Integration tests
npm test -- --grep "property"           # Property tests

# Run with coverage
npm test -- --coverage
```

---

## Table of Contents

1. [E2E Tests](#e2e-tests)
2. [Integration Tests](#integration-tests)
3. [Unit Tests](#unit-tests)
   - [Tool Operations](#tool-operations)
   - [Domain Services](#domain-services)
   - [Infrastructure: Resilience](#infrastructure-resilience)
   - [Infrastructure: Cache](#infrastructure-cache)
   - [Infrastructure: Search](#infrastructure-search)
   - [Infrastructure: Document Loaders](#infrastructure-document-loaders)
   - [Infrastructure: Embeddings](#infrastructure-embeddings)
   - [Infrastructure: Utils](#infrastructure-utils)
   - [Concepts Module](#concepts-module)
   - [Domain Validation](#domain-validation)
4. [Property Tests](#property-tests)

---

## E2E Tests

End-to-end tests validate complete system behavior under realistic conditions.

**Location**: `src/__tests__/e2e/`

### Bulkhead Under Load (`bulkhead-under-load.e2e.test.ts`)

Tests bulkhead pattern under realistic concurrent load.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should limit concurrent operations and queue overflow properly` | maxConcurrent: 5, maxQueue: 10, 20 concurrent operations | 15 successful, 5 rejected (BulkheadRejectionError) | Verify concurrency limits and queue management |
| `should handle sustained concurrent load without resource exhaustion` | 100 operations, maxConcurrent: 10, maxQueue: 20 | >80% success rate, bulkhead empty after completion | Test sustained load handling |
| `should allow operations to complete as slots become available` | 8 operations, maxConcurrent: 3, 1s delay | All 8 succeed, duration 2.5-4s | Verify slot release and queuing |
| `should track utilization metrics accurately` | 12 operations, maxConcurrent: 5, maxQueue: 5 | Metrics show 2 rejections, utilization tracked | Verify metrics accuracy |
| `should protect multiple resource pools independently` | 2 bulkheads: LLM (3+2), Embedding (5+5) | LLM: 5 success/5 reject, Embedding: 10 success/5 reject | Verify bulkhead isolation |

### Cache Performance (`cache-performance.e2e.test.ts`)

Tests real-world caching performance and effectiveness.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should demonstrate cache hit rate >60% on repeated queries` | 5 common queries, 2 passes | >30% improvement on second pass | Verify cache effectiveness |
| `should maintain performance under realistic query patterns` | 100 queries (70% repeated) | >50% estimated hit rate | Test realistic usage patterns |
| `should cache embeddings for repeated texts` | Same query executed twice | Second execution faster | Verify embedding cache |
| `should expire search results after TTL` | Query with TTL | Immediate repeat is faster | Verify TTL behavior |
| `should handle concurrent queries efficiently` | 50 parallel queries | All complete, <200ms avg | Verify concurrent access |
| `should perform well under realistic usage patterns` | 200 mixed operations | <50ms avg, >20 ops/sec | Validate real-world performance |

### Document Pipeline Resilience (`document-pipeline-resilience.e2e.test.ts`)

Tests full document ingestion pipeline with resilience patterns.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should process document successfully with all services healthy` | 10 chunks | All chunks processed with concepts, embeddings, storage | Verify healthy pipeline |
| `should handle LLM failures with circuit breaker while continuing other stages` | 15 chunks, LLM fails after 5 | 5 with concepts, 15 with embeddings and storage | Test graceful degradation |
| `should handle concurrent chunk processing with bulkhead protection` | 25 chunks concurrently | >60% success rate | Verify concurrent processing |
| `should recover and continue processing when services recover` | 20 chunks, service failure/recovery | Pipeline recovers after service restoration | Test recovery behavior |
| `should provide comprehensive health summary across pipeline` | Various service states | Health summary reflects actual state | Verify health monitoring |
| `should maintain service isolation when one service is slow` | LLM 2s delay, others 50ms | All complete, services isolated | Test service isolation |

### LLM Circuit Breaker (`llm-circuit-breaker.e2e.test.ts`)

Tests full circuit breaker lifecycle with simulated LLM service.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should protect against sustained LLM failures and recover automatically` | 5 failure threshold, 2 success threshold | Cycles through closed→open→half-open→closed | Full lifecycle test |
| `should handle intermittent failures without opening circuit` | Alternating success/failure | Circuit stays closed | Verify intermittent handling |
| `should track metrics accurately through full cycle` | Various operations | Accurate request/success/failure/rejection counts | Verify metrics |

### Real Service Integration (`real-service-integration.e2e.test.ts`)

Tests actual production integration of resilience features.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should create ResilientExecutor before initializing services` | ApplicationContainer | executor and retryService defined | Verify early initialization |
| `should verify resilience is configured with production profiles` | Test operation through executor | Operation executes, metrics tracked | Verify configuration |
| `should verify services work without resilientExecutor (backward compatible)` | Service without executor | Service creates successfully | Backward compatibility |
| `should verify services work with resilientExecutor (enhanced)` | Service with executor | Service creates successfully | Enhanced mode |

---

## Integration Tests

Integration tests verify cross-component workflows with real database interactions.

**Location**: `src/__tests__/integration/`

### Application Container (`application-container.integration.test.ts`)

Tests composition root and dependency injection wiring.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should initialize container with database connection` | Test database | Container initialized without error | Verify initialization |
| `should register all base tools` | - | ≥5 tools including concept_search, catalog_search, chunks_search, broad_chunks_search, extract_concepts | Verify tool registration |
| `should register category tools when categories table exists` | Categories table | category_search, list_categories, list_concepts_in_category registered | Verify optional tools |
| `should return [tool] tool` | Tool name | Tool returned with correct name | Verify getTool() |
| `should throw error for non-existent tool` | 'nonexistent_tool' | Throws 'Tool not found: nonexistent_tool' | Verify error handling |
| `should execute [tool] tool` | Query parameters | Result defined, isError=false | Verify tool execution |
| `should wire all tools with proper dependencies` | Tool names | All tools execute successfully | Verify wiring |

### Repository Integration Tests

**Catalog Repository** (`catalog-repository.integration.test.ts`)
**Chunk Repository** (`chunk-repository.integration.test.ts`)
**Concept Repository** (`concept-repository.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| Repository CRUD operations | Various entities | Correct storage/retrieval | Verify repository pattern |
| Search operations | Query parameters | Relevant results returned | Verify search functionality |
| Relationship queries | Entity relationships | Correct associations | Verify data relationships |

### Resilience Integration (`resilience-integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should create ResilientExecutor and RetryService before database connection` | ApplicationContainer | Container defined | Verify early creation |
| `should use ResilientExecutor when provided` | Mock executor | Extractor accepts executor | Verify injection |
| `should work without ResilientExecutor (backward compatible)` | No executor | Extractor works | Backward compatibility |
| `should accept ResilientExecutor in connect` | Mock executor | Connection established | Verify database integration |

### Error Handling (`error-handling.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| Error propagation | Invalid inputs | Proper error types thrown | Verify error handling |
| Error recovery | Transient failures | System recovers | Verify resilience |

### MCP Tools Integration (`mcp-tools-integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| All MCP tools end-to-end | Various query parameters | Correct responses | Verify MCP protocol |

---

## Unit Tests

Unit tests are fast, isolated tests using test doubles (fakes/mocks).

### Tool Operations

**Location**: `src/tools/operations/__tests__/`

#### Concept Search (`concept-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find chunks by concept name` | concept: 'innovation', limit: 10 | Result with chunks, isError=false | Verify concept search |
| `should return empty result when concept not found` | concept: 'nonexistent' | Empty chunks array, isError=false | Handle missing concept |
| `should handle empty concept parameter` | concept: '' | isError=true, VALIDATION_ERROR | Validate input |

#### Catalog Search (`conceptual-catalog-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search catalog by text` | text: query string | Matching documents returned | Verify catalog search |
| `should respect limit parameter` | limit: N | ≤N results returned | Verify pagination |
| `should include hybrid scores` | text: query | Results have vectorScore, bm25Score, titleScore | Verify scoring |

#### Chunks Search (`conceptual-chunks-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search within specific document` | text, source | Chunks from specified document | Verify document-scoped search |
| `should require source parameter` | text only | Validation error | Enforce required params |

#### Broad Chunks Search (`conceptual-broad-chunks-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search across all documents` | text: query | Results from multiple sources | Verify cross-document search |
| `should apply hybrid scoring` | text: query | Results ranked by hybrid score | Verify scoring |

#### Document Concepts Extract (`document-concepts-extract.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should extract concepts from document` | document_query | primary_concepts, technical_terms arrays | Verify extraction |
| `should support format parameter` | format: 'json' or 'markdown' | Correct output format | Verify formatting |

#### Category Tools (`category-search.test.ts`, `list-categories.test.ts`, `list-concepts-in-category.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search by category` | category name/alias | Documents in category | Verify category search |
| `should list all categories` | Optional limit | Category list with stats | Verify category listing |
| `should list concepts in category` | category name | Concept list with counts | Verify concept listing |

#### Source Concepts (`source-concepts.test.ts`, `concept-sources.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find sources for concept(s)` | concept(s) | Source documents list | Verify source discovery |
| `should handle multiple concepts` | Array of concepts | Union of sources | Verify multi-concept |

---

### Domain Services

**Location**: `src/domain/services/__tests__/`

#### Catalog Search Service (`catalog-search-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search with hybrid scoring` | query, limit | Results with scores | Verify hybrid search |
| `should handle empty query` | '' | Empty results or error | Handle edge case |
| `should apply title matching boost` | query matching title | Higher titleScore | Verify title boost |

#### Chunk Search Service (`chunk-search-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should search chunks with concept matching` | query | Results with concept scores | Verify concept matching |
| `should filter by source` | query, source | Only chunks from source | Verify filtering |

#### Concept Search Service (`concept-search-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find chunks by concept` | concept name | Chunks containing concept | Verify concept lookup |
| `should group by source` | concept | Hierarchical results | Verify grouping |

---

### Infrastructure: Resilience

**Location**: `src/infrastructure/resilience/__tests__/`

#### Circuit Breaker (`circuit-breaker.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should use default configuration when no config provided` | - | Default values applied | Verify defaults |
| `should start in closed state` | - | state='closed' | Verify initial state |
| `should execute operations successfully in closed state` | Successful operation | Result returned, state='closed' | Verify closed behavior |
| `should open after reaching failure threshold` | N failures | state='open' after N | Verify threshold |
| `should reject operations immediately when open` | Operation while open | CircuitBreakerOpenError, operation not called | Verify fast-fail |
| `should transition to half-open after timeout` | Wait past timeout | state='half-open' | Verify timeout |
| `should close after success threshold met` | N successes in half-open | state='closed' | Verify recovery |
| `should reopen on any failure in half-open state` | Failure in half-open | state='open' | Verify half-open sensitivity |
| `should track metrics accurately` | Various operations | Correct counts | Verify metrics |

#### Bulkhead (`bulkhead.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should limit concurrent operations` | maxConcurrent | Correct number running | Verify limit |
| `should queue overflow operations` | maxQueue | Operations queued | Verify queue |
| `should reject when queue full` | Beyond capacity | BulkheadRejectionError | Verify rejection |
| `should release slot on completion` | Operation completes | Slot available | Verify cleanup |

#### Timeout (`timeout.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should complete within timeout` | Fast operation | Result returned | Verify success |
| `should throw on timeout exceeded` | Slow operation | TimeoutError | Verify timeout |

#### Graceful Degradation (`graceful-degradation.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return fallback on failure` | Failing operation + fallback | Fallback value returned | Verify degradation |

#### Resilient Executor (`resilient-executor.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should combine all resilience patterns` | Full config | Patterns applied correctly | Verify composition |
| `should use profiles` | ResilienceProfiles.LLM_API | Profile applied | Verify profiles |

---

### Infrastructure: Cache

**Location**: `src/infrastructure/cache/__tests__/`

#### LRU Cache (`lru-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should store and retrieve values` | key, value | Value retrieved | Verify basic ops |
| `should evict least recently used item when full` | Items > capacity | LRU item evicted | Verify LRU |
| `should update LRU order on get` | Access pattern | Correct eviction order | Verify access tracking |
| `should expire entries after TTL` | TTL parameter | Entry undefined after TTL | Verify TTL |
| `should track hits and misses` | Get operations | Correct hit/miss counts | Verify metrics |
| `should calculate hit rate correctly` | Mix of hits/misses | Correct percentage | Verify calculation |

#### Embedding Cache (`embedding-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should cache embeddings by text` | text, embedding | Embedding retrieved | Verify caching |
| `should return undefined for uncached text` | Unknown text | undefined | Verify miss behavior |

#### Search Result Cache (`search-result-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should cache search results by query` | query, results | Results retrieved | Verify caching |
| `should consider limit in cache key` | Same query, different limits | Different results | Verify key generation |

#### Category ID Cache (`category-id-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should map category names to IDs` | name | ID returned | Verify mapping |
| `should handle case-insensitive lookup` | Various cases | Same ID | Verify normalization |

---

### Infrastructure: Search

**Location**: `src/infrastructure/search/__tests__/`

#### Conceptual Hybrid Search Service (`conceptual-hybrid-search-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should combine vector and BM25 scores` | query | Results with both scores | Verify hybrid |
| `should apply query expansion` | query | Expanded terms used | Verify expansion |
| `should use resilient executor when available` | executor provided | Executor called | Verify resilience |

#### Scoring Strategies (`scoring-strategies.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should calculate catalog hybrid score` | ScoreComponents | Correct weighted sum | Verify catalog scoring |
| `should calculate chunk hybrid score` | ScoreComponents | Correct weighted sum | Verify chunk scoring |
| `should calculate concept hybrid score` | ScoreComponents | Correct weighted sum | Verify concept scoring |

---

### Infrastructure: Document Loaders

**Location**: `src/infrastructure/document-loaders/__tests__/`

#### PDF Loader (`pdf-loader.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should load PDF document` | PDF file path | Chunks extracted | Verify loading |
| `should extract metadata` | PDF with metadata | Title, author extracted | Verify metadata |
| `should handle OCR fallback` | Image-based PDF | Text extracted via OCR | Verify OCR |

#### EPUB Loader (`epub-loader.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should load EPUB document` | EPUB file path | Chapters extracted | Verify loading |
| `should preserve chapter structure` | Multi-chapter EPUB | Correct ordering | Verify structure |

#### Document Loader Factory (`document-loader-factory.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return PDF loader for .pdf` | 'file.pdf' | PDFDocumentLoader | Verify factory |
| `should return EPUB loader for .epub` | 'file.epub' | EPUBDocumentLoader | Verify factory |
| `should throw for unsupported format` | 'file.xyz' | Error thrown | Verify validation |

---

### Infrastructure: Embeddings

**Location**: `src/infrastructure/embeddings/__tests__/`

#### Simple Embedding Service (`simple-embedding-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should generate embeddings` | text | 384-dimension vector | Verify generation |
| `should produce similar embeddings for similar text` | Similar texts | High cosine similarity | Verify similarity |
| `should handle empty text` | '' | Valid embedding | Handle edge case |

#### Embedding Provider Factory (`embedding-provider-factory.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should create provider by name` | Provider name | Correct provider type | Verify factory |

---

### Infrastructure: Utils

**Location**: `src/infrastructure/utils/__tests__/`

#### Retry Service (`retry-service.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should retry on failure` | Failing operation, maxRetries | Retries attempted | Verify retry |
| `should succeed on eventual success` | Intermittent failure | Final success returned | Verify persistence |
| `should respect max retries` | Always failing | Stops after maxRetries | Verify limit |
| `should apply exponential backoff` | Retries with delay | Increasing delays | Verify backoff |

#### Shared Rate Limiter (`shared-rate-limiter.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should limit request rate` | Rate config | Requests throttled | Verify limiting |
| `should allow burst within window` | Burst config | Burst allowed | Verify burst |

#### Filename Metadata Parser (`filename-metadata-parser.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should parse author from filename` | 'Author - Title.pdf' | author='Author' | Verify parsing |
| `should parse year from filename` | 'Title (2023).pdf' | year=2023 | Verify parsing |

---

### Concepts Module

**Location**: `src/concepts/__tests__/`

#### Query Expander (`query_expander.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should extract original terms` | query text | Terms extracted | Verify extraction |
| `should expand with WordNet synonyms` | query | wordnet_terms populated | Verify WordNet |
| `should expand with corpus terms` | query | corpus_terms populated | Verify corpus |
| `should assign weights to terms` | query | All terms have weights [0,1] | Verify weights |

#### Concept Chunk Matcher (`concept_chunk_matcher.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should match concept to chunks` | concept, chunks | Matching chunks returned | Verify matching |
| `should use fuzzy matching` | Partial match | Similar concepts matched | Verify fuzzy |

#### Concept Enricher (`concept_enricher.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should enrich concepts with synonyms` | concept list | Enriched concepts | Verify enrichment |

#### Parallel Concept Extractor (`parallel-concept-extractor.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should extract concepts in parallel` | Multiple chunks | Concepts extracted concurrently | Verify parallelism |
| `should respect concurrency limit` | Large batch | Limited concurrent LLM calls | Verify throttling |

---

### Domain Validation

**Location**: `src/domain/validation/__tests__/`, `src/domain/services/validation/__tests__/`

#### Validation (`validation.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should validate query parameters` | Various inputs | Valid/invalid correctly identified | Verify validation |
| `should sanitize inputs` | Unsafe inputs | Sanitized outputs | Verify sanitization |

#### Input Validator (`InputValidator.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should validate search text` | Search queries | Validation result | Verify search validation |
| `should validate limit parameter` | Various limits | Clamped to valid range | Verify range checking |

---

### Domain Exceptions

**Location**: `src/domain/exceptions/__tests__/`

#### Exceptions (`exceptions.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| All 26 exception classes | Various parameters | Correct message, code, metadata | Verify exception structure |

---

## Property Tests

Property-based tests use random input generation to verify mathematical invariants.

**Location**: Various `*.property.test.ts` files

### Query Expander Properties (`query_expander.property.test.ts`)

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| Original terms inclusion | Random strings | original_terms ⊆ all_terms | Verify term inclusion |
| Weight bounds | Random strings | ∀term: 0 ≤ weight ≤ 1 | Verify weight bounds |
| Original terms weight | Random strings | ∀original: weight = 1.0 | Verify original weighting |
| Consistency | Same string twice | Same original_terms | Verify determinism |
| Short term filtering | Random strings | ∀term: length > 2 | Verify filtering |
| Term normalization | Random strings | ∀term: lowercase, alphanumeric | Verify normalization |
| Subset property | Random strings | corpus_terms ∪ wordnet_terms ⊆ all_terms | Verify structure |

### Concept Chunk Matcher Properties (`concept_chunk_matcher.property.test.ts`)

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| Match score bounds | Random concepts/chunks | 0 ≤ score ≤ 1 | Verify score bounds |
| Exact match highest | Matching concept | score = 1.0 | Verify exact match |

### Scoring Strategies Properties (`scoring-strategies.property.test.ts`)

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| Score bounds | Random ScoreComponents | 0 ≤ hybridScore ≤ 1 | Verify normalization |
| Weight sum | All score functions | Σ weights = 1.0 | Verify weight consistency |
| Zero input | All zeros | hybridScore = 0 | Verify edge case |
| Max input | All ones | hybridScore = 1 | Verify edge case |

---

## Test Data

### Test Database

Tests use a test database at `/tmp/concept_rag_test` seeded with sample documents from `sample-docs/`.

```bash
# Create test database
bash test/scripts/seed-test-database.sh
```

### Test Helpers

**Location**: `src/__tests__/test-helpers/`

- `test-data.ts` - Test data builders (createTestChunk, createTestConcept, etc.)
- `mock-repositories.ts` - Fake repository implementations
- `mock-services.ts` - Fake service implementations

---

## Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | >80% | ~85% |
| Integration Tests | Critical paths | All tools covered |
| E2E Tests | Resilience patterns | Full coverage |
| Property Tests | Mathematical invariants | Key algorithms |

---

## Adding New Tests

1. **Unit tests**: Co-locate in `__tests__/` directory next to source
2. **Integration tests**: Add to `src/__tests__/integration/`
3. **E2E tests**: Add to `src/__tests__/e2e/`
4. **Property tests**: Suffix with `.property.test.ts`

Follow existing patterns and use test helpers for consistency.
