import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface CountParams extends ToolParams {
  database: string;
  collection: string;
  filter?: Record<string, unknown>;
}

export class CountTool extends BaseTool<CountParams> {
  name = "count";
  description = "Count documents in a collection using MongoDB query syntax";
  inputSchema = {
    type: "object" as const,
    properties: {
      database: {
        type: "string",
        description: "Name of the database to use",
      },
      collection: {
        type: "string",
        description: "Name of the collection to query",
      },
      filter: {
        type: "object",
        description: "MongoDB query filter",
        default: {},
      },
    },
    required: ["database","collection"],
  };

  async execute(params: CountParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const count = await client.db(database).collection(collection).countDocuments(params.filter || {});

      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ count }, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}