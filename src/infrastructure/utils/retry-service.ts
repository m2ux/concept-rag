import { RateLimitError, ValidationError } from '../../domain/exceptions/index.js';

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts.
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds before first retry.
   */
  initialDelayMs: number;
  
  /**
   * Maximum delay in milliseconds between retries.
   */
  maxDelayMs: number;
  
  /**
   * Multiplier for exponential backoff.
   */
  backoffMultiplier: number;
  
  /**
   * Error types that should trigger a retry.
   * If not specified, all errors except ValidationError will be retried.
   */
  retryableErrors?: Array<new (...args: any[]) => Error>;
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Service for executing operations with retry logic and exponential backoff.
 * 
 * @example
 * ```typescript
 * const retryService = new RetryService();
 * 
 * const result = await retryService.executeWithRetry(
 *   async () => await embeddingProvider.embed(text),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export class RetryService {
  /**
   * Execute an operation with retry logic and exponential backoff.
   * 
   * @param operation - The async operation to execute
   * @param config - Retry configuration
   * @returns The result of the operation
   * @throws The last error if all retries are exhausted
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors - they won't succeed on retry
        if (error instanceof ValidationError) {
          throw error;
        }
        
        // Check if this error type is retryable
        if (finalConfig.retryableErrors) {
          const isRetryable = finalConfig.retryableErrors.some(
            errorType => error instanceof errorType
          );
          if (!isRetryable) {
            throw error;
          }
        }
        
        // Calculate delay for this attempt
        let delay = finalConfig.initialDelayMs * Math.pow(
          finalConfig.backoffMultiplier,
          attempt
        );
        
        // Handle rate limit errors with specific retry-after
        if (error instanceof RateLimitError && error.context.retryAfter) {
          delay = error.context.retryAfter as number;
        }
        
        // Cap at maximum delay
        delay = Math.min(delay, finalConfig.maxDelayMs);
        
        // If this is the last attempt, don't delay
        if (attempt === finalConfig.maxRetries - 1) {
          break;
        }
        
        console.error(
          `Operation failed (attempt ${attempt + 1}/${finalConfig.maxRetries}), retrying in ${delay}ms:`,
          error instanceof Error ? error.message : error
        );
        
        await this.sleep(delay);
      }
    }
    
    // All retries exhausted
    throw lastError;
  }
  
  /**
   * Sleep for the specified duration.
   * @param ms - Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

