# 7. Concept Extraction with LLM (Claude Sonnet 4.5)

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Conceptual Search Implementation (October 13, 2025)

**Sources:**
- Planning: .ai/planning/2025-10-13-conceptual-search-implementation/

## Context and Problem Statement

The hybrid search (vector + BM25 + title) provided good results for keyword and title matching [See: ADR-0006], but lacked semantic understanding of document *concepts*. Users searching for abstract ideas like "innovation strategies" or "consensus algorithms" couldn't reliably find relevant documents unless those exact terms appeared in the text [Inferred: from solution design]. The system needed to understand and index the conceptual content of documents, not just their keywords.

**The Core Problem:** How to extract, represent, and index abstract concepts from technical documents to enable concept-based search? [Planning: `.ai/planning/2025-10-13-conceptual-search-implementation/IMPLEMENTATION_PLAN.md`]

**Decision Drivers:**
* Need for concept-level search (not just keywords) [Planning: conceptual-search README]
* Extract 100-200+ concepts per document [Source: `IMPLEMENTATION_COMPLETE.md`, conceptual model]
* Domain-specific technical term identification [Source: `IMPLEMENTATION_COMPLETE.md`, line 12]
* One-time extraction (cost-effectiveness) [Planning: cost analysis]
* Formal concept model required [Later: Nov 13 formalization]

## Alternative Options

* **Option 1: LLM-Powered Extraction (Claude Sonnet 4.5)** - AI extracts concepts
* **Option 2: Manual Tagging** - Human curation of concepts
* **Option 3: Statistical NLP (TF-IDF, POS)** - Rule-based keyword extraction
* **Option 4: Pre-trained NER Models** - Named Entity Recognition
* **Option 5: Hybrid (LLM + Rules)** - Combine approaches

## Decision Outcome

**Chosen option:** "LLM-Powered Extraction with Claude Sonnet 4.5 (Option 1)", because it provides high-quality extraction of abstract concepts (not just entities), understands technical context, and operates at acceptable cost for one-time document processing.

### Implementation

**LLM Choice:** Claude Sonnet 4.5 via OpenRouter [Source: `IMPLEMENTATION_COMPLETE.md`, line 13]

**Cost:** ~$0.041 per document [Source: `.ai/planning/2025-10-13-conceptual-search-implementation/README.md`, line 47]

**Extraction Model:**
```typescript
// src/concepts/concept_extractor.ts
interface ConceptMetadata {
    primary_concepts: string[];      // 3-5 main topics
    technical_terms: string[];       // 5-10 key terms
    categories: string[];            // 2-3 domains
    related_concepts: string[];      // 3-5 related topics
    summary: string;                 // Brief description
}
```
[Source: `IMPLEMENTATION_COMPLETE.md`, lines 11-14; `IMPLEMENTATION_PLAN.md`, lines 74-96]

**Output:** 120-200+ concepts per document [Source: conceptual-search `README.md`, line 56]

**Files Created:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 54-75]
- `src/concepts/concept_extractor.ts` - LLM extraction logic
- `src/concepts/concept_index.ts` - Concept graph builder
- `src/concepts/concept_enricher.ts` - WordNet enrichment
- `src/concepts/types.ts` - Type definitions

### Extraction Process

**Step 1: LLM Prompt** [Planning: concept-extraction.txt]
```
Extract concepts from this document:
- Primary concepts (3-5 main topics)
- Technical terms (5-10 domain-specific terms)
- Categories (2-3 subject domains)
- Related concepts (3-5 connected ideas)
```

**Step 2: Concept Graph Building** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 16-19]
- Co-occurrence analysis for relationships
- LanceDB table creation with vector indexing
- Cross-document concept linking

**Step 3: Enrichment** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 27-30]
- WordNet synonym expansion
- Technical context filtering
- Persistent caching

### Multi-Signal Integration

Concepts added as 4th signal to hybrid search: [Source: `IMPLEMENTATION_COMPLETE.md`, lines 138-145]

| Signal | Weight | Function |
|--------|--------|----------|
| Vector | 25% | Semantic similarity |
| BM25 | 25% | Keyword relevance |
| Title | 20% | Filename matching |
| **Concept** | **20%** | **Extracted concept matching** ⬅️ NEW |
| WordNet | 10% | Synonym expansion |

### Consequences

**Positive:**
* **Concept-level search:** Find documents by abstract ideas [Validated: production usage]
* **High extraction quality:** Claude Sonnet 4.5 understands technical context [Source: model selection rationale]
* **Rich metadata:** 120-200+ concepts per document [Source: `README.md`, line 56]
* **One-time cost:** $0.041/doc, no runtime costs [Source: `README.md`, line 47]
* **Cross-document linking:** Concepts connect related documents [Source: co-occurrence analysis]
* **Domain-specific:** Captures technical terminology accurately [Source: `IMPLEMENTATION_COMPLETE.md`, line 12]
* **Improves matching:** 2x better concept matching (40% → 85%) [Source: `IMPLEMENTATION_COMPLETE.md`, line 151]

**Negative:**
* **Extraction cost:** ~$0.041 per document (vs. free for keywords) [Source: cost analysis]
* **Processing time:** 2-3 minutes per document (LLM API calls) [Inferred: from seeding experience]
* **LLM dependency:** Requires API key and internet connection for extraction [Source: OpenRouter requirement]
* **Quality variance:** LLM output quality can vary between documents [General: LLM limitation]
* **No incremental updates:** Must re-extract concepts if document changes [Limitation: one-time extraction]

**Neutral:**
* **Concept model evolution:** Formalized definition added later (Nov 13) [See: ADR-0015]
* **Storage overhead:** Concepts table adds ~50MB for 165 docs [Estimate: from production]

