import { ConceptRAGError } from './base.js';

/**
 * Base class for search-related errors.
 * Thrown when search operations fail.
 */
export class SearchError extends ConceptRAGError {
  constructor(
    message: string,
    searchType: string,
    cause?: Error
  ) {
    super(
      message,
      `SEARCH_${searchType.toUpperCase()}_ERROR`,
      { searchType },
      cause
    );
  }
}

/**
 * Thrown when a search query is invalid.
 */
export class InvalidQueryError extends SearchError {
  constructor(
    reason: string,
    query: string
  ) {
    super(
      `Invalid search query: ${reason}`,
      'validation'
    );
    this.context.reason = reason;
    this.context.query = query;
  }
}

/**
 * Thrown when a search operation times out.
 */
export class SearchTimeoutError extends SearchError {
  constructor(
    searchType: string,
    timeoutMs: number
  ) {
    super(
      `Search timed out after ${timeoutMs}ms`,
      searchType
    );
    this.context.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when no results are found for a query.
 * Note: This is often not an error but a normal condition.
 * Use sparingly when absence of results is truly exceptional.
 */
export class NoResultsError extends SearchError {
  constructor(query: string) {
    super(
      'No results found for query',
      'query'
    );
    this.context.query = query;
  }
}

