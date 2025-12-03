# 1. TypeScript with Node.js Runtime

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational technology choice from upstream lance-mcp project  
**Sources:**
- Git Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2 (November 19, 2024, lance-mcp upstream)

## Context and Problem Statement

At project inception, a technology stack needed to be chosen for building an MCP (Model Context Protocol) server for semantic document search with vector databases. The system would need to handle asynchronous I/O (database queries, API calls), type safety for complex data structures, and integration with the emerging MCP ecosystem.

**Decision Drivers:**
* MCP SDK available for TypeScript/JavaScript
* Need for type safety with complex data structures (vectors, concepts, search results)
* Asynchronous I/O operations (database, embeddings, file processing)
* Developer productivity and ecosystem maturity
* LanceDB has strong TypeScript support
* Target deployment as command-line MCP server

## Alternative Options

* **Option 1: TypeScript with Node.js** - Type-safe JavaScript with async/await
* **Option 2: Python** - Popular for AI/ML applications
* **Option 3: Rust** - Performance-focused systems language
* **Option 4: Go** - Compiled language with good concurrency
* **Option 5: JavaScript (no TypeScript)** - Simpler but less type-safe

## Decision Outcome

**Chosen option:** "TypeScript with Node.js (Option 1)"

### Configuration Chosen

**TypeScript:** 5.7 (latest)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

**Node.js:** 18+ requirement (for latest JavaScript features and performance)

### Consequences

**Positive:**
* **Type Safety**: Complex types for vectors, concepts, and search results are type-checked
* **MCP SDK Support**: Official @modelcontextprotocol/sdk available
* **Async/Await**: Native support for asynchronous I/O operations
* **LanceDB Integration**: Excellent TypeScript bindings via @lancedb/lancedb
* **Document Processing**: Rich ecosystem (pdf-parse, epub, etc.)
* **Tooling**: Excellent IDE support (VS Code, Cursor)
* **Fast Iteration**: No compilation step for development (tsx for direct execution)
* **NPM Ecosystem**: Vast package availability

**Negative:**
* **Runtime Performance**: Slower than compiled languages (Rust, Go) for CPU-intensive tasks
* **Memory Usage**: Higher baseline memory than compiled languages
* **Type Erasure**: Types only exist at compile-time, not runtime
* **Module System Complexity**: ESM vs CommonJS can be confusing
* **Dependency Management**: node_modules can become large

**Neutral:**
* **Learning Curve**: Moderate for developers familiar with JavaScript
* **Deployment**: Requires Node.js runtime (not standalone binary)

### Confirmation

Technology choice enables:
- MCP server implementation
- LanceDB TypeScript bindings
- PDF document processing
- Vector search functionality

## Pros and Cons of the Options

### Option 1: TypeScript with Node.js (Chosen)

**Pros:**
* Excellent type safety for complex data structures
* Native async/await for I/O operations
* MCP SDK officially supports TypeScript
* LanceDB has first-class TypeScript support
* Rich ecosystem for document processing
* Fast development iteration
* Excellent tooling and IDE support

**Cons:**
* Slower than compiled languages
* Higher memory baseline
* Module system can be complex
* Runtime overhead

### Option 2: Python

**Pros:**
* Popular for AI/ML applications
* Rich scientific computing ecosystem
* Simple syntax
* Many embedding libraries available

**Cons:**
* **No official MCP SDK at project inception** (deal-breaker)
* LanceDB Python bindings less mature than TypeScript
* Slower than Node.js for async I/O
* Type hints not enforced at runtime
* GIL limits concurrency
* Slower startup time

### Option 3: Rust

**Pros:**
* Excellent performance
* Memory safety
* No garbage collection
* Small binaries

**Cons:**
* **No MCP SDK** (deal-breaker)
* Steep learning curve
* Slower development velocity
* Smaller ecosystem for document processing
* Over-engineering for I/O-bound workload
* Compilation time slows iteration

### Option 4: Go

**Pros:**
* Good performance
* Simple concurrency model
* Fast compilation
* Single binary deployment

**Cons:**
* **No MCP SDK** (deal-breaker)
* Weaker type system than TypeScript
* Smaller ecosystem for document processing
* Less suitable for I/O-bound workload
* No async/await (goroutines different paradigm)

### Option 5: JavaScript (no TypeScript)

**Pros:**
* No compilation step
* Simpler tooling
* Faster initial setup

**Cons:**
* **No type safety** - Critical for complex data structures
* Error-prone for vector operations, concept relationships
* Harder to refactor (no type-guided refactoring)
* Poor IDE support compared to TypeScript
* Maintenance nightmare for complex codebase

## Implementation Notes

### Package Dependencies

**Core:**
- `typescript`: ^5.7.3 - Language
- `@modelcontextprotocol/sdk`: 1.1.1 - MCP protocol
- `@lancedb/lancedb`: ^0.15.0 - Vector database
- `apache-arrow`: ^21.0.0 - Data format

**Document Processing:**
- `pdf-parse`: ^1.1.1 - PDF parsing
- `@langchain/community`: ^0.3.24 - Text processing
- `@langchain/ollama`: ^0.1.4 - Ollama integration

**Development:**
- `tsx`: ^4.19.2 - TypeScript execution
- `vitest`: ^4.0.9 - Testing framework

### TypeScript Configuration Evolution

**Initial:** Permissive settings for rapid development
**Current (Nov 2025):** Strict mode enabled (see [ADR-0020](adr0020-typescript-strict-mode.md))

### Build Process

```bash
# Development
npm run watch    # TypeScript compiler in watch mode
npx tsx src/conceptual_index.ts  # Direct execution

# Production
npm run build    # Compile to dist/
node dist/conceptual_index.js    # Run compiled
```

## Related Decisions

- [ADR-0002: LanceDB for Vector Storage](adr0002-lancedb-vector-storage.md) - Database choice complements TypeScript
- [ADR-0003: MCP Protocol](adr0003-mcp-protocol.md) - Protocol requires TypeScript SDK
- [ADR-0019: Vitest Testing](adr0019-vitest-testing-framework.md) - Testing framework for TypeScript
- [ADR-0020: TypeScript Strict Mode](adr0020-typescript-strict-mode.md) - Later evolution

## References

### Related Decisions
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)
- [ADR-0003: MCP Protocol](adr0003-mcp-protocol.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2
