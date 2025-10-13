import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualBroadChunksSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

export class ConceptualBroadChunksSearchTool extends BaseTool<ConceptualBroadChunksSearchParams> {
  name = "broad_chunks_search";
  description = "Search for specific information across ALL documents using conceptual search. Searches detailed chunks with concept and synonym expansion for comprehensive results across your entire corpus.";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - can use natural language, technical terms, or synonyms",
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, score breakdown)",
        default: false
      }
    },
    required: ["text"],
  };

  private searchClient?: ConceptualSearchClient;

  async execute(params: ConceptualBroadChunksSearchParams) {
    try {
      // Check if concept table is available
      if (!conceptTable) {
        // Fall back to basic search
        const { searchTable } = await import("../../lancedb/simple_client.js");
        const results = await searchTable(chunksTable, params.text, 10);
        
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(results, null, 2) },
          ],
          isError: false,
        };
      }

      // Initialize search client if needed
      if (!this.searchClient) {
        this.searchClient = new ConceptualSearchClient(conceptTable);
      }

      // Search with conceptual expansion across all chunks
      const results = await this.searchClient.search(
        chunksTable,
        params.text,
        10,  // Return top 10 chunks across all documents
        params.debug || false
      );
      
      // Format results
      const formattedResults = results.map(r => ({
        text: r.text,
        source: r.source,
        scores: {
          hybrid: r._hybrid_score.toFixed(3),
          vector: r._vector_score.toFixed(3),
          bm25: r._bm25_score.toFixed(3),
          concept: r._concept_score.toFixed(3),
          wordnet: r._wordnet_score.toFixed(3)
        },
        matched_concepts: r.matched_concepts,
        expanded_terms: r.expanded_terms
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


