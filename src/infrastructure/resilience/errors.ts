import { ConceptRAGError } from '../../domain/exceptions/base.js';

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends ConceptRAGError {
  constructor(
    public operationName: string,
    public timeoutMs: number
  ) {
    super(
      `Operation '${operationName}' timed out after ${timeoutMs}ms`,
      'RESILIENCE_TIMEOUT',
      { operationName, timeoutMs }
    );
  }
}

/**
 * Error thrown when a circuit breaker is open.
 */
export class CircuitBreakerOpenError extends ConceptRAGError {
  constructor(
    public circuitName: string
  ) {
    super(
      `Circuit breaker '${circuitName}' is OPEN - failing fast`,
      'RESILIENCE_CIRCUIT_OPEN',
      { circuitName }
    );
  }
}

/**
 * Error thrown when a bulkhead rejects a request.
 */
export class BulkheadRejectionError extends ConceptRAGError {
  constructor(
    public bulkheadName: string,
    public reason: string
  ) {
    super(
      `Bulkhead '${bulkheadName}' rejected request: ${reason}`,
      'RESILIENCE_BULKHEAD_REJECTED',
      { bulkheadName, reason }
    );
  }
}

/**
 * Error thrown when degraded mode is active.
 */
export class DegradedModeError extends ConceptRAGError {
  constructor(
    public serviceName: string,
    public reason: string
  ) {
    super(
      `Service '${serviceName}' is in degraded mode: ${reason}`,
      'RESILIENCE_DEGRADED_MODE',
      { serviceName, reason }
    );
  }
}
