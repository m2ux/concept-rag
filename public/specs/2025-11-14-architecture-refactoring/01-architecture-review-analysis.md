# Concept-RAG Architecture & Dependency Management Review

**Date**: November 14, 2025  
**Reviewer**: AI Code Review Assistant  
**Target Component**: concept-rag (full codebase)  
**Focus Area**: Architecture & Dependency Management  
**Review Type**: In-depth architectural analysis

---

## Executive Summary

This review examines the architectural patterns and dependency management strategies in the concept-rag TypeScript codebase. The analysis reveals a functional but tightly coupled architecture that relies heavily on global mutable state through module-level exports. While the current implementation works, it presents significant challenges for testability, maintainability, and scalability.

**Key Findings**:
- ❌ **Global mutable state** via module-level `export let` declarations
- ❌ **No dependency injection** - direct imports of shared state
- ❌ **Tight coupling** between tools, database layer, and infrastructure
- ✅ **Clean tool abstraction** via `BaseTool` class
- ⚠️ **Mixed concerns** - business logic intertwined with infrastructure

**Overall Assessment**: The codebase would significantly benefit from refactoring to introduce proper dependency management, eliminate global state, and improve separation of concerns.

---

## 1. Current Architecture Analysis

### 1.1 Global State Management Pattern

**Location**: `src/lancedb/conceptual_search_client.ts`, `src/lancedb/simple_client.ts`, `src/lancedb/hybrid_search_client.ts`

```typescript:11:14:src/lancedb/conceptual_search_client.ts
export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;
export let conceptTable: lancedb.Table;
```

**Problem Description**:
The codebase exports mutable module-level variables that represent shared database connections and table references. These are modified by the `connectToLanceDB` function and accessed directly by all tool implementations.

**Consequences**:
1. **Hidden Dependencies**: Tools import these globals without explicitly declaring their dependencies
2. **Initialization Order Issues**: Code can reference tables before `connectToLanceDB` is called
3. **No Lifecycle Control**: No way to create multiple instances or manage lifecycle
4. **Testing Impossible**: Cannot inject mock databases without modifying global state
5. **Race Conditions**: Potential for concurrent access issues
6. **Module Coupling**: Every tool is tightly coupled to specific import paths

**Example of Problem**:

```typescript:1:2:src/tools/operations/concept_search.ts
import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";
```

The `ConceptSearchTool` directly imports global state. There's no dependency injection, no interface abstraction, and no way to substitute implementations.

### 1.2 Lack of Dependency Injection

**Current Pattern**: Direct imports of concrete implementations

```typescript:1:8:src/tools/operations/conceptual_catalog_search.ts
import { catalogTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualCatalogSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}
```

**Problems**:
1. **No Interface Abstraction**: Tools depend on concrete `lancedb.Table` types
2. **Cannot Mock**: Testing requires real LanceDB instances
3. **No Substitutability**: Cannot swap implementations without code changes
4. **Tight Coupling**: Tools know about LanceDB internals

**Industry Standards** (from concept-rag documentation search):

From "Clean Architecture" by Robert C. Martin:
- *"Dependency should point inward toward higher-level policies"*
- *"Business logic should not depend on frameworks or infrastructure"*

From "Design Patterns":
- *"Program to an interface, not an implementation"*
- *"Favor composition over inheritance"*

### 1.3 Tool Registration and Initialization

**Location**: `src/conceptual_index.ts`, `src/tools/conceptual_registry.ts`

```typescript:1:14:src/tools/conceptual_registry.ts
import { ConceptualCatalogSearchTool } from "./operations/conceptual_catalog_search.js";
import { ConceptualChunksSearchTool } from "./operations/conceptual_chunks_search.js";
import { ConceptualBroadChunksSearchTool } from "./operations/conceptual_broad_chunks_search.js";
import { ConceptSearchTool } from "./operations/concept_search.js";
import { DocumentConceptsExtractTool } from "./operations/document_concepts_extract.js";

export const tools = [
  new ConceptualCatalogSearchTool(),
  new ConceptualChunksSearchTool(),
  new ConceptualBroadChunksSearchTool(),
  new ConceptSearchTool(),
  new DocumentConceptsExtractTool(),
];
```

**Problems**:
1. **Eager Instantiation**: Tools created at module load time, before database connection
2. **No Dependency Passing**: Tools created without dependencies - they reach for globals later
3. **Static Registry**: Cannot configure different tool sets

```typescript:29:42:src/conceptual_index.ts
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
```

**Issues**:
- Database connection happens **after** tools are created
- Tools are already instantiated when database becomes available
- Temporal coupling between `connectToLanceDB` and tool usage
- No validation that database is ready when tools execute

