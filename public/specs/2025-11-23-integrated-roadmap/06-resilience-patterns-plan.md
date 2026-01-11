# Phase 4: System Resilience Patterns Implementation Plan

**Date:** November 23, 2025  
**Priority:** MEDIUM-HIGH (Reliability)  
**Status:** Ready for Implementation  
**Estimated Effort:** 3-4h agentic + 1h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

Implement system resilience patterns (circuit breaker, bulkhead, timeout management) to make the system robust against external dependency failures and prevent cascade failures.

---

## Knowledge Base Insights Applied

### Core Resilience Concepts (15 concepts from lexicon)

1. **Circuit breaker pattern** - Preventing cascade failures
2. **Bulkhead pattern** - Isolating failures (resource isolation)
3. **Timeout management** - Preventing resource exhaustion
4. **Graceful degradation** - Fallback mechanisms
5. **Health checks** - System status monitoring
6. **Retry semantics** - Exponential backoff with jitter (partially done)
7. **Idempotence** - Safe retry of operations
8. **Fault tolerance** - Graceful failure handling
9. **Failure detection** - Heartbeats and timeouts
10. **Recovery strategies** - Automatic healing
11. **Rate limiting** - Preventing resource exhaustion
12. **Load shedding** - Graceful degradation under load
13. **Watchdog timers** - Detecting hangs
14. **Active health checks** - Proactive polling
15. **Passive health checks** - Monitoring responses

---

## Current State

### What Exists ✅
- ✅ RetryService with exponential backoff (ADR 0034)
- ✅ Exception hierarchy with proper error propagation

### What's Missing ❌
- ❌ Circuit breaker for external APIs (LLM, embeddings)
- ❌ Bulkhead pattern (resource isolation)
- ❌ Timeout management (operations can hang)
- ❌ Graceful degradation strategies
- ❌ Health check infrastructure (partially in Phase 1)
- ❌ Rate limiting
- ❌ Load shedding

### Risk Areas
1. **LLM API** - Can fail, rate limit, or timeout
2. **Embedding API** - Can fail or be slow
3. **Database** - Connection issues
4. **Long Operations** - Can hang without timeouts

---

## Implementation Tasks

### Task 4.1: Circuit Breaker (60-75 min agentic)

**Goal:** Prevent cascade failures from external API failures

**Tasks:**
1. Implement CircuitBreaker class with states (closed, open, half-open)
2. Add failure threshold and timeout configuration
3. Implement state transitions
4. Add metrics and logging
5. Create comprehensive unit tests

**Deliverables:**
- `src/infrastructure/resilience/circuit-breaker.ts`
- Circuit breaker for LLM API
- Circuit breaker for embedding API
- Metrics integration

**States:**
- **Closed:** Normal operation, requests pass through
- **Open:** Fast-fail, requests immediately rejected
- **Half-Open:** Testing recovery, limited requests allowed

---

### Task 4.2: Bulkhead Pattern (45-60 min agentic)

**Goal:** Isolate resource pools to prevent resource exhaustion

**Tasks:**
1. Implement Bulkhead class with concurrency limits
2. Add queue management
3. Integrate with services
4. Add rejection policies
5. Create unit tests

**Deliverables:**
- `src/infrastructure/resilience/bulkhead.ts`
- Bulkhead for LLM operations
- Bulkhead for database operations
- Resource isolation

**Benefits:**
- Prevents one failing service from consuming all resources
- Limits blast radius of failures

---

### Task 4.3: Timeout Management (30-45 min agentic)

**Goal:** Prevent operations from hanging indefinitely

**Tasks:**
1. Implement timeout utilities
2. Add configurable timeouts per operation type
3. Integrate with long-running operations
4. Add timeout metrics
5. Create tests

**Deliverables:**
- `src/infrastructure/resilience/timeout.ts`
- Timeouts for LLM calls (30s default)
- Timeouts for embedding generation (10s default)
- Timeouts for search operations (5s default)

---

### Task 4.4: Graceful Degradation (45-60 min agentic)

**Goal:** Provide fallback functionality when services fail

**Tasks:**
1. Implement fallback strategies
2. Add degraded mode configuration
3. Document degradation scenarios
4. Add health status indicators
5. Create integration tests

**Deliverables:**
- `src/infrastructure/resilience/fallback.ts`
- Fallback for concept extraction (skip if LLM fails)
- Fallback for embeddings (use simple model)
- Degradation documentation

---

## Detailed Implementation

### Circuit Breaker Implementation

**File:** `src/infrastructure/resilience/circuit-breaker.ts`

