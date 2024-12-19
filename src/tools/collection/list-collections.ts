import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ListCollectionsParams extends ToolParams {
  database: string;
}

export class ListCollectionsTool extends BaseTool<ListCollectionsParams> {
  name = "listCollections";
  description = "List all available collections in the database";
  inputSchema = {
    type: "object" as const,
    properties: {
      database: {
        type: "string",
        description: "Name of the database to use to list collections",
      },
      required: ["database"],
    },
  };

  async execute(_params: ListCollectionsParams) {
    try {
      const collections = await client.db(_params.database).listCollections().toArray();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              collections.map((c) => ({
                name: c.name,
                type: c.type,
              })),
              null,
              2
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
