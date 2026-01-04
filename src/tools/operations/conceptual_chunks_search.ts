import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkSearchService } from "../../domain/services/index.js";
import { CatalogRepository } from "../../domain/interfaces/repositories/catalog-repository.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr, isSome } from "../../domain/functional/index.js";
import { Chunk } from "../../domain/models/index.js";
import { Configuration } from "../../application/config/index.js";

export interface ConceptualChunksSearchParams extends ToolParams {
  text: string;
  catalog_id: number;
}

/**
 * MCP tool for searching within a specific document.
 * Thin adapter that delegates to ChunkSearchService.
 */
export class ConceptualChunksSearchTool extends BaseTool<ConceptualChunksSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private chunkSearchService: ChunkSearchService,
    private catalogRepo: CatalogRepository
  ) {
    super();
  }
  
  name = "chunks_search";
  description = `Search for specific information within a single known document. Uses hybrid search with concept and synonym expansion.

USE THIS TOOL WHEN:
- You know which document contains the information you need
- Searching within a specific document identified from catalog_search results
- Focused analysis of one document's content
- Need to find specific passages or sections within a known document

DO NOT USE for:
- Finding which documents to search (use catalog_search first)
- Searching across multiple documents (use broad_chunks_search)
- Tracking a concept across your entire library (use concept_chunks)

RETURNS: Top chunks from the specified document, ranked by hybrid score with concept and WordNet expansion.

NOTE: First use catalog_search to find the document and get its catalog_id.

Debug output can be enabled via DEBUG_SEARCH=true environment variable.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language, keywords, phrases, or technical terms to find within the document",
      },
      catalog_id: {
        type: "number",
        description: "REQUIRED: Document ID from catalog_search results",
      }
    },
    required: ["text", "catalog_id"],
  };

  async execute(params: ConceptualChunksSearchParams) {
    // Validate input
    if (!params.text || params.text.trim() === '') {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Search text is required',
              field: 'text'
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    if (!params.catalog_id || typeof params.catalog_id !== 'number') {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'catalog_id is required and must be a number',
              field: 'catalog_id'
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    // Verify catalog exists
    const catalogOpt = await this.catalogRepo.findById(params.catalog_id);
    if (!isSome(catalogOpt)) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              type: 'not_found',
              message: `Document not found with catalog_id: ${params.catalog_id}`
            },
            timestamp: new Date().toISOString()
          })
        }],
        isError: true,
      };
    }
    
    // Delegate to service with catalog ID
    const debugSearch = Configuration.getInstance().logging.debugSearch;
    const result = await this.chunkSearchService.searchByCatalogId({
      catalogId: params.catalog_id,
      limit: 20,
      debug: debugSearch
    });
    
    // Handle Result type
    if (isErr(result)) {
      const error = result.error;
      const errorMessage = 
        error.type === 'validation' ? error.message :
        error.type === 'database' ? error.message :
        error.type === 'not_found' ? `Resource not found: ${error.resource}` :
        error.type === 'unknown' ? error.message :
        'An unknown error occurred';
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              type: error.type,
              message: errorMessage
            },
            timestamp: new Date().toISOString()
          })
        }],
        isError: true,
      };
    }
    
    // Format results for MCP response
    const catalogTitle = catalogOpt.value.catalogTitle || 'Untitled';
    
    // @ts-expect-error - Type narrowing limitation
    const formattedResults = result.value.map((r: Chunk) => {
      // Use derived concept_names field directly
      const conceptNames = (r.conceptNames && r.conceptNames.length > 0 && r.conceptNames[0] !== '')
        ? r.conceptNames
        : [];
      
      return {
        title: r.catalogTitle || catalogTitle,
        text: r.text,
        concepts: conceptNames,
        concept_ids: r.conceptIds || [],
      };
    });
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(formattedResults, null, 2) },
      ],
      isError: false,
    };
  }
}
