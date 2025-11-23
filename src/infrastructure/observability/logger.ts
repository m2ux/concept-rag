/**
 * Structured logging infrastructure for observability.
 * Provides consistent, parseable log output with context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;         // ISO 8601 format
  message: string;
  traceId?: string;          // Request correlation ID
  operation?: string;        // Operation name (e.g., "search", "index")
  duration?: number;         // Operation duration in ms
  context?: Record<string, unknown>;  // Additional context
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  /**
   * Log an operation with timing information.
   */
  logOperation(
    operation: string,
    durationMs: number,
    context?: Record<string, unknown>
  ): void;
  
  /**
   * Create a child logger with additional context.
   */
  child(context: Record<string, unknown>): ILogger;
}

export class StructuredLogger implements ILogger {
  private context: Record<string, unknown>;
  private minLevel: LogLevel;
  
  constructor(
    context: Record<string, unknown> = {},
    minLevel: LogLevel = 'info'
  ) {
    this.context = context;
    this.minLevel = minLevel;
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};
    
    this.log('error', message, { ...context, ...errorContext });
  }
  
  logOperation(
    operation: string,
    durationMs: number,
    context?: Record<string, unknown>
  ): void {
    const slow = durationMs > 1000; // >1s is slow
    const level: LogLevel = slow ? 'warn' : 'info';
    
    this.log(level, `Operation completed: ${operation}`, {
      operation,
      duration: durationMs,
      slow,
      ...context
    });
  }
  
  child(context: Record<string, unknown>): ILogger {
    return new StructuredLogger(
      { ...this.context, ...context },
      this.minLevel
    );
  }
  
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      traceId: this.getTraceId(),
      ...this.context,
      ...context
    };
    
    // Output as JSON for parseability
    console.log(JSON.stringify(entry));
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }
  
  private getTraceId(): string | undefined {
    // Get from async context if available
    // For now, return from context if set
    return this.context.traceId as string | undefined;
  }
}

/**
 * Create a logger instance with the given context.
 */
export function createLogger(
  context: Record<string, unknown> = {},
  minLevel: LogLevel = 'info'
): ILogger {
  return new StructuredLogger(context, minLevel);
}


