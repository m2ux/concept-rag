import { vectorStore } from "../../lancedb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface SearchParams extends ToolParams {
  text: string;
}

export class SearchTool extends BaseTool<SearchParams> {
  name = "search";
  description = "Search for relevant chunks in the vector store";
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

  async execute(params: SearchParams) {
    try {
      const retriever = vectorStore.asRetriever();
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
