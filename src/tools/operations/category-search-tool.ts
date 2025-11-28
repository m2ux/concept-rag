/**
 * Category Search MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import type { CategoryRepository } from '../../domain/interfaces/category-repository.js';
import { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { InputValidator } from '../../domain/services/validation/index.js';
import { RecordNotFoundError } from '../../domain/exceptions/index.js';

export interface CategorySearchToolParams extends ToolParams {
  category: string;
  includeChildren?: boolean;
  limit?: number;
}

export class CategorySearchTool extends BaseTool<CategorySearchToolParams> {
  private validator = new InputValidator();
  
  constructor(
    private categoryRepo: CategoryRepository,
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
      
      // Resolve category
      const category = await this.categoryRepo.resolveCategory(params.category);
      if (!category) {
        throw new RecordNotFoundError('Category', params.category);
      }
      
      // Determine which categories to search
      const categoryIdsToSearch = [category.id];
      if (params.includeChildren) {
        const childIds = await this.categoryRepo.getChildIds(category.id);
        categoryIdsToSearch.push(...childIds);
      }
      
      // Find all documents in these categories
      const allDocuments = [];
      for (const id of categoryIdsToSearch) {
        const docs = await this.catalogRepo.findByCategory(id);
        allDocuments.push(...docs);
      }
      
      // Deduplicate documents
      const uniqueDocs = new Map();
      for (const doc of allDocuments) {
        if (!uniqueDocs.has(doc.id)) {
          uniqueDocs.set(doc.id, doc);
        }
      }
      
      const documents = Array.from(uniqueDocs.values());
      
      // Get unique concepts in this category
      const uniqueConceptIds = await this.catalogRepo.getConceptsInCategory(category.id);
      
      // Limit results
      const limit = params.limit || 10;
      const limitedDocs = documents.slice(0, limit);
      
      // Format documents for output - use title from catalog
      const formattedDocs = limitedDocs.map(doc => ({
        title: (doc as any).title || '',
        preview: doc.text.substring(0, 200) + '...',
        primaryConcepts: doc.concepts?.primary_concepts?.slice(0, 5) || []
      }));
      
      // Get hierarchy path
      const hierarchyPath = await this.categoryRepo.getHierarchyPath(category.id);
      
      // Get related categories with names
      const relatedCategoryNames = [];
      for (const relId of category.relatedCategories || []) {
        const relCat = await this.categoryRepo.findById(relId);
        if (relCat) {
          relatedCategoryNames.push({ id: relId, name: relCat.category });
        }
      }
      
      // Get category names for searched IDs
      const searchedCategoryNames = [];
      for (const id of categoryIdsToSearch) {
        const cat = await this.categoryRepo.findById(id);
        if (cat) searchedCategoryNames.push(cat.category);
      }
      
      // Format response
      const result = JSON.stringify({
        category: {
          id: category.id,
          name: category.category,
          description: category.description,
          hierarchy: hierarchyPath,
          aliases: category.aliases || [],
          relatedCategories: relatedCategoryNames
        },
        statistics: {
          totalDocuments: category.documentCount || documents.length,
          totalChunks: category.chunkCount || 0,
          totalConcepts: uniqueConceptIds.length,
          documentsReturned: limitedDocs.length
        },
        documents: formattedDocs,
        includeChildren: params.includeChildren || false,
        categoriesSearched: searchedCategoryNames
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
