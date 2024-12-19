import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

interface InsertOneParams extends ToolParams {
  database: string;
  collection: string;
  document: Record<string, unknown>;
  [key: string]: unknown;
}

export class InsertOneTool extends BaseTool<InsertOneParams> {
  name = "insertOne";
  description = "Insert a single document into a collection";
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
      document: {
        type: "object",
        description: "Document to insert",
      },
    },
    required: ["database","collection", "document"],
  };

  async execute(params: InsertOneParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const document = this.validateObject(params.document, "Document");
      const result = await client.db(database).collection(collection).insertOne(document);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                acknowledged: result.acknowledged,
                insertedId: result.insertedId,
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
