# 3. MCP Protocol for AI Agent Integration

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational protocol choice from upstream lance-mcp project  

**Sources:**
- Git Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2 (November 19, 2024, lance-mcp upstream)

## Context and Problem Statement

The project needed a protocol for AI agents (like Claude, Cursor) to interact with the document search system. The interface must support:
- Tool-based interaction paradigm (AI agents call tools)
- Structured input/output (JSON schemas)
- Multiple tool definitions
- Real-time request/response
- Integration with popular AI IDEs/assistants

**Decision Drivers:**
* Emerging standard for AI agent tool integration
* Official SDK availability
* Support in target AI assistants (Claude Desktop, Cursor)
* Structured tool definitions with JSON schemas
* Request/response protocol suitable for search operations
* Future-proofing for AI agent ecosystem

## Alternative Options

* **Option 1: MCP (Model Context Protocol)** - Anthropic's AI agent protocol
* **Option 2: OpenAI Function Calling** - OpenAI's function calling API
* **Option 3: REST API** - Traditional HTTP REST interface
* **Option 4: GraphQL API** - Query language for APIs
* **Option 5: Custom RPC Protocol** - Bespoke protocol
* **Option 6: CLI Tool** - Command-line interface only

## Decision Outcome

**Chosen option:** "MCP (Model Context Protocol) (Option 1)"

### MCP Server Structure

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "concept-rag",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},  // Support tool calling
  },
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "catalog_search",
        description: "Search documents by title, author, or topic",
        inputSchema: { /* JSON Schema */ }
      },
      // ... 7 more tools
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  return await tool.execute(request.params.arguments);
});
```

### Tool Definition Format

**Example: catalog_search tool**
```typescript
{
  name: "catalog_search",
  description: "Search for documents by title, author, subject, or general topic...",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Search query (title, author, topic, or concept)"
      },
      debug: {
        type: "boolean",
        description: "Include detailed scoring information"
      }
    },
    required: ["text"]
  }
}
```

### Client Configuration

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "concept-rag": {
      "command": "node",
      "args": [
        "/path/to/concept-rag/dist/conceptual_index.js",
        "/home/username/.concept_rag"
      ]
    }
  }
}
```

**Claude Desktop** (similar configuration in app settings)

### Consequences

**Positive:**
* **Native Integration**: Works seamlessly with Cursor and Claude Desktop
* **Structured Interface**: JSON schemas provide type safety and documentation
* **Tool-Based Paradigm**: Natural fit for AI agent interaction
* **Official SDK**: @modelcontextprotocol/sdk ^1.1.1 maintained by Anthropic
* **Extensibility**: Easy to add new tools
* **Discoverability**: AI agents can list and discover tools dynamically
* **Self-Documenting**: Tool descriptions guide AI agent usage
* **Standard Protocol**: Future-proof as MCP adoption grows
* **Stdio Transport**: Simple process-based communication

**Negative:**
* **Emerging Standard**: Specification still evolving (risk of breaking changes)
* **Limited Adoption**: Only some AI assistants support MCP (not OpenAI yet)
* **Documentation**: Less mature than REST/GraphQL ecosystems
* **Debugging**: Harder to test than HTTP APIs (no curl/Postman equivalent)
* **Single Process**: Stdio transport ties to single client session

**Neutral:**
* **Process-Based**: Each client connection spawns new process
* **No HTTP**: Not accessible via web browsers/traditional API clients
* **JSON-RPC**: Underlying JSON-RPC 2.0 protocol

### Confirmation

Protocol enables:
- AI agent integration
- Tool-based interaction
- Structured JSON communication

## Pros and Cons of the Options

### Option 1: MCP Protocol (Chosen)

**Pros:**
* Official protocol for Claude/Anthropic ecosystem
* Native support in Cursor IDE
* Structured tool definitions (JSON schema)
* Self-documenting interface
* Tool discovery mechanism
* Official TypeScript SDK
* Growing ecosystem

**Cons:**
* Emerging standard (specification evolving)
* Limited adoption outside Anthropic ecosystem
* Harder to test than HTTP
* Process-based (stdio) limits to single client

### Option 2: OpenAI Function Calling

**Pros:**
* Mature and well-documented
* Widely adopted
* Good tooling
* JSON schema based

**Cons:**
* **OpenAI-specific**: Not standard protocol
* **API-based**: Requires OpenAI API integration
* **No local execution**: Functions run remotely
* **Cost**: Per-API-call pricing
* **Not suitable for personal RAG**: Designed for cloud services

### Option 3: REST API

**Pros:**
* Well-understood standard
* Easy to test (curl, Postman)
* Language-agnostic
* Rich ecosystem
* Can use from web browsers

**Cons:**
* **Not AI-agent native**: Requires custom integration
* **No tool discovery**: AI doesn't know what endpoints exist
* **Manual integration**: Each AI assistant needs custom code
* **No JSON schema**: Parameter validation manual
* **HTTP overhead**: Requires web server

### Option 4: GraphQL API

**Pros:**
* Flexible query language
* Strong typing
* Single endpoint
* Good tooling

**Cons:**
* **Over-engineering**: Too complex for tool-calling
* **Not AI-agent native**: No built-in AI support
* **Learning curve**: More complex than needed
* **HTTP overhead**: Requires web server
* **Query language**: Doesn't fit tool paradigm

### Option 5: Custom RPC Protocol

**Pros:**
* Full control over design
* Optimized for specific needs
* No dependency on standards

**Cons:**
* **No ecosystem**: No existing integrations
* **Maintenance burden**: Must maintain protocol
* **No AI support**: AI assistants won't understand it
* **Documentation**: Must write everything from scratch
* **Adoption**: No one else uses it

### Option 6: CLI Tool Only

**Pros:**
* Simplest to implement
* Easy to test
* No protocol overhead

**Cons:**
* **Not AI-agent friendly**: Can't be called by AI
* **No structured output**: Text output only
* **Manual usage**: Requires human interaction
* **Defeats purpose**: Project is FOR AI agents

## Implementation Notes

### Initial Tools

lance-mcp provides 3 MCP tools:
- `catalog_search` - Search document summaries  
- `chunks_search` - Search within specific document
- `all_chunks_search` - Search across all documents

[Source: lance-mcp README.md, lines 100-107]

### Tool Pattern (BaseTool)

```typescript
// src/tools/base/tool.ts
export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: object;
  
  abstract execute(params: ToolParams): Promise<ToolResult>;
}
```

### MCP Inspector for Testing

```bash
# Interactive testing
npx @modelcontextprotocol/inspector dist/index.js PATH_TO_INDEX
```
[Source: lance-mcp README.md, line 65]

### Protocol Features

1. **Tool Discovery**: AI agents can list available tools
2. **Documentation**: Tool descriptions embedded
3. **Type Safety**: JSON schemas validate inputs
4. **Structured Communication**: JSON-RPC 2.0 protocol

## Related Decisions

- [ADR-0001: TypeScript with Node.js](adr0001-typescript-nodejs-runtime.md) - Language enables MCP SDK
- [ADR-0031: Eight Specialized Tools](adr0031-eight-specialized-tools-strategy.md) - Tool proliferation strategy
- [ADR-0032: Tool Selection Guide](adr0032-tool-selection-guide.md) - Helping AI agents choose tools

## More Information

## References

### Related Decisions
- [ADR-0001: TypeScript/Node.js](adr0001-typescript-nodejs-runtime.md)
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2
