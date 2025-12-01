# 42. System Resilience Patterns

**Date:** 2025-11-25  
**Status:** Accepted  
**Deciders**: Development Team   
**Technical Story:** Implement resilience patterns to protect against external dependency failures and prevent cascade failures.

**Sources:**
- Planning: .ai/planning/2025-11-25-resilience-patterns/IMPLEMENTATION-PLAN.md
- Implementation: Multiple commits in feat/system-resilience-patterns branch
- Related ADR: ADR-0034 (Retry Strategies)

## Context and Problem Statement

The system depends on external services (LLM API for concept extraction, embedding services, external databases) that can fail, become slow, or be temporarily unavailable. Without resilience patterns, these failures can cascade through the system, causing complete outages or degraded user experience.

**The Core Problem:** External dependency failures can make the entire system unresponsive, and there's no systematic way to isolate failures, prevent resource exhaustion, or recover gracefully.

**Decision Drivers:**
* **Reliability:** System must remain operational when external services fail [Category: availability]
* **Performance:** System must not waste resources on failing operations [Category: efficiency]
* **User Experience:** Users should get fast failures instead of hung requests [Category: UX]
* **Observability:** Need visibility into service health and failure patterns [Category: monitoring]
* **Recovery:** Automatic detection and recovery when services return [Category: automation]

## Alternative Options

* **Option 1: Comprehensive Resilience Patterns** - Circuit breaker, bulkhead, timeout, graceful degradation (CHOSEN)
* **Option 2: Retry-Only** - Just add retry logic everywhere
* **Option 3: Service Mesh** - Use Istio/Linkerd for resilience
* **Option 4: Manual Fallbacks** - Hardcode fallback logic per service
* **Option 5: No Resilience** - Let services fail naturally

## Decision Outcome

**Chosen option:** "Comprehensive Resilience Patterns (Option 1)", because it provides systematic protection against all failure modes while maintaining code clarity and avoiding external dependencies.

### Implementation Overview

Implemented four core resilience patterns that work together:

**1. Timeout Management** [Source: timeout.ts]

```typescript
// Prevent operations from hanging indefinitely
const result = await withTimeout(
  () => llmAPI.extractConcepts(text),
  TIMEOUTS.LLM_CALL, // 30s
  'llm_extract'
);
```

**2. Circuit Breaker Pattern** [Source: circuit-breaker.ts]

```typescript
// Fast-fail when service is unhealthy
const breaker = new CircuitBreaker('llm-api', {
  failureThreshold: 5,    // Open after 5 failures
  successThreshold: 2,    // Close after 2 successes
  timeout: 60000          // Try recovery after 60s
});

const result = await breaker.execute(() => llmAPI.call());
```

**3. Bulkhead Pattern** [Source: bulkhead.ts]

```typescript
// Limit concurrent operations to prevent resource exhaustion
const bulkhead = new Bulkhead('llm-service', {
  maxConcurrent: 5,   // Only 5 concurrent operations
  maxQueue: 10        // Up to 10 waiting
});

const result = await bulkhead.execute(() => llmAPI.call());
```

**4. Graceful Degradation** [Source: graceful-degradation.ts]

```typescript
// Provide fallback when primary service fails
const degradation = new GracefulDegradation();

const concepts = await degradation.execute({
  primary: () => llmAPI.extractConcepts(text),
  fallback: () => Promise.resolve({ primary: [], technical: [], related: [] }),
  shouldDegrade: () => circuitBreaker.isOpen()
});
```

**5. Resilient Executor (Combined)** [Source: resilient-executor.ts]

```typescript
// Apply all patterns in one call
const executor = new ResilientExecutor(retryService);

const result = await executor.execute(
  () => llmAPI.extractConcepts(text),
  {
    name: 'llm_extract',
    timeout: 30000,
    retry: { maxRetries: 3 },
    circuitBreaker: { failureThreshold: 5 },
    bulkhead: { maxConcurrent: 5 }
  }
);
```

