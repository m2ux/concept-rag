# ADR-0046: Document Type Classification and Metadata Extraction

## Status
Accepted

## Date
2024-12-07

## Context

The system was originally designed to handle ebooks (PDFs and EPUBs) with a structure of title, table of contents, and chapters. Research papers have a fundamentally different structure:

- No chapters, but sections (Abstract, Introduction, Related Work, etc.)
- Mathematical formulas and diagrams
- Citation-heavy content
- Multiple authors with affiliations
- Academic metadata (DOI, ArXiv ID, venue, keywords)

Additionally, professional magazine articles (IEEE Software, Communications of the ACM) have yet another structure:

- Column/Editor format
- Shorter length (2-8 pages)
- No formal abstract section
- Fewer citations
- More conversational tone

The existing `document_type` field supported `'book' | 'paper' | 'article' | 'unknown'` but lacked:
1. Distinction between research papers and magazine articles
2. Robust detection heuristics
3. Content-based metadata extraction for papers

## Decision

### 1. Add 'magazine' Document Type

Extend the document type classification to include `'magazine'` for professional magazine articles:

```typescript
documentType: 'book' | 'paper' | 'magazine' | 'article' | 'unknown'
```

**Rationale**: Magazine articles have distinct characteristics that affect how they should be processed and presented. They lack formal abstracts but contain valuable practitioner-focused content.

### 2. Magazine Detection Heuristics

Detect magazine articles using signals from the first 500 characters (masthead area):

| Signal | Weight | Examples |
|--------|--------|----------|
| `ieee_software` | 0.5 | "IEEE SOFTWARE" |
| `ieee_computer` | 0.5 | "IEEE Computer" (not "IEEE Computer Society") |
| `cacm` | 0.5 | "Communications of the ACM" |
| `acm_queue` | 0.5 | "ACM Queue" |
| `column_pragmatic` | 0.4 | "PRAGMATIC DESIGNER" |
| `editor_format` | 0.4 | "Editor: George Fairbanks" |
| `ieee_cs_published` | 0.5 | "PUBLISHED BY THE IEEE COMPUTER SOCIETY" |

Additional signals:
- Short page count (2-8 pages): +0.2
- No abstract in first 3000 chars: +0.1
- Few citations (<10): +0.1

**Threshold**: Requires at least one strong signal AND total score ≥ 0.4

### 3. Improved Author Detection

The metadata extractor now handles multiple author formats:

**Vertical Format** (one author per line):
```
Balaji Arun
Virginia Tech
balajia@vt.edu
Binoy Ravindran
Virginia Tech
```

**Comma-Separated Format**:
```
Tanusree Sharma, Zhixuan Zhou, Andrew Miller, Yang Wang
```

**Author Line Detection**: The title extractor now recognizes author lines to prevent contamination:
- Multiple comma-separated capitalized names
- "Name and Name" patterns

### 4. Detection Priority

Document type is determined in this order:

1. **Magazine** - If magazine detection signals are strong (checked first to avoid DOI override)
2. **Paper** - If ArXiv ID or DOI present, or paper confidence ≥ 0.65
3. **Book** - If paper confidence ≤ 0.35
4. **Article** - If paper confidence between 0.35-0.65 (borderline)
5. **Unknown** - Otherwise

## Consequences

### Positive

- **Better Classification**: Magazine articles like IEEE Software columns are now correctly identified
- **Improved Metadata**: Author extraction improved from 63% to 100% on sample papers
- **Cleaner Titles**: Author names no longer contaminate title fields
- **Search Relevance**: Different document types can be weighted/filtered appropriately

### Negative

- **Complexity**: Additional detection logic increases code complexity
- **False Positives Risk**: Magazine detection patterns could match citations (mitigated by checking only first 500 chars)
- **Maintenance**: New magazine publications may need pattern additions

### Neutral

- **Backward Compatible**: Existing 'paper' and 'book' classifications unchanged
- **Schema Update**: `document_type` column accepts new 'magazine' value

## Implementation

### Files Changed

| File | Change |
|------|--------|
| `paper-detector.ts` | Added `detectMagazineArticle()` method, updated type union |
| `paper-metadata-extractor.ts` | Added `looksLikeAuthorLine()`, improved `parseAuthorNames()` |
| `search-result.ts` | Updated `documentType` type union |
| `hybrid_fast_seed.ts` | Updated type annotations |
| `database-schema.md` | Documented new type value |

### Test Coverage

- Unit tests for magazine detection patterns
- Integration tests with sample IEEE Software article
- Metadata extraction tests for various author formats

## Alternatives Considered

### 1. Treat Magazine as Paper Subtype

Could have added a `paperType: 'research' | 'magazine'` field instead of a new document type.

**Rejected**: Magazine articles are fundamentally different from research papers and warrant first-class classification.

### 2. LLM-Based Classification

Could use an LLM to classify document types with high accuracy.

**Rejected**: Adds latency and cost during ingestion. Heuristic-based detection is fast, deterministic, and sufficiently accurate.

### 3. PDF Metadata Only

Could rely solely on PDF metadata for classification.

**Rejected**: Many LaTeX-generated PDFs have sparse or generic metadata. Content-based heuristics are more reliable.

## References

- [Research Paper Support Work Package](.ai/planning/research-paper-support.md)
- [Database Schema](../database-schema.md)
