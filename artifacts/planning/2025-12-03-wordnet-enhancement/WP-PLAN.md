# Work Package: WordNet Integration Enhancement

**Date:** 2025-12-03
**Type:** Enhancement
**Priority:** MEDIUM
**Status:** Planning
**Estimated Effort:** 4-6h agentic + 1-2h review

---

## Overview

### Problem Statement

WordNet integration exists but is underutilized, contributing only 10-15% to search scoring and showing `wordnet: "0.000"` in many search results. This indicates WordNet is not effectively bridging vocabulary gaps between user queries and document content.

Root causes identified:
1. **Single Synset Usage:** Only uses first (most common) synset, missing technical meanings
2. **Domain Mismatch:** WordNet's general English definitions don't align with technical/domain-specific usage
3. **Low Scoring Weight:** 10-15% contribution is easily overshadowed by stronger signals
4. **Per-word Expansion Only:** Multi-word phrases aren't expanded as units
5. **Cache Not Pre-populated:** Common technical terms only cached after first lookup

### Scope

**In Scope:**
- Context-aware synset selection using Strategy Pattern
- Dynamic WordNet scoring weight based on query characteristics  
- Pre-population of WordNet cache with concept vocabulary
- Hierarchy navigation using hypernym/hyponym relationships
- Unit tests for all new components
- ADR documenting design decisions

**Out of Scope:**
- Replacing WordNet with alternative lexical databases (ConceptNet, BabelNet)
- Multi-language support (WordNet is English-only, project is English-focused)
- Real-time Python NLTK performance optimization (caching already handles this)
- Complete rewrite of scoring system (incremental improvements only)
- LLM-based synonym expansion (cost/latency concerns)

---

## Current State Analysis

### What Exists ✅

- ✅ `WordNetService` (`src/wordnet/wordnet_service.ts`) - Python subprocess bridge to NLTK
- ✅ Persistent caching in `data/caches/wordnet_cache.json`
- ✅ `QueryExpander` integrates WordNet with 60% internal weight
- ✅ `ConceptEnricher` populates synonyms/broader/narrower terms on concepts
- ✅ Scoring strategies include `calculateWordNetBonus()` at 10-15% weight
- ✅ Technical context filtering via `getTechnicalSynsets()`

### What's Missing/Broken ❌

- ❌ Only first synset used - misses technical meanings ("decorator" = ornament not pattern)
- ❌ No context-aware synset disambiguation
- ❌ Static scoring weight regardless of query characteristics
- ❌ Cache not pre-warmed with concept vocabulary
- ❌ Hypernym/hyponym relationships not used for query expansion
- ❌ No way to search "broader concepts" in MCP tools

---

## Knowledge Base Insights

*Discovered via concept-rag MCP research*

### Relevant Concepts

- **Strategy Pattern:** Encapsulates interchangeable algorithms behind common interface for runtime selection. Directly applicable for synset selection strategies.
- **Adapter Pattern:** Translates interfaces for incompatible components. Relevant for WordNet service abstraction.
- **Cache Management Pattern:** Pre-population and invalidation strategies from Applying UML and Patterns.

### Applicable Design Patterns

| Pattern | Source | How It Applies |
|---------|--------|----------------|
| **Strategy Pattern** | Head First Design Patterns, Applying UML and Patterns | Encapsulate different synset selection algorithms behind common interface |
| **Adapter Pattern** | Node.js Design Patterns | Clean abstraction over Python subprocess bridge |
| **Cache Management Pattern** | Applying UML and Patterns | Extend for pre-warming strategy |
| **Template Method Pattern** | Applying UML and Patterns | Structure synset scoring with customizable steps |

### Best Practices

1. **Favor Composition over Inheritance:** Use strategy objects for synset selection - *Source: Design Patterns GoF*
2. **Encapsulate What Varies:** Synset selection logic varies by context, so encapsulate it - *Source: Head First Design Patterns*
3. **Cache Management:** Pre-population at ingestion time reduces runtime overhead - *Source: Applying UML and Patterns*

---

## Proposed Approach

### Solution Design

