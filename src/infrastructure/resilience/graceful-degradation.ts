import type { CircuitBreaker } from './circuit-breaker.js';
import { ResilienceLogger, ConsoleLogger } from './logger.js';

/**
 * Strategy for graceful degradation with fallback.
 * 
 * @typeParam T - The return type of both primary and fallback operations
 */
export interface DegradationStrategy<T> {
  /**
   * The primary operation to attempt.
   */
  primary: () => Promise<T>;
  
  /**
   * The fallback operation to use if primary fails or should be degraded.
   */
  fallback: () => Promise<T>;
  
  /**
   * Optional function to determine if degraded mode should be used.
   * If provided, this is checked before attempting the primary operation.
   * 
   * @returns True if should use degraded mode (skip primary, use fallback)
   */
  shouldDegrade?: () => boolean;
}

/**
 * Configuration for graceful degradation behavior.
 */
export interface GracefulDegradationConfig {
  /**
   * Whether to use fallback on primary operation failure.
   * @default true
   */
  fallbackOnFailure: boolean;
  
  /**
   * Optional callback when degraded mode is activated.
   */
  onDegradation?: (reason: string, error?: Error) => void;
  
  /**
   * Optional callback when falling back due to failure.
   */
  onFallback?: (error: Error) => void;
}

/**
 * Metrics tracked by graceful degradation.
 */
export interface GracefulDegradationMetrics {
  /** Total number of operations executed */
  totalOperations: number;
  
  /** Number of times primary operation succeeded */
  primarySuccesses: number;
  
  /** Number of times primary operation failed */
  primaryFailures: number;
  
  /** Number of times fallback was used */
  fallbackUsed: number;
  
  /** Number of times degraded mode was activated (skipped primary) */
  degradedModeActivations: number;
  
  /** Current degradation rate (percentage of fallback usage) */
  degradationRate: number;
}

/**
 * Default graceful degradation configuration.
 */
export const DEFAULT_GRACEFUL_DEGRADATION_CONFIG: GracefulDegradationConfig = {
  fallbackOnFailure: true,
};

/**
 * Graceful Degradation pattern implementation.
 * 
 * Provides fallback functionality when primary operations fail or when
 * the system determines it should operate in degraded mode.
 * 
 * **Key Features:**
 * - Automatic fallback on primary operation failure
 * - Proactive degradation based on circuit breaker state
 * - Metrics tracking for degradation monitoring
 * - Flexible strategy definition
 * 
 * **Use Cases:**
 * - Concept extraction: Fall back to no enrichment if LLM fails
 * - Embedding generation: Use simple model if advanced model fails
 * - Hybrid search: Fall back to vector-only if concepts unavailable
 * 
 * @example
 * Basic usage with fallback:
 * ```typescript
 * const degradation = new GracefulDegradation();
 * 
 * const result = await degradation.execute({
 *   primary: () => llmAPI.extractConcepts(text),
 *   fallback: () => Promise.resolve({ primary: [], technical: [], related: [] })
 * });
 * ```
 * 
 * @example
 * With circuit breaker integration:
 * ```typescript
 * const result = await degradation.execute({
 *   primary: () => llmAPI.extractConcepts(text),
 *   fallback: () => Promise.resolve({ primary: [], technical: [], related: [] }),
 *   shouldDegrade: () => llmCircuitBreaker.isOpen()
 * });
 * ```
 * 
 * @example
 * With callbacks:
 * ```typescript
 * const degradation = new GracefulDegradation({
 *   fallbackOnFailure: true,
 *   onDegradation: (reason) => {
 *     console.warn(`Degraded mode active: ${reason}`);
 *   },
 *   onFallback: (error) => {
 *     console.error(`Primary failed, using fallback: ${error.message}`);
 *   }
 * });
 * ```
 */
export class GracefulDegradation {
  private totalOperations: number = 0;
  private primarySuccesses: number = 0;
  private primaryFailures: number = 0;
  private fallbackUsed: number = 0;
  private degradedModeActivations: number = 0;
  
  private readonly config: GracefulDegradationConfig;
  private readonly logger: ResilienceLogger;
  
  /**
   * Creates a new graceful degradation instance.
   * 
   * @param config - Degradation configuration
   * @param logger - Optional logger (defaults to console)
   */
  constructor(
    config: Partial<GracefulDegradationConfig> = {},
    logger: ResilienceLogger = ConsoleLogger
  ) {
    this.config = { ...DEFAULT_GRACEFUL_DEGRADATION_CONFIG, ...config };
    this.logger = logger;
  }
  
  /**
   * Execute an operation with graceful degradation.
   * 
   * The execution flow:
   * 1. Check if degraded mode should be used (if `shouldDegrade` provided)
   * 2. If degraded, use fallback immediately
   * 3. Otherwise, attempt primary operation
   * 4. If primary fails and `fallbackOnFailure` is true, use fallback
   * 5. Otherwise, rethrow primary error
   * 
   * @typeParam T - The return type of the operation
   * @param strategy - The degradation strategy
   * @returns The result from either primary or fallback operation
   * @throws Error from primary if no fallback configured and primary fails
   */
  async execute<T>(strategy: DegradationStrategy<T>): Promise<T> {
    this.totalOperations++;
    
    // Check if we should proactively degrade
    if (strategy.shouldDegrade?.()) {
      this.degradedModeActivations++;
      this.fallbackUsed++;
      
      const reason = 'Proactive degradation (shouldDegrade returned true)';
      this.config.onDegradation?.(reason);
      this.logger.info(`Graceful degradation: ${reason}`, { mode: 'proactive' });
      
      return strategy.fallback();
    }
    
    // Attempt primary operation
    try {
      const result = await strategy.primary();
      this.primarySuccesses++;
      return result;
    } catch (error) {
      this.primaryFailures++;
      
      // Use fallback if configured
      if (this.config.fallbackOnFailure) {
        this.fallbackUsed++;
        
        this.config.onFallback?.(error as Error);
        this.logger.info(`Graceful degradation: Primary operation failed, using fallback`, {
          mode: 'reactive',
          error: error instanceof Error ? error.message : String(error),
        });
        
        return strategy.fallback();
      }
      
      // No fallback configured, rethrow
      throw error;
    }
  }
  
