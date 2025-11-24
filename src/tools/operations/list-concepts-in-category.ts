/**
 * List Concepts in Category Tool
 * 
 * Lists all unique concepts that appear in documents of a specific category.
 * Uses query-time computation through the catalog table for accuracy.
 * 
 * Design notes:
 * - Concepts are category-agnostic (cross-domain entities)
 * - This tool shows which concepts happen to appear in a category's documents
 * - Performance: ~30-130ms for typical libraries (acceptable for occasional queries)
 * - No redundant storage (concepts queried dynamically through catalog)
 */

import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';
import type { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import type { ConceptRepository } from '../../domain/interfaces/repositories/concept-repository.js';

export interface ListConceptsInCategoryParams {
  /**
   * Category name, ID, or alias
   */
  category: string;
  
  /**
   * Sort order for results
   * - 'name': Alphabetical by concept name
   * - 'documentCount': Most frequently appearing concepts first
   */
  sortBy?: 'name' | 'documentCount';
  
  /**
   * Maximum number of concepts to return
   */
  limit?: number;
}

export async function listConceptsInCategory(
  params: ListConceptsInCategoryParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  conceptRepo: ConceptRepository
): Promise<string> {
  // Resolve category ID (handle name, ID, or alias)
  let categoryId = categoryCache.getIdByAlias(params.category);
  if (!categoryId) {
    categoryId = categoryCache.getId(params.category);
  }
  
  if (!categoryId) {
    // Try parsing as numeric ID
    const numericId = parseInt(params.category, 10);
    if (!isNaN(numericId) && categoryCache.getName(numericId)) {
      categoryId = numericId;
    }
  }
  
  if (!categoryId) {
    return JSON.stringify({
      error: `Category not found: ${params.category}`,
      suggestion: 'Use list_categories to see available categories'
    }, null, 2);
  }
  
  // Get category metadata
  const categoryMetadata = categoryCache.getMetadata(categoryId);
  const categoryStats = categoryCache.getStatistics(categoryId);
  
  if (!categoryMetadata) {
    return JSON.stringify({
      error: `Category metadata not found for ID: ${categoryId}`
    }, null, 2);
  }
  
  // Get unique concepts in this category (query-time computation)
  const conceptIds = await catalogRepo.getConceptsInCategory(categoryId);
  
  // Fetch concept details
  const limit = params.limit || 50;
  const conceptsToFetch = conceptIds.slice(0, Math.min(conceptIds.length, 200)); // Fetch up to 200 for sorting
  
  // Fetch concepts by hash-based integer ID
  const concepts = [];
  for (const conceptId of conceptsToFetch) {
    try {
      const concept = await conceptRepo.findById(conceptId);
      if (concept) {
        concepts.push({
          id: conceptId,
          // @ts-expect-error - Type narrowing limitation
          name: concept.concept,
          // @ts-expect-error - Type narrowing limitation
          type: concept.conceptType,
          // @ts-expect-error - Type narrowing limitation
          documentCount: concept.sources?.length || 0,
          // @ts-expect-error - Type narrowing limitation
          weight: concept.weight || 0
        });
      }
    } catch {
      // Skip concepts that can't be found
    }
  }
  
  // Sort concepts
  const sortBy = params.sortBy || 'documentCount';
  if (sortBy === 'documentCount') {
    concepts.sort((a, b) => b.documentCount - a.documentCount);
  } else {
    concepts.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Limit results
  const limitedConcepts = concepts.slice(0, limit);
  
  // Format response
  return JSON.stringify({
    category: {
      id: categoryId,
      name: categoryMetadata.category,
      description: categoryMetadata.description,
      hierarchy: categoryCache.getHierarchyPathNames(categoryId)
    },
    statistics: {
      totalDocuments: categoryStats?.documentCount || 0,
      totalChunks: categoryStats?.chunkCount || 0,
      totalUniqueConcepts: conceptIds.length,
      conceptsReturned: limitedConcepts.length
    },
    concepts: limitedConcepts,
    sortedBy: sortBy,
    note: 'Concepts are category-agnostic and appear across multiple categories'
  }, null, 2);
}

