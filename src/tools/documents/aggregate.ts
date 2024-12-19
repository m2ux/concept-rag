import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { client } from "../../mongodb/client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface AggregateParams extends ToolParams {
  database: string;
  collection: string;
  pipeline: string;
}

export class AggregateTool extends BaseTool<AggregateParams> {
  name = "aggregate";
  description = "Execute a MongoDB aggregation pipeline";
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
      pipeline: {
        type: "string",
        description: "Aggregation pipeline stages as an array of JSON objects",
        default: {},
      },
    },
    required: ["database","collection", "pipeline"],
  };

  protected parsePipeline(pipeline: string): Array<unknown> {
    try {
      const parsedPipeline = JSON.parse(pipeline);
      if (!Array.isArray(parsedPipeline)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Parsed pipeline must be an array, got ${typeof parsedPipeline}`
        );
      }
      return parsedPipeline;
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to parse pipeline: ${error.message}`
      );
    }
  }

  async execute(params: AggregateParams) {
    try {
      const database = this.validateDatabase(params.database);
      const collection = this.validateCollection(params.collection);
      const pipeline = this.parsePipeline(params.pipeline);
      const results = await client
        .db(database)
        .collection(collection)
        .aggregate(pipeline).toArray();

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
