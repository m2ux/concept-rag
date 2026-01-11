# 10. Query Expansion Strategy (Corpus + WordNet Hybrid)

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Conceptual Search Implementation (October 13, 2025)

**Sources:**
- Planning: [2025-10-13-conceptual-search-implementation](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-10-13-conceptual-search-implementation/)

## Context and Problem Statement

User queries often use different terminology than documents. For example, searching for "concurrent programming" might miss documents about "parallel computing" or "thread synchronization" [Use case: synonym problem]. Without query expansion, the system relies solely on exact term matching in vector/keyword search, missing semantically related documents.

**The Core Problem:** How to bridge vocabulary mismatch between user queries and document content to improve recall without sacrificing precision? [Planning: query expansion rationale]

**Decision Drivers:**
* Vocabulary mismatch reduces recall [Problem: synonyms not matched]
* Need 3-5x term coverage [Target: `IMPLEMENTATION_COMPLETE.md`, line 133]
* Balance precision vs. recall [Trade-off: don't introduce noise]
* Combine domain-specific (corpus) + general (WordNet) terms [Strategy: hybrid approach]
* Fast expansion (< 50ms) [Performance: real-time requirement]

## Alternative Options

* **Option 1: Hybrid Expansion (70% Corpus + 30% WordNet)** - Two-source weighted expansion
* **Option 2: WordNet Only** - Pure synonym expansion
* **Option 3: Corpus Only** - Domain-specific related terms
* **Option 4: Embedding-Based** - Find similar terms via vector similarity
* **Option 5: No Expansion** - Use original query terms only

## Decision Outcome

**Chosen option:** "Hybrid Expansion (70% Corpus + 30% WordNet) (Option 1)", because it combines domain-specific relevance (corpus concepts) with broad vocabulary coverage (WordNet), providing optimal expansion quality.

### Expansion Formula

**Weight Distribution:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 133-136; `IMPLEMENTATION_PLAN.md`, lines 5-7]
- **70% corpus-driven** - Domain-specific technical terms
- **30% WordNet** - General vocabulary relationships

**Expansion Multiplier:** 3-5x original terms [Source: `IMPLEMENTATION_COMPLETE.md`, line 133]

**Example Expansion:**
```
Original Query: "consensus algorithms"  (2 terms)

Corpus Expansion (70%):
  - "distributed consensus"
  - "byzantine fault tolerance"
  - "paxos protocol"
  - "raft algorithm"
  
WordNet Expansion (30%):
  - "agreement"
  - "accord"
  - "protocol"
  - "procedure"

Expanded Query: 12-15 terms total (3-5x expansion)
```
[Planning: expansion examples]

### Implementation

**File:** `src/concepts/query_expander.ts` [Source: `IMPLEMENTATION_COMPLETE.md`, lines 32-35]

**Algorithm:**
```typescript
async function expandQuery(query: string): Promise<ExpandedQuery> {
  const originalTerms = tokenize(query);
  
  // Parallel expansion for performance
  const [corpusTerms, wordnetTerms] = await Promise.all([
    expandFromCorpus(originalTerms),      // Uses concept index
    expandFromWordNet(originalTerms)      // Uses WordNet service
  ]);
  
  // Weighted importance scoring
  const weights = {
    original: 1.0,
    corpus: 0.7,
    wordnet: 0.3
  };
  
  return {
    original_terms: originalTerms,
    corpus_terms: corpusTerms,
    wordnet_terms: wordnetTerms,
    all_terms: [...originalTerms, ...corpusTerms, ...wordnetTerms],
    weights: computeTermWeights(originalTerms, corpusTerms, wordnetTerms, weights)
  };
}
```
[Source: Implementation logic in query_expander.ts]

**Features:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 32-35]
- Weighted term importance scoring
- Parallel expansion for performance
- Technical context filtering (avoid noise)

### Consequences

**Positive:**
* **3-5x coverage:** Query expansion multiplies term coverage [Source: `IMPLEMENTATION_COMPLETE.md`, line 133]
* **Synonym matching:** 80% success rate (vs. 20% before) [Source: `IMPLEMENTATION_COMPLETE.md`, line 150]
* **Cross-document:** 75% success rate (vs. 30% before) [Source: `IMPLEMENTATION_COMPLETE.md`, line 152]
* **Fast:** < 50ms expansion time [Estimate: from performance characteristics]
* **Balanced:** Domain-specific (70%) + general (30%) = optimal [Source: weight distribution]
* **Cached:** WordNet lookups cached for speed [Source: `IMPLEMENTATION_COMPLETE.md`, line 25]
* **No hallucination:** Uses real lexical databases, not LLM generation [Reliability: factual]

**Negative:**
* **Potential noise:** Expansion may introduce irrelevant terms [Risk: over-expansion]
* **Weight tuning:** 70/30 split may need adjustment per domain [Maintenance: tuning required]
* **Context loss:** Expanded terms lack original query context [Limitation: bag-of-words]
* **Computation overhead:** Expansion adds latency (~50ms) [Cost: query time]
* **Dependency:** Requires both concept index and WordNet [Complexity: two systems]

**Neutral:**
* **Transparent to user:** Expansion happens automatically [UX: invisible]
* **Debug mode:** Can inspect expanded terms if needed [Feature: debug flag]

### Confirmation

**Validation Results:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 148-152]

