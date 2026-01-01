import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr } from "../../domain/functional/index.js";
import { SearchResult } from "../../domain/models/index.js";
import { Configuration } from "../../application/config/index.js";
import { filterByScoreGap } from "../../infrastructure/search/scoring-strategies.js";

export interface ConceptualCatalogSearchParams extends ToolParams {
  text: string;
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

RETURNS: Documents in the high-scoring cluster (adaptive count based on score gaps), with text previews, hybrid scores, matched concepts, and query expansion details.

Debug output can be enabled via DEBUG_SEARCH=true environment variable.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - document titles, author names, subject areas, or general topics. Title matches receive significant ranking boost.",
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
    
    // Delegate to service with sufficient limit for gap detection
    const debugSearch = Configuration.getInstance().logging.debugSearch;
    const result = await this.catalogSearchService.searchCatalog({
      text: params.text,
      limit: 30,  // Sufficient for gap detection while keeping performance
      debug: debugSearch
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
    
    // Filter by score > 0, then apply gap detection to find natural cluster
    // @ts-expect-error - Type narrowing limitation
    const positiveResults: SearchResult[] = result.value.filter((r: SearchResult) => r.hybridScore > 0);
    const clusteredResults = filterByScoreGap(positiveResults) as SearchResult[];
    
    // Format results for MCP response
    const formattedResults = clusteredResults.map((r) => ({
        source: r.source,
        summary: r.text,  // Full summary (not truncated)
        score: r.hybridScore.toFixed(3),  // Hybrid score always shown
        ...(debugSearch && {
          score_components: {  // Component breakdown only in debug mode
            vector: r.vectorScore.toFixed(3),
            bm25: r.bm25Score.toFixed(3),
            title: r.titleScore.toFixed(3),
            concept: r.conceptScore.toFixed(3),
            wordnet: r.wordnetScore.toFixed(3)
          }
        }),
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



