# Concept-RAG Usage Guide

## Table of Contents

- [MCP Tools](#mcp-tools)
- [Command-Line Scripts](#command-line-scripts)
- [Example Workflows](#example-workflows)

---

## 🎯 Quick Tool Selection

**For AI Agents:** See [tool-selection-guide.md](docs/tool-selection-guide.md) for comprehensive tool selection decision tree and comparison matrix.

**Quick Decision:**
1. Looking for documents? → `catalog_search`
2. Researching a concept? → `concept_search` 
3. Searching for phrases/questions? → `broad_chunks_search`
4. Searching within known document? → `chunks_search`
5. Extracting concept list? → `extract_concepts`

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

### 6. `category_search` - Browse Documents by Category 🆕

Find all documents tagged with a specific category.

**When to use:**
- Browse documents by domain or subject area
- Filter your library by category
- Explore what documents exist in a category
- Category-based navigation

**Parameters:**
- `category`: Category name, ID, or alias (e.g., "software engineering", "distributed systems")
- `includeChildren`: Include child categories in hierarchy (default: false)
- `limit`: Maximum documents to return (default: 10)

**Example prompts:**
```
- "Show me documents in software engineering"
- "What do I have about distributed systems?"
- "Browse documents in the healthcare category"
- "Find all real-time systems documents"
```

**Response includes:**
```json
{
  "category": {
    "id": 3612017291,
    "name": "software engineering",
    "description": "...",
    "hierarchy": ["engineering", "software engineering"],
    "relatedCategories": ["distributed systems", "software architecture"]
  },
  "statistics": {
    "totalDocuments": 5,
    "totalChunks": 4074,
    "totalConcepts": 1245
  },
  "documents": [
    {
      "source": "/path/to/document.pdf",
      "preview": "This book covers...",
      "primaryConcepts": ["API design", "microservices", ...]
    }
  ]
}
```

---

### 7. `list_categories` - Browse All Categories 🆕

List all available categories with statistics and metadata.

**When to use:**
- "What categories do I have?"
- Discover what subject areas are in your library
- Browse available domains before filtering
- Get category statistics

**Parameters:**
- `sortBy`: Sort order - 'name', 'popularity', or 'documentCount' (default: 'popularity')
- `limit`: Maximum categories to return (default: 50)
- `search`: Optional filter by category name/description

**Example prompts:**
```
- "What categories are in my library?"
- "List all subject areas"
- "Show me categories related to software"
- "What domains do my documents cover?"
```

**Response includes:**
```json
{
  "summary": {
    "totalCategories": 46,
    "categoriesReturned": 10,
    "rootCategories": 8,
    "totalDocuments": 165
  },
  "categories": [
    {
      "id": 3612017291,
      "name": "software engineering",
      "description": "...",
      "aliases": ["software design", "system engineering"],
      "parent": "engineering",
      "hierarchy": ["engineering", "software engineering"],
      "statistics": {
        "documents": 5,
        "chunks": 4074,
        "concepts": 1245
      },
      "relatedCategories": ["distributed systems", "software architecture"]
    }
  ]
}
```

---

### 8. `list_concepts_in_category` - Domain Concept Analysis 🆕

Find all unique concepts that appear in documents of a specific category.

**When to use:**
- Analyze the conceptual landscape of a domain
- Find key concepts for a subject area
- Understand what topics are covered in a category
- Cross-domain concept discovery

**Parameters:**
- `category`: Category name, ID, or alias
- `sortBy`: 'name' or 'documentCount' (default: 'documentCount')
- `limit`: Maximum concepts to return (default: 50)

**Example prompts:**
```
- "What concepts appear in software engineering documents?"
- "List key concepts for distributed systems"
- "Show me concepts in the healthcare category"
- "What topics are covered in real-time systems?"
```

**Response includes:**
```json
{
  "category": {
    "id": 2409825216,
    "name": "distributed systems",
    "description": "...",
    "hierarchy": ["software engineering", "distributed systems"]
  },
  "statistics": {
    "totalDocuments": 3,
    "totalChunks": 4561,
    "totalUniqueConcepts": 387,
    "conceptsReturned": 20
  },
  "concepts": [
    {
      "id": 2837461923,
      "name": "consistency",
      "type": "thematic",
      "documentCount": 3,
      "weight": 0.92
    },
    {
      "id": 3948572014,
      "name": "partitioning",
      "type": "thematic",
      "documentCount": 2,
      "weight": 0.85
    }
  ],
  "note": "Concepts are category-agnostic and appear across multiple categories"
}
```

**Important Note:**
Concepts are category-agnostic (cross-domain entities). This tool shows which concepts *happen to appear* in a category's documents, not which concepts "belong" to the category. A concept like "optimization" may appear in software, healthcare, and business documents.

---

## Command-Line Scripts

For bulk operations or automation, use the CLI scripts in the `scripts/` directory.

### Seeding and Maintenance

#### `hybrid_fast_seed.ts` - Main Seeding Script

```bash
npx tsx hybrid_fast_seed.ts --filesdir <directory> [options]
```

**Options:**
- `--filesdir <path>` - Directory containing PDF/EPUB files (required)
- `--dbpath <path>` - Database directory (default: `~/.concept_rag`)
- `--overwrite` - Drop existing tables and rebuild from scratch
- `--rebuild-concepts` - Rebuild concept index without re-processing documents
- `--auto-reseed` - Automatically fix and re-process incomplete catalog records

**Examples:**
```bash
# Initial setup
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents --overwrite

# Add new documents
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents

# Rebuild concept index (after algorithm updates)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents --rebuild-concepts

# Fix database issues (duplicate/incomplete records)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents --auto-reseed
```

**📝 Logging:** Each run creates a timestamped log in `logs/seed-YYYY-MM-DDTHH-MM-SS.log`.

---

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

### Workflow 3: Category-Based Discovery 🆕

1. **Discover categories:**
   ```
   "What categories do I have?"
   ```
   Uses: `list_categories` → Shows all 46 categories

2. **Browse category:**
   ```
   "Show me documents in software engineering"
   ```
   Uses: `category_search` → Returns 5 documents

3. **Analyze concepts:**
   ```
   "What concepts are discussed in software engineering documents?"
   ```
   Uses: `list_concepts_in_category` → Returns 200+ concepts

4. **Deep dive on concept:**
   ```
   "Find information about API design"
   ```
   Uses: `concept_search` → Returns concept-tagged chunks

**Benefits:**
- Systematic domain exploration
- Understand conceptual landscape by category
- Navigate from broad (categories) to specific (concepts)
- Efficient library organization

---

### Workflow 4: Document Analysis

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

| Goal | Best Tool | Query Type |
|------|-----------|------------|
| Find relevant documents | `catalog_search` | Titles, authors, topics |
| **Research a concept** | **`concept_search`** | **Single concept terms (highest precision)** |
| Search across all documents | `broad_chunks_search` | Phrases, questions, keywords |
| Search within known document | `chunks_search` | Any query + source path |
| Export/analyze concepts | `extract_concepts` | Document identifier |

**Important:** For conceptual research (e.g., "innovation", "leadership"), use `concept_search` for 100% precision with semantically-tagged results. Use `broad_chunks_search` for keyword/phrase searches.

See [tool-selection-guide.md](docs/tool-selection-guide.md) for detailed selection criteria.

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
