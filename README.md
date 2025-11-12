# 🧠 Concept RAG: Conceptual RAG MCP Server

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful MCP server that enables LLMs to interact with documents through conceptual search. Combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking powered by LanceDB for superior retrieval accuracy.

## ✨ Features

- 🧠 **Conceptual Search**: Corpus concepts + WordNet + hybrid signals for intelligent retrieval
- 🔍 **Multi-Signal Ranking**: Vector similarity, BM25, title matching, concept matching, synonym expansion
- 🤖 **LLM-Powered**: Claude Sonnet 4.5 for concept extraction, Grok-4-fast for summaries
- 🌐 **WordNet Integration**: Synonym expansion and hierarchical concept navigation (161K+ words)
- ⚡ **Lightning Fast**: Cloud AI + local embeddings, no timeout issues
- 🛡️ **Robust PDF Handling**: Gracefully handles corrupted files with OCR fallback
- 📊 **Comprehensive Indexing**: Extracts 80-150+ concepts per document with formal concept definition
- 📚 **Large Document Support**: Multi-pass extraction for documents >100k tokens
- 🎯 **Formal Concept Model**: Based on rigorous definition ensuring semantic matching and disambiguation

## 📝 Available Tools

The server provides the following search tools:

### 🗂️ `catalog_search`

Search document summaries to find relevant sources

- Query expansion with corpus concepts + WordNet
- Returns: Documents with concept matches and scores

### 📄 `chunks_search`

Find specific information within a chosen document

- Requires `source` parameter (document path)
- Concept-aware search within single document

### 🔍 `broad_chunks_search`

Search across ALL documents for detailed information

- Returns: Top 10 most relevant chunks from entire corpus
- Full conceptual expansion and multi-signal ranking

### 🎯 `concept_search`

Find all chunks that reference a specific concept

- Search by exact concept name (e.g., "suspicion creation", "military strategy")
- Returns: All chunks containing the concept, sorted by relevance
- Shows concept metadata, related concepts, and distribution across documents

**Example**: `"Find all chunks about leadership principles"`

### 📤 `extract_concepts`

Extract all concepts from a specific document in the database

- **Parameters:**
  - `document_query`: Search for document by name or topic (e.g., "Sun Tzu Art of War")
  - `format`: Output format - `json` or `markdown` (default: json)
  - `include_summary`: Include document summary and categories (default: true)
- **Returns:** Complete concept list with primary concepts, technical terms, related concepts
- **Use cases:**
  - Generate concept maps for documents
  - Export concepts for external analysis
  - Review extraction quality

**Example**: `"Extract all concepts from Sun Tzu's Art of War as markdown"`

**Command-line alternative:**
```bash
npx tsx scripts/extract_concepts.ts "Sun Tzu" markdown
```

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
    "lancedb": {
      "command": "node",
      "args": [
        "/path/to/concept-rag/dist/conceptual_index.js",
        "/home/username/.concept_rag"
      ]
    }
  }
}
```

**Claude Desktop**
**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lancedb": {
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
           "/path/to/your/concept-rag/dist/simple_index.js",
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

### Step 5: Restart Cursor

```bash
# Reload window in Cursor: Cmd/Ctrl + Shift + P → "Reload Window"
# The conceptual search tools should now be available
```

### Step 6: Test Conceptual Search

**Try these example queries:**

```
1. "What documents do we have?"
   → Uses: catalog_search with concept expansion

2. "Find information about strategic thinking"
   → Expands to: strategy, tactics, planning, decision making, etc.
   → Returns: Relevant documents with concept matches

3. "Search for leadership principles"
   → Finds: Documents about leadership, management, command, etc.
   → Shows matched concepts and expanded terms
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

## 🎯 Example Queries

**Conceptual search finds documents by meaning, not just keywords:**

```
"What documents do we have?"
→ Lists catalog with AI summaries and extracted concepts

"Find information about strategic thinking"
→ Expands: strategy, tactics, planning, decision making
→ Finds: All documents with related concepts

"Search for leadership principles"  
→ Expands: leadership, management, command, authority
→ Returns: Chunks from ANY document about leadership

"How do threads synchronize?"
→ Expands: concurrency, mutex, semaphore, locks
→ Finds: Technical docs even without exact wording
```

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
- Generic single words (e.g., "power", "riches", "time", "people")
- Proper names, dates, metadata

For complete guidelines, see [AGENTS.md](AGENTS.md).

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
hybrid_fast_seed.ts              # Seeding with concept extraction
AGENTS.md                        # Formal concept definition & guidelines
src/
├── conceptual_index.ts          # MCP server entry point
├── concepts/                    # Concept extraction & indexing
│   ├── concept_extractor.ts    # LLM-based extraction (multi-pass)
│   ├── concept_index.ts         # Index builder
│   ├── concept_chunk_matcher.ts # Chunk-concept matching
│   ├── query_expander.ts        # Query expansion
│   └── types.ts                 # Shared types
├── wordnet/                     # WordNet integration
│   └── wordnet_service.ts       # Python NLTK bridge
├── lancedb/                     # Database clients
│   └── conceptual_search_client.ts  # Search engine
├── tools/                       # MCP tools
│   ├── conceptual_registry.ts  # Tool registry
│   └── operations/              # Individual tools
│       ├── concept_search.ts   # Concept tracking
│       └── document_concepts_extract.ts  # Concept extraction
└── scripts/                     # CLI utilities
    ├── extract_concepts.ts     # Extract concepts CLI
    └── view_document_metadata.ts  # Metadata viewer
```

### Testing

```bash
# Build project
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/conceptual_index.js ~/.concept_rag

# Run concept extraction tests
npx tsx test/conceptual_search_test.ts
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

This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data). The original project provided the foundational MCP server architecture and LanceDB integration. This fork extends the original with:

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
