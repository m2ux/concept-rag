# Chat Summary: Concept Retrieval Architecture Investigation

**Date**: 2025-11-27  
**Session Focus**: Understanding and improving concept-to-chunk mapping

## Session Overview

This session investigated why ~58% of concepts in the database have no chunk mappings, leading to a fundamental architectural improvement: page-based concept extraction.

## Key Topics Discussed

### 1. Catalog Summary Generation

**Question**: How are catalog summaries generated?

**Findings**:
- Catalog summaries are LLM-generated via `callOpenRouterChat()` in `hybrid_fast_seed.ts`
- Model: `x-ai/grok-4-fast` (optimized for fast, simple summaries)
- Prompt: "Write a high-level one sentence content overview"
- Input: First ~8,000 characters of document
- The summary is combined with extracted concepts and categories to form the catalog entry's `pageContent`

### 2. Concept and Category Summary Generation

**Question**: Is grok-4-fast also used for concept summaries?

**Findings**:
- Yes, `grok-4-fast` is used for both concept and category summaries
- Defined in `src/concepts/summary_generator.ts`
- Different from concept *extraction* which uses `openai/gpt-5-mini`

| Task | Model |
|------|-------|
| Catalog summaries | grok-4-fast |
| Concept summaries | grok-4-fast |
| Category summaries | grok-4-fast |
| Concept extraction | gpt-5-mini |

### 3. Concept Table Chunk IDs Investigation

**Question**: Does the current concept table have chunk_ids populated?

**Initial Finding**: All 59,587 concepts showed placeholder `[0]` for chunk_ids

**Root Cause**: Data was stored as Arrow Vectors (LanceDB internal format), requiring proper conversion to access actual values.

**After Proper Parsing**:
- 59,587 concepts have catalog_ids ✅
- Only 24,840 concepts (42%) have chunk_ids

### 4. Chunk Enrichment Process

**Question**: How is the chunks table populated with concept_ids?

**Findings**:
The process is two-phase:

1. **Phase 1: Document-Level LLM Extraction**
   - `ConceptExtractor.extractConcepts()` receives all chunks concatenated
   - LLM sees entire document, extracts semantic concepts
   - Returns `primary_concepts`, `categories`

2. **Phase 2: Chunk-Level Text Matching**
   - `ConceptChunkMatcher.matchConceptsToChunk()` does fuzzy string matching
   - For each chunk, checks if concept text literally appears
   - Uses 0.7 similarity threshold

### 5. The 42% Gap Mystery

**Question**: Why do only 42% of concepts have chunk mappings?

**Investigation**:
```
Total chunks: 471,454
Chunks with concept_ids: 304,090 (64%)
Unique concept_ids in chunks: 24,840
Concepts in concepts table: 59,587
```

**Root Cause Identified**: Semantic vs. Syntactic Mismatch

The LLM extracts **semantic concepts** that are inferred from meaning:
- "process-change management" - concept about change management
- "professional responsibility" - inferred from ethics discussions
- "strategic deception" - theme from military strategy

But `ConceptChunkMatcher` uses **text matching**:
```typescript
if (text.includes(conceptLower)) { return true; }
```

These inferred concepts don't appear as literal text, so they never match.

**Verification**:
```
"process-change management" appears in 0 chunks (of 50k sampled)
"technology-change management" appears in 0 chunks (of 50k sampled)
"professional responsibility and accountability" appears in 0 chunks (of 50k sampled)
```

### 6. Solution Exploration: Semantic Matching

**Question**: How easy is it to use semantic matching for chunk assignment?

**Findings**:
- Both concepts and chunks have 384-dim embeddings
- Vector search is possible but produces poor results
- Reason: Concept embeddings (short phrases) are semantically distant from chunk embeddings (full paragraphs)

**Test Result**:
```
Concept: "process-change management"
Top semantic match: "Sea, then reassembling them..." (distance: 0.54)
```
Semantic matching alone doesn't solve the problem.

### 7. Page-Based Extraction Solution

**Question**: Is it possible for the LLM to generate an index indicating concept positions?

**Proposed Solution**: Have the LLM report which pages each concept appears on during extraction.

**Advantages**:
- Pages are semantically meaningful (chapters, sections)
- LLMs can reliably track page-level positions
- Pages map to chunks via `loc.pageNumber` metadata

**Prototype Built**: `scripts/prototype_page_concept_extraction.ts`

**Prototype Results**:
| Metric | Old Approach | Page-Based |
|--------|--------------|------------|
| Concept-chunk mapping | 42% | 100% |
| Text verification | ~42% | 5.6% |

The 5.6% text verification is expected - concepts are *discussed* on those pages even if not literally mentioned.

### 8. Strategy Decision

**User Decision**: Accept semantic mapping (Option 1)

Rationale:
- 100% coverage is the goal
- LLM correctly identifies where concepts are *discussed*
- Text verification is unnecessary for semantic retrieval

### 9. Architecture Discussion

**User Question**: What's the optimal strategy for concept-centric retrieval?

**Options Analyzed**:
a. Store concept_ids against documents (catalog)
b. Associate concepts with pages
c. Use chunks as retrieval unit

**Recommendation**: Hierarchical retrieval using all three levels:
1. **Concepts table** → Find concept, get document associations
2. **Pages table** → Find pages where concept is discussed
3. **Chunks table** → Get actual text content

### 10. Pages Table Decision

**User Decision**: Create new `pages` table (Option B)

Schema:
```typescript
pages: {
  id: number,           // hash-based
  catalog_id: number,   // parent document
  page_number: number,  // 1-indexed
  concept_ids: number[],// concepts on this page
  text_preview: string, // first 500 chars
  vector: number[]      // 384-dim embedding
}
```

### 11. Seeding Script Created

**Script**: `scripts/seed_pages_table.ts`

**Features**:
- Resume capability via batch checkpointing
- Test mode with sample-docs
- Uses `gpt-5-mini` for extraction
- Creates pages table schema automatically

**Test Results (sample-docs)**:
| Document | Pages | With Concepts | Concepts |
|----------|-------|---------------|----------|
| Sun Tzu | 144 | 111 (77%) | 88 |
| Clean Architecture | 204 | 163 (80%) | 106 |
| Design Patterns | 431 | 237 (55%) | 111 |
| **Total** | **779** | **511 (65.6%)** | **305** |

## Decisions Made

1. ✅ Use page-based concept extraction instead of text matching
2. ✅ Accept semantic mapping (trust LLM page attribution)
3. ✅ Create new `pages` table for page-level concept associations
4. ✅ Include all recommended fields (text_preview, vector)
5. ✅ Use `gpt-5-mini` for extraction
6. ✅ Batch-based checkpointing for resume capability

## Artifacts Created

1. `scripts/prototype_page_concept_extraction.ts` - Proof of concept
2. `scripts/seed_pages_table.ts` - Production seeding script
3. `scripts/repair_chunk_ids.ts` - Temporary repair script (can be deleted)
4. `test_db/` - Test database with pages table populated

## Next Steps (from user's final request)

The user requested a hypothetical workflow analysis for:
- Applying architecture best practices to a codebase
- Using concepts related to key categories (software engineering, architecture, testing, etc.)
- Optimal chain of tool calls for concept retrieval

This led to the hierarchical retrieval strategy recommendation, which is the subject of detailed planning in this folder.
















