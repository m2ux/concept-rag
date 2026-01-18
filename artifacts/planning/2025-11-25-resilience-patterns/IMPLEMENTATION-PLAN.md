# Phase 4: System Resilience Patterns - Implementation Plan

**Date:** November 25, 2025  
**Priority:** MEDIUM-HIGH (Reliability)  
**Status:** Ready for Implementation  
**Estimated Effort:** 3-4h agentic + 1h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

This plan implements system resilience patterns (circuit breaker, bulkhead, timeout management, graceful degradation) to make the system robust against external dependency failures and prevent cascade failures.

**Key Goal:** Protect the system from external dependency failures (LLM API, embedding service, database) through proven resilience patterns.

---

## Problem Statement

### Current State

The system currently has:
- ✅ RetryService with exponential backoff (ADR 0034)
- ✅ Exception hierarchy with proper error propagation

### Critical Gaps

**The system is vulnerable to:**

1. **Cascade Failures** - When LLM API fails, the entire request pipeline hangs or fails
2. **Resource Exhaustion** - Unlimited concurrent requests to failing services consume all resources
3. **Hung Operations** - No timeouts means operations can hang indefinitely
4. **No Recovery Strategy** - System doesn't know when to stop trying or when services recover

**Real-World Impact:**
- A slow LLM API can block all concept extraction operations
- Database connection issues can exhaust connection pools
- No visibility into when external services are unhealthy
- No graceful degradation when services fail

---

## Task Selection Matrix

Use this matrix to select which tasks to implement. Each task is independent and can be implemented separately.

| Task | Priority | Complexity | Justification | Implement? |
|------|----------|------------|---------------|------------|
| 4.1 Circuit Breaker | HIGH | Medium | Prevents cascade failures, core resilience pattern | ✓ |
| 4.2 Bulkhead Pattern | MEDIUM | Medium | Isolates failures, prevents resource exhaustion | ✓ |
| 4.3 Timeout Management | HIGH | Low | Prevents hung operations, quick win | ✓ |
| 4.4 Graceful Degradation | MEDIUM | Medium | Improves user experience during failures | ✓ |

**Instructions:** Replace ✓ with X for any task you wish to skip.

---

## Task 4.1: Circuit Breaker Pattern

**Duration:** 60-75 min agentic + 15 min review  
**Priority:** HIGH  
**Complexity:** Medium

### Problem This Solves

**Scenario:**
1. LLM API goes down or starts returning 500 errors
2. Every concept extraction request retries 3x with exponential backoff
3. All requests spend 30+ seconds failing before giving up
4. System becomes unresponsive as threads pile up waiting for failures
5. Users experience timeouts even for operations that don't need LLM

**Without Circuit Breaker:**
- Every request suffers the full retry cycle (potentially 60+ seconds)
- System resources exhausted by doomed requests
- No fast-fail mechanism
- Recovery is slow when service returns

**With Circuit Breaker:**
- After 5 failures, circuit "opens" (fast-fail mode)
- Subsequent requests fail immediately without trying
- After timeout (60s), circuit tries "half-open" (test recovery)
- On success, circuit "closes" (normal operation resumes)

### Why Implement This

**Benefits:**
1. **Prevents Cascade Failures** - Failing service doesn't take down entire system
2. **Fast Recovery** - Automatic detection when service returns
3. **Resource Protection** - Stop wasting resources on doomed requests
4. **Better UX** - Quick failures instead of long timeouts
5. **Observability** - Circuit state shows health of external services

**Risk Mitigation:**
- **Without this:** Single external service failure can make entire system unresponsive
- **With this:** System stays operational for non-dependent features

**Production Impact:**
- LLM API rate limits → Circuit opens → System continues with cached/degraded results
- Database issues → Circuit protects connection pool → Read-only operations continue

### What You'll Build

**Core Implementation:**

```typescript
// File: src/infrastructure/resilience/circuit-breaker.ts

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Fast-fail without trying
      throw new CircuitBreakerOpenError();
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

**Usage Example:**

```typescript
// Protect LLM calls
const llmCircuitBreaker = new CircuitBreaker('llm-api', {
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60000,           // Try recovery after 60s
  resetTimeout: 10000       // Reset counter after 10s
});

