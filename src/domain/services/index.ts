/**
 * Domain services for search operations.
 * 
 * These services encapsulate business logic and orchestrate operations
 * across repositories. They keep the tool layer thin and focused on
 * protocol adaptation (MCP).
 */

export * from './concept-search-service.js';
export * from './catalog-search-service.js';
export * from './chunk-search-service.js';

// Result-based services (functional error handling)
export * from './result-catalog-search-service.js';
export * from './result-chunk-search-service.js';
export * from './result-concept-search-service.js';

