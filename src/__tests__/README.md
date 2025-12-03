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
   - [Infrastructure: Resilience](#infrastructure-resilience)
   - [Infrastructure: Cache](#infrastructure-cache)
   - [Concepts Module](#concepts-module)
4. [Property Tests](#property-tests)
5. [Manual Test Scripts](#manual-test-scripts)

---

## E2E Tests

End-to-end tests validate complete system behavior under realistic conditions.

**Location**: `src/__tests__/e2e/`

### Bulkhead Under Load ([bulkhead-under-load.e2e.test.ts](./e2e/bulkhead-under-load.e2e.test.ts))

Tests bulkhead pattern under realistic concurrent load.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should limit concurrent operations and queue overflow properly`](./e2e/bulkhead-under-load.e2e.test.ts#L29) | maxConcurrent: 5, maxQueue: 10, 20 ops | 15 successful, 5 rejected | Verify concurrency limits |
| [`should handle sustained concurrent load without resource exhaustion`](./e2e/bulkhead-under-load.e2e.test.ts#L86) | 100 ops, maxConcurrent: 10 | >80% success rate | Test sustained load |
| [`should allow operations to complete as slots become available`](./e2e/bulkhead-under-load.e2e.test.ts#L145) | 8 ops, maxConcurrent: 3 | All 8 succeed, duration 2.5-4s | Verify slot release |
| [`should track utilization metrics accurately`](./e2e/bulkhead-under-load.e2e.test.ts#L199) | 12 ops, maxConcurrent: 5 | Metrics show 2 rejections | Verify metrics accuracy |
| [`should protect multiple resource pools independently`](./e2e/bulkhead-under-load.e2e.test.ts#L271) | 2 bulkheads | Each bulkhead independent | Verify isolation |

### Cache Performance ([cache-performance.e2e.test.ts](./e2e/cache-performance.e2e.test.ts))

Tests real-world caching performance and effectiveness.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should demonstrate cache hit rate >60% on repeated queries`](./e2e/cache-performance.e2e.test.ts#L31) | 5 queries, 2 passes | >30% improvement | Verify cache effectiveness |
| [`should maintain performance under realistic query patterns`](./e2e/cache-performance.e2e.test.ts#L84) | 100 queries (70% repeated) | >50% hit rate | Test realistic usage |
| [`should cache embeddings for repeated texts`](./e2e/cache-performance.e2e.test.ts#L134) | Same query twice | Second faster | Verify embedding cache |
| [`should handle diverse query patterns efficiently`](./e2e/cache-performance.e2e.test.ts#L161) | 3 queries, 2 passes | Second pass faster | Verify diverse caching |
| [`should expire search results after TTL`](./e2e/cache-performance.e2e.test.ts#L204) | Query with TTL | Immediate repeat faster | Verify TTL behavior |
| [`should handle concurrent queries efficiently`](./e2e/cache-performance.e2e.test.ts#L231) | 50 parallel queries | All complete, <200ms avg | Verify concurrent access |
| [`should perform well under realistic usage patterns`](./e2e/cache-performance.e2e.test.ts#L265) | 200 mixed operations | <50ms avg, >20 ops/sec | Validate performance |

### Document Pipeline Resilience ([document-pipeline-resilience.e2e.test.ts](./e2e/document-pipeline-resilience.e2e.test.ts))

Tests full document ingestion pipeline with resilience patterns.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should process document successfully with all services healthy`](./e2e/document-pipeline-resilience.e2e.test.ts#L130) | 10 chunks | All processed | Verify healthy pipeline |
| [`should handle LLM failures with circuit breaker`](./e2e/document-pipeline-resilience.e2e.test.ts#L156) | 15 chunks, LLM fails | 5 concepts, 15 embeddings | Test graceful degradation |
| [`should handle concurrent chunk processing with bulkhead`](./e2e/document-pipeline-resilience.e2e.test.ts#L211) | 25 chunks | >60% success rate | Verify concurrent processing |
| [`should recover and continue when services recover`](./e2e/document-pipeline-resilience.e2e.test.ts#L259) | 20 chunks, fail/recover | Pipeline recovers | Test recovery behavior |
| [`should provide comprehensive health summary`](./e2e/document-pipeline-resilience.e2e.test.ts#L345) | Various states | Summary accurate | Verify health monitoring |
| [`should maintain service isolation when one is slow`](./e2e/document-pipeline-resilience.e2e.test.ts#L393) | LLM 2s, others 50ms | All complete, isolated | Test service isolation |

### LLM Circuit Breaker ([llm-circuit-breaker.e2e.test.ts](./e2e/llm-circuit-breaker.e2e.test.ts))

Tests full circuit breaker lifecycle with simulated LLM service.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should protect against sustained LLM failures and recover`](./e2e/llm-circuit-breaker.e2e.test.ts#L28) | 5 failure threshold | Full lifecycle | Full lifecycle test |
| [`should handle intermittent failures without opening circuit`](./e2e/llm-circuit-breaker.e2e.test.ts#L180) | Alternating success/fail | Circuit stays closed | Verify intermittent handling |
| [`should track metrics accurately through full cycle`](./e2e/llm-circuit-breaker.e2e.test.ts#L227) | Various operations | Accurate counts | Verify metrics |

### Real Service Integration ([real-service-integration.e2e.test.ts](./e2e/real-service-integration.e2e.test.ts))

Tests actual production integration of resilience features.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should create ResilientExecutor before initializing services`](./e2e/real-service-integration.e2e.test.ts#L53) | Container | executor defined | Verify early init |
| [`should verify resilience is configured with production profiles`](./e2e/real-service-integration.e2e.test.ts#L78) | Test operation | Executor called | Verify configuration |
| [`should verify ConceptualHybridSearchService integration`](./e2e/real-service-integration.e2e.test.ts#L118) | - | Integration verified | Code structure |
| [`should verify LanceDBConnection integration`](./e2e/real-service-integration.e2e.test.ts#L134) | - | Integration verified | Code structure |
| [`should verify services work without resilientExecutor`](./e2e/real-service-integration.e2e.test.ts#L146) | No executor | Service works | Backward compatibility |
| [`should verify services work with resilientExecutor`](./e2e/real-service-integration.e2e.test.ts#L176) | With executor | Service works | Enhanced mode |
| [`should document where to find integration evidence`](./e2e/real-service-integration.e2e.test.ts#L212) | - | Evidence listed | Integration docs |

---

## Integration Tests

Integration tests verify cross-component workflows with real database interactions.

**Location**: `src/__tests__/integration/`

### Application Container ([application-container.integration.test.ts](./integration/application-container.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should initialize container with database connection`](./integration/application-container.integration.test.ts#L38) | Test database | No error | Verify init |
| [`should register all base tools`](./integration/application-container.integration.test.ts#L44) | - | ≥5 tools registered | Verify tool registration |
| [`should register category tools when categories table exists`](./integration/application-container.integration.test.ts#L58) | Categories table | 3 category tools | Verify optional tools |
| [`should return concept_search tool`](./integration/application-container.integration.test.ts#L73) | Tool name | Correct tool returned | Verify getTool |
| [`should throw error for non-existent tool`](./integration/application-container.integration.test.ts#L118) | 'nonexistent' | Error thrown | Verify error handling |
| [`should execute concept_search tool`](./integration/application-container.integration.test.ts#L127) | Query params | Result defined | Verify execution |
| [`should wire all tools with proper dependencies`](./integration/application-container.integration.test.ts#L244) | Tool names | All execute | Verify wiring |

### MCP Tools Integration ([mcp-tools-integration.test.ts](./integration/mcp-tools-integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](./integration/mcp-tools-integration.test.ts#L45) | concept: string | Chunks returned | Verify concept search |
| [`should handle non-existent concepts gracefully`](./integration/mcp-tools-integration.test.ts#L63) | Invalid concept | Empty results | Handle missing |
| [`should search document summaries`](./integration/mcp-tools-integration.test.ts#L96) | text: query | Documents found | Verify catalog search |
| [`should return results with scores`](./integration/mcp-tools-integration.test.ts#L113) | text: query | Scores present | Verify scoring |
| [`should search within specific document`](./integration/mcp-tools-integration.test.ts#L150) | text, source | Filtered results | Verify chunks search |
| [`should search across all chunks`](./integration/mcp-tools-integration.test.ts#L213) | text: query | Cross-doc results | Verify broad search |
| [`should extract concepts from document`](./integration/mcp-tools-integration.test.ts#L250) | document_query | Concepts extracted | Verify extraction |
| [`should support catalog → chunks search workflow`](./integration/mcp-tools-integration.test.ts#L375) | Multi-step | Workflow completes | Verify workflow |

### Resilience Integration ([resilience-integration.test.ts](./integration/resilience-integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should create ResilientExecutor and RetryService`](./integration/resilience-integration.test.ts#L15) | Container | Both defined | Verify creation |
| [`should inject ResilientExecutor into services`](./integration/resilience-integration.test.ts#L25) | Real DB | Tool works | Verify DI |
| [`should use ResilientExecutor when provided`](./integration/resilience-integration.test.ts#L39) | Mock executor | Executor used | Verify injection |
| [`should work without ResilientExecutor`](./integration/resilience-integration.test.ts#L54) | No executor | Works | Backward compat |
| [`should accept ResilientExecutor in connect`](./integration/resilience-integration.test.ts#L64) | Mock executor | Connection works | Verify DB integration |
| [`should confirm all integration points exist`](./integration/resilience-integration.test.ts#L83) | Code inspection | Points verified | Integration docs |

### Error Handling ([error-handling.integration.test.ts](./integration/error-handling.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should throw structured validation error for invalid search query`](./integration/error-handling.integration.test.ts#L19) | Invalid query | ValidationError | Verify validation |
| [`should propagate validation errors through tool layer`](./integration/error-handling.integration.test.ts#L66) | Invalid input | Error propagated | Verify propagation |
| [`should format errors correctly for MCP tool responses`](./integration/error-handling.integration.test.ts#L164) | Error | Correct format | Verify MCP format |
| [`should not retry validation errors`](./integration/error-handling.integration.test.ts#L206) | Validation error | No retry | Verify no retry |

### Repository Integration Tests

**Chunk Repository** ([chunk-repository.integration.test.ts](./integration/chunk-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](./integration/chunk-repository.integration.test.ts#L65) | Concept name | Chunks found | Verify concept lookup |
| [`should find chunks by catalog title`](./integration/chunk-repository.integration.test.ts#L145) | Title | Chunks found | Verify title lookup |
| [`should perform hybrid search across all chunks`](./integration/chunk-repository.integration.test.ts#L185) | Query | Results ranked | Verify hybrid search |
| [`should correctly map all chunk fields`](./integration/chunk-repository.integration.test.ts#L253) | - | Fields mapped | Verify mapping |

**Concept Repository** ([concept-repository.integration.test.ts](./integration/concept-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find concept by exact name`](./integration/concept-repository.integration.test.ts#L43) | Name | Concept found | Verify exact match |
| [`should handle case-insensitive lookup`](./integration/concept-repository.integration.test.ts#L56) | Various cases | Same result | Verify case handling |
| [`should correctly map vector field`](./integration/concept-repository.integration.test.ts#L91) | - | Vector mapped | Verify vector (bugfix) |

**Catalog Repository** ([catalog-repository.integration.test.ts](./integration/catalog-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should perform hybrid search on catalog`](./integration/catalog-repository.integration.test.ts#L45) | Query | Results returned | Verify hybrid search |
| [`should benefit from title matching`](./integration/catalog-repository.integration.test.ts#L81) | Title query | Higher title score | Verify title boost |
| [`should find document by exact source path`](./integration/catalog-repository.integration.test.ts#L111) | Path | Document found | Verify exact path |

---

## Unit Tests

Unit tests are fast, isolated tests using test doubles (fakes/mocks).

### Tool Operations

**Location**: `src/tools/operations/__tests__/`

#### Concept Search ([concept-search.test.ts](../tools/operations/__tests__/concept-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](../tools/operations/__tests__/concept-search.test.ts#L38) | concept: 'innovation' | Chunks found | Verify concept search |
| [`should return empty result when concept not found`](../tools/operations/__tests__/concept-search.test.ts#L90) | concept: 'nonexistent' | Empty result | Handle missing |
| [`should handle empty concept parameter`](../tools/operations/__tests__/concept-search.test.ts#L103) | concept: '' | Validation error | Validate input |

#### Catalog Search ([conceptual-catalog-search.test.ts](../tools/operations/__tests__/conceptual-catalog-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted catalog search results`](../tools/operations/__tests__/conceptual-catalog-search.test.ts#L29) | text: query | Formatted results | Verify formatting |
| [`should respect limit parameter`](../tools/operations/__tests__/conceptual-catalog-search.test.ts#L64) | limit: N | ≤N results | Verify pagination |
| [`should include debug information when enabled`](../tools/operations/__tests__/conceptual-catalog-search.test.ts#L83) | debug: true | Debug info present | Verify debug mode |
| [`should require text parameter`](../tools/operations/__tests__/conceptual-catalog-search.test.ts#L153) | text missing | Validation error | Validate required |

#### Chunks Search ([conceptual-chunks-search.test.ts](../tools/operations/__tests__/conceptual-chunks-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted chunks from specific source`](../tools/operations/__tests__/conceptual-chunks-search.test.ts#L65) | text, source | Filtered chunks | Verify source filter |
| [`should respect limit parameter`](../tools/operations/__tests__/conceptual-chunks-search.test.ts#L104) | limit: N | ≤N results | Verify pagination |
| [`should require both text and source parameters`](../tools/operations/__tests__/conceptual-chunks-search.test.ts#L183) | Missing params | Validation error | Validate required |

#### Broad Chunks Search ([conceptual-broad-chunks-search.test.ts](../tools/operations/__tests__/conceptual-broad-chunks-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted search results across all documents`](../tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L29) | text: query | Cross-doc results | Verify cross-doc |
| [`should include score information`](../tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L81) | text: query | Scores present | Verify scoring |
| [`should include expanded terms when debug enabled`](../tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L105) | debug: true | Terms shown | Verify debug |

#### Document Concepts Extract ([document-concepts-extract.test.ts](../tools/operations/__tests__/document-concepts-extract.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should extract concepts from document in JSON format`](../tools/operations/__tests__/document-concepts-extract.test.ts#L54) | document_query | JSON output | Verify extraction |
| [`should return error when document not found`](../tools/operations/__tests__/document-concepts-extract.test.ts#L79) | Invalid query | Error response | Handle missing |
| [`should format output as markdown when specified`](../tools/operations/__tests__/document-concepts-extract.test.ts#L113) | format: 'markdown' | Markdown output | Verify formatting |

#### Source Concepts ([source-concepts.test.ts](../tools/operations/__tests__/source-concepts.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find all sources for a single concept`](../tools/operations/__tests__/source-concepts.test.ts#L32) | concept: string | Sources found | Verify source lookup |
| [`should return union of sources with concept_indices`](../tools/operations/__tests__/source-concepts.test.ts#L63) | Array of concepts | Union with indices | Verify multi-concept |
| [`should sort by number of matching concepts`](../tools/operations/__tests__/source-concepts.test.ts#L103) | Multiple concepts | Sorted results | Verify sorting |

#### Concept Sources ([concept-sources.test.ts](../tools/operations/__tests__/concept-sources.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return sources for a single concept`](../tools/operations/__tests__/concept-sources.test.ts#L32) | concept: string | Sources array | Verify per-concept |
| [`should return separate source arrays for each concept`](../tools/operations/__tests__/concept-sources.test.ts#L66) | Array of concepts | Separate arrays | Verify separation |
| [`should maintain position correspondence with input`](../tools/operations/__tests__/concept-sources.test.ts#L98) | Array of concepts | Correct positions | Verify ordering |

#### Category Search ([category-search.test.ts](../tools/operations/__tests__/category-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted category search results`](../tools/operations/__tests__/category-search.test.ts#L131) | category: name | Formatted results | Verify formatting |
| [`should handle errors gracefully`](../tools/operations/__tests__/category-search.test.ts#L159) | Invalid input | Error handled | Error handling |

#### List Categories ([list-categories.test.ts](../tools/operations/__tests__/list-categories.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted category list`](../tools/operations/__tests__/list-categories.test.ts#L49) | Optional limit | Categories listed | Verify listing |
| [`should handle errors gracefully`](../tools/operations/__tests__/list-categories.test.ts#L65) | Error condition | Error handled | Error handling |

#### List Concepts in Category ([list-concepts-in-category.test.ts](../tools/operations/__tests__/list-concepts-in-category.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted concepts list`](../tools/operations/__tests__/list-concepts-in-category.test.ts#L73) | category: name | Concepts listed | Verify listing |
| [`should handle nonexistent category gracefully`](../tools/operations/__tests__/list-concepts-in-category.test.ts#L90) | Invalid category | Empty/error | Handle missing |

---

### Infrastructure: Resilience

**Location**: `src/infrastructure/resilience/__tests__/`

#### Circuit Breaker ([circuit-breaker.test.ts](../infrastructure/resilience/__tests__/circuit-breaker.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should use default configuration when no config provided`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L19) | - | Defaults applied | Verify defaults |
| [`should start in closed state`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L53) | - | state='closed' | Verify initial state |
| [`should execute operations successfully in closed state`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L76) | Success op | Result returned | Verify closed behavior |
| [`should open after reaching failure threshold`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L118) | N failures | state='open' | Verify threshold |
| [`should reject operations immediately when open`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L192) | Op while open | CircuitBreakerOpenError | Verify fast-fail |
| [`should transition to half-open after timeout`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L242) | Wait past timeout | state='half-open' | Verify timeout |
| [`should close after success threshold met`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L312) | N successes | state='closed' | Verify recovery |
| [`should reopen on any failure in half-open state`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L331) | Failure | state='open' | Verify half-open |
| [`should track all metrics accurately`](../infrastructure/resilience/__tests__/circuit-breaker.test.ts#L447) | Various ops | Correct counts | Verify metrics |

#### Bulkhead ([bulkhead.test.ts](../infrastructure/resilience/__tests__/bulkhead.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should use default configuration`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L16) | - | Defaults applied | Verify defaults |
| [`should execute operations when under limit`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L98) | Under limit | Executes | Verify execution |
| [`should limit concurrent operations`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L164) | Over limit | Limited | Verify limit |
| [`should queue operations when at max concurrent`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L262) | At max | Queued | Verify queuing |
| [`should reject when bulkhead is full`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L365) | Beyond capacity | BulkheadRejectionError | Verify rejection |
| [`should track rejection count`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L416) | Rejections | Count accurate | Verify rejection count |
| [`should track all metrics accurately`](../infrastructure/resilience/__tests__/bulkhead.test.ts#L465) | 2 success, 1 fail | Correct counts | Verify metrics |

#### Timeout ([timeout.test.ts](../infrastructure/resilience/__tests__/timeout.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should define standard timeout values`](../infrastructure/resilience/__tests__/timeout.test.ts#L16) | - | Values defined | Verify constants |
| [`should return operation result if completes before timeout`](../infrastructure/resilience/__tests__/timeout.test.ts#L26) | Fast op | Result returned | Verify success |
| [`should throw TimeoutError if operation exceeds timeout`](../infrastructure/resilience/__tests__/timeout.test.ts#L38) | Slow op | TimeoutError | Verify timeout |
| [`should include operation name and timeout in error`](../infrastructure/resilience/__tests__/timeout.test.ts#L55) | Slow op | Error details | Verify error info |
| [`should timeout even if operation never resolves`](../infrastructure/resilience/__tests__/timeout.test.ts#L95) | Hung op | TimeoutError | Verify hung handling |
| [`should handle zero timeout`](../infrastructure/resilience/__tests__/timeout.test.ts#L108) | 0ms timeout | TimeoutError | Edge case |
| [`should work with operations that reject`](../infrastructure/resilience/__tests__/timeout.test.ts#L85) | Reject op | Error propagated | Verify error prop |
| [`should create a wrapped function with timeout`](../infrastructure/resilience/__tests__/timeout.test.ts#L144) | Wrap fn | Wrapped fn works | Verify withTimeout |
| [`should timeout wrapped function if it takes too long`](../infrastructure/resilience/__tests__/timeout.test.ts#L155) | Slow wrapped fn | TimeoutError | Verify wrapped timeout |
| [`should call onTimeout callback when timeout occurs`](../infrastructure/resilience/__tests__/timeout.test.ts#L215) | onTimeout cb | Callback called | Verify callback |
| [`should work without onTimeout callback`](../infrastructure/resilience/__tests__/timeout.test.ts#L269) | No callback | Works | Backward compat |
| [`should timeout mixed fast/slow operations correctly`](../infrastructure/resilience/__tests__/timeout.test.ts#L312) | Mixed ops | Correct behavior | Verify mixed |

#### Graceful Degradation ([graceful-degradation.test.ts](../infrastructure/resilience/__tests__/graceful-degradation.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should execute primary operation when it succeeds`](../infrastructure/resilience/__tests__/graceful-degradation.test.ts#L39) | Success op | Primary result | Verify primary |
| [`should use fallback when primary fails`](../infrastructure/resilience/__tests__/graceful-degradation.test.ts#L54) | Fail op + fallback | Fallback used | Verify fallback |
| [`should use fallback when shouldDegrade returns true`](../infrastructure/resilience/__tests__/graceful-degradation.test.ts#L98) | Degrade condition | Proactive fallback | Verify proactive |
| [`should track degradation rate`](../infrastructure/resilience/__tests__/graceful-degradation.test.ts#L271) | Mixed ops | Rate calculated | Verify rate |

#### Resilient Executor ([resilient-executor.test.ts](../infrastructure/resilience/__tests__/resilient-executor.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should execute operation without any resilience patterns`](../infrastructure/resilience/__tests__/resilient-executor.test.ts#L24) | No config | Executes | Verify basic exec |
| [`should create circuit breaker for operation`](../infrastructure/resilience/__tests__/resilient-executor.test.ts#L61) | CB config | CB created | Verify CB creation |
| [`should create bulkhead for operation`](../infrastructure/resilience/__tests__/resilient-executor.test.ts#L146) | BH config | BH created | Verify BH creation |
| [`should retry failed operations`](../infrastructure/resilience/__tests__/resilient-executor.test.ts#L224) | Retry config | Retries | Verify retry |
| [`should apply all patterns together`](../infrastructure/resilience/__tests__/resilient-executor.test.ts#L283) | Full config | All applied | Verify composition |

---

### Infrastructure: Cache

**Location**: `src/infrastructure/cache/__tests__/`

#### LRU Cache ([lru-cache.test.ts](../infrastructure/cache/__tests__/lru-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should store and retrieve values`](../infrastructure/cache/__tests__/lru-cache.test.ts#L16) | key, value | Value retrieved | Verify basic ops |
| [`should evict least recently used item when full`](../infrastructure/cache/__tests__/lru-cache.test.ts#L55) | Items > capacity | LRU evicted | Verify LRU eviction |
| [`should update LRU order on get`](../infrastructure/cache/__tests__/lru-cache.test.ts#L68) | Access pattern | Correct order | Verify access tracking |
| [`should expire entries after TTL`](../infrastructure/cache/__tests__/lru-cache.test.ts#L110) | TTL param | Entry expired | Verify TTL |
| [`should track hits and misses`](../infrastructure/cache/__tests__/lru-cache.test.ts#L148) | Get ops | Correct counts | Verify hit/miss |
| [`should calculate hit rate correctly`](../infrastructure/cache/__tests__/lru-cache.test.ts#L161) | Mixed access | Correct rate | Verify hit rate |

#### Embedding Cache ([embedding-cache.test.ts](../infrastructure/cache/__tests__/embedding-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should cache and retrieve embeddings`](../infrastructure/cache/__tests__/embedding-cache.test.ts#L19) | text, embedding | Retrieved | Verify caching |
| [`should differentiate by model`](../infrastructure/cache/__tests__/embedding-cache.test.ts#L39) | Same text, diff models | Separate entries | Verify model key |
| [`should evict least recently used embeddings when full`](../infrastructure/cache/__tests__/embedding-cache.test.ts#L161) | Many entries | LRU evicted | Verify LRU |
| [`should track cache hits and misses`](../infrastructure/cache/__tests__/embedding-cache.test.ts#L206) | Get ops | Correct counts | Verify metrics |

#### Search Result Cache ([search-result-cache.test.ts](../infrastructure/cache/__tests__/search-result-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should cache and retrieve search results`](../infrastructure/cache/__tests__/search-result-cache.test.ts#L27) | query, results | Retrieved | Verify caching |
| [`should generate different keys for different limits`](../infrastructure/cache/__tests__/search-result-cache.test.ts#L79) | Same query, diff limits | Different results | Verify key gen |
| [`should expire entries after TTL`](../infrastructure/cache/__tests__/search-result-cache.test.ts#L124) | TTL | Entry expired | Verify TTL |
| [`should evict least recently used entries when full`](../infrastructure/cache/__tests__/search-result-cache.test.ts#L204) | Many entries | LRU evicted | Verify eviction |

#### Category ID Cache ([category-id-cache.test.ts](../infrastructure/cache/__tests__/category-id-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return same instance on multiple calls`](../infrastructure/cache/__tests__/category-id-cache.test.ts#L90) | Multiple calls | Same instance | Verify singleton |
| [`should initialize cache with categories`](../infrastructure/cache/__tests__/category-id-cache.test.ts#L101) | Categories | Cache populated | Verify init |
| [`should handle case-insensitive name lookups`](../infrastructure/cache/__tests__/category-id-cache.test.ts#L128) | Various cases | Same ID | Verify normalization |
| [`should build alias mappings`](../infrastructure/cache/__tests__/category-id-cache.test.ts#L158) | Aliases | Aliases work | Verify aliases |
| [`should build hierarchy mappings`](../infrastructure/cache/__tests__/category-id-cache.test.ts#L184) | Parent/child | Hierarchy works | Verify hierarchy |

---

### Concepts Module

**Location**: `src/concepts/__tests__/`

#### Query Expander ([query_expander.test.ts](../concepts/__tests__/query_expander.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should extract and normalize terms from query`](../concepts/__tests__/query_expander.test.ts#L133) | query text | Terms extracted | Verify extraction |
| [`should filter out short terms (length <= 2)`](../concepts/__tests__/query_expander.test.ts#L148) | Short terms | Filtered | Verify filtering |
| [`should assign weight 1.0 to original terms`](../concepts/__tests__/query_expander.test.ts#L179) | query | weight=1.0 | Verify weighting |
| [`should search concept table for related concepts`](../concepts/__tests__/query_expander.test.ts#L221) | query | Corpus terms | Verify corpus |
| [`should apply 80% weight to corpus terms`](../concepts/__tests__/query_expander.test.ts#L282) | Corpus term | weight=0.8 | Verify corpus weight |
| [`should include WordNet terms in expansion`](../concepts/__tests__/query_expander.test.ts#L350) | query | WordNet terms | Verify WordNet |
| [`should apply 60% weight to WordNet terms`](../concepts/__tests__/query_expander.test.ts#L364) | WordNet term | weight=0.6 | Verify WordNet weight |

#### Concept Chunk Matcher ([concept_chunk_matcher.test.ts](../concepts/__tests__/concept_chunk_matcher.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should match exact concept in chunk text`](../concepts/__tests__/concept_chunk_matcher.test.ts#L23) | Concept, chunk | Matched | Verify exact match |
| [`should match multiple concepts in chunk`](../concepts/__tests__/concept_chunk_matcher.test.ts#L39) | Multiple concepts | All matched | Verify multi-match |
| [`should calculate density for matched concepts`](../concepts/__tests__/concept_chunk_matcher.test.ts#L119) | Concepts, chunk | Density calculated | Verify density |
| [`should enrich multiple chunks`](../concepts/__tests__/concept_chunk_matcher.test.ts#L258) | Chunks, concepts | All enriched | Verify enrichment |
| [`should calculate statistics for enriched chunks`](../concepts/__tests__/concept_chunk_matcher.test.ts#L326) | Enriched chunks | Stats calculated | Verify stats |

#### Concept Enricher ([concept_enricher.test.ts](../concepts/__tests__/concept_enricher.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should enrich concepts with WordNet data`](../concepts/__tests__/concept_enricher.test.ts#L67) | Concepts | Enriched with synonyms | Verify enrichment |
| [`should limit synonyms to top 5`](../concepts/__tests__/concept_enricher.test.ts#L101) | Concept | ≤5 synonyms | Verify limit |
| [`should handle concepts not found in WordNet`](../concepts/__tests__/concept_enricher.test.ts#L200) | Unknown concept | Graceful handling | Handle missing |
| [`should process multiple concepts`](../concepts/__tests__/concept_enricher.test.ts#L275) | Multiple | All processed | Verify batch |

#### Parallel Concept Extractor ([parallel-concept-extractor.test.ts](../concepts/__tests__/parallel-concept-extractor.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should process a single document`](../concepts/__tests__/parallel-concept-extractor.test.ts#L42) | Document | Concepts extracted | Verify single |
| [`should process multiple documents`](../concepts/__tests__/parallel-concept-extractor.test.ts#L61) | Documents | All processed | Verify batch |
| [`should handle concurrency batching`](../concepts/__tests__/parallel-concept-extractor.test.ts#L101) | Many docs | Batched correctly | Verify batching |
| [`should isolate errors to individual documents`](../concepts/__tests__/parallel-concept-extractor.test.ts#L132) | Some fail | Others succeed | Verify isolation |

---

## Property Tests

Property-based tests use random input generation to verify mathematical invariants.

### Query Expander Properties ([query_expander.property.test.ts](../concepts/__tests__/query_expander.property.test.ts))

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| [`Original terms inclusion`](../concepts/__tests__/query_expander.property.test.ts#L45) | Random strings | original_terms ⊆ all_terms | Verify inclusion |
| [`Weight bounds`](../concepts/__tests__/query_expander.property.test.ts#L64) | Random strings | ∀term: 0 ≤ weight ≤ 1 | Verify bounds |
| [`Original terms weight`](../concepts/__tests__/query_expander.property.test.ts#L86) | Random strings | ∀original: weight = 1.0 | Verify weighting |
| [`Consistency`](../concepts/__tests__/query_expander.property.test.ts#L106) | Same string twice | Same original_terms | Verify determinism |
| [`Short term filtering`](../concepts/__tests__/query_expander.property.test.ts#L138) | Random strings | ∀term: length > 2 | Verify filtering |
| [`Term normalization`](../concepts/__tests__/query_expander.property.test.ts#L157) | Random strings | lowercase, alphanumeric | Verify normalization |
| [`Subset property`](../concepts/__tests__/query_expander.property.test.ts#L202) | Random strings | corpus ∪ wordnet ⊆ all_terms | Verify structure |

### Concept Chunk Matcher Properties ([concept_chunk_matcher.property.test.ts](../concepts/__tests__/concept_chunk_matcher.property.test.ts))

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| [`Density bounds`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L28) | Random concepts/chunks | 0 ≤ density ≤ 1 | Verify bounds |
| [`Arrays returned`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L53) | Random inputs | concepts, categories are arrays | Verify arrays |
| [`Empty chunk`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L80) | Empty text | density = 0 | Verify empty |
| [`No concepts`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L109) | Empty concepts | density = 0 | Verify no concepts |
| [`Idempotent`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L132) | Same input twice | Same output | Verify idempotent |
| [`Preserve count`](../concepts/__tests__/concept_chunk_matcher.property.test.ts#L160) | Chunks array | Same length | Verify preservation |

---

## Manual Test Scripts

Interactive scripts for manual testing, debugging, and report generation against the test database.

**Location**: `src/__tests__/scripts/`

**Running scripts:**
```bash
npx tsx src/__tests__/scripts/<script-name>.ts [options]
```

### Report Generation

| Script | Purpose | Output |
|--------|---------|--------|
| [`generate-test-report.ts`](./scripts/generate-test-report.ts) | Generate detailed MCP tool test report with score weightings | Markdown report |
| [`test-hybrid-scoring.ts`](./scripts/test-hybrid-scoring.ts) | Debug hybrid scoring breakdown (vector, BM25, title) | Console output |

### MCP Tool Testing

| Script | Purpose | Tests |
|--------|---------|-------|
| [`test-mcp-tools.ts`](./scripts/test-mcp-tools.ts) | Comprehensive MCP tool tests (5+ cases per tool) | concept_search, catalog_search, chunks_search, broad_chunks_search, extract_concepts |
| [`test_search_tools.ts`](./scripts/test_search_tools.ts) | Search tool verification after hybrid search changes | catalog_search, broad_chunks_search, chunks_search |
| [`test_category_tools.ts`](./scripts/test_category_tools.ts) | Category tool functionality tests | category_search, list_categories, list_concepts_in_category |

### Resilience Testing

| Script | Purpose | Tests |
|--------|---------|-------|
| [`test-resilience-live.ts`](./scripts/test-resilience-live.ts) | Live resilience infrastructure test | Circuit breaker, bulkhead, timeout with real DB |

### Search & Query Debugging

| Script | Purpose | Output |
|--------|---------|--------|
| [`test-catalog-search.ts`](./scripts/test-catalog-search.ts) | Debug catalog search with embedding visualization | Score breakdown per result |
| [`test-concept-queries.ts`](./scripts/test-concept-queries.ts) | Test concept substring and summary queries | Concept match analysis |
| [`_test_concept_search.ts`](./scripts/_test_concept_search.ts) | Hierarchical concept search testing | Multi-document concept correlation |

### Utility Scripts

| Script | Purpose |
|--------|---------|
| [`test-title-check.ts`](./scripts/test-title-check.ts) | Verify title field extraction |
| [`create_math_test_pdfs.ts`](./scripts/create_math_test_pdfs.ts) | Generate test PDFs with math symbols |
| [`test_math_symbol_extraction.ts`](./scripts/test_math_symbol_extraction.ts) | Test math symbol extraction from PDFs |

---

## Test Data

### Test Database

Tests use a test database at `./db/test` seeded with sample documents from `sample-docs/`.

```bash
# Create test database
bash scripts/seed-test-database.sh
```

### Test Helpers

**Location**: [`src/__tests__/test-helpers/`](./test-helpers/)

- [`test-data.ts`](./test-helpers/test-data.ts) - Test data builders (createTestChunk, createTestConcept, etc.)
- [`mock-repositories.ts`](./test-helpers/mock-repositories.ts) - Fake repository implementations
- [`mock-services.ts`](./test-helpers/mock-services.ts) - Fake service implementations
- [`index.ts`](./test-helpers/index.ts) - Re-exports all test helpers
- [`README.md`](./test-helpers/README.md) - Test helpers documentation

---

## Adding New Tests

1. **Unit tests**: Co-locate in `__tests__/` directory next to source
2. **Integration tests**: Add to `src/__tests__/integration/`
3. **E2E tests**: Add to `src/__tests__/e2e/`
4. **Property tests**: Suffix with `.property.test.ts`

Follow existing patterns and use test helpers for consistency.