### 1.4 Tight Coupling to Infrastructure

**Example**: Tools directly depend on LanceDB specifics

```typescript:50:100:src/tools/operations/concept_search.ts
  async execute(params: ConceptSearchParams) {
    try {
      const limit = params.limit || 10;
      const conceptLower = params.concept.toLowerCase().trim();
      
      if (!chunksTable) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Chunks table not available",
              message: "Database not properly initialized"
            }, null, 2)
          }],
          isError: true
        };
      }

      // Get concept info from concepts table if available
      let conceptInfo: any = null;
      if (conceptTable) {
        try {
          const conceptResults = await conceptTable
            .query()
            .where(`concept = '${conceptLower}'`)
            .limit(1)
            .toArray();
          
          if (conceptResults.length > 0) {
            conceptInfo = conceptResults[0];
          }
        } catch (e) {
          // Concept table query failed, continue without it
        }
      }

      // Query chunks that contain this concept
      // Load ALL chunks and filter in memory (concepts stored as JSON, can't use SQL WHERE)
      console.error(`🔍 Searching for concept: "${conceptLower}"`);
      
      // Get total count and load ALL chunks (LanceDB defaults to 10 if no limit!)
      const totalCount = await chunksTable.countRows();
      console.error(`📊 Scanning ${totalCount.toLocaleString()} chunks...`);
      
      // Load all chunks - MUST specify limit (toArray() defaults to 10!)
      const allChunks = await chunksTable
        .query()
        .limit(totalCount)  // CRITICAL: Explicit limit required
        .toArray();
      
      console.error(`✅ Loaded ${allChunks.length.toLocaleString()} chunks`);
      
      // Filter chunks that contain this concept
```

**Problems**:
1. **Business Logic Mixed with Database Queries**: Tool contains LanceDB query syntax
2. **Runtime Null Checks**: `if (!chunksTable)` - this should be guaranteed by architecture
3. **Direct Table Access**: No repository layer or abstraction
4. **Hard to Test**: Cannot unit test without real database
5. **SQL Injection Risk**: String interpolation in WHERE clause (line 74)

---

## 2. Relevant Best Practices from Knowledge Base

### 2.1 From "Clean Architecture" (Robert C. Martin)

**Key Concepts Discovered**:
- **Dependency Rule**: Source code dependencies must point only inward toward higher-level policies
- **Entities vs. Use Cases vs. Infrastructure**: Clear boundaries between business rules and external systems
- **Interface Adapters**: Convert data from external form to internal form

**Applicability to Concept-RAG**:
- Tools (use cases) should not depend directly on LanceDB (infrastructure)
- Need adapter layer to isolate database specifics
- Business logic should be testable without database

### 2.2 From "Introduction to Software Design and Architecture With TypeScript" (Khalil Stemmler)

**Key Concepts Discovered**:
- **Dependency Injection**: Constructor injection pattern for explicit dependencies
- **Inversion of Control (IoC)**: Separate object construction from object use
- **Repository Pattern**: Abstract data access behind domain interfaces
- **Ports & Adapters (Hexagonal Architecture)**: Infrastructure as plugins to core domain
- **Dependency Inversion Principle**: High-level modules shouldn't depend on low-level modules
- **Layered Architecture**: Presentation → Application → Domain → Infrastructure
- **Composition Root**: Single place where object graph is composed
- **Domain-Driven Design Patterns**: Aggregates, Entities, Value Objects, Domain Services

**Applicability to Concept-RAG** (TypeScript-Specific):
- **Direct applicability**: Book uses TypeScript/Node.js examples
- Provides concrete patterns for TypeScript dependency injection without frameworks
- Shows how to structure Express.js applications with clean architecture
- Demonstrates repository pattern implementation in TypeScript
- Provides guidance on organizing TypeScript projects with DDD principles

**Specific Guidance**:
- Application Services (Use Cases) should coordinate domain logic, not contain it
- Repositories should be interfaces in domain layer, implementations in infrastructure
- Composition Root pattern: Create all dependencies in one place (server startup)
- Use TypeScript interfaces for port definitions
- Keep domain logic pure (no framework dependencies)

### 2.3 From "Code That Fits in Your Head" (Mark Seemann)

