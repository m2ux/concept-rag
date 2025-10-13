import { catalogTable, hybridSearchTable } from "../../lancedb/hybrid_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface CatalogSearchParams extends ToolParams {
  text: string;
}

export class HybridCatalogSearchTool extends BaseTool<CatalogSearchParams> {
  name = "catalog_search";
  description = "Search for relevant documents in the catalog using hybrid search (semantic + keyword matching)";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
        default: {},
      },
    },
    required: ["text"],
  };

  async execute(params: CatalogSearchParams) {
    try {
      const results = await hybridSearchTable(catalogTable, params.text, 5);
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}




