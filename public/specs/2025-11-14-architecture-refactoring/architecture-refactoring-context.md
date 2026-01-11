# Architecture Refactoring Context

**Purpose**: Files relevant for refactoring concept-rag to use dependency injection, repository pattern, and clean architecture

**Last Updated**: November 14, 2025

---

## PRIMARY - Files to Modify (Core Refactoring)

### Database Layer (Global State → Service Classes)
- `src/lancedb/conceptual_search_client.ts` - **CRITICAL**: Contains global mutable state (export let)
- `src/lancedb/hybrid_search_client.ts` - Global state, duplicate embedding logic
- `src/lancedb/simple_client.ts` - Global state (alternative implementation)

### Tool Implementations (Direct Dependencies → Injected Dependencies)
- `src/tools/operations/concept_search.ts` - Loads all chunks into memory, SQL injection risk
- `src/tools/operations/conceptual_catalog_search.ts` - Uses global state
- `src/tools/operations/conceptual_chunks_search.ts` - Uses global state
- `src/tools/operations/conceptual_broad_chunks_search.ts` - Uses global state
- `src/tools/operations/document_concepts_extract.ts` - Uses global state
- `src/tools/base/tool.ts` - Base class for all tools

### Tool Registry (Eager Instantiation → Factory Pattern)
- `src/tools/conceptual_registry.ts` - Creates tools at module load time
- `src/tools/simple_registry.ts` - Alternative registry

### Server Entry Point (Initialization Sequence)
- `src/conceptual_index.ts` - Main server, connects to DB, sets up MCP handlers
- `src/simple_index.ts` - Alternative entry point

### Concept Processing (Business Logic - Keep Pure)
- `src/concepts/concept_extractor.ts` - LLM-based extraction (keep pure)
- `src/concepts/query_expander.ts` - Duplicate embedding logic
- `src/concepts/concept_chunk_matcher.ts` - Matching logic
- `src/concepts/concept_index.ts` - Index building
- `src/concepts/types.ts` - Type definitions

### Configuration
- `src/config.ts` - Configuration constants

---

## REFERENCE - Pattern Examples from New Knowledge Sources

### TypeScript DI Patterns (Khalil Stemmler)
- Constructor injection pattern
- Composition root pattern
- Repository interface design
- Layered architecture structure
- Domain/Application/Infrastructure separation

### Practical DI (Mark Seemann)
- Manual DI without frameworks
- Composition root at entry point
- Repository pattern implementation
- Decorator pattern for cross-cutting concerns
- Testing strategies

### Node.js Patterns (Mario Casciaro)
- DI container pros/cons
- Service locator vs DI
- Plugin architecture (relevant for MCP tools)

---

## PROPOSED STRUCTURE (Post-Refactoring)

```
src/
├── domain/                          # NEW - Core business logic
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   ├── chunk-repository.ts
│   │   │   ├── concept-repository.ts
│   │   │   └── catalog-repository.ts
│   │   └── services/
│   │       └── embedding-service.ts
│   └── models/
│       ├── chunk.ts
│       ├── concept.ts
│       └── search-result.ts
│
├── application/                     # NEW - Use cases/tools
│   ├── tools/
│   │   ├── base/
│   │   │   └── tool.ts            # Refactored
│   │   └── operations/             # Refactored tools
│   │       ├── concept-search.ts
│   │       ├── catalog-search.ts
│   │       ├── chunks-search.ts
│   │       ├── broad-chunks-search.ts
│   │       └── document-concepts-extract.ts
│   └── container.ts                 # NEW - DI container
│
├── infrastructure/                  # NEW - External concerns
│   ├── lancedb/
│   │   ├── repositories/            # NEW
│   │   │   ├── lancedb-chunk-repository.ts
│   │   │   ├── lancedb-concept-repository.ts
│   │   │   └── lancedb-catalog-repository.ts
│   │   ├── database-connection.ts   # NEW - Replaces global state
│   │   └── search-client.ts         # Refactored
│   ├── embeddings/                  # NEW
│   │   └── simple-embedding-service.ts
│   └── wordnet/
│       └── wordnet-service.ts       # Existing, keep as-is
│
├── concepts/                        # KEEP - Domain logic
│   ├── concept_extractor.ts
│   ├── query_expander.ts           # Refactor to use injected service
│   ├── concept_chunk_matcher.ts
│   ├── concept_index.ts
│   └── types.ts
│
├── config.ts                        # KEEP
└── conceptual_index.ts              # REFACTOR - Use container
```