Implement a phased enhancement using the Strategy Pattern for synset selection, enabling pluggable algorithms while preserving backward compatibility.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     WordNetService                          │
├─────────────────────────────────────────────────────────────┤
│  - cache: Map<string, WordNetSynset[]>                      │
│  - selectionStrategy: SynsetSelectionStrategy               │
│  + getSynsets(word): WordNetSynset[]                        │
│  + getContextualSynset(word, context): WordNetSynset        │ ← NEW
│  + expandQuery(terms, context?): Map<string, number>        │
│  + prewarmCache(terms): void                                │ ← NEW
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SynsetSelectionStrategy (interface)            │
├─────────────────────────────────────────────────────────────┤
│  + selectSynset(synsets, context): WordNetSynset            │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ FirstSynset     │  │ ContextAware    │  │ TechnicalDomain │
│ Strategy        │  │ Strategy        │  │ Strategy        │
│ (default)       │  │ (term overlap)  │  │ (future)        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Scoring Weight Adjustment:**

```typescript
// Dynamic weight based on query characteristics
function getWordNetWeight(expanded: ExpandedQuery): number {
  const hasStrongConceptMatch = expanded.concept_terms.length > 0;
  const isSingleTermQuery = expanded.original_terms.length === 1;
  
  if (isSingleTermQuery && !hasStrongConceptMatch) {
    return 0.25;  // Boost for single terms without concept support
  }
  return 0.10;    // Default weight
}
```

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **A: Incremental Strategy-based** | Low risk, backward compatible, testable per-component | Multiple small changes | **Selected** |
| **B: Replace with ConceptNet** | Broader coverage | Major rewrite, quality variance | Rejected |
| **C: LLM-based expansion** | Most contextually aware | Expensive, adds latency | Rejected |
| **D: Embedding-only disambiguation** | No WordNet dependency | Loses explicit relations | Rejected |

---

## Implementation Tasks

### Task 1: Create SynsetSelectionStrategy Interface (30-45 min)

**Goal:** Define strategy interface and implement default (first-synset) strategy

**Deliverables:**
- `src/wordnet/strategies/synset-selection-strategy.ts` - Interface definition
- `src/wordnet/strategies/first-synset-strategy.ts` - Current behavior wrapped
- `src/wordnet/strategies/index.ts` - Exports
- `src/wordnet/__tests__/first-synset-strategy.test.ts` - Unit tests

**Changes to existing:**
- `src/wordnet/wordnet_service.ts` - Add optional strategy injection

### Task 2: Implement Context-Aware Synset Selection (45-60 min)

**Goal:** Create strategy that scores synsets against query context

**Deliverables:**
- `src/wordnet/strategies/context-aware-strategy.ts` - New strategy
- `src/wordnet/__tests__/context-aware-strategy.test.ts` - Unit tests

**Algorithm:**
1. For each synset, score definition text against context terms
2. Weight technical indicators (from existing `getTechnicalSynsets`)
3. Return highest-scoring synset

### Task 3: Add Cache Pre-warming Capability (30-45 min)

**Goal:** Enable pre-population of WordNet cache with concept vocabulary

**Deliverables:**
- `src/wordnet/wordnet_service.ts` - Add `prewarmCache(terms: string[])` method
- `src/concepts/concept_enricher.ts` - Call prewarm before enrichment batch
- `src/wordnet/__tests__/wordnet-prewarm.test.ts` - Unit tests

**Integration point:**
- During `ConceptEnricher.enrichConcepts()`, extract unique terms and prewarm

### Task 4: Implement Dynamic Scoring Weight (30-45 min)

**Goal:** Adjust WordNet contribution based on query characteristics

**Deliverables:**
- `src/infrastructure/search/scoring-strategies.ts` - Add `calculateDynamicWordNetWeight()`
- `src/infrastructure/search/conceptual-hybrid-search-service.ts` - Use dynamic weight
- `src/infrastructure/search/__tests__/dynamic-wordnet-weight.test.ts` - Unit tests

**Logic:**
- Single-term queries without concept matches: 25% weight
- Multi-term queries with concept matches: 10% weight (current)
- Gradual scale between extremes

### Task 5: Add Hierarchy Navigation Methods (45-60 min)