### Confirmation

**Validation Results:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 148-152]

| Metric | Before (Keywords Only) | After (Concepts) | Improvement |
|--------|------------------------|------------------|-------------|
| Synonym matching | 20% | 80% | **4x better** |
| **Concept matching** | **40%** | **85%** | **2x better** |
| Cross-document | 30% | 75% | **2.5x better** |

**Production Stats:**
- Documents indexed: 165+ [Source: production database]
- Concepts extracted: 37,000+ total [Source: production database]
- Average: ~220 concepts per document
- Extraction cost: ~$6.77 total (165 × $0.041)

## Pros and Cons of the Options

### Option 1: LLM-Powered Extraction (Claude Sonnet 4.5) - Chosen

**Pros:**
* Understands abstract concepts (not just keywords)
* Excellent technical term recognition
* Context-aware extraction
* High-quality results (85% concept matching) [Source: validation]
* One-time cost ($0.041/doc) [Source: cost analysis]
* No training data required
* Handles diverse document types

**Cons:**
* API cost ($0.041/doc)
* Processing time (2-3 min/doc)
* Requires API key and internet
* LLM output variance
* No offline operation during extraction

### Option 2: Manual Tagging

Human-curated concept tagging by domain experts.

**Pros:**
* Perfect accuracy (domain expert knowledge)
* Custom taxonomy possible
* No API costs
* Complete control

**Cons:**
* **Not scalable:** Hours per document (vs. 2-3 min automated) [Comparison: manual vs. automated]
* **Expensive:** Human time far more costly than $0.041
* **Inconsistent:** Different people tag differently
* **Slow:** Bottleneck for indexing new documents
* **Not feasible:** For personal knowledge base with 100+ docs

### Option 3: Statistical NLP (TF-IDF, POS Tagging)

Rule-based keyword extraction using statistical methods.

**Pros:**
* Free (no API costs)
* Fast (milliseconds)
* Deterministic results
* Offline operation

**Cons:**
* **Surface-level only:** Extracts keywords, not concepts
* **No semantic understanding:** "innovation" vs. "organizational innovation strategy"
* **Poor with abstract ideas:** Can't identify conceptual themes
* **Context-blind:** "bank" (river) vs. "bank" (financial)
* **Misses implicit concepts:** Document about X may not use term X

### Option 4: Pre-trained NER Models

Use spaCy, BERT-NER, or similar for entity extraction.

**Pros:**
* Good for named entities (people, places, orgs)
* Fast inference (local models)
* Free (no API costs)
* Established models available

**Cons:**
* **Entity-focused, not concept-focused:** Finds "Apple" not "innovation"
* **Not designed for abstract concepts:** Poor at ideas, strategies, methodologies
* **Technical domain weakness:** May miss domain-specific terms
* **Limited taxonomy:** Fixed entity types (PERSON, ORG, etc.)
* **Training required:** For custom concepts, needs labeled data

### Option 5: Hybrid (LLM + Rules)

Combine LLM extraction with statistical post-processing.

**Pros:**
* Could filter/validate LLM output
* Could supplement with rule-based keywords
* Might improve coverage

**Cons:**
* Added complexity
* Marginal benefit (LLM already high quality)
* More code to maintain
* Unclear improvement vs. cost
* Could introduce conflicts between methods

## Implementation Notes

### Formal Concept Model

**Later Evolution (Nov 13, 2025):** Formalized definition [See: ADR-0015]

> **A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

**Inclusion Criteria:**
- Domain terms, theories, methodologies
- Multi-word conceptual phrases
- Phenomena, abstract principles

**Exclusion Criteria:**
- Temporal descriptions, action phrases
- Proper names, dates
- Suppositions

### Integration with Three-Table Architecture

Concepts stored in dedicated table: [See: ADR-0009]

```sql
concepts_table:
  - concept: string (primary key)
  - concept_type: 'thematic' | 'terminology'
  - category: string
  - sources: string[] (documents containing concept)
  - related_concepts: string[]
  - embeddings: Float32Array
  - weight: number (importance/frequency)
```
[Source: `IMPLEMENTATION_PLAN.md`, concept table schema]

### Batch Processing

**Optimization:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 27-30]
- Batch processing with progress tracking
- Error handling with graceful fallback
- Persistent caching to avoid re-extraction
- Parallel processing where possible

### Cost Management

**Strategies:**
- One-time extraction during initial seeding
- Cache results to avoid re-extraction
- Skip unchanged documents (incremental seeding)
- Use cost-effective model (Claude Sonnet 4.5, not Opus)

**Total Cost for 165 docs:** ~$6.77 one-time [Calculation: 165 × $0.041]

## Related Decisions

- [ADR-0006: Hybrid Search](adr0006-hybrid-search-strategy.md) - Concepts added as 4th signal
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md) - Complements corpus concepts
- [ADR-0009: Three-Table Architecture](adr0009-three-table-architecture.md) - Concepts table storage
- [ADR-0010: Query Expansion](adr0010-query-expansion.md) - Uses extracted concepts
- [ADR-0011: Multi-Model Strategy](adr0011-multi-model-strategy.md) - Claude for extraction
- [ADR-0015: Formal Concept Model](adr0015-formal-concept-model.md) - Later formalization (Nov 13)

## References

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: Explicit decision documented October 13, 2024
- Metrics: 2x improvement in concept matching (IMPLEMENTATION_COMPLETE.md lines 148-152)
- Cost: $0.041/doc documented in planning

**Traceability:** Every metric traces to .ai/planning/2025-10-13-conceptual-search-implementation/ folder



