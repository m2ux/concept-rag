# 6. Hybrid Search Strategy with Multi-Signal Ranking

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Hybrid Search Implementation (October 13, 2025)

**Sources:**
- Planning: .ai/planning/2025-10-13-hybrid-search-implementation/

## Context and Problem Statement

The initial vector-only search implementation was missing documents when users searched for books by title [Source: `.ai/planning/2025-10-13-hybrid-search-implementation/SUMMARY.md`, lines 56-66]. For example, searching for "Distributed Systems" found only 2 of 4 books with those terms in their titles. The vector embeddings alone didn't give sufficient weight to exact title matches, causing relevant documents to rank poorly or be missed entirely.

**The Core Problem:** Pure vector search using simple word-hash embeddings doesn't reliably find documents when query terms appear in the title [Planning: `SUMMARY.md`, lines 32-39].

**Decision Drivers:**
* Title-based searches failing (found 2/4 books) [Source: `SUMMARY.md`, lines 56-66]
* Need for both semantic AND keyword matching [Inferred: from solution design]
* No re-seeding required (work with existing database) [Source: `SUMMARY.md`, line 167]
* Zero additional API costs [Source: `SUMMARY.md`, line 315]
* Fast implementation (5-minute setup) [Source: `SUMMARY.md`, line 318]

## Alternative Options

* **Option 1: Hybrid Search (Vector + BM25 + Title)** - Multi-signal ranking
* **Option 2: Improve Vector Embeddings** - Switch to semantic embeddings (OpenAI/Ollama)
* **Option 3: Add Titles to Summaries** - Include titles in indexed text
* **Option 4: Pure BM25** - Replace vector search with keyword search
* **Option 5: Query Expansion** - Expand queries before vector search

## Decision Outcome

**Chosen option:** "Hybrid Search with Multi-Signal Ranking (Option 1)", because it immediately fixed the title-matching problem without requiring re-seeding, provides best-of-both-worlds (semantic + keyword), and runs at zero additional cost.

### Scoring Formula

```typescript
hybridScore = (vectorScore × 0.4) + (bm25Score × 0.3) + (titleScore × 0.3)
```
[Source: `hybrid_search_client.ts`, line 110; referenced in `SUMMARY.md`, line 135]

**Signal Weights:**
1. **Vector Score (40%):** Semantic similarity from embeddings [Source: `SUMMARY.md`, line 45]
   - Handles: "Distributed Systems" ≈ "parallel computing" ≈ "concurrent systems"

2. **BM25 Score (30%):** Keyword matching in document text [Source: `SUMMARY.md`, line 48]
   - Counts term frequency in summaries using standard IR algorithm

3. **Title Score (30%):** Exact matching in filename [Source: `SUMMARY.md`, line 51]
   - Bonus: +10 when query terms found in title
   - Title extraction: Removes path and extensions automatically

### Implementation

**Files Created:** [Source: `SUMMARY.md`, lines 7-27]
1. `src/lancedb/hybrid_search_client.ts` - Core hybrid search logic
2. `src/tools/operations/hybrid_catalog_search.ts` - Hybrid search MCP tool
3. `src/tools/hybrid_registry.ts` - Tool registry for hybrid mode
4. `src/hybrid_index.ts` - MCP server using hybrid search
5. Documentation: `IMPROVING_SEARCH.md`, `HYBRID_SEARCH_QUICKSTART.md`, `SUMMARY.md`

**Title Extraction Pattern:**
```typescript
"Distributed Systems for practitioners -- Author.pdf"
  → "Distributed Systems for practitioners"
```
[Source: `SUMMARY.md`, lines 282-287]

### Consequences

**Positive:**
* **Immediate fix:** Found 4/4 books instead of 2/4 [Result: `SUMMARY.md`, lines 70-88]
* **No re-seeding:** Works with existing database immediately [Source: `SUMMARY.md`, line 167]
* **Zero cost:** No additional API calls [Source: `SUMMARY.md`, line 315]
* **Fast deployment:** 5-minute setup (change index file) [Source: `SUMMARY.md`, lines 93-126]
* **Backward compatible:** Can switch back to simple_index.js anytime [Source: `SUMMARY.md`, line 171]
* **Tunable:** Easy to adjust scoring weights [Source: `SUMMARY.md`, lines 128-144]
* **Best of both worlds:** Semantic understanding + keyword precision

**Negative:**
* **Score normalization complexity:** Three different score ranges to normalize
* **Weight tuning:** May need adjustment for different document types
* **More code to maintain:** Additional client, tools, and registry files
* **Debug complexity:** Multiple scoring components to troubleshoot

**Neutral:**
* **Hybrid scoring interpretation:** Users see multiple score fields
* **Configuration flexibility:** Can adjust weights for different use cases

### Confirmation

**Validation Results:** [Source: `SUMMARY.md`, lines 56-88]