// Every LLM call goes through circuit breaker
const concepts = await llmCircuitBreaker.execute(
  () => llmAPI.extractConcepts(text)
);
```

**Deliverables:**
1. `src/infrastructure/resilience/circuit-breaker.ts` (200-250 lines)
   - CircuitBreaker class with state machine
   - State transitions (closed → open → half-open → closed)
   - Configurable thresholds and timeouts
   - Metrics tracking (failures, successes, rejections)

2. `src/infrastructure/resilience/__tests__/circuit-breaker.test.ts` (300-400 lines)
   - 25+ unit tests covering all states
   - State transition tests
   - Edge cases (concurrent requests, timing)
   - Metrics accuracy tests

3. Integration with LLM service
4. Integration with embedding service

### Dependencies

**Requires:**
- ILogger interface (exists)
- Custom error types (will create)

**Blocks:**
- Task 4.4 (Graceful Degradation) - needs circuit breaker state

**Independent of:**
- Task 4.2 (Bulkhead)
- Task 4.3 (Timeout)

### Success Criteria

- [ ] Circuit breaker opens after threshold failures
- [ ] Fast-fail when open (no actual call made)
- [ ] Automatic recovery testing (half-open state)
- [ ] Circuit closes on successful recovery
- [ ] Metrics track state transitions and rejections
- [ ] Integration tests with simulated LLM failures
- [ ] 100% test coverage of state machine logic

### Justification Score

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| **Impact** | 9/10 | Prevents system-wide failures from external services |
| **Urgency** | 7/10 | Production deployments need this for reliability |
| **Effort** | 7/10 | Well-understood pattern, clear implementation |
| **Dependencies** | 9/10 | No blockers, enables other resilience features |
| **ROI** | 9/10 | High impact, reasonable effort |

**Recommendation:** **IMPLEMENT** - Core resilience pattern, high ROI, enables graceful degradation.

---

## Task 4.2: Bulkhead Pattern (Resource Isolation)

**Duration:** 45-60 min agentic + 15 min review  
**Priority:** MEDIUM  
**Complexity:** Medium

### Problem This Solves

**Scenario:**
1. LLM API becomes very slow (30s per request instead of 3s)
2. Concurrent search requests all call LLM for concept extraction
3. All available threads/resources consumed by waiting LLM calls
4. Even simple cached queries can't run (no threads available)
5. System becomes completely unresponsive

**Without Bulkhead:**
- One slow service can consume all system resources
- Unrelated operations blocked by resource exhaustion
- No isolation between critical and non-critical operations

**With Bulkhead:**
- LLM operations limited to 5 concurrent requests
- Additional requests queue (up to 10) or reject
- Database operations have separate resource pool
- Critical operations can't be starved by non-critical ones

### Why Implement This

**Benefits:**
1. **Failure Isolation** - Slow LLM doesn't block database operations
2. **Resource Protection** - Prevents exhaustion of thread pools, connections
3. **Predictable Performance** - Known limits on concurrent operations
4. **Quality of Service** - Critical operations protected from non-critical
5. **Load Shedding** - Graceful rejection when overloaded

**Risk Mitigation:**
- **Without this:** Slow external service can make entire system unresponsive
- **With this:** System maintains responsiveness for isolated operations

**Production Impact:**
- LLM slowdown → LLM bulkhead fills → Extra requests rejected → Other operations continue
- Database connection issues → Database bulkhead protects pool → System doesn't exhaust connections

### What You'll Build

**Core Implementation:**

```typescript
// File: src/infrastructure/resilience/bulkhead.ts

export class Bulkhead {
  private activeRequests = 0;
  private queue: Array<() => void> = [];
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueue) {
        throw new BulkheadRejectionError('Resource pool full');
      }
      await this.waitForSlot();
    }
    
    this.activeRequests++;
    try {
      return await operation();
    } finally {
      this.activeRequests--;
      this.releaseNext();
    }
  }
}
```

**Usage Example:**

```typescript
// Separate bulkheads for different services
const llmBulkhead = new Bulkhead('llm', {
  maxConcurrent: 5,    // Only 5 concurrent LLM calls
  maxQueue: 10         // Up to 10 waiting
});

