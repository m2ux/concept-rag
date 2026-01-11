# Unified Search with Concept Query Expansion

**Date:** November 28, 2025  
**Status:** PLANNING  
**Priority:** HIGH  
**Estimated Effort:** 3-4h agentic + 1h review

---

## Overview

Enhance the `QueryExpander` to include concept-based expansion as a fourth source, creating a unified search interface that leverages concept search capabilities for both catalog and chunk searches.

### Problem Statement

Currently, concept matching is handled separately from text search:
- `catalog_search` and `broad_chunks_search` use vector + BM25 + title + WordNet
- `concept_search` handles concept-specific queries separately
- Users must know which tool to use for their query type
- Related concepts discovered during seeding (via lexical linking) are underutilized in general search

### Solution

Add concept expansion to `QueryExpander` so that **all searches** benefit from concept awareness:
- Searches for "architecture" automatically expand to include related concepts like "software design", "modularity"
- Leverages existing `related_concepts` populated by lexical linking
- Provides a unified search experience across all tools

---

## Architecture Diagram

```
                         User Query: "software architecture"
                                      ↓
                    ┌─────────────────────────────────────┐
                    │         QueryExpander.expandQuery()  │
                    └─────────────────────────────────────┘
                                      ↓
        ┌─────────────────┬───────────────────┬─────────────────┐
        ↓                 ↓                   ↓                 ↓
    Original          Corpus             Concepts           WordNet
   (weight 1.0)    (weight 0.8)        (weight 0.7)       (weight 0.6)
        ↓                 ↓                   ↓                 ↓
  ["software",      Vector search      Hybrid concept      NLTK lookup
   "architecture"]   on concepts        search finds:
                     table finds:            ↓
                          ↓            "software design"
                    "system design"    "architectural patterns"
                    "clean code"       "modularity"
                                            ↓
                    └─────────────────┬─────────────────────┘
                                      ↓
                           ExpandedQuery {
                             original_terms: ["software", "architecture"],
                             corpus_terms: ["system design", "clean code"],
                             concept_terms: ["software design", "modularity", ...],  ← NEW
                             wordnet_terms: ["structure", "design"],
                             all_terms: [...combined...],
                             weights: Map { ... }
                           }
                                      ↓
                    ┌─────────────────────────────────────┐
                    │      Unified Hybrid Search          │
                    └─────────────────────────────────────┘
                                      ↓
              ┌───────────────────────┴───────────────────────┐
              ↓                                               ↓
     ┌────────────────┐                              ┌────────────────┐
     │ Catalog Search │                              │ Chunks Search  │
     └────────────────┘                              └────────────────┘
              ↓                                               ↓
     ┌────────────────────────────┐              ┌────────────────────────────┐
     │ calculateCatalogHybridScore│              │ calculateChunkHybridScore  │
     │ • Vector:  35%             │              │ • Vector:  40%             │
     │ • BM25:    30%             │              │ • BM25:    35%             │
     │ • Title:   20%             │              │ • Concept: 15%  ← NEW      │
     │ • Concept: 10%  ← NEW      │              │ • WordNet: 10%             │
     │ • WordNet:  5%             │              │                            │
     └────────────────────────────┘              └────────────────────────────┘
              ↓                                               ↓
        Ranked Documents                               Ranked Chunks
```

---

## Current State vs Target

### Current State

| Component | Behavior |
|-----------|----------|
| QueryExpander | 3 sources: original, corpus, wordnet |
| ExpandedQuery | No `concept_terms` field |
| Catalog scoring | 4 signals (vector, BM25, title, wordnet) |
| Chunk scoring | 3 signals (vector, BM25, wordnet) |
| Concept awareness | Only in dedicated `concept_search` tool |

### Target State

| Component | Behavior |
|-----------|----------|
| QueryExpander | 4 sources: original, corpus, **concepts**, wordnet |
| ExpandedQuery | New `concept_terms` field |
| Catalog scoring | 5 signals (vector, BM25, title, **concept**, wordnet) |
| Chunk scoring | 4 signals (vector, BM25, **concept**, wordnet) |
| Concept awareness | **Everywhere via QueryExpander** |

---

## Implementation Plan

### Task 1: Extend ExpandedQuery Type (15 min)

**Goal:** Add `concept_terms` field to the `ExpandedQuery` interface.

**Files:**
- `src/concepts/types.ts`

**Changes:**
```typescript
export interface ExpandedQuery {
  original_terms: string[];
  corpus_terms: string[];
  concept_terms: string[];  // NEW
  wordnet_terms: string[];
  all_terms: string[];
  weights: Map<string, number>;
}
```

