import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSourcesService } from "../../domain/services/index.js";
import { isErr } from "../../domain/functional/index.js";

export interface ConceptSourcesParams extends ToolParams {
  concept: string | string[];
  include_metadata?: boolean;
}

/**
 * MCP tool for getting sources organized by concept (per-concept arrays).
 * 
 * This tool accepts one or more concepts and returns an array where each
 * position corresponds to an input concept, containing that concept's sources.
 * 
 * **Example:**
 * Input: ["test driven development", "dependency injection"]
 * Output: {
 *   concepts_searched: ["test driven development", "dependency injection"],
 *   results: [
 *     [{ title: "Book A", ... }, { title: "Book B", ... }],  // sources for concept[0]
 *     [{ title: "Book C", ... }, { title: "Book A", ... }]   // sources for concept[1]
 *   ]
 * }
 * 
 * Position in results array corresponds to position in concepts_searched array.
 * Each concept may have 0 or more sources.
 * 
 * Business logic is in ConceptSourcesService for testability and reusability.
 */
export class ConceptSourcesTool extends BaseTool<ConceptSourcesParams> {
  
  constructor(
    private conceptSourcesService: ConceptSourcesService
  ) {
    super();
  }
  
  name = "concept_sources";
  description = `Get sources for each concept separately, returning an array where each position corresponds to an input concept.

USE THIS TOOL WHEN:
- You need separate source lists for each concept (not merged)
- Comparing which sources cover which specific concepts
- Building per-concept bibliographies or citations
- Need to know exactly which sources discuss each individual concept

DO NOT USE for:
- Getting a merged/union list of all sources (use source_concepts instead)
- Finding specific text passages (use concept_chunks instead)
- Finding documents by title (use catalog_search instead)

RETURNS: Array where results[i] contains sources for concepts_searched[i]. Each concept may have 0 or more sources. Sources include title, author, year, and source_path.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } }
        ],
        description: "The concept(s) to find sources for. Can be a single concept string or an array of concepts. Returns separate source arrays for each concept.",
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
    // Normalize concept to array
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
    
    console.error(`🔍 Getting sources for concept(s): "${concepts.join('", "')}"`);
    
    const includeMetadata = params.include_metadata ?? true;
    
    // Get sources for each concept separately
    const results: any[][] = [];
    
    for (const conceptName of concepts) {
      // Use the service to get sources for this single concept
      const result = await this.conceptSourcesService.getConceptSources({
        concept: conceptName,
        includeMetadata
      });
      
      if (isErr(result)) {
        // Concept not found - add empty array for this position
        console.error(`⚠️  Concept "${conceptName}" not found, adding empty array`);
        results.push([]);
      } else {
        // @ts-expect-error - Type narrowing limitation
        const sourcesResult = result.value;
        
        // Format sources for output
        const formattedSources = sourcesResult.sources.map((source: any) => {
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
        
        results.push(formattedSources);
      }
    }
    
    console.error(`✅ Retrieved sources for ${concepts.length} concept(s)`);
    
    // Build response
    const response = {
      concepts_searched: concepts,
      results
    };
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(response, null, 2) },
      ],
      isError: false,
    };
  }
}
