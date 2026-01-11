# 11. Multi-Model Strategy (Claude + Grok)

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Conceptual Search Implementation (October 13, 2025)

**Sources:**
- Planning: [2025-10-13-conceptual-search-implementation](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-10-13-conceptual-search-implementation/)

## Context and Problem Statement

Document indexing requires two types of LLM operations: concept extraction (complex, requires deep understanding) and summary generation (simpler, requires speed). Using a single model for both operations would either be too expensive (if using high-capability model for summaries) or too low-quality (if using fast model for concept extraction).

**The Core Problem:** How to optimize cost vs. quality trade-off for two different LLM tasks during document indexing? [Planning: cost optimization]

**Decision Drivers:**
* Concept extraction needs deep understanding (Claude Sonnet 4.5 quality) [Requirement: high-quality concepts]
* Summary generation needs speed and low cost [Requirement: cost-effective]
* One-time processing (cost matters) [Context: indexing 100+ documents]
* Total budget: ~$0.05/document acceptable [Target: `README.md`, line 47]
* Processing time: Minimize total indexing time [Goal: fast seeding]

## Alternative Options

* **Option 1: Multi-Model (Claude for concepts + Grok for summaries)** - Task-optimized models
* **Option 2: Single High-End Model (Claude Sonnet 4.5 for both)** - Quality-first
* **Option 3: Single Fast Model (Grok-4-fast for both)** - Cost-first  
* **Option 4: Local Models (Ollama for both)** - Privacy-first
* **Option 5: Hybrid (Local + Cloud)** - Summaries local, concepts cloud

## Decision Outcome

**Chosen option:** "Multi-Model Strategy (Option 1)", because it achieves optimal balance: high-quality concept extraction where it matters ($0.041/doc) combined with blazing-fast summaries where speed matters ($0.007/doc), totaling ~$0.048/doc.

### Model Assignment

**Claude Sonnet 4.5** - Concept Extraction [Source: `README.md`, line 46]
- **Task:** Extract 100-200+ concepts per document
- **Why:** Deep understanding of technical content, nuanced concept identification
- **Cost:** ~$0.041 per document
- **Speed:** ~90-120 seconds per document (complex analysis)
- **Quality:** Excellent (formal semantic model understanding)

**Grok-4-fast** - Summary Generation [Source: `README.md`, line 46]
- **Task:** Generate concise document summaries (2-3 paragraphs)
- **Why:** Speed matters for summaries, quality less critical
- **Cost:** ~$0.007 per document  
- **Speed:** ~5-10 seconds per document (blazing fast)
- **Quality:** Good enough for search metadata

### Cost Breakdown

**Per Document:** [Source: `README.md`, lines 46-48]
- Concept extraction (Claude): $0.041
- Summary generation (Grok): $0.007
- Embeddings (local): $0.000
- **Total:** ~$0.048 per document

**For 165 Documents:** [Calculation]
- Concept extraction: 165 × $0.041 = $6.77
- Summary generation: 165 × $0.007 = $1.16
- **Total:** ~$7.93 one-time indexing cost

**Compared to Single Model:**
- All Claude: 165 × $0.048 = $7.92 (similar, but slower summaries)
- All Grok: 165 × $0.014 = $2.31 (cheaper, but poor concept quality)

### Consequences

**Positive:**
* **Cost-optimized:** $0.048/doc vs. $0.048 all-Claude (similar) or worse quality [Benefit: balanced]
* **Speed-optimized:** Grok-4-fast generates summaries 10x faster than Claude [Benefit: faster seeding]
* **Quality where it matters:** Concept extraction uses best model [Benefit: 37K quality concepts]
* **Task-appropriate:** Right tool for right job [Design: specialization]
* **Total cost:** $7.93 for 165 docs (acceptable for personal use) [Validation: production]
* **Parallel processing:** Can run both models concurrently [Performance: parallelization]

**Negative:**
* **Two API integrations:** Must maintain two model integrations [Complexity: 2 providers]
* **Two rate limits:** Must handle rate limiting for both services [Complexity: dual management]
* **Model availability:** Dependent on two services being available [Risk: dual dependencies]
* **Configuration:** More complex (two API keys, endpoints, settings) [Maintenance: configuration]
* **Error handling:** Must handle failures for both models [Complexity: error scenarios]

**Neutral:**
* **Via OpenRouter:** Both accessed through single API provider [Source: OpenRouter integration]
* **Cost monitoring:** Need to track two model costs separately [Ops: billing tracking]

### Confirmation

