# E2E Tests for Resilience Patterns

End-to-end tests that validate resilience patterns with realistic service behaviors and failure scenarios.

## Test Suites

### 1. LLM Circuit Breaker E2E (`llm-circuit-breaker.e2e.test.ts`)

**Purpose:** Validate full circuit breaker lifecycle with simulated LLM service failures.

**Tests:**
- ✅ Full cycle: closed → open → half-open → closed
- ✅ Fast-fail behavior when circuit is open (<10ms)
- ✅ Intermittent failure handling (circuit stays closed)
- ✅ Metrics tracking through full cycle

**Duration:** ~30 seconds per test

**Key Validations:**
- Circuit opens after failure threshold (5 consecutive failures)
- Fast-fail rejections while circuit is open
- Circuit transitions to half-open after timeout (5s)
- Circuit closes after success threshold (2 successes)
- Metrics accurately track requests, failures, successes, rejections

### 2. Bulkhead Under Load E2E (`bulkhead-under-load.e2e.test.ts`)

**Purpose:** Validate bulkhead resource isolation under realistic concurrent load.

**Tests:**
- ✅ Concurrency limiting and queue overflow
- ✅ Sustained load handling (100 operations)
- ✅ Slot release as operations complete
- ✅ Utilization metrics accuracy
- ✅ Independent bulkhead pools

**Duration:** ~45 seconds per test

**Key Validations:**
- Bulkhead limits concurrent operations (e.g., max 5)
- Queue management works correctly (e.g., max 10 queued)
- Overflow operations are rejected with BulkheadRejectionError
- Operations complete as slots become available
- Multiple bulkheads don't interfere with each other

### 3. Document Pipeline Resilience E2E (`document-pipeline-resilience.e2e.test.ts`)

**Purpose:** Validate resilience patterns in full document processing pipeline.

**Pipeline Stages:**
1. Concept extraction (circuit breaker + timeout)
2. Embedding generation (bulkhead + timeout)
3. Database storage (retry + timeout)

**Tests:**
- ✅ Successful processing with healthy services
- ✅ Partial failure handling (LLM fails, embedding continues)
- ✅ Concurrent chunk processing with bulkhead
- ✅ Recovery after service restoration
- ✅ Health summary across pipeline
- ✅ Service isolation with slow services

**Duration:** ~60 seconds per test

**Key Validations:**
- Pipeline continues when individual services fail
- Circuit breakers isolate failures
- Bulkheads prevent resource exhaustion
- Services recover automatically
- Health summary reflects actual state

## Running E2E Tests

### Run All E2E Tests

```bash
npm test -- src/__tests__/e2e/
```

### Run Specific Test Suite

```bash
# Circuit breaker tests
npm test -- src/__tests__/e2e/llm-circuit-breaker.e2e.test.ts

# Bulkhead tests
npm test -- src/__tests__/e2e/bulkhead-under-load.e2e.test.ts

# Pipeline tests
npm test -- src/__tests__/e2e/document-pipeline-resilience.e2e.test.ts
```

### Run with Console Output

```bash
npm test -- src/__tests__/e2e/ --reporter=verbose
```

## Test Infrastructure

### Mock Service Framework (`mock-service-framework.ts`)

Provides controllable mock services for testing:

- `MockService<T>` - Generic mock service with failure injection
- `MockLLMService` - Mock LLM for concept extraction
- `MockEmbeddingService` - Mock embedding generation
- `MockDatabaseService` - Mock database operations

**Key Features:**
- Set health status: `setHealthy(true/false)`
- Add artificial delay: `setResponseDelay(ms)`
- Inject specific errors: `setError(error)`
- Random failure probability: `setFailureProbability(0-1)`
- Track statistics: `getStats()`

### Test Helpers (`resilience-test-helpers.ts`)

Utilities for testing resilience patterns:

- `waitForCircuitState()` - Wait for circuit breaker state transition
- `assertBulkheadUtilization()` - Verify bulkhead metrics
- `measureDuration()` - Measure operation execution time
- `waitForCondition()` - Wait for arbitrary condition
- `executeConcurrentBatch()` - Launch concurrent operations
- `countResults()` - Count successful/failed operations

## Test Characteristics

### Timing

Tests use shorter timeouts than production for faster execution:
- Circuit breaker timeout: 5s (production: 60s)
- Reset timeout: 1s (production: 10s)
- Operation delays: 50-2000ms (simulated)

### Concurrency

Tests validate concurrent operations:
- 10-25 concurrent operations per test
- Multiple batches for sustained load
- Independent bulkhead pools

### Failure Scenarios

Tests inject various failure types:
- Service unavailable (503)
- Timeouts
- Intermittent failures
- Sustained failures
- Slow responses

## Expected Results

### All Tests Passing

When run successfully, all E2E tests should pass:

```
Test Files  3 passed (3)
     Tests  17 passed (17)
  Duration  ~2-3 minutes
```

### Test Coverage

E2E tests complement unit tests by validating:
- ✅ Real-world failure scenarios
- ✅ Full integration of patterns
- ✅ Timing behavior
- ✅ Concurrent operations
- ✅ Recovery mechanisms
- ✅ End-to-end pipelines

## Troubleshooting

### Tests Timeout

If tests timeout, check:
- Circuit breaker timeout is set correctly (5s in tests)
- Mock service delays aren't too long
- Concurrent operations aren't deadlocked

### Flaky Tests

If tests are flaky:
- Increase timing tolerances (e.g., `expect(duration).toBeLessThan(X)`)
- Add more buffer time for state transitions
- Check for race conditions in concurrent operations

### Console Output

Tests include console.log statements for debugging:
- Phase transitions (circuit breaker)
- Batch processing (bulkhead)
- Pipeline stage results

Run with `--reporter=verbose` to see all output.

## Performance Benchmarks

Expected performance (on typical development machine):

| Test Suite | Duration | Operations | Avg per Op |
|------------|----------|------------|------------|
| Circuit Breaker | ~30s | 50-100 | <1s |
| Bulkhead | ~45s | 100-150 | <0.5s |
| Pipeline | ~60s | 50-100 | <2s |

## Integration with CI/CD

These E2E tests can be run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: npm test -- src/__tests__/e2e/
  timeout-minutes: 5
```

**Note:** E2E tests take longer than unit tests (2-3 minutes vs 30 seconds).

## Future Enhancements

Potential additions:
- Chaos testing with random failure injection
- Long-running stability tests (30+ minutes)
- Network partition simulation
- Multiple simultaneous service failures
- Real external service integration (optional)

## Maintenance

When updating resilience patterns:
1. Update corresponding E2E tests
2. Verify timing parameters are still realistic
3. Add tests for new failure scenarios
4. Update this README with new tests

---

**Created:** November 25, 2025  
**Last Updated:** November 25, 2025  
**Test Infrastructure Version:** 1.0.0

