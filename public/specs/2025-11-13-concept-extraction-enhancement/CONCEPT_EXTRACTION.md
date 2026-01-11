# Concept Extraction Guide

## Overview

This guide covers the concept extraction capabilities added to concept-rag, including both MCP tools and command-line scripts for extracting and viewing document concepts.

## Features Added

### 1. MCP Tool: `extract_concepts`

**Purpose:** Extract all concepts from any document in your database via MCP interface.

**Access:** Available through Claude Desktop, Cursor AI, or any MCP client

**Parameters:**
- `document_query` (required): Search term to find document (name, author, topic)
- `format` (optional): `json` or `markdown` (default: json)
- `include_summary` (optional): Include categories and summary (default: true)

**Usage examples:**
```
"Extract all concepts from Sun Tzu's Art of War"
"Get concepts from the healthcare document as markdown"
"Show me concepts from Christopher Alexander's work as JSON"
```

**Response includes:**
- Primary concepts (high-level themes)
- Technical terms (specific terminology)
- Related concepts (connected topics)
- Categories (document domains)
- Summary (document overview)

---

### 2. CLI Script: `scripts/extract_concepts.ts`

**Purpose:** Command-line tool for bulk concept extraction

**Usage:**
```bash
npx tsx scripts/extract_concepts.ts <document_query> [format]
```

**Examples:**
```bash
# Extract as markdown
npx tsx scripts/extract_concepts.ts "Sun Tzu"

# Extract as JSON
npx tsx scripts/extract_concepts.ts "healthcare system" json
```

**Features:**
- Shows top 10 matching documents
- Displays concept statistics
- Creates output file automatically
- Custom database path support

**Output files:**
- Markdown: `{document}_concepts.md` (formatted tables)
- JSON: `{document}_concepts.json` (structured data)

---

### 3. CLI Script: `scripts/view_document_metadata.ts`

**Purpose:** View complete raw document metadata

**Usage:**
```bash
npx tsx scripts/view_document_metadata.ts <document_query>
```

**Use cases:**
- Debugging extraction issues
- Exploring document structure
- Verifying concept metadata

---

## Implementation Details

### Files Created/Modified

**New files:**
- `src/tools/operations/document_concepts_extract.ts` - MCP tool implementation
- `scripts/extract_concepts.ts` - CLI extraction script
- `scripts/view_document_metadata.ts` - CLI metadata viewer
- `scripts/README.md` - Scripts documentation
- `USAGE.md` - Comprehensive usage guide
- `CONCEPT_EXTRACTION.md` - This file

**Modified files:**
- `src/tools/conceptual_registry.ts` - Added extract_concepts tool
- `src/concepts/types.ts` - Added ChunkWithConcepts interface, chunk_count field
- `README.md` - Documented new tool

**Built files:**
- `dist/tools/operations/document_concepts_extract.js`
- `dist/tools/conceptual_registry.js`
- `dist/concepts/types.js`

---

## Concept Structure

Each document's concepts are organized as:

```json
{
  "primary_concepts": [
    "military strategy",
    "tactical planning",
    "leadership principles",
    ...
  ],
  "technical_terms": [
    "sun tzu",
    "art of war",
    "strategic positioning",
    ...
  ],
  "related_concepts": [
    "command and control",
    "military discipline",
    "organizational behavior",
    ...
  ],
  "categories": [
    "military strategy",
    "ancient chinese history",
    "leadership and management"
  ],
  "summary": "Brief document overview..."
}
```

**Typical counts:**
- Primary concepts: 40-100+
- Technical terms: 60-200+
- Related concepts: 20-40+
- Total: 120-300+ concepts per document

---

## Example Workflows

### Workflow 1: Quick Concept Export

```bash
# Find and extract concepts
npx tsx scripts/extract_concepts.ts "document name" markdown

# Output: document_name_concepts.md
```

### Workflow 2: Programmatic Access

```typescript
// Use the MCP tool from code
const result = await mcp.call("extract_concepts", {
  document_query: "Sun Tzu",
  format: "json",
  include_summary: true
});

const concepts = JSON.parse(result.content[0].text);
console.log(`Found ${concepts.total_concepts} concepts`);
```

### Workflow 3: Batch Processing

```bash
# Extract concepts from multiple documents
for doc in "Sun Tzu" "Healthcare" "Alexander"; do
  npx tsx scripts/extract_concepts.ts "$doc" json
done
```

---

## Configuration

### Database Location

**Default:** `~/.concept_rag`

**Custom:**
```bash
export CONCEPT_RAG_DB="/path/to/database"
npx tsx scripts/extract_concepts.ts "query"
```

### MCP Server Setup

See main README.md for configuration in:
- Claude Desktop
- Cursor AI
- Other MCP clients

---

## Troubleshooting

### Issue: "No concepts found"

**Cause:** Document not processed with concept extraction

**Solution:**
```bash
npx tsx hybrid_fast_seed.ts \\
  --dbpath ~/.concept_rag \\
  --filesdir ~/Documents/pdfs \\
  --overwrite
```

### Issue: "Document not found"

**Cause:** Search query too specific

**Solution:** Use broader terms (author name, topic, keywords)

### Issue: MCP tool not available

**Cause:** Server not rebuilt after adding tool

**Solution:**
```bash
npm run build
# Restart MCP client (Claude Desktop, Cursor)
```

---

## Performance

**MCP Tool:**
- First call: ~500ms (database loading)
- Subsequent calls: <100ms
- Returns full concept list

**CLI Scripts:**
- Search + extraction: 1-2 seconds
- File write: <100ms
- Total: 1-2 seconds per document

---

## Use Cases

1. **Documentation:** Generate concept indexes for documents
2. **Analysis:** Export concepts for external processing
3. **Quality Check:** Review extraction accuracy
4. **Research:** Compare concepts across documents
5. **Visualization:** Create concept maps
6. **Search:** Find documents by concept presence

---

## Next Steps

- Test extract_concepts tool in your MCP client
- Run CLI scripts on your documents
- Review extraction quality
- Integrate into workflows

For more information:
- [README.md](README.md) - Main documentation
- [USAGE.md](USAGE.md) - Detailed usage guide
- [scripts/README.md](scripts/README.md) - CLI scripts reference
- [HYBRID_APPROACH.md](HYBRID_APPROACH.md) - Conceptual search architecture
