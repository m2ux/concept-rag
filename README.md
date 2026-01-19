# 🧠 Knowledge Base Conceptual-Search Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

A RAG MCP server that enables LLMs to interact with local PDF/EPUB documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

---

**[Quick Start](#-quick-start)** • **[Setup](SETUP.md)** • **[Development](docs/development.md)** • **[Contributing](CONTRIBUTING.md)**

---

## 🎯 Intent-Based Tool Selection

Concept-RAG uses a [guided](prompts/guidance.md) **[Intent](prompts/intents/index.md) → [Skill](prompts/skills/index.md) → [Tool](docs/api-reference.md)** architecture to help AI agents select the right tools efficiently.

```
User Goal → Intent (problem domain) → Skill (solution domain) → Tools
```

Instead of choosing from 10 individual tools, agents:
1. **Match the user's goal** to an intent (e.g., "understand a topic", "explore a concept")
2. **Follow the skill workflow** which orchestrates the right tool sequence
3. **Synthesize the answer** with citations

This reduces context overhead and improves tool selection accuracy.

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
source .env

# Initial seeding (create database)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --overwrite

# Incremental seeding (add new documents only)
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

Restart your MCP client and start searching. See [SETUP.md](SETUP.md) for other IDEs.

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| [IDE Setup](prompts/ide-setup.md) | IDE integration instructions |
| [Database Schema](docs/database-schema.md) | Four-table normalized schema |
| [Architecture Decisions](docs/architecture/README.md) | ADRs for major decisions |
| [Development Guide](docs/development.md) | Project structure, build, scripts |
| [Test Suite](src/__tests__/README.md) | Test documentation |
| [Contributing](CONTRIBUTING.md) | How to contribute |

## 🙏 Acknowledgments

Forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). See [development guide](docs/development.md) for the full list of extensions.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.
