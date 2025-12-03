import { ConceptRAGError } from './base.js';

/**
 * Base class for embedding-related errors.
 * Thrown when embedding operations fail.
 */
export class EmbeddingError extends ConceptRAGError {
  constructor(
    message: string,
    provider: string,
    cause?: Error
  ) {
    super(
      message,
      `EMBEDDING_${provider.toUpperCase()}_ERROR`,
      { provider },
      cause
    );
  }
}

/**
 * Thrown when an embedding provider request fails.
 */
export class EmbeddingProviderError extends EmbeddingError {
  constructor(
    provider: string,
    statusCode?: number,
    cause?: Error
  ) {
    super(
      `Embedding provider '${provider}' request failed`,
      provider,
      cause
    );
    if (statusCode) {
      this.context.statusCode = statusCode;
    }
  }
}

/**
 * Thrown when rate limit is exceeded for an embedding provider.
 */
export class RateLimitError extends EmbeddingError {
  constructor(
    provider: string,
    retryAfter?: number
  ) {
    super(
      `Rate limit exceeded for provider '${provider}'`,
      provider
    );
    if (retryAfter) {
      this.context.retryAfter = retryAfter;
    }
  }
}

/**
 * Thrown when embedding dimensions don't match expected dimensions.
 */
export class InvalidEmbeddingDimensionsError extends EmbeddingError {
  constructor(
    provider: string,
    expected: number,
    actual: number
  ) {
    super(
      `Invalid embedding dimensions: expected ${expected}, got ${actual}`,
      provider
    );
    this.context.expected = expected;
    this.context.actual = actual;
  }
}
