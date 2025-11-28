import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkSearchService } from "../../domain/services/index.js";
import { CatalogRepository } from "../../domain/interfaces/repositories/catalog-repository.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr, isSome } from "../../domain/functional/index.js";
import { Chunk } from "../../domain/models/index.js";
import { CatalogSourceCache } from "../../infrastructure/cache/catalog-source-cache.js";
import { ConceptIdCache } from "../../infrastructure/cache/concept-id-cache.js";

export interface ConceptualChunksSearchParams extends ToolParams {
  text: string;
  source: string;
  debug?: boolean;
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
  description = `Search for specific information within a single known document. Uses hybrid search with concept and synonym expansion, filtered to one source.

USE THIS TOOL WHEN:
- You know which document contains the information you need
- Searching within a specific source identified from catalog_search results
- Focused analysis of one document's content
- Need to find specific passages or sections within a known document

DO NOT USE for:
- Finding which documents to search (use catalog_search first)
- Searching across multiple documents (use broad_chunks_search)
- Tracking a concept across your entire library (use concept_chunks)
- When you don't know the document source path

RETURNS: Top 5 chunks from the specified document, ranked by hybrid score with concept and WordNet expansion. Requires exact source path match.

NOTE: Source path must match exactly. First use catalog_search to identify the correct document path, then use that path in the 'source' parameter.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language, keywords, phrases, or technical terms to find within the document",
      },
      source: {
        type: "string",
        description: "REQUIRED: Full file path of the source document (e.g., '/home/user/Documents/ebooks/Philosophy/Book Title.pdf'). Use catalog_search first to find the exact path.",
      },
      debug: {
        type: "boolean",
        description: "Show debug information",
        default: false
      }
    },
    required: ["text", "source"],
  };

  async execute(params: ConceptualChunksSearchParams) {
    // Validate input
    try {
      this.validator.validateChunksSearch(params);
    } catch (error: any) {
      console.error(`❌ Validation failed: ${error.message}`);
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: error.code || 'VALIDATION_ERROR',
              message: error.message,
              field: error.field,
              context: error.context
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    // Resolve source path to catalog ID at the tool boundary
    const catalogOpt = await this.catalogRepo.findBySource(params.source);
    if (!isSome(catalogOpt)) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              type: 'not_found',
              message: `Document not found: ${params.source}`
            },
            timestamp: new Date().toISOString()
          })
        }],
        isError: true,
      };
    }
    
    // Delegate to service with catalog ID (normalized)
    const result = await this.chunkSearchService.searchByCatalogId({
      catalogId: catalogOpt.value.id,
      limit: 5,
      debug: params.debug || false
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
    // Use derived fields if available, fallback to cache resolution
    const sourceCache = CatalogSourceCache.getInstance();
    const conceptCache = ConceptIdCache.getInstance();
    // @ts-expect-error - Type narrowing limitation
    const formattedResults = result.value.map((r: Chunk) => {
      // Use derived concept_names if available, fallback to cache resolution
      let conceptNames: string[];
      if (r.conceptNames && r.conceptNames.length > 0 && r.conceptNames[0] !== '') {
        // Use pre-populated derived field (new schema)
        conceptNames = r.conceptNames;
      } else if (r.conceptIds) {
        // Fallback: resolve via cache (backward compatibility)
        conceptNames = conceptCache.getNames(r.conceptIds.map(id => String(id)));
      } else {
        conceptNames = [];
      }
      
      return {
        text: r.text,
        source: sourceCache.getSourceOrDefault(r.catalogId, params.source),
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



