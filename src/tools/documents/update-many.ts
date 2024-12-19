import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

interface UpdateManyParams extends ToolParams {
  database: string;
  collection: string;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
  [key: string]: unknown;
}

export class UpdateManyTool extends BaseTool<UpdateManyParams> {
  name = "updateMany";
  description = "Update multiple documents in a collection";
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
        description: "Filter to identify documents",
      },
      update: {
        type: "object",
        description: "Update operations to apply",
      },
    },
    required: ["database","collection", "filter", "update"],
  };

  async execute(params: UpdateManyParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const filter = this.validateObject(params.filter, "Filter");
      const update = this.validateObject(params.update, "Update");
      const result = await client.db(database).collection(collection).updateMany(filter, update);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                matched: result.matchedCount,
                modified: result.modifiedCount,
                upsertedId: result.upsertedId,
              },
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
