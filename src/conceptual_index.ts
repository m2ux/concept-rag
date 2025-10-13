#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools } from "./tools/conceptual_registry.js";
import { connectToLanceDB, closeLanceDB } from "./lancedb/conceptual_search_client.js";
import * as defaults from './config.js';

async function main() {
  // Get database path from command line or use default
  const databaseUrl = process.argv[2] || defaults.DATABASE_URL;

  console.error("🧠 Starting LanceDB MCP Server with Conceptual Search...");
  console.error(`📂 Database: ${databaseUrl}`);

  const server = new Server(
    {
      name: "lance-mcp-conceptual",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize database connection
  await connectToLanceDB(databaseUrl, defaults.CHUNKS_TABLE_NAME, defaults.CATALOG_TABLE_NAME);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);

    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    return tool.execute(request.params.arguments as any || {});
  });

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down...');
    await closeLanceDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down...');
    await closeLanceDB();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ LanceDB MCP Server with Conceptual Search ready!");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

