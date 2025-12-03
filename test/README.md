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

### Bulkhead Under Load (`bulkhead-under-load.e2e.test.ts`)

Tests bulkhead pattern under realistic concurrent load.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should limit concurrent operations and queue overflow properly` | maxConcurrent: 5, maxQueue: 10, 20 ops | 15 successful, 5 rejected | [Verify concurrency limits](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts#L29) |
| `should handle sustained concurrent load without resource exhaustion` | 100 ops, maxConcurrent: 10 | >80% success rate | [Test sustained load](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts#L86) |
| `should allow operations to complete as slots become available` | 8 ops, maxConcurrent: 3 | All 8 succeed, duration 2.5-4s | [Verify slot release](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts#L145) |
| `should track utilization metrics accurately` | 12 ops, maxConcurrent: 5 | Metrics show 2 rejections | [Verify metrics accuracy](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts#L199) |
| `should protect multiple resource pools independently` | 2 bulkheads | Each bulkhead independent | [Verify isolation](../src/__tests__/e2e/bulkhead-under-load.e2e.test.ts#L271) |

### Cache Performance (`cache-performance.e2e.test.ts`)

Tests real-world caching performance and effectiveness.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should demonstrate cache hit rate >60% on repeated queries` | 5 queries, 2 passes | >30% improvement | [Verify cache effectiveness](../src/__tests__/e2e/cache-performance.e2e.test.ts#L31) |
| `should maintain performance under realistic query patterns` | 100 queries (70% repeated) | >50% hit rate | [Test realistic usage](../src/__tests__/e2e/cache-performance.e2e.test.ts#L84) |
| `should cache embeddings for repeated texts` | Same query twice | Second faster | [Verify embedding cache](../src/__tests__/e2e/cache-performance.e2e.test.ts#L134) |
| `should expire search results after TTL` | Query with TTL | Immediate repeat faster | [Verify TTL behavior](../src/__tests__/e2e/cache-performance.e2e.test.ts#L238) |
| `should handle concurrent queries efficiently` | 50 parallel queries | All complete, <200ms avg | [Verify concurrent access](../src/__tests__/e2e/cache-performance.e2e.test.ts#L265) |
| `should perform well under realistic usage patterns` | 200 mixed operations | <50ms avg, >20 ops/sec | [Validate performance](../src/__tests__/e2e/cache-performance.e2e.test.ts#L299) |

### Document Pipeline Resilience (`document-pipeline-resilience.e2e.test.ts`)

Tests full document ingestion pipeline with resilience patterns.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should process document successfully with all services healthy` | 10 chunks | All processed | [Verify healthy pipeline](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L130) |
| `should handle LLM failures with circuit breaker` | 15 chunks, LLM fails | 5 concepts, 15 embeddings | [Test graceful degradation](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L156) |
| `should handle concurrent chunk processing with bulkhead` | 25 chunks | >60% success rate | [Verify concurrent processing](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L211) |
| `should recover and continue when services recover` | 20 chunks, fail/recover | Pipeline recovers | [Test recovery behavior](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L259) |
| `should provide comprehensive health summary` | Various states | Summary accurate | [Verify health monitoring](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L345) |
| `should maintain service isolation when one is slow` | LLM 2s, others 50ms | All complete, isolated | [Test service isolation](../src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts#L393) |

### LLM Circuit Breaker (`llm-circuit-breaker.e2e.test.ts`)

Tests full circuit breaker lifecycle with simulated LLM service.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should protect against sustained LLM failures and recover` | 5 failure threshold | Full lifecycle | [Full lifecycle test](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts#L28) |
| `should handle intermittent failures without opening circuit` | Alternating success/fail | Circuit stays closed | [Verify intermittent handling](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts#L180) |
| `should track metrics accurately through full cycle` | Various operations | Accurate counts | [Verify metrics](../src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts#L227) |

### Real Service Integration (`real-service-integration.e2e.test.ts`)

Tests actual production integration of resilience features.

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should create ResilientExecutor before initializing services` | Container | executor defined | [Verify early init](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L53) |
| `should verify resilience is configured with production profiles` | Test operation | Executor called | [Verify configuration](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L78) |
| `should verify ConceptualHybridSearchService integration` | - | Integration verified | [Code structure](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L118) |
| `should verify LanceDBConnection integration` | - | Integration verified | [Code structure](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L134) |
| `should verify services work without resilientExecutor` | No executor | Service works | [Backward compatibility](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L146) |
| `should verify services work with resilientExecutor` | With executor | Service works | [Enhanced mode](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L176) |
| `should document where to find integration evidence` | - | Evidence listed | [Integration docs](../src/__tests__/e2e/real-service-integration.e2e.test.ts#L212) |

---

## Integration Tests

Integration tests verify cross-component workflows with real database interactions.

**Location**: `src/__tests__/integration/`

### Application Container (`application-container.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should initialize container with database connection` | Test database | No error | [Verify init](../src/__tests__/integration/application-container.integration.test.ts#L38) |
| `should register all base tools` | - | ≥5 tools registered | [Verify tool registration](../src/__tests__/integration/application-container.integration.test.ts#L44) |
| `should register category tools when categories table exists` | Categories table | 3 category tools | [Verify optional tools](../src/__tests__/integration/application-container.integration.test.ts#L58) |
| `should return concept_search tool` | Tool name | Correct tool returned | [Verify getTool](../src/__tests__/integration/application-container.integration.test.ts#L73) |
| `should throw error for non-existent tool` | 'nonexistent' | Error thrown | [Verify error handling](../src/__tests__/integration/application-container.integration.test.ts#L118) |
| `should execute concept_search tool` | Query params | Result defined | [Verify execution](../src/__tests__/integration/application-container.integration.test.ts#L127) |
| `should wire all tools with proper dependencies` | Tool names | All execute | [Verify wiring](../src/__tests__/integration/application-container.integration.test.ts#L244) |

### MCP Tools Integration (`mcp-tools-integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find chunks by concept name` | concept: string | Chunks returned | [Verify concept search](../src/__tests__/integration/mcp-tools-integration.test.ts#L45) |
| `should handle non-existent concepts gracefully` | Invalid concept | Empty results | [Handle missing](../src/__tests__/integration/mcp-tools-integration.test.ts#L63) |
| `should search document summaries` | text: query | Documents found | [Verify catalog search](../src/__tests__/integration/mcp-tools-integration.test.ts#L96) |
| `should return results with scores` | text: query | Scores present | [Verify scoring](../src/__tests__/integration/mcp-tools-integration.test.ts#L113) |
| `should search within specific document` | text, source | Filtered results | [Verify chunks search](../src/__tests__/integration/mcp-tools-integration.test.ts#L150) |
| `should search across all chunks` | text: query | Cross-doc results | [Verify broad search](../src/__tests__/integration/mcp-tools-integration.test.ts#L213) |
| `should extract concepts from document` | document_query | Concepts extracted | [Verify extraction](../src/__tests__/integration/mcp-tools-integration.test.ts#L250) |
| `should support catalog → chunks search workflow` | Multi-step | Workflow completes | [Verify workflow](../src/__tests__/integration/mcp-tools-integration.test.ts#L375) |

### Resilience Integration (`resilience-integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should create ResilientExecutor and RetryService` | Container | Both defined | [Verify creation](../src/__tests__/integration/resilience-integration.test.ts#L15) |
| `should use ResilientExecutor when provided` | Mock executor | Executor used | [Verify injection](../src/__tests__/integration/resilience-integration.test.ts#L37) |
| `should work without ResilientExecutor` | No executor | Works | [Backward compat](../src/__tests__/integration/resilience-integration.test.ts#L52) |
| `should accept ResilientExecutor in connect` | Mock executor | Connection works | [Verify DB integration](../src/__tests__/integration/resilience-integration.test.ts#L62) |

### Error Handling (`error-handling.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should throw structured validation error for invalid search query` | Invalid query | ValidationError | [Verify validation](../src/__tests__/integration/error-handling.integration.test.ts#L19) |
| `should propagate validation errors through tool layer` | Invalid input | Error propagated | [Verify propagation](../src/__tests__/integration/error-handling.integration.test.ts#L66) |
| `should format errors correctly for MCP tool responses` | Error | Correct format | [Verify MCP format](../src/__tests__/integration/error-handling.integration.test.ts#L164) |
| `should not retry validation errors` | Validation error | No retry | [Verify no retry](../src/__tests__/integration/error-handling.integration.test.ts#L206) |

### Repository Integration Tests

**Chunk Repository** (`chunk-repository.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find chunks by concept name` | Concept name | Chunks found | [Verify concept lookup](../src/__tests__/integration/chunk-repository.integration.test.ts#L65) |
| `should find chunks by catalog title` | Title | Chunks found | [Verify title lookup](../src/__tests__/integration/chunk-repository.integration.test.ts#L145) |
| `should perform hybrid search across all chunks` | Query | Results ranked | [Verify hybrid search](../src/__tests__/integration/chunk-repository.integration.test.ts#L185) |
| `should correctly map all chunk fields` | - | Fields mapped | [Verify mapping](../src/__tests__/integration/chunk-repository.integration.test.ts#L253) |

**Concept Repository** (`concept-repository.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find concept by exact name` | Name | Concept found | [Verify exact match](../src/__tests__/integration/concept-repository.integration.test.ts#L43) |
| `should handle case-insensitive lookup` | Various cases | Same result | [Verify case handling](../src/__tests__/integration/concept-repository.integration.test.ts#L56) |
| `should correctly map vector field` | - | Vector mapped | [Verify vector (bugfix)](../src/__tests__/integration/concept-repository.integration.test.ts#L91) |

**Catalog Repository** (`catalog-repository.integration.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should perform hybrid search on catalog` | Query | Results returned | [Verify hybrid search](../src/__tests__/integration/catalog-repository.integration.test.ts#L45) |
| `should benefit from title matching` | Title query | Higher title score | [Verify title boost](../src/__tests__/integration/catalog-repository.integration.test.ts#L81) |
| `should find document by exact source path` | Path | Document found | [Verify exact path](../src/__tests__/integration/catalog-repository.integration.test.ts#L111) |

---

## Unit Tests

Unit tests are fast, isolated tests using test doubles (fakes/mocks).

### Tool Operations

**Location**: `src/tools/operations/__tests__/`

#### Concept Search (`concept-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find chunks by concept name` | concept: 'innovation' | Chunks found | [Verify concept search](../src/tools/operations/__tests__/concept-search.test.ts#L38) |
| `should return empty result when concept not found` | concept: 'nonexistent' | Empty result | [Handle missing](../src/tools/operations/__tests__/concept-search.test.ts#L90) |
| `should handle empty concept parameter` | concept: '' | Validation error | [Validate input](../src/tools/operations/__tests__/concept-search.test.ts#L103) |

#### Catalog Search (`conceptual-catalog-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted catalog search results` | text: query | Formatted results | [Verify formatting](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts#L29) |
| `should respect limit parameter` | limit: N | ≤N results | [Verify pagination](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts#L64) |
| `should include debug information when enabled` | debug: true | Debug info present | [Verify debug mode](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts#L83) |
| `should require text parameter` | text missing | Validation error | [Validate required](../src/tools/operations/__tests__/conceptual-catalog-search.test.ts#L153) |

#### Chunks Search (`conceptual-chunks-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted chunks from specific source` | text, source | Filtered chunks | [Verify source filter](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts#L65) |
| `should respect limit parameter` | limit: N | ≤N results | [Verify pagination](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts#L104) |
| `should require both text and source parameters` | Missing params | Validation error | [Validate required](../src/tools/operations/__tests__/conceptual-chunks-search.test.ts#L183) |

#### Broad Chunks Search (`conceptual-broad-chunks-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted search results across all documents` | text: query | Cross-doc results | [Verify cross-doc](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L29) |
| `should include score information` | text: query | Scores present | [Verify scoring](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L81) |
| `should include expanded terms when debug enabled` | debug: true | Terms shown | [Verify debug](../src/tools/operations/__tests__/conceptual-broad-chunks-search.test.ts#L105) |

#### Document Concepts Extract (`document-concepts-extract.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should extract concepts from document in JSON format` | document_query | JSON output | [Verify extraction](../src/tools/operations/__tests__/document-concepts-extract.test.ts#L54) |
| `should return error when document not found` | Invalid query | Error response | [Handle missing](../src/tools/operations/__tests__/document-concepts-extract.test.ts#L79) |
| `should format output as markdown when specified` | format: 'markdown' | Markdown output | [Verify formatting](../src/tools/operations/__tests__/document-concepts-extract.test.ts#L113) |

#### Source Concepts (`source-concepts.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should find all sources for a single concept` | concept: string | Sources found | [Verify source lookup](../src/tools/operations/__tests__/source-concepts.test.ts#L32) |
| `should return union of sources with concept_indices` | Array of concepts | Union with indices | [Verify multi-concept](../src/tools/operations/__tests__/source-concepts.test.ts#L63) |
| `should sort by number of matching concepts` | Multiple concepts | Sorted results | [Verify sorting](../src/tools/operations/__tests__/source-concepts.test.ts#L103) |

#### Concept Sources (`concept-sources.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return sources for a single concept` | concept: string | Sources array | [Verify per-concept](../src/tools/operations/__tests__/concept-sources.test.ts#L32) |
| `should return separate source arrays for each concept` | Array of concepts | Separate arrays | [Verify separation](../src/tools/operations/__tests__/concept-sources.test.ts#L66) |
| `should maintain position correspondence with input` | Array of concepts | Correct positions | [Verify ordering](../src/tools/operations/__tests__/concept-sources.test.ts#L98) |

#### Category Search (`category-search.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted category search results` | category: name | Formatted results | [Verify formatting](../src/tools/operations/__tests__/category-search.test.ts#L131) |
| `should handle errors gracefully` | Invalid input | Error handled | [Error handling](../src/tools/operations/__tests__/category-search.test.ts#L159) |

#### List Categories (`list-categories.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted category list` | Optional limit | Categories listed | [Verify listing](../src/tools/operations/__tests__/list-categories.test.ts#L49) |
| `should handle errors gracefully` | Error condition | Error handled | [Error handling](../src/tools/operations/__tests__/list-categories.test.ts#L65) |

#### List Concepts in Category (`list-concepts-in-category.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return formatted concepts list` | category: name | Concepts listed | [Verify listing](../src/tools/operations/__tests__/list-concepts-in-category.test.ts#L73) |
| `should handle nonexistent category gracefully` | Invalid category | Empty/error | [Handle missing](../src/tools/operations/__tests__/list-concepts-in-category.test.ts#L90) |

---

### Infrastructure: Resilience

**Location**: `src/infrastructure/resilience/__tests__/`

#### Circuit Breaker (`circuit-breaker.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should use default configuration when no config provided` | - | Defaults applied | [Verify defaults](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L19) |
| `should start in closed state` | - | state='closed' | [Verify initial state](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L53) |
| `should execute operations successfully in closed state` | Success op | Result returned | [Verify closed behavior](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L76) |
| `should open after reaching failure threshold` | N failures | state='open' | [Verify threshold](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L118) |
| `should reject operations immediately when open` | Op while open | CircuitBreakerOpenError | [Verify fast-fail](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L192) |
| `should transition to half-open after timeout` | Wait past timeout | state='half-open' | [Verify timeout](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L242) |
| `should close after success threshold met` | N successes | state='closed' | [Verify recovery](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L312) |
| `should reopen on any failure in half-open state` | Failure | state='open' | [Verify half-open](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L331) |
| `should track all metrics accurately` | Various ops | Correct counts | [Verify metrics](../src/infrastructure/resilience/__tests__/circuit-breaker.test.ts#L447) |

#### Bulkhead (`bulkhead.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should use default configuration` | - | Defaults applied | [Verify defaults](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L16) |
| `should execute operations when under limit` | Under limit | Executes | [Verify execution](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L98) |
| `should limit concurrent operations` | Over limit | Limited | [Verify limit](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L164) |
| `should queue operations when at max concurrent` | At max | Queued | [Verify queuing](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L262) |
| `should reject when bulkhead is full` | Beyond capacity | BulkheadRejectionError | [Verify rejection](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L365) |
| `should track rejection count` | Rejections | Count accurate | [Verify rejection count](../src/infrastructure/resilience/__tests__/bulkhead.test.ts#L416) |

#### Timeout (`timeout.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should define standard timeout values` | - | Values defined | [Verify constants](../src/infrastructure/resilience/__tests__/timeout.test.ts#L16) |
| `should return operation result if completes before timeout` | Fast op | Result returned | [Verify success](../src/infrastructure/resilience/__tests__/timeout.test.ts#L26) |
| `should work with operations that reject` | Reject op | Error propagated | [Verify error prop](../src/infrastructure/resilience/__tests__/timeout.test.ts#L85) |
| `should create a wrapped function with timeout` | Wrap fn | Wrapped fn works | [Verify withTimeout](../src/infrastructure/resilience/__tests__/timeout.test.ts#L142) |

#### Graceful Degradation (`graceful-degradation.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should execute primary operation when it succeeds` | Success op | Primary result | [Verify primary](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts#L39) |
| `should use fallback when primary fails` | Fail op + fallback | Fallback used | [Verify fallback](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts#L54) |
| `should use fallback when shouldDegrade returns true` | Degrade condition | Proactive fallback | [Verify proactive](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts#L98) |
| `should track degradation rate` | Mixed ops | Rate calculated | [Verify rate](../src/infrastructure/resilience/__tests__/graceful-degradation.test.ts#L271) |

#### Resilient Executor (`resilient-executor.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should execute operation without any resilience patterns` | No config | Executes | [Verify basic exec](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts#L24) |
| `should create circuit breaker for operation` | CB config | CB created | [Verify CB creation](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts#L61) |
| `should create bulkhead for operation` | BH config | BH created | [Verify BH creation](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts#L146) |
| `should retry failed operations` | Retry config | Retries | [Verify retry](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts#L224) |
| `should apply all patterns together` | Full config | All applied | [Verify composition](../src/infrastructure/resilience/__tests__/resilient-executor.test.ts#L283) |

---

### Infrastructure: Cache

**Location**: `src/infrastructure/cache/__tests__/`

#### LRU Cache (`lru-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should store and retrieve values` | key, value | Value retrieved | [Verify basic ops](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L16) |
| `should evict least recently used item when full` | Items > capacity | LRU evicted | [Verify LRU eviction](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L55) |
| `should update LRU order on get` | Access pattern | Correct order | [Verify access tracking](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L68) |
| `should expire entries after TTL` | TTL param | Entry expired | [Verify TTL](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L110) |
| `should track hits and misses` | Get ops | Correct counts | [Verify hit/miss](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L148) |
| `should calculate hit rate correctly` | Mixed access | Correct rate | [Verify hit rate](../src/infrastructure/cache/__tests__/lru-cache.test.ts#L161) |

#### Embedding Cache (`embedding-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should cache and retrieve embeddings` | text, embedding | Retrieved | [Verify caching](../src/infrastructure/cache/__tests__/embedding-cache.test.ts#L19) |
| `should differentiate by model` | Same text, diff models | Separate entries | [Verify model key](../src/infrastructure/cache/__tests__/embedding-cache.test.ts#L39) |
| `should evict least recently used embeddings when full` | Many entries | LRU evicted | [Verify LRU](../src/infrastructure/cache/__tests__/embedding-cache.test.ts#L161) |
| `should track cache hits and misses` | Get ops | Correct counts | [Verify metrics](../src/infrastructure/cache/__tests__/embedding-cache.test.ts#L206) |

#### Search Result Cache (`search-result-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should cache and retrieve search results` | query, results | Retrieved | [Verify caching](../src/infrastructure/cache/__tests__/search-result-cache.test.ts#L27) |
| `should generate different keys for different limits` | Same query, diff limits | Different results | [Verify key gen](../src/infrastructure/cache/__tests__/search-result-cache.test.ts#L79) |
| `should expire entries after TTL` | TTL | Entry expired | [Verify TTL](../src/infrastructure/cache/__tests__/search-result-cache.test.ts#L124) |
| `should evict least recently used entries when full` | Many entries | LRU evicted | [Verify eviction](../src/infrastructure/cache/__tests__/search-result-cache.test.ts#L204) |

#### Category ID Cache (`category-id-cache.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should return same instance on multiple calls` | Multiple calls | Same instance | [Verify singleton](../src/infrastructure/cache/__tests__/category-id-cache.test.ts#L90) |
| `should initialize cache with categories` | Categories | Cache populated | [Verify init](../src/infrastructure/cache/__tests__/category-id-cache.test.ts#L101) |
| `should handle case-insensitive name lookups` | Various cases | Same ID | [Verify normalization](../src/infrastructure/cache/__tests__/category-id-cache.test.ts#L128) |
| `should build alias mappings` | Aliases | Aliases work | [Verify aliases](../src/infrastructure/cache/__tests__/category-id-cache.test.ts#L158) |
| `should build hierarchy mappings` | Parent/child | Hierarchy works | [Verify hierarchy](../src/infrastructure/cache/__tests__/category-id-cache.test.ts#L184) |

---

### Concepts Module

**Location**: `src/concepts/__tests__/`

#### Query Expander (`query_expander.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should extract and normalize terms from query` | query text | Terms extracted | [Verify extraction](../src/concepts/__tests__/query_expander.test.ts#L133) |
| `should filter out short terms (length <= 2)` | Short terms | Filtered | [Verify filtering](../src/concepts/__tests__/query_expander.test.ts#L148) |
| `should assign weight 1.0 to original terms` | query | weight=1.0 | [Verify weighting](../src/concepts/__tests__/query_expander.test.ts#L179) |
| `should search concept table for related concepts` | query | Corpus terms | [Verify corpus](../src/concepts/__tests__/query_expander.test.ts#L221) |
| `should apply 80% weight to corpus terms` | Corpus term | weight=0.8 | [Verify corpus weight](../src/concepts/__tests__/query_expander.test.ts#L282) |
| `should include WordNet terms in expansion` | query | WordNet terms | [Verify WordNet](../src/concepts/__tests__/query_expander.test.ts#L350) |
| `should apply 60% weight to WordNet terms` | WordNet term | weight=0.6 | [Verify WordNet weight](../src/concepts/__tests__/query_expander.test.ts#L364) |

#### Concept Chunk Matcher (`concept_chunk_matcher.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should match exact concept in chunk text` | Concept, chunk | Matched | [Verify exact match](../src/concepts/__tests__/concept_chunk_matcher.test.ts#L23) |
| `should match multiple concepts in chunk` | Multiple concepts | All matched | [Verify multi-match](../src/concepts/__tests__/concept_chunk_matcher.test.ts#L39) |
| `should calculate density for matched concepts` | Concepts, chunk | Density calculated | [Verify density](../src/concepts/__tests__/concept_chunk_matcher.test.ts#L119) |
| `should enrich multiple chunks` | Chunks, concepts | All enriched | [Verify enrichment](../src/concepts/__tests__/concept_chunk_matcher.test.ts#L258) |
| `should calculate statistics for enriched chunks` | Enriched chunks | Stats calculated | [Verify stats](../src/concepts/__tests__/concept_chunk_matcher.test.ts#L326) |

#### Concept Enricher (`concept_enricher.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should enrich concepts with WordNet data` | Concepts | Enriched with synonyms | [Verify enrichment](../src/concepts/__tests__/concept_enricher.test.ts#L67) |
| `should limit synonyms to top 5` | Concept | ≤5 synonyms | [Verify limit](../src/concepts/__tests__/concept_enricher.test.ts#L101) |
| `should handle concepts not found in WordNet` | Unknown concept | Graceful handling | [Handle missing](../src/concepts/__tests__/concept_enricher.test.ts#L200) |
| `should process multiple concepts` | Multiple | All processed | [Verify batch](../src/concepts/__tests__/concept_enricher.test.ts#L275) |

#### Parallel Concept Extractor (`parallel-concept-extractor.test.ts`)

| Test | Parameters | Pass/Fail Criteria | Purpose |
|------|------------|-------------------|---------|
| `should process a single document` | Document | Concepts extracted | [Verify single](../src/concepts/__tests__/parallel-concept-extractor.test.ts#L42) |
| `should process multiple documents` | Documents | All processed | [Verify batch](../src/concepts/__tests__/parallel-concept-extractor.test.ts#L61) |
| `should handle concurrency batching` | Many docs | Batched correctly | [Verify batching](../src/concepts/__tests__/parallel-concept-extractor.test.ts#L101) |
| `should isolate errors to individual documents` | Some fail | Others succeed | [Verify isolation](../src/concepts/__tests__/parallel-concept-extractor.test.ts#L132) |

---

## Property Tests

Property-based tests use random input generation to verify mathematical invariants.

### Query Expander Properties (`query_expander.property.test.ts`)

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| Original terms inclusion | Random strings | original_terms ⊆ all_terms | [Verify inclusion](../src/concepts/__tests__/query_expander.property.test.ts#L45) |
| Weight bounds | Random strings | ∀term: 0 ≤ weight ≤ 1 | [Verify bounds](../src/concepts/__tests__/query_expander.property.test.ts#L64) |
| Original terms weight | Random strings | ∀original: weight = 1.0 | [Verify weighting](../src/concepts/__tests__/query_expander.property.test.ts#L86) |
| Consistency | Same string twice | Same original_terms | [Verify determinism](../src/concepts/__tests__/query_expander.property.test.ts#L106) |
| Short term filtering | Random strings | ∀term: length > 2 | [Verify filtering](../src/concepts/__tests__/query_expander.property.test.ts#L138) |
| Term normalization | Random strings | lowercase, alphanumeric | [Verify normalization](../src/concepts/__tests__/query_expander.property.test.ts#L157) |
| Subset property | Random strings | corpus ∪ wordnet ⊆ all_terms | [Verify structure](../src/concepts/__tests__/query_expander.property.test.ts#L202) |

### Concept Chunk Matcher Properties (`concept_chunk_matcher.property.test.ts`)

| Property | Generator | Invariant | Purpose |
|----------|-----------|-----------|---------|
| Density bounds | Random concepts/chunks | 0 ≤ density ≤ 1 | [Verify bounds](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L28) |
| Arrays returned | Random inputs | concepts, categories are arrays | [Verify arrays](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L53) |
| Empty chunk | Empty text | density = 0 | [Verify empty](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L80) |
| No concepts | Empty concepts | density = 0 | [Verify no concepts](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L109) |
| Idempotent | Same input twice | Same output | [Verify idempotent](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L132) |
| Preserve count | Chunks array | Same length | [Verify preservation](../src/concepts/__tests__/concept_chunk_matcher.property.test.ts#L160) |

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
