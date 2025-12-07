/**
 * Category Utilities for LanceDB Seeding
 * 
 * Utilities for building category ID maps and managing category data.
 */

import { generateStableId } from '../../utils/hash.js';

/**
 * Build a map from category names to stable hash-based IDs.
 * 
 * Categories are sorted alphabetically before ID generation to ensure
 * consistent IDs across runs.
 * 
 * @param categories - Set of category names
 * @returns Map from category name to numeric ID
 */
export function buildCategoryIdMap(categories: Set<string>): Map<string, number> {
  const categoryIdMap = new Map<string, number>();
  const existingIds = new Set<number>();
  
  const sortedCategories = Array.from(categories).sort();
  for (const category of sortedCategories) {
    const categoryId = generateStableId(category, existingIds);
    existingIds.add(categoryId);
    categoryIdMap.set(category, categoryId);
  }
  
  return categoryIdMap;
}

/**
 * Extract unique categories from document metadata.
 * 
 * Categories can be in two places:
 * 1. doc.metadata.concepts.categories (structured format from LLM extraction)
 * 2. doc.metadata.concept_categories (flat array format)
 * 
 * @param documents - Array of documents with metadata
 * @returns Set of unique category names
 */
export function extractCategoriesFromDocuments(documents: Array<{ metadata: any }>): Set<string> {
  const categorySet = new Set<string>();
  
  for (const doc of documents) {
    let categories: string[] = [];
    
    if (doc.metadata.concepts && typeof doc.metadata.concepts === 'object') {
      categories = doc.metadata.concepts.categories || [];
    } else if (doc.metadata.concept_categories) {
      categories = doc.metadata.concept_categories;
    }
    
    for (const cat of categories) {
      categorySet.add(cat);
    }
  }
  
  return categorySet;
}

/**
 * Category statistics for a set of documents.
 */
export interface CategoryStats {
  documentCount: number;
  sources: Set<string>;
}

/**
 * Build category statistics from documents.
 * 
 * @param documents - Array of documents with metadata
 * @returns Map from category name to statistics
 */
export function buildCategoryStats(
  documents: Array<{ metadata: any }>
): Map<string, CategoryStats> {
  const categoryStats = new Map<string, CategoryStats>();
  
  for (const doc of documents) {
    let categories: string[] = [];
    
    if (doc.metadata.concepts && typeof doc.metadata.concepts === 'object') {
      categories = doc.metadata.concepts.categories || [];
    } else if (doc.metadata.concept_categories) {
      categories = doc.metadata.concept_categories;
    }
    
    for (const cat of categories) {
      if (!categoryStats.has(cat)) {
        categoryStats.set(cat, {
          documentCount: 0,
          sources: new Set()
        });
      }
      const stats = categoryStats.get(cat)!;
      stats.documentCount++;
      if (doc.metadata.source) {
        stats.sources.add(doc.metadata.source);
      }
    }
  }
  
  return categoryStats;
}