**Architecture:**

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│    (Services use ResilientExecutor)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      ResilientExecutor                  │
│  ┌──────────────────────────────────┐   │
│  │  1. Bulkhead (concurrency limit) │   │
│  │         │                        │   │
│  │  2. Circuit Breaker (fast-fail)  │   │
│  │         │                        │   │
│  │  3. Timeout (bound duration)     │   │
│  │         │                        │   │
│  │  4. Retry (exponential backoff)  │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       External Services                 │
│  • LLM API (Anthropic/OpenAI)           │
│  • Embedding Service                    │
│  • External Database                    │
└─────────────────────────────────────────┘
```

### Consequences

**Positive:**
* **Improved Availability:** System stays operational when external services fail [Impact: high]
* **Better Performance:** Fast-fail prevents resource waste on doomed requests [Metric: <10ms rejection vs 30s+ timeout]
* **Resource Protection:** Bulkhead prevents exhaustion of threads/connections [Quality: stability]
* **Automatic Recovery:** Circuit breaker detects and recovers from transient failures [Impact: reduces manual intervention]
* **Graceful User Experience:** Clear error messages and fallback functionality [Quality: UX improvement]
* **Comprehensive Metrics:** Full visibility into failure patterns and recovery [Quality: observability]

**Negative:**
* **Code Complexity:** Additional abstraction layer for service calls [Cost: ~20% more code]
* **Configuration Overhead:** Need to tune thresholds per service [Cost: requires monitoring data]
* **Testing Complexity:** More scenarios to test (timeouts, circuit states) [Cost: ~30% more tests]

**Neutral:**
* **Standard Patterns:** Follows well-known resilience patterns (Hystrix, Resilience4j) [Pattern: industry standard]
* **Composable Design:** Patterns can be used independently or combined [Fit: flexible]

### Confirmation

**Validation:** [Source: test results]
- ✅ **Tests:** 160/160 passing across 5 test suites
- ✅ **Coverage:** 100% of new resilience code
- ✅ **Build:** Zero TypeScript errors
- ✅ **Integration:** All existing tests still passing (855 total)

**Files Created:** [Source: Implementation]
1. `src/infrastructure/resilience/timeout.ts` - Timeout utilities (152 lines)
2. `src/infrastructure/resilience/circuit-breaker.ts` - Circuit breaker (398 lines)
3. `src/infrastructure/resilience/bulkhead.ts` - Bulkhead pattern (262 lines)
4. `src/infrastructure/resilience/graceful-degradation.ts` - Degradation strategies (380 lines)
5. `src/infrastructure/resilience/resilient-executor.ts` - Combined wrapper (445 lines)
6. `src/infrastructure/resilience/errors.ts` - Resilience-specific errors (64 lines)
7. `src/infrastructure/resilience/index.ts` - Module exports (34 lines)
8. Comprehensive test suites for each component (2,600+ lines of tests)

## Pros and Cons of the Options

### Option 1: Comprehensive Resilience Patterns - Chosen

**Description:** Implement circuit breaker, bulkhead, timeout, and graceful degradation as composable patterns.

**Pros:**
* Systematic protection against all failure modes
* Each pattern addresses a specific concern
* Patterns work independently or together
* Full control over behavior and configuration
* No external runtime dependencies
* [Validated in production] Used by Netflix (Hystrix), Microsoft (Polly)

**Cons:**
* More code to maintain than simpler approaches
* Requires understanding of multiple patterns
* Need to tune configuration per service

### Option 2: Retry-Only

**Description:** Just add retry logic with exponential backoff everywhere.

**Pros:**
* Simple to implement
* Already partially done (ADR-0034)
* Minimal code changes

**Cons:**
* **Dealbreaker:** Doesn't prevent resource exhaustion [Problem: retries consume more resources]
* **Dealbreaker:** No fast-fail mechanism when service is down [Problem: all requests wait full timeout]
* **Limitation:** Wastes resources retrying during prolonged outages [Trade-off: poor resource utilization]

### Option 3: Service Mesh

**Description:** Use Istio or Linkerd to provide resilience at network layer.

**Pros:**
* Resilience logic external to application code
* Consistent across all services
* Battle-tested in production

**Cons:**
* **Dealbreaker:** Adds significant infrastructure complexity [Problem: requires Kubernetes, service mesh expertise]
* **Dealbreaker:** Not suitable for embedded/library use cases [Problem: this is a library, not a service]
* **Limitation:** Less control over application-level fallbacks [Trade-off: can't implement custom degradation]

### Option 4: Manual Fallbacks

**Description:** Hardcode fallback logic in each service class.

**Pros:**
* Full control per service
* No abstraction overhead
* Simple to understand locally

**Cons:**
* **Dealbreaker:** Inconsistent behavior across services [Problem: no standard pattern]
* **Dealbreaker:** Duplicated logic everywhere [Problem: maintenance burden]
* **Limitation:** No metrics or monitoring built-in [Trade-off: poor observability]

### Option 5: No Resilience

**Description:** Let services fail naturally and handle errors at call sites.

**Pros:**
* Simplest possible approach
* No additional code

**Cons:**
* **Dealbreaker:** System unreliable in production [Problem: unacceptable availability]
* **Dealbreaker:** Poor user experience during outages [Problem: hung requests, timeouts]
* **Dealbreaker:** Resource exhaustion possible [Problem: stability issues]

## Implementation Notes

### Pattern Application Order

Patterns are applied in this specific order for correctness:

1. **Bulkhead** (outermost) - Limit concurrency first
2. **Circuit Breaker** - Fast-fail if service is unhealthy
3. **Timeout** - Bound operation duration
4. **Retry** (innermost) - Retry failed operations

This order ensures:
- Bulkhead limits total concurrent requests before any other logic
- Circuit breaker can prevent expensive timeout+retry cycles
- Timeout prevents individual operations from hanging
- Retry happens at the core, closest to the actual operation

### Predefined Resilience Profiles

Provide standard configurations for common scenarios:

```typescript
// LLM API profile
ResilienceProfiles.LLM_API = {
  timeout: 30000,               // 30s (concept extraction takes time)
  retry: { maxRetries: 3 },     // 3 retries (API can be flaky)
  circuitBreaker: {             
    failureThreshold: 5,        // Open after 5 failures
    timeout: 60000              // Try recovery after 60s
  },
  bulkhead: {
    maxConcurrent: 5,           // Limited concurrent LLM calls
    maxQueue: 10                // Allow some queueing
  }
};