**Key Concepts Discovered**:
- **Constructor Injection**: Dependencies passed via constructor parameters
- **Composition Root**: Where entire object graph is assembled
- **Repository Pattern**: Concrete implementation with interface abstraction
- **Ports and Adapters (Hexagonal Architecture)**: Core surrounded by adapters
- **Decorator Pattern**: For cross-cutting concerns (logging, caching, etc.)
- **Dependency Inversion Principle**: Depend on abstractions, not concretions
- **Functional Core, Imperative Shell**: Pure logic inside, I/O at edges
- **Separation of Concerns**: Each component has single, well-defined responsibility
- **Parse, Don't Validate**: Transform data at boundaries into validated types

**Applicability to Concept-RAG**:
- Practical heuristics for implementing DI without containers
- Guidance on repository interface design
- Patterns for managing database lifecycle
- Testing strategies for components with dependencies
- Composition root pattern for Node.js applications

**Specific Guidance**:
- Composition Root should be at application entry point (main function)
- Constructor injection makes dependencies explicit and testable
- Repository interfaces belong to domain/application layer, not infrastructure
- Use pure functions where possible (concept extraction, query expansion)
- Decorator pattern for adding concerns like logging without modifying core

### 2.4 From "Node.js Design Patterns" (Mario Casciaro)

**Key Content Discovered** (from table of contents):
- **Dependency Injection Container**: Pros and cons
- **Service Locator Pattern**: vs DI comparison
- **Plugin Architecture**: Extension points and plugin-controlled vs application-controlled
- **Wiring Plugins**: Patterns for connecting components
- **Hardcoded Dependencies vs DI**: Trade-offs

**Applicability to Concept-RAG**:
- Node.js-specific DI patterns
- Lightweight alternatives to heavy DI frameworks
- Plugin architecture for tools (relevant to MCP tool system)
- Service locator vs DI trade-offs

### 2.5 From "Software Architecture: The Hard Parts" (Neal Ford et al.)

**Key Concepts**:
- **Coupling and Cohesion**: Measure of component independence
- **Component Boundaries**: Clear separation between architectural components
- **Trade-off Analysis**: Every architectural decision has costs
- **Architecture Quantum**: Independently deployable unit with high cohesion

**Applicability**:
- Current architecture has high coupling (all tools know about LanceDB)
- Low cohesion (database connection logic mixed with initialization)
- Need explicit component boundaries
- Single quantum currently (monolithic)

### 2.6 From "Design Patterns" (Gang of Four)

**Relevant Patterns**:

**Strategy Pattern**:
- Different search algorithms could be strategies
- Currently hardcoded in each tool

**Repository Pattern**:
- Abstract data access behind interface
- Currently tools access tables directly

**Dependency Injection Pattern**:
- Dependencies provided to objects rather than created by them
- Currently objects reach for global state

---

## 3. Gap Analysis: Current State vs. Best Practices

### 3.1 Dependency Management

| Aspect | Current State | Best Practice | Gap |
|--------|---------------|---------------|-----|
| **Dependency Declaration** | Implicit via imports | Explicit via constructor | ⛔ Critical |
| **Dependency Lifecycle** | Module-level singleton | Managed by container | ⛔ Critical |
| **Testability** | Cannot mock dependencies | Inject test doubles | ⛔ Critical |
| **Interface Abstraction** | Concrete LanceDB types | Abstract interfaces | ⛔ Critical |
| **Configuration** | Hardcoded imports | Configurable composition | ⚠️ Significant |

### 3.2 Separation of Concerns

| Aspect | Current State | Best Practice | Gap |
|--------|---------------|---------------|-----|
| **Database Access** | Direct in tools | Repository layer | ⛔ Critical |
| **Business Logic** | Mixed with queries | Pure domain logic | ⛔ Critical |
| **Infrastructure** | Throughout codebase | Isolated to adapters | ⚠️ Significant |
| **Error Handling** | Inconsistent try-catch | Unified error handling | ⚠️ Significant |

### 3.3 Module Boundaries

| Aspect | Current State | Best Practice | Gap |
|--------|---------------|---------------|-----|
| **Database Layer** | Exports mutable state | Exports services | ⛔ Critical |
| **Tool Layer** | Depends on infrastructure | Depends on interfaces | ⛔ Critical |
| **Configuration** | Mixed with code | External configuration | ⚠️ Moderate |
| **Initialization** | Imperative sequence | Declarative composition | ⚠️ Moderate |

---

## 4. Specific Issues Identified

### Issue #1: SQL Injection Vulnerability

**Location**: `src/tools/operations/concept_search.ts:74`

```typescript
.where(`concept = '${conceptLower}'`)
```

**Severity**: Medium  
**Category**: Security / Architecture

**Problem**: String interpolation in SQL WHERE clause. While `conceptLower` comes from user input that's been `.toLowerCase().trim()`'d, this is still a vulnerability pattern.

