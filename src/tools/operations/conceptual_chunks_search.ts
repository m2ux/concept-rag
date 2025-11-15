import { BaseTool, ToolParams } from "../base/tool.js";
import { ChunkSearchService } from "../../domain/services/index.js";

export interface ConceptualChunksSearchParams extends ToolParams {
  text: string;
  source: string;
  debug?: boolean;
}

/**
 * MCP tool for searching within a specific document.
 * Thin adapter that delegates to ChunkSearchService.
 */
export class ConceptualChunksSearchTool extends BaseTool<ConceptualChunksSearchParams> {
  constructor(
    private chunkSearchService: ChunkSearchService
  ) {
    super();
  }
  
  name = "chunks_search";
  description = `Search for specific information within a single known document. Uses hybrid search with concept and synonym expansion, filtered to one source.

USE THIS TOOL WHEN:
- You know which document contains the information you need
- Searching within a specific source identified from catalog_search results
- Focused analysis of one document's content
- Need to find specific passages or sections within a known document

DO NOT USE for:
- Finding which documents to search (use catalog_search first)
- Searching across multiple documents (use broad_chunks_search)
- Tracking a concept across your entire library (use concept_search)
- When you don't know the document source path

RETURNS: Top 5 chunks from the specified document, ranked by hybrid score with concept and WordNet expansion. Requires exact source path match.

NOTE: Source path must match exactly. First use catalog_search to identify the correct document path, then use that path in the 'source' parameter.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language, keywords, phrases, or technical terms to find within the document",
      },
      source: {
        type: "string",
        description: "REQUIRED: Full file path of the source document (e.g., '/home/user/Documents/ebooks/Philosophy/Book Title.pdf'). Use catalog_search first to find the exact path.",
      },
      debug: {
        type: "boolean",
        description: "Show debug information",
        default: false
      }
    },
    required: ["text", "source"],
  };

  async execute(params: ConceptualChunksSearchParams) {
    try {
      // Delegate to service
      const results = await this.chunkSearchService.searchInSource({
        text: params.text,
        source: params.source,
        limit: 5,
        debug: params.debug || false
      });
      
      // Format results for MCP response
      const formattedResults = results.map(r => ({
        text: r.text,
        source: r.source,
        concept_density: r.conceptDensity,
        concepts: r.concepts || [],
        categories: r.conceptCategories || []
      }));
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(formattedResults, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}



