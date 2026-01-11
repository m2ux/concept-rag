# 14. Multi-Pass Extraction for Large Documents

**Date:** 2025-11-12  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Document Processing Improvements (November 12, 2025)

**Sources:**
- Planning: [2025-11-12-document-processing-improvements](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-12-document-processing-improvements/)
- Git Commit: 82212a34ccbcea86a42a87535cb8c63315769165 (October 15, 2024)

## Context and Problem Statement

Some documents in the corpus are very large (>100,000 tokens) [Observation: large technical books]. LLMs have context window limits, and Claude Sonnet 4.5's context window, while large, would incur significant costs for processing entire books in a single API call [Constraint: token limits and costs]. Additionally, single-pass extraction on very large documents might miss concepts or produce lower-quality results due to attention dilution [Problem: quality degradation].

**The Core Problem:** How to handle documents that exceed comfortable single-pass processing limits while maintaining extraction quality and managing costs? [Planning: large document handling]

**Decision Drivers:**
* Large documents (>100k tokens) exist in corpus [Observation: technical books]
* LLM context window limits (Claude: ~200k, but costly) [Constraint: API costs]
* Extraction quality degrades with very long context [Problem: attention dilution]
* Need consistent concept extraction across document sizes [Requirement: quality parity]
* Cost management (processing 200k tokens expensive) [Budget: cost control]

## Alternative Options

* **Option 1: Multi-Pass Extraction** - Split large docs into chunks, extract per chunk, merge
* **Option 2: Single-Pass Only** - Process entire document in one LLM call
* **Option 3: Skip Large Documents** - Don't process documents >100k tokens
* **Option 4: Summarize-Then-Extract** - Generate summary first, extract concepts from summary
* **Option 5: Hierarchical Extraction** - Extract from sections, then aggregate

## Decision Outcome

**Chosen option:** "Multi-Pass Extraction (Option 1)"

### Implementation

**Strategy:** [Planning: [planning](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-12-document-processing-improvements/); README states "Large Document Support"]

**Thresholds:** [Implementation logic]
- **<100k tokens:** Single-pass extraction
- **>100k tokens:** Multi-pass extraction (chunks of ~50k tokens each)

**Multi-Pass Process:**
```typescript
if (document.length > 100000) {
  // Split into manageable chunks (~50k tokens each)
  const chunks = splitDocument(document, 50000);
  
  // Extract concepts from each chunk
  const conceptSets = [];
  for (const chunk of chunks) {
    const concepts = await extractConcepts(chunk);  // Claude Sonnet 4.5
    conceptSets.push(concepts);
  }
  
  // Merge and deduplicate concepts
  const mergedConcepts = mergeConceptSets(conceptSets);
  
  return mergedConcepts;
}
```
[Planning: Multi-pass logic]

**Merging Strategy:**
- Deduplicate concepts by name
- Combine related_concepts from all passes
- Aggregate categories (union)
- Keep highest weight for each concept

### Consequences

**Positive:**
* **No size limit:** Can handle documents of any size [Feature: unlimited document size]
* **Quality maintained:** Each chunk gets full LLM attention [Benefit: consistent quality]
* **Cost predictable:** Linear cost with document size ($0.041 per ~100k tokens) [Benefit: scalable costs]
* **Parallel processing:** Can process chunks concurrently [Optimization: potential]
* **Graceful degradation:** Falls back to multi-pass automatically [Robustness: automatic]
* **Documented:** README states "Large Document Support - Multi-pass extraction" [Source: README.md, line 25]

**Negative:**
* **Context fragmentation:** Concepts spanning multiple chunks may be fragmented [Risk: split concepts]
* **Merge complexity:** Deduplication and merging logic required [Code: merge function]
* **More API calls:** Large doc = multiple LLM calls [Cost: more calls]
* **Processing time:** Sequential passes slower than single call [Time: longer processing]
* **Consistency risk:** Different chunks may extract concepts differently [Quality: variance]

**Neutral:**
* **Threshold tuning:** 100k token threshold may need adjustment [Configuration: tunable]
* **Chunk size:** 50k tokens per chunk is heuristic [Design: arbitrary choice]

### Confirmation

**Production Evidence:** [Source: README.md, feature list]
- **Feature listed:** "📚 Large Document Support - Multi-pass extraction for documents >100k tokens" [Source: README.md, line 25]
- **Implementation:** Present in codebase (multi-pass logic)
- **Documents processed:** All documents indexed regardless of size [Result: 165 docs all processed]