**Recommendation**: Use parameterized queries or query builder with proper escaping.

### Issue #2: Loading All Chunks Into Memory

**Location**: `src/tools/operations/concept_search.ts:91-98`

```typescript
const totalCount = await chunksTable.countRows();
console.error(`📊 Scanning ${totalCount.toLocaleString()} chunks...`);

// Load all chunks - MUST specify limit (toArray() defaults to 10!)
const allChunks = await chunksTable
  .query()
  .limit(totalCount)  // CRITICAL: Explicit limit required
  .toArray();
```

**Severity**: High  
**Category**: Performance / Scalability

**Problem**: Loads **all** chunks into memory to filter in JavaScript. User requirement: "performance should not degrade significantly with a large canon of documents" - this violates that requirement.

**Impact**:
- With 10,000 documents × 100 chunks/doc = 1M chunks
- Assuming 500 bytes/chunk = 500MB loaded into memory
- With 100,000 documents = 5GB memory

**Why This Exists**: Comment says "concepts stored as JSON, can't use SQL WHERE" - architectural limitation pushed performance problem to runtime.

### Issue #3: Runtime Null Checks for Required Dependencies

**Location**: Multiple tools, e.g., `src/tools/operations/concept_search.ts:55-66`

```typescript
if (!chunksTable) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        error: "Chunks table not available",
        message: "Database not properly initialized"
      }, null, 2)
    }],
    isError: true
  };
}
```

**Severity**: Medium  
**Category**: Architecture / Type Safety

**Problem**: Required dependencies checked at runtime. TypeScript type system says `chunksTable` could be undefined, so every tool must check.

**Better Approach**: Architecture should guarantee dependencies are available. If database connection fails, server shouldn't start.

### Issue #4: Code Duplication - Embedding Generation

**Locations**:
- `src/lancedb/hybrid_search_client.ts:9-32`
- `src/concepts/query_expander.ts:114-146`

Both files implement `createSimpleEmbedding()` with identical logic.

**Severity**: Low  
**Category**: Maintainability

**Problem**: Same embedding function duplicated. Changes to algorithm must be made in two places.

### Issue #5: Eager Tool Instantiation

**Location**: `src/tools/conceptual_registry.ts:7-13`

```typescript
export const tools = [
  new ConceptualCatalogSearchTool(),
  new ConceptualChunksSearchTool(),
  new ConceptualBroadChunksSearchTool(),
  new ConceptSearchTool(),
  new DocumentConceptsExtractTool(),
];
```

**Severity**: Medium  
**Category**: Architecture

**Problem**: Tools created at module load time, before database connection exists. Tools are created but cannot function until later initialization.

**Temporal Coupling**: Must ensure `connectToLanceDB()` called before any tool execution.

---

## 5. Recommended Improvements

### 5.1 Introduce Repository Pattern

**Priority**: Critical  
**Impact**: High  
**Effort**: High  
**Risk**: Medium

**Recommendation**: Create repository interfaces to abstract database access.

**Benefits**:
- Testable without database
- Isolates LanceDB specifics
- Can optimize queries without changing business logic
- Fixes Issue #2 (loading all chunks)

**Proposed Architecture**:

```typescript
// Core domain interfaces
interface ConceptRepository {
  findByName(concept: string): Promise<ConceptRecord | null>;
  findRelated(concept: string, limit: number): Promise<ConceptRecord[]>;
}

interface ChunkRepository {
  findByConceptName(concept: string, limit: number): Promise<Chunk[]>;
  findBySource(source: string, limit: number): Promise<Chunk[]>;
  search(query: SearchQuery): Promise<SearchResult[]>;
}

// Repository implementations use LanceDB internally
class LanceDBChunkRepository implements ChunkRepository {
  constructor(private table: lancedb.Table) {}
  
  async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
    // Efficient query - don't load all chunks!
    // Use LanceDB's filtering capabilities
  }
}
```

**Migration Path**:
1. Create repository interfaces in `src/domain/repositories/`
2. Create LanceDB implementations in `src/infrastructure/lancedb/`
3. Update tools to accept repositories via constructor
4. Update initialization to create and inject repositories

### 5.2 Implement Dependency Injection

**Priority**: Critical  
**Impact**: High  
**Effort**: High  
**Risk**: Medium

**Recommendation**: Remove global state and inject dependencies via constructors.

**Current (Global State)**:
```typescript
// Bad: reaches for global
import { chunksTable } from "../../lancedb/conceptual_search_client.js";

export class ConceptSearchTool {
  async execute() {
    const results = await chunksTable.query();  // Uses global
  }
}
```

