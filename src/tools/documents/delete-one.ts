import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

interface DeleteOneParams extends ToolParams {
  database: string;
  collection: string;
  filter: Record<string, unknown>;
  [key: string]: unknown;
}

export class DeleteOneTool extends BaseTool<DeleteOneParams> {
  name = "deleteOne";
  description = "Delete a single document from a collection";
  inputSchema = {
    type: "object" as const,
    properties: {
      database: {
        type: "string",
        description: "Name of the database to use",
      },
      collection: {
        type: "string",
        description: "Name of the collection",
      },
      filter: {
        type: "object",
        description: "Filter to identify document",
      },
    },
    required: ["database","collection", "filter"],
  };

  async execute(params: DeleteOneParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const filter = this.validateObject(params.filter, "Filter");
      const result = await client.db(database).collection(collection).deleteOne(filter);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ deleted: result.deletedCount }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
