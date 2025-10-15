# Concept Extraction Scripts

This directory contains standalone command-line utilities for working with document concepts in the concept-rag database.

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

**Output Formats:**

1. **Markdown** (default) - Creates formatted tables with:
   - Primary Concepts table
   - Technical Terms table
   - Related Concepts table
   - Categories list
   - Document summary

2. **JSON** - Creates structured JSON with:
   - Document metadata (path, hash, extraction timestamp)
   - All concept arrays
   - Categories and summary

---

### `view_document_metadata.ts` - View Full Document Metadata

View complete document metadata including all concepts in JSON format (useful for debugging or exploration).

**Usage:**
```bash
npx tsx scripts/view_document_metadata.ts <document_query>
```

**Examples:**
```bash
# View Sun Tzu document metadata
npx tsx scripts/view_document_metadata.ts "Sun Tzu Art of War"

# View healthcare system document
npx tsx scripts/view_document_metadata.ts "healthcare"
```

**Output:**
- Lists all matching documents
- Displays concept statistics
- Shows complete JSON metadata for selected document

---

## Environment Variables

You can customize the database location:

```bash
export CONCEPT_RAG_DB="/custom/path/to/database"
npx tsx scripts/extract_concepts.ts "query"
```

Default location: `~/.concept_rag`

---

## Notes

- Scripts use vector search to find documents, so partial matches work well
- The best matching document is automatically selected
- All scripts require a built project (`npm run build`)
- Scripts read from the compiled `dist/` directory



