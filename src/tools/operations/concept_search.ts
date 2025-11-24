import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isSome, isOk, isErr } from "../../domain/functional/index.js";

export interface ConceptSearchParams extends ToolParams {
  concept: string;
  limit?: number;
  source_filter?: string;
}

/**
 * MCP tool for concept search.
 * 
 * This is a thin adapter that:
 * - Validates MCP parameters
 * - Delegates to ConceptSearchService for business logic
 * - Formats results as MCP response
 * 
 * Business logic is in ConceptSearchService for testability and reusability.
 */
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private conceptSearchService: ConceptSearchService
  ) {
    super();
  }
  
  name = "concept_search";
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
    this.validator.validateConceptSearch(params);
    
    const limit = params.limit || 10;
    
    console.error(`🔍 Searching for concept: "${params.concept}"`);
    
    // Delegate to service for business logic (Result-based)
    const result = await this.conceptSearchService.searchConcept({
      concept: params.concept,
      limit: limit,
      sourceFilter: params.source_filter,
      sortBy: 'density'
    });
    
    // Handle Result type
    if (isErr(result)) {
      console.error(`❌ Search failed: ${result.error.message}`);
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${result.error.message}\nType: ${result.error.type}`
        }]
      };
    }
    
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
    // Format chunk results
    const formattedChunks = result.chunks.map((chunk: any) => ({
          text: chunk.text,
          source: chunk.source,
          concept_density: (chunk.conceptDensity || 0).toFixed(3),
          concepts_in_chunk: chunk.concepts || [],
          categories: chunk.conceptCategories || [],
      relevance: this.conceptSearchService.calculateRelevance(chunk, result.concept)
    }));
      
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
        category: metadata.category,
        weight: metadata.weight,
        chunk_count: metadata.chunkCount,
        sources_count: metadata.sources.length
        };
        
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