**Before (Vector Only):**
- Query: "Distributed Systems"
- Found: 2 of 4 books (50% recall)
- Missed: "Continuous and Distributed Systems", "Understanding Distributed Systems"

**After (Hybrid Search):**
- Query: "Distributed Systems"  
- Found: 4 of 4 books (100% recall)
- All books with "Distributed" or "Systems" in title found
- Hybrid scores: 8.5, 8.2, 8.1, 7.8 (well-ranked)

## Pros and Cons of the Options

### Option 1: Hybrid Search (Vector + BM25 + Title) - Chosen

**Pros:**
* Immediate fix (no re-seeding) [Source: `SUMMARY.md`, line 167]
* 100% title match recall [Validated: `SUMMARY.md`, line 86]
* Combines semantic + keyword benefits
* Zero API costs [Source: `SUMMARY.md`, line 315]
* Fast implementation (5 minutes) [Source: `SUMMARY.md`, line 318]
* Tunable weights for optimization

**Cons:**
* Score normalization complexity
* May need weight tuning
* Additional code maintenance
* Three scoring components to debug

### Option 2: Improve Vector Embeddings

Switch to semantic embeddings (OpenAI ada-002 or Ollama).

**Pros:**
* True semantic understanding
* Better concept matching
* Industry-standard embeddings

**Cons:**
* **Requires re-seeding** all documents (hours of processing) [Source: `IMPROVING_SEARCH.md`]
* **Cost:** ~$0.02 per 1000 documents for OpenAI [Source: `SUMMARY.md`, line 194]
* **Ollama:** Requires local model + memory [Source: `SUMMARY.md`, line 195]
* Still may not solve title-matching problem completely
* Higher latency (API calls or local model inference)

### Option 3: Add Titles to Summaries

Include document titles explicitly in summary text during seeding.

**Pros:**
* Titles included in vector embeddings
* Better semantic matching overall
* Clean single-signal approach

**Cons:**
* **Requires re-seeding** all documents [Source: `SUMMARY.md`, line 183]
* **Time-consuming:** Must regenerate all summaries [Source: `SUMMARY.md`, line 184]
* Modifies indexed content (mixing title with summary)
* Doesn't help with existing database

### Option 4: Pure BM25

Replace vector search entirely with keyword-based BM25.

**Pros:**
* Excellent keyword matching
* Fast execution
* No embedding costs
* Deterministic results

**Cons:**
* **Loses semantic search capability** (major regression)
* No concept matching ("distributed systems" ≠ "parallel computing")
* No synonym handling
* Pure keyword dependency
* Against RAG best practices

### Option 5: Query Expansion

Expand queries with synonyms before vector search.

**Pros:**
* Improves semantic coverage
* Can help with related terms

**Cons:**
* Doesn't solve title-matching problem directly
* Added complexity
* May introduce noise
* Still requires embedding quality
* Later implemented as complementary feature (WordNet expansion)

## Implementation Notes

### Configuration Change

**Minimal user effort:** [Source: `SUMMARY.md`, lines 99-117]
```json
// Change MCP config from:
"args": ["/path/to/dist/simple_index.js", "~/.concept_rag"]

// To:
"args": ["/path/to/dist/hybrid_index.js", "~/.concept_rag"]
```

### Score Output

Search results include detailed scoring: [Source: `SUMMARY.md`, lines 294-307]
```json
{
  "_vector_score": 0.45,    // Semantic (0-1)
  "_bm25_score": 1.2,        // Keyword (0-∞)  
  "_title_score": 10.0,      // Title bonus (0 or 10)
  "_hybrid_score": 8.5,      // Combined
  "_distance": -7.5          // LanceDB distance (inverted)
}
```

### Weight Customization

Users can adjust weights: [Source: `SUMMARY.md`, lines 129-142]
```typescript
// Emphasize titles more:
const hybridScore = (vectorScore * 0.3) + (bm25Score * 0.2) + (titleScore * 0.5);

// Emphasize semantics more:
const hybridScore = (vectorScore * 0.6) + (bm25Score * 0.2) + (titleScore * 0.2);
```

### Evolution Path

This implementation became the foundation for later enhancements:
- October 13: Added conceptual search and WordNet expansion [See: ADR-0007, ADR-0008]
- November 14: Refactored into HybridSearchService [See: ADR-0022]

## Related Decisions

- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md) - Database supports hybrid queries
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - Retrieval strategy enhancement
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Added as 4th signal same day
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md) - Added as 5th signal same day
- [ADR-0022: HybridSearchService](adr0022-hybrid-search-service-extraction.md) - Later service extraction

## References

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: Explicit decision documented October 13, 2024
- Metrics validated: 2/4 → 4/4 books found (SUMMARY.md lines 56-88)
- Test results documented in planning folder

**Traceability:** Every metric traces to planning documents in .ai/planning/2025-10-13-hybrid-search-implementation/