**Deliverables:**
- Updated `ExpandedQuery` interface
- No breaking changes (new field is additive)

---

### Task 2: Add Concept Expansion to QueryExpander (45-60 min)

**Goal:** Implement concept-based query expansion using hybrid concept search.

**Files:**
- `src/concepts/query_expander.ts`

**Dependencies:**
- `ConceptRepository` with `searchByHybrid` method
- `EmbeddingService` for query vector generation

**Implementation:**

```typescript
export class QueryExpander {
    private wordnet: WordNetService;
    private conceptTable: lancedb.Table;
    private conceptRepo?: ConceptRepository;  // NEW
    private embeddingService: EmbeddingService;
    
    constructor(
        conceptTable: lancedb.Table, 
        embeddingService: EmbeddingService,
        conceptRepo?: ConceptRepository  // NEW: optional for backward compat
    ) {
        this.wordnet = new WordNetService();
        this.conceptTable = conceptTable;
        this.conceptRepo = conceptRepo;
        this.embeddingService = embeddingService;
    }
    
    async expandQuery(queryText: string): Promise<ExpandedQuery> {
        const originalTerms = this.extractTerms(queryText);
        
        // Expand with all sources in parallel
        const [wordnetExpanded, corpusExpanded, conceptExpanded] = await Promise.all([
            this.wordnet.expandQuery(originalTerms, 5, 2),
            this.expandWithCorpus(originalTerms),
            this.expandWithConcepts(originalTerms)  // NEW
        ]);
        
        // Combine with weights
        const allTerms = new Map<string, number>();
        
        // Original terms (weight 1.0)
        for (const term of originalTerms) {
            allTerms.set(term, 1.0);
        }
        
        // Corpus terms (weight 0.8)
        for (const [term, weight] of corpusExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.8));
        }
        
        // Concept terms (weight 0.7) - NEW
        for (const [term, weight] of conceptExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.7));
        }
        
        // WordNet terms (weight 0.6)
        for (const [term, weight] of wordnetExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.6));
        }
        
        return {
            original_terms: originalTerms,
            corpus_terms: Array.from(corpusExpanded.keys()).filter(t => !originalTerms.includes(t)),
            concept_terms: Array.from(conceptExpanded.keys()).filter(t => !originalTerms.includes(t)),  // NEW
            wordnet_terms: Array.from(wordnetExpanded.keys()).filter(t => !originalTerms.includes(t)),
            all_terms: Array.from(allTerms.keys()),
            weights: allTerms
        };
    }
    
    // NEW METHOD
    private async expandWithConcepts(terms: string[]): Promise<Map<string, number>> {
        const expanded = new Map<string, number>();
        
        if (!this.conceptRepo) {
            return expanded;  // No concept repo = no expansion
        }
        
        try {
            const queryText = terms.join(' ');
            const queryVector = this.embeddingService.generateEmbedding(queryText);
            
            // Use hybrid concept search
            const conceptResults = await this.conceptRepo.searchByHybrid(
                queryText, 
                queryVector, 
                10
            );
            
            for (const concept of conceptResults) {
                const score = concept.hybridScore || 0.5;
                
                // Add concept name (split into terms)
                const conceptTerms = concept.name.toLowerCase().split(/\s+/);
                for (const term of conceptTerms) {
                    if (term.length > 2) {
                        expanded.set(term, score);
                    }
                }
                
                // Add related concepts (from lexical linking)
                for (const related of concept.relatedConcepts || []) {
                    const relatedTerms = related.toLowerCase().split(/\s+/);
                    for (const term of relatedTerms) {
                        if (term.length > 2) {
                            const existing = expanded.get(term) || 0;
                            expanded.set(term, Math.max(existing, score * 0.7));
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Concept expansion failed, continuing without:', error);
        }
        
        return expanded;
    }
}
```

**Deliverables:**
- `expandWithConcepts` method
- Updated constructor with optional `ConceptRepository`
- Integration with `expandQuery`
- Graceful fallback if no concept repo

---

### Task 3: Add Concept Scoring Signal (30-45 min)

**Goal:** Add concept matching score to hybrid scoring functions.

**Files:**
- `src/infrastructure/search/scoring-strategies.ts`

**Implementation:**

