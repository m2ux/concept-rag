# Metadata Detection and Improvement

**Status:** Planning  
**Priority:** HIGH  
**Created:** 2025-12-10

## Quick Summary

Improve metadata detection and availability for documents in the database. Many documents have incomplete metadata (title, author, year, etc.) when the filename-based parser fails to extract these fields.

## Problem

The current metadata extraction relies primarily on filename parsing using the `--` delimiter format:
```
Title -- Author -- Date -- Publisher -- ISBN -- Hash.ext
```

When filenames don't follow this format (e.g., simple filenames like `book.pdf` or `2204.11193v1.pdf`), metadata fields remain empty or contain only the raw filename as title.

## Solution

1. **Scan database** to detect documents with missing metadata
2. **Extract metadata from content** using chunk text analysis
3. **Evaluate accuracy** of content-based extraction
4. **Integrate fallback** into seeding workflow

## Files

| File | Purpose |
|------|---------|
| [01-implementation-plan.md](./01-implementation-plan.md) | Detailed implementation plan |

## Related Documentation

- [Database Schema](../../../docs/database-schema.md) - Catalog table metadata fields
- [ADR-0046: Document Type Classification](../../../docs/architecture/adr0046-document-type-classification.md)
- Current implementation:
  - `src/infrastructure/utils/filename-metadata-parser.ts` - Filename-based extraction
  - `src/infrastructure/document-loaders/paper-metadata-extractor.ts` - Paper content extraction
  - `hybrid_fast_seed.ts` - Seeding workflow













