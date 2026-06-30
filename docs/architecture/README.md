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
| `docs/architecture/` | Architecture deep-dives and decision records (ADRs) |
| `scripts/` | Maintenance and diagnostic utilities |
| `prompts/` | LLM prompt templates |

## Key Components

- **[Seeding Architecture](seeding-architecture.md)** - Document processing pipeline with checkpoint/recovery
- **[BM25 Keywords](bm25-keywords.md)** - Keyword-based search scoring  
- **[WordNet Enrichment](wordnet-enrichment.md)** - Semantic query expansion
- **[Database Schema](../database-schema.md)** - LanceDB table structures
- **[Stage Cache](../stage-cache-structure.md)** - Intermediate processing cache

Architectural decisions and their rationale are recorded as Architecture Decision
Records (ADRs) in the repository under `docs/architecture/`. ADRs are point-in-time
engineering artifacts and are not published to this site.
