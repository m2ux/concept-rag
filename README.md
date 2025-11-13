# 🧠 Concept RAG: Conceptual RAG Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful MCP server that enables LLMs to interact with documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

## ✨ Features

- 🧠 **5 Search Tools**: Optimized for different search modalities (concept research, document discovery, comprehensive search, single-document, concept export)
- 🔍 **Multi-Signal Hybrid Ranking**: Vector similarity + BM25 keyword matching + concept matching + title matching + WordNet expansion
- 🤖 **LLM-Powered Extraction**: Claude Sonnet 4.5 for concept extraction, Grok-4-fast for summaries
- 🌐 **WordNet Integration**: Automatic synonym expansion and hierarchical concept navigation (161K+ words)
- 🛡️ **Robust PDF Handling**: Gracefully handles corrupted files with OCR fallback
- 📚 **Large Document Support**: Multi-pass extraction for documents >100k tokens
- 💡 **Intelligent Tool Selection**: Embedded documentation guides AI agents to optimal tool choice

## 📝 Available Tools

The server provides five specialized search tools. **For detailed tool selection guidance, see [tool-selection-guide.md](tool-selection-guide.md).**

### Quick Reference

| Tool | Best For | Use When | Example Query |
|------|----------|----------|---------------|
| `catalog_search` | Document discovery | Looking for documents by title, author, topic | `"What documents do I have about strategy?"` |
| `concept_search` | Concept research (high precision) | Researching a specific concept | `"innovation"` → Returns concept-tagged chunks |
| `broad_chunks_search` | Comprehensive cross-document search | Searching phrases, keywords, questions | `"How do organizations implement strategic planning?"` |
| `chunks_search` | Single document search | You know the exact document path | After catalog_search, search within specific document |
| `extract_concepts` | Concept export | Explicitly extracting/listing concepts | `"Extract concepts from Sun Tzu as markdown"` |

**Note:** For `extract_concepts` command-line usage: `npx tsx scripts/extract_concepts.ts "document name" markdown`

---

### 🤖 For AI Agents

**Critical:** Each tool has embedded documentation that specifies:
- When to use vs. not use
- Query type expectations  
- Return value characteristics

See [tool-selection-guide.md](tool-selection-guide.md) for the complete decision tree and tool comparison matrix.

## 🚀 Quick Start

**Requirements:**

