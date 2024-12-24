import { chunksVectorStore } from "../../lancedb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface BroadSearchParams extends ToolParams {
  text: string;
}

export class BroadSearchTool extends BaseTool<BroadSearchParams> {
  name = "global_chunks_search";
  description = "Global search for relevant document chunks in the vector store. Use with caution as it can return information from irrelevant sources";
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
      const retriever = chunksVectorStore.asRetriever();
      const results = await retriever.invoke(params.text);

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
