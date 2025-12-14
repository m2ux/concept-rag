# Concept-RAG Documentation

Welcome to the **Concept-RAG** documentation. This site provides comprehensive documentation for the Conceptual-Search RAG Server - a RAG MCP server that enables LLMs to interact with local PDF/EPUB documents through conceptual search.

---

## What is Concept-RAG?

Concept-RAG combines **corpus-driven concept extraction**, **WordNet semantic enrichment**, and **multi-signal hybrid ranking** powered by LanceDB for superior retrieval accuracy.

### Key Features

- 🧠 **Conceptual Search** - Search by meaning, not just keywords
- 🔍 **Hybrid Ranking** - 4-signal scoring (Vector + BM25 + Concepts + WordNet)
- 📚 **Multi-Format Support** - PDF and EPUB documents
- 🏷️ **Auto-Categorization** - 46 auto-extracted categories
- ⚡ **High Performance** - 80x-240x faster searches with optimized indexing
- 🛡️ **Resilient Architecture** - Circuit breaker, bulkhead, and timeout patterns

---

## Quick Navigation

<div class="grid cards" markdown>

- :material-api: **[API Reference](api-reference.md)**
  
    Complete MCP tool documentation with parameters and scoring weights

- :material-file-tree: **[Database Schema](database-schema.md)**
  
    Four-table normalized schema with derived fields

- :material-compass: **[Tool Selection Guide](tool-selection-guide.md)**
  
    Decision tree for AI agents selecting the right tool

- :material-book-open-variant: **[Architecture Decisions](architecture/README.md)**
  
    49 ADRs documenting all major technical decisions

</div>

---

## Available Tools

The server provides **10 specialized MCP tools** organized into four categories:

### Document Discovery

| Tool | Description |
|------|-------------|
| `catalog_search` | Semantic search documents by topic, title, or author |
| `category_search` | Browse documents by category/domain |
| `list_categories` | List all categories in your library |

### Content Search

| Tool | Description |
|------|-------------|
| `broad_chunks_search` | Cross-document search (phrases, keywords, topics) |
| `chunks_search` | Search within a specific known document |

### Concept Analysis

| Tool | Description |
|------|-------------|
| `concept_search` | Find chunks by concept with fuzzy matching |
| `extract_concepts` | Export all concepts from a document |
| `source_concepts` | Find documents where concept(s) appear |
| `concept_sources` | Get per-concept source lists |
| `list_concepts_in_category` | Find concepts in a category |

---

## Architecture Overview

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

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+ with NLTK
- OpenRouter API key
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
```

For complete setup instructions, see the [GitHub README](https://github.com/m2ux/concept-rag#readme).

---

## Project Links

- **GitHub Repository**: [m2ux/concept-rag](https://github.com/m2ux/concept-rag)
- **Issues**: [Report a bug](https://github.com/m2ux/concept-rag/issues)
- **Contributing**: [Contribution guidelines](https://github.com/m2ux/concept-rag/blob/main/CONTRIBUTING.md)
