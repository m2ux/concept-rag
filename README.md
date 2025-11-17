# 🧠 Conceptual-Search RAG Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)

A powerful RAG MCP server that enables LLMs to interact with documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

---

**🚀 [Quick Start](#-quick-start)** • **⚙️ [Setup Guide](SETUP.md)** • **📖 [Usage](USAGE.md)** • **💡 [Examples](EXAMPLES.md)** • **❓ [FAQ](FAQ.md)** • **🛠️ [Troubleshooting](TROUBLESHOOTING.md)**

---

## ✨ Key Features

- 🧠 **5 Specialized Search Tools** - Optimized for different search modalities (concept research, document discovery, comprehensive search, single-document, concept export)
- 🔍 **Multi-Signal Hybrid Ranking** - Vector similarity + BM25 keyword + concept matching + title matching + WordNet expansion
- 🤖 **LLM-Powered Extraction** - Claude Sonnet 4.5 extracts 80-150+ concepts per document with formal semantic model
- 🌐 **WordNet Integration** - Automatic synonym expansion and hierarchical navigation (161K+ words)
- 🛡️ **Robust PDF Handling** - Gracefully handles corrupted files with OCR fallback for scanned documents
- 📚 **Large Document Support** - Multi-pass extraction for documents >100k tokens
- ⚡ **Incremental Seeding** - Smart detection skips already-processed files for fast updates
- 💡 **Intelligent Tool Selection** - Embedded documentation guides AI agents to optimal tool choice
- 🔄 **Recursive Self-Improvement** - Built using its own concept search to discover design patterns from indexed technical books

## 📝 Available Tools

The server provides five specialized search tools. **For AI agents:** See [tool-selection-guide.md](tool-selection-guide.md) for the complete decision tree.

| Tool | Best For | Use When | Example Query |
|------|----------|----------|---------------|
| `catalog_search` | Document discovery | Looking for documents by title, author, topic | `"What documents do I have about strategy?"` |
| `concept_search` | Concept research (high precision) | Researching a specific concept | `"innovation"` → Returns concept-tagged chunks |
| `broad_chunks_search` | Comprehensive cross-document search | Searching phrases, keywords, questions | `"How do organizations implement strategic planning?"` |
| `chunks_search` | Single document search | You know the exact document path | After catalog_search, search within specific document |
| `extract_concepts` | Concept export | Explicitly extracting/listing concepts | `"Extract concepts from Sun Tzu as markdown"` |

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

**Claude Desktop** (see [SETUP.md](SETUP.md) for config file locations)

**Restart your MCP client** and start searching!

**📖 For complete setup instructions, see [SETUP.md](SETUP.md)**

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](SETUP.md)** | **Complete installation and configuration guide** |
| [USAGE.md](USAGE.md) | Tool details and workflow examples |
| [EXAMPLES.md](EXAMPLES.md) | Real-world usage scenarios |
| [FAQ.md](FAQ.md) | Frequently asked questions |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Complete troubleshooting guide |
| [REFERENCES.md](REFERENCES.md) | Design patterns and book sources |
| [tool-selection-guide.md](tool-selection-guide.md) | AI agent tool selection guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [SECURITY.md](SECURITY.md) | Security policy |

## 🧠 Concept Model

This system uses a **formal concept definition** ensuring high-quality semantic search:

> **A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

**✅ INCLUDE:** Domain terms, theories, methodologies, multi-word conceptual phrases, phenomena, abstract principles  
**❌ EXCLUDE:** Temporal descriptions, action phrases, suppositions, proper names, dates

## 🛠️ Development

### Quick Testing

```bash
# Build
npm run build

# Interactive testing (MCP Inspector)
npx @modelcontextprotocol/inspector dist/conceptual_index.js ~/.concept_rag

# Command-line concept extraction
npx tsx scripts/extract_concepts.ts "document name" markdown
```

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
│   └── query_expander.ts         # Query expansion
├── wordnet/                      # WordNet integration
└── tools/                        # MCP tools (5 search operations)
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
(Sonnet 4.5)    (Grok-4-fast)    (Local)
[Formal Model]  [Fast]           [Hybrid]
  ↓                ↓                ↓
Concepts         Catalog          Chunks
Table            Table            Table
  └────────────────┴────────────────┘
                   │
         Conceptual Search Engine
              (5 signals)
                   │
     ┌─────────────┼─────────────┐
     │             │             │
  Corpus       WordNet        Hybrid
  Concepts     Synonyms       Scoring
```

## 💰 Cost Breakdown

**Seeding costs (one-time per document):**
- Concept extraction: ~$0.041/doc (Claude Sonnet 4.5)
- Summarization: ~$0.007/doc (Grok-4-fast)
- **Total: ~$0.048 per document**

**Runtime search:** No additional API calls (vector search is local)

**Time & cost examples:**
- Initial 100 docs: ~25 minutes + ~$4.80
- Add 10 new docs: ~3 minutes + ~$0.48 (incremental)
- Add 1 new doc: ~15 seconds + ~$0.05 (incremental)

**Note:** AI agent usage (Cursor, Claude Desktop) incurs separate costs for processing search results.

## 💬 Support & Community

### Getting Help

- 📖 **Documentation**: [SETUP.md](SETUP.md), [USAGE.md](USAGE.md), [FAQ.md](FAQ.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/m2ux/concept-rag/issues)
- 💡 **Questions & Discussions**: [GitHub Discussions](https://github.com/m2ux/concept-rag/discussions)
- 🔒 **Security Issues**: [SECURITY.md](SECURITY.md)
- 🛠️ **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Pull request process
- Areas needing help

## 🙏 Acknowledgments

This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). The original project provided the foundational MCP server architecture and LanceDB integration.

**This fork extends the original with:**

- 🔄 **Recursive self-improvement** - Used its own tools to discover and apply design patterns
- 📚 **Formal concept model** - Rigorous definition ensuring semantic matching and disambiguation
- 🧠 **Enhanced concept extraction** - 80-150+ concepts per document (Claude Sonnet 4.5)
- 🌐 **WordNet semantic enrichment** - Synonym expansion and hierarchical navigation
- 🔍 **Multi-signal hybrid ranking** - Vector + BM25 + concept + title + WordNet
- 📖 **Large document support** - Multi-pass extraction for >100k token documents
- ⚡ **Incremental seeding** - Fast updates for new/changed documents only
- 🛡️ **Robust error handling** - Better JSON parsing, debug logging, OCR fallback
- 🏗️ **Clean Architecture** - Domain-Driven Design patterns throughout (see [REFERENCES.md](REFERENCES.md))

We're grateful to the original author for creating and open-sourcing this excellent foundation!

## 📊 Project Status

- ✅ **Stable**: v1.0.0
- 🔄 **Actively maintained**: Regular updates and bug fixes
- 📈 **Growing**: New features and improvements planned

## ⭐ Show Your Support

If you find Concept-RAG useful, please:
- ⭐ Star the repository
- 🐛 Report bugs and suggest features
- 📝 Share your use cases
- 🤝 Contribute improvements

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
