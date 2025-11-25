import { BulkheadRejectionError } from './errors.js';

/**
 * Configuration for bulkhead behavior.
 */
export interface BulkheadConfig {
  /**
   * Maximum number of concurrent operations allowed.
   * @default 10
   */
  maxConcurrent: number;
  
  /**
   * Maximum number of operations that can be queued.
   * Operations beyond this limit are rejected immediately.
   * @default 10
   */
  maxQueue: number;
}

/**
 * Metrics tracked by the bulkhead.
 */
export interface BulkheadMetrics {
  /** Current number of active (executing) operations */
  active: number;
  
  /** Current number of queued operations waiting for a slot */
  queued: number;
  
  /** Total number of operations rejected due to full queue */
  rejections: number;
  
  /** Maximum concurrent operations allowed */
  maxConcurrent: number;
  
  /** Maximum queue size allowed */
  maxQueue: number;
  
  /** Total number of operations executed */
  totalExecuted: number;
  
  /** Total number of operations completed successfully */
  totalSuccesses: number;
  
  /** Total number of operations that failed */
  totalFailures: number;
}

/**
 * Default bulkhead configuration.
 */
export const DEFAULT_BULKHEAD_CONFIG: BulkheadConfig = {
  maxConcurrent: 10,
  maxQueue: 10,
};

/**
 * Bulkhead pattern implementation.
 * 
 * Isolates resources by limiting concurrent operations and queueing excess requests.
 * This prevents one service from exhausting all available resources (threads, connections, memory).
 * 
 * **Key Features:**
 * - Limits concurrent execution to `maxConcurrent`
 * - Queues additional requests up to `maxQueue`
 * - Rejects requests when queue is full (fail-fast)
 * - Automatically releases slots when operations complete
 * - Tracks metrics for monitoring
 * 
 * **Use Cases:**
 * - Protect thread pools from exhaustion
 * - Limit database connections per service
 * - Control API rate limiting
 * - Isolate slow services from fast services
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const bulkhead = new Bulkhead('llm-service', {
 *   maxConcurrent: 5,
 *   maxQueue: 10
 * });
 * 
 * try {
 *   const result = await bulkhead.execute(() => llmAPI.call());
 * } catch (error) {
 *   if (error instanceof BulkheadRejectionError) {
 *     console.log('Too many requests, try again later');
 *   }
 * }
 * ```
 * 
 * @example
 * Monitoring bulkhead state:
 * ```typescript
 * const metrics = bulkhead.getMetrics();
 * console.log(`Active: ${metrics.active}/${metrics.maxConcurrent}`);
 * console.log(`Queued: ${metrics.queued}/${metrics.maxQueue}`);
 * console.log(`Rejections: ${metrics.rejections}`);
 * ```
 */
export class Bulkhead {
  private activeRequests: number = 0;
  private queue: Array<() => void> = [];
  private rejectionCount: number = 0;
  private totalExecuted: number = 0;
  private totalSuccesses: number = 0;
  private totalFailures: number = 0;
  
  private readonly config: BulkheadConfig;
  
  /**
   * Creates a new bulkhead instance.
   * 
   * @param name - Identifier for this bulkhead (for logging/metrics)
   * @param config - Bulkhead configuration
   */
  constructor(
    private readonly name: string,
    config: Partial<BulkheadConfig> = {}
  ) {
    this.config = { ...DEFAULT_BULKHEAD_CONFIG, ...config };
    
    // Validate configuration
    if (this.config.maxConcurrent <= 0) {
      throw new Error('maxConcurrent must be greater than 0');
    }
    if (this.config.maxQueue < 0) {
      throw new Error('maxQueue must be greater than or equal to 0');
    }
  }
  
  /**
   * Execute an operation protected by the bulkhead.
   * 
   * The bulkhead will:
   * - Execute immediately if under max concurrent
   * - Queue if at max concurrent but queue not full
   * - Reject if queue is full
   * 
   * @typeParam T - The return type of the operation
   * @param operation - The async operation to execute
   * @returns The result of the operation
   * @throws {BulkheadRejectionError} If the bulkhead is full (max concurrent + max queue)
   * @throws Any error thrown by the operation
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalExecuted++;
    
    // Check if we're at max concurrency
    if (this.activeRequests >= this.config.maxConcurrent) {
      // Check if queue is full
      if (this.queue.length >= this.config.maxQueue) {
        this.rejectionCount++;
        throw new BulkheadRejectionError(
          this.name,
          `Queue full (${this.activeRequests} active, ${this.queue.length}/${this.config.maxQueue} queued)`
        );
      }
      
      // Wait for a slot to become available
      await this.waitForSlot();
    }
    
    // Acquire slot
    this.activeRequests++;
    
    try {
      const result = await operation();
      this.totalSuccesses++;
      return result;
    } catch (error) {
      this.totalFailures++;
      throw error;
    } finally {
      // Release slot
      this.activeRequests--;
      this.releaseNext();
    }
  }
  
  /**
   * Wait for a slot to become available.
   * Creates a promise that resolves when a slot is freed.
   * 
   * @returns Promise that resolves when a slot is available
   */
  private waitForSlot(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }
  
  /**
   * Release the next queued operation.
   * Called when an operation completes to free up a slot.
   */
  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) {
      next(); // Resolve the waiting promise
    }
  }
  
  /**
   * Get comprehensive metrics about the bulkhead.
   * 
   * @returns Current metrics including active/queued/rejected counts
   */
  getMetrics(): BulkheadMetrics {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      rejections: this.rejectionCount,
      maxConcurrent: this.config.maxConcurrent,
      maxQueue: this.config.maxQueue,
      totalExecuted: this.totalExecuted,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
    };
  }
  
  /**
   * Get the bulkhead name.
   * 
   * @returns The bulkhead identifier
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Get the bulkhead configuration.
   * 
   * @returns The current configuration
   */
  getConfig(): Readonly<BulkheadConfig> {
    return Object.freeze({ ...this.config });
  }
  
  /**
   * Check if the bulkhead is currently full (rejecting new requests).
   * 
   * @returns True if both concurrent and queue limits are reached
   */
  isFull(): boolean {
    return (
      this.activeRequests >= this.config.maxConcurrent &&
      this.queue.length >= this.config.maxQueue
    );
  }
  
  /**
   * Check if the bulkhead is currently at maximum concurrency.
   * 
   * @returns True if at max concurrent operations
   */
  isAtCapacity(): boolean {
    return this.activeRequests >= this.config.maxConcurrent;
  }
  
  /**
   * Get the current utilization percentage.
   * 
   * @returns Percentage of concurrent slots in use (0-100)
   */
  getUtilization(): number {
    return (this.activeRequests / this.config.maxConcurrent) * 100;
  }
  
  /**
   * Get the current queue utilization percentage.
   * 
   * @returns Percentage of queue slots in use (0-100)
   */
  getQueueUtilization(): number {
    if (this.config.maxQueue === 0) return 0;
    return (this.queue.length / this.config.maxQueue) * 100;
  }
}


