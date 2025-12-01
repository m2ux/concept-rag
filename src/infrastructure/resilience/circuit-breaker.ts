import { CircuitBreakerOpenError } from './errors.js';

/**
 * Circuit breaker states following the standard state machine pattern.
 * 
 * State transitions:
 * - CLOSED → OPEN: After failure threshold reached
 * - OPEN → HALF_OPEN: After timeout expires
 * - HALF_OPEN → CLOSED: After success threshold reached
 * - HALF_OPEN → OPEN: On any failure
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Configuration for circuit breaker behavior.
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before opening the circuit.
   * @default 5
   */
  failureThreshold: number;
  
  /**
   * Number of consecutive successes in half-open state to close the circuit.
   * @default 2
   */
  successThreshold: number;
  
  /**
   * Time in milliseconds to wait before attempting half-open state.
   * @default 60000 (60 seconds)
   */
  timeout: number;
  
  /**
   * Time window in milliseconds for tracking failure rate.
   * After this time without failures, failure count resets.
   * @default 10000 (10 seconds)
   */
  resetTimeout: number;
}

/**
 * Metrics tracked by the circuit breaker.
 */
export interface CircuitBreakerMetrics {
  /** Current state of the circuit */
  state: CircuitState;
  
  /** Current count of consecutive failures */
  failures: number;
  
  /** Current count of consecutive successes (in half-open state) */
  successes: number;
  
  /** Total number of requests rejected due to open circuit */
  rejections: number;
  
  /** Timestamp of the last failure */
  lastFailure?: Date;
  
  /** Timestamp of the last state change */
  lastStateChange: Date;
  
  /** Total number of requests executed */
  totalRequests: number;
  
  /** Total number of successful requests */
  totalSuccesses: number;
  
  /** Total number of failed requests */
  totalFailures: number;
}

/**
 * Default circuit breaker configuration.
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,        // 60 seconds
  resetTimeout: 10000,   // 10 seconds
};

/**
 * Circuit Breaker pattern implementation.
 * 
 * Prevents cascade failures by failing fast when a service is unhealthy.
 * Implements the classic circuit breaker state machine:
 * 
 * **States:**
 * - **CLOSED**: Normal operation, requests pass through
 * - **OPEN**: Fast-fail mode, requests immediately rejected
 * - **HALF-OPEN**: Testing recovery, limited requests allowed
 * 
 * **State Transitions:**
 * - CLOSED → OPEN: After `failureThreshold` consecutive failures
 * - OPEN → HALF-OPEN: After `timeout` milliseconds
 * - HALF-OPEN → CLOSED: After `successThreshold` consecutive successes
 * - HALF-OPEN → OPEN: On any failure
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const breaker = new CircuitBreaker('llm-api', {
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000
 * });
 * 
 * try {
 *   const result = await breaker.execute(() => llmAPI.call());
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     console.log('Circuit is open, using fallback');
 *   }
 * }
 * ```
 * 
 * @example
 * Monitoring circuit state:
 * ```typescript
 * const metrics = breaker.getMetrics();
 * console.log(`State: ${metrics.state}`);
 * console.log(`Failures: ${metrics.failures}/${breaker.config.failureThreshold}`);
 * console.log(`Success rate: ${metrics.totalSuccesses / metrics.totalRequests * 100}%`);
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private rejectionCount: number = 0;
  private totalRequests: number = 0;
  private totalSuccesses: number = 0;
  private totalFailures: number = 0;
  
  private readonly config: CircuitBreakerConfig;
  
  /**
   * Creates a new circuit breaker instance.
   * 
   * @param name - Identifier for this circuit breaker (for logging/metrics)
   * @param config - Circuit breaker configuration
   */
  constructor(
    private readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }
  
  /**
   * Execute an operation protected by the circuit breaker.
   * 
   * The circuit breaker will:
   * - In CLOSED state: Execute the operation normally
   * - In OPEN state: Reject immediately (fast-fail)
   * - In HALF-OPEN state: Execute and track for recovery
   * 
   * @typeParam T - The return type of the operation
   * @param operation - The async operation to execute
   * @returns The result of the operation
   * @throws {CircuitBreakerOpenError} If the circuit is open
   * @throws Any error thrown by the operation
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    
    // Check if we should transition from OPEN to HALF-OPEN
    if (this.state === 'open') {
      if (Date.now() - this.lastStateChange > this.config.timeout) {
        this.transitionTo('half-open');
      } else {
        // Still open, reject immediately
        this.rejectionCount++;
        throw new CircuitBreakerOpenError(this.name);
      }
    }
    
    // Check if failure count should be reset (in CLOSED state)
    if (this.state === 'closed' && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.failureCount = 0;
        this.lastFailureTime = undefined;
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
  
  /**
   * Handle successful operation execution.
   * Updates metrics and potentially transitions state.
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
      this.lastFailureTime = undefined;
    }
  }
  
  /**
   * Handle failed operation execution.
   * Updates metrics and potentially transitions state.
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'half-open') {
      // Any failure in half-open immediately reopens the circuit
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      // Check if we've hit the failure threshold
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }
  
  /**
   * Transition to a new circuit state.
   * Resets appropriate counters and logs the transition.
   * 
   * @param newState - The target state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    // Reset counters based on new state
    if (newState === 'closed') {
      this.failureCount = 0;
      this.successCount = 0;
      this.lastFailureTime = undefined;
    } else if (newState === 'half-open') {
      this.successCount = 0;
    } else if (newState === 'open') {
      this.successCount = 0;
    }
    
    // Log state transition (using console for now, can be replaced with logger)
    console.log(`Circuit breaker '${this.name}': ${oldState} → ${newState}`);
  }
  
  /**
   * Get the current state of the circuit breaker.
   * 
   * @returns The current circuit state
   */
  getState(): CircuitState {
    // Check if we should auto-transition from OPEN to HALF-OPEN
    if (this.state === 'open' && Date.now() - this.lastStateChange > this.config.timeout) {
      return 'half-open'; // Will transition on next execute()
    }
    return this.state;
  }
  
  /**
   * Check if the circuit is currently open.
   * 
   * @returns True if circuit is open, false otherwise
   */
  isOpen(): boolean {
    return this.getState() === 'open';
  }
  
  /**
   * Check if the circuit is currently closed.
   * 
   * @returns True if circuit is closed, false otherwise
   */
  isClosed(): boolean {
    return this.getState() === 'closed';
  }
  
  /**
   * Check if the circuit is currently half-open.
   * 
   * @returns True if circuit is half-open, false otherwise
   */
  isHalfOpen(): boolean {
    return this.getState() === 'half-open';
  }
  
  /**
   * Get comprehensive metrics about the circuit breaker.
   * 
   * @returns Current metrics including state, counters, and timestamps
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.getState(),
      failures: this.failureCount,
      successes: this.successCount,
      rejections: this.rejectionCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      lastStateChange: new Date(this.lastStateChange),
      totalRequests: this.totalRequests,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
    };
  }
  
  /**
   * Manually reset the circuit breaker to closed state.
   * Useful for administrative operations or testing.
   * 
   * **Warning:** Use with caution in production.
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.lastStateChange = Date.now();
    console.log(`Circuit breaker '${this.name}' manually reset to CLOSED`);
  }
  
  /**
   * Get the circuit breaker name.
   * 
   * @returns The circuit breaker identifier
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Get the circuit breaker configuration.
   * 
   * @returns The current configuration
   */
  getConfig(): Readonly<CircuitBreakerConfig> {
    return Object.freeze({ ...this.config });
  }
}