**Proposed (Constructor Injection)**:
```typescript
// Good: dependencies explicit
export class ConceptSearchTool {
  constructor(
    private chunkRepo: ChunkRepository,
    private conceptRepo: ConceptRepository
  ) {}
  
  async execute(params: ConceptSearchParams) {
    const results = await this.chunkRepo.findByConceptName(
      params.concept,
      params.limit
    );
  }
}
```

**Benefits**:
- Dependencies explicit and type-safe
- Can inject mocks for testing
- No global mutable state
- Fixes Issue #3 (runtime null checks)
- Clear dependency graph

**Implementation Approach**:

Given user preference to avoid heavyweight DI containers, use **manual dependency injection** (constructor injection without framework):

```typescript
// src/infrastructure/container.ts
export class ApplicationContainer {
  private dbConnection: lancedb.Connection;
  private repositories: Map<string, any> = new Map();
  private tools: Map<string, BaseTool> = new Map();
  
  async initialize(databaseUrl: string) {
    // 1. Connect to database
    this.dbConnection = await lancedb.connect(databaseUrl);
    
    // 2. Create table references
    const chunksTable = await this.dbConnection.openTable('chunks');
    const catalogTable = await this.dbConnection.openTable('catalog');
    const conceptTable = await this.dbConnection.openTable('concepts');
    
    // 3. Create repositories
    const chunkRepo = new LanceDBChunkRepository(chunksTable);
    const catalogRepo = new LanceDBCatalogRepository(catalogTable);
    const conceptRepo = new LanceDBConceptRepository(conceptTable);
    
    // 4. Create tools with dependencies
    this.tools.set('concept_search', new ConceptSearchTool(chunkRepo, conceptRepo));
    this.tools.set('catalog_search', new ConceptualCatalogSearchTool(catalogRepo, conceptRepo));
    // ... other tools
  }
  
  getTool(name: string): BaseTool {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool;
  }
  
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }
}
```

**Usage in Server**:
```typescript
// src/conceptual_index.ts
const container = new ApplicationContainer();
await container.initialize(databaseUrl);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: container.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = container.getTool(request.params.name);
  return tool.execute(request.params.arguments);
});
```

### 5.3 Refactor Database Client Layer

**Priority**: High  
**Impact**: High  
**Effort**: Medium  
**Risk**: Low

**Recommendation**: Remove module-level `export let` variables. Create database service class.

**Current Pattern**:
```typescript:11:14:src/lancedb/conceptual_search_client.ts
export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;
export let conceptTable: lancedb.Table;
```

**Proposed Pattern**:
```typescript
// src/infrastructure/lancedb/database-connection.ts
export class LanceDBConnection {
  private client: lancedb.Connection;
  private tables: Map<string, lancedb.Table> = new Map();
  
  private constructor() {}
  
  static async create(databaseUrl: string): Promise<LanceDBConnection> {
    const conn = new LanceDBConnection();
    conn.client = await lancedb.connect(databaseUrl);
    return conn;
  }
  
  async openTable(name: string): Promise<lancedb.Table> {
    if (!this.tables.has(name)) {
      const table = await this.client.openTable(name);
      this.tables.set(name, table);
    }
    return this.tables.get(name)!;
  }
  
  async close(): Promise<void> {
    await this.client.close();
  }
}
```

**Benefits**:
- No mutable module-level variables
- Lifecycle management encapsulated
- Can create multiple instances for testing
- Type-safe - no `let` variables that might be undefined

### 5.4 Address Performance Issue (Loading All Chunks)

**Priority**: Critical  
**Impact**: High  
**Effort**: Medium  
**Risk**: Low

**Recommendation**: Fix Issue #2 by querying efficiently instead of loading everything.

**Problem Analysis**: 
Code comment says *"concepts stored as JSON, can't use SQL WHERE"*. This is the root cause - architectural decision to store concepts as JSON string limits query capabilities.

**Solution Options**:

**Option A: Use LanceDB Vector Search (Recommended)**
```typescript
// Instead of loading all chunks, use vector similarity
async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
  // 1. Look up concept embedding from concepts table
  const conceptRecord = await this.conceptTable
    .query()
    .where(`concept = '${concept}'`)
    .limit(1)
    .toArray();
  
  if (!conceptRecord[0]) return [];
  
  // 2. Use concept's embedding vector to search chunks
  const results = await this.chunksTable
    .vectorSearch(conceptRecord[0].embeddings)
    .limit(limit * 2)  // Get more for filtering
    .toArray();
  
  // 3. Filter to chunks that actually contain the concept
  return results.filter(chunk => 
    chunk.concepts.includes(concept)
  ).slice(0, limit);
}
```

