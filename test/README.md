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

---

## E2E Tests

End-to-end tests validate complete system behavior under realistic conditions.

**Location**: `src/__tests__/e2e/`

### Bulkhead Under Load ([bulkhead-under-load.e2e.test.ts](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts))

Tests bulkhead pattern under realistic concurrent load.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should limit concurrent operations and queue overflow properly`](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts) | maxConcurrent: 5, maxQueue: 10, 20 ops | 15 successful, 5 rejected | Verify concurrency limits |
| [`should handle sustained concurrent load without resource exhaustion`](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts) | 100 ops, maxConcurrent: 10 | >80% success rate | Test sustained load |
| [`should allow operations to complete as slots become available`](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts) | 8 ops, maxConcurrent: 3 | All 8 succeed, duration 2.5-4s | Verify slot release |
| [`should track utilization metrics accurately`](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts) | 12 ops, maxConcurrent: 5 | Metrics show 2 rejections | Verify metrics accuracy |
| [`should protect multiple resource pools independently`](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts) | 2 bulkheads | Each bulkhead independent | Verify isolation |

### Cache Performance ([cache-performance.e2e.test.ts](../src/__tests__/e2e/cache-performance.e2e.test.ts))

Tests real-world caching performance and effectiveness.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should demonstrate cache hit rate >60% on repeated queries`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | 5 queries, 2 passes | >30% improvement | Verify cache effectiveness |
| [`should maintain performance under realistic query patterns`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | 100 queries (70% repeated) | >50% hit rate | Test realistic usage |
| [`should cache embeddings for repeated texts`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | Same query twice | Second faster | Verify embedding cache |
| [`should expire search results after TTL`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | Query with TTL | Immediate repeat faster | Verify TTL behavior |
| [`should handle concurrent queries efficiently`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | 50 parallel queries | All complete, <200ms avg | Verify concurrent access |
| [`should perform well under realistic usage patterns`](../src/__tests__/e2e/cache-performance.e2e.test.ts) | 200 mixed operations | <50ms avg, >20 ops/sec | Validate performance |

### Document Pipeline Resilience ([document-pipeline-resilience.e2e.test.ts](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts))

Tests full document ingestion pipeline with resilience patterns.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should process document successfully with all services healthy`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | 10 chunks | All processed | Verify healthy pipeline |
| [`should handle LLM failures with circuit breaker`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | 15 chunks, LLM fails | 5 concepts, 15 embeddings | Test graceful degradation |
| [`should handle concurrent chunk processing with bulkhead`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | 25 chunks | >60% success rate | Verify concurrent processing |
| [`should recover and continue when services recover`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | 20 chunks, fail/recover | Pipeline recovers | Test recovery behavior |
| [`should provide comprehensive health summary`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | Various states | Summary accurate | Verify health monitoring |
| [`should maintain service isolation when one is slow`](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts) | LLM 2s, others 50ms | All complete, isolated | Test service isolation |

### LLM Circuit Breaker ([llm-circuit-breaker.e2e.test.ts](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts))

Tests full circuit breaker lifecycle with simulated LLM service.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should protect against sustained LLM failures and recover`](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts) | 5 failure threshold | Full lifecycle | Full lifecycle test |
| [`should handle intermittent failures without opening circuit`](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts) | Alternating success/fail | Circuit stays closed | Verify intermittent handling |
| [`should track metrics accurately through full cycle`](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts) | Various operations | Accurate counts | Verify metrics |

### Real Service Integration ([real-service-integration.e2e.test.ts](../src/__tests__/e2e/real-service-integration.e2e.test.ts))

Tests actual production integration of resilience features.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should create ResilientExecutor before initializing services`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | Container | executor defined | Verify early init |
| [`should verify resilience is configured with production profiles`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | Test operation | Executor called | Verify configuration |
| [`should verify ConceptualHybridSearchService integration`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | - | Integration verified | Code structure |
| [`should verify LanceDBConnection integration`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | - | Integration verified | Code structure |
| [`should verify services work without resilientExecutor`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | No executor | Service works | Backward compatibility |
| [`should verify services work with resilientExecutor`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | With executor | Service works | Enhanced mode |
| [`should document where to find integration evidence`](../src/__tests__/e2e/real-service-integration.e2e.test.ts) | - | Evidence listed | Integration docs |

---

## Integration Tests

Integration tests verify cross-component workflows with real database interactions.

**Location**: `src/__tests__/integration/`

### Application Container ([application-container.integration.test.ts](../src/__tests__/integration/application-container.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should initialize container with database connection`](../src/__tests__/integration/application-container.integration.test.ts) | Test database | No error | Verify init |
| [`should register all base tools`](../src/__tests__/integration/application-container.integration.test.ts) | - | ≥5 tools registered | Verify tool registration |
| [`should register category tools when categories table exists`](../src/__tests__/integration/application-container.integration.test.ts) | Categories table | 3 category tools | Verify optional tools |
| [`should return concept_search tool`](../src/__tests__/integration/application-container.integration.test.ts) | Tool name | Correct tool returned | Verify getTool |
| [`should throw error for non-existent tool`](../src/__tests__/integration/application-container.integration.test.ts) | 'nonexistent' | Error thrown | Verify error handling |
| [`should execute concept_search tool`](../src/__tests__/integration/application-container.integration.test.ts) | Query params | Result defined | Verify execution |
| [`should wire all tools with proper dependencies`](../src/__tests__/integration/application-container.integration.test.ts) | Tool names | All execute | Verify wiring |

### MCP Tools Integration ([mcp-tools-integration.test.ts](../src/__tests__/integration/mcp-tools-integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](../src/__tests__/integration/mcp-tools-integration.test.ts) | concept: string | Chunks returned | Verify concept search |
| [`should handle non-existent concepts gracefully`](../src/__tests__/integration/mcp-tools-integration.test.ts) | Invalid concept | Empty results | Handle missing |
| [`should search document summaries`](../src/__tests__/integration/mcp-tools-integration.test.ts) | text: query | Documents found | Verify catalog search |
| [`should return results with scores`](../src/__tests__/integration/mcp-tools-integration.test.ts) | text: query | Scores present | Verify scoring |
| [`should search within specific document`](../src/__tests__/integration/mcp-tools-integration.test.ts) | text, source | Filtered results | Verify chunks search |
| [`should search across all chunks`](../src/__tests__/integration/mcp-tools-integration.test.ts) | text: query | Cross-doc results | Verify broad search |
| [`should extract concepts from document`](../src/__tests__/integration/mcp-tools-integration.test.ts) | document_query | Concepts extracted | Verify extraction |
| [`should support catalog → chunks search workflow`](../src/__tests__/integration/mcp-tools-integration.test.ts) | Multi-step | Workflow completes | Verify workflow |

### Resilience Integration ([resilience-integration.test.ts](../src/__tests__/integration/resilience-integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should create ResilientExecutor and RetryService`](../src/__tests__/integration/resilience-integration.test.ts) | Container | Both defined | Verify creation |
| [`should use ResilientExecutor when provided`](../src/__tests__/integration/resilience-integration.test.ts) | Mock executor | Executor used | Verify injection |
| [`should work without ResilientExecutor`](../src/__tests__/integration/resilience-integration.test.ts) | No executor | Works | Backward compat |
| [`should accept ResilientExecutor in connect`](../src/__tests__/integration/resilience-integration.test.ts) | Mock executor | Connection works | Verify DB integration |

### Error Handling ([error-handling.integration.test.ts](../src/__tests__/integration/error-handling.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should throw structured validation error for invalid search query`](../src/__tests__/integration/error-handling.integration.test.ts) | Invalid query | ValidationError | Verify validation |
| [`should propagate validation errors through tool layer`](../src/__tests__/integration/error-handling.integration.test.ts) | Invalid input | Error propagated | Verify propagation |
| [`should format errors correctly for MCP tool responses`](../src/__tests__/integration/error-handling.integration.test.ts) | Error | Correct format | Verify MCP format |
| [`should not retry validation errors`](../src/__tests__/integration/error-handling.integration.test.ts) | Validation error | No retry | Verify no retry |

### Repository Integration Tests

**Chunk Repository** ([chunk-repository.integration.test.ts](../src/__tests__/integration/chunk-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](../src/__tests__/integration/chunk-repository.integration.test.ts) | Concept name | Chunks found | Verify concept lookup |
| [`should find chunks by catalog title`](../src/__tests__/integration/chunk-repository.integration.test.ts) | Title | Chunks found | Verify title lookup |
| [`should perform hybrid search across all chunks`](../src/__tests__/integration/chunk-repository.integration.test.ts) | Query | Results ranked | Verify hybrid search |
| [`should correctly map all chunk fields`](../src/__tests__/integration/chunk-repository.integration.test.ts) | - | Fields mapped | Verify mapping |

**Concept Repository** ([concept-repository.integration.test.ts](../src/__tests__/integration/concept-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find concept by exact name`](../src/__tests__/integration/concept-repository.integration.test.ts) | Name | Concept found | Verify exact match |
| [`should handle case-insensitive lookup`](../src/__tests__/integration/concept-repository.integration.test.ts) | Various cases | Same result | Verify case handling |
| [`should correctly map vector field`](../src/__tests__/integration/concept-repository.integration.test.ts) | - | Vector mapped | Verify vector (bugfix) |

**Catalog Repository** ([catalog-repository.integration.test.ts](../src/__tests__/integration/catalog-repository.integration.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should perform hybrid search on catalog`](../src/__tests__/integration/catalog-repository.integration.test.ts) | Query | Results returned | Verify hybrid search |
| [`should benefit from title matching`](../src/__tests__/integration/catalog-repository.integration.test.ts) | Title query | Higher title score | Verify title boost |
| [`should find document by exact source path`](../src/__tests__/integration/catalog-repository.integration.test.ts) | Path | Document found | Verify exact path |

---

## Unit Tests

Unit tests are fast, isolated tests using test doubles (fakes/mocks).

### Tool Operations

**Location**: `src/tools/operations/__tests__/`

#### Concept Search ([concept-search.test.ts](../src/tools/operations/__tests__/concept-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find chunks by concept name`](../src/tools/operations/__tests__/concept-search.test.ts) | concept: 'innovation' | Chunks found | Verify concept search |
| [`should return empty result when concept not found`](../src/tools/operations/__tests__/concept-search.test.ts) | concept: 'nonexistent' | Empty result | Handle missing |
| [`should handle empty concept parameter`](../src/tools/operations/__tests__/concept-search.test.ts) | concept: '' | Validation error | Validate input |

#### Catalog Search ([conceptual-catalog-search.test.ts](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted catalog search results`](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts) | text: query | Formatted results | Verify formatting |
| [`should respect limit parameter`](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts) | limit: N | ≤N results | Verify pagination |
| [`should include debug information when enabled`](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts) | debug: true | Debug info present | Verify debug mode |
| [`should require text parameter`](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts) | text missing | Validation error | Validate required |

#### Chunks Search ([conceptual-chunks-search.test.ts](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted chunks from specific source`](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts) | text, source | Filtered chunks | Verify source filter |
| [`should respect limit parameter`](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts) | limit: N | ≤N results | Verify pagination |
| [`should require both text and source parameters`](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts) | Missing params | Validation error | Validate required |

#### Broad Chunks Search ([conceptual-broad-chunks-search.test.ts](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted search results across all documents`](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts) | text: query | Cross-doc results | Verify cross-doc |
| [`should include score information`](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts) | text: query | Scores present | Verify scoring |
| [`should include expanded terms when debug enabled`](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts) | debug: true | Terms shown | Verify debug |

#### Document Concepts Extract ([document-concepts-extract.test.ts](../src/tools/operations/__tests__/document-concepts-extract.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should extract concepts from document in JSON format`](../src/tools/operations/__tests__/document-concepts-extract.test.ts) | document_query | JSON output | Verify extraction |
| [`should return error when document not found`](../src/tools/operations/__tests__/document-concepts-extract.test.ts) | Invalid query | Error response | Handle missing |
| [`should format output as markdown when specified`](../src/tools/operations/__tests__/document-concepts-extract.test.ts) | format: 'markdown' | Markdown output | Verify formatting |

#### Source Concepts ([source-concepts.test.ts](../src/tools/operations/__tests__/source-concepts.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should find all sources for a single concept`](../src/tools/operations/__tests__/source-concepts.test.ts) | concept: string | Sources found | Verify source lookup |
| [`should return union of sources with concept_indices`](../src/tools/operations/__tests__/source-concepts.test.ts) | Array of concepts | Union with indices | Verify multi-concept |
| [`should sort by number of matching concepts`](../src/tools/operations/__tests__/source-concepts.test.ts) | Multiple concepts | Sorted results | Verify sorting |

#### Concept Sources ([concept-sources.test.ts](../src/tools/operations/__tests__/concept-sources.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return sources for a single concept`](../src/tools/operations/__tests__/concept-sources.test.ts) | concept: string | Sources array | Verify per-concept |
| [`should return separate source arrays for each concept`](../src/tools/operations/__tests__/concept-sources.test.ts) | Array of concepts | Separate arrays | Verify separation |
| [`should maintain position correspondence with input`](../src/tools/operations/__tests__/concept-sources.test.ts) | Array of concepts | Correct positions | Verify ordering |

#### Category Search ([category-search.test.ts](../src/tools/operations/__tests__/category-search.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted category search results`](../src/tools/operations/__tests__/category-search.test.ts) | category: name | Formatted results | Verify formatting |
| [`should handle errors gracefully`](../src/tools/operations/__tests__/category-search.test.ts) | Invalid input | Error handled | Error handling |

#### List Categories ([list-categories.test.ts](../src/tools/operations/__tests__/list-categories.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted category list`](../src/tools/operations/__tests__/list-categories.test.ts) | Optional limit | Categories listed | Verify listing |
| [`should handle errors gracefully`](../src/tools/operations/__tests__/list-categories.test.ts) | Error condition | Error handled | Error handling |

#### List Concepts in Category ([list-concepts-in-category.test.ts](../src/tools/operations/__tests__/list-concepts-in-category.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return formatted concepts list`](../src/tools/operations/__tests__/list-concepts-in-category.test.ts) | category: name | Concepts listed | Verify listing |
| [`should handle nonexistent category gracefully`](../src/tools/operations/__tests__/list-concepts-in-category.test.ts) | Invalid category | Empty/error | Handle missing |

---

### Infrastructure: Resilience

**Location**: `src/infrastructure/resilience/__tests__/`

#### Circuit Breaker ([circuit-breaker.test.ts](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should use default configuration when no config provided`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | - | Defaults applied | Verify defaults |
| [`should start in closed state`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | - | state='closed' | Verify initial state |
| [`should execute operations successfully in closed state`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | Success op | Result returned | Verify closed behavior |
| [`should open after reaching failure threshold`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | N failures | state='open' | Verify threshold |
| [`should reject operations immediately when open`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | Op while open | CircuitBreakerOpenError | Verify fast-fail |
| [`should transition to half-open after timeout`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | Wait past timeout | state='half-open' | Verify timeout |
| [`should close after success threshold met`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | N successes | state='closed' | Verify recovery |
| [`should reopen on any failure in half-open state`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | Failure | state='open' | Verify half-open |
| [`should track all metrics accurately`](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts) | Various ops | Correct counts | Verify metrics |

#### Bulkhead ([bulkhead.test.ts](../src/infrastructure/resilience/__tests__/bulkhead.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should use default configuration`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | - | Defaults applied | Verify defaults |
| [`should execute operations when under limit`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | Under limit | Executes | Verify execution |
| [`should limit concurrent operations`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | Over limit | Limited | Verify limit |
| [`should queue operations when at max concurrent`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | At max | Queued | Verify queuing |
| [`should reject when bulkhead is full`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | Beyond capacity | BulkheadRejectionError | Verify rejection |
| [`should track rejection count`](../src/infrastructure/resilience/__tests__/bulkhead.test.ts) | Rejections | Count accurate | Verify rejection count |

#### Timeout ([timeout.test.ts](../src/infrastructure/resilience/__tests__/timeout.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should define standard timeout values`](../src/infrastructure/resilience/__tests__/timeout.test.ts) | - | Values defined | Verify constants |
| [`should return operation result if completes before timeout`](../src/infrastructure/resilience/__tests__/timeout.test.ts) | Fast op | Result returned | Verify success |
| [`should work with operations that reject`](../src/infrastructure/resilience/__tests__/timeout.test.ts) | Reject op | Error propagated | Verify error prop |
| [`should create a wrapped function with timeout`](../src/infrastructure/resilience/__tests__/timeout.test.ts) | Wrap fn | Wrapped fn works | Verify withTimeout |

#### Graceful Degradation ([graceful-degradation.test.ts](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should execute primary operation when it succeeds`](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts) | Success op | Primary result | Verify primary |
| [`should use fallback when primary fails`](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts) | Fail op + fallback | Fallback used | Verify fallback |
| [`should use fallback when shouldDegrade returns true`](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts) | Degrade condition | Proactive fallback | Verify proactive |
| [`should track degradation rate`](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts) | Mixed ops | Rate calculated | Verify rate |

#### Resilient Executor ([resilient-executor.test.ts](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should execute operation without any resilience patterns`](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts) | No config | Executes | Verify basic exec |
| [`should create circuit breaker for operation`](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts) | CB config | CB created | Verify CB creation |
| [`should create bulkhead for operation`](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts) | BH config | BH created | Verify BH creation |
| [`should retry failed operations`](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts) | Retry config | Retries | Verify retry |
| [`should apply all patterns together`](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts) | Full config | All applied | Verify composition |

---

### Infrastructure: Cache

**Location**: `src/infrastructure/cache/__tests__/`

#### LRU Cache ([lru-cache.test.ts](../src/infrastructure/cache/__tests__/lru-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should store and retrieve values`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | key, value | Value retrieved | Verify basic ops |
| [`should evict least recently used item when full`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | Items > capacity | LRU evicted | Verify LRU eviction |
| [`should update LRU order on get`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | Access pattern | Correct order | Verify access tracking |
| [`should expire entries after TTL`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | TTL param | Entry expired | Verify TTL |
| [`should track hits and misses`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | Get ops | Correct counts | Verify hit/miss |
| [`should calculate hit rate correctly`](../src/infrastructure/cache/__tests__/lru-cache.test.ts) | Mixed access | Correct rate | Verify hit rate |

#### Embedding Cache ([embedding-cache.test.ts](../src/infrastructure/cache/__tests__/embedding-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should cache and retrieve embeddings`](../src/infrastructure/cache/__tests__/embedding-cache.test.ts) | text, embedding | Retrieved | Verify caching |
| [`should differentiate by model`](../src/infrastructure/cache/__tests__/embedding-cache.test.ts) | Same text, diff models | Separate entries | Verify model key |
| [`should evict least recently used embeddings when full`](../src/infrastructure/cache/__tests__/embedding-cache.test.ts) | Many entries | LRU evicted | Verify LRU |
| [`should track cache hits and misses`](../src/infrastructure/cache/__tests__/embedding-cache.test.ts) | Get ops | Correct counts | Verify metrics |

#### Search Result Cache ([search-result-cache.test.ts](../src/infrastructure/cache/__tests__/search-result-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should cache and retrieve search results`](../src/infrastructure/cache/__tests__/search-result-cache.test.ts) | query, results | Retrieved | Verify caching |
| [`should generate different keys for different limits`](../src/infrastructure/cache/__tests__/search-result-cache.test.ts) | Same query, diff limits | Different results | Verify key gen |
| [`should expire entries after TTL`](../src/infrastructure/cache/__tests__/search-result-cache.test.ts) | TTL | Entry expired | Verify TTL |
| [`should evict least recently used entries when full`](../src/infrastructure/cache/__tests__/search-result-cache.test.ts) | Many entries | LRU evicted | Verify eviction |

#### Category ID Cache ([category-id-cache.test.ts](../src/infrastructure/cache/__tests__/category-id-cache.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should return same instance on multiple calls`](../src/infrastructure/cache/__tests__/category-id-cache.test.ts) | Multiple calls | Same instance | Verify singleton |
| [`should initialize cache with categories`](../src/infrastructure/cache/__tests__/category-id-cache.test.ts) | Categories | Cache populated | Verify init |
| [`should handle case-insensitive name lookups`](../src/infrastructure/cache/__tests__/category-id-cache.test.ts) | Various cases | Same ID | Verify normalization |
| [`should build alias mappings`](../src/infrastructure/cache/__tests__/category-id-cache.test.ts) | Aliases | Aliases work | Verify aliases |
| [`should build hierarchy mappings`](../src/infrastructure/cache/__tests__/category-id-cache.test.ts) | Parent/child | Hierarchy works | Verify hierarchy |

---

### Concepts Module

**Location**: `src/concepts/__tests__/`

#### Query Expander ([query_expander.test.ts](../src/concepts/__tests__/query_expander.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should extract and normalize terms from query`](../src/concepts/__tests__/query_expander.test.ts) | query text | Terms extracted | Verify extraction |
| [`should filter out short terms (length <= 2)`](../src/concepts/__tests__/query_expander.test.ts) | Short terms | Filtered | Verify filtering |
| [`should assign weight 1.0 to original terms`](../src/concepts/__tests__/query_expander.test.ts) | query | weight=1.0 | Verify weighting |
| [`should search concept table for related concepts`](../src/concepts/__tests__/query_expander.test.ts) | query | Corpus terms | Verify corpus |
| [`should apply 80% weight to corpus terms`](../src/concepts/__tests__/query_expander.test.ts) | Corpus term | weight=0.8 | Verify corpus weight |
| [`should include WordNet terms in expansion`](../src/concepts/__tests__/query_expander.test.ts) | query | WordNet terms | Verify WordNet |
| [`should apply 60% weight to WordNet terms`](../src/concepts/__tests__/query_expander.test.ts) | WordNet term | weight=0.6 | Verify WordNet weight |

#### Concept Chunk Matcher ([concept_chunk_matcher.test.ts](../src/concepts/__tests__/concept_chunk_matcher.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should match exact concept in chunk text`](../src/concepts/__tests__/concept_chunk_matcher.test.ts) | Concept, chunk | Matched | Verify exact match |
| [`should match multiple concepts in chunk`](../src/concepts/__tests__/concept_chunk_matcher.test.ts) | Multiple concepts | All matched | Verify multi-match |
| [`should calculate density for matched concepts`](../src/concepts/__tests__/concept_chunk_matcher.test.ts) | Concepts, chunk | Density calculated | Verify density |
| [`should enrich multiple chunks`](../src/concepts/__tests__/concept_chunk_matcher.test.ts) | Chunks, concepts | All enriched | Verify enrichment |
| [`should calculate statistics for enriched chunks`](../src/concepts/__tests__/concept_chunk_matcher.test.ts) | Enriched chunks | Stats calculated | Verify stats |

#### Concept Enricher ([concept_enricher.test.ts](../src/concepts/__tests__/concept_enricher.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should enrich concepts with WordNet data`](../src/concepts/__tests__/concept_enricher.test.ts) | Concepts | Enriched with synonyms | Verify enrichment |
| [`should limit synonyms to top 5`](../src/concepts/__tests__/concept_enricher.test.ts) | Concept | ≤5 synonyms | Verify limit |
| [`should handle concepts not found in WordNet`](../src/concepts/__tests__/concept_enricher.test.ts) | Unknown concept | Graceful handling | Handle missing |
| [`should process multiple concepts`](../src/concepts/__tests__/concept_enricher.test.ts) | Multiple | All processed | Verify batch |

#### Parallel Concept Extractor ([parallel-concept-extractor.test.ts](../src/concepts/__tests__/parallel-concept-extractor.test.ts))

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| [`should process a single document`](../src/concepts/__tests__/parallel-concept-extractor.test.ts) | Document | Concepts extracted | Verify single |
| [`should process multiple documents`](../src/concepts/__tests__/parallel-concept-extractor.test.ts) | Documents | All processed | Verify batch |
| [`should handle concurrency batching`](../src/concepts/__tests__/parallel-concept-extractor.test.ts) | Many docs | Batched correctly | Verify batching |
| [`should isolate errors to individual documents`](../src/concepts/__tests__/parallel-concept-extractor.test.ts) | Some fail | Others succeed | Verify isolation |

---

## Property Tests

Property-based tests use random input generation to verify mathematical invariants.

### Query Expander Properties ([query_expander.property.test.ts](../src/concepts/__tests__/query_expander.property.test.ts))

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| [`Original terms inclusion`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | original_terms ⊆ all_terms | Verify inclusion |
| [`Weight bounds`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | ∀term: 0 ≤ weight ≤ 1 | Verify bounds |
| [`Original terms weight`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | ∀original: weight = 1.0 | Verify weighting |
| [`Consistency`](../src/concepts/__tests__/query_expander.property.test.ts) | Same string twice | Same original_terms | Verify determinism |
| [`Short term filtering`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | ∀term: length > 2 | Verify filtering |
| [`Term normalization`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | lowercase, alphanumeric | Verify normalization |
| [`Subset property`](../src/concepts/__tests__/query_expander.property.test.ts) | Random strings | corpus ∪ wordnet ⊆ all_terms | Verify structure |

### Concept Chunk Matcher Properties ([concept_chunk_matcher.property.test.ts](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts))

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| [`Density bounds`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Random concepts/chunks | 0 ≤ density ≤ 1 | Verify bounds |
| [`Arrays returned`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Random inputs | concepts, categories are arrays | Verify arrays |
| [`Empty chunk`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Empty text | density = 0 | Verify empty |
| [`No concepts`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Empty concepts | density = 0 | Verify no concepts |
| [`Idempotent`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Same input twice | Same output | Verify idempotent |
| [`Preserve count`](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts) | Chunks array | Same length | Verify preservation |

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

## Adding New Tests

1. **Unit tests**: Co-locate in `__tests__/` directory next to source
2. **Integration tests**: Add to `src/__tests__/integration/`
3. **E2E tests**: Add to `src/__tests__/e2e/`
4. **Property tests**: Suffix with `.property.test.ts`

Follow existing patterns and use test helpers for consistency.
