# Strategy Appraisal: Concept-Centric Retrieval Architecture

**Date**: 2025-11-27  
**Status**: Approved for Implementation

## Executive Summary

This document analyzes retrieval strategies for a concept-centric RAG system and recommends a **hierarchical retrieval architecture** using a new `pages` table as an intermediary between documents and chunks.

## Use Case Analysis

### Target Workflow

The user wants to:
1. Search for concepts in specific domains (software engineering, architecture, testing, etc.)
2. Apply best practices from their document library to a codebase
3. Get comprehensive, well-sourced information for each concept

### Current Pain Points

1. **Incomplete Coverage**: Only 42% of concepts link to actual content
2. **Loss of Context**: Chunks are arbitrary 500-char boundaries, losing semantic coherence
3. **No Positional Information**: Cannot tell where in a document a concept is discussed
4. **Inefficient Queries**: Must scan all chunks for concept matches

## Architecture Options Evaluated

### Option A: Store concept_ids on Catalog (Document-Level)

```typescript
catalog: {
  ...existing fields...,
  concept_ids: number[]  // All concepts in this document
}
```

**Pros**:
- Simple implementation
- Good for "which books cover X?" queries

**Cons**:
- Too coarse - a 500-page book might mention DI on only 3 pages
- Already achievable via `concepts.catalog_ids` (inverse relationship)
- Doesn't help with content retrieval

**Verdict**: ❌ Not sufficient for precision retrieval

---

### Option B: New Pages Table (Page-Level)

```typescript
pages: {
  id: number,
  catalog_id: number,
  page_number: number,
  concept_ids: number[],
  text_preview: string,
  vector: number[]
}
```

**Pros**:
- Semantically meaningful boundaries (chapters, sections)
- LLMs can reliably attribute concepts to pages
- Enables "where is X discussed?" queries
- Provides structural context for retrieval

**Cons**:
- New table to maintain
- Requires re-processing all documents
- Additional storage (~15% increase)

**Verdict**: ✅ Recommended - provides the missing link

---

### Option C: Enhanced Chunks (Chunk-Level Only)

```typescript
chunks: {
  ...existing fields...,
  page_number: number,    // NEW
  section_title?: string  // NEW
}
```

**Pros**:
- Minimal schema change
- Direct concept-to-content mapping

**Cons**:
- Chunks remain arbitrary boundaries
- No semantic grouping of related content
- Requires inferring page from `loc` metadata (inconsistent)

**Verdict**: ⚠️ Partial solution - should be combined with Option B

---

### Option D: Restore concept_ids to Catalog with Page Metadata

```typescript
catalog: {
  ...existing fields...,
  concept_pages: {
    [concept_id]: number[]  // Pages where concept appears
  }
}
```

**Pros**:
- Single-table lookup for document + pages
- No new table

**Cons**:
- Denormalized, could get very large
- Complex nested structure in LanceDB
- Harder to query efficiently

**Verdict**: ❌ Too complex, denormalized

## Recommended Strategy: Hierarchical Retrieval

Combine **Option B + Option C**: Create pages table AND add `page_number` to chunks.

### Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      HIERARCHICAL MODEL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CATALOG (Documents)                                            │
│  ├── id: 12345678                                               │
│  ├── source: "/books/Clean-Architecture.pdf"                    │
│  ├── summary: "Guide to software architecture..."               │
│  └── category_ids: [software_architecture, design_patterns]     │
│           │                                                     │
│           ▼                                                     │
│  PAGES (Sections)                                               │
│  ├── catalog_id: 12345678                                       │
│  ├── page_number: 11                                            │
│  ├── concept_ids: [DI_id, SOLID_id, clean_arch_id]              │
│  └── text_preview: "Chapter 3: Design Principles..."            │
│           │                                                     │
│           ▼                                                     │
│  CHUNKS (Paragraphs)                                            │
│  ├── catalog_id: 12345678                                       │
│  ├── page_number: 11        ← NEW FIELD                         │
│  ├── concept_ids: [DI_id]                                       │
│  └── text: "Dependency injection allows components to..."       │
│                                                                 │
│  CONCEPTS (Index)                                               │
│  ├── concept: "dependency injection"                            │
│  ├── catalog_ids: [12345678, 87654321, ...]                     │
│  └── summary: "A technique for achieving IoC..."                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Query Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    CONCEPT SEARCH FLOW                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Query: "dependency injection best practices"                  │
│                                                                │
│  Step 1: CONCEPTS TABLE                                        │
│  ├─ Find concept by name/embedding                             │
│  ├─ Get: summary, related_concepts, catalog_ids, synonyms      │
│  └─ Output: Concept definition + which docs cover it           │
│                                                                │
│  Step 2: PAGES TABLE (NEW)                                     │
│  ├─ Filter pages by concept_id + catalog_ids                   │
│  ├─ Get: page_numbers, text_preview for each relevant page     │
│  └─ Output: WHERE in each doc the concept is discussed         │
│                                                                │
│  Step 3: CHUNKS TABLE                                          │
│  ├─ Get chunks for those page ranges                           │
│  ├─ Rank by concept_density + vector similarity                │
│  └─ Output: Actual text content for LLM context                │
│                                                                │
│  Final Response:                                                │
│  {                                                             │
│    concept: "dependency injection",                            │
│    summary: "A technique where...",                            │
│    related: ["inversion of control", "SOLID"],                 │
│    sources: [                                                  │
│      {                                                         │
│        document: "Clean Architecture",                         │
│        pages: [11-15, 89-92],                                  │
│        key_passages: [chunk1, chunk2, chunk3]                  │
│      }                                                         │
│    ]                                                           │
│  }                                                             │
└────────────────────────────────────────────────────────────────┘
```

## Comparison with Current Approach

| Aspect | Current | Proposed |
|--------|---------|----------|
| Concept-chunk coverage | 42% | ~100% |
| Query path | concept → chunks (scan all) | concept → pages → chunks (targeted) |
| Context preservation | None (arbitrary chunks) | Page-level grouping |
| "Where is X?" queries | Not supported | Native support |
| Storage overhead | Baseline | +15% (pages table) |
| Query efficiency | O(n) chunk scan | O(1) page lookup |

## Implementation Phases

### Phase 1: Pages Table Seeding (Completed in Prototype)

**Script**: `scripts/seed_pages_table.ts`

- [x] Create pages table schema
- [x] Load PDFs and extract pages
- [x] LLM extraction with page numbers
- [x] Batch checkpointing for resume
- [x] Test on sample-docs

### Phase 2: Add page_number to Chunks

**Changes Required**:
1. Update `Chunk` domain model
2. Update `ChunkRepository` interface and implementation
3. Modify seeding to populate `page_number` from `loc.pageNumber`
4. Migration script for existing chunks

### Phase 3: Wire Pages into Retrieval

**Modified Tools**:
1. `concept_search` - **Replace implementation** with hierarchical retrieval (concept → pages → chunks)
2. `chunks_search` - Add page filtering option (optional)

**Note**: No new tool needed. The existing `concept_search` tool will be upgraded to use the hierarchical approach while maintaining the same name and backward-compatible parameters.

### Phase 4: Testing & Validation

- Unit tests for new repositories
- Integration tests for query flow
- Performance benchmarks
- Regression tests for existing tools

### Phase 5: Documentation

- ADR for architectural change
- Update database-schema.md
- Update tool documentation

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM page attribution errors | Medium | Low | Accept semantic correctness; don't require text verification |
| Performance regression | Low | Medium | Pages table provides faster lookups than chunk scanning |
| Storage increase | Certain | Low | ~15% increase is acceptable for query improvement |
| Breaking existing tools | Medium | High | Maintain backward compatibility; don't remove existing fields immediately |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Concept-chunk coverage | >95% | Count concepts with chunk mappings via pages |
| Query latency | <500ms | Benchmark hierarchical query |
| Tool compatibility | 100% | All existing MCP tools pass tests |
| Pages with concepts | >60% | Pages table statistics |

## Decision

**Approved**: Implement hierarchical retrieval with pages table.

**Rationale**:
1. Solves the 42% coverage gap fundamentally
2. Provides structural context for retrieval
3. Enables new query patterns ("where is X discussed?")
4. Low risk - additive change, doesn't break existing functionality
5. Prototype validated the approach

## Next Actions

1. [ ] Run `seed_pages_table.ts` on main database
2. [ ] Add `page_number` field to chunks table
3. [ ] Create chunk→page mapping from existing `loc` metadata
4. [ ] Upgrade `concept_search` tool to use hierarchical retrieval
5. [ ] Create ADR documenting the change

