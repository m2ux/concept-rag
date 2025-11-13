# Concept Extraction Scripts

This directory contains operational utilities for managing document concepts in the concept-rag database.

## Scripts

### `extract_concepts.ts` - Extract All Concepts from a Document

Extract all concepts (primary concepts, technical terms, related concepts) from any document in your database and save to a file.

**Usage:**
```bash
npx tsx scripts/extract_concepts.ts <document_query> [output_format]
```

**Parameters:**
- `document_query` - Search query to find the document (document name, author, or topic)
- `output_format` - (Optional) Output format: `markdown` (default) or `json`

**Examples:**
```bash
# Extract concepts from Sun Tzu's Art of War (markdown format)
npx tsx scripts/extract_concepts.ts "Sun Tzu Art of War"

# Extract concepts about healthcare systems (markdown)
npx tsx scripts/extract_concepts.ts "healthcare system" markdown

# Extract concepts from Christopher Alexander's work (JSON format)
npx tsx scripts/extract_concepts.ts "Christopher Alexander" json
```

**Output:**
- Creates a file named `{document}_concepts.md` or `{document}_concepts.json`
- Shows top matching documents and selects the best match
- Displays concept statistics before saving

---

### `rebuild_indexes.ts` - Rebuild LanceDB Indexes

Rebuild vector indexes for existing tables with optimized parameters.

**Usage:**
```bash
npx tsx scripts/rebuild_indexes.ts [--dbpath <path>]
```

**Examples:**
```bash
# Rebuild indexes for default database
npx tsx scripts/rebuild_indexes.ts

# Rebuild indexes for custom database path
npx tsx scripts/rebuild_indexes.ts --dbpath /path/to/database
```

**What it does:**
- Analyzes each table to determine optimal partition count
- Rebuilds indexes with optimized parameters
- Eliminates clustering warnings

---

### `reenrich_chunks_with_concepts.ts` - Re-tag Chunks

Re-enrich existing chunks with concept tags from catalog entries.

**Usage:**
```bash
npx tsx scripts/reenrich_chunks_with_concepts.ts [--batch-size <size>]
```

**When to use:**
- After updating concept extraction in catalog
- To propagate catalog concepts to chunks

---

### `repair_missing_concepts.ts` - Repair Missing Concepts

Re-extract concepts for documents with missing or incomplete concepts.

**Usage:**
```bash
npx tsx scripts/repair_missing_concepts.ts [--min-concepts <count>]
```

**Parameters:**
- `--min-concepts` - Minimum concept count threshold (default: 10)

**Examples:**
```bash
# Repair documents with fewer than 10 concepts
npx tsx scripts/repair_missing_concepts.ts

# Repair documents with fewer than 50 concepts
npx tsx scripts/repair_missing_concepts.ts --min-concepts 50
```

**What it does:**
1. Identifies documents with missing/incomplete concepts
2. Re-extracts concepts using current prompts
3. Updates catalog entries
4. Re-enriches affected chunks
5. Rebuilds concept index

**Requires:** `OPENROUTER_API_KEY` environment variable

---

## Environment Variables

```bash
# API key for concept extraction
export OPENROUTER_API_KEY="your-key-here"

# Custom database location (optional)
export CONCEPT_RAG_DB="/custom/path/to/database"
```

Default database location: `~/.concept_rag`

---

## Notes

- All scripts require a built project (`npm run build`)
- Scripts use vector search to find documents
- Best matching document is automatically selected
