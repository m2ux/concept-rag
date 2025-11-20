/**
 * List Categories MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';
import { listCategories, ListCategoriesParams } from './list-categories.js';

export interface ListCategoriesToolParams extends ToolParams {
  sortBy?: 'name' | 'popularity' | 'documentCount';
  limit?: number;
  search?: string;
}

export class ListCategoriesTool extends BaseTool<ListCategoriesToolParams> {
  constructor(private categoryCache: CategoryIdCache) {
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
      const result = await listCategories(
        params as ListCategoriesParams,
        this.categoryCache
      );
      
      return {
        content: [{ type: "text" as const, text: result }],
        isError: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

