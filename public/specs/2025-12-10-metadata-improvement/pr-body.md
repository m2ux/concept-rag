## Summary

- Implement content-based extraction for bibliographic metadata (title, author, year, publisher)
- Use as fallback when filename-based parsing yields incomplete results
- Extract from document front matter (copyright pages, title pages)
- Enable retroactive backfill of existing database entries

## Problem

When seeding the database, metadata is extracted from filenames using `--` delimiter format. Documents with simple filenames (e.g., `book.pdf`, `2204.11193v1.pdf`) have incomplete metadata:
- Author field empty
- Year field zero
- Publisher field empty
- Search by author/year is unreliable
- **Estimated 50-60% of documents have incomplete metadata**

## Solution

Add pattern-based content extraction from document chunks:
- Scan front matter (pages 1-5) for metadata patterns
- Extract author from copyright notices ("Copyright © 2020 by Author Name")
- Extract year from copyright and publication dates
- Extract publisher from common patterns and known publisher names
- Confidence scoring for extracted values

## ADR

- [ADR-0049: Content-Based Metadata Extraction](https://github.com/m2ux/concept-rag/blob/feat/content-metadata-extraction/docs/architecture/adr0049-content-metadata-extraction.md)

## Implementation Tasks

- [ ] **Task 1:** Diagnostic script - Analyze database for missing metadata
- [ ] **Task 2:** Content extractor - Pattern-based extraction from chunks  
- [ ] **Task 3:** Evaluation framework - Measure accuracy against known-good data
- [ ] **Task 4:** Seeding integration - Fallback when filename parsing incomplete
- [ ] **Task 5:** Backfill script - Update existing catalog entries

## New Files

- `src/infrastructure/document-loaders/content-metadata-extractor.ts`
- `src/infrastructure/document-loaders/__tests__/content-metadata-extractor.test.ts`
- `scripts/diagnostics/diagnose-metadata.ts`
- `scripts/backfill-metadata.ts`
- `scripts/evaluate-metadata-extraction.ts`

## Success Metrics

| Metric | Target |
|--------|--------|
| Title extraction precision | 90%+ |
| Author extraction precision | 80%+ |
| Year extraction precision | 85%+ |
| Overall metadata coverage | Improve from ~10% to ~60% |

## Test Plan

- [ ] Unit tests for pattern matching
- [ ] Integration tests with sample documents
- [ ] Evaluation on documents with known metadata
- [ ] Manual validation of extraction accuracy