const dbBulkhead = new Bulkhead('database', {
  maxConcurrent: 20,   // More DB connections allowed
  maxQueue: 50
});

// Operations isolated by bulkhead
await llmBulkhead.execute(() => llm.extract(text));
await dbBulkhead.execute(() => db.query(sql));
```

**Deliverables:**
1. `src/infrastructure/resilience/bulkhead.ts` (150-200 lines)
   - Bulkhead class with concurrency limits
   - Queue management (wait/release)
   - Rejection policy when full
   - Metrics (active, queued, rejected)

2. `src/infrastructure/resilience/__tests__/bulkhead.test.ts` (250-300 lines)
   - 20+ unit tests
   - Concurrency limit enforcement
   - Queue management
   - Rejection behavior
   - Metrics accuracy

3. Integration with services
4. Configuration for different resource pools

### Dependencies

**Requires:**
- ILogger interface (exists)
- Custom error types (will create)

**Blocks:**
- Nothing (independent enhancement)

**Independent of:**
- Task 4.1 (Circuit Breaker)
- Task 4.3 (Timeout)
- Task 4.4 (Graceful Degradation)

### Success Criteria

- [ ] Concurrent requests limited to configured max
- [ ] Queue management works correctly
- [ ] Rejections when queue full
- [ ] Metrics track active/queued/rejected
- [ ] Integration tests with concurrent load
- [ ] 100% test coverage

### Justification Score

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| **Impact** | 7/10 | Prevents resource exhaustion, isolates failures |
| **Urgency** | 6/10 | Important but not critical for initial deployment |
| **Effort** | 6/10 | Straightforward implementation, queue management |
| **Dependencies** | 9/10 | No blockers, completely independent |
| **ROI** | 7/10 | Good impact, reasonable effort |

**Recommendation:** **IMPLEMENT** - Complements circuit breaker, good resource protection, reasonable effort.

**Alternative:** Can defer if time-constrained - circuit breaker + timeout provide core resilience.

---

## Task 4.3: Timeout Management

**Duration:** 30-45 min agentic + 15 min review  
**Priority:** HIGH  
**Complexity:** Low

### Problem This Solves

**Scenario:**
1. LLM API hangs without responding (network issue, service freeze)
2. Request waits indefinitely for response
3. No timeout configured → operation never completes
4. Resources (memory, threads, connections) leaked
5. User never gets response (bad UX)

**Without Timeout:**
- Operations can hang forever
- Resource leaks from abandoned operations
- No way to detect completely hung operations
- Poor user experience (waiting forever)

**With Timeout:**
- Operations fail after reasonable time (30s for LLM, 5s for search)
- Resources properly released
- Clear error to user about timeout
- Enables retry or fallback strategies

### Why Implement This

**Benefits:**
1. **Resource Protection** - Prevents resource leaks from hung operations
2. **User Experience** - Clear timeout errors vs hanging forever
3. **Debugging** - Timeout errors easier to diagnose than hangs
4. **Enables Retry** - Can retry timed-out operations
5. **Service Health** - Timeouts indicate service health issues

**Risk Mitigation:**
- **Without this:** Single hung request can leak resources indefinitely
- **With this:** Bounded resource usage, predictable failure mode

**Production Impact:**
- Network issue → LLM call times out after 30s → Error logged → Retry or fallback
- Database query hangs → Timeout after 3s → Connection released → Other queries continue

### What You'll Build

**Core Implementation:**

```typescript
// File: src/infrastructure/resilience/timeout.ts

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(operationName, timeoutMs)),
        timeoutMs
      )
    )
  ]);
}

// Predefined timeouts
export const TIMEOUTS = {
  LLM_CALL: 30000,        // 30s for concept extraction
  EMBEDDING: 10000,       // 10s for embedding generation  
  SEARCH: 5000,           // 5s for search operations
  DATABASE: 3000,         // 3s for database queries
  HEALTH_CHECK: 1000      // 1s for health checks
};
```

**Usage Example:**

```typescript
// Wrap any async operation with timeout
const concepts = await withTimeout(
  () => llmAPI.extractConcepts(text),
  TIMEOUTS.LLM_CALL,
  'llm_extract_concepts'
);