  /**
   * Create a degradation strategy that uses a circuit breaker for shouldDegrade.
   * 
   * @typeParam T - The return type
   * @param circuitBreaker - The circuit breaker to check
   * @param primary - Primary operation
   * @param fallback - Fallback operation
   * @returns A degradation strategy
   * 
   * @example
   * ```typescript
   * const strategy = GracefulDegradation.withCircuitBreaker(
   *   llmCircuitBreaker,
   *   () => llmAPI.extract(text),
   *   () => Promise.resolve({ concepts: [] })
   * );
   * 
   * const result = await degradation.execute(strategy);
   * ```
   */
  static withCircuitBreaker<T>(
    circuitBreaker: CircuitBreaker,
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): DegradationStrategy<T> {
    return {
      primary,
      fallback,
      shouldDegrade: () => circuitBreaker.isOpen(),
    };
  }
  
  /**
   * Create a simple degradation strategy without proactive degradation.
   * 
   * @typeParam T - The return type
   * @param primary - Primary operation
   * @param fallback - Fallback operation
   * @returns A degradation strategy
   * 
   * @example
   * ```typescript
   * const strategy = GracefulDegradation.withFallback(
   *   () => advancedSearch(query),
   *   () => basicSearch(query)
   * );
   * ```
   */
  static withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): DegradationStrategy<T> {
    return {
      primary,
      fallback,
    };
  }
  
  /**
   * Create a degradation strategy with a custom condition.
   * 
   * @typeParam T - The return type
   * @param condition - Function that returns true if should degrade
   * @param primary - Primary operation
   * @param fallback - Fallback operation
   * @returns A degradation strategy
   * 
   * @example
   * ```typescript
   * const strategy = GracefulDegradation.withCondition(
   *   () => systemLoad > 0.9, // Degrade under high load
   *   () => fullAnalysis(),
   *   () => quickAnalysis()
   * );
   * ```
   */
  static withCondition<T>(
    condition: () => boolean,
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): DegradationStrategy<T> {
    return {
      primary,
      fallback,
      shouldDegrade: condition,
    };
  }
  
  /**
   * Get comprehensive metrics about degradation behavior.
   * 
   * @returns Current metrics
   */
  getMetrics(): GracefulDegradationMetrics {
    const degradationRate =
      this.totalOperations > 0
        ? (this.fallbackUsed / this.totalOperations) * 100
        : 0;
    
    return {
      totalOperations: this.totalOperations,
      primarySuccesses: this.primarySuccesses,
      primaryFailures: this.primaryFailures,
      fallbackUsed: this.fallbackUsed,
      degradedModeActivations: this.degradedModeActivations,
      degradationRate,
    };
  }
  
  /**
   * Reset all metrics to zero.
   * Useful for testing or periodic metric collection.
   */
  resetMetrics(): void {
    this.totalOperations = 0;
    this.primarySuccesses = 0;
    this.primaryFailures = 0;
    this.fallbackUsed = 0;
    this.degradedModeActivations = 0;
  }
  
  /**
   * Check if the system is currently operating in degraded mode.
   * Based on whether recent operations are using fallback.
   * 
   * @returns True if degradation rate is above threshold
   */
  isDegraded(threshold: number = 50): boolean {
    const metrics = this.getMetrics();
    return metrics.degradationRate >= threshold;
  }
}

/**
 * Common fallback strategies for typical use cases.
 */
export class CommonFallbacks {
  /**
   * Empty concept extraction result (no concepts).
   */
  static emptyConcepts() {
    return Promise.resolve({
      primary: [],
      technical: [],
      related: [],
      categories: [],
    });
  }
  
  /**
   * Empty search results.
   */
  static emptySearchResults<T>(): Promise<T[]> {
    return Promise.resolve([]);
  }
  
  /**
   * Return cached value or default.
   * 
   * @param cache - Cache to check
   * @param key - Cache key
   * @param defaultValue - Default value if not cached
   * @returns Cached or default value
   */
  static cachedOrDefault<T>(
    cache: Map<string, T>,
    key: string,
    defaultValue: T
  ): Promise<T> {
    const cached = cache.get(key);
    return Promise.resolve(cached ?? defaultValue);
  }
  
  /**
   * Return stale data with a warning.
   * 
   * @param staleData - The stale data to return
   * @param warningMessage - Optional warning message
   * @param logger - Optional logger (defaults to console)
   * @returns The stale data
   */
  static staleData<T>(
    staleData: T,
    warningMessage?: string,
    logger: ResilienceLogger = ConsoleLogger
  ): Promise<T> {
    if (warningMessage) {
      logger.warn(`Using stale data: ${warningMessage}`, { stale: true });
    }
    return Promise.resolve(staleData);
  }
}