| Metric | Before (No Expansion) | After (Hybrid Expansion) | Improvement |
|--------|----------------------|--------------------------|-------------|
| **Synonym matching** | **20%** | **80%** | **4x better** |
| Concept matching | 40% | 85% | 2x better |
| **Cross-document** | **30%** | **75%** | **2.5x better** |

**Example Use Case:**
```
User Query: "thread synchronization"

Without Expansion:
  ✗ Misses documents about "concurrency control"
  ✗ Misses documents about "mutex mechanisms"
  ✗ Misses documents about "parallel coordination"
  
With Expansion:
  ✓ Finds "concurrency control" (corpus)
  ✓ Finds "mutex mechanisms" (corpus)
  ✓ Finds "parallel coordination" (corpus + WordNet)
  ✓ Finds "lock-free programming" (corpus)
```
[Validated: improved cross-document matching]

## Pros and Cons of the Options

### Option 1: Hybrid Expansion (70% Corpus + 30% WordNet) - Chosen

**Pros:**
* Best recall improvement (2.5x cross-document) [Validated: metrics]
* Domain-appropriate (corpus concepts)
* Broad coverage (WordNet general terms)
* Balanced noise vs. coverage
* Validated weights (70/30 split) [Source: weight rationale]

**Cons:**
* Two systems to maintain (corpus + WordNet)
* Weight tuning may be needed
* ~50ms latency added
* Potential noise from over-expansion

### Option 2: WordNet Only

Expand using only WordNet synonyms.

**Pros:**
* Simple (single source)
* No corpus dependency
* Immediate availability
* 161K+ words coverage

**Cons:**
* **Misses domain terms:** "consensus algorithms" won't expand to "paxos", "raft" [Gap: technical terms]
* **Generic:** "bank" → "financial institution" + "river bank" [Noise: ambiguity]
* **Lower quality:** General synonyms may not fit technical context
* **Validated:** Hybrid (70/30) outperforms WordNet-only

### Option 3: Corpus Only

Expand using only extracted concept relationships.

**Pros:**
* Domain-specific (perfect context)
* No general vocabulary noise
* High precision

**Cons:**
* **Coverage gaps:** Misses general synonyms not in corpus [Gap: uncommon terms]
* **Corpus-dependent:** Quality tied to corpus completeness
* **Missing basic synonyms:** "approach" = "method" may not be in technical corpus
* **Lower recall:** Corpus-only < hybrid in testing [Validated: testing]

### Option 4: Embedding-Based Expansion

Find similar terms using embedding similarity.

**Pros:**
* Purely vector-based
* Continuous similarity (not discrete)
* No explicit knowledge base required

**Cons:**
* **Slow:** Must search embeddings for each query term [Performance: vector searches per term]
* **No explicit relationships:** Similarity doesn't guarantee synonymy
* **Context-less:** Can't distinguish word senses
* **Quality unclear:** May return unrelated terms
* **More complex:** Requires embedding all vocabulary

### Option 5: No Expansion

Use original query terms only.

**Pros:**
* Simplest (no code required)
* Zero latency overhead
* No risk of noise
* User controls exact terms

**Cons:**
* **Poor recall:** Only finds exact term matches [Problem: synonyms missed]
* **Vocabulary mismatch:** Users use different terms than documents [Gap: terminology]
* **Validated poor performance:** 20% synonym matching vs. 80% with expansion [Metrics: 4x worse]
* **Against RAG best practices:** Expansion standard in modern search

## Implementation Notes

### Expansion Pipeline

**Step 1:** Tokenize query [Code: query_expander.ts]
```typescript
const tokens = query.toLowerCase().split(/\s+/);
```

**Step 2:** Corpus expansion [Source: concept index lookup]
```typescript
for (const token of tokens) {
  const concept = await conceptIndex.find(token);
  if (concept) {
    corpusTerms.push(...concept.related_concepts);
  }
}
```

**Step 3:** WordNet expansion [Source: WordNet service]
```typescript
for (const token of tokens) {
  const synsets = await wordnetService.getSynonyms(token);
  wordnetTerms.push(...synsets);
}
```

**Step 4:** Weight and combine
```typescript
const allTerms = [
  ...originalTerms.map(t => ({ term: t, weight: 1.0 })),
  ...corpusTerms.map(t => ({ term: t, weight: 0.7 })),
  ...wordnetTerms.map(t => ({ term: t, weight: 0.3 }))
];
```

### Performance Optimization

**Caching:** [Source: implementation]
- WordNet lookups cached (persistent)
- Corpus index cached in memory
- Reduces repeated lookups

**Parallel Processing:** [Source: `IMPLEMENTATION_COMPLETE.md`, line 35]
- Corpus and WordNet expansion run in parallel
- Reduces latency from ~80ms sequential to ~50ms parallel

### Debug Mode

**Feature:** [Source: tool implementations]
```typescript
// When debug=true, return expanded terms
{
  results: [...],
  debug_info: {
    original_terms: ["consensus", "algorithms"],
    corpus_expansion: ["distributed consensus", "paxos", "raft"],
    wordnet_expansion: ["agreement", "protocol"],
    total_terms: 7,
    expansion_factor: 3.5
  }
}
```

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Provides corpus concepts
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md) - Provides general synonyms
- [ADR-0006: Hybrid Search](adr0006-hybrid-search-strategy.md) - Expansion feeds into search

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: October 13, 2024
- Metrics from: IMPLEMENTATION_COMPLETE.md lines 32-35, 133-136, 148-152

**Traceability:** [2025-10-13-conceptual-search-implementation](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-10-13-conceptual-search-implementation/)



