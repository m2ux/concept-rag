import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr } from "../../domain/functional/index.js";
import { SearchResult } from "../../domain/models/index.js";

export interface ConceptualBroadChunksSearchParams extends ToolParams {
  text: string;
  limit?: number;
  debug?: boolean;
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

RETURNS: Top 20 chunks ranked by hybrid scoring (35% vector, 35% BM25, 15% concept, 15% WordNet). May include false positives based on keyword matches.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language questions, phrases, keywords, or technical terms. Can be multi-word queries.",
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, score breakdown)",
        default: false
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
    
    // Delegate to service (Result-based)
    const result = await this.chunkSearchService.searchBroad({
      text: params.text,
      limit: params.limit || 20,
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
    
    // Format results for MCP response, filtering out zero/negative scores
    // Note: Chunks use concept-aware scoring (35% vector, 35% BM25, 15% concept, 15% WordNet)
    // @ts-expect-error - Type narrowing limitation
    const formattedResults = result.value
      .filter((r: SearchResult) => r.hybridScore > 0)
      .map((r: SearchResult) => ({
        text: r.text,
        source: r.source,
        scores: {
          hybrid: r.hybridScore.toFixed(3),
          vector: r.vectorScore.toFixed(3),
          bm25: r.bm25Score.toFixed(3),
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
