/**
 * Cache Infrastructure
 * 
 * Provides caching utilities for performance optimization:
 * - Generic LRU cache with TTL support
 * - Search result caching
 * - Embedding vector caching
 * - ID mapping caches (concepts, categories)
 */

// Generic caching
export { LRUCache, type CacheMetrics } from './lru-cache.js';

// Specialized caches
export { SearchResultCache, type SearchOptions } from './search-result-cache.js';
export { EmbeddingCache } from './embedding-cache.js';

// ID mapping caches
export { ConceptIdCache } from './concept-id-cache.js';
export { CategoryIdCache } from './category-id-cache.js';
export { CatalogSourceCache } from './catalog-source-cache.js';

