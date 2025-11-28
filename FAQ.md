# Frequently Asked Questions (FAQ)

## Table of Contents

- [General Questions](#general-questions)
- [Setup & Installation](#setup--installation)
- [Usage & Features](#usage--features)
- [Costs & Performance](#costs--performance)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)
- [Comparisons](#comparisons)

---

## General Questions

### What is Concept-RAG?

Concept-RAG is an MCP (Model Context Protocol) server that enables AI assistants like Claude and Cursor to search and interact with your documents using conceptual understanding. It extracts 80-150+ concepts per document and enables semantic search powered by hybrid ranking (vector + keyword + concept matching).

### How is Concept-RAG different from regular document search?

**Traditional search**:
- Keyword matching only
- No semantic understanding
- Miss related concepts
- Poor for complex queries

**Concept-RAG**:
- Understands document concepts
- Semantic matching with WordNet
- Multiple search modes for different use cases
- Hybrid ranking for best results

### What does "conceptual search" mean?

Conceptual search means finding information based on **meaning** rather than exact keywords. For example, searching for "innovation" will also find related concepts like "creative process", "novel solutions", and "breakthrough thinking" because they're semantically related.

### Who is this for?

- **Researchers**: Exploring academic papers and literature
- **Knowledge workers**: Managing large document collections
- **Students**: Researching topics across multiple sources
- **Writers**: Finding information for content creation
- **Teams**: Sharing organizational knowledge bases

---

## Setup & Installation

### What are the requirements?

- **Node.js** 18 or higher
- **Python** 3.9+ with NLTK (for WordNet)
- **OpenRouter API key** ([get one here](https://openrouter.ai/keys))
- **MCP Client**: Claude Desktop or Cursor
- **Storage**: ~100MB per 1000 documents

### How much does OpenRouter cost?

**One-time seeding costs** (per document):
- Concept extraction (Claude Sonnet 4.5): ~$0.041
- Summary generation (Grok-4-fast): ~$0.007
- **Total: ~$0.048 per document**

**Runtime**: $0 (search is local, no API calls)

**Example**: 100 documents ≈ $4.80 (one-time)

### Do I need a GPU?

No! Concept-RAG uses:
- **Local embeddings**: CPU-based (Xenova/all-MiniLM-L6-v2)
- **Vector search**: Efficient with LanceDB
- **API calls**: Only for initial concept extraction

### Can I use local LLMs instead of OpenRouter?

Currently, Concept-RAG requires OpenRouter for concept extraction. However:
- Search is completely local (no API calls)
- You could modify the code to use local LLMs
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

### Why do I need WordNet?

WordNet provides:
- **Synonym expansion**: "leadership" → "direction", "guidance"
- **Hierarchical concepts**: Understanding relationships
- **Query expansion**: Better search recall
- **161K+ words**: Comprehensive English vocabulary

---

## Usage & Features

### Which search tool should I use?

**Quick decision**:
1. Finding documents? → `catalog_search`
2. Researching a concept? → `concept_chunks`
3. Searching phrases/questions? → `broad_chunks_search`
4. Searching within known document? → `chunks_search`
5. Extracting concept list? → `extract_concepts`

See [tool-selection-guide.md](tool-selection-guide.md) for detailed guidance.

### How accurate is concept extraction?

Very accurate! We use:
- **Claude Sonnet 4.5**: State-of-the-art LLM
- **Formal concept model**: Rigorous definition
- **Multi-pass extraction**: For large documents
- **Semantic validation**: Concepts are disambiguated

Typical results: 80-150+ concepts per document with high precision.

### Can I customize concept extraction?

Yes! Edit `prompts/concept-extraction.txt` to:
- Adjust concept levels (thematic, domain-specific, technical)
- Add/remove examples
- Change categorization rules
- Modify extraction strategy

See [prompts/README.md](prompts/README.md) for details.

### What document formats are supported?

Currently:
- ✅ PDF (text-based and scanned with OCR fallback)

Planned:
- 📋 DOCX, TXT, Markdown, HTML
- See [CONTRIBUTING.md](CONTRIBUTING.md) to help add formats

### How do I add new documents?

**Incremental mode** (recommended):
```bash
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/pdfs
```

Only processes new/changed files! Much faster than re-seeding everything.

### Can I delete documents?

Currently, you need to:
1. Remove the PDF from your files directory
2. Re-seed without `--overwrite` flag

Or:
1. Re-seed from scratch with `--overwrite` (processes all files)

Future feature: Direct document deletion via CLI.

### How do I update concepts for existing documents?

```bash
# Re-extract concepts for documents with few concepts
npx tsx scripts/repair_missing_concepts.ts --min-concepts 50

# Or re-seed everything
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs --overwrite
```

---

## Costs & Performance

### How much does it cost to seed 100 documents?

**One-time cost**: ~$4.80
- Concept extraction: $4.10
- Summaries: $0.70

**Time**: ~25 minutes (depending on document size)

### How much does it cost to search?

**$0** - Search is completely local! No API calls to OpenRouter.

### How fast is search?

- **First query**: 1-3 seconds (database loading)
- **Subsequent queries**: <1 second
- **Concept extraction**: Instant (pre-computed)

Scales well with document count (tested with 100+ documents).

### How do I reduce seeding costs?

1. **Incremental seeding**: Only process new documents
   ```bash
   # Omit --overwrite flag
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
   ```

2. **Selective processing**: Only seed documents you need

3. **Batch processing**: Process many documents at once (reduces overhead)

### Can I use cheaper models?

You can modify the model configuration in the code, but:
- **Claude Sonnet 4.5**: Excellent concept extraction quality
- **Grok-4-fast**: Already very cheap for summaries
- Cheaper models may reduce concept quality

---

## Troubleshooting

### "Error: OPENROUTER_API_KEY not set"

```bash
# Set in .env file
echo "OPENROUTER_API_KEY=your-key-here" > .env

# Or export directly
export OPENROUTER_API_KEY="your-key-here"
```

### "Python NLTK not found"

```bash
# Install NLTK
pip3 install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Verify installation
python3 -c "from nltk.corpus import wordnet as wn; print(f'✅ WordNet ready: {len(list(wn.all_synsets()))} synsets')"
```

### "No concepts found for document"

**Cause**: Document wasn't processed with concept extraction.

**Solution**: Re-seed the database:
```bash
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs --overwrite
```

### "PDF parsing failed"

**Causes**:
- Corrupted PDF
- Password-protected PDF
- Unusual encoding

**Solutions**:
1. Concept-RAG has OCR fallback for scanned PDFs
2. Re-save PDF using another tool
3. Check if PDF opens in a PDF reader
4. Try converting to PDF/A format

### "MCP server not connecting"

**Check**:
1. Correct paths in MCP config (absolute paths)
2. Project is built (`npm run build`)
3. Database path exists and is readable
4. Restart Claude/Cursor after config changes

**Verify paths**:
```bash
# In concept-rag directory
pwd  # Get absolute path

# Check database
ls -la ~/.concept_rag
```

### Slow queries

**Solutions**:
1. Rebuild indexes:
   ```bash
   npx tsx scripts/rebuild_indexes.ts
   ```

2. Check database size:
   ```bash
   du -sh ~/.concept_rag
   ```

3. Restart MCP server (restart Claude/Cursor)

### "Out of memory" during seeding

**Causes**: Processing very large documents

**Solutions**:
1. Process documents in batches
2. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx tsx hybrid_fast_seed.ts ...
   ```

3. Process smaller documents first

### Where are the log files?

**Answer**: Each seeding run creates a timestamped log file in the `logs/` directory:

```
logs/seed-2025-11-25T15-30-42.log
```

**What's logged**:
- All console output (INFO, WARN, ERROR)
- Timestamps for each message
- Full diagnostic information

**Viewing logs**:
```bash
# View latest log
ls -t logs/seed-*.log | head -1 | xargs cat

# Search for errors
grep ERROR logs/seed-*.log
```

**Cleanup**: Logs are not automatically deleted. To clean up old logs:
```bash
# Keep only last 10 logs
cd logs && ls -t seed-*.log | tail -n +11 | xargs rm -f
```

### How do I fix duplicate/incomplete catalog records?

**Symptoms**:
- "Mapped X/Y sources" where X < Y
- Duplicate source path warnings
- Missing document IDs

**Solution**: Use `--auto-reseed` to automatically fix:
```bash
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents --auto-reseed
```

This will:
1. Detect incomplete records (missing/invalid IDs)
2. Remove them from catalog
3. Re-process those documents properly

**Check diagnostics**: Run with `--rebuild-concepts` to see detailed analysis:
```bash
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents --rebuild-concepts
```

---

## Technical Details

### How does hybrid search work?

Concept-RAG combines 5 signals:

1. **Vector similarity**: Semantic meaning (embeddings)
2. **BM25**: Keyword frequency and relevance
3. **Concept matching**: Extracted concept alignment
4. **Title matching**: Document title relevance (10x boost)
5. **WordNet expansion**: Synonym matching

Final score = weighted combination of all signals.

### What embedding model is used?

**Xenova/all-MiniLM-L6-v2**:
- 384-dimensional vectors
- Runs locally on CPU
- Fast and efficient
- Good accuracy for semantic search
- No API costs

### How are concepts stored?

**LanceDB tables**:
1. **Catalog table**: Document summaries with concept metadata
2. **Chunks table**: Text segments with concept tags
3. **Concepts table**: Concept definitions and statistics

Format: Apache Arrow (efficient columnar storage)

### What's the database size?

Approximately:
- **10 documents**: ~5-10 MB
- **100 documents**: ~50-100 MB
- **1000 documents**: ~500 MB - 1 GB

Depends on document size and chunk count.

### Can I export data?

Yes!

**Concepts**:
```bash
# Export as markdown
npx tsx scripts/extract_concepts.ts "document name" markdown

# Export as JSON
npx tsx scripts/extract_concepts.ts "document name" json
```

**Database**: LanceDB uses Apache Arrow format (can be read with Arrow libraries)

### Is my data private?

**Local**:
- PDF files
- Database (LanceDB)
- Vector embeddings
- Search queries

**Sent to OpenRouter** (during seeding only):
- Document text for concept extraction
- Document text for summary generation

**Never sent**:
- Search queries (100% local)
- API keys
- File paths

See [SECURITY.md](SECURITY.md) for details.

---

## Comparisons

### Concept-RAG vs. Traditional Vector Search

| Feature | Concept-RAG | Vector Search |
|---------|-------------|---------------|
| Semantic search | ✅ | ✅ |
| Keyword matching | ✅ (BM25) | ❌ |
| Concept extraction | ✅ (80-150+/doc) | ❌ |
| Synonym expansion | ✅ (WordNet) | ❌ |
| Multiple search modes | ✅ (5 tools) | ❌ (1 mode) |
| Title boosting | ✅ | ❌ |
| Cost | $0.048/doc (one-time) | $0 (if local) |

### Concept-RAG vs. Elasticsearch

| Feature | Concept-RAG | Elasticsearch |
|---------|-------------|---------------|
| Setup complexity | Simple (npm install) | Complex (server setup) |
| Concept extraction | ✅ Automatic | ❌ Manual |
| Semantic search | ✅ | ✅ (with plugins) |
| MCP integration | ✅ Native | ❌ |
| Cost | ~$0.048/doc | Free (self-hosted) |
| Maintenance | Low | Medium-High |

### Concept-RAG vs. Pinecone/Weaviate

| Feature | Concept-RAG | Pinecone/Weaviate |
|---------|-------------|-------------------|
| Hosting | Local | Cloud or self-hosted |
| Privacy | 100% local search | Data sent to cloud |
| Setup | Simple | Medium complexity |
| Cost | $0.048/doc one-time | Monthly fees |
| Concept extraction | ✅ Built-in | ❌ DIY |
| MCP integration | ✅ Native | ❌ Custom |

---

## Still Have Questions?

- **Documentation**: [README.md](README.md), [USAGE.md](USAGE.md)
- **Issues**: [GitHub Issues](https://github.com/m2ux/concept-rag/issues)
- **Discussions**: [GitHub Discussions](https://github.com/m2ux/concept-rag/discussions)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)

---

**Can't find your question?** Open a [GitHub Discussion](https://github.com/m2ux/concept-rag/discussions) and we'll add it to this FAQ!

