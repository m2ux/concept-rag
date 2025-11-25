import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker.js';
import { Bulkhead, type BulkheadConfig } from './bulkhead.js';
import { withTimeout } from './timeout.js';
import { RetryService, type RetryConfig } from '../utils/retry-service.js';

/**
 * Options for resilient execution combining multiple patterns.
 */
export interface ResilienceOptions {
  /**
   * Name of the operation (for logging and metrics).
   */
  name: string;
  
  /**
   * Optional timeout in milliseconds.
   * If specified, the operation will fail if it exceeds this duration.
   */
  timeout?: number;
  
  /**
   * Optional retry configuration.
   * If specified, failed operations will be retried with exponential backoff.
   */
  retry?: Partial<RetryConfig>;
  
  /**
   * Optional circuit breaker configuration.
   * If specified, a circuit breaker will protect the operation.
   */
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  
  /**
   * Optional bulkhead configuration.
   * If specified, concurrent executions will be limited.
   */
  bulkhead?: Partial<BulkheadConfig>;
}

/**
 * Comprehensive metrics from all resilience patterns.
 */
export interface ResilienceMetrics {
  /** Circuit breaker metrics by operation name */
  circuitBreakers: Record<string, ReturnType<CircuitBreaker['getMetrics']>>;
  
  /** Bulkhead metrics by operation name */
  bulkheads: Record<string, ReturnType<Bulkhead['getMetrics']>>;
}

/**
 * Resilient Executor - Combines all resilience patterns.
 * 
 * Provides a unified interface for applying multiple resilience patterns
 * to operations:
 * - Timeout: Prevent hung operations
 * - Circuit Breaker: Fail fast when service is unhealthy
 * - Bulkhead: Limit concurrent operations
 * - Retry: Automatic retry with exponential backoff
 * 
 * Patterns are applied in this order:
 * 1. Bulkhead (limit concurrency)
 * 2. Circuit Breaker (fast-fail if open)
 * 3. Timeout (bound operation duration)
 * 4. Retry (retry on failure)
 * 
 * @example
 * Basic usage with timeout and retry:
 * ```typescript
 * const executor = new ResilientExecutor(new RetryService());
 * 
 * const result = await executor.execute(
 *   () => llmAPI.extractConcepts(text),
 *   {
 *     name: 'llm_extract',
 *     timeout: 30000,
 *     retry: { maxRetries: 3 }
 *   }
 * );
 * ```
 * 
 * @example
 * Full protection with all patterns:
 * ```typescript
 * const result = await executor.execute(
 *   () => externalAPI.call(),
 *   {
 *     name: 'api_call',
 *     timeout: 5000,
 *     retry: {
 *       maxRetries: 3,
 *       initialDelayMs: 1000
 *     },
 *     circuitBreaker: {
 *       failureThreshold: 5,
 *       timeout: 60000
 *     },
 *     bulkhead: {
 *       maxConcurrent: 10,
 *       maxQueue: 20
 *     }
 *   }
 * );
 * ```
 * 
 * @example
 * Monitoring metrics:
 * ```typescript
 * const metrics = executor.getMetrics();
 * 
 * // Check circuit breaker state
 * const llmMetrics = metrics.circuitBreakers['llm_extract'];
 * console.log(`Circuit state: ${llmMetrics.state}`);
 * 
 * // Check bulkhead utilization
 * const bhMetrics = metrics.bulkheads['llm_extract'];
 * console.log(`Active: ${bhMetrics.active}/${bhMetrics.maxConcurrent}`);
 * ```
 */
export class ResilientExecutor {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private bulkheads: Map<string, Bulkhead> = new Map();
  
  /**
   * Creates a new resilient executor.
   * 
   * @param retryService - Retry service for retry logic
   */
  constructor(private readonly retryService: RetryService) {}
  
