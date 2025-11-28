/**
 * Category Search Tool
 * 
 * Search for documents and concepts by category.
 * Provides comprehensive category-based browsing and filtering.
 * 
 * Design notes:
 * - Categories are stored directly on documents (catalog.category_ids)
 * - Concepts are category-agnostic (cross-domain entities)
 * - Direct queries on category_ids for fast filtering
 */

import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';
import type { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { InputValidator } from '../../domain/services/validation/index.js';
import { RecordNotFoundError } from '../../domain/exceptions/index.js';

export interface CategorySearchParams {
  /**
   * Category name, ID, or alias to search for
   */
  category: string;
  
  /**
   * Include child categories in hierarchy
   */
  includeChildren?: boolean;
  
  /**
   * Maximum number of documents to return
   */
  limit?: number;
}

export async function categorySearch(
  params: CategorySearchParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository
): Promise<string> {
  // Validate input
  const validator = new InputValidator();
  validator.validateCategorySearch(params);
  
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
    throw new RecordNotFoundError('Category', params.category);
  }
  
  // Get category metadata
  const categoryMetadata = categoryCache.getMetadata(categoryId);
  const categoryStats = categoryCache.getStatistics(categoryId);
  
  if (!categoryMetadata) {
    throw new RecordNotFoundError('Category metadata', String(categoryId));
  }
  
  // Determine which categories to search
  const categoryIdsToSearch = [categoryId];
  if (params.includeChildren) {
    const children = categoryCache.getChildren(categoryId);
    categoryIdsToSearch.push(...children);
  }
  
  // Find all documents in these categories
  const allDocuments = [];
  for (const id of categoryIdsToSearch) {
    const docs = await catalogRepo.findByCategory(id);
    allDocuments.push(...docs);
  }
  
  // Deduplicate documents (a document may be in multiple categories)
  const uniqueDocs = new Map();
  for (const doc of allDocuments) {
    if (!uniqueDocs.has(doc.id)) {
      uniqueDocs.set(doc.id, doc);
    }
  }
  
  const documents = Array.from(uniqueDocs.values());
  
  // Compute unique concepts dynamically from all documents
  const uniqueConceptIds = await catalogRepo.getConceptsInCategory(categoryId);
  
  // Limit results
  const limit = params.limit || 10;
  const limitedDocs = documents.slice(0, limit);
  
  // Format documents for output
  const formattedDocs = limitedDocs.map(doc => ({
    source: doc.source,
    preview: doc.text.substring(0, 200) + '...',
    primaryConcepts: doc.concepts?.primary_concepts?.slice(0, 5) || []
  }));
  
  // Get related categories
  const relatedCategories = (categoryMetadata.relatedCategories || [])
    .map(id => ({
      id,
      name: categoryCache.getName(id)
    }))
    .filter(c => c.name !== undefined);
  
  // Format response
  return JSON.stringify({
    category: {
      id: categoryId,
      name: categoryMetadata.category,
      description: categoryMetadata.description,
      hierarchy: categoryCache.getHierarchyPathNames(categoryId),
      aliases: categoryMetadata.aliases || [],
      relatedCategories
    },
    statistics: {
      totalDocuments: categoryStats?.documentCount || documents.length,
      totalChunks: categoryStats?.chunkCount || 0,
      totalConcepts: uniqueConceptIds.length,
      documentsReturned: limitedDocs.length
    },
    documents: formattedDocs,
    includeChildren: params.includeChildren || false,
    categoriesSearched: categoryIdsToSearch.map(id => categoryCache.getName(id))
  }, null, 2);
}

