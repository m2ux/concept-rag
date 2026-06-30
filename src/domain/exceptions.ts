/**
 * Legacy domain exceptions for the Concept-RAG system.
 *
 * Holds the three exceptions still thrown on the LanceDB read path
 * (schema validation + concept/embedding integrity). They sit on the
 * standalone `DomainException` base rather than the richer
 * `ConceptRAGError` hierarchy in `./exceptions/`.
 *
 * ponytail: 3 classes kept on the standalone DomainException base instead of merged into the ConceptRAGError hierarchy in ./exceptions/. add when these throw paths gain test coverage AND the resulting tool-boundary change (they would become structured ConceptRAGError output with different error codes) is accepted — until then the migration changes published error output untested, so it is not made.
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