```typescript
// Add to ScoreComponents interface
export interface CatalogScoreComponents {
  vectorScore: number;
  bm25Score: number;
  titleScore: number;
  conceptScore: number;  // NEW
  wordnetScore: number;
}

export interface ChunkScoreComponents {
  vectorScore: number;
  bm25Score: number;
  conceptScore: number;  // NEW
  wordnetScore: number;
}

// NEW: Calculate concept score based on expanded concept terms
export function calculateConceptMatchScore(
  conceptTerms: string[],
  docConceptNames: string[]
): number {
  if (conceptTerms.length === 0 || docConceptNames.length === 0) return 0;
  
  let matches = 0;
  const docConceptsLower = docConceptNames.map(c => c.toLowerCase());
  
  for (const term of conceptTerms) {
    const termLower = term.toLowerCase();
    for (const docConcept of docConceptsLower) {
      if (docConcept.includes(termLower) || termLower.includes(docConcept)) {
        matches++;
        break;  // Count each term once
      }
    }
  }
  
  return Math.min(matches / conceptTerms.length, 1.0);
}

// Update scoring functions
export function calculateCatalogHybridScore(components: CatalogScoreComponents): number {
  return (
    (components.vectorScore * 0.35) +
    (components.bm25Score * 0.30) +
    (components.titleScore * 0.20) +
    (components.conceptScore * 0.10) +  // NEW
    (components.wordnetScore * 0.05)
  );
}

export function calculateChunkHybridScore(components: ChunkScoreComponents): number {
  return (
    (components.vectorScore * 0.40) +
    (components.bm25Score * 0.35) +
    (components.conceptScore * 0.15) +  // NEW
    (components.wordnetScore * 0.10)
  );
}
```

**Deliverables:**
- `calculateConceptMatchScore` function
- Updated `CatalogScoreComponents` and `ChunkScoreComponents`
- Updated hybrid score calculations with concept weights

---

### Task 4: Integrate Concept Scoring in Hybrid Search Service (30-45 min)

**Goal:** Wire up concept scoring in the hybrid search pipeline.

**Files:**
- `src/infrastructure/search/conceptual-hybrid-search-service.ts`

**Implementation:**

```typescript
// In performSearch method:

private async performSearch(
  queryText: string,
  queryVector: number[],
  collection: lancedb.Table,
  limit: number,
  debug: boolean
): Promise<SearchResult[]> {
  // Step 1: Expand query (now includes concept_terms)
  const expanded = await this.queryExpander.expandQuery(queryText);
  
  if (debug) {
    this.printQueryExpansion(expanded);
  }
  
  // Step 2: Vector search
  const vectorResults = await collection
    .vectorSearch(queryVector)
    .limit(limit * 3)
    .toArray();
  
  // Step 3: Score each result
  const results = vectorResults.map((row: any) => {
    const searchableText = isChunkSearch ? row.text || '' : row.text || row.summary || '';
    
    const vectorScore = calculateVectorScore(row._distance || 0);
    const bm25Score = calculateWeightedBM25(expanded.all_terms, expanded.weights, searchableText, row.source || '');
    const titleScore = calculateTitleScore(expanded.original_terms, row.source || '');
    const wordnetScore = calculateWordNetBonus(expanded.wordnet_terms, searchableText);
    
    // NEW: Calculate concept score using expanded concept terms
    const docConceptNames = parseStringArrayField(row.concept_names);
    const conceptScore = calculateConceptMatchScore(expanded.concept_terms, docConceptNames);
    
    // Calculate hybrid score
    const collectionName = collection.getName().toLowerCase();
    const isChunkSearch = collectionName.includes('chunk');
    
    const hybridScore = isChunkSearch
      ? calculateChunkHybridScore({ vectorScore, bm25Score, conceptScore, wordnetScore })
      : calculateCatalogHybridScore({ vectorScore, bm25Score, titleScore, conceptScore, wordnetScore });
    
    return {
      // ... existing fields ...
      conceptScore,  // NEW: add to result
      hybridScore,
    } as SearchResult;
  });
  
  return results.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, limit);
}
```

**Deliverables:**
- Concept score calculation in search pipeline
- Updated result mapping with `conceptScore`
- Correct scoring function selection based on collection type

---

### Task 5: Update Container and Tool Output (20-30 min)

**Goal:** Wire up dependencies and update tool output to show concept score.

**Files:**
- `src/application/container.ts`
- `src/tools/operations/conceptual_catalog_search.ts`
- `src/tools/operations/conceptual_broad_chunks_search.ts`

**Changes:**

1. **Container:** Pass `ConceptRepository` to `QueryExpander` constructor

2. **Tool Output:** Add `concept` score to output:

