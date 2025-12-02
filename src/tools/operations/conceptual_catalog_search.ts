import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr } from "../../domain/functional/index.js";
import { SearchResult } from "../../domain/models/index.js";

export interface ConceptualCatalogSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

/**
 * MCP tool for catalog search.
 * Thin adapter that delegates to CatalogSearchService.
 */
export class ConceptualCatalogSearchTool extends BaseTool<ConceptualCatalogSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private catalogSearchService: CatalogSearchService
  ) {
    super();
  }
  
  name = "catalog_search";
  description = `Search document summaries and metadata to discover relevant documents. Uses title matching, concept matching, summary analysis, and semantic similarity.

USE THIS TOOL WHEN:
- Finding documents about a specific topic or subject area
- Looking for documents by title, author, or keywords
- Need document-level results rather than specific chunks
- Starting exploratory research to identify relevant sources

DO NOT USE for:
- Listing all documents (use list_categories then category_search instead)
- Finding specific information within documents (use broad_chunks_search or chunks_search)
- Tracking specific concept usage across chunks (use concept_chunks)

RETURNS: Top 10 documents with text previews, hybrid scores (including strong title matching bonus), matched concepts, and query expansion details.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - document titles, author names, subject areas, or general topics. Title matches receive significant ranking boost.",
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, score breakdown)",
        default: false
      }
    },
    required: ["text"],
  };

  async execute(params: ConceptualCatalogSearchParams) {
    // Validate input
    try {
      this.validator.validateCatalogSearch(params);
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
    
    // Delegate to service (Result-based)
    const result = await this.catalogSearchService.searchCatalog({
      text: params.text,
      limit: 10,
      debug: params.debug || false
    });
    
    // Handle Result type
    if (isErr(result)) {
      const error = result.error;
      const errorMessage = 
        error.type === 'validation' ? error.message :
        error.type === 'database' ? error.message :
        error.type === 'empty_results' ? `No results found for query: ${error.query}` :
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
    
    // Format results for MCP response, filtering out zero/negative scores
    // @ts-expect-error - Type narrowing limitation
    const formattedResults = result.value
      .filter((r: SearchResult) => r.hybridScore > 0)
      .map((r: SearchResult) => ({
        source: r.source,
        summary: r.text,  // Full summary (not truncated)
        scores: {
          hybrid: r.hybridScore.toFixed(3),
          vector: r.vectorScore.toFixed(3),
          bm25: r.bm25Score.toFixed(3),
          title: r.titleScore.toFixed(3),
          concept: r.conceptScore.toFixed(3),
          wordnet: r.wordnetScore.toFixed(3)
        },
        expanded_terms: r.expandedTerms
      }));
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(formattedResults, null, 2) },
      ],
      isError: false,
    };
  }
}



