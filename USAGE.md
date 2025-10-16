# Concept-RAG Usage Guide

## Table of Contents

- [MCP Tools](#mcp-tools)
- [Command-Line Scripts](#command-line-scripts)
- [Example Workflows](#example-workflows)

---

## MCP Tools

Access these tools through the MCP interface (e.g., Claude Desktop, Cursor AI).

### 1. `catalog_search` - Find Documents

Search across all document summaries using conceptual expansion.

**When to use:**
- "What documents do I have?"
- "Find documents about [topic]"
- Getting an overview of available sources

**Example prompts:**
```
- "What documents cover strategic thinking?"
- "Find information about healthcare systems"
- "Show me documents related to complexity theory"
```

---

### 2. `chunks_search` - Search Within Document

Search for specific information within a single document.

**When to use:**
- You know which document you need
- Looking for specific information in a known source
- Detailed exploration of one document

**Example prompts:**
```
- "Search for information about leadership in Sun Tzu's Art of War"
- "Find sections about system design in the Christopher Alexander book"
```

---

### 3. `broad_chunks_search` - Search All Content

Deep search across ALL chunks in your entire library.

**When to use:**
- Comprehensive information gathering
- Cross-document research
- Finding specific concepts across all sources

**Example prompts:**
```
- "Find all information about strategic deception"
- "What do my documents say about organizational behavior?"
- "Search for examples of tactical planning"
```

---

### 4. `concept_search` - Find Concept Mentions

Find all chunks that mention a specific concept.

**When to use:**
- Tracking how a concept is used across documents
- Understanding concept distribution
- Research on specific terms

**Example prompts:**
```
- "Show me all mentions of 'military strategy'"
- "Find chunks about 'leadership principles'"
- "Where is 'deception tactics' discussed?"
```

---

### 5. `extract_concepts` - Export Document Concepts

Extract complete concept list from any document.

**When to use:**
- Creating concept maps
- Reviewing extraction quality
- Exporting for external analysis
- Generating documentation

**Parameters:**
- `document_query`: Document name or search term
- `format`: `json` or `markdown`
- `include_summary`: true/false

**Example prompts:**
```
- "Extract all concepts from Sun Tzu's Art of War"
- "Get concepts from the healthcare document as markdown"
- "Show me concepts from Christopher Alexander's work"
```

**Response formats:**

**JSON:**
```json
{
  "document": "/path/to/document.pdf",
  "total_concepts": 306,
  "primary_concepts": [...],
  "technical_terms": [...],
  "related_concepts": [...],
  "categories": [...],
  "summary": "..."
}
```

**Markdown:**
- Formatted tables with row numbers
- Organized by concept type
- Categories and summary included

---

## Command-Line Scripts

For bulk operations or automation, use the CLI scripts in the `scripts/` directory.

### Extract Concepts (CLI)

```bash
npx tsx scripts/extract_concepts.ts <document_query> [format]
```

**Examples:**
```bash
# Extract as markdown (default)
npx tsx scripts/extract_concepts.ts "Sun Tzu"

# Extract as JSON
npx tsx scripts/extract_concepts.ts "healthcare" json

# Search by author
npx tsx scripts/extract_concepts.ts "Christopher Alexander"
```

**Output:**
- Creates `{document}_concepts.md` or `{document}_concepts.json`
- Shows matching documents before extraction
- Displays statistics

---

### View Document Metadata (CLI)

View complete raw metadata for debugging:

```bash
npx tsx scripts/view_document_metadata.ts <document_query>
```

**Example:**
```bash
npx tsx scripts/view_document_metadata.ts "Sun Tzu"
```

---

## Example Workflows

### Workflow 1: Exploring a New Library

1. **Get overview:**
   ```
   "What documents do I have?"
   ```
   Uses: `catalog_search`

2. **Find relevant document:**
   ```
   "Find documents about military strategy"
   ```
   Uses: `catalog_search`

3. **Extract concepts:**
   ```
   "Extract concepts from Sun Tzu's Art of War as markdown"
   ```
   Uses: `extract_concepts`

4. **Deep dive:**
   ```
   "Search for 'deception tactics' in Sun Tzu"
   ```
   Uses: `chunks_search`

---

### Workflow 2: Cross-Document Research

1. **Broad search:**
   ```
   "Find all information about leadership principles"
   ```
   Uses: `broad_chunks_search`

2. **Track concept:**
   ```
   "Show all mentions of 'strategic thinking'"
   ```
   Uses: `concept_search`

3. **Compare documents:**
   - Extract concepts from multiple documents
   - Compare concept lists
   - Identify overlaps and differences

---

### Workflow 3: Document Analysis

1. **Extract concepts:**
   ```bash
   npx tsx scripts/extract_concepts.ts "document name" markdown
   ```

2. **Review concepts:**
   - Open generated markdown file
   - Check concept categorization
   - Verify extraction quality

3. **Query specific concepts:**
   ```
   "Find all chunks about [concept from list]"
   ```

---

## Tips & Best Practices

### Query Formulation

**Good queries:**
- ✅ "Find information about strategic planning"
- ✅ "What do my documents say about leadership?"
- ✅ "Search for deception tactics"

**Less effective:**
- ❌ Single words: "strategy"
- ❌ Too generic: "find stuff"
- ❌ Too long: full paragraphs

### Tool Selection

| Goal | Best Tool |
|------|-----------|
| Find relevant documents | `catalog_search` |
| Search within known document | `chunks_search` |
| Research across all documents | `broad_chunks_search` |
| Track specific concept usage | `concept_search` |
| Export/analyze concepts | `extract_concepts` |

### Performance

- First query may be slower (database loading)
- Subsequent queries are fast (<1s)
- Concept extraction returns full lists instantly
- Vector search scales well with document count

---

## Environment Configuration

### Database Location

Default: `~/.concept_rag`

Custom:
```bash
export CONCEPT_RAG_DB="/custom/path"
```

### MCP Server Configuration

See main README.md for Claude Desktop and Cursor setup.

---

## Troubleshooting

### "No concepts found"

Document wasn't processed with concept extraction. Re-run seeding:
```bash
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
```

### "Document not found"

Try broader search terms:
- Instead of exact title, use keywords
- Use author name
- Use topic/domain

### Slow queries

- Check database size
- Restart MCP server
- Verify WordNet is installed

---

For more information, see the [main README](README.md) and [scripts/README.md](scripts/README.md).





