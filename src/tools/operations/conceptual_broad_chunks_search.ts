import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualBroadChunksSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

export class ConceptualBroadChunksSearchTool extends BaseTool<ConceptualBroadChunksSearchParams> {
  name = "broad_chunks_search";
  description = `Search across ALL document chunks using hybrid search (vector similarity + BM25 keyword matching + concept scoring + WordNet expansion).

USE THIS TOOL WHEN:
- Searching for specific phrases, keywords, or technical terms across all documents
- Need comprehensive cross-document research on a topic
- Looking for textual content that may or may not be tagged as a concept
- Query contains multiple terms or is phrased as a natural language question
- Want to find content regardless of whether it was identified as a formal concept

DO NOT USE for:
- Finding documents by title or getting document overviews (use catalog_search instead)
- Searching within a single known document (use chunks_search instead)
- Finding semantically-tagged concept discussions (use concept_search for higher precision)

RETURNS: Top 10 chunks ranked by hybrid scoring. Includes vector, BM25, concept, and WordNet scores. May include false positives based on keyword matches.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - natural language questions, phrases, keywords, or technical terms. Can be multi-word queries.",
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