**Benefits**:
- Efficient: Only loads candidates, not all chunks
- Scalable: O(log n) vector search instead of O(n) scan
- Maintains semantic relevance through vector similarity

**Option B: Denormalize Concept-Chunk Relationships**
Create a separate `concept_chunks` table with proper indexing:

```sql
concept_chunks:
  - concept (string, indexed)
  - chunk_id (string, indexed)
  - concept_density (float)
  - source (string)
```

Then query directly:
```typescript
const results = await this.conceptChunkTable
  .query()
  .where(`concept = '${concept}'`)
  .orderBy('concept_density DESC')
  .limit(limit)
  .toArray();
```

**Trade-offs**:
- Option A: Faster to implement, uses existing structure
- Option B: Better query performance, requires data migration

### 5.5 Introduce Interface Abstractions

**Priority**: High  
**Impact**: Medium  
**Effort**: Low  
**Risk**: Low

**Recommendation**: Define interfaces for core abstractions.

**Proposed Structure**:
```
src/
  domain/
    interfaces/
      repositories/
        chunk-repository.ts       # Interface
        concept-repository.ts     # Interface
        catalog-repository.ts     # Interface
      services/
        search-service.ts         # Interface
        embeddings-service.ts     # Interface
    models/
      chunk.ts                    # Domain model
      concept.ts                  # Domain model
      search-result.ts            # Domain model
```

**Benefits**:
- Clear contracts between layers
- Can swap implementations
- Enables testing with mocks
- Documents expected behavior

### 5.6 Fix Code Duplication

**Priority**: Low  
**Impact**: Low  
**Effort**: Low  
**Risk**: Very Low

**Recommendation**: Extract shared embedding function to single location.

**Implementation**:
```typescript
// src/infrastructure/embeddings/simple-embeddings.ts
export class SimpleEmbeddingService implements EmbeddingService {
  generate(text: string): number[] {
    // Single implementation
  }
}
```

---

## 6. Proposed Architecture Diagram

### Current Architecture (Simplified)

```
┌─────────────────────────────────────────┐
│         MCP Server (conceptual_index.ts) │
│  - Connects to database                  │
│  - Mutates global state                  │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  Global State (module exports)           │
│  - export let client                     │
│  - export let chunksTable                │
│  - export let catalogTable               │
│  - export let conceptTable               │
└─────────┬───────────────────────────────┘
          │
          │ (imported by)
          ▼
┌─────────────────────────────────────────┐
│         Tools (5 search tools)           │
│  - Import global state                   │
│  - Execute database queries directly     │
│  - Mix business logic with data access   │
└──────────────────────────────────────────┘

Problems:
• Tight coupling to LanceDB
• No interface boundaries
• Cannot test without database
• Global mutable state
```

### Proposed Architecture

```
┌─────────────────────────────────────────────┐
│       MCP Server (conceptual_index.ts)       │
│  - Creates ApplicationContainer              │
│  - Delegates to container                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      ApplicationContainer                    │
│  - Initializes database connection           │
│  - Creates repositories                      │
│  - Constructs tools with dependencies        │
│  - Manages lifecycle                         │
└──────────────┬──────────────────────────────┘
               │
               │ creates & injects
               ▼
┌─────────────────────────────────────────────┐
│              Tools (5 search tools)          │
│  - Depend on Repository interfaces           │
│  - Pure business logic                       │
│  - No infrastructure knowledge               │
└──────────────┬──────────────────────────────┘
               │
               │ uses (interface)
               ▼
┌─────────────────────────────────────────────┐
│     Repository Interfaces (domain layer)     │
│  - ChunkRepository                           │
│  - ConceptRepository                         │
│  - CatalogRepository                         │
└──────────────┬──────────────────────────────┘
               │
               │ implemented by
               ▼
┌─────────────────────────────────────────────┐
│  LanceDB Implementations (infrastructure)    │
│  - LanceDBChunkRepository                    │
│  - LanceDBConceptRepository                  │
│  - LanceDBCatalogRepository                  │
│  - Encapsulates LanceDB specifics            │
└──────────────────────────────────────────────┘

Benefits:
✓ Clear dependency flow (inward)
✓ Interface boundaries
✓ Testable components
✓ No global state
✓ Pluggable implementations
```

---

## 7. Implementation Priority Matrix

