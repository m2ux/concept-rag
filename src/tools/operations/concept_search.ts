import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkRepository } from "../../domain/interfaces/repositories/chunk-repository.js";
import { ConceptRepository } from "../../domain/interfaces/repositories/concept-repository.js";

export interface ConceptSearchParams extends ToolParams {
  concept: string;
  limit?: number;
  source_filter?: string;
}

/**
 * Search for all chunks that reference a specific concept
 * Uses efficient vector search via repository pattern
 */
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  constructor(
    private chunkRepo: ChunkRepository,
    private conceptRepo: ConceptRepository
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
    try {
      const limit = params.limit || 10;
      const conceptLower = params.concept.toLowerCase().trim();
      
      // Get concept metadata using repository
      const conceptInfo = await this.conceptRepo.findByName(conceptLower);
      
      // Find chunks using efficient repository method (vector search)
      console.error(`🔍 Searching for concept: "${conceptLower}"`);
      
      let matchingChunks = await this.chunkRepo.findByConceptName(conceptLower, limit * 2);
      
      // Apply source filter if provided
      if (params.source_filter) {
        const sourceFilter = params.source_filter.toLowerCase();
        matchingChunks = matchingChunks.filter(chunk => 
          chunk.source.toLowerCase().includes(sourceFilter)
        );
      }
      
      // Sort by concept density
      matchingChunks.sort((a, b) => (b.conceptDensity || 0) - (a.conceptDensity || 0));
      
      // Limit results
      matchingChunks = matchingChunks.slice(0, limit);
      
      console.error(`✅ Found ${matchingChunks.length} matching chunks`);
      
      // Format results
      const results = matchingChunks.map((chunk) => {
        return {
          text: chunk.text,
          source: chunk.source,
          concept_density: (chunk.conceptDensity || 0).toFixed(3),
          concepts_in_chunk: chunk.concepts || [],
          categories: chunk.conceptCategories || [],
          relevance: (chunk.concepts || []).filter((c: string) => 
            c.toLowerCase() === conceptLower
          ).length
        };
      });
      
      // Build response with concept info
      const response: any = {
        concept: params.concept,
        total_chunks_found: matchingChunks.length,
        results: results
      };
      
      // Add concept metadata if available
      if (conceptInfo) {
        response.concept_metadata = {
          category: conceptInfo.category,
          weight: conceptInfo.weight,
          chunk_count: conceptInfo.chunkCount,
          sources_count: conceptInfo.sources.length
        };
        
        // Add related concepts if available
        if (conceptInfo.relatedConcepts && conceptInfo.relatedConcepts.length > 0) {
          response.related_concepts = conceptInfo.relatedConcepts.slice(0, 10);
        }
      }
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

