# ADR-0049: Content-Based Metadata Extraction

## Status

Accepted

## Context

The concept-rag database stores bibliographic metadata (title, author, year, publisher, ISBN) in the catalog table. This metadata enables search by author/year and provides source attribution in MCP tool responses.

### Technical Forces

- **Filename-based extraction** (`parseFilenameMetadata`) works well for properly formatted filenames using the `--` delimiter format
- **Paper metadata extraction** (`PaperMetadataExtractor`) extracts from paper content but only populates paper-specific fields (DOI, arXiv ID, abstract)
- **No fallback exists** when filename parsing fails—core bibliographic fields remain empty

### Business Forces

- Users expect to search documents by author and publication year
- MCP tools return incomplete source information, reducing trust in results
- Manual metadata entry doesn't scale with growing document libraries

### Operational Forces

- Estimated 50-60% of documents have incomplete metadata
- Documents with simple filenames (e.g., `book.pdf`, `2204.11193v1.pdf`) lack author/year
- Retroactive enrichment of existing databases is needed

## Decision Drivers

1. **Metadata completeness** - Need reliable author/year for search and attribution
2. **Minimal disruption** - Must not break existing filename-based extraction
3. **Performance** - Extraction should not significantly slow seeding
4. **Accuracy** - Extracted metadata should be trustworthy (confidence scoring)

## Considered Options

### Option 1: Content-Based Pattern Extraction (Selected)

Extract metadata from document front matter using regex patterns for copyright notices, title pages, and publisher information.

**Pros:**
- Fast (~100ms per document)
- No external API calls
- Works offline
- Deterministic and testable

**Cons:**
- Pattern matching may miss unusual formats
- Requires maintenance as new patterns discovered

### Option 2: LLM-Only Extraction

Use an LLM to analyze front matter and extract structured metadata.

**Pros:**
- Higher accuracy for edge cases
- Handles varied formatting naturally
- Can extract from unstructured text

**Cons:**
- Expensive (API costs per document)
- Slow (1-2s per document)
- Requires API connectivity
- Non-deterministic results

### Option 3: External API Lookup (ISBN/DOI)

Query external databases (Open Library, CrossRef) using ISBN or DOI when available.

**Pros:**
- Authoritative data source
- High accuracy when identifiers exist

**Cons:**
- Requires ISBN/DOI to be present (often missing)
- External dependency and API rate limits
- Doesn't help documents without identifiers

## Decision

Implement **Option 1: Content-Based Pattern Extraction** with the following design:

1. **Fallback pattern**: Filename extraction remains primary; content extraction fills gaps
2. **Confidence scoring**: Each extracted field includes a confidence score (0.0-1.0)
3. **Pattern-based extraction**: Use regex patterns for speed
4. **Focus on front matter**: Analyze first 3-5 pages (copyright page, title page)

### Processing Flow

```
parseFilenameMetadata(source)
│
├─ If metadata complete → use it
│
└─ If metadata incomplete (no author, year=0):
   ├─ Get front matter chunks (pages 1-5)
   ├─ contentMetadataExtractor.extract(chunks)
   └─ Merge: filename priority, content fills gaps
```

## Consequences

### Positive

- **Improved metadata coverage**: From ~10% to ~60% complete records
- **Reliable search**: Author/year filtering becomes usable
- **Richer MCP responses**: Source attribution for more documents
- **Non-destructive**: Existing well-formatted filenames unaffected
- **Extensible**: Can add LLM fallback for low-confidence extractions later

### Negative

- **Processing overhead**: Additional ~100ms per document during seeding
- **Accuracy variance**: Content extraction less reliable than explicit filename metadata
- **OCR dependency**: Poor quality scans may have garbled front matter
- **Pattern maintenance**: New document formats may require pattern updates

### Neutral

- Complements existing `PaperMetadataExtractor` (similar pattern, different scope)
- Backfill script enables retroactive metadata enrichment for existing databases

## Confirmation

The decision will be validated through:

1. **Diagnostic baseline**: Measure current metadata coverage before implementation
2. **Accuracy evaluation**: Compare extracted vs known metadata on test set
3. **Coverage measurement**: Re-run diagnostic after implementation
4. **Success criteria**:
   - Title extraction: 90%+ precision
   - Author extraction: 80%+ precision
   - Year extraction: 85%+ precision
   - Overall coverage: Improve from ~10% to ~60%

## Implementation

### Files to Create

- `src/infrastructure/document-loaders/content-metadata-extractor.ts`
- `src/infrastructure/document-loaders/__tests__/content-metadata-extractor.test.ts`
- `scripts/diagnostics/diagnose-metadata.ts`
- `scripts/backfill-metadata.ts`
- `scripts/evaluate-metadata-extraction.ts`

### Files to Modify

- `hybrid_fast_seed.ts` - Integrate content extraction fallback

## References

- `src/infrastructure/utils/filename-metadata-parser.ts` - Existing filename extraction
- `src/infrastructure/document-loaders/paper-metadata-extractor.ts` - Paper content extraction
- `docs/database-schema.md` - Catalog table metadata fields
- ADR-0046: Document Type Classification
