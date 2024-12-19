import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

interface UpdateOneParams extends ToolParams {
  database: string;
  collection: string;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
  [key: string]: unknown;
}

export class UpdateOneTool extends BaseTool<UpdateOneParams> {
  name = "updateOne";
  description = "Update a single document in a collection";
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
      update: {
        type: "object",
        description: "Update operations to apply",
      },
    },
    required: ["database","collection", "filter", "update"],
  };

  async execute(params: UpdateOneParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const filter = this.validateObject(params.filter, "Filter");
      const update = this.validateObject(params.update, "Update");
      const result = await client.db(database).collection(collection).updateOne(filter, update);

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
