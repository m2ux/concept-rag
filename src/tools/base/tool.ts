import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ConceptRAGError } from "../../domain/exceptions/index.js";

export interface ToolResponse {
  content: {
    type: "text";
    text: string;
  }[];
  isError: boolean;
  _meta?: Record<string, unknown>;
}

export type ToolParams = {
  [key: string]: unknown;
};

export abstract class BaseTool<T extends ToolParams = ToolParams> {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };

  abstract execute(params: T): Promise<ToolResponse>;

  protected validateDatabase(database: unknown): string {
    if (typeof database !== "string") {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Database name must be a string, got ${typeof database}`
      );
    }
    return database;
  }

  protected validateCollection(collection: unknown): string {
    if (typeof collection !== "string") {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Collection name must be a string, got ${typeof collection}`
      );
    }
    return collection;
  }

  protected validateObject(
    value: unknown,
    name: string
  ): Record<string, unknown> {
    if (!value || typeof value !== "object") {
      throw new McpError(ErrorCode.InvalidRequest, `${name} must be an object`);
    }
    return value as Record<string, unknown>;
  }

  /**
   * Handle errors with structured error formatting.
   * Formats ConceptRAGError instances with their full context.
   */
  protected handleError(error: unknown): ToolResponse {
    if (error instanceof ConceptRAGError) {
      // Format structured error with full context
      const errorInfo = {
        error: {
          code: error.code,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp.toISOString(),
          ...(error.cause ? { cause: error.cause.message } : {})
        }
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(errorInfo, null, 2),
          },
        ],
        isError: true,
        _meta: {
          errorCode: error.code,
          errorName: error.name
        }
      };
    }
    
    // For non-ConceptRAGError errors, use simple formatting
    return {
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
}
