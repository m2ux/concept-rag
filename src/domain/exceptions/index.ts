/**
 * Comprehensive exception hierarchy for concept-RAG.
 * 
 * This module provides a structured error system with:
 * - Base error class with rich context
 * - Category-specific error types
 * - Error codes for programmatic handling
 * - Cause chain support
 * 
 * @example
 * ```typescript
 * import { RequiredFieldError, DatabaseError } from './exceptions';
 * 
 * // Validation error
 * if (!query.text) {
 *   throw new RequiredFieldError('text');
 * }
 * 
 * // Database error with cause
 * try {
 *   await db.query('...');
 * } catch (err) {
 *   throw new DatabaseError('Query failed', 'query', err);
 * }
 * ```
 */

// Base error
export { ConceptRAGError } from './base.js';

// Validation errors
export {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  ValueOutOfRangeError
} from './validation.js';

// Database errors
export {
  DatabaseError,
  RecordNotFoundError,
  DuplicateRecordError,
  ConnectionError,
  TransactionError
} from './database.js';

// Embedding errors
export {
  EmbeddingError,
  EmbeddingProviderError,
  RateLimitError,
  InvalidEmbeddingDimensionsError
} from './embedding.js';

// Search errors
export {
  SearchError,
  InvalidQueryError,
  SearchTimeoutError,
  NoResultsError
} from './search.js';

// Configuration errors
export {
  ConfigurationError,
  MissingConfigError,
  InvalidConfigError
} from './configuration.js';

// Document errors
export {
  DocumentError,
  UnsupportedFormatError,
  DocumentParseError,
  DocumentTooLargeError
} from './document.js';