- Node.js 18+
- OpenRouter API key ([sign up here](https://openrouter.ai/keys))
- Python 3.9+ with NLTK (for WordNet)
- MCP Client (Claude Desktop or Cursor)

### 1. Setup Environment

```bash
# Clone and install
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

### 2. Configure MCP Client

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

**Claude Desktop:**

- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

## 🎬 End-to-End Walkthrough

**Complete setup from PDFs to working conceptual search in 15 minutes!**

### Step 1: Setup & Build

```bash
# Clone and build
git clone https://github.com/m2ux/concept-rag.git
cd concept-rag
npm install
npm run build
```

### Step 2: Install WordNet

```bash
# Install Python NLTK
pip3 install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Verify installation
python3 -c "from nltk.corpus import wordnet as wn; print(f'✅ WordNet ready: {len(list(wn.all_synsets()))} synsets')"
```

### Step 3: Configure OpenRouter API Key

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your OpenRouter API key
# Get one at: https://openrouter.ai/keys
nano .env  # or use your preferred editor
```

### Step 4: Seed Your Documents

```bash
# Set environment
source .env

# Initial seeding (create database from scratch)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --overwrite

# OR: Incremental seeding (add new/changed documents only - much faster!)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs
  # Note: Omit --overwrite to skip already-processed files
```

**What happens during seeding:**

- 📄 Loads PDF files (with OCR fallback for scanned documents)
- 🔍 **Smart detection**: Skips files already in database (unless `--overwrite` used)
- 🧠 Extracts 100+ concepts per document (Claude Sonnet 4.5)
- 📝 Generates summaries (Grok-4-fast)
- 🌐 Enriches with WordNet synonyms and hierarchies
- ⚡ Creates fast local embeddings (384-dimensional)
- 💾 Stores in 3 LanceDB tables: catalog, chunks, concepts

### Step 5: Configure Cursor

1. **Open Cursor settings** and navigate to MCP configuration
2. **Edit your MCP config file:**

   **Linux/macOS**: `~/.cursor/mcp.json`
   **Windows**: `%APPDATA%/Cursor/User/mcp.json`
3. **Add the configuration:**

   ```json
   {
     "mcpServers": {
       "concept-rag": {
         "command": "node",
         "args": [
           "/path/to/your/concept-rag/dist/conceptual_index.js",
           "/home/your-username/.concept_rag"
         ]
       }
     }
   }
   ```

   **Replace the paths with your actual paths:**

   ```bash
   # Find your full paths
   pwd     # In concept-rag directory
   echo ~/.concept_rag  # Database location
   ```

### Step 6: Restart Cursor

```bash
# Reload window in Cursor: Cmd/Ctrl + Shift + P → "Reload Window"
# The conceptual search tools should now be available
```

### Step 7: Test Conceptual Search

**Try these example queries:**

```
1. "What documents do we have?"
   → Uses: catalog_search
   → Returns: Document summaries with titles and previews

2. "Find information about innovation"
   → Uses: concept_search (high precision)
   → Returns: Concept-tagged chunks with 100% relevance

3. "How do organizations implement strategic planning?"
   → Uses: broad_chunks_search
   → Returns: Cross-document results with hybrid scoring

4. "Extract all concepts from Sun Tzu's Art of War"
   → Uses: extract_concepts
   → Returns: Complete concept inventory (80-150+ concepts)
```

## 📚 Data Seeding

**Seed your documents with concept extraction:**

```bash
# Set up environment
export OPENROUTER_API_KEY=your_key_here

# Run seeding with conceptual indexing
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/your-pdfs \
  --overwrite
```

**What's created:**

- **Catalog table**: Document summaries with embedded concepts
- **Chunks table**: Detailed text segments with concept metadata (hybrid approach)
- **Concepts table**: Extracted concepts with chunk statistics and co-occurrence relationships

**Features:**

- 🧠 **Comprehensive**: Extracts 80-150+ concepts per document (Claude Sonnet 4.5)
- 📚 **Large document support**: Multi-pass extraction for documents >100k tokens
- 📝 **Fast summaries**: Grok-4-fast for quick overviews
- 🌐 **WordNet enriched**: Automatic synonym and hierarchy expansion
- 🛡️ **Robust**: Auto-skips corrupted PDFs, OCR fallback for scanned docs, improved error handling
- 💰 **Seeding cost**: ~$4.80 per 100 documents (one-time)

### 📋 Seeding Options

**Required:**

- `--dbpath`: Directory to store the LanceDB database
- `--filesdir`: Directory containing PDF files to process

**Optional:**

- `--overwrite`: Recreate database from scratch (deletes existing data)
  - **Without this flag:** Only processes new or changed files (incremental mode)
  - **With this flag:** Reprocesses everything (useful for testing or upgrades)

**Incremental vs Full Seeding:**

```bash
# Incremental (recommended for updates) - Only new/changed files
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/Documents/pdfs

# Full (initial setup or rebuild) - Process everything
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/Documents/pdfs --overwrite
```

**Time savings with incremental:**

- Initial 100 docs: ~25 minutes + ~$4.80
- Add 10 new docs: ~3 minutes + ~$0.48 ✨
- Add 1 new doc: ~15 seconds + ~$0.05 ✨

## 🧠 Concept Model

This system uses a **formal concept definition** to ensure high-quality semantic search:

> **A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

### What Gets Extracted as Concepts

**✅ INCLUDE:**
- Domain-specific terms (e.g., "speciation", "exaptive bootstrapping", "allometric scaling")
- Theories and frameworks (e.g., "complexity theory", "game theory")
- Methodologies and processes (e.g., "agent-based modeling", "regression analysis")
- Multi-word conceptual phrases (e.g., "strategic thinking", "social change")
- Phenomena and patterns (e.g., "urban scaling", "emergence")
- Abstract principles (e.g., "leadership principles", "design patterns")

**❌ EXCLUDE:**
- Temporal descriptions (e.g., "periods of heavy recruitment")
- Specific action phrases (e.g., "balancing cohesion with innovation")
- Suppositions (e.g., "attraction for collaborators")
- Proper names, dates, metadata

## 🏗️ Architecture

```
                 PDF Documents 
                      ↓
        Processing (with OCR fallback)
                      ↓
     ┌────────────────┬────────────────┐
     │                │                │
 Concept          Summary            Chunks
 Extraction       Generation         Creation
 (Sonnet 4.5)     (Grok-4-fast)     (Local)
 [Formal Model]   [Fast]            [Hybrid]
     ↓                ↓                ↓
 Concepts          Catalog           Chunks
 Table             Table             Table
     └────────────────┴────────────────┘
                      │
            Conceptual Search Engine
                 (5 signals)
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Corpus        WordNet       Hybrid
    Concepts      Synonyms      Scoring
```

## 🛠️ Development

### File Structure

```
hybrid_fast_seed.ts                              # Seeding with concept extraction
AGENTS.md                                        # Formal concept definition & guidelines
src/
├── conceptual_index.ts                          # MCP server entry point
├── concepts/                                    # Concept extraction & indexing
│   ├── concept_extractor.ts                     # LLM-based extraction (multi-pass)
│   ├── concept_index.ts                         # Index builder
│   ├── concept_chunk_matcher.ts                 # Chunk-concept matching
│   ├── query_expander.ts                        # Query expansion
│   └── types.ts                                 # Shared types
├── wordnet/                                     # WordNet integration
│   └── wordnet_service.ts                       # Python NLTK bridge
├── lancedb/                                     # Database clients
│   └── conceptual_search_client.ts              # Search engine
├── tools/                                       # MCP tools
│   ├── conceptual_registry.ts                   # Tool registry
│   └── operations/                              # Individual tools (5 total)
│       ├── concept_search.ts                    # Concept tracking (high precision)
│       ├── conceptual_broad_chunks_search.ts    # Cross-document search
│       ├── conceptual_catalog_search.ts         # Document discovery
│       ├── conceptual_chunks_search.ts          # Single document search
│       └── document_concepts_extract.ts         # Concept export
└── scripts/                                     # CLI utilities
    ├── extract_concepts.ts                      # Extract concepts CLI
    └── view_document_metadata.ts                # Metadata viewer
```

### Testing

```bash
# Build project
npm run build

# Test with MCP Inspector (interactive tool testing)
npx @modelcontextprotocol/inspector dist/conceptual_index.js ~/.concept_rag

# Command-line concept extraction
npx tsx scripts/extract_concepts.ts "document name" markdown
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (ensure no API keys in code!)
4. Run tests: `npm run build` and verify no errors
5. Submit a pull request

## 💰 Cost Breakdown

**Seeding costs (OpenRouter):**

- Concept extraction: ~$0.041/doc (Claude Sonnet 4.5)
- Summarization: ~$0.007/doc (Grok-4-fast)
- **Total: ~\$0.048 per document**

**Runtime search:** No additional API calls to OpenRouter (vector search is local)
**Note:** When used with AI agents (Cursor, Claude Desktop), the agent incurs costs for processing search results

## 🙏 Acknowledgments

This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). The original project provided the foundational MCP server architecture and LanceDB integration.

This fork extends the original with:

- **Formal concept model**: Rigorous definition ensuring semantic matching and disambiguation
- **Conceptual search**: Corpus-driven concept extraction with 80-150+ concepts per document
- **WordNet semantic enrichment**: Synonym expansion and hierarchical concept navigation
- **Multi-signal hybrid ranking**: Vector + BM25 + concept matching + title matching
- **Enhanced AI models**: Claude Sonnet 4.5 for extraction + Grok-4-fast for summaries
- **Large document support**: Multi-pass extraction for documents >100k tokens
- **Incremental seeding**: Fast updates for new/changed documents only
- **Robust error handling**: Better JSON parsing, debug logging, OCR fallback

We're grateful to the original author for creating and open-sourcing this excellent foundation!

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
