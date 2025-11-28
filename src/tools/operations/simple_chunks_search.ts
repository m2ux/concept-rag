import { chunksTable, searchTable } from "../../lancedb/simple_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";
import { InputValidator } from "../../domain/services/validation/index.js";

export interface ChunksSearchParams extends ToolParams {
  text: string;
  source?: string;
}

/**
 * @deprecated Use ConceptualChunksSearchTool instead, which uses normalized catalog IDs.
 * This tool uses legacy source path filtering after search results are returned.
 */
export class SimpleChunksSearchTool extends BaseTool<ChunksSearchParams> {
  private validator = new InputValidator();
  
  name = "chunks_search";
  description = "Search for relevant document chunks using fast local embeddings";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
        default: {},
      },
      source: {
        type: "string",
        description: "Source document to filter the search",
        default: {},
      },
    },
    required: ["text", "source"],
  };

  async execute(params: ChunksSearchParams) {
    try {
      // Validate input
      this.validator.validateChunksSearch({ 
        text: params.text, 
        source: params.source || '' 
      });
      
      const results = await searchTable(chunksTable, params.text, 10);

      // Filter results by source if provided
      if (params.source) {
        const filteredResults = results.filter((result: any) => 
          result.source && result.source.includes(params.source)
        );
        
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filteredResults, null, 2),
            },
          ],
          isError: false,
        };
      }

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

