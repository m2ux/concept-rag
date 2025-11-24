/**
 * Domain services for search operations.
 * 
 * These services encapsulate business logic and orchestrate operations
 * across repositories. They use Result types for explicit error handling.
 */

export * from './concept-search-service.js';
// @ts-expect-error - Type narrowing limitation
export * from './catalog-search-service.js';
// @ts-expect-error - Type narrowing limitation
export * from './chunk-search-service.js';

