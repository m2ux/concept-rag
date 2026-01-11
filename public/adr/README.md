# Architecture

This section covers the technical architecture of Concept-RAG.

## Repository Structure

| Directory | Contents |
|-----------|----------|
| `src/` | TypeScript source code |
| `src/application/` | Composition root, dependency injection |
| `src/domain/` | Domain models, services, interfaces |
| `src/infrastructure/` | Database adapters, search, embeddings, resilience |
| `src/concepts/` | Concept extraction, indexing, query expansion |
| `src/tools/` | MCP tool implementations (10 tools) |
| `src/wordnet/` | WordNet integration and strategies |
| `docs/` | MkDocs documentation site |
| `docs/architecture/` | Architecture Decision Records |
| `scripts/` | Maintenance and diagnostic utilities |
| `prompts/` | LLM prompt templates |

## Key Components

- **[Seeding Architecture](seeding-architecture.md)** - Document processing pipeline with checkpoint/recovery
- **[BM25 Keywords](bm25-keywords.md)** - Keyword-based search scoring  
- **[WordNet Enrichment](wordnet-enrichment.md)** - Semantic query expansion
- **[Database Schema](../database-schema.md)** - LanceDB table structures
- **[Stage Cache](../stage-cache-structure.md)** - Intermediate processing cache

For architectural decisions and their rationale, see the **[ADRs](../architecture/adr0001-typescript-nodejs-runtime.md)** section.
