# Extract Concepts Script Update

## Changes Made

Updated `scripts/extract_concepts.ts` to work with the new concept extraction schema.

## New Schema

The concept extraction now uses a simplified structure:

```typescript
interface ConceptMetadata {
    primary_concepts: string[];         // All important concepts, methods, ideas
    categories: string[];               // 2-3 domains
    related_concepts: string[];         // 3-5 related topics
}
```

### Removed Fields
- `technical_terms` - No longer extracted separately
- `summary` - Now part of document metadata (text_preview field)

### Changes
- **Primary Concepts**: Now includes all important concepts (previously split between primary concepts and technical terms)
- **Categories**: Domain classification (2-3 categories)
- **Related Concepts**: Related topics and themes (3-5 concepts)

## Script Updates

### 1. Statistics Display
```typescript
console.log(`📊 Concept Statistics:`);
console.log(`   - Primary Concepts: ${concepts.primary_concepts?.length || 0}`);
console.log(`   - Related Concepts: ${concepts.related_concepts?.length || 0}`);
console.log(`   - Categories: ${concepts.categories?.length || 0}`);
console.log(`   - Total: ${totalConcepts}\n`);
```

### 2. JSON Output
Added summary field from document metadata:
```typescript
const jsonOutput = {
    document: doc.source,
    document_hash: doc.hash,
    extracted_at: new Date().toISOString(),
    total_concepts: totalConcepts,
    primary_concepts: concepts.primary_concepts || [],
    related_concepts: concepts.related_concepts || [],
    categories: concepts.categories || [],
    summary: doc.text_preview || doc.summary || ''
};
```

### 3. Markdown Output
- Primary concepts table
- Related concepts table
- Categories list
- Summary section (from document metadata)

## Usage

### Basic Usage
```bash
# Extract concepts in markdown format (default)
npx tsx scripts/extract_concepts.ts "Sun Tzu Art of War"

# Extract concepts in JSON format
npx tsx scripts/extract_concepts.ts "Christopher Alexander" json
```

### Output Files
- Markdown: `<document_name>_concepts.md`
- JSON: `<document_name>_concepts.json`

## Example Output

### Markdown Format
```markdown
# Concepts Extracted from Document

**Document:** art_of_war.pdf
**Full Path:** /path/to/art_of_war.pdf
**Total Concepts:** 120

---

## Primary Concepts (85)

| # | Concept |
|---|---------|
| 1 | military strategy |
| 2 | tactical planning |
...

## Related Concepts (35)

| # | Concept |
|---|---------|
| 1 | game theory |
| 2 | organizational behavior |
...

## Categories (7)

- military strategy
- ancient chinese history
- leadership and management
...

## Summary

This document presents excerpts from Sun Tzu's Art of War...
```

### JSON Format
```json
{
  "document": "/path/to/art_of_war.pdf",
  "document_hash": "abc123...",
  "extracted_at": "2025-10-15T...",
  "total_concepts": 120,
  "primary_concepts": [
    "military strategy",
    "tactical planning",
    ...
  ],
  "related_concepts": [
    "game theory",
    "organizational behavior",
    ...
  ],
  "categories": [
    "military strategy",
    "ancient chinese history",
    ...
  ],
  "summary": "This document presents excerpts from Sun Tzu's Art of War..."
}
```

## Compatibility

- ✅ Works with databases created by `hybrid_fast_seed.ts`
- ✅ Compatible with the new ConceptExtractor
- ✅ Handles missing fields gracefully
- ✅ Backward compatible with old schema (will show empty arrays for missing fields)

## Testing

To test the updated script:

```bash
# 1. Ensure you have a database with the new schema
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs --overwrite

# 2. Extract concepts from a document
npx tsx scripts/extract_concepts.ts "document name"

# 3. Verify the output file
cat document_name_concepts.md
```

## Notes

- The script uses vector search to find the best matching document
- Shows top 10 matches before selecting the best one
- Gracefully handles documents without concept metadata
- Uses the CONCEPT_RAG_DB environment variable or defaults to `~/.concept_rag`


