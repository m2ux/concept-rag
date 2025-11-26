import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSourcesService } from "../../domain/services/index.js";
import { isErr } from "../../domain/functional/index.js";

export interface SourceConceptsParams extends ToolParams {
  concept: string | string[];
  include_metadata?: boolean;
}

/**
 * MCP tool for concept source attribution (union/superset).
 * 
 * This tool finds all documents (sources) where one or more concepts appear.
 * Use it to understand where concepts are discussed across your library
 * and to get source attribution for research or citation purposes.
 * 
 * **Single concept example:**
 * Input: "test driven development"
 * Returns: All sources containing that concept
 * 
 * **Multiple concepts example:**
 * Input: ["test driven development", "dependency injection"]
 * Returns: Union of all sources containing ANY of the concepts, with
 * `concept_indices` showing which input concepts each source matches.
 * 
 * Results are sorted by number of matching concepts (most matches first).
 * 
 * Business logic is in ConceptSourcesService for testability and reusability.
 */
export class SourceConceptsTool extends BaseTool<SourceConceptsParams> {
  
  constructor(
    private conceptSourcesService: ConceptSourcesService
  ) {
    super();
  }
  
  name = "source_concepts";
  description = `Find all documents (sources) where a specific concept appears. Returns source attribution for concepts across your library.

USE THIS TOOL WHEN:
- You need to know which documents discuss a specific concept
- Finding source attribution for research or citation purposes
- Understanding concept coverage across your document library
- Answering questions like "Which books mention X?" or "Where is Y discussed?"
- Finding documents that cover MULTIPLE concepts (pass an array)

DO NOT USE for:
- Finding specific text passages about a concept (use concept_search instead)
- General keyword search (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)

RETURNS: List of source documents with titles, summaries (optional), and concept metadata including related concepts and document categories. Shows the total count of sources where the concept appears.

When multiple concepts are provided, returns the union of all sources. Each source includes a \`concept_indices\` array indicating which input concepts (by index) that source matches. Sources matching more concepts are sorted first.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } }
        ],
        description: "The concept(s) to find sources for. Can be a single concept string or an array of concepts. When multiple concepts are provided, returns the union of all sources.",
      },
      include_metadata: {
        type: "boolean",
        description: "Include document metadata (summary, primary concepts, categories) from catalog. Default: true",
        default: true
      }
    },
    required: ["concept"],
  };

  async execute(params: SourceConceptsParams) {
    // Normalize concept to array for logging
    const concepts = Array.isArray(params.concept) ? params.concept : [params.concept];
    
    // Basic validation - at least one concept required
    if (concepts.length === 0 || concepts.every(c => !c || c.trim() === '')) {
      console.error(`❌ Validation failed: No concepts provided`);
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'At least one concept is required',
              field: 'concept'
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    console.error(`🔍 Finding sources for concept(s): "${concepts.join('", "')}"`);
    
    // Delegate to service for business logic
    const result = await this.conceptSourcesService.getConceptSources({
      concept: params.concept,
      includeMetadata: params.include_metadata ?? true
    });
    
    // Handle Result type
    if (isErr(result)) {
      const error = result.error;
      const errorMessage = 
        error.type === 'validation' ? error.message :
        error.type === 'database' ? error.message :
        error.type === 'concept_not_found' ? `No concepts found: "${error.concept}". Try different concept names or check spelling.` :
        error.type === 'unknown' ? error.message :
        'An unknown error occurred';
      
      console.error(`❌ Source lookup failed: ${errorMessage}`);
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: error.type === 'concept_not_found' ? 'CONCEPT_NOT_FOUND' : 'LOOKUP_ERROR',
              message: errorMessage,
              type: error.type
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    // @ts-expect-error - Type narrowing limitation
    const sourcesResult = result.value;
    console.error(`✅ Found ${sourcesResult.sourceCount} unique source(s) for ${sourcesResult.foundConcepts.length} concept(s)`);
    
    // Format as MCP response
    return this.formatMCPResponse(sourcesResult);
  }
  
  /**
   * Format service result as MCP response.
   * Pure presentation logic - converts domain model to MCP JSON format.
   */
  private formatMCPResponse(result: any) {
    // Format sources for output
    const formattedSources = result.sources.map((source: any) => {
      const formatted: any = {
        title: source.title
      };
      
      if (source.author) {
        formatted.author = source.author;
      }
      
      if (source.year) {
        formatted.year = source.year;
      }
      
      // Show concept indices for attribution (references concepts_searched array)
      if (source.conceptIndices?.length > 0) {
        formatted.concept_indices = source.conceptIndices;
      }
      
      formatted.source_path = source.source;
      
      if (source.summary) {
        formatted.summary = source.summary;
      }
      
      if (source.primaryConcepts?.length > 0) {
        formatted.primary_concepts = source.primaryConcepts;
      }
      
      if (source.categories?.length > 0) {
        formatted.categories = source.categories;
      }
      
      return formatted;
    });
    
    // Build response object
    const response: any = {
      concepts_searched: result.concepts,
      concepts_found: result.foundConcepts,
      source_count: result.sourceCount,
      sources: formattedSources
    };
    
    // Include not found concepts if any
    if (result.notFoundConcepts?.length > 0) {
      response.concepts_not_found = result.notFoundConcepts;
    }
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(response, null, 2) },
      ],
      isError: false,
    };
  }
}
