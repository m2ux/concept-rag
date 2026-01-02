import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr } from "../../domain/functional/index.js";
import { SearchResult } from "../../domain/models/index.js";
import { Configuration } from "../../application/config/index.js";
import { filterByScoreGap } from "../../infrastructure/search/scoring-strategies.js";

export interface ConceptualBroadChunksSearchParams extends ToolParams {
  text: string;
  limit?: number;
}

/**
 * MCP tool for broad chunk search across all documents.
 * Thin adapter that delegates to ChunkSearchService.
 */
export class ConceptualBroadChunksSearchTool extends BaseTool<ConceptualBroadChunksSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private chunkSearchService: ChunkSearchService
  ) {
    super();
  }
  
  name = "broad_chunks_search";
  description = `Search across ALL document chunks using hybrid search (vector similarity + BM25 keyword matching + concept matching + WordNet expansion).

USE THIS TOOL WHEN:
- Searching for specific phrases, keywords, or technical terms across all documents
- Need comprehensive cross-document research on a topic
- Looking for textual content that may or may not be tagged as a concept
- Query contains multiple terms or is phrased as a natural language question
- Want to find content regardless of whether it was identified as a formal concept

DO NOT USE for:
- Finding documents by title or getting document overviews (use catalog_search instead)
- Searching within a single known document (use chunks_search instead)
- Finding semantically-tagged concept discussions (use concept_search)

RETURNS: Chunks in the high-scoring cluster (adaptive count based on score gaps), ranked by hybrid scoring (35% vector, 35% BM25, 15% concept, 15% WordNet). May include false positives based on keyword matches.

Debug output can be enabled via DEBUG_SEARCH=true environment variable.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language questions, phrases, keywords, or technical terms. Can be multi-word queries.",
      }
    },
    required: ["text"],
  };

  async execute(params: ConceptualBroadChunksSearchParams) {
    // Validate input
    try {
      this.validator.validateSearchQuery(params);
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
    const result = await this.chunkSearchService.searchBroad({
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
    
    // Filter by score > 0, then apply gap detection to find natural cluster
    // Note: Chunks use concept-aware scoring (35% vector, 35% BM25, 15% concept, 15% WordNet)
    // @ts-expect-error - Type narrowing limitation
    const positiveResults: SearchResult[] = result.value.filter((r: SearchResult) => r.hybridScore > 0);
    const clusteredResults = filterByScoreGap(positiveResults) as SearchResult[];
    
    // Format results for MCP response
    const formattedResults = clusteredResults.map((r) => {
      // Extract concept names
      const conceptNames = (r.conceptNames && r.conceptNames.length > 0 && r.conceptNames[0] !== '')
        ? r.conceptNames
        : [];
      
      return {
        catalog_id: r.catalogId,
        title: r.catalogTitle || 'Untitled',
        text: r.text,
        page_number: r.pageNumber,
        concepts: conceptNames,
        score: r.hybridScore.toFixed(3),  // Hybrid score always shown
        ...(debugSearch && {
          score_components: {  // Component breakdown only in debug mode
            vector: r.vectorScore.toFixed(3),
            bm25: r.bm25Score.toFixed(3),
            concept: r.conceptScore.toFixed(3),
            wordnet: r.wordnetScore.toFixed(3)
          }
        }),
        expanded_terms: r.expandedTerms
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


