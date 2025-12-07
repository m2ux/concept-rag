/**
 * LanceDB Seeding Utilities
 * 
 * Utilities for seeding and managing LanceDB tables during document ingestion.
 */

export {
  calculatePartitions,
  createOptimizedIndex,
  createIndexIfNeeded,
  MIN_VECTORS_FOR_INDEX
} from './index-utils.js';

export {
  buildCategoryIdMap,
  extractCategoriesFromDocuments,
  buildCategoryStats,
  type CategoryStats
} from './category-utils.js';