```typescript
/**
 * Circuit Breaker pattern implementation.
 * Prevents cascade failures by failing fast when a service is unhealthy.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening (e.g., 5)
  successThreshold: number;    // Successes to close from half-open (e.g., 2)
  timeout: number;             // Time before trying half-open (ms) (e.g., 60000)
  resetTimeout: number;        // Time to reset failure count (ms) (e.g., 10000)
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  rejections: number;
  lastFailure?: Date;
  lastStateChange: Date;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private rejectionCount: number = 0;
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private logger: ILogger
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      // Try transitioning to half-open if timeout expired
      if (Date.now() - this.lastStateChange > this.config.timeout) {
        this.transitionTo('half-open');
      } else {
        this.rejectionCount++;
        throw new CircuitBreakerOpenError(
          `Circuit breaker ${this.name} is OPEN`
        );
      }
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
  
  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    }
    
    // Reset failure count on success
    this.failureCount = 0;
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.transitionTo('open');
    }
  }
  
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this.successCount = 0;
    
    if (newState === 'closed') {
      this.failureCount = 0;
    }
    
    this.logger.info(`Circuit breaker ${this.name}: ${oldState} → ${newState}`);
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      rejections: this.rejectionCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      lastStateChange: new Date(this.lastStateChange)
    };
  }
}
```

---

### Bulkhead Implementation

**File:** `src/infrastructure/resilience/bulkhead.ts`

```typescript
/**
 * Bulkhead pattern implementation.
 * Isolates resources to prevent cascade failures.
 */

export class Bulkhead {
  private activeRequests: number = 0;
  private queue: Array<() => void> = [];
  private rejectionCount: number = 0;
  
  constructor(
    private name: string,
    private maxConcurrent: number,
    private maxQueue: number,
    private logger: ILogger
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if at max concurrency
    if (this.activeRequests >= this.maxConcurrent) {
      // Check if queue is full
      if (this.queue.length >= this.maxQueue) {
        this.rejectionCount++;
        throw new BulkheadRejectionError(
          `Bulkhead ${this.name} is full (${this.maxConcurrent} active, ${this.maxQueue} queued)`
        );
      }
      
      // Wait for a slot
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
  
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  
  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
  
  getMetrics() {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      rejections: this.rejectionCount,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue
    };
  }
}
```

---

### Timeout Utilities

**File:** `src/infrastructure/resilience/timeout.ts`

```typescript
/**
 * Timeout utilities for preventing hung operations.
 */

export class TimeoutError extends Error {
  constructor(
    public operationName: string,
    public timeoutMs: number
  ) {
    super(`Operation ${operationName} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

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

// Timeout configurations
export const TIMEOUTS = {
  LLM_CALL: 30000,        // 30 seconds
  EMBEDDING: 10000,       // 10 seconds
  SEARCH: 5000,           // 5 seconds
  DATABASE: 3000,         // 3 seconds
  HEALTH_CHECK: 1000      // 1 second
};
```

---

### Resilient Executor (Combined Pattern)

**File:** `src/infrastructure/resilience/resilient-executor.ts`

```typescript
/**
 * Combines resilience patterns for easy application.
 */

export interface ResilienceOptions {
  name: string;
  timeout?: number;
  retry?: RetryPolicy;
  circuitBreaker?: CircuitBreakerConfig;
  bulkhead?: { maxConcurrent: number; maxQueue: number };
}

export class ResilientExecutor {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private bulkheads: Map<string, Bulkhead> = new Map();
  
  constructor(
    private retryService: RetryService,
    private logger: ILogger
  ) {}
  
  async execute<T>(
    operation: () => Promise<T>,
    options: ResilienceOptions
  ): Promise<T> {
    let executor = operation;
    
    // Apply timeout
    if (options.timeout) {
      const originalExecutor = executor;
      executor = () => withTimeout(originalExecutor(), options.timeout!, options.name);
    }
    
    // Apply circuit breaker
    if (options.circuitBreaker) {
      const cb = this.getOrCreateCircuitBreaker(options.name, options.circuitBreaker);
      const originalExecutor = executor;
      executor = () => cb.execute(originalExecutor);
    }
    
    // Apply bulkhead
    if (options.bulkhead) {
      const bh = this.getOrCreateBulkhead(options.name, options.bulkhead);
      const originalExecutor = executor;
      executor = () => bh.execute(originalExecutor);
    }
    
    // Apply retry
    if (options.retry) {
      return this.retryService.withRetry(executor, options.retry);
    }
    
    return executor();
  }
  
