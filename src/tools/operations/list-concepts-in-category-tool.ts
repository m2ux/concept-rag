/**
 * List Concepts in Category MCP Tool
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import type { CategoryRepository } from '../../domain/interfaces/category-repository.js';
import { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import { ConceptRepository } from '../../domain/interfaces/repositories/concept-repository.js';
import { isSome } from '../../domain/functional/option.js';

export interface ListConceptsInCategoryToolParams extends ToolParams {
  category: string;
  sortBy?: 'name' | 'documentCount';
  limit?: number;
}

export class ListConceptsInCategoryTool extends BaseTool<ListConceptsInCategoryToolParams> {
  constructor(
    private categoryRepo: CategoryRepository,
    private catalogRepo: CatalogRepository,
    private conceptRepo: ConceptRepository
  ) {
    super();
  }
  
  name = "list_concepts_in_category";
  description = `Find all unique concepts appearing in documents of a specific category. Analyze the conceptual landscape of a domain.

USE THIS TOOL WHEN:
- User asks "what concepts are covered in [domain]?" or "what topics appear in [category]?"
- Analyzing the conceptual landscape of a subject area
- Discovering what ideas are discussed within a specific domain
- Building a concept inventory for a category (e.g., "what concepts appear in software engineering books?")
- Finding related concepts that span documents in the same domain

DO NOT USE for:
- Finding where a specific concept appears (use concept_search or source_concepts)
- Getting concepts from a single document (use extract_concepts with the document)
- Searching for content about a concept (use broad_chunks_search)
- Discovering categories (use list_categories first)

RETURNS: Category metadata, statistics (total documents, chunks, unique concepts), and list of concepts sorted by document count (how many documents mention each concept) or alphabetically. Includes concept weight/importance scores.

COMMON WORKFLOW: Use list_categories to discover domains, then use this tool to understand what concepts are covered in that domain. For deeper exploration, use concept_search with specific concepts found.`;
  
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
      // Resolve category
      const category = await this.categoryRepo.resolveCategory(params.category);
      
      if (!category) {
        return {
          content: [{ 
            type: "text" as const, 
            text: JSON.stringify({
              error: `Category not found: ${params.category}`,
              suggestion: 'Use list_categories to see available categories'
            }, null, 2) 
          }],
          isError: true
        };
      }
      
      // Get unique concepts in this category (query-time computation)
      const conceptIds = await this.catalogRepo.getConceptsInCategory(category.id);
      
      // Fetch concept details
      const limit = params.limit || 50;
      const conceptsToFetch = conceptIds.slice(0, Math.min(conceptIds.length, 200)); // Fetch up to 200 for sorting
      
      // Fetch concepts by ID
      const concepts = [];
      for (const conceptId of conceptsToFetch) {
        try {
          const conceptOption = await this.conceptRepo.findById(conceptId);
          if (isSome(conceptOption)) {
            const concept = conceptOption.value;
            concepts.push({
              id: conceptId,
              name: concept.name,
              documentCount: concept.catalogIds?.length || 0,
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
      
      // Get hierarchy path
      const hierarchyPath = await this.categoryRepo.getHierarchyPath(category.id);
      
      // Format response
      const result = JSON.stringify({
        category: {
          id: category.id,
          name: category.category,
          description: category.description,
          hierarchy: hierarchyPath
        },
        statistics: {
          totalDocuments: category.documentCount || 0,
          totalChunks: category.chunkCount || 0,
          totalUniqueConcepts: conceptIds.length,
          conceptsReturned: limitedConcepts.length
        },
        concepts: limitedConcepts,
        sortedBy: sortBy,
        note: 'Concepts are category-agnostic and appear across multiple categories'
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
