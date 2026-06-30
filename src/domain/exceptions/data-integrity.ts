import { ConceptRAGError } from './base.js';

/**
 * Base class for data-integrity errors.
 *
 * Raised on the read path when data already stored in the database does not
 * match expectations — a concept is missing, its embeddings are malformed, or
 * a row's schema is wrong. Distinct from {@link ValidationError} (bad *input* at
 * a trust boundary) and {@link DatabaseError} (a failed *operation*): here the
 * operation succeeded but the data it returned is not trustworthy.
 */
export abstract class DataIntegrityError extends ConceptRAGError {}

/**
 * Thrown when a concept cannot be found in the concept table.
 *
 * **Recovery**: Suggest similar concepts or return empty results.
 *
 * @example
 * ```typescript
 * const concept = await conceptRepo.findByName('machine-learning');
 * if (!concept) {
 *   throw new ConceptNotFoundError('machine-learning');
 * }
 * ```
 */
export class ConceptNotFoundError extends DataIntegrityError {
  constructor(
    public readonly conceptName: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      `Concept "${conceptName}" not found`,
      'CONCEPT_NOT_FOUND',
      { ...context, conceptName }
    );
  }
}

/**
 * Thrown when a concept has invalid or missing embeddings (empty, wrong
 * dimensionality, or containing NaN/Infinity).
 *
 * **Recovery**: Cannot perform vector search; suggest database rebuild.
 *
 * @example
 * ```typescript
 * if (!concept.embeddings || concept.embeddings.length !== 384) {
 *   throw new InvalidEmbeddingsError(concept.concept, concept.embeddings?.length || 0);
 * }
 * ```
 */
export class InvalidEmbeddingsError extends DataIntegrityError {
  constructor(
    public readonly conceptName: string,
    public readonly embeddingDimension: number,
    context: Record<string, unknown> = {}
  ) {
    super(
      `Concept "${conceptName}" has invalid embeddings (dimension: ${embeddingDimension}, expected: 384)`,
      'INVALID_EMBEDDINGS',
      { ...context, conceptName, embeddingDimension, expectedDimension: 384 }
    );
  }
}

/**
 * Thrown when a stored row fails schema validation (unexpected field type or
 * missing required field).
 *
 * **Recovery**: Database schema may need a rebuild.
 *
 * @example
 * ```typescript
 * if (typeof row.vector !== 'object' || !Array.isArray(row.vector)) {
 *   throw new SchemaValidationError('vector', 'array', typeof row.vector);
 * }
 * ```
 */
export class SchemaValidationError extends DataIntegrityError {
  constructor(
    public readonly fieldName: string,
    public readonly expectedType: string,
    public readonly actualType: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      `Schema validation failed for field "${fieldName}": expected ${expectedType}, got ${actualType}`,
      'SCHEMA_VALIDATION_ERROR',
      { ...context, fieldName, expectedType, actualType }
    );
  }
}
