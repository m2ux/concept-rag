/**
 * Domain exceptions for the Concept-RAG system.
 * 
 * These exceptions represent domain-level errors that occur during
 * business logic execution. They should be caught at application boundaries
 * (MCP tools, API handlers) and converted to appropriate user-facing messages.
 * 
 * **Design Pattern**: Exception Hierarchy
 * - Base exception for all domain errors
 * - Specific exceptions for different error types
 * - Enables precise error handling and logging
 * 
 * See REFERENCES.md for pattern sources and further reading.
 * 
 * @example
 * ```typescript
 * try {
 *   const concept = await conceptRepo.findByName('nonexistent');
 *   if (!concept) {
 *     throw new ConceptNotFoundError('nonexistent');
 *   }
 * } catch (error) {
 *   if (error instanceof ConceptNotFoundError) {
 *     return { error: `Concept "${error.conceptName}" not found` };
 *   }
 *   throw error; // Re-throw unexpected errors
 * }
 * ```
 */

/**
 * Base class for all domain exceptions.
 * 
 * Extends Error with additional context for debugging and logging.
 */
export abstract class DomainException extends Error {
  /**
   * Error code for categorization (e.g., 'CONCEPT_NOT_FOUND')
   */
  abstract readonly code: string;
  
  /**
   * Additional context for debugging
   */
  public readonly context?: Record<string, any>;
  
  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Convert exception to JSON for logging/serialization
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Thrown when a concept cannot be found in the concept table.
 * 
 * **When to use**:
 * - ConceptRepository.findByName() returns null
 * - Concept search operations fail to find matching concept
 * 
 * **Recovery**: Suggest similar concepts or return empty results
 * 
 * @example
 * ```typescript
 * const concept = await conceptRepo.findByName('machine-learning');
 * if (!concept) {
 *   throw new ConceptNotFoundError('machine-learning');
 * }
 * ```
 */
export class ConceptNotFoundError extends DomainException {
  readonly code = 'CONCEPT_NOT_FOUND';
  
  constructor(
    public readonly conceptName: string,
    context?: Record<string, any>
  ) {
    super(
      `Concept "${conceptName}" not found`,
      { ...context, conceptName }
    );
  }
}

/**
 * Thrown when a concept has invalid or missing embeddings.
 * 
 * **When to use**:
 * - Concept embeddings array is empty
 * - Embeddings have wrong dimensionality (not 384)
 * - Embeddings contain invalid values (NaN, Infinity)
 * 
 * **Recovery**: Cannot perform vector search; suggest database rebuild
 * 
 * @example
 * ```typescript
 * if (!concept.embeddings || concept.embeddings.length !== 384) {
 *   throw new InvalidEmbeddingsError(concept.concept, concept.embeddings?.length || 0);
 * }
 * ```
 */
export class InvalidEmbeddingsError extends DomainException {
  readonly code = 'INVALID_EMBEDDINGS';
  
  constructor(
    public readonly conceptName: string,
    public readonly embeddingDimension: number,
    context?: Record<string, any>
  ) {
    super(
      `Concept "${conceptName}" has invalid embeddings (dimension: ${embeddingDimension}, expected: 384)`,
      { ...context, conceptName, embeddingDimension, expectedDimension: 384 }
    );
  }
}

/**
 * Thrown when a document/source cannot be found.
 * 
 * **When to use**:
 * - Source path doesn't exist in catalog
 * - Document has been deleted but referenced in chunks
 * 
 * **Recovery**: Return empty results or suggest valid sources
 * 
 * @example
 * ```typescript
 * const chunks = await chunkRepo.findBySource('/path/to/doc.pdf', 10);
 * if (chunks.length === 0) {
 *   throw new SourceNotFoundError('/path/to/doc.pdf');
 * }
 * ```
 */
export class SourceNotFoundError extends DomainException {
  readonly code = 'SOURCE_NOT_FOUND';
  
  constructor(
    public readonly sourcePath: string,
    context?: Record<string, any>
  ) {
    super(
      `Source document "${sourcePath}" not found`,
      { ...context, sourcePath }
    );
  }
}

/**
 * Thrown when a search query is invalid or malformed.
 * 
 * **When to use**:
 * - Empty search query
 * - Query exceeds maximum length
 * - Query contains invalid characters
 * 
 * **Recovery**: Prompt user for valid query
 * 
 * @example
 * ```typescript
 * if (!query.text || query.text.trim().length === 0) {
 *   throw new InvalidQueryError('Search query cannot be empty');
 * }
 * ```
 */
export class InvalidQueryError extends DomainException {
  readonly code = 'INVALID_QUERY';
  
  constructor(
    message: string,
    public readonly query?: string,
    context?: Record<string, any>
  ) {
    super(message, { ...context, query });
  }
}

/**
 * Thrown when database operations fail unexpectedly.
 * 
 * **When to use**:
 * - LanceDB connection fails
 * - Table doesn't exist
 * - Query execution fails
 * 
 * **Recovery**: Retry or suggest database verification
 * 
 * @example
 * ```typescript
 * try {
 *   const results = await table.vectorSearch(vector).toArray();
 * } catch (error) {
 *   throw new DatabaseOperationError('Vector search failed', error as Error);
 * }
 * ```
 */
export class DatabaseOperationError extends DomainException {
  readonly code = 'DATABASE_OPERATION_ERROR';
  
  constructor(
    message: string,
    public readonly originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, {
      ...context,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    });
  }
}

/**
 * Thrown when schema validation fails (e.g., unexpected field types).
 * 
 * **When to use**:
 * - Database row has unexpected structure
 * - Field type doesn't match expected type
 * - Required field is missing
 * 
 * **Recovery**: Database schema may need rebuild
 * 
 * @example
 * ```typescript
 * if (typeof row.vector !== 'object' || !Array.isArray(row.vector)) {
 *   throw new SchemaValidationError('vector', 'array', typeof row.vector);
 * }
 * ```
 */
export class SchemaValidationError extends DomainException {
  readonly code = 'SCHEMA_VALIDATION_ERROR';
  
  constructor(
    public readonly fieldName: string,
    public readonly expectedType: string,
    public readonly actualType: string,
    context?: Record<string, any>
  ) {
    super(
      `Schema validation failed for field "${fieldName}": expected ${expectedType}, got ${actualType}`,
      { ...context, fieldName, expectedType, actualType }
    );
  }
}

/**
 * Thrown when required parameters are missing.
 * 
 * **When to use**:
 * - MCP tool invoked without required parameters
 * - Repository method called with invalid arguments
 * 
 * **Recovery**: Prompt user for missing parameters
 * 
 * @example
 * ```typescript
 * if (!params.concept) {
 *   throw new MissingParameterError('concept');
 * }
 * ```
 */
export class MissingParameterError extends DomainException {
  readonly code = 'MISSING_PARAMETER';
  
  constructor(
    public readonly parameterName: string,
    context?: Record<string, any>
  ) {
    super(
      `Required parameter "${parameterName}" is missing`,
      { ...context, parameterName }
    );
  }
}