  /**
   * Execute an operation with resilience patterns applied.
   * 
   * @typeParam T - The return type of the operation
   * @param operation - The async operation to execute
   * @param options - Resilience options
   * @returns The result of the operation
   * @throws Various errors depending on which patterns are triggered
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: ResilienceOptions
  ): Promise<T> {
    let wrappedOperation = operation;
    
    // Apply timeout (innermost layer)
    if (options.timeout) {
      const originalOp = wrappedOperation;
      wrappedOperation = () => withTimeout(originalOp, options.timeout!, options.name);
    }
    
    // Apply circuit breaker
    if (options.circuitBreaker) {
      const cb = this.getOrCreateCircuitBreaker(options.name, options.circuitBreaker);
      const originalOp = wrappedOperation;
      wrappedOperation = () => cb.execute(originalOp);
    }
    
    // Apply bulkhead
    if (options.bulkhead) {
      const bh = this.getOrCreateBulkhead(options.name, options.bulkhead);
      const originalOp = wrappedOperation;
      wrappedOperation = () => bh.execute(originalOp);
    }
    
    // Apply retry (outermost layer)
    if (options.retry) {
      return this.retryService.executeWithRetry(wrappedOperation, options.retry);
    }
    
    return wrappedOperation();
  }
  
  /**
   * Get or create a circuit breaker for an operation.
   * Reuses existing circuit breaker if one exists for this operation name.
   * 
   * @param name - Operation name
   * @param config - Circuit breaker configuration
   * @returns Circuit breaker instance
   */
  private getOrCreateCircuitBreaker(
    name: string,
    config: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }
    return this.circuitBreakers.get(name)!;
  }
  
  /**
   * Get or create a bulkhead for an operation.
   * Reuses existing bulkhead if one exists for this operation name.
   * 
   * @param name - Operation name
   * @param config - Bulkhead configuration
   * @returns Bulkhead instance
   */
  private getOrCreateBulkhead(
    name: string,
    config: Partial<BulkheadConfig>
  ): Bulkhead {
    if (!this.bulkheads.has(name)) {
      this.bulkheads.set(name, new Bulkhead(name, config));
    }
    return this.bulkheads.get(name)!;
  }
  
  /**
   * Get a specific circuit breaker by name.
   * 
   * @param name - Operation name
   * @returns Circuit breaker if exists, undefined otherwise
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }
  
  /**
   * Get a specific bulkhead by name.
   * 
   * @param name - Operation name
   * @returns Bulkhead if exists, undefined otherwise
   */
  getBulkhead(name: string): Bulkhead | undefined {
    return this.bulkheads.get(name);
  }
  
  /**
   * Get comprehensive metrics from all resilience patterns.
   * 
   * @returns Metrics object with circuit breaker and bulkhead metrics
   */
  getMetrics(): ResilienceMetrics {
    const metrics: ResilienceMetrics = {
      circuitBreakers: {},
      bulkheads: {},
    };
    
    this.circuitBreakers.forEach((cb, name) => {
      metrics.circuitBreakers[name] = cb.getMetrics();
    });
    
    this.bulkheads.forEach((bh, name) => {
      metrics.bulkheads[name] = bh.getMetrics();
    });
    
    return metrics;
  }
  
  /**
   * Get a list of all registered operation names.
   * 
   * @returns Array of operation names that have circuit breakers or bulkheads
   */
  getOperationNames(): string[] {
    const names = new Set<string>();
    
    this.circuitBreakers.forEach((_, name) => names.add(name));
    this.bulkheads.forEach((_, name) => names.add(name));
    
    return Array.from(names).sort();
  }
  
  /**
   * Reset a specific circuit breaker.
   * Useful for manual intervention or testing.
   * 
   * @param name - Operation name
   * @returns True if circuit breaker was reset, false if not found
   */
  resetCircuitBreaker(name: string): boolean {
    const cb = this.circuitBreakers.get(name);
    if (cb) {
      cb.reset();
      return true;
    }
    return false;
  }
  
  /**
   * Check if any circuit breakers are open.
   * 
   * @returns True if at least one circuit breaker is open
   */
  hasOpenCircuits(): boolean {
    const breakers = Array.from(this.circuitBreakers.values());
    for (const cb of breakers) {
      if (cb.isOpen()) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get summary of system health based on resilience metrics.
   * 
   * @returns Health summary
   */
  getHealthSummary(): {
    healthy: boolean;
    openCircuits: string[];
    fullBulkheads: string[];
    warnings: string[];
  } {
    const openCircuits: string[] = [];
    const fullBulkheads: string[] = [];
    const warnings: string[] = [];
    
    // Check circuit breakers
    this.circuitBreakers.forEach((cb, name) => {
      if (cb.isOpen()) {
        openCircuits.push(name);
      }
      
      const metrics = cb.getMetrics();
      if (metrics.rejections > 0) {
        warnings.push(
          `Circuit breaker '${name}' has ${metrics.rejections} rejections`
        );
      }
    });
    
    // Check bulkheads
    this.bulkheads.forEach((bh, name) => {
      if (bh.isFull()) {
        fullBulkheads.push(name);
      }
      
      const metrics = bh.getMetrics();
      if (metrics.rejections > 0) {
        warnings.push(
          `Bulkhead '${name}' has ${metrics.rejections} rejections`
        );
      }
    });
    
    const healthy = openCircuits.length === 0 && fullBulkheads.length === 0;
    
    return {
      healthy,
      openCircuits,
      fullBulkheads,
      warnings,
    };
  }
}

/**
 * Predefined resilience profiles for common scenarios.
 */
export class ResilienceProfiles {
  /**
   * Profile for external LLM API calls.
   * - 30s timeout
   * - 3 retries with exponential backoff
   * - Circuit breaker (5 failures, 60s timeout)
   * - Bulkhead (5 concurrent, 10 queued)
   */
  static readonly LLM_API: Omit<ResilienceOptions, 'name'> = {
    timeout: 30000,
    retry: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    },
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      resetTimeout: 10000,
    },
    bulkhead: {
      maxConcurrent: 5,
      maxQueue: 10,
    },
  };
  
  /**
   * Profile for embedding generation.
   * - 10s timeout
   * - 3 retries
   * - Circuit breaker (5 failures, 30s timeout)
   * - Bulkhead (10 concurrent, 20 queued)
   */
  static readonly EMBEDDING: Omit<ResilienceOptions, 'name'> = {
    timeout: 10000,
    retry: {
      maxRetries: 3,
      initialDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    },
    circuitBreaker: {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 5000,
    },
    bulkhead: {
      maxConcurrent: 10,
      maxQueue: 20,
    },
  };
  
  /**
   * Profile for database operations.
   * - 3s timeout
   * - 2 retries
   * - Bulkhead (20 concurrent, 50 queued)
   * - No circuit breaker (internal service)
   */
  static readonly DATABASE: Omit<ResilienceOptions, 'name'> = {
    timeout: 3000,
    retry: {
      maxRetries: 2,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    },
    bulkhead: {
      maxConcurrent: 20,
      maxQueue: 50,
    },
  };
  
  /**
   * Profile for search operations.
   * - 5s timeout
   * - 2 retries
   * - Bulkhead (15 concurrent, 30 queued)
   */
  static readonly SEARCH: Omit<ResilienceOptions, 'name'> = {
    timeout: 5000,
    retry: {
      maxRetries: 2,
      initialDelayMs: 200,
      maxDelayMs: 2000,
      backoffMultiplier: 2,
    },
    bulkhead: {
      maxConcurrent: 15,
      maxQueue: 30,
    },
  };
  
  /**
   * Minimal profile for fast, reliable operations.
   * - 1s timeout
   * - No retries
   * - No circuit breaker
   * - No bulkhead
   */
  static readonly FAST_RELIABLE: Omit<ResilienceOptions, 'name'> = {
    timeout: 1000,
  };
}

