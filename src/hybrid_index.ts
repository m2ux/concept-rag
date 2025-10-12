#!/usr/bin/env node

/**
 * Hybrid Search MCP Server
 * 
 * Enhanced version with hybrid search combining:
 * - Vector similarity (semantic)
 * - BM25 text matching (keyword)
 * - Title matching (exact match boosting)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { connectToLanceDB, closeLanceDB } from "./lancedb/hybrid_search_client.js";
import { tools } from "./tools/hybrid_registry.js";
import * as defaults from './config.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node hybrid_index.js <database_path>");
  process.exit(1);
}

const databasePath = args[0];

// Initialize server
const server = new Server(
  {
    name: "lancedb-hybrid-search",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })) as Tool[],
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    console.error(`Executing tool: ${name}`);
    console.error(`Arguments: ${JSON.stringify(args, null, 2)}`);

    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const result = await tool.execute(args as any);
    return result;
  } catch (error: any) {
    console.error("Operation failed:", error);
    return {
      content: [
        {
          type: "text" as const,
          text: error.message,
        },
      ],
      isError: true,
    };
  }
});

// Startup
async function main() {
  await connectToLanceDB(
    databasePath,
    defaults.CHUNKS_TABLE_NAME,
    defaults.CATALOG_TABLE_NAME
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("🔍 LanceDB Hybrid Search MCP Server running");
  console.error("📊 Features: Vector + BM25 + Title Matching");
}

// Cleanup on exit
process.on("SIGINT", async () => {
  await closeLanceDB();
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

