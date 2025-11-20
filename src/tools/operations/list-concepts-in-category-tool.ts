/**
 * List Concepts in Category MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import { CategoryIdCache } from '../../infrastructure/cache/category-id-cache.js';
import { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { ConceptRepository } from '../../domain/interfaces/repositories/concept-repository.js';
import { listConceptsInCategory, ListConceptsInCategoryParams } from './list-concepts-in-category.js';

export interface ListConceptsInCategoryToolParams extends ToolParams {
  category: string;
  sortBy?: 'name' | 'documentCount';
  limit?: number;
}

export class ListConceptsInCategoryTool extends BaseTool<ListConceptsInCategoryToolParams> {
  constructor(
    private categoryCache: CategoryIdCache,
    private catalogRepo: CatalogRepository,
    private conceptRepo: ConceptRepository
  ) {
    super();
  }
  
  name = "list_concepts_in_category";
  description = "Find all unique concepts appearing in documents of a specific category. Analyze the conceptual landscape of a domain.";
  
  inputSchema = {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: "Category name, ID, or alias"
      },
      sortBy: {
        type: "string",
        description: "Sort order: 'name' or 'documentCount' (default: 'documentCount')",
        enum: ["name", "documentCount"]
      },
      limit: {
        type: "number",
        description: "Maximum number of concepts to return (default: 50)"
      }
    },
    required: ["category"]
  };
  
  async execute(params: ListConceptsInCategoryToolParams) {
    try {
      const result = await listConceptsInCategory(
        params as ListConceptsInCategoryParams,
        this.categoryCache,
        this.catalogRepo,
        this.conceptRepo
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

