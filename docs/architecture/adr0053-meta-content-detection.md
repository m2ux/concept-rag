# ADR-0053: Meta Content Detection and Filtering

## Status

Proposed

## Date

2024-12-26

## Context

Search results are polluted with non-content text such as document headers, table of contents entries, page numbers, and other meta-content. This reduces retrieval quality by returning chunks that contain query terms but provide no substantive information.

### Problem Examples

**Table of Contents Pollution:**
```
Chunk: "Chapter 5: Dependency Injection............................45"
Score: 0.82 (high BM25 match on exact terms)
```
This chunk tells the user nothing about dependency injection - it's just a ToC entry.

**Front Matter:**
```
Chunk: "For my wife, who understood when I said 
'I need to finish the chapter on dependency injection'"
Score: 0.78
```
Dedication pages that mention terms provide no useful information.

### Current State

The project already handles some content classification:
- ✅ `is_reference` - Filters out bibliography/reference sections
- ✅ `has_extraction_issues` - Filters out chunks with garbled math/OCR issues
- ✅ `has_math` - Identifies mathematical content

**Missing:**
- ❌ Table of Contents (ToC) detection and filtering
- ❌ Front matter (title pages, copyright, dedications)
- ❌ Back matter (index, glossary, appendices)

## Decision

### 1. New Classification Fields

Add boolean fields to the chunks schema:

```typescript
interface ChunkClassificationFields {
  // Existing
  is_reference: boolean;
  has_extraction_issues: boolean;
  has_math: boolean;
  
  // New
  is_toc: boolean;              // Table of contents entry
  is_front_matter: boolean;     // Title page, copyright, dedication, preface
  is_back_matter: boolean;      // Index, glossary, appendices
  is_meta_content: boolean;     // Aggregate: is_toc OR is_front_matter OR is_back_matter
}
```

### 2. MetaContentDetector Class

Implement pattern-based detection following the established `ReferencesDetector` pattern:

```typescript
export class MetaContentDetector {
  // ToC patterns
  private readonly TOC_PATTERNS = [
    /^(Chapter|Section|\d+\.)\s+.+?\.{3,}\s*\d+$/m,  // "Chapter 1...........5"
    /^Contents$/im,
    /^Table of Contents$/im,
    /^\d+\.\d+\s+.+?\s+\d+$/m  // "1.2 Topic Name  42"
  ];
  
  // Front matter patterns
  private readonly FRONT_MATTER_PATTERNS = [
    /^(Dedication|Preface|Foreword|Acknowledgments)$/im,
    /^Copyright\s+©/im,
    /^ISBN\s+[\d-]+/im,
    /^All rights reserved/im,
    /^First (published|edition)/im
  ];
  
  // Back matter patterns
  private readonly BACK_MATTER_PATTERNS = [
    /^(Index|Glossary|Appendix\s+[A-Z]?)$/im,
    /^About the Author/im
  ];
  
  analyze(text: string, pageNumber: number, totalPages: number): MetaContentAnalysis;
}
```

### 3. Detection Heuristics

| Content Type | Detection Method |
|-------------|------------------|
| **ToC** | Pattern: `Title.....Page#`, "Contents" header, high density of ToC-like lines |
| **Front Matter** | Keywords + page position (first 10-15% of document) |
| **Back Matter** | Keywords + page position (last 10-15% of document) |

### 4. Search Filter Extension

Add `excludeMetaContent` option to search:

```typescript
interface HybridSearchOptions {
  excludeReferences?: boolean;      // Existing
  excludeExtractionIssues?: boolean; // Existing
  excludeMetaContent?: boolean;      // NEW - excludes ToC, front/back matter
}
```

Default behavior: `excludeMetaContent: true` for chunk searches.

### 5. Migration Script

Create `scripts/populate-meta-content.ts` to classify existing chunks, following the pattern from `populate-concept-density.ts`.

## Consequences

### Positive

- **Improved Retrieval Quality**: Search results no longer polluted with ToC entries
- **Consistent Pattern**: Follows established `ReferencesDetector` approach
- **Simple Heuristics**: Fast pattern matching, no ML dependencies
- **Backward Compatible**: New fields default to `false`
- **Single Filter Option**: `excludeMetaContent` provides simple UX

### Negative

- **Schema Expansion**: Four new boolean fields per chunk
- **False Positives Risk**: Aggressive patterns could mark content as ToC
- **Migration Required**: Existing databases need script to classify chunks

### Neutral

- **Running Headers Deferred**: Cross-page analysis complexity deferred to future work
- **Storage Impact**: Minimal - 4 booleans per chunk

## Implementation

### Files Changed

| File | Change |
|------|--------|
| `src/infrastructure/document-loaders/meta-content-detector.ts` | NEW - Detection class |
| `hybrid_fast_seed.ts` | Integrate detection into pipeline |
| `src/domain/interfaces/services/hybrid-search-service.ts` | Add `excludeMetaContent` |
| `src/infrastructure/search/conceptual-hybrid-search-service.ts` | Implement filter |
| `src/domain/models/search-result.ts` | Add to `SearchQuery` |
| `scripts/populate-meta-content.ts` | NEW - Migration script |

### Test Coverage

- Unit tests for pattern matching accuracy
- Integration tests for filter functionality
- Manual validation on diverse document corpus

## Alternatives Considered

### 1. ML-Based Classification

Train a model to classify chunks as content vs meta-content.

**Rejected**: Adds latency, complexity, and dependencies. Heuristic patterns are sufficient and deterministic.

### 2. Delete Meta Content Chunks

Remove ToC/front matter chunks entirely rather than marking them.

**Rejected**: Irreversible data loss. Marking preserves information for users who may want it.

### 3. Running Header Detection (Phase 1)

Detect running headers/footers by analyzing repeated text across pages.

**Deferred**: Requires cross-page analysis which adds complexity. Can be added in future phase.

## References

- [Issue #47](https://github.com/m2ux/concept-rag/issues/47) - Original issue
- [ADR-0046](./adr0046-document-type-classification.md) - Document type classification
- `src/infrastructure/document-loaders/references-detector.ts` - Pattern to follow

