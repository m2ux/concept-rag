import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualChunksSearchParams extends ToolParams {
  text: string;
  source: string;
  debug?: boolean;
}

export class ConceptualChunksSearchTool extends BaseTool<ConceptualChunksSearchParams> {
  name = "chunks_search";
  description = "Search for specific information within a chosen document using conceptual search. Searches detailed chunks with concept and synonym expansion for better matches.";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - can use natural language, technical terms, or synonyms",
      },
      source: {
        type: "string",
        description: "Source document to filter the search (file path)",
      },
      debug: {
        type: "boolean",
        description: "Show debug information",
        default: false
      }
    },
    required: ["text", "source"],
  };

  private searchClient?: ConceptualSearchClient;

  async execute(params: ConceptualChunksSearchParams) {
    try {
      // Check if concept table is available
      if (!conceptTable) {
        // Fall back to basic search
        const { searchTable } = await import("../../lancedb/simple_client.js");
        const results = await searchTable(chunksTable, params.text, 5);
        
        // Filter by source
        const filtered = results.filter((r: any) => r.source === params.source);
        
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(filtered, null, 2) },
          ],
          isError: false,
        };
      }

      // Initialize search client if needed
      if (!this.searchClient) {
        this.searchClient = new ConceptualSearchClient(conceptTable);
      }

      // Search with conceptual expansion
      const allResults = await this.searchClient.search(
        chunksTable,
        params.text,
        20,  // Get more results before filtering
        params.debug || false
      );
      
      // Filter by source
      const filtered = allResults.filter(r => r.source === params.source).slice(0, 5);
      
      // Format results
      const formattedResults = filtered.map(r => ({
        text: r.text,
        source: r.source,
        scores: {
          hybrid: r._hybrid_score.toFixed(3),
          concept: r._concept_score.toFixed(3),
          wordnet: r._wordnet_score.toFixed(3)
        },
        matched_concepts: r.matched_concepts
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