| Recommendation | Impact | Effort (AI) | Effort (Human) | Risk | Priority | Addresses Issues |
|----------------|--------|-------------|----------------|------|----------|------------------|
| **5.1 Repository Pattern** | High | 1-1.5 days | 1 week | Medium | 1 | #2 (memory), #3 (null checks), separation of concerns |
| **5.2 Dependency Injection** | High | 1-1.5 days | 1 week | Medium | 2 | #3 (null checks), #5 (eager instantiation), testability |
| **5.4 Performance Fix** | High | 0.5 day | 3-4 days | Low | 3 | #2 (loading all chunks), scalability requirement |
| **5.3 Refactor DB Layer** | High | 0.5 day | 2-3 days | Low | 4 | Global state, lifecycle management |
| **5.5 Interface Abstractions** | Medium | 2-3 hours | 1-2 days | Low | 5 | Type safety, documentation, maintainability |
| **5.6 Fix Duplication** | Low | 1 hour | 2-3 hours | Very Low | 6 | #4 (code duplication) |

**Note**: Agentic implementation leverages automated refactoring, pattern-based code generation, and parallel file processing. Human estimates shown for comparison.

---

## 8. Trade-Off Analysis

### 8.1 Breaking Changes

**Consideration**: User is willing to accept breaking changes.

**What Will Break**:
- Any code importing `{ chunksTable, catalogTable, conceptTable }` directly
- Tool instantiation pattern changes
- Server initialization sequence changes

**Migration Impact**: Low - this appears to be primarily a local tool, not a published library with many consumers.

### 8.2 Implementation Effort

**Estimated Effort (Agentic Implementation)**: 3-5 days of iterative development

**Breakdown** (AI Agent):
- Repository pattern: 1-1.5 days (code generation + iteration)
- Dependency injection: 1-1.5 days (refactoring + validation)
- Performance fixes: 0.5 day (targeted optimization)
- Integration & validation: 0.5-1 day (end-to-end testing)

**Note**: Agentic implementation is significantly faster than human development for:
- Repetitive refactoring patterns (DI across multiple files)
- Code generation following established patterns
- Systematic file restructuring

**Bottlenecks for AI agents**:
- Runtime validation (requires actual execution)
- Edge case discovery (emerges through testing)
- Architectural decision validation (requires human approval)

### 8.3 Risk Assessment

**Technical Risks**:
- **Medium**: Repository implementation might not handle all LanceDB edge cases initially
- **Low**: DI pattern is well-established, low risk of issues
- **Low**: Performance fix is straightforward once repository layer exists

**Mitigation**:
- Implement incrementally (one tool at a time)
- Regular commits as requested
- Keep old implementations until new ones validated

### 8.4 Alternative Approaches