// Embedding profile
ResilienceProfiles.EMBEDDING = {
  timeout: 10000,               // 10s (faster than LLM)
  circuitBreaker: { ... },
  bulkhead: { maxConcurrent: 10 } // More concurrent embeddings
};

// Database profile
ResilienceProfiles.DATABASE = {
  timeout: 3000,                // 3s (should be fast)
  retry: { maxRetries: 2 },     // Quick retries
  bulkhead: { maxConcurrent: 20 } // Many concurrent queries
  // No circuit breaker (internal service)
};
```

### Circuit Breaker State Machine

```
         ┌─────────────┐
         │   CLOSED    │ ◄── Normal operation
         │ (requests   │
         │   pass)     │
         └──────┬──────┘
                │
          failures ≥
          threshold
                │
                ▼
         ┌─────────────┐
         │    OPEN     │ ◄── Fast-fail mode
         │ (requests   │
         │  rejected)  │
         └──────┬──────┘
                │
          timeout
          expired
                │
                ▼
         ┌─────────────┐
         │ HALF-OPEN   │ ◄── Testing recovery
         │ (limited    │
         │  requests)  │
         └──────┬──────┘
                │
        ┌───────┴───────┐
        │               │
   successes ≥    any failure
   threshold          │
        │               │
        ▼               ▼
    [CLOSED]        [OPEN]
```

### Metrics and Monitoring

Each pattern provides detailed metrics:

```typescript
// Circuit breaker metrics
{
  state: 'open' | 'closed' | 'half-open',
  failures: number,
  successes: number,
  rejections: number,
  totalRequests: number,
  lastFailure: Date,
  lastStateChange: Date
}

// Bulkhead metrics
{
  active: number,
  queued: number,
  rejections: number,
  maxConcurrent: number,
  maxQueue: number,
  totalExecuted: number
}

// Health summary
{
  healthy: boolean,
  openCircuits: string[],    // List of open circuit breakers
  fullBulkheads: string[],   // List of full bulkheads
  warnings: string[]          // Rejection warnings
}
```

### Evolution

**Changes from Plan:**
- Planned: Separate logger interface for all components
- Actual: Used console.log for simplicity, can be replaced later with proper logger injection
- Reason: Avoid adding logging infrastructure complexity in this phase

- Planned: Health checks integration
- Actual: Provided health summary API, but didn't integrate with system health checks
- Reason: Health check infrastructure doesn't exist yet, will integrate when available

## Related Decisions

- [ADR-0034: Comprehensive Error Handling](adr0034-comprehensive-error-handling.md) - Retry strategies that work with resilience patterns
- Future: ADR on observability/metrics integration
- Future: ADR on health check infrastructure

## References

### External Resources
- [Microsoft: Circuit Breaker Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Netflix Hystrix](https://github.com/Netflix/Hystrix) - Original circuit breaker implementation
- [Resilience4j](https://resilience4j.readme.io/) - Java resilience library (inspiration)
- [Release It! by Michael T. Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/) - Stability patterns book

### Planning Documents
- Feature Plan: .ai/planning/2025-11-25-resilience-patterns/IMPLEMENTATION-PLAN.md

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning: 2025-11-25
- Implementation: 2025-11-25
- Branch: feat/system-resilience-patterns

**Traceability:** .ai/planning/2025-11-25-resilience-patterns/


