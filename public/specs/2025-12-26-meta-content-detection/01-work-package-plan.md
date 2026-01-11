# Work Package Plan: Meta Content Detection

## Overview

**Issue:** [#47 - Exclude title and meta content from discovery](https://github.com/m2ux/concept-rag/issues/47)
**Type:** Feature Enhancement
**Estimated Effort:** 6-10h agentic + 2h review

---

## Problem Statement

Search results are polluted with non-content text such as document headers, table of contents entries, page numbers, running headers/footers, and other meta-content. This reduces retrieval quality by returning chunks that contain query terms but provide no substantive information.

### Examples of Problematic Content

**Table of Contents Pollution:**
```
Chunk: "Chapter 5: Dependency Injection............................45"
Score: 0.82 (high BM25 match on exact terms)
```

**Front Matter:**
```
Chunk: "For my wife, who understood when I said 
'I need to finish the chapter on dependency injection'"
Score: 0.78
```

---

## Scope

### In Scope

- ✅ Add `is_toc`, `is_front_matter`, `is_back_matter`, `is_meta_content` fields to chunk schema
- ✅ Implement `MetaContentDetector` class with pattern matching
- ✅ Integrate detection into seeding pipeline
- ✅ Add `excludeMetaContent` option to `HybridSearchOptions`
- ✅ Create migration script to classify existing chunks
- ✅ Unit and integration tests

### Out of Scope

- ❌ Running header/footer detection (requires cross-page analysis - Phase 2)
- ❌ `is_header_footer` field (deferred)
- ❌ ML-based classification (heuristics sufficient)

---

## Approach

### Architecture

```
Seeding Pipeline:
Document Loading → Text Splitting → Chunk Classification → Persist
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      ▼                      │
                    │    ReferencesDetector → is_reference        │
                    │    MathContentHandler → has_math, issues    │
                    │    MetaContentDetector → is_toc, is_front   │
                    │                          is_back, is_meta   │
                    └─────────────────────────────────────────────┘
```

### Detection Heuristics

| Content Type | Detection Method |
|-------------|------------------|
| **ToC** | Pattern: `Title.....Page#`, "Contents" header |
| **Front Matter** | Keywords + page position (first 10-15%) |
| **Back Matter** | Keywords + page position (last 10-15%) |

---

## Tasks

### Task 1: Create MetaContentDetector Class (~2h)

**Goal:** Implement pattern-based detection for ToC, front matter, and back matter.

**Deliverables:**
- `src/infrastructure/document-loaders/meta-content-detector.ts`
- Unit tests in `src/infrastructure/document-loaders/__tests__/meta-content-detector.test.ts`

**Implementation:**
```typescript
export interface MetaContentAnalysis {
  isToc: boolean;
  isFrontMatter: boolean;
  isBackMatter: boolean;
  isMetaContent: boolean;  // Aggregate
  confidence: number;
  matchedPatterns: string[];
}

export class MetaContentDetector {
  // Detection patterns for each content type
  // analyze() method for single chunk
  // analyzeBatch() method for document-level context
}
```

**Acceptance Criteria:**
- [ ] ToC entries with `.....Page#` pattern detected
- [ ] Front matter keywords detected (Copyright, ISBN, Preface, etc.)
- [ ] Back matter keywords detected (Index, Glossary, Appendix)
- [ ] Page position heuristics applied
- [ ] Unit tests pass with >90% accuracy on test fixtures

---

### Task 2: Add Schema Fields to Chunks Table (~1h)

**Goal:** Extend chunk schema with new classification fields.

**Deliverables:**
- Update `hybrid_fast_seed.ts` to include new fields
- Update `src/__tests__/test-helpers/integration-test-data.ts` with new fields
- Update `src/domain/models/search-result.ts` if needed

**Implementation:**
```typescript
// In createLanceTableWithSimpleEmbeddings (hybrid_fast_seed.ts)
baseData.is_toc = doc.metadata.is_toc ?? false;
baseData.is_front_matter = doc.metadata.is_front_matter ?? false;
baseData.is_back_matter = doc.metadata.is_back_matter ?? false;
baseData.is_meta_content = doc.metadata.is_meta_content ?? false;
```

**Acceptance Criteria:**
- [ ] New fields added to chunk data structure
- [ ] Fields default to false (backward compatible)
- [ ] Test helpers updated

---

### Task 3: Integrate Detection into Seeding Pipeline (~1.5h)

**Goal:** Call MetaContentDetector during document processing.

**Deliverables:**
- Integration in `hybrid_fast_seed.ts` after chunk splitting
- Logging for meta content detection statistics

**Implementation:**
```typescript
// After MathContentHandler detection
{
    const metaDetector = new MetaContentDetector();
    let tocCount = 0, frontCount = 0, backCount = 0;
    
    for (const chunk of newChunks) {
        const analysis = metaDetector.analyze(
            chunk.pageContent,
            chunk.metadata.page_number,
            totalPages
        );
        chunk.metadata.is_toc = analysis.isToc;
        chunk.metadata.is_front_matter = analysis.isFrontMatter;
        chunk.metadata.is_back_matter = analysis.isBackMatter;
        chunk.metadata.is_meta_content = analysis.isMetaContent;
        
        if (analysis.isToc) tocCount++;
        if (analysis.isFrontMatter) frontCount++;
        if (analysis.isBackMatter) backCount++;
    }
    
    if (tocCount + frontCount + backCount > 0) {
        console.log(`📑 Detected meta content: ${tocCount} ToC, ${frontCount} front, ${backCount} back`);
    }
}
```

**Acceptance Criteria:**
- [ ] Detection runs for all new chunks
- [ ] Page context passed for position-based heuristics
- [ ] Statistics logged during seeding

---

### Task 4: Add excludeMetaContent Filter to Search (~1h)

**Goal:** Enable filtering meta content from search results.

**Deliverables:**
- Update `HybridSearchOptions` interface
- Update `ConceptualHybridSearchService.performSearch()`
- Update `SearchQuery` interface
- Update default behavior in `LanceDBChunkRepository.search()`

**Implementation:**
```typescript
// HybridSearchOptions
interface HybridSearchOptions {
  excludeReferences?: boolean;
  excludeExtractionIssues?: boolean;
  excludeMetaContent?: boolean;  // NEW
}

// In performSearch filter building
if (options.excludeMetaContent) {
  filterParts.push('is_meta_content = false');
}
```

**Acceptance Criteria:**
- [ ] Filter option available in HybridSearchOptions
- [ ] Filter correctly applied in vector search
- [ ] Default behavior excludes meta content for chunk searches

---

### Task 5: Create Migration Script for Existing Chunks (~1.5h)

**Goal:** Classify existing database chunks with new meta content fields.

**Deliverables:**
- `scripts/populate-meta-content.ts`
- Documentation in scripts/README.md

**Implementation:**
Follow pattern from `populate-concept-density.ts`:
1. Load all chunks
2. For each chunk, run MetaContentDetector.analyze()
3. Rebuild table with new fields
4. Recreate vector index

**Acceptance Criteria:**
- [ ] Script runs on production database
- [ ] All chunks classified with new fields
- [ ] Vector index recreated
- [ ] Statistics reported

---

## Success Criteria

- [ ] ToC entries detected with >90% accuracy
- [ ] Front/back matter detected for standard document structures  
- [ ] Search results no longer include ToC entries for keyword queries
- [ ] Existing `is_reference` behavior unchanged
- [ ] Schema migration is backward compatible
- [ ] All existing tests pass
- [ ] Migration script successfully classifies production data

---

## Testing Strategy

### Unit Tests

- `meta-content-detector.test.ts` - Pattern matching accuracy
- Test fixtures with known ToC, front matter, back matter content

### Integration Tests

- `search-filtering.integration.test.ts` - Add meta content filtering tests
- Verify `excludeMetaContent` filter works correctly

### Manual Validation

- Run migration on test database
- Search for terms that appear in ToC entries
- Verify ToC chunks excluded from results

---

## Files to Modify

| File | Change |
|------|--------|
| `src/infrastructure/document-loaders/meta-content-detector.ts` | NEW - Detection class |
| `src/infrastructure/document-loaders/__tests__/meta-content-detector.test.ts` | NEW - Unit tests |
| `hybrid_fast_seed.ts` | Add detection integration |
| `src/domain/interfaces/services/hybrid-search-service.ts` | Add excludeMetaContent option |
| `src/infrastructure/search/conceptual-hybrid-search-service.ts` | Implement filter |
| `src/domain/models/search-result.ts` | Add excludeMetaContent to SearchQuery |
| `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts` | Set default |
| `src/__tests__/test-helpers/integration-test-data.ts` | Add new fields |
| `src/__tests__/integration/search-filtering.integration.test.ts` | Add meta content tests |
| `scripts/populate-meta-content.ts` | NEW - Migration script |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| False positives (content marked as ToC) | Conservative patterns, confidence threshold |
| False negatives (ToC not detected) | Multiple pattern variants, position heuristics |
| Schema migration breaks existing data | Default false, additive change |
| Performance impact during seeding | Pattern matching is O(n), minimal overhead |

---

## References

- [Issue #47](https://github.com/m2ux/concept-rag/issues/47) - Original issue
- [ADR-0046](../../../docs/architecture/adr0046-document-type-classification.md) - Document type classification
- [ReferencesDetector](../../../src/infrastructure/document-loaders/references-detector.ts) - Pattern to follow
- [MathContentHandler](../../../src/infrastructure/document-loaders/math-content-handler.ts) - Pattern to follow





