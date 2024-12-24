import { chunksVectorStore } from "../../lancedb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface SearchParams extends ToolParams {
  text: string;
  source?: string;
}

export class SearchTool extends BaseTool<SearchParams> {
  name = "chunks_search";
  description = "Search for relevant document chunks in the vector store";
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
        description: "Optional source document to filter the search",
        default: {},
      },
    },
    required: ["text", "source"],
  };

  async execute(params: SearchParams) {
    try {
      const retriever = chunksVectorStore.asRetriever(); //TODO: we aren't actually filtering here by source but we should
      const results = await retriever.invoke(params.text, );

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
