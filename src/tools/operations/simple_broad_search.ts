import { chunksTable, searchTable } from "../../lancedb/simple_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";
import { InputValidator } from "../../domain/services/validation/index.js";

export interface BroadSearchParams extends ToolParams {
  text: string;
}

export class SimpleBroadSearchTool extends BaseTool<BroadSearchParams> {
  private validator = new InputValidator();
  
  name = "all_chunks_search";
  description = "Search for relevant document chunks across all documents using fast local embeddings";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
        default: {},
      }
    },
    required: ["text"],
  };

  async execute(params: BroadSearchParams) {
    try {
      // Validate input
      this.validator.validateSearchQuery({ text: params.text, limit: 10 });
      
      const results = await searchTable(chunksTable, params.text, 10);

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

