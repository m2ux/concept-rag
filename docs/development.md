# Development

## Key Features

This fork extends the original [lance-mcp](https://github.com/adiom-data/lance-mcp) with:

- 🔄 **Recursive self-improvement** - Used its own tools to discover and apply design patterns
- 📚 **Formal concept model** - Rigorous definition ensuring semantic matching and disambiguation
- 🧠 **Enhanced concept extraction** - 80-150+ concepts per document (Claude Sonnet 4.5)
- 🌐 **WordNet semantic enrichment** - Synonym expansion and hierarchical navigation
- 🔍 **Multi-signal hybrid ranking** - Vector + BM25 + title + concept + WordNet (5-signal scoring)
- 📖 **Large document support** - Multi-pass extraction for >100k token documents
- ⚡ **Parallel concept extraction** - Process up to 25 documents concurrently with shared rate limiting
- 🔁 **Resumable seeding** - Checkpoint-based recovery from interrupted runs
- 🛡️ **System resilience** - Circuit breaker, bulkhead, and timeout patterns for external services
- 📊 **Normalized schema (v7)** - Derived text fields eliminate ID cache lookups at runtime
- 🔗 **Concept relationships** - Adjacent (co-occurrence) and related (lexical) concept linking
- 🏥 **Health checks** - Database integrity verification with detailed reporting
- 🏗️ **Clean Architecture** - Domain-Driven Design patterns throughout (see [REFERENCES.md](../REFERENCES.md))

## Project Structure

```
src/
├── conceptual_index.ts           # MCP server entry point
├── application/                  # Composition root (DI)
├── domain/                       # Domain models, services, interfaces
│   ├── models/                   # Chunk, Concept, SearchResult
│   ├── services/                 # Domain services (search logic)
│   └── interfaces/               # Repository and service interfaces
├── infrastructure/               # External integrations
│   ├── lancedb/                  # Database adapters (normalized schema v7)
│   ├── embeddings/               # Embedding service
│   ├── search/                   # Hybrid search with 5-signal scoring
│   ├── resilience/               # Circuit breaker, bulkhead, timeout patterns
│   ├── checkpoint/               # Resumable seeding with progress tracking
│   ├── cli/                      # Progress bar display utilities
│   └── document-loaders/         # PDF, EPUB loaders with OCR fallback
├── concepts/                     # Concept extraction & indexing
│   ├── concept_extractor.ts      # LLM-based extraction
│   ├── parallel-concept-extractor.ts  # Concurrent document processing
│   ├── concept_index.ts          # Index builder with lexical linking
│   ├── query_expander.ts         # Query expansion with WordNet
│   └── summary_generator.ts      # LLM summary generation
├── wordnet/                      # WordNet integration
└── tools/                        # MCP tools (10 operations)

scripts/
├── health-check.ts               # Database integrity verification
├── rebuild_derived_names.ts      # Regenerate derived text fields
├── link_related_concepts.ts      # Build concept relationship graph
├── seed_specific.ts              # Targeted document re-seeding
└── analyze-backups.ts            # Backup comparison and analysis
```

## Architecture

```
     PDF/EPUB Documents
            ↓
   Processing + OCR fallback
            ↓
  ┌─────────┼─────────┐
  ↓         ↓         ↓
Catalog   Chunks   Concepts   Categories
(docs)    (text)   (index)    (taxonomy)
  └─────────┴─────────┴─────────┘
            ↓
    Hybrid Search Engine
   (Vector + BM25 + Title + Concepts + WordNet)
```

### Four-Table Normalized Schema

- **Catalog**: Document metadata with derived `concept_names`, `category_names`
- **Chunks**: Text segments with `catalog_title`, `concept_names`
- **Concepts**: Deduplicated index with lexical/adjacent relationships
- **Categories**: Hierarchical taxonomy with statistics

See [database-schema.md](database-schema.md) for complete schema documentation.

## Design Principles

This project follows Clean Architecture and Domain-Driven Design patterns.

### Architecture Decision Records (ADRs)

All major technical decisions are documented in **[Architecture Decision Records](architecture/README.md)**.

### Key Documentation

- **[API Reference](api-reference.md)** - Complete MCP tool documentation with JSON I/O schemas
- **[Activity/Skill Architecture](architecture/skills-interface.md)** - Activity-based tool selection
- **[Database Schema](database-schema.md)** - Four-table normalized schema with derived fields
- **[Test Suite](../src/__tests__/README.md)** - Comprehensive test documentation

## Building

```bash
npm install
npm run build
```

## Testing

```bash
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
```

## Seeding Options

| Flag | Description |
|------|-------------|
| `--filesdir` | Directory containing PDF/EPUB files (required) |
| `--dbpath` | Database path (default: `~/.concept_rag`) |
| `--overwrite` | Drop and recreate all database tables |
| `--parallel N` | Process N documents concurrently (default: 10, max: 25) |
| `--resume` | Skip documents already in checkpoint (for interrupted runs) |
| `--clean-checkpoint` | Clear checkpoint file and start fresh |
| `--rebuild-concepts` | Rebuild concept index even if no new documents |
| `--auto-reseed` | Re-process documents with incomplete metadata |
| `--max-docs N` | Process at most N new documents (for batching) |
| `--with-wordnet` | Enable WordNet enrichment (disabled by default) |
| `--populate-summaries[=targets]` | Fill in missing summaries only, no `--filesdir` needed |
| `--force-summaries` | With `--populate-summaries`: regenerate every summary |
| `--dry-run` | With `--populate-summaries`: report only, no LLM calls or writes |

**Rebuild summaries without re-seeding:**

```bash
# Report what is missing across catalog, concepts and categories
npx tsx hybrid_fast_seed.ts --populate-summaries --dry-run

# Fill the gaps (targets default to all three tables)
RUST_LOG=error npx tsx hybrid_fast_seed.ts --populate-summaries=concepts
```

Document overviews are regenerated from existing chunks (and the catalog vector
re-embedded, since it encodes the summary); concept and category summaries are
generated from their names. Writes go through a merge-insert keyed on `id`, so
every other column survives and the run is resumable.

**Seed specific documents:**

```bash
# By hash prefix (shown in seeding output)
npx tsx scripts/seed_specific.ts --hash 3cde 7f2b

# By filename pattern
npx tsx scripts/seed_specific.ts --pattern "Transaction Processing"
```

## Maintenance Scripts

```bash
# Health check - verify database integrity
npx tsx scripts/health-check.ts

# Rebuild derived name fields (after schema changes)
npx tsx scripts/rebuild_derived_names.ts --dbpath ~/.concept_rag

# Link related concepts (lexical similarity)
npx tsx scripts/link_related_concepts.ts --dbpath ~/.concept_rag

# Analyze backup differences
npx tsx scripts/analyze-backups.ts backup1/ backup2/
```

See [../scripts/README.md](../scripts/README.md) for all maintenance utilities.
