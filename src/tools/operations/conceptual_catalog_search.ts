import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogSearchService } from "../../domain/services/index.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { isOk, isErr } from "../../domain/functional/index.js";

export interface ConceptualCatalogSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

/**
 * MCP tool for catalog search.
 * Thin adapter that delegates to CatalogSearchService.
 */
export class ConceptualCatalogSearchTool extends BaseTool<ConceptualCatalogSearchParams> {
  private validator = new InputValidator();
  
  constructor(
    private catalogSearchService: CatalogSearchService
  ) {
    super();
  }
  
  name = "catalog_search";
  description = `Search document summaries and metadata to discover relevant documents. Uses title matching, concept matching, summary analysis, and semantic similarity.

USE THIS TOOL WHEN:
- Discovering what documents are available in the library ("What documents do I have?")
- Finding documents about a general topic or domain
- Looking for documents by title, author, or subject area
- Need document-level results rather than specific chunks
- Starting exploratory research to identify relevant sources

DO NOT USE for:
- Finding specific information within documents (use broad_chunks_search or chunks_search)
- Tracking specific concept usage across chunks (use concept_search)
- Deep content analysis (use broad_chunks_search)

RETURNS: Top 5 documents with text previews, hybrid scores (including strong title matching bonus), matched concepts, and query expansion details.`;
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search query - document titles, author names, subject areas, or general topics. Title matches receive significant ranking boost.",
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, score breakdown)",
        default: false
      }
    },
    required: ["text"],
  };

  async execute(params: ConceptualCatalogSearchParams) {
    // Validate input
    this.validator.validateCatalogSearch(params);
    
    // Delegate to service (Result-based)
    const result = await this.catalogSearchService.searchCatalog({
      text: params.text,
      limit: 5,
      debug: params.debug || false
    });
    
    // Handle Result type
    if (isErr(result)) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${result.error.message}\nType: ${result.error.type}`
        }],
        isError: true,
      };
    }
    
    const results = result.value;
    
    // Format results for MCP response
    const formattedResults = results.map(r => ({
      source: r.source,
      text_preview: r.text.slice(0, 200) + '...',
      scores: {
        hybrid: r.hybridScore.toFixed(3),
        vector: r.vectorScore.toFixed(3),
        bm25: r.bm25Score.toFixed(3),
        title: r.titleScore.toFixed(3),
        concept: r.conceptScore.toFixed(3),
        wordnet: r.wordnetScore.toFixed(3)
      },
      matched_concepts: r.matchedConcepts,
      expanded_terms: r.expandedTerms
    }));
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(formattedResults, null, 2) },
      ],
      isError: false,
    };
  }
}