**Production Validation:** [Source: production usage]
- **165 documents** indexed successfully
- **Cost:** ~$7.93 total (within budget)
- **Quality:** 37K concepts extracted (high quality validated)
- **Speed:** ~2-3 minutes per document average
- **Summaries:** Adequate quality for search/display

**Cost-Benefit Analysis:**
- One-time: $7.93 for permanent index
- Per-query: $0 (local search)
- ROI: High (enables unlimited searches for one-time cost)

## Pros and Cons of the Options

### Option 1: Multi-Model (Claude + Grok) - Chosen

**Pros:**
* Optimal cost/quality balance
* Fast summaries (Grok 10x faster)
* High-quality concepts (Claude)
* $0.048/doc total
* Task-specialized models
* Production validated: $7.93 for 165 docs [Source: calculation]

**Cons:**
* Two model integrations
* Two rate limits to manage
* More complex configuration
* Dual failure points

### Option 2: Single High-End (Claude for Both)

Use Claude Sonnet 4.5 for both concepts and summaries.

**Pros:**
* Single model integration
* Consistent quality
* Simpler configuration
* One rate limit

**Cons:**
* **Slower:** Claude takes 2-3x longer for summaries vs. Grok [Estimate: speed comparison]
* **Minimal cost difference:** ~$0.048/doc vs. $0.048/doc (same total)
* **Over-engineering:** Using complex model for simple task (summaries)
* **Longer indexing:** Total time increases significantly

### Option 3: Single Fast Model (Grok for Both)

Use Grok-4-fast for both concepts and summaries.

**Pros:**
* Cheapest option (~$0.014/doc)
* Fastest processing
* Simple configuration
* One model to maintain

**Cons:**
* **Poor concept quality:** Fast models lack nuance for concept extraction [Risk: quality]
* **Shallow understanding:** May miss abstract concepts
* **Not validated:** Unknown if Grok can handle complex extraction
* **Cost savings minimal:** $5 saved over 165 docs (marginal)

### Option 4: Local Models (Ollama)

Use local Ollama models for both tasks.

**Pros:**
* Zero API costs
* Complete privacy
* Offline operation
* No rate limits

**Cons:**
* **High resource requirements:** Needs GPU, 8GB+ VRAM [Requirement: hardware]
* **Slower:** Local inference slower than cloud APIs
* **Model quality:** Local models often lower quality than Claude
* **Setup complexity:** Must install and configure Ollama
* **Not portable:** Tied to hardware capabilities
* **Note:** Ollama removed from codebase in October cleanup [Source: `CLEANUP_SUMMARY.md`]

### Option 5: Hybrid (Local + Cloud)

Local models for summaries, cloud for concepts.

**Pros:**
* Reduce API costs for summaries
* Privacy for summary content
* Quality for concepts

**Cons:**
* **Added complexity:** Two different systems (local + cloud)
* **Hardware dependency:** Requires capable machine
* **Minimal savings:** Summaries only $0.007/doc
* **Not worth complexity:** Better to pay small cost for simplicity

## Implementation Notes

### Model Configuration

**Via OpenRouter:** [Source: OpenRouter integration]
```typescript
// Claude Sonnet 4.5 for concepts
const conceptsResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [{ role: 'user', content: conceptExtractionPrompt }]
  })
});

// Grok-4-fast for summaries
const summaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'x-ai/grok-4-fast',
    messages: [{ role: 'user', content: summaryPrompt }]
  })
});
```

### Error Handling

**Strategy:** [Planning: robustness]
- Retry with exponential backoff for rate limits
- Fallback to simpler model if primary fails
- Skip document if all attempts fail (with logging)
- Continue processing remaining documents

### Seeding Pipeline Integration

**Process:** [Source: `hybrid_fast_seed.ts`]
```typescript
for (const doc of documents) {
  // Parallel model calls for speed
  const [concepts, summary] = await Promise.all([
    extractConcepts(doc, claudeModel),      // Claude Sonnet 4.5
    generateSummary(doc, grokModel)         // Grok-4-fast
  ]);
  
  await indexDocument(doc, concepts, summary);
}
```

### Future Optimization

**Potential improvements:**
- Batch API requests (process multiple docs together)
- Cache summaries/concepts for unchanged documents
- Incremental updates (only new/changed documents)
- Already implemented: Incremental seeding (Nov 12) [See: ADR-0013]

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Uses Claude Sonnet 4.5
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - Indexing pipeline design
- [ADR-0013: Incremental Seeding](adr0013-incremental-seeding.md) - Avoids re-processing

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: October 13, 2024
- Cost breakdown: Conceptual Search README lines 46-48

**Traceability:** [2025-10-13-conceptual-search-implementation](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-10-13-conceptual-search-implementation/)



