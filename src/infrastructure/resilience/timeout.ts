import { TimeoutError } from './errors.js';

/**
 * Predefined timeout values for different operation types.
 * 
 * These values are chosen based on typical operation characteristics:
 * - LLM_CALL: 30s - Concept extraction can take time with large texts
 * - EMBEDDING: 10s - Embedding generation is typically faster
 * - SEARCH: 5s - Search should be fast for good UX
 * - DATABASE: 3s - Database queries should be quick
 * - HEALTH_CHECK: 1s - Health checks need to be very fast
 */
export const TIMEOUTS = {
  /** Timeout for LLM API calls (concept extraction, etc.) */
  LLM_CALL: 30000,
  
  /** Timeout for embedding generation */
  EMBEDDING: 10000,
  
  /** Timeout for search operations */
  SEARCH: 5000,
  
  /** Timeout for database queries */
  DATABASE: 3000,
  
  /** Timeout for health checks */
  HEALTH_CHECK: 1000,
} as const;

/**
 * Execute an async operation with a timeout.
 * 
 * If the operation doesn't complete within the specified timeout,
 * a TimeoutError is thrown. The operation continues in the background
 * but its result is discarded.
 * 
 * @typeParam T - The return type of the operation
 * @param operation - The async operation to execute
 * @param timeoutMs - Maximum duration in milliseconds
 * @param operationName - Name for error messages and logging
 * @returns The result of the operation if it completes in time
 * @throws {TimeoutError} If the operation exceeds the timeout
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const result = await withTimeout(
 *   () => llmAPI.extractConcepts(text),
 *   TIMEOUTS.LLM_CALL,
 *   'extract_concepts'
 * );
 * ```
 * 
 * @example
 * With custom timeout:
 * ```typescript
 * try {
 *   const data = await withTimeout(
 *     () => fetchData(),
 *     5000,
 *     'fetch_data'
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.error(`Operation timed out after ${error.timeoutMs}ms`);
 *   }
 * }
 * ```
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  // Create a timeout promise that rejects after the specified duration
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });
  
  // Race the operation against the timeout
  return Promise.race([operation(), timeoutPromise]);
}

/**
 * Create a timeout-wrapped version of an async function.
 * 
 * This is useful for wrapping service methods with consistent timeouts.
 * 
 * @typeParam TArgs - Tuple type of the function arguments
 * @typeParam TReturn - Return type of the function
 * @param fn - The async function to wrap
 * @param timeoutMs - Maximum duration in milliseconds
 * @param operationName - Name for error messages
 * @returns A wrapped version of the function with timeout
 * 
 * @example
 * ```typescript
 * class LLMService {
 *   private rawExtract = async (text: string) => { ... };
 *   
 *   // Wrap with timeout
 *   extractConcepts = wrapWithTimeout(
 *     this.rawExtract,
 *     TIMEOUTS.LLM_CALL,
 *     'llm_extract_concepts'
 *   );
 * }
 * 
 * // Usage
 * const concepts = await llmService.extractConcepts(text);
 * // Automatically times out after 30s
 * ```
 */
export function wrapWithTimeout<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  timeoutMs: number,
  operationName: string
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    return withTimeout(() => fn(...args), timeoutMs, operationName);
  };
}

/**
 * Configuration for timeout behavior.
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  
  /** Name of the operation (for error messages) */
  operationName: string;
  
  /** Optional callback when timeout occurs */
  onTimeout?: (operationName: string, timeoutMs: number) => void;
}

/**
 * Advanced timeout utility with callbacks and cancellation support.
 * 
 * @typeParam T - The return type of the operation
 * @param operation - The async operation to execute
 * @param config - Timeout configuration
 * @returns The result of the operation if it completes in time
 * @throws {TimeoutError} If the operation exceeds the timeout
 * 
 * @example
 * ```typescript
 * const result = await withTimeoutConfig(
 *   () => slowOperation(),
 *   {
 *     timeoutMs: 5000,
 *     operationName: 'slow_op',
 *     onTimeout: (name, duration) => {
 *       console.warn(`${name} timed out after ${duration}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function withTimeoutConfig<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  try {
    return await withTimeout(operation, config.timeoutMs, config.operationName);
  } catch (error) {
    if (error instanceof TimeoutError && config.onTimeout) {
      config.onTimeout(config.operationName, config.timeoutMs);
    }
    throw error;
  }
}

