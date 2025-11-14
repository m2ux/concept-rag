#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ApplicationContainer } from "./application/container.js";
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

  // Initialize application container (composition root)
  const container = new ApplicationContainer();
  await container.initialize(databaseUrl);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: container.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = container.getTool(request.params.name);
    return tool.execute(request.params.arguments as any || {});
  });

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down...');
    await container.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down...');
    await container.close();
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

