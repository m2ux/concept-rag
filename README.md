# 🧠 Conceptual KB Base Search Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

A RAG MCP server that enables LLMs to interact with a vector database chunked library of local PDF/EPUB documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB to augment retrieval accuracy. 

---

**[Quick Start](#-quick-start)** • **[Setup](SETUP.md)** • **[Development](docs/development.md)** • **[Contributing](CONTRIBUTING.md)**

---

## 🎯 Overview
Concept-RAG uses an **Intent → Skill → Tool** architecture to help AI agents to efficiently acquire knowledge.

```
User Goal → Intent (problem domain) → Skill (solution domain) → Tools
```

After initial setup of an always-applied [rule](prompts/ide-setup.md), agents are able to use an exposed [guidance]((prompts/guidance.md)) resource to:
1. **Match the user's goal** to an [intent](prompts/intents/index.md) (e.g., "understand a topic", "explore a concept")
2. **Follow the [skill](prompts/skills/index.md) workflow** which orchestrates the right [tool](docs/api-reference.md) sequence
3. **Synthesize the answer** with citations

This reduces context overhead and provides deterministic tool selection.

---

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
| [Database Schema](docs/database-schema.md) | Four-table normalized schema |
| [Architecture Decisions](docs/architecture/README.md) | ADRs for major decisions |
| [Test Suite](src/__tests__/README.md) | Test documentation |

## 🙏 Acknowledgments

Forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). See [development guide](docs/development.md) for the full list of extensions.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.
