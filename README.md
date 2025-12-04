# 🧠 Conceptual-Search RAG Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)

A RAG MCP server that enables LLMs to interact with local PDF/EPUB documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

---

**🚀 [Quick Start](#-quick-start)** • **⚙️ [Setup Guide](SETUP.md)** • **📖 [Usage](USAGE.md)** • **💡 [Examples](EXAMPLES.md)** • **❓ [FAQ](FAQ.md)** • **🛠️ [Troubleshooting](TROUBLESHOOTING.md)**

---
## 📝 Available Tools

The server provides **10 specialized MCP tools** organized into four categories:

### Document Discovery
| Tool | Description | Example Query |
|------|-------------|---------------|
| `catalog_search` | Semantic search documents by topic, title, or author | `"software architecture patterns"` |
| `category_search` | Browse documents by category/domain | `"software engineering"` |
| `list_categories` | List all categories in your library | *(no query required)* |

### Content Search
| Tool | Description | Example Query |
|------|-------------|---------------|
| `broad_chunks_search` | Cross-document search (phrases, keywords, topics) | `"implementing dependency injection"` |
| `chunks_search` | Search within a specific known document | `"SOLID principles"` + source path |

### Concept Analysis
| Tool | Description | Example Query |
|------|-------------|---------------|
| `concept_search` | Find chunks by concept with fuzzy matching | `"design patterns"` |
| `extract_concepts` | Export all concepts from a document | `"Clean Architecture"` |
| `source_concepts` | Find documents where concept(s) appear (union) | `["TDD", "BDD"]` → all docs with either |
| `concept_sources` | Get per-concept source lists (separate arrays) | `["TDD", "BDD"]` → sources for each |
| `list_concepts_in_category` | Find concepts in a category | `"distributed systems"` |

**📖 Full API documentation:** See [docs/api-reference.md](docs/api-reference.md) for complete parameter specs and hybrid scoring weights.

**For AI agents:** See [tool-selection-guide.md](docs/tool-selection-guide.md) for the decision tree.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+ with NLTK
- OpenRouter API key ([sign up here](https://openrouter.ai/keys))
- MCP Client (Cursor or Claude Desktop)

### Installation

```bash
# Clone and build
git clone https://github.com/m2ux/concept-rag.git
cd concept-rag
npm install
npm run build

# Install WordNet
pip3 install nltk
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Configure API key
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

### Seed Your Documents

```bash
# Set environment
source .env

# Initial seeding (create database)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --overwrite

# Incremental seeding (add new documents only - much faster!)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs
```

**Seeding Options:**

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

**📝 Automatic Logging**: Each run creates a timestamped log file in `logs/seed-YYYY-MM-DDTHH-MM-SS.log` for troubleshooting and audit trails.

**📊 Progress Tracking**: Real-time progress bars show document processing, concept extraction, and index building stages.

**To seed specific documents**

```bash
# Seed specific documents by hash prefix (shown in seeding output)
npx tsx scripts/seed_specific.ts --hash 3cde 7f2b

# Or by filename pattern
npx tsx scripts/seed_specific.ts --pattern "Transaction Processing"
```

### Maintenance Scripts

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

See [scripts/README.md](scripts/README.md) for all maintenance utilities.

### Configure MCP Client

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

**Restart your MCP client** and start searching!

**📖 For complete setup instructions for various IDEs, see [SETUP.md](SETUP.md)**

## 🛠️ Development

### Project Structure

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
│   ├── search/                   # Hybrid search with 4-signal scoring
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

## 🏗️ Architecture

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
   (Vector + BM25 + Concepts + WordNet)
```

**Four-Table Normalized Schema:**
- **Catalog**: Document metadata with derived `concept_names`, `category_names`
- **Chunks**: Text segments with `catalog_title`, `concept_names`
- **Concepts**: Deduplicated index with lexical/adjacent relationships
- **Categories**: Hierarchical taxonomy with statistics

See [docs/database-schema.md](docs/database-schema.md) for complete schema documentation.

## 🎨 Design

This project follows well-documented architectural principles and design decisions:

### Architecture Decision Records (ADRs)

All major technical decisions are documented in **[Architecture Decision Records](docs/architecture/README.md)**.

### Documentation

- **[API Reference](docs/api-reference.md)** - Complete MCP tool documentation with parameters and scoring weights
- **[Database Schema](docs/database-schema.md)** - Four-table normalized schema with derived fields
- **[Tool Selection Guide](docs/tool-selection-guide.md)** - Decision tree for AI agents
- **[Test Suite](src/__tests__/README.md)** - Comprehensive test documentation with links to all E2E, integration, unit, and property tests

## 💬 Support & Community

## 🙏 Acknowledgments

This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). The original project provided the foundational MCP server architecture and LanceDB integration.

**This fork extends the original with:**

- 🔄 **Recursive self-improvement** - Used its own tools to discover and apply design patterns
- 📚 **Formal concept model** - Rigorous definition ensuring semantic matching and disambiguation
- 🧠 **Enhanced concept extraction** - 80-150+ concepts per document (Claude Sonnet 4.5)
- 🌐 **WordNet semantic enrichment** - Synonym expansion and hierarchical navigation
- 🔍 **Multi-signal hybrid ranking** - Vector + BM25 + title + concept + WordNet (4-signal scoring)
- 📖 **Large document support** - Multi-pass extraction for >100k token documents
- ⚡ **Parallel concept extraction** - Process up to 25 documents concurrently with shared rate limiting
- 🔁 **Resumable seeding** - Checkpoint-based recovery from interrupted runs
- 🛡️ **System resilience** - Circuit breaker, bulkhead, and timeout patterns for external services
- 📊 **Normalized schema (v7)** - Derived text fields eliminate ID cache lookups at runtime
- 🔗 **Concept relationships** - Adjacent (co-occurrence) and related (lexical) concept linking
- 🏥 **Health checks** - Database integrity verification with detailed reporting
- 🏗️ **Clean Architecture** - Domain-Driven Design patterns throughout (see [REFERENCES.md](REFERENCES.md))

We're grateful to the original author for creating and open-sourcing this excellent foundation!

### Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Pull request process
- Areas needing help

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
