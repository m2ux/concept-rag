#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ApplicationContainer } from "./application/container.js";
import * as defaults from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Resources Configuration
 * 
 * Resources are static documents that agents can request for guidance.
 * Unlike tools, resources are read-only and don't execute any logic.
 */
const RESOURCES = [
  {
    uri: 'concept-rag://get-guidance',
    name: 'Agent Research Rules',
    description: 'Guidelines for AI agents to improve answer synthesis, tool selection, and efficiency when using concept-rag tools.',
    mimeType: 'text/markdown',
    filePath: 'prompts/get-guidance.md',
  },
  {
    uri: 'concept-rag://tool-selection-guide',
    name: 'Tool Selection Guide',
    description: 'Decision tree and best practices for selecting the right MCP tool for each task.',
    mimeType: 'text/markdown',
    filePath: 'docs/tool-selection-guide.md',
  },
];

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
        resources: {},  // Enable resources capability
      },
    }
  );

  // Initialize application container (composition root)
  const container = new ApplicationContainer();
  await container.initialize(databaseUrl);

  // Tool handlers
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

  // Resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Filter to only include resources that exist on disk
    const availableResources = RESOURCES.filter(resource => {
      try {
        // Resolve path relative to package root
        const fullPath = path.resolve(process.cwd(), resource.filePath);
        return fs.existsSync(fullPath);
      } catch {
        return false;
      }
    });

    return {
      resources: availableResources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    
    // Find the resource
    const resource = RESOURCES.find(r => r.uri === uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    // Read the file
    const fullPath = path.resolve(process.cwd(), resource.filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Resource file not found: ${resource.filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: content,
        },
      ],
    };
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
  console.error(`📚 Resources available: ${RESOURCES.length}`);
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