**Option A: Minimal Changes (NOT Recommended)**
- Just fix performance issue (#2)
- Leave architecture as-is
- Quick but doesn't address root causes

**Option B: Add DI Framework (NOT Recommended)**
- Use InversifyJS or TSyringe
- More conventional but adds dependency
- User preference was to defer dependencies case-by-case

**Option C: Proposed Approach (Recommended)**
- Manual DI (constructor injection)
- Repository pattern
- Clean architecture principles
- Addresses root causes without heavy frameworks

---

## 9. Discussion Points

### 9.1 Repository Granularity

**Question**: Should we have:
- **Fine-grained repositories** (ChunkRepository, ConceptRepository, CatalogRepository)?
- **Coarse-grained repository** (single DatabaseRepository with all methods)?

**Recommendation**: Fine-grained. Each tool needs specific capabilities, and fine-grained repositories make dependencies explicit.

### 9.2 Embedding Service

**Question**: Should embedding generation be:
- **Part of repository** (repository handles embedding internally)?
- **Separate service** (injected into components that need it)?

**Recommendation**: Separate service. Embedding is a distinct concern that may be swapped (e.g., OpenAI embeddings vs local embeddings).

### 9.3 Query API Design

**Question**: Should repositories use:
- **Fluent API** (`repo.query().where(...).limit(...)`)?
- **Method per query** (`repo.findByConceptName(...)`)?
- **Query objects** (`repo.execute(new ConceptQuery(...))`)?

**Recommendation**: Method per query. Most explicit, easiest to type-safe, clearest intent.

### 9.4 Migration Strategy

**Question**: Should we:
- **Big bang refactor** (change everything at once)?
- **Incremental migration** (one tool at a time)?
- **Parallel implementation** (new architecture alongside old)?

**Recommendation**: Incremental migration with parallel implementation initially:
1. Create new repository layer
2. Migrate one tool (e.g., `ConceptSearchTool`)
3. Validate behavior matches
4. Migrate remaining tools
5. Remove old global state exports

---

## 10. Conclusion

The concept-rag codebase demonstrates good domain understanding and functional implementation, but suffers from architectural technical debt that will hinder future maintenance, testing, and scaling. The core issues stem from:

1. **Global mutable state** instead of dependency injection
2. **No separation** between business logic and infrastructure
3. **Performance limitations** from architectural decisions

These issues are addressable through systematic refactoring following clean architecture principles. The proposed changes will:

- ✅ Eliminate global state
- ✅ Enable comprehensive testing
- ✅ Improve scalability (solve memory loading issue)
- ✅ Enhance maintainability
- ✅ Preserve functionality (zero behavior changes)

The refactoring aligns with established architectural best practices from industry-standard sources (Clean Architecture, Design Patterns, Software Architecture: The Hard Parts) while respecting the project's constraints (single-user, no test framework additions, regular commits).

**Next Steps**: Proceed to detailed implementation planning for approved recommendations.

---

## Appendix A: File Structure Analysis

**Current Structure**:
```
src/
├── concepts/           # Concept extraction & processing
├── config.ts          # Configuration (module exports)
├── conceptual_index.ts # MCP server entry
├── lancedb/           # Database clients (global state)
├── simple_index.ts    # Alternative entry point
├── tools/             # Tool implementations
│   ├── base/          # Base tool class
│   ├── conceptual_registry.ts  # Tool registry
│   ├── operations/    # 8 tool implementations
│   └── simple_registry.ts
└── wordnet/           # WordNet integration
```

**Proposed Structure**:
```
src/
├── domain/                    # Core business logic (NEW)
│   ├── interfaces/            # Repository & service interfaces
│   │   ├── repositories/
│   │   └── services/
│   └── models/                # Domain models (Chunk, Concept, etc.)
├── application/               # Application services (NEW)
│   ├── tools/                 # Tool implementations (refactored)
│   │   ├── base/
│   │   └── operations/
│   └── container.ts           # DI container (NEW)
├── infrastructure/            # External concerns (NEW)
│   ├── lancedb/               # LanceDB implementations
│   │   ├── repositories/
│   │   ├── database-connection.ts
│   │   └── search-client.ts
│   ├── embeddings/            # Embedding services
│   └── wordnet/               # WordNet integration
├── concepts/                  # Keep for extraction logic
├── config.ts                  # Configuration
└── conceptual_index.ts        # MCP server entry (refactored)
```

**Rationale**: Follows clean architecture layering - domain at core, infrastructure at edges.

---

## Appendix B: References

### Knowledge Base Documents Consulted

1. **"Introduction to Software Design and Architecture With TypeScript"** by Khalil Stemmler
   - TypeScript-specific DI patterns, repository implementation, composition root
   - 314 total concepts including DI, IoC, repository pattern, hexagonal architecture, layered architecture
   - Uses TypeScript/Node.js examples throughout

2. **"Code That Fits in Your Head"** by Mark Seemann  
   - Practical heuristics for DI without frameworks, composition root pattern
   - 276 total concepts including constructor injection, repository pattern, ports & adapters
   - Node.js-friendly patterns, testing strategies for dependencies

3. **"Clean Architecture"** by Robert C. Martin
   - Dependency rule, separation of concerns
   - Entities vs. use cases vs. infrastructure boundaries

4. **"Software Architecture: The Hard Parts"** by Neal Ford et al.
   - Coupling analysis, trade-offs, architecture quantum
   - Distributed systems design patterns

5. **"Design Patterns"** by Gang of Four
   - Repository, Strategy, Dependency Injection patterns
   - Classic OOP design patterns catalog

6. **"Node.js Design Patterns"** by Mario Casciaro
   - Node.js-specific DI patterns, plugin architecture
   - DI container pros/cons, service locator vs DI, plugin wiring patterns
   - Tailored for Node.js ecosystem

7. **"A Philosophy of Software Design"** by John Ousterhout
   - Deep modules, information hiding
   - Managing complexity through strategic decomposition

8. **"Interface-Oriented Design"** by Ken Pugh
   - Programming to interfaces
   - Loosely coupled design principles

9. **"Programming TypeScript"** by Boris Cherny
   - TypeScript language features, type system, module patterns
   - Understanding TypeScript capabilities for architecture

10. **"Understanding Distributed Systems"** by Roberto Vitillo
    - Distributed systems principles (relevant for future scaling)
    - Performance considerations, fault tolerance

### Web Resources
- TypeScript best practices (general guidance)
- Node.js architecture patterns (limited specific results)
- Current industry standards for dependency management

### Code References
All file paths and line numbers referenced throughout this document point to the current codebase at `./src/`.

