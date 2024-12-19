import { db } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

type ListDatabasesParams = ToolParams;

export class ListDatabasesTool extends BaseTool<ListDatabasesParams> {
  name = "listDatabases";
  description = "List all available databases in the database";
  inputSchema = {
    type: "object" as const,
    properties: {},
  };

  async execute(_params: ListDatabasesParams) {
    try {
      const Databases = await db.admin().listDatabases();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              Databases.databases.map((c) => ({
                name: c.name,
                sizeOnDisk: c.sizeOnDisk,
                empty: c.empty,
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