  private getOrCreateCircuitBreaker(
    name: string,
    config: CircuitBreakerConfig
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config, this.logger));
    }
    return this.circuitBreakers.get(name)!;
  }
  
  private getOrCreateBulkhead(
    name: string,
    config: { maxConcurrent: number; maxQueue: number }
  ): Bulkhead {
    if (!this.bulkheads.has(name)) {
      this.bulkheads.set(
        name,
        new Bulkhead(name, config.maxConcurrent, config.maxQueue, this.logger)
      );
    }
    return this.bulkheads.get(name)!;
  }
  
  getMetrics() {
    const metrics: any = {
      circuitBreakers: {},
      bulkheads: {}
    };
    
    this.circuitBreakers.forEach((cb, name) => {
      metrics.circuitBreakers[name] = cb.getMetrics();
    });
    
    this.bulkheads.forEach((bh, name) => {
      metrics.bulkheads[name] = bh.getMetrics();
    });
    
    return metrics;
  }
}
```

---

### Usage Example

```typescript
// Configure resilient LLM client
const llmClient = {
  async extractConcepts(text: string): Promise<Concepts> {
    return await resilientExecutor.execute(
      () => llmAPI.extractConcepts(text),
      {
        name: 'llm_extract_concepts',
        timeout: 30000,
        retry: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2
        },
        circuitBreaker: {
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 60000,
          resetTimeout: 10000
        },
        bulkhead: {
          maxConcurrent: 5,
          maxQueue: 10
        }
      }
    );
  }
};
```

---

## Success Criteria

### Functional Requirements
- [ ] Circuit breaker implemented for external APIs
- [ ] Bulkhead pattern limiting concurrent operations
- [ ] Timeout management preventing hangs
- [ ] Graceful degradation strategies defined
- [ ] Health status reflects circuit breaker state

### Resilience Targets
- [ ] System stays operational when LLM API fails
- [ ] System stays operational when embedding API fails
- [ ] No cascade failures
- [ ] Recovery time <5 minutes for transient failures
- [ ] Graceful degradation documented

### Quality Requirements
- [ ] 100% test coverage for resilience components
- [ ] Integration tests with simulated failures
- [ ] Metrics visible in dashboard
- [ ] ADR documenting resilience strategy

---

## Testing Strategy

### Unit Tests
- Circuit breaker state transitions
- Bulkhead queue management
- Timeout enforcement
- Metrics accuracy

### Integration Tests
- LLM API with circuit breaker
- Embedding API with circuit breaker
- Concurrent requests with bulkhead
- Timeout integration

### Chaos Testing
- Kill LLM API and verify circuit breaker opens
- Slow API responses trigger timeouts
- High load triggers bulkhead rejections
- Recovery when API returns

---

## Validation Steps

1. **Baseline Testing** - Normal operations
2. **Failure Injection** - Kill external APIs
3. **Verify Circuit Breaker** - Opens after threshold
4. **Verify Recovery** - Closes when API returns
5. **Load Testing** - Bulkhead prevents exhaustion

---

## Documentation Requirements

### ADR Required
- **ADR 0042:** System Resilience Patterns
  - Context: External dependency reliability
  - Decision: Circuit breaker, bulkhead, timeouts
  - Implementation: ResilientExecutor
  - Consequences: Better fault tolerance

### User Documentation
- Resilience pattern configuration
- Monitoring circuit breaker state
- Troubleshooting guide
- Graceful degradation scenarios

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 4.1 Circuit Breaker | 60-75 min | 15 min | 75-90 min |
| 4.2 Bulkhead | 45-60 min | 15 min | 60-75 min |
| 4.3 Timeout Management | 30-45 min | 15 min | 45-60 min |
| 4.4 Graceful Degradation | 45-60 min | 15 min | 60-75 min |
| **TOTAL** | **3-4h** | **1h** | **4-5h** |

---

## Implementation Selection Matrix

Use this matrix to select which sub-phases to implement. Mark with ✓ to include or X to skip.

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Task 4.1 | Circuit Breaker Pattern | 60-75 min | ✓ |
| Task 4.2 | Bulkhead Pattern (Resource Isolation) | 45-60 min | ✓ |
| Task 4.3 | Timeout Management | 30-45 min | ✓ |
| Task 4.4 | Graceful Degradation Strategies | 45-60 min | ✓ |

**Instructions:** Replace ✓ with X for any sub-phase you wish to skip.

---

**Status:** Ready for implementation  
**Next Document:** [07-database-optimization-plan.md](07-database-optimization-plan.md)

