/**
 * Category Search MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';
import { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { categorySearch, CategorySearchParams } from './category-search.js';
import { InputValidator } from '../../domain/services/validation/index.js';

export interface CategorySearchToolParams extends ToolParams {
  category: string;
  includeChildren?: boolean;
  limit?: number;
}

export class CategorySearchTool extends BaseTool<CategorySearchToolParams> {
  private validator = new InputValidator();
  
  constructor(
    private categoryCache: CategoryIdCache,
    private catalogRepo: CatalogRepository
  ) {
    super();
  }
  
  name = "category_search";
  description = "Find documents by category. Browse documents in a specific domain or subject area.";
  
  inputSchema = {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: "Category name, ID, or alias (e.g., 'software engineering', 'distributed systems')"
      },
      includeChildren: {
        type: "boolean",
        description: "Include child categories in hierarchy (default: false)"
      },
      limit: {
        type: "number",
        description: "Maximum number of documents to return (default: 10)"
      }
    },
    required: ["category"]
  };
  
  async execute(params: CategorySearchToolParams) {
    try {
      // Validate input
      this.validator.validateCategorySearch(params);
      
      const result = await categorySearch(
        params as CategorySearchParams,
        this.categoryCache,
        this.catalogRepo
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

