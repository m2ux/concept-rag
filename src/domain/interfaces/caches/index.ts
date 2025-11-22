/**
 * Cache Interfaces
 * 
 * Abstractions for in-memory caches used to optimize performance
 * by avoiding repeated database queries.
 */

export { IConceptIdCache, ConceptRepositoryForCache } from './concept-id-cache.js';
export { ICategoryIdCache, CategoryRepositoryForCache } from './category-id-cache.js';