// Timeout error includes operation name and duration
// TimeoutError: Operation llm_extract_concepts timed out after 30000ms
```

**Deliverables:**
1. `src/infrastructure/resilience/timeout.ts` (80-100 lines)
   - `withTimeout` utility function
   - TimeoutError class
   - Predefined timeout constants
   - Type-safe wrappers

2. `src/infrastructure/resilience/__tests__/timeout.test.ts` (150-200 lines)
   - 15+ unit tests
   - Timeout enforcement tests
   - Error message validation
   - Edge cases (0ms, very large values)

3. Integration with services
4. Documentation of timeout values and rationale

### Dependencies

**Requires:**
- None (standalone utility)

**Blocks:**
- Nothing (but recommended to have before circuit breaker)

**Enhances:**
- Task 4.1 (Circuit Breaker) - timeouts provide faster failure detection
- Task 4.4 (Graceful Degradation) - timeouts enable fallback triggers

### Success Criteria

- [ ] Operations timeout at configured duration
- [ ] TimeoutError includes operation name and duration
- [ ] Timeouts don't leak resources
- [ ] Works with async/await and promises
- [ ] Integration tests with delayed operations
- [ ] 100% test coverage

### Justification Score

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| **Impact** | 8/10 | Prevents hung operations, resource leaks |
| **Urgency** | 8/10 | Should have this before production |
| **Effort** | 9/10 | Simple implementation, well-understood pattern |
| **Dependencies** | 10/10 | Zero dependencies, enables other features |
| **ROI** | 9/10 | High impact, minimal effort, quick win |

**Recommendation:** **IMPLEMENT FIRST** - Quick win, high ROI, no dependencies, enables other patterns.

---

## Task 4.4: Graceful Degradation Strategies

**Duration:** 45-60 min agentic + 15 min review  
**Priority:** MEDIUM  
**Complexity:** Medium

### Problem This Solves

**Scenario:**
1. LLM API fails and circuit breaker opens
2. All concept extraction requests immediately fail
3. System can't process any new documents
4. Users see error messages, no alternative offered
5. System appears "broken" even though core search works

**Without Graceful Degradation:**
- Binary failure mode: works perfectly or fails completely
- Poor user experience during outages
- No fallback options
- System appears more fragile than it is

**With Graceful Degradation:**
- Concept extraction fails → Skip enrichment, index anyway (degraded mode)
- Embedding service fails → Use simpler embedding model or cached embeddings
- Search continues with reduced features during outages
- Clear communication about degraded mode

### Why Implement This

**Benefits:**
1. **Better UX** - System continues with reduced features vs complete failure
2. **Resilience** - Partial functionality better than none
3. **Communication** - Users know system is degraded (vs broken)
4. **Business Continuity** - Critical operations continue
5. **Recovery** - Automatic restoration when services return

**Risk Mitigation:**
- **Without this:** Users abandon system during outages
- **With this:** Users continue working with reduced features

**Production Impact:**
- LLM outage → Documents indexed without concept enrichment → Search still works
- Embedding failure → Use cached embeddings or skip hybrid scoring → Basic search continues
- Users see "degraded mode" status → Know service will recover

### What You'll Build

**Core Implementation:**

```typescript
// File: src/infrastructure/resilience/graceful-degradation.ts

export interface DegradationStrategy<T> {
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
  shouldDegrade: () => boolean;
}

export class GracefulDegradation {
  async execute<T>(strategy: DegradationStrategy<T>): Promise<T> {
    if (strategy.shouldDegrade()) {
      this.logger.warn('Degraded mode active');
      return strategy.fallback();
    }
    
    try {
      return await strategy.primary();
    } catch (error) {
      this.logger.warn('Primary failed, using fallback', error);
      return strategy.fallback();
    }
  }
}
```

**Usage Example:**

```typescript
// Concept extraction with fallback
const concepts = await degradation.execute({
  primary: () => llmAPI.extractConcepts(text),
  fallback: () => ({
    primary: [],      // No concepts
    technical: [],
    related: []
  }),
  shouldDegrade: () => llmCircuitBreaker.isOpen()
});

