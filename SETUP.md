# Setup Guide

Complete installation and configuration guide for Concept-RAG.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/en/)
- **Python 3.9+** - [Download](https://www.python.org/)
- **OpenRouter API key** - [Sign up](https://openrouter.ai/keys)
- **MCP Client** - Cursor or Claude Desktop

## Installation

### 1. Clone and Build

```bash
# Clone repository
git clone https://github.com/m2ux/concept-rag.git
cd concept-rag

# Install dependencies
npm install

# Build TypeScript project
npm run build
```

### 2. Install WordNet

WordNet provides semantic enrichment (synonyms, hierarchies) for concepts.

```bash
# Install Python NLTK
pip3 install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Verify installation
python3 -c "from nltk.corpus import wordnet as wn; print(f'✅ WordNet ready: {len(list(wn.all_synsets()))} synsets')"
```

**Expected output:** `✅ WordNet ready: 117659 synsets` (or similar)

### 3. Configure OpenRouter API Key

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your OpenRouter API key
# Get one at: https://openrouter.ai/keys
nano .env  # or use your preferred editor
```

**Your .env file should contain:**
```
OPENROUTER_API_KEY=your_actual_key_here
```

## Database Seeding

### Initial Seeding (New Database)

Create a new database from your PDF documents:

```bash
# Set environment
source .env

# Run seeding with full processing
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs \
  --overwrite
```

**What happens during seeding:**

1. 📄 **Document Loading** - Reads PDF files (with OCR fallback for scanned docs)
2. 🧠 **Concept Extraction** - Claude Sonnet 4.5 extracts 80-150+ concepts per document
3. 📝 **Summarization** - Grok-4-fast generates document summaries
4. 🌐 **WordNet Enrichment** - Adds synonyms, broader/narrower terms
5. ⚡ **Embedding Generation** - Creates 384-dimensional vectors locally
6. 💾 **Database Storage** - Saves to 3 LanceDB tables (catalog, chunks, concepts)

**Time & Cost:**
- Initial 100 documents: ~25 minutes + ~$4.80
- Processing speed: ~2.5 documents/minute

### Incremental Seeding (Add New Documents)

Add new or changed documents without reprocessing everything:

```bash
# Run without --overwrite flag
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs
```

**Smart detection automatically skips:**
- Files already in database (by content hash)
- Files that haven't changed since last processing

**Time savings:**
- Add 10 new docs: ~3 minutes + ~$0.48 ✨
- Add 1 new doc: ~15 seconds + ~$0.05 ✨

### Seeding Options

**Required:**
- `--dbpath`: Directory to store LanceDB database
- `--filesdir`: Directory containing PDF files to process

**Optional:**
- `--overwrite`: Recreate database from scratch (deletes existing data)

**Examples:**

```bash
# Full rebuild (testing, upgrades, schema changes)
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/pdfs --overwrite

# Incremental update (recommended for regular use)
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/pdfs
```

## MCP Client Configuration

### Cursor

1. **Locate config file:**
   - **Linux/macOS:** `~/.cursor/mcp.json`
   - **Windows:** `%APPDATA%/Cursor/User/mcp.json`

2. **Add configuration:**

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

3. **Find your paths:**

```bash
# In concept-rag directory
pwd                    # Copy this for first path + /dist/conceptual_index.js
echo ~/.concept_rag    # Copy this for second path (database location)
```

4. **Restart Cursor:**
   - Cmd/Ctrl + Shift + P → "Reload Window"
   - Verify tools appear in MCP section

### Claude Desktop

1. **Locate config file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Add configuration:**

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

3. **Restart Claude Desktop** completely (quit and relaunch)

## Testing Your Setup

### Using MCP Inspector

Interactive testing tool for all 5 search operations:

```bash
npx @modelcontextprotocol/inspector dist/conceptual_index.js ~/.concept_rag
```

### Example Queries in Cursor/Claude

Try these queries to verify everything works:

```
1. "What documents do we have?"
   → Uses: catalog_search
   → Returns: Document summaries

2. "Find information about innovation"
   → Uses: concept_chunks
   → Returns: Concept-tagged chunks

3. "How do organizations implement strategic planning?"
   → Uses: broad_chunks_search
   → Returns: Cross-document search results

4. "Extract concepts from [document name]"
   → Uses: extract_concepts
   → Returns: Complete concept inventory
```

### Command-Line Testing

Extract concepts from a specific document:

```bash
npx tsx scripts/extract_concepts.ts "document name" markdown
```

## Troubleshooting

### Common Issues

**"WordNet not found" error:**
```bash
# Reinstall WordNet data
python3 -c "import nltk; nltk.download('wordnet', force=True); nltk.download('omw-1.4', force=True)"
```

**"OpenRouter API key not configured":**
```bash
# Check .env file exists and contains valid key
cat .env
source .env
echo $OPENROUTER_API_KEY
```

**MCP tools not appearing:**
1. Check paths in MCP config are absolute (not relative)
2. Verify `dist/conceptual_index.js` exists (run `npm run build`)
3. Restart your MCP client completely
4. Check client logs for errors

**Database corruption:**
```bash
# Rebuild from scratch
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/pdfs --overwrite
```

### Getting More Help

- 📖 **Full troubleshooting guide:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 📚 **Usage examples:** [USAGE.md](USAGE.md)
- ❓ **Frequently asked questions:** [FAQ.md](FAQ.md)
- 🐛 **Bug reports:** [GitHub Issues](https://github.com/m2ux/concept-rag/issues)

## What's Created

After successful setup, you'll have:

### Database Structure

```
~/.concept_rag/
├── catalog.lance/        # Document summaries and metadata
├── chunks.lance/         # Text chunks with concept tags
└── concepts.lance/       # Extracted concepts with relationships
```

### Table Contents

- **Catalog** (~1 entry per document): Summaries, primary concepts, technical terms
- **Chunks** (~10-50 per document): Text segments with embeddings and concept tags
- **Concepts** (~80-150 per document): Unique concepts with WordNet enrichment

### Storage Requirements

- Small library (10 docs): ~50 MB
- Medium library (100 docs): ~500 MB
- Large library (1000 docs): ~5 GB

## Next Steps

1. ✅ Verify setup with test queries
2. 📖 Read [USAGE.md](USAGE.md) for detailed tool documentation
3. 💡 Explore [EXAMPLES.md](EXAMPLES.md) for real-world scenarios
4. 🔧 Customize concept extraction in `AGENTS.md` if needed

---

**Need help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open an issue on GitHub.