**Goal:** Enable broader/narrower concept traversal using WordNet hypernyms/hyponyms

**Deliverables:**
- `src/wordnet/wordnet_service.ts` - Add `getBroaderTerms()`, `getNarrowerTerms()`
- `src/concepts/query_expander.ts` - Option to include hypernyms in expansion
- `src/wordnet/__tests__/hierarchy-navigation.test.ts` - Unit tests

**Future integration:**
- `concept_search` tool could gain `include_broader: boolean` parameter

### Task 6: Integration Testing & Validation (30-45 min)

**Goal:** Verify end-to-end improvement in search quality

**Deliverables:**
- `src/__tests__/integration/wordnet-enhancement.test.ts` - Integration tests
- Run MCP tool test report and compare WordNet scores before/after
- Document measurable improvement in test report

---

## Success Criteria

### Functional Requirements

- [ ] Synset selection strategies are pluggable via Strategy Pattern
- [ ] Context-aware strategy selects technical meanings when context indicates
- [ ] Cache pre-warming extracts terms from concepts and warms cache
- [ ] Dynamic weighting increases WordNet influence for single-term queries
- [ ] Hierarchy methods return hypernyms/hyponyms for navigation

### Performance Targets

- [ ] **Context-aware selection:** < 10ms additional latency per query
- [ ] **Cache pre-warming:** Runs at ingestion time, not query time
- [ ] **No regression:** Existing tests continue to pass

### Quality Requirements

- [ ] Test coverage ≥ 90% for new code
- [ ] All existing tests passing
- [ ] ADR written documenting design decisions
- [ ] No new linter errors

---

## Testing Strategy

### Unit Tests

- **SynsetSelectionStrategy implementations:** Test each strategy with various inputs
- **Dynamic weight calculation:** Test weight adjustment logic
- **Cache prewarm:** Test term extraction and cache population
- **Hierarchy navigation:** Test hypernym/hyponym retrieval

### Integration Tests

- **QueryExpander with context-aware selection:** Verify improved expansion
- **End-to-end search with dynamic weighting:** Verify scoring changes
- **Enrichment with prewarm:** Verify cache is populated

### Validation

- Run `scripts/test_search_tools.ts` before and after
- Compare `wordnet` scores in MCP tool test report
- Target: Reduce `wordnet: "0.000"` occurrences by 50%

---

## Dependencies & Risks

### Requires (Blockers)

- [ ] Python 3.9+ with NLTK and WordNet data (existing requirement)
- [ ] No external dependencies added

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context-aware selection adds too much latency | Low | Medium | Benchmark; fall back to first-synset if > 20ms |
| Technical context filtering still misses domain terms | Medium | Low | Accept limitation; document as future work |
| Cache prewarm increases ingestion time | Low | Low | Make optional; default to enabled |
| Strategy abstraction adds complexity | Low | Low | Keep interfaces simple; document well |

---

## Files to Create/Modify

### New Files

1. `src/wordnet/strategies/synset-selection-strategy.ts`
2. `src/wordnet/strategies/first-synset-strategy.ts`
3. `src/wordnet/strategies/context-aware-strategy.ts`
4. `src/wordnet/strategies/index.ts`
5. `src/wordnet/__tests__/first-synset-strategy.test.ts`
6. `src/wordnet/__tests__/context-aware-strategy.test.ts`
7. `src/wordnet/__tests__/wordnet-prewarm.test.ts`
8. `src/wordnet/__tests__/hierarchy-navigation.test.ts`
9. `src/infrastructure/search/__tests__/dynamic-wordnet-weight.test.ts`
10. `src/__tests__/integration/wordnet-enhancement.test.ts`

### Modified Files

1. `src/wordnet/wordnet_service.ts` - Add strategy injection, prewarm, hierarchy methods
2. `src/concepts/concept_enricher.ts` - Call prewarm before enrichment
3. `src/concepts/query_expander.ts` - Option for hierarchy expansion
4. `src/infrastructure/search/scoring-strategies.ts` - Dynamic weight function
5. `src/infrastructure/search/conceptual-hybrid-search-service.ts` - Use dynamic weight

---

**Status:** Ready for implementation





