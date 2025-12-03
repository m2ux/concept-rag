import { BaseTool } from "./base/tool.js";
import { SimpleBroadSearchTool } from "./operations/simple_broad_search.js";
import { SimpleCatalogSearchTool } from "./operations/simple_catalog_search.js";
import { SimpleChunksSearchTool } from "./operations/simple_chunks_search.js";
import { McpError, ErrorCode, Tool } from "@modelcontextprotocol/sdk/types.js";

export class SimpleToolRegistry {
  private tools: Map<string, BaseTool<any>> = new Map();

  constructor() {
    this.registerTool(new SimpleChunksSearchTool());
    this.registerTool(new SimpleCatalogSearchTool());
    this.registerTool(new SimpleBroadSearchTool());
  }

  registerTool(tool: BaseTool<any>) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool<any> | undefined {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return tool;
  }

  getAllTools(): BaseTool<any>[] {
    return Array.from(this.tools.values());
  }

  getToolSchemas(): Tool[] {
    return this.getAllTools().map((tool) => {
      const inputSchema = tool.inputSchema as any;
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: "object",
          properties: inputSchema.properties || {},
          ...(inputSchema.required && { required: inputSchema.required }),
        },
      };
    });
  }
}
