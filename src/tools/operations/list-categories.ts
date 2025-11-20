/**
 * List Categories Tool
 * 
 * List all available categories with statistics and metadata.
 * Provides category browsing and discovery functionality.
 */

import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';

export interface ListCategoriesParams {
  /**
   * Sort order for results
   * - 'name': Alphabetical by category name
   * - 'popularity': Most documents first (default)
   * - 'documentCount': Same as popularity
   */
  sortBy?: 'name' | 'popularity' | 'documentCount';
  
  /**
   * Maximum number of categories to return
   */
  limit?: number;
  
  /**
   * Optional search query to filter categories
   */
  search?: string;
}

export async function listCategories(
  params: ListCategoriesParams,
  categoryCache: CategoryIdCache
): Promise<string> {
  // Get all categories
  let categories = categoryCache.exportAll();
  
  // Apply search filter if provided
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    categories = categories.filter(cat => 
      cat.category.toLowerCase().includes(searchLower) ||
      cat.description.toLowerCase().includes(searchLower) ||
      cat.aliases.some(alias => alias.toLowerCase().includes(searchLower))
    );
  }
  
  // Sort categories
  const sortBy = params.sortBy || 'popularity';
  if (sortBy === 'name') {
    categories.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // Sort by document count (popularity)
    categories.sort((a, b) => b.documentCount - a.documentCount);
  }
  
  // Limit results
  const limit = params.limit || 50;
  const limitedCategories = categories.slice(0, limit);
  
  // Format output
  const formattedCategories = limitedCategories.map(cat => ({
    id: cat.id,
    name: cat.category,
    description: cat.description,
    aliases: cat.aliases,
    parent: cat.parentCategoryId ? categoryCache.getName(cat.parentCategoryId) : null,
    hierarchy: categoryCache.getHierarchyPathNames(cat.id),
    statistics: {
      documents: cat.documentCount,
      chunks: cat.chunkCount,
      concepts: cat.conceptCount
    },
    relatedCategories: cat.relatedCategories
      .map(id => categoryCache.getName(id))
      .filter(name => name !== undefined)
  }));
  
  // Calculate summary statistics
  const totalCategories = categories.length;
  const totalDocuments = categories.reduce((sum, cat) => sum + cat.documentCount, 0);
  const rootCategories = categories.filter(cat => cat.parentCategoryId === null).length;
  
  return JSON.stringify({
    summary: {
      totalCategories,
      categoriesReturned: formattedCategories.length,
      rootCategories,
      totalDocuments,
      sortedBy: sortBy,
      searchQuery: params.search || null
    },
    categories: formattedCategories
  }, null, 2);
}