// Document still indexed, just without concepts
// Search continues to work
```

**Deliverables:**
1. `src/infrastructure/resilience/graceful-degradation.ts` (150-200 lines)
   - GracefulDegradation class
   - DegradationStrategy interface
   - Health status integration
   - Fallback execution with logging

2. Fallback strategies for:
   - Concept extraction (skip enrichment)
   - Embedding generation (use simple model)
   - Hybrid search (fall back to vector-only)

3. `src/infrastructure/resilience/__tests__/graceful-degradation.test.ts` (200-250 lines)
   - 20+ unit tests
   - Fallback execution tests
   - Circuit breaker integration
   - Health status tests

4. Documentation of degradation scenarios

### Dependencies

**Requires:**
- Task 4.1 (Circuit Breaker) - needs state to determine degradation
- ILogger interface (exists)

**Blocks:**
- Nothing (optional enhancement)

**Enhances:**
- Overall system resilience
- User experience during outages

### Success Criteria

- [ ] Fallback strategies defined for major operations
- [ ] Degradation triggered by circuit breaker state
- [ ] Clear logging when degraded mode active
- [ ] Automatic recovery when services return
- [ ] Health status reflects degradation state
- [ ] Integration tests with simulated failures
- [ ] Documentation of each fallback strategy

### Justification Score

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| **Impact** | 7/10 | Improves UX during outages, better than nothing |
| **Urgency** | 5/10 | Nice to have, not critical for initial deployment |
| **Effort** | 6/10 | Moderate - need to design fallback strategies |
| **Dependencies** | 5/10 | Requires circuit breaker first |
| **ROI** | 6/10 | Good impact but requires circuit breaker |

**Recommendation:** **IMPLEMENT AFTER Circuit Breaker** - Good UX improvement but depends on Task 4.1.

**Alternative:** Can defer to future iteration - circuit breaker + timeout provide core resilience.

---

## Implementation Strategy

### Recommended Order

Based on dependencies and ROI:

1. **Task 4.3: Timeout Management** (30-45 min) - Quick win, no dependencies, high ROI
2. **Task 4.1: Circuit Breaker** (60-75 min) - Core pattern, enables degradation
3. **Task 4.2: Bulkhead Pattern** (45-60 min) - Independent, complements circuit breaker
4. **Task 4.4: Graceful Degradation** (45-60 min) - Builds on circuit breaker

**Total if all implemented:** 3-4 hours agentic + 1 hour review

### Minimum Viable Implementation

For time-constrained scenarios, implement only:

1. **Task 4.3: Timeout Management** - Prevents hung operations (HIGH priority)
2. **Task 4.1: Circuit Breaker** - Prevents cascade failures (HIGH priority)

**Minimum total:** 1.5-2 hours agentic + 30 min review

This provides 80% of resilience benefits with 50% of effort.

### Maximum Impact Implementation

For production-ready resilience:

1. All four tasks (provides comprehensive resilience)
2. Full integration with existing services
3. Comprehensive testing including chaos tests
4. Complete monitoring and metrics

---

## Integration Points

### Services to Protect

**High Priority:**
1. **LLM API** (Anthropic/OpenAI)
   - Concept extraction
   - Circuit breaker: 5 failures, 60s timeout
   - Timeout: 30s
   - Bulkhead: 5 concurrent max
   - Fallback: Skip concept enrichment

2. **Embedding Service**
   - Vector generation
   - Circuit breaker: 5 failures, 60s timeout
   - Timeout: 10s
   - Bulkhead: 10 concurrent max
   - Fallback: Use simple model or cache

**Medium Priority:**
3. **Database** (LanceDB)
   - All queries
   - Timeout: 3s
   - Bulkhead: 20 concurrent max
   - No circuit breaker (internal service)

### Container Integration

```typescript
// src/application/container.ts