```typescript
scores: {
  hybrid: r.hybridScore.toFixed(3),
  vector: r.vectorScore.toFixed(3),
  bm25: r.bm25Score.toFixed(3),
  title: r.titleScore?.toFixed(3),  // catalog only
  concept: r.conceptScore.toFixed(3),  // NEW
  wordnet: r.wordnetScore.toFixed(3)
}
```

**Deliverables:**
- Container wiring for `QueryExpander` with concept repo
- Updated tool output with concept scores

---

### Task 6: Update Tests (45-60 min)

**Goal:** Comprehensive test coverage for new functionality.

**Files:**
- `src/concepts/__tests__/query_expander.test.ts`
- `src/infrastructure/search/__tests__/scoring-strategies.test.ts`
- `src/infrastructure/search/__tests__/conceptual-hybrid-search-service.test.ts`

**Test Cases:**

1. **QueryExpander:**
   - Concept expansion returns terms from matched concepts
   - Related concepts are included with lower weight
   - Graceful fallback when no concept repo
   - Concept terms don't duplicate existing terms

2. **Scoring:**
   - `calculateConceptMatchScore` returns 0 for empty inputs
   - Partial matches score correctly
   - Score capped at 1.0
   - Updated hybrid score calculations include concept weight

3. **Integration:**
   - End-to-end search includes concept scoring
   - Concept-rich documents rank higher for concept queries

**Deliverables:**
- 15-20 new unit tests
- Updated integration tests
- 100% coverage of new code

---

### Task 7: Update Documentation (20-30 min)

**Goal:** Update schema docs and API reference.

**Files:**
- `docs/database-schema.md`
- `docs/api-reference.md`

**Changes:**

1. **Schema docs:** Note concept scoring in hybrid search description
2. **API reference:** Update tool descriptions to mention concept-aware search

**Deliverables:**
- Updated documentation reflecting unified search

---

## Success Criteria

### Functional

- [ ] `QueryExpander.expandQuery()` returns `concept_terms` array
- [ ] Concept expansion uses hybrid concept search
- [ ] Related concepts included in expansion
- [ ] Catalog search includes 5 scoring signals
- [ ] Chunk search includes 4 scoring signals
- [ ] Graceful fallback if concept repo unavailable

### Performance

- [ ] Query expansion adds <50ms latency (parallel execution)
- [ ] Concept scoring adds <5ms per result
- [ ] No regression in existing search performance

### Quality

- [ ] 100% test coverage of new code
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Backward compatible (old queries still work)

---

## Testing Strategy

### Unit Tests
- QueryExpander concept expansion
- Concept score calculation
- Hybrid score with concept weight
- Edge cases (empty concepts, no matches)

### Integration Tests
- End-to-end search with concept expansion
- Verify concept-related documents rank higher

### Manual Validation
After implementation, run test report to verify:
1. Search for "architecture" → sees "design" in expanded terms
2. Documents with architecture concepts rank higher
3. Concept score visible in output

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Concept expansion too slow | High | Parallel execution, limit to top 10 concepts |
| Over-expansion (too many terms) | Medium | Weight concept terms at 0.7 (lower than corpus) |
| Breaking existing search | High | Backward-compatible constructor, optional concept repo |
| Score dilution | Medium | Concept weight only 10-15% of total |

---

## Implementation Selection Matrix

| Task | Priority | Include | Reason |
|------|----------|---------|--------|
| Task 1: Extend ExpandedQuery | HIGH | ✓ | Foundation for other tasks |
| Task 2: Concept Expansion | HIGH | ✓ | Core functionality |
| Task 3: Concept Scoring | HIGH | ✓ | Enables scoring integration |
| Task 4: Hybrid Search Integration | HIGH | ✓ | Connects expansion to search |
| Task 5: Container/Tool Output | HIGH | ✓ | User-visible changes |
| Task 6: Tests | HIGH | ✓ | Quality assurance |
| Task 7: Documentation | MEDIUM | ✓ | Completeness |

---

## Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| Types & Foundation | Task 1 | 15 min |
| Core Implementation | Tasks 2, 3 | 75-105 min |
| Integration | Tasks 4, 5 | 50-75 min |
| Testing | Task 6 | 45-60 min |
| Documentation | Task 7 | 20-30 min |
| **Total** | | **3.5-4.5 hours** |

---

## Related Documents

- [Schema Redesign](../2025-11-28-schema-redesign/README.md) - Recent schema changes
- [Feature Implementation Workflow](../../prompts/feature-_workflow.md) - Implementation process
- [API Reference](../../../docs/api-reference.md) - Current tool documentation

---

**Next Step:** Create feature branch and begin Task 1
















