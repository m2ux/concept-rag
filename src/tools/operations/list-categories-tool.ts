/**
 * List Categories MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import type { CategoryRepository } from '../../domain/interfaces/category-repository.js';
import type { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { InputValidator } from '../../domain/services/validation/index.js';
import { isSome } from '../../domain/functional/index.js';

export interface ListCategoriesToolParams extends ToolParams {
  sortBy?: 'name' | 'popularity' | 'documentCount';
  limit?: number;
  search?: string;
}

export class ListCategoriesTool extends BaseTool<ListCategoriesToolParams> {
  private validator = new InputValidator();
  
  constructor(
    private categoryRepo: CategoryRepository,
    private catalogRepo?: CatalogRepository
  ) {
    super();
  }
  
  name = "list_categories";
  description = `List all available categories with statistics. Discover what subject areas are in your library.

USE THIS TOOL WHEN:
- User asks "what categories exist?" or "what subject areas do you have?"
- Starting category-based exploration of the library
- Need to discover available domains before drilling into specific categories
- Building an overview of the library's organizational structure
- Finding the right category name/ID for use with category_search

DO NOT USE for:
- Finding documents about a specific topic (use catalog_search instead)
- Searching within document content (use broad_chunks_search instead)
- Finding where a concept appears (use concept_search or source_concepts)
- Getting documents in a known category (use category_search with the category name)

RETURNS: Array of categories with names, descriptions, aliases, hierarchy paths, parent/child relationships, and statistics (document count, chunk count, concept count). Includes summary with total categories and root category count.

COMMON WORKFLOW: Use list_categories first to discover available categories, then use category_search with a specific category name to get documents in that category.`;
  
  inputSchema = {
    type: "object" as const,
    properties: {
      sortBy: {
        type: "string",
        description: "Sort order: 'name', 'popularity', or 'documentCount' (default: 'popularity')",
        enum: ["name", "popularity", "documentCount"]
      },
      limit: {
        type: "number",
        description: "Maximum number of categories to return (default: 50)"
      },
      search: {
        type: "string",
        description: "Optional filter by category name or description"
      }
    },
    required: []
  };
  
  async execute(params: ListCategoriesToolParams) {
    try {
      // Validate input
      this.validator.validateListCategories(params);
      
      // Get all categories
      let categories = await this.categoryRepo.findAll();
      
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
      
      // Format output (fetch additional data for each category)
      const formattedCategories = await Promise.all(limitedCategories.map(async cat => {
        const hierarchyPath = await this.categoryRepo.getHierarchyPath(cat.id);
        const parentCatOpt = cat.parentCategoryId 
          ? await this.categoryRepo.findById(cat.parentCategoryId)
          : null;
        
        // Get related category names
        const relatedNames = [];
        for (const relId of cat.relatedCategories || []) {
          const relCatOpt = await this.categoryRepo.findById(relId);
          if (isSome(relCatOpt)) relatedNames.push(relCatOpt.value.category);
        }
        
        return {
          id: cat.id,
          name: cat.category,
          description: cat.description,
          aliases: cat.aliases,
          parent: parentCatOpt && isSome(parentCatOpt) ? parentCatOpt.value.category : null,
          hierarchy: hierarchyPath,
          statistics: {
            documents: cat.documentCount,
            chunks: cat.chunkCount,
            concepts: cat.conceptCount
          },
          relatedCategories: relatedNames
        };
      }));
      
      // Calculate summary statistics
      const allCategories = await this.categoryRepo.findAll();
      const totalCategories = allCategories.length;
      const rootCategories = allCategories.filter(cat => cat.parentCategoryId === null).length;
      
      // Get actual document count from catalog (not sum of category assignments)
      let totalDocuments: number;
      if (this.catalogRepo) {
        totalDocuments = await this.catalogRepo.count();
      } else {
        // Fallback: use max document count from any category as estimate
        totalDocuments = Math.max(...allCategories.map(cat => cat.documentCount), 0);
      }
      
      const result = JSON.stringify({
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
      
      return {
        content: [{ type: "text" as const, text: result }],
        isError: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
