import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSourcesService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isErr } from "../../domain/functional/index.js";

export interface ConceptSourcesParams extends ToolParams {
  concept: string;
  include_metadata?: boolean;
}

/**
 * MCP tool for concept source attribution.
 * 
 * This tool finds all documents (sources) where a specific concept appears.
 * Use it to understand where a concept is discussed across your library
 * and to get source attribution for research or citation purposes.
 * 
 * Example: "test driven development" might appear in 3 books, so this tool
 * returns all 3 sources with their metadata.
 * 
 * Business logic is in ConceptSourcesService for testability and reusability.
 */
export class ConceptSourcesTool extends BaseTool<ConceptSourcesParams> {
  private validator = new InputValidator();
  
  constructor(
    private conceptSourcesService: ConceptSourcesService
  ) {
    super();
  }
  
  name = "concept_sources";
  description = `Find all documents (sources) where a specific concept appears. Returns source attribution for concepts across your library.

USE THIS TOOL WHEN:
- You need to know which documents discuss a specific concept
- Finding source attribution for research or citation purposes
- Understanding concept coverage across your document library
- Answering questions like "Which books mention X?" or "Where is Y discussed?"

DO NOT USE for:
- Finding specific text passages about a concept (use concept_search instead)
- General keyword search (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)

RETURNS: List of source documents with titles, summaries (optional), and concept metadata including related concepts and document categories. Shows the total count of sources where the concept appears.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        type: "string",
        description: "The concept to find sources for (e.g., 'test driven development', 'machine learning', 'dependency injection')",
      },
      include_metadata: {
        type: "boolean",
        description: "Include document metadata (summary, primary concepts, categories) from catalog. Default: true",
        default: true
      }
    },
    required: ["concept"],
  };

  async execute(params: ConceptSourcesParams) {
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
    
    console.error(`🔍 Finding sources for concept: "${params.concept}"`);
    
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
        error.type === 'concept_not_found' ? `Concept not found: "${error.concept}". Try a different concept name or check spelling.` :
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
    console.error(`✅ Found ${sourcesResult.sourceCount} source(s) for concept "${params.concept}"`);
    
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
      concept: result.concept,
      source_count: result.sourceCount,
      sources: formattedSources
    };
    
    // Add concept metadata if available
    if (result.conceptMetadata) {
      response.concept_metadata = {
        category: result.conceptMetadata.category,
        type: result.conceptMetadata.conceptType,
        weight: result.conceptMetadata.weight.toFixed(3),
        chunk_count: result.conceptMetadata.chunkCount
      };
      
      if (result.conceptMetadata.relatedConcepts?.length > 0) {
        response.related_concepts = result.conceptMetadata.relatedConcepts;
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

