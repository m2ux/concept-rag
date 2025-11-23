/**
 * Performance instrumentation utilities for observability.
 * Lightweight instrumentation without full metrics collection infrastructure.
 */

import { ILogger } from './logger';

export interface PerformanceInstrumentation {
  /**
   * Measure and log the execution time of an async operation.
   */
  measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T>;
  
  /**
   * Measure and log the execution time of a sync operation.
   */
  measureSync<T>(
    operation: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T;
}

export class PerformanceInstrumentor implements PerformanceInstrumentation {
  constructor(
    private logger: ILogger,
    private slowOperationThreshold: number = 1000  // 1 second
  ) {}
  
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.logger.logOperation(operation, duration, context);
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logger.error(
        `Operation failed: ${operation}`,
        error as Error,
        { duration, ...context }
      );
      
      throw error;
    }
  }
  
  measureSync<T>(
    operation: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.logger.logOperation(operation, duration, context);
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logger.error(
        `Operation failed: ${operation}`,
        error as Error,
        { duration, ...context }
      );
      
      throw error;
    }
  }
}

/**
 * Create a performance instrumentor with the given logger.
 */
export function createInstrumentor(
  logger: ILogger,
  slowOperationThreshold?: number
): PerformanceInstrumentation {
  return new PerformanceInstrumentor(logger, slowOperationThreshold);
}


