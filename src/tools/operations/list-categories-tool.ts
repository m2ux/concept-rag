/**
 * List Categories MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import type { CategoryRepository } from '../../domain/interfaces/category-repository.js';
import { InputValidator } from '../../domain/services/validation/index.js';
import { isSome } from '../../domain/functional/index.js';

export interface ListCategoriesToolParams extends ToolParams {
  sortBy?: 'name' | 'popularity' | 'documentCount';
  limit?: number;
  search?: string;
}

export class ListCategoriesTool extends BaseTool<ListCategoriesToolParams> {
  private validator = new InputValidator();
  
  constructor(private categoryRepo: CategoryRepository) {
    super();
  }
  
  name = "list_categories";
  description = "List all available categories with statistics. Discover what subject areas are in your library.";
  
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
      const totalDocuments = allCategories.reduce((sum, cat) => sum + cat.documentCount, 0);
      const rootCategories = allCategories.filter(cat => cat.parentCategoryId === null).length;
      
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
