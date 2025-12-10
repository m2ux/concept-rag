# ADR-0049: Content-Based Metadata Extraction

## Status

Proposed

## Context

The concept-rag database stores bibliographic metadata (title, author, year, publisher, ISBN) in the catalog table. Currently, this metadata is extracted from filenames using a `--` delimiter format:

```
Title -- Author -- Date -- Publisher -- ISBN -- Hash.ext
```

When filenames don't follow this format (e.g., simple filenames like `book.pdf` or arXiv IDs like `2204.11193v1.pdf`), metadata fields remain empty or contain only the raw filename as title.

### Current State

- **Filename-based extraction** (`parseFilenameMetadata`) - Works well for properly formatted filenames
- **Paper metadata extraction** (`PaperMetadataExtractor`) - Extracts from paper content, but only populates paper-specific fields (DOI, arXiv ID, abstract)
- **No fallback** - When filename parsing fails, core bibliographic fields (author, year, publisher) remain empty

### Impact

- Search by author/year is unreliable
- Document attribution is missing
- MCP tools return incomplete source information
- Estimated 50-60% of documents have incomplete metadata

## Decision

Implement a **Content-Based Metadata Extraction** system that extracts bibliographic metadata from document content (chunks) when filename-based extraction fails.

### Design Principles

1. **Fallback pattern**: Filename extraction remains primary; content extraction fills gaps
2. **Confidence scoring**: Each extracted field includes a confidence score (0.0-1.0)
3. **Pattern-based extraction**: Use regex patterns for speed; optional LLM for disambiguation
4. **Focus on front matter**: Analyze first 3-5 pages (copyright page, title page)

### Extraction Patterns

```typescript
// Title patterns
const TITLE_PATTERNS = [
  /^([A-Z][^.!?]*?)(?:\n|by\s)/m,           // First capitalized line before "by"
  /^([A-Z][A-Za-z\s:,'-]+)$/m,              // Standalone title line
];

// Author patterns
const AUTHOR_PATTERNS = [
  /(?:by|By|BY)\s+([A-Z][a-zA-Z.\s]+)/,     // "by Author Name"
  /(?:Copyright|©)\s*(?:\d{4})?\s*(?:by\s+)?([A-Z][a-zA-Z.\s]+)/i,
  /(?:Author|Written by):\s*([A-Z][a-zA-Z.\s]+)/i,
];

// Year patterns
const YEAR_PATTERNS = [
  /(?:Copyright|©)\s*(\d{4})/i,              // Copyright year
  /(?:First published|Published)\s*(?:in\s+)?(\d{4})/i,
  /(\d{4})\s*Edition/i,                      // Edition year
];

// Publisher patterns
const PUBLISHER_PATTERNS = [
  /(?:Published by|Publisher:)\s*([A-Z][A-Za-z\s&,]+)/i,
  /(O'Reilly|Addison-Wesley|Pearson|Springer|Wiley|McGraw-Hill|Packt|Manning)/i,
];
```

### Interface

```typescript
interface ExtractedMetadata {
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  confidence: {
    title: number;
    author: number;
    year: number;
    publisher: number;
  };
}

interface ContentMetadataExtractor {
  extract(chunks: ChunkData[]): Promise<ExtractedMetadata>;
  extractWithLLM(chunks: ChunkData[]): Promise<ExtractedMetadata>;
}
```

### Processing Flow

```
1. parseFilenameMetadata(source)
   │
   ├─ If metadata complete → use it
   │
   └─ If metadata incomplete (no author, year=0):
      │
      ├─ Get front matter chunks (pages 1-5)
      │
      ├─ contentMetadataExtractor.extract(chunks)
      │
      └─ Merge: filename priority, content fills gaps
```

## Consequences

### Positive

- **Improved metadata coverage**: Estimate improvement from ~10% to ~60% complete records
- **Better search**: Author/year filtering becomes reliable
- **Richer MCP responses**: Source attribution available for more documents
- **Non-destructive**: Existing well-formatted filenames unaffected

### Negative

- **Processing overhead**: Additional ~100ms per document during seeding
- **Accuracy variance**: Content extraction less reliable than explicit filename metadata
- **OCR dependency**: Poor quality scans may have garbled front matter

### Neutral

- Complements existing `PaperMetadataExtractor` (similar pattern, different scope)
- Can be extended with LLM extraction for edge cases
- Backfill script enables retroactive metadata enrichment

## Implementation

### Files to Create

- `src/infrastructure/document-loaders/content-metadata-extractor.ts`
- `src/infrastructure/document-loaders/__tests__/content-metadata-extractor.test.ts`
- `scripts/diagnostics/diagnose-metadata.ts`
- `scripts/backfill-metadata.ts`
- `scripts/evaluate-metadata-extraction.ts`

### Files to Modify

- `hybrid_fast_seed.ts` - Integrate content extraction fallback

### Implementation Tasks

1. **Diagnostic script** - Analyze database for missing metadata
2. **Content extractor** - Pattern-based extraction from chunks
3. **Evaluation framework** - Measure accuracy against known-good data
4. **Seeding integration** - Fallback when filename parsing incomplete
5. **Backfill script** - Update existing catalog entries

## References

- Existing implementation: `src/infrastructure/utils/filename-metadata-parser.ts`
- Paper extractor: `src/infrastructure/document-loaders/paper-metadata-extractor.ts`
- Database schema: `docs/database-schema.md` (catalog table metadata fields)
- ADR-0046: Document Type Classification
