# 🧠 Conceptual-Search RAG Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)

A powerful RAG MCP server that enables LLMs to interact with local PDF/EPUB documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

---

**🚀 [Quick Start](#-quick-start)** • **⚙️ [Setup Guide](SETUP.md)** • **📖 [Usage](USAGE.md)** • **💡 [Examples](EXAMPLES.md)** • **❓ [FAQ](FAQ.md)** • **🛠️ [Troubleshooting](TROUBLESHOOTING.md)**

---
## 📝 Available Tools

The server provides **11 specialized MCP tools** organized into four categories:

### Content Discovery
| Tool | Description | Example Query |
|------|-------------|---------------|
| `catalog_search` | Find documents by topic, title, or author (semantic search) | `"software architecture patterns"` |
| `concept_search` | Fuzzy search concepts by description/meaning | `"design patterns for loose coupling"` |

### Content Search
| Tool | Description | Example Query |
|------|-------------|---------------|
| `broad_chunks_search` | Cross-document search (phrases, keywords, topics) | `"implementing dependency injection"` |
| `chunks_search` | Search within a specific known document | `"SOLID principles"` + source path |
| `concept_chunks` | Find chunks tagged with a concept (high precision) | `"innovation"` → semantically-tagged results |

### Concept Analysis
| Tool | Description | Example Query |
|------|-------------|---------------|

| `extract_concepts` | Export all concepts from a document | `"Clean Architecture"` |
| `source_concepts` | Find documents where concept(s) appear (union) | `["TDD", "BDD"]` → all docs with either |
| `concept_sources` | Get per-concept source lists (separate arrays) | `["TDD", "BDD"]` → sources for each |

### Category Browsing
| Tool | Description | Example Query |
|------|-------------|---------------|
| `category_search` | Browse documents by category/domain | `"software engineering"` |
| `list_categories` | List all categories in your library | *(no query required)* |
| `list_concepts_in_category` | Find concepts in a category | `"distributed systems"` |

**📖 Full API documentation:** See [docs/api-reference.md](docs/api-reference.md) for complete parameter specs.

**For AI agents:** See [tool-selection-guide.md](tool-selection-guide.md) for the decision tree.
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

# Rebuild concept index (after algorithm updates)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --rebuild-concepts

# Fix incomplete catalog records
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --auto-reseed
```

**📝 Automatic Logging**: Each run creates a timestamped log file in `logs/seed-YYYY-MM-DDTHH-MM-SS.log` for troubleshooting and audit trails.

**To seed specific documents**

```bash
# Seed specific documents by hash prefix (shown in seeding output)
npx tsx scripts/seed_specific.ts --hash 3cde 7f2b

# Or by filename pattern
npx tsx scripts/seed_specific.ts --pattern "Transaction Processing"
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
│   ├── lancedb/                  # Database adapters
│   ├── embeddings/               # Embedding service
│   ├── search/                   # Hybrid search implementation
│   └── document-loaders/         # PDF, EPUB loaders
├── concepts/                     # Concept extraction & indexing
│   ├── concept_extractor.ts      # LLM-based extraction
│   ├── concept_index.ts          # Index builder
│   ├── query_expander.ts         # Query expansion
│   └── summary_generator.ts      # LLM summary generation
├── wordnet/                      # WordNet integration
└── tools/                        # MCP tools (11 operations)
```

## 🏗️ Architecture

```
              PDF Documents 
                   ↓
     Processing (with OCR fallback)
                   ↓
  ┌────────────────┬────────────────┐
  │                │                │
Concept         Summary           Chunks
Extraction      Generation        Creation
  ↓                ↓                ↓
Concepts         Catalog          Chunks
Table            Table            Table
  └────────────────┴────────────────┘
                   │
         Conceptual Search Engine
                   │
     ┌─────────────┼─────────────┐
     │             │             │
   Corpus       WordNet        Hybrid
  Concepts     Synonyms       Scoring
```

## 🎨 Design

This project follows well-documented architectural principles and design decisions. For comprehensive design documentation, see:

### Architecture Decision Records (ADRs)

All major technical decisions are documented in **[Architecture Decision Records](docs/architecture/README.md)**.

### Concept Lexicon

The **[Concept Lexicon](docs/concept-lexicon.md)** catalogs concepts from the local knowledge base that are directly applicable to this project, organized by functional area: This lexicon serves as a reference for understanding the conceptual foundations that inform the project's design decisions.

## 💬 Support & Community

## 🙏 Acknowledgments

This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). The original project provided the foundational MCP server architecture and LanceDB integration.

**This fork extends the original with:**

- 🔄 **Recursive self-improvement** - Used its own tools to discover and apply design patterns
- 📚 **Formal concept model** - Rigorous definition ensuring semantic matching and disambiguation
- 🧠 **Enhanced concept extraction** - 80-150+ concepts per document (Claude Sonnet 4.5)
- 🌐 **WordNet semantic enrichment** - Synonym expansion and hierarchical navigation
- 🔍 **Multi-signal hybrid ranking** - Vector + BM25 + title + WordNet
- 📖 **Large document support** - Multi-pass extraction for >100k token documents
- ⚡ **Incremental seeding** - Fast updates for new/changed documents only
- 🛡️ **Robust error handling** - Better JSON parsing, debug logging, OCR fallback
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