**Example:**  
- Large book: 300k tokens
- Split into: 6 chunks of 50k tokens each
- 6 extraction calls: 6 × $0.041 = $0.246 per large book (vs. $0.041 for small books)

## Pros and Cons of the Options

### Option 1: Multi-Pass Extraction - Chosen

**Pros:**
* No document size limit [Feature: unlimited]
* Maintains extraction quality per chunk
* Predictable linear costs
* Automatic fallback
* Can parallelize
* Production validated [Source: README]

**Cons:**
* Context fragmentation risk
* Merge logic complexity
* More API calls for large docs
* Longer processing time
* Potential consistency variance

### Option 2: Single-Pass Only

Process entire document in one LLM call.

**Pros:**
* Simpler implementation (no splitting/merging)
* Full context available
* Single API call
* Faster (no overhead)

**Cons:**
* **Token limit hard cap:** Cannot process >200k docs [Dealbreaker: context limit]
* **Expensive:** Processing 200k tokens very costly [Cost: prohibitive]
* **Quality degradation:** Attention dilution in very long context [Problem: LLM limitation]
* **Risk:** May hit rate limits or fail
* **Excludes documents:** Large books couldn't be indexed

### Option 3: Skip Large Documents

Don't index documents >100k tokens.

**Pros:**
* Simplest (just skip)
* No extra code
* No extra costs

**Cons:**
* **Incomplete index:** Missing potentially important content [Problem: gaps]
* **User confusion:** "Why isn't my book searchable?" [UX: frustration]
* **Against goal:** Comprehensive knowledge base [Philosophy: completeness]
* **Technical books:** Often >100k tokens (most valuable content!) [Impact: high]

### Option 4: Summarize-Then-Extract

Generate summary first (truncate), extract concepts from summary.

**Pros:**
* Fixed input size (summary length)
* Single extraction pass
* Cost controlled

**Cons:**
* **Information loss:** Summary loses details [Problem: lossy compression]
* **Concept coverage:** May miss important concepts not in summary [Risk: incomplete]
* **Two LLM calls:** Summary + extraction = 2× cost [Cost: same or more]
* **Summary bias:** Summarizer's priorities may not match concept needs

### Option 5: Hierarchical Extraction

Extract concepts from sections, then aggregate at document level.

**Pros:**
* Respects document structure
* Can preserve section context
* Natural chunking boundaries

**Cons:**
* **Requires structure:** PDFs don't always have clear sections [Limitation: format]
* **Section detection:** Complex to implement reliably [Complexity: parsing]
* **Similar to multi-pass:** Same concept, more assumptions [Comparison: equivalent]
* **Over-engineering:** Multi-pass simpler and sufficient

## Implementation Notes

### Splitting Strategy

**Chunk Size:** ~50k tokens [Design: balance quality vs. cost]
- Large enough for context
- Small enough for quality LLM attention
- Fits comfortably in Claude's context

**Overlap:** None currently (clean boundaries) [Implementation: no overlap]
- Could add 10-20% overlap in future to prevent concept splitting

### Merging Logic

**Deduplication:**
```typescript
function mergeConceptSets(sets: ConceptMetadata[]): ConceptMetadata {
  const allConcepts = sets.flatMap(s => s.primary_concepts);
  const uniqueConcepts = [...new Set(allConcepts)];
  
  const allTechnicalTerms = sets.flatMap(s => s.technical_terms);
  const uniqueTerms = [...new Set(allTechnicalTerms)];
  
  const allCategories = sets.flatMap(s => s.categories);
  const uniqueCategories = [...new Set(allCategories)];
  
  return {
    primary_concepts: uniqueConcepts,
    technical_terms: uniqueTerms,
    categories: uniqueCategories,
    related_concepts: mergeRelatedConcepts(sets),
    summary: combineChunkSummaries(sets)
  };
}
```

### Future Enhancements

**Potential Improvements:**
- Overlapping chunks (prevent concept splitting)
- Parallel extraction (faster processing)
- Smart chunk boundaries (respect sections/chapters)
- Hierarchical merging (section → chapter → document)

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Extraction process
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - Document processing pipeline

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)

---

**Confidence Level:** MEDIUM-HIGH  
**Attribution:**
- Planning docs: November 12, 2024
- Git commit: 82212a34cc

**Traceability:** [2025-11-12-document-processing-improvements](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-12-document-processing-improvements/)


