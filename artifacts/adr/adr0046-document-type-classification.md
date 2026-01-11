# ADR-0046: Document Type Classification and Metadata Extraction

## Status
Accepted

## Date
2024-12-08

## Context

The system was originally designed to handle ebooks (PDFs and EPUBs) with a structure of title, table of contents, and chapters. Research papers have a fundamentally different structure:

- No chapters, but sections (Abstract, Introduction, Related Work, etc.)
- Mathematical formulas and diagrams
- Citation-heavy content
- Multiple authors with affiliations
- Academic metadata (DOI, ArXiv ID, venue, keywords)

Additionally, professional articles (IEEE Software, Communications of the ACM) have yet another structure:

- Column/Editor format
- Shorter length (2-8 pages)
- No formal abstract section
- Fewer citations
- More conversational tone

The existing `document_type` field needed:
1. Clear distinction between research papers and professional articles
2. Robust detection heuristics
3. Content-based metadata extraction for papers

## Decision

### 1. Simplified Document Type Classification

Use four document types with clear, non-overlapping semantics:

```typescript
documentType: 'book' | 'paper' | 'article' | 'unknown'
```

| Type | Description | Examples |
|------|-------------|----------|
| `'book'` | Long-form with chapters | Textbooks, monographs |
| `'paper'` | Research papers with academic structure | ArXiv preprints, journal papers, conference papers |
| `'article'` | Short-form professional content | IEEE Software columns, CACM articles, trade publications |
| `'unknown'` | Cannot determine with confidence | Borderline cases |

**Rationale**: Initially considered adding `'magazine'` as a separate type, but `'article'` serves the same purpose without redundancy. The old use of `'article'` as a "borderline/uncertain" bucket was replaced with `'unknown'` for clarity.

### 2. Article Detection Heuristics

Detect professional articles using signals from the first 500 characters (masthead area):

| Signal | Weight | Examples |
|--------|--------|----------|
| `article_ieee_software` | 0.5 | "IEEE SOFTWARE" |
| `article_ieee_computer` | 0.5 | "IEEE Computer" (not "IEEE Computer Society") |
| `article_cacm` | 0.5 | "Communications of the ACM" |
| `article_acm_queue` | 0.5 | "ACM Queue" |
| `article_column_pragmatic` | 0.4 | "PRAGMATIC DESIGNER" |
| `article_editor_format` | 0.4 | "Editor: George Fairbanks" |
| `article_ieee_cs_published` | 0.5 | "PUBLISHED BY THE IEEE COMPUTER SOCIETY" |

Additional signals:
- Short page count (2-8 pages): +0.2
- No abstract in first 3000 chars: +0.1
- Few citations (<10): +0.1

**Threshold**: Requires at least one strong signal AND total score ≥ 0.4

### 3. Book Detection Heuristics

Proactively detect books using structural and publisher signals:

| Signal | Weight | Examples |
|--------|--------|----------|
| `book_isbn` | 0.6 | ISBN-10/13 in content |
| `book_isbn_metadata` | 0.4 | ISBN in PDF metadata |
| `book_publisher` | 0.5 | O'Reilly, Springer, Packt, Manning, Apress, etc. |
| `book_many_chapters` | 0.5 | 5+ unique "Chapter N" occurrences |
| `book_chapters` | 0.3 | 3-4 unique chapters |
| `book_toc` | 0.4 | "Table of Contents" |
| `book_front_matter` | 0.4 | 2+ of: Preface, Foreword, Acknowledgments, Dedication |
| `book_has_preface` | 0.2 | Single front matter element |
| `book_back_matter` | 0.2 | Index, Appendix, Glossary |
| `book_copyright` | 0.2 | Copyright notice, "All rights reserved" |
| `book_very_long` | 0.5 | 300+ pages |
| `book_long` | 0.4 | 150-299 pages |
| `book_medium_length` | 0.2 | 80-149 pages |
| `book_parts` | 0.3 | Part I, Part II structure |

**Publisher Detection**: Checks first/last 10% of document for publisher names.

**Threshold**: Requires at least one structural signal (ISBN, publisher, chapters, TOC, front matter) AND total score ≥ 0.5, OR total score ≥ 1.0.

**Note**: Books with DOI or ArXiv ID are classified as papers (likely thesis or technical report).

### 4. Improved Author Detection

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

### 5. Detection Priority

Document type is determined in this order:

1. **Article** - If article detection signals are strong (checked first)
2. **Book** - If book detection signals are strong AND no DOI/ArXiv ID
3. **Paper** - If ArXiv ID or DOI present, or paper confidence ≥ 0.65
4. **Book** (fallback) - If paper confidence ≤ 0.35 or book signals present
5. **Unknown** - Otherwise (borderline cases)

This priority ensures:
- Trade magazine articles aren't misclassified as papers
- Books with ISBN/chapters are correctly identified
- DOI/ArXiv always indicates academic work (paper, not book)
- Borderline cases default to unknown rather than incorrect classification

## Consequences

### Positive

- **Clear Semantics**: Each document type has a distinct, non-overlapping meaning
- **Better Classification**: Professional articles like IEEE Software columns are correctly identified
- **Improved Metadata**: Author extraction improved from 63% to 100% on sample papers
- **Cleaner Titles**: Author names no longer contaminate title fields
- **Search Relevance**: Different document types can be weighted/filtered appropriately

### Negative

- **Complexity**: Additional detection logic increases code complexity
- **False Positives Risk**: Article detection patterns could match citations (mitigated by checking only first 500 chars)
- **Maintenance**: New publications may need pattern additions

### Neutral

- **Backward Compatible**: Existing 'paper' and 'book' classifications unchanged
- **Simplified Schema**: Removed redundant 'magazine' type in favor of 'article'

## Implementation

### Files Changed

| File | Change |
|------|--------|
| `paper-detector.ts` | Added `detectArticle()` and `detectBook()` methods |
| `paper-metadata-extractor.ts` | Added `looksLikeAuthorLine()`, improved `parseAuthorNames()` |
| `search-result.ts` | Updated `documentType` type union |
| `hybrid_fast_seed.ts` | Updated type annotations |
| `database-schema.md` | Documented type values |

### Test Coverage

- Unit tests for article detection patterns
- Unit tests for book detection (ISBN, publisher, chapters, parts)
- Integration tests with sample IEEE Software article
- Metadata extraction tests for various author formats

## Alternatives Considered

### 1. Separate 'magazine' Type

Initially implemented `'magazine'` as a distinct type from `'article'`.

**Rejected**: These are semantically identical - magazine articles are articles. Consolidating to `'article'` reduces complexity without losing information.

### 2. LLM-Based Classification

Could use an LLM to classify document types with high accuracy.

**Rejected**: Adds latency and cost during ingestion. Heuristic-based detection is fast, deterministic, and sufficiently accurate.

### 3. PDF Metadata Only

Could rely solely on PDF metadata for classification.

**Rejected**: Many LaTeX-generated PDFs have sparse or generic metadata. Content-based heuristics are more reliable.

## References

- [Database Schema](../database-schema.md)
