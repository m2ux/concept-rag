/**
 * Logger interface for resilience patterns.
 * 
 * Provides a minimal logging abstraction to decouple resilience
 * patterns from console output, enabling:
 * - Silent operation in tests
 * - Structured logging in production
 * - Custom log handling
 * 
 * @example Using with console (default)
 * ```typescript
 * const breaker = new CircuitBreaker('api', {}, ConsoleLogger);
 * ```
 * 
 * @example Silent for tests
 * ```typescript
 * const breaker = new CircuitBreaker('api', {}, NoopLogger);
 * ```
 * 
 * @example Custom structured logger
 * ```typescript
 * const structuredLogger: ResilienceLogger = {
 *   info: (msg, ctx) => myLogger.info({ ...ctx, message: msg }),
 *   warn: (msg, ctx) => myLogger.warn({ ...ctx, message: msg }),
 *   error: (msg, ctx) => myLogger.error({ ...ctx, message: msg }),
 * };
 * ```
 */
export interface ResilienceLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Console-based logger (default).
 */
export const ConsoleLogger: ResilienceLogger = {
  info: (message, context) => {
    if (context) {
      console.log(message, context);
    } else {
      console.log(message);
    }
  },
  warn: (message, context) => {
    if (context) {
      console.warn(message, context);
    } else {
      console.warn(message);
    }
  },
  error: (message, context) => {
    if (context) {
      console.error(message, context);
    } else {
      console.error(message);
    }
  },
};

/**
 * No-op logger for silent operation (testing).
 */
export const NoopLogger: ResilienceLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

