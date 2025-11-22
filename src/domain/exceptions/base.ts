/**
 * Base error class for all concept-RAG errors.
 * Provides structured error information for consistent handling.
 * 
 * @example
 * ```typescript
 * class MyCustomError extends ConceptRAGError {
 *   constructor(message: string, cause?: Error) {
 *     super(message, 'MY_CUSTOM_ERROR', { detail: 'something' }, cause);
 *   }
 * }
 * ```
 */
export abstract class ConceptRAGError extends Error {
  /**
   * Error code for programmatic error handling.
   * Format: CATEGORY_SPECIFIC_ERROR (e.g., VALIDATION_MISSING_FIELD)
   */
  public readonly code: string;
  
  /**
   * Additional context about the error.
   * May include field names, values, suggestions, etc.
   */
  public readonly context: Record<string, unknown>;
  
  /**
   * Timestamp when error occurred.
   */
  public readonly timestamp: Date;
  
  /**
   * Original error if this error wraps another.
   */
  public readonly cause?: Error;
  
  constructor(
    message: string,
    code: string,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.cause = cause;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Get a structured representation of the error.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause?.message
    };
  }
  
  /**
   * Check if this error is of a specific type.
   */
  is(errorClass: new (...args: any[]) => ConceptRAGError): boolean {
    return this instanceof errorClass;
  }
}

