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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');

/**
 * MCP Resources Configuration
 * 
 * Resources are static documents that agents can request for guidance.
 * Unlike tools, resources are read-only and don't execute any logic.
 */
const RESOURCES = [
  // Agent guidance resource
  {
    uri: 'concept-rag://guidance',
    name: 'Agent Research Rules',
    description: 'Research rules: synthesis, stop conditions, answer templates, tool selection, citations.',
    mimeType: 'text/markdown',
    filePath: 'prompts/guidance.md',
  },
  // Activity resources (problem domain - user goals)
  {
    uri: 'concept-rag://activities',
    name: 'Activity Index',
    description: 'Index of user activities (goals). Read this first to match user goals to appropriate skills.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/index.md',
  },
  {
    uri: 'concept-rag://activities/understand-topic',
    name: 'Activity: Understand a Topic',
    description: 'Activity for users who want to learn about a topic from their library.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/understand-topic.md',
  },
  {
    uri: 'concept-rag://activities/know-my-library',
    name: 'Activity: Know My Library',
    description: 'Activity for users who want to discover what content is available in their library.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/know-my-library.md',
  },
  {
    uri: 'concept-rag://activities/explore-concept',
    name: 'Activity: Explore a Concept',
    description: 'Activity for tracking where a concept appears across the library.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/explore-concept.md',
  },
  {
    uri: 'concept-rag://activities/analyze-document',
    name: 'Activity: Analyze a Document',
    description: 'Activity for extracting and analyzing concepts from a specific document.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/analyze-document.md',
  },
  {
    uri: 'concept-rag://activities/explore-category',
    name: 'Activity: Explore a Category',
    description: 'Activity for understanding what concepts appear in a domain/category.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/explore-category.md',
  },
  {
    uri: 'concept-rag://activities/identify-patterns',
    name: 'Activity: Identify Patterns',
    description: 'Activity for identifying design patterns applicable to a problem.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/identify-patterns.md',
  },
  {
    uri: 'concept-rag://activities/identify-best-practices',
    name: 'Activity: Identify Best Practices',
    description: 'Activity for identifying best practices and anti-patterns.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/identify-best-practices.md',
  },
  {
    uri: 'concept-rag://activities/curate-lexicon',
    name: 'Activity: Curate Concept Lexicon',
    description: 'Activity for creating a curated vocabulary of concepts applicable to a project.',
    mimeType: 'text/markdown',
    filePath: 'prompts/activities/curate-lexicon.md',
  },
  // Skill resources (solution domain - capabilities)
  {
    uri: 'concept-rag://skills',
    name: 'Skill Index',
    description: 'Index of available skills (multi-tool workflows). Skills fulfill user activities.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/index.md',
  },
  {
    uri: 'concept-rag://skills/deep-research',
    name: 'Skill: Deep Research',
    description: 'Skill for synthesizing knowledge across multiple documents using catalog_search and chunks_search.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/deep-research.md',
  },
  {
    uri: 'concept-rag://skills/library-discovery',
    name: 'Skill: Library Discovery',
    description: 'Skill for browsing and inventorying library content using list_categories and category_search.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/library-discovery.md',
  },
  {
    uri: 'concept-rag://skills/concept-exploration',
    name: 'Skill: Concept Exploration',
    description: 'Skill for tracking where a concept appears using concept_search and source_concepts.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/concept-exploration.md',
  },
  {
    uri: 'concept-rag://skills/document-analysis',
    name: 'Skill: Document Analysis',
    description: 'Skill for extracting concepts from a document using catalog_search and extract_concepts.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/document-analysis.md',
  },
  {
    uri: 'concept-rag://skills/category-exploration',
    name: 'Skill: Category Exploration',
    description: 'Skill for understanding domain concepts using category_search and list_concepts_in_category.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/category-exploration.md',
  },
  {
    uri: 'concept-rag://skills/pattern-research',
    name: 'Skill: Pattern Research',
    description: 'Skill for finding design patterns using concept_search, source_concepts, and chunks_search.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/pattern-research.md',
  },
  {
    uri: 'concept-rag://skills/practice-research',
    name: 'Skill: Practice Research',
    description: 'Skill for discovering best practices using broad_chunks_search, catalog_search, and chunks_search.',
    mimeType: 'text/markdown',
    filePath: 'prompts/skills/practice-research.md',
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
        const fullPath = path.resolve(PROJECT_ROOT, resource.filePath);
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
    const fullPath = path.resolve(PROJECT_ROOT, resource.filePath);
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
