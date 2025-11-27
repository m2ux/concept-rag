import { BaseTool, ToolParams } from "../base/tool.js";
import { FuzzyConceptSearchService, FuzzyConceptSearchResult } from "../../domain/services/fuzzy-concept-search-service.js";
import { isErr } from "../../domain/functional/index.js";

export interface ConceptSearchParams extends ToolParams {
  text: string;
  limit?: number;
  debug?: boolean;
}

/**
 * MCP tool for fuzzy concept search.
 * 
 * Searches concept summaries using hybrid search (vector + BM25 + title matching),
 * similar to how catalog_search searches document summaries.
 * 
 * Use this to find concepts by description or meaning, not just exact name match.
 */
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  constructor(
    private fuzzyConceptSearchService: FuzzyConceptSearchService
  ) {
    super();
  }
  
  name = "concept_search";
  description = `Search for concepts by their summary/description using semantic similarity.

USE THIS TOOL WHEN:
- Looking for concepts by description or meaning (not exact name)
- Finding concepts related to a topic or theme
- Discovering what concepts exist in your library about a subject
- Fuzzy/semantic search over concept definitions

DO NOT USE for:
- Finding chunks tagged with a specific concept (use concept_chunks instead)
- Finding documents by title (use catalog_search instead)
- Exact concept name lookup (use source_concepts or concept_sources)

RETURNS: Top 10 concepts with summaries, document/chunk counts, related concepts, and hybrid scores.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - topic, description, or keywords to find matching concepts",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, score breakdown)",
        default: false
      }
    },
    required: ["text"],
  };

  async execute(params: ConceptSearchParams) {
    // Validate input
    if (!params.text || params.text.trim() === '') {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Search query text is required',
              field: 'text'
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    const limit = params.limit || 10;
    
    console.error(`🔍 Searching concepts for: "${params.text}"`);
    
    // Delegate to service
    const result = await this.fuzzyConceptSearchService.searchConcepts({
      text: params.text,
      limit: limit,
      debug: params.debug || false
    });
    
    // Handle Result type
    if (isErr(result)) {
      const error = result.error;
      const errorMessage = 
        error.type === 'validation' ? error.message :
        error.type === 'database' ? error.message :
        error.type === 'empty_results' ? `No concepts found for query: ${error.query}` :
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
    // @ts-expect-error - Type narrowing limitation
    const formattedResults = result.value.map((r: FuzzyConceptSearchResult) => ({
      concept: r.concept,
      summary: r.summary,
      document_count: r.documentCount,
      chunk_count: r.chunkCount,
      related_concepts: r.relatedConcepts.slice(0, 5),
      synonyms: r.synonyms.slice(0, 5),
      weight: r.weight.toFixed(3),
      scores: {
        hybrid: r.hybridScore.toFixed(3),
        vector: r.vectorScore.toFixed(3),
        bm25: r.bm25Score.toFixed(3),
        title: r.titleScore.toFixed(3)
      }
    }));
    
    console.error(`✅ Found ${formattedResults.length} matching concepts`);
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(formattedResults, null, 2) },
      ],
      isError: false,
    };
  }
}

