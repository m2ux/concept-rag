import { db } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

interface DropIndexParams extends ToolParams {
  collection: string;
  indexName: string;
  [key: string]: unknown;
}

export class DropIndexTool extends BaseTool<DropIndexParams> {
  name = "dropIndex";
  description = "Drop an index from a collection";
  inputSchema = {
    type: "object" as const,
    properties: {
      collection: {
        type: "string",
        description: "Name of the collection",
      },
      indexName: {
        type: "string",
        description: "Name of the index to drop",
      },
    },
    required: ["collection", "indexName"],
  };

  async execute(params: DropIndexParams) {
    try {
      const collection = this.validateCollection(params.collection);
      if (typeof params.indexName !== "string") {
        return this.handleError(new Error("Index name must be a string"));
      }

      const result = await db
        .collection(collection)
        .dropIndex(params.indexName);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