---

## INTEGRATION POINTS

### MCP Server Integration
- `src/conceptual_index.ts` - Main entry point
  - Currently: Calls `connectToLanceDB()` which mutates globals
  - Future: Create `ApplicationContainer`, get tools from container

### Tool Execution Flow
- Server receives MCP request → Looks up tool by name → Calls `tool.execute()`
- Currently: Tools reach for global `chunksTable`, `catalogTable`, `conceptTable`
- Future: Tools use injected repositories

### Database Lifecycle
- Currently: `connectToLanceDB()` function mutates module-level `let` variables
- Future: `DatabaseConnection` class with explicit lifecycle, passed to repositories

---

## SHARED UTILITIES (Keep As-Is)

### Concept Processing (Pure Logic)
- `src/concepts/concept_extractor.ts` - LLM calls (minimal refactoring)
- `src/concepts/concept_chunk_matcher.ts` - Matching algorithms
- `src/wordnet/wordnet_service.ts` - WordNet bridge (has own caching)

### Seeding Scripts (Out of Scope for Now)
- `hybrid_fast_seed.ts` - Bulk data loading script
- `scripts/*.ts` - CLI utilities

---

## KEY ISSUES TO ADDRESS

### Issue #1: Global Mutable State
**Files**: All `lancedb/*_client.ts` files
**Problem**: `export let client`, `export let chunksTable`, etc.
**Solution**: Replace with `DatabaseConnection` class, pass to repository constructors

### Issue #2: No Dependency Injection
**Files**: All `tools/operations/*.ts` files
**Problem**: `import { chunksTable } from "../../lancedb/..."`
**Solution**: Constructor injection of repository interfaces

### Issue #3: Performance (Loading All Chunks)
**File**: `src/tools/operations/concept_search.ts:91-98`
**Problem**: Loads all chunks into memory
**Solution**: Repository method using vector search

### Issue #4: Code Duplication (Embeddings)
**Files**: `lancedb/hybrid_search_client.ts`, `concepts/query_expander.ts`
**Problem**: Same `createSimpleEmbedding()` function duplicated
**Solution**: Single `EmbeddingService` interface with implementation

### Issue #5: Eager Tool Instantiation
**File**: `src/tools/conceptual_registry.ts`
**Problem**: `export const tools = [new Tool(), ...]` at module load
**Solution**: Tool factory or container-based tool creation

### Issue #6: SQL Injection Risk
**File**: `src/tools/operations/concept_search.ts:74`
**Problem**: String interpolation in WHERE clause
**Solution**: Parameterized queries or query builder

---

## MIGRATION STRATEGY

### Phase 1: Repository Pattern (Priority 1)
1. Create repository interfaces in `domain/interfaces/repositories/`
2. Implement LanceDB repositories in `infrastructure/lancedb/repositories/`
3. Migrate `ConceptSearchTool` to use repositories (pilot)
4. Validate behavior matches original
5. Migrate remaining tools

### Phase 2: Dependency Injection (Priority 2)
1. Create `ApplicationContainer` in `application/container.ts`
2. Refactor tool constructors to accept dependencies
3. Update `conceptual_index.ts` to use container
4. Remove global state exports from database clients

### Phase 3: Performance & Polish (Priority 3-6)
1. Implement efficient concept search (vector search, not loading all)
2. Refactor database client layer (no module-level state)
3. Create interface abstractions
4. Extract shared embedding service
5. Fix SQL injection vulnerability

---

## TESTING STRATEGY (Future)

### Manual Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector dist/conceptual_index.js ~/.concept_rag
```

### Validation Checklist per Tool
- [ ] Tool returns same results as before
- [ ] Performance comparable or better
- [ ] No runtime errors
- [ ] Proper error messages on failure

---

## NOTES

- User preference: **Breaking changes acceptable**
- User preference: **Regular commits** between changes
- User preference: **Work on branch**
- User requirement: **Performance should not degrade with large document collections**
- Agentic timeline: **3-5 days** for complete refactoring

---

## ADDITIONAL CONTEXT

See:
- `.ai/reviews/2025-11-14-concept-rag-architecture-review-analysis.md` - Full analysis
- Khalil Stemmler's book (in knowledge base) - TypeScript DI patterns
- Mark Seemann's book (in knowledge base) - Practical DI heuristics
- Node.js Design Patterns book (in knowledge base) - Node-specific patterns

