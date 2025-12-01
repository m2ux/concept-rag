/**
 * System Resilience Patterns
 * 
 * This module provides comprehensive resilience patterns to protect against
 * external dependency failures and prevent cascade failures.
 * 
 * @packageDocumentation
 */

// Core patterns
export { CircuitBreaker, DEFAULT_CIRCUIT_BREAKER_CONFIG } from './circuit-breaker.js';
export type { CircuitState, CircuitBreakerConfig, CircuitBreakerMetrics } from './circuit-breaker.js';

export { Bulkhead, DEFAULT_BULKHEAD_CONFIG } from './bulkhead.js';
export type { BulkheadConfig, BulkheadMetrics } from './bulkhead.js';

export { withTimeout, withTimeoutConfig, wrapWithTimeout, TIMEOUTS } from './timeout.js';
export type { TimeoutConfig } from './timeout.js';

export { GracefulDegradation, CommonFallbacks, DEFAULT_GRACEFUL_DEGRADATION_CONFIG } from './graceful-degradation.js';
export type { DegradationStrategy, GracefulDegradationConfig, GracefulDegradationMetrics } from './graceful-degradation.js';

// Combined executor
export { ResilientExecutor, ResilienceProfiles } from './resilient-executor.js';
export type { ResilienceOptions, ResilienceMetrics } from './resilient-executor.js';

// Errors
export {
  TimeoutError,
  CircuitBreakerOpenError,
  BulkheadRejectionError,
  DegradedModeError,
} from './errors.js';





