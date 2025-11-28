import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isSome, isErr } from "../../domain/functional/index.js";
import { ConceptIdCache } from "../../infrastructure/cache/concept-id-cache.js";

export interface ConceptSearchParams extends ToolParams {
  concept: string;
  limit?: number;
  source_filter?: string;
}

/**
 * MCP tool for finding chunks by concept.
 * 
 * This is a thin adapter that:
 * - Validates MCP parameters
 * - Delegates to ConceptSearchService for business logic
 * - Formats results as MCP response
 * 
 * Business logic is in ConceptSearchService for testability and reusability.
 */
export class ConceptChunksTool extends BaseTool<ConceptSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private conceptSearchService: ConceptSearchService
  ) {
    super();
  }
  
  name = "concept_chunks";
  description = `Find all chunks tagged with a specific concept from the concept-enriched index. 
  
USE THIS TOOL WHEN:
- Searching for a conceptual topic (e.g., "innovation", "leadership", "strategic thinking")
- You want semantically-tagged, high-precision results about a concept
- Tracking where and how a concept is discussed across your library
- Research queries focused on understanding a specific concept

DO NOT USE for:
- Keyword searches or exact phrase matching (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)
- Searching within a known document (use chunks_search instead)

RETURNS: Concept-tagged chunks with concept_density scores, related concepts, and semantic categories. Results are from the concept-enriched index and have been semantically validated during extraction.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        type: "string",
        description: "The concept to search for - use conceptual terms not exact phrases (e.g., 'innovation' not 'innovation process', 'leadership' not 'leadership in organizations')",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10
      },
      source_filter: {
        type: "string",
        description: "Optional: Filter results to documents containing this text in their source path",
      }
    },
    required: ["concept"],
  };

  async execute(params: ConceptSearchParams) {
    // Validate input
    try {
      this.validator.validateConceptSearch(params);
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
    
    const limit = params.limit || 10;
    
    console.error(`🔍 Searching for concept: "${params.concept}"`);
    
    // Delegate to service for business logic
    const result = await this.conceptSearchService.searchConcept({
      concept: params.concept,
      limit: limit,
      sourceFilter: params.source_filter,
      sortBy: 'density'
    });
    
    // Handle Result type
    if (isErr(result)) {
      const error = result.error;
      const errorMessage = 
        error.type === 'validation' ? error.message :
        error.type === 'database' ? error.message :
        error.type === 'concept_not_found' ? `Concept not found: ${error.concept}` :
        error.type === 'unknown' ? error.message :
        'An unknown error occurred';
      
      console.error(`❌ Search failed: ${errorMessage}`);
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'SEARCH_ERROR',
              message: errorMessage,
              type: error.type
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    // @ts-expect-error - Type narrowing limitation
    const searchResult = result.value;
    console.error(`✅ Found ${searchResult.chunks.length} matching chunks`);
    
    // Format as MCP response (pure presentation logic)
    return this.formatMCPResponse(searchResult);
  }
  
  /**
   * Format service result as MCP response.
   * Pure presentation logic - converts domain model to MCP JSON format.
   */
  private formatMCPResponse(result: any) {
    // Format chunk results - use derived concept_names if available, fallback to cache
    const conceptCache = ConceptIdCache.getInstance();
    const formattedChunks = result.chunks.map((chunk: any) => {
      // Use derived concept_names if available, fallback to cache resolution
      let conceptNames: string[];
      if (chunk.conceptNames && chunk.conceptNames.length > 0 && chunk.conceptNames[0] !== '') {
        // Use pre-populated derived field (new schema)
        conceptNames = chunk.conceptNames;
      } else if (chunk.conceptIds) {
        // Fallback: resolve via cache (backward compatibility)
        conceptNames = conceptCache.getNames(chunk.conceptIds.map((id: number) => String(id)));
      } else {
        conceptNames = [];
      }
      
      return {
        text: chunk.text,
        source: chunk.source,
        concept_density: (chunk.conceptDensity || 0).toFixed(3),
        concepts_in_chunk: conceptNames,
        categories: chunk.conceptCategories || [],
        relevance: this.conceptSearchService.calculateRelevance(chunk, result.concept)
      };
    });
      
    // Build response object
      const response: any = {
      concept: result.concept,
      total_chunks_found: result.totalFound,
      results: formattedChunks
      };
      
      // Add concept metadata if available
    if (isSome(result.conceptMetadata)) {
        const metadata = result.conceptMetadata.value;
        response.concept_metadata = {
        weight: metadata.weight,
        sources_count: metadata.catalogIds?.length || 0
        };
        
        // Add synonyms and related terms from concept metadata
        if (metadata.synonyms?.length) {
          response.synonyms = metadata.synonyms;
        }
        if (metadata.broaderTerms?.length) {
          response.broader_terms = metadata.broaderTerms;
        }
        if (metadata.narrowerTerms?.length) {
          response.narrower_terms = metadata.narrowerTerms;
        }
        
      // Add related concepts
      if (result.relatedConcepts.length > 0) {
        response.related_concepts = result.relatedConcepts;
        }
      }
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
        isError: false,
      };
  }
}

