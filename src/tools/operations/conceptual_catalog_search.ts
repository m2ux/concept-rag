import { catalogTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualCatalogSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

export class ConceptualCatalogSearchTool extends BaseTool<ConceptualCatalogSearchParams> {
  name = "catalog_search";
  description = "Search for relevant documents using conceptual search (corpus concepts + WordNet + hybrid signals). Returns documents ranked by semantic relevance, keyword matching, title matching, concept matching, and synonym expansion.";
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

  async execute(params: ConceptualCatalogSearchParams) {
    try {
      // Check if concept table is available
      if (!conceptTable) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Conceptual search not available",
              message: "Concepts table not found. Please re-run seeding with concept extraction enabled.",
              fallback: "Use basic catalog_search instead"
            }, null, 2)
          }],
          isError: true
        };
      }

      // Initialize search client if needed
      if (!this.searchClient) {
        this.searchClient = new ConceptualSearchClient(conceptTable);
      }

      const results = await this.searchClient.search(
        catalogTable,
        params.text,
        5,
        params.debug || false
      );
      
      // Format results for better readability
      const formattedResults = results.map(r => ({
        source: r.source,
        text_preview: r.text.slice(0, 200) + '...',
        scores: {
          hybrid: r._hybrid_score.toFixed(3),
          vector: r._vector_score.toFixed(3),
          bm25: r._bm25_score.toFixed(3),
          title: r._title_score.toFixed(3),
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