export class ApplicationContainer {
  private resilientExecutor: ResilientExecutor;
  
  constructor() {
    // Initialize resilience infrastructure
    this.resilientExecutor = new ResilientExecutor(
      this.retryService,
      this.logger
    );
    
    // Wrap LLM service
    this.llmService = this.createResilientLLMService();
  }
  
  private createResilientLLMService() {
    return {
      extractConcepts: (text: string) =>
        this.resilientExecutor.execute(
          () => this.rawLLMService.extractConcepts(text),
          {
            name: 'llm_extract',
            timeout: 30000,
            retry: { maxAttempts: 3, ... },
            circuitBreaker: { failureThreshold: 5, ... },
            bulkhead: { maxConcurrent: 5, maxQueue: 10 }
          }
        )
    };
  }
}
```

---

## Testing Strategy

### Unit Tests (Each Task)

**Per component:**
- 15-25 unit tests
- 100% coverage of logic
- Edge cases and error conditions
- Mock external dependencies

**Total:** ~80 unit tests across all tasks

### Integration Tests

**Cross-component testing:**
1. Circuit breaker + timeout integration
2. Bulkhead + circuit breaker interaction
3. Full resilience stack with real services (test mode)
4. Degradation triggered by circuit breaker state

**Deliverable:** 10-15 integration tests

### Chaos Tests

**Simulate real failures:**
1. Kill LLM API → Circuit breaker opens → Fast-fail
2. Slow API → Timeouts trigger → Bulkhead protects
3. High load → Bulkhead rejects → Other operations continue
4. Service recovery → Circuit breaker closes → Normal operation

**Deliverable:** 5-10 chaos tests (optional but recommended)

### Performance Tests

**Verify resilience doesn't hurt performance:**
1. Measure overhead of circuit breaker (should be <1ms)
2. Measure overhead of bulkhead (should be minimal)
3. Measure timeout accuracy
4. Verify fast-fail is actually fast (<10ms)

---

## Success Criteria

### Functional Requirements

- [ ] Circuit breaker opens/closes based on failures/successes
- [ ] Bulkhead limits concurrent operations per pool
- [ ] Timeouts enforce maximum operation duration
- [ ] Graceful degradation provides fallback functionality
- [ ] All components integrate with existing services
- [ ] Health status reflects resilience state

### Resilience Targets

- [ ] System operational when LLM API fails (core features work)
- [ ] System operational when embedding API fails (degraded search)
- [ ] No cascade failures observed
- [ ] Recovery time <5 minutes for transient failures
- [ ] Fast-fail <10ms when circuit breaker open
- [ ] Resource usage bounded under high load

### Quality Requirements

- [ ] 100% test coverage for all resilience components
- [ ] Integration tests with simulated failures
- [ ] Chaos tests validate real-world scenarios
- [ ] Metrics visible and accurate
- [ ] Documentation complete (ADR, inline, usage guide)
- [ ] Zero regressions in existing tests

---

## Documentation Deliverables

### Required (Task Implementation)

1. **ADR-0042: System Resilience Patterns**
   - Context: External dependency reliability
   - Decision: Which patterns implemented and why
   - Alternatives considered
   - Implementation details
   - Consequences and trade-offs

2. **RESILIENCE-IMPLEMENTATION-COMPLETE.md**
   - What was built
   - Test results
   - Performance impact
   - Configuration guide

3. **Inline JSDoc**
   - All public APIs documented
   - Usage examples for complex patterns

### Optional (If Time Permits)

4. **Resilience Configuration Guide**
   - How to configure thresholds
   - How to monitor circuit breaker state
   - How to test resilience locally

5. **Troubleshooting Guide**
   - Circuit breaker stuck open
   - Bulkhead rejections
   - Timeout tuning

---

## Risk Assessment

### Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Circuit breaker flaps | Medium | Medium | Add hysteresis (different thresholds for open/close) |
| Timeout too aggressive | Medium | High | Start conservative, tune based on metrics |
| Bulkhead too restrictive | Low | Medium | Monitor rejection rate, adjust limits |
| Degradation strategy insufficient | Medium | Medium | Define clear fallbacks, document limitations |

### Production Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Resilience overhead | Low | Low | Measure overhead, optimize if needed |
| False positives (healthy service) | Medium | Medium | Tune thresholds based on real traffic |
| Complex debugging | Medium | Medium | Comprehensive logging and metrics |

---

## Related Decisions

### Existing ADRs

- **ADR-0034:** Retry Strategies and Error Handling
  - Resilience patterns complement retry logic
  - Circuit breaker prevents unnecessary retries

- **ADR-0039:** Multi-Level Caching (PR #19)
  - Cache reduces dependency on external services
  - Resilience patterns protect when cache misses

### Future Considerations

- **Metrics Integration** (Phase 3) - Circuit breaker metrics in dashboard
- **Health Checks** (Phase 1) - Health status reflects circuit breaker state
- **Rate Limiting** - Could add as additional resilience pattern
- **Load Shedding** - Advanced feature for high-load scenarios

---

## Estimated Timeline

| Task | Agentic | Review | Total | Priority |
|------|---------|--------|-------|----------|
| 4.3 Timeout Management | 30-45 min | 15 min | 45-60 min | HIGH ⭐ |
| 4.1 Circuit Breaker | 60-75 min | 15 min | 75-90 min | HIGH ⭐ |
| 4.2 Bulkhead Pattern | 45-60 min | 15 min | 60-75 min | MEDIUM |
| 4.4 Graceful Degradation | 45-60 min | 15 min | 60-75 min | MEDIUM |
| **TOTAL (All)** | **3-4h** | **1h** | **4-5h** | |
| **TOTAL (MVP)** | **1.5-2h** | **30min** | **2-2.5h** | ⭐ Required |

---

## Decision Time: What to Implement?

### Option 1: Full Implementation (Recommended)

**Implement all 4 tasks (4-5 hours total)**

✅ **Pros:**
- Comprehensive resilience coverage
- Production-ready reliability
- All external services protected
- Best user experience during outages

❌ **Cons:**
- Longer time investment upfront
- More code to maintain

**Best for:** Production deployments, high-reliability requirements

---

### Option 2: MVP Implementation (Quick Win)

**Implement Tasks 4.3 + 4.1 only (2-2.5 hours)**

✅ **Pros:**
- 80% of benefits with 50% of effort
- Core resilience patterns in place
- Prevents most critical failures
- Quick to implement

❌ **Cons:**
- No resource isolation (bulkhead)
- No graceful degradation
- Can add others later

**Best for:** Time-constrained scenarios, iterative approach

---

### Option 3: Deferred Implementation

**Implement later when needed**

✅ **Pros:**
- Focus on other features first
- Implement based on real production issues

❌ **Cons:**
- Risk of production incidents
- Reactive vs proactive approach
- Harder to add after issues occur

**Best for:** Low-traffic deployments, controlled environments

---

## My Recommendation

**Implement Option 2 (MVP): Tasks 4.3 + 4.1**

**Rationale:**
1. **Timeout management** (4.3) - Quick win, prevents hung operations, no dependencies
2. **Circuit breaker** (4.1) - Core pattern, prevents cascade failures, high ROI

**Add later if needed:**
3. **Bulkhead** (4.2) - If you observe resource exhaustion
4. **Graceful degradation** (4.4) - If UX during outages becomes important

**Time investment:** 2-2.5 hours for MVP → 80% of benefits

**Upgrade path:** Can add bulkhead + degradation later (2 hours) → 100% implementation

---

**Status:** ✅ Ready for implementation (waiting for task selection)  
**Next Steps:** 
1. Review justifications above
2. Choose implementation option (Full/MVP/Deferred)
3. Mark tasks in selection matrix (✓ or X)
4. Proceed with implementation using [Feature Implementation Workflow](../../.engineering/artifacts/templates/feature-_workflow.md)

**Related Documents:**
- Original plan: [06-resilience-patterns-plan.md](06-resilience-patterns-plan.md)
- Implementation workflow: [feature-_workflow.md](../../.engineering/artifacts/templates/feature-_workflow.md)

