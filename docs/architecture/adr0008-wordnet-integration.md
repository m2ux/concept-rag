# 8. WordNet Integration for Semantic Enrichment

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Conceptual Search Implementation (October 13, 2025)

**Sources:**
- Planning: .ai/planning/2025-10-13-conceptual-search-implementation/

## Context and Problem Statement

Corpus-driven concept extraction [ADR-0007] provided domain-specific technical terms, but lacked general vocabulary relationships. For example, if a document discussed "strategies" but user searched for "approaches" or "methods", the system might not make the connection [Inferred: semantic gap problem]. The system needed access to general semantic relationships (synonyms, hypernyms, hyponyms) to enhance query understanding.

**The Core Problem:** How to bridge the semantic gap between user queries and document vocabulary without expensive fine-tuned embeddings? [Planning: WordNet integration rationale]

**Decision Drivers:**
* Need for synonym matching ("approach" = "strategy" = "method") [Use case: query expansion]
* Coverage of general English vocabulary (161K+ words) [Source: `IMPLEMENTATION_COMPLETE.md`, line 23]
* Free and offline-capable [Requirement: cost-effective]
* Complement corpus-driven concepts (70% corpus + 30% WordNet) [Source: `IMPLEMENTATION_PLAN.md`, line 6; `IMPLEMENTATION_COMPLETE.md`, line 134]
* Hierarchical relationships (broader/narrower terms) [Source: `IMPLEMENTATION_COMPLETE.md`, line 24]

## Alternative Options

* **Option 1: WordNet via NLTK** - Established lexical database
* **Option 2: ConceptNet** - Crowd-sourced knowledge graph
* **Option 3: Word2Vec/GloVe** - Pre-trained word embeddings
* **Option 4: BabelNet** - Multilingual semantic network
* **Option 5: Custom Synonym Dictionary** - Manual curation

## Decision Outcome

**Chosen option:** "WordNet via NLTK (Option 1)", because it provides comprehensive English vocabulary coverage (161K+ words, 419K+ relationships) at zero cost, with mature Python libraries and offline capability.

### Implementation

**WordNet Access:** Python NLTK bridge [Source: `IMPLEMENTATION_COMPLETE.md`, lines 21-25]

**Coverage:** [Source: `IMPLEMENTATION_COMPLETE.md`, line 23; README.md, line 23]
- Words: 161,000+
- Relationships: 419,000+ (synsets, hypernyms, hyponyms, meronyms)

**Files Created:** [Source: `IMPLEMENTATION_COMPLETE.md`, line 66]
- `src/wordnet/wordnet_service.ts` - Python-Node.js bridge

**Installation:** [Source: `IMPLEMENTATION_PLAN.md`, lines 20-29]
```bash
pip install nltk
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
```

### Semantic Relationships Extracted

**Relationship Types:** [Source: `IMPLEMENTATION_PLAN.md`, WordNet synset structure]
```typescript
interface WordNetSynset {
    word: string;              // Original term
    synset_name: string;       // WordNet synset ID
    synonyms: string[];        // Same meaning
    hypernyms: string[];       // Broader terms (is-a)
    hyponyms: string[];        // Narrower terms (types-of)
    meronyms: string[];        // Part-of relationships
    definition: string;        // WordNet definition
}
```

**Example Expansion:**
```
Query: "strategy"
→ Synonyms: approach, method, technique, plan, tactic
→ Hypernyms: plan_of_action, scheme
→ Hyponyms: military_strategy, business_strategy
```

### Integration in Scoring

WordNet added as 5th signal: [Source: `IMPLEMENTATION_COMPLETE.md`, lines 138-145]

| Signal | Weight | Function |
|--------|--------|----------|
| Vector | 25% | Semantic similarity |
| BM25 | 25% | Keyword relevance |
| Title | 20% | Filename matching |
| Concept | 20% | Corpus concept matching |
| **WordNet** | **10%** | **Synonym expansion** ⬅️ NEW |

**Weight Rationale:** 10% weight because WordNet is general-purpose, while corpus concepts are domain-specific [Planning: scoring strategy discussion]

### Query Expansion Strategy

**Hybrid Approach:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 133-136]
- **70% corpus concepts** - Domain-specific, technical terms
- **30% WordNet** - General synonyms, broad coverage

**Implementation:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 32-35]
- `src/concepts/query_expander.ts` - Query expansion engine
- Weighted term importance scoring
- Parallel expansion for performance
- Technical context filtering to avoid noise

### Caching Strategy

**Persistent Cache:** [Source: `IMPLEMENTATION_COMPLETE.md`, line 25]
- Caches WordNet lookups to avoid repeated Python subprocess calls
- Cache location: `data/caches/` directory
- Significant performance improvement for repeated terms

### Consequences

**Positive:**
* **Synonym coverage:** 80% (up from 20%) [Source: `IMPLEMENTATION_COMPLETE.md`, line 150]
* **Query expansion:** 3-5x original terms [Source: `IMPLEMENTATION_COMPLETE.md`, line 133]
* **Zero cost:** Free lexical database [Source: WordNet license]
* **Offline capability:** Works without internet (after initial download) [Source: local NLTK data]
* **Mature and stable:** WordNet established since 1985 [General: WordNet history]
* **161K+ words:** Comprehensive English coverage [Source: README.md]
* **Hierarchical navigation:** Hypernyms/hyponyms enable concept hierarchies [Source: `IMPLEMENTATION_COMPLETE.md`, line 24]
* **Complements corpus:** General + domain-specific = comprehensive

**Negative:**
* **Python dependency:** Requires Python 3.9+ and NLTK [Source: README.md, prerequisites]
* **Subprocess overhead:** Python bridge adds latency (~10-50ms per call) [Estimate: subprocess cost]
* **General vocabulary:** Not domain-specific (hence lower 10% weight) [Rationale: generic terms]
* **English-only:** No multilingual support (WordNet is English) [Limitation: language coverage]
* **Maintenance:** NLTK and WordNet data must be kept updated [Requirement: dependency management]
* **Setup step:** Users must install Python dependencies [Source: SETUP.md requirements]

**Neutral:**
* **Technical filtering:** Must filter out inappropriate expansions [Implementation: context-aware filtering]
* **50MB download:** WordNet data size [Source: installation requirements]
* **Cache management:** Must manage cache size and invalidation

### Confirmation

**Validation Results:** [Source: `IMPLEMENTATION_COMPLETE.md`, lines 148-152]

| Metric | Before (No WordNet) | After (With WordNet) | Improvement |
|--------|---------------------|----------------------|-------------|
| **Synonym matching** | **20%** | **80%** | **4x better** |
| Concept matching | 40% | 85% | 2x better |
| Cross-document | 30% | 75% | 2.5x better |

**Query Expansion Example:**
```
Original: "distributed systems consensus"
Expanded (3-5x): 
  - From corpus: "distributed computing", "parallel systems", "consensus algorithms"
  - From WordNet: "concurrent", "synchronized", "agreement", "distributed"
  - Total: 15-20 terms (vs. 3 original)
```
[Planning: query expansion examples]

## Pros and Cons of the Options

### Option 1: WordNet via NLTK - Chosen

**Pros:**
* Comprehensive (161K+ words) [Source: README]
* Free and open-source
* Offline capability
* Mature (40+ years)
* Python NLTK integration
* Hierarchical relationships (hypernyms/hyponyms)
* Persistent caching reduces overhead
* Validated: 4x improvement in synonym matching [Source: metrics]

**Cons:**
* Python dependency required
* Subprocess latency (~10-50ms)
* English-only
* General vocabulary (not domain-specific)
* Setup overhead (pip install, data download)

### Option 2: ConceptNet

Crowd-sourced semantic knowledge graph.

**Pros:**
* Broader than WordNet (common sense knowledge)
* Multilingual support
* Relationship types beyond synonyms
* Active development

**Cons:**
* **Quality variance:** Crowd-sourced data less consistent [Known: ConceptNet limitation]
* **Larger dataset:** More storage and processing
* **Complexity:** More relationship types to process
* **API dependency:** Or large local download
* **Over-engineering:** More than needed for synonym expansion

### Option 3: Word2Vec/GloVe Embeddings

Pre-trained word embedding models.

**Pros:**
* Purely vector-based
* Fast similarity lookups
* No subprocess overhead
* Trained on large corpora

**Cons:**
* **No explicit relationships:** Must compute similarity
* **Context-less:** Single vector per word (no word sense disambiguation)
* **Large models:** GloVe 300d vectors, Word2Vec 300d (100MB+ files)
* **Training data mismatch:** Not technical/academic domains
* **Vector space noise:** Related terms may not be actual synonyms

### Option 4: BabelNet

Multilingual semantic network combining WordNet, Wikipedia, etc.

**Pros:**
* Comprehensive multilingual coverage
* Wikipedia integration
* Rich semantic network
* Domain coverage

**Cons:**
* **API dependency:** Requires API key for full access [Source: BabelNet API docs]
* **Cost:** Free tier very limited
* **Complexity:** Much larger than needed
* **English-focused:** Project is English-only currently
* **Over-engineering:** WordNet sufficient for use case

### Option 5: Custom Synonym Dictionary

Manually curated technical synonym list.

**Pros:**
* Perfect for domain
* No dependencies
* Fast lookups
* Complete control

**Cons:**
* **Not scalable:** Manual curation for 37K concepts infeasible [Practicality: effort required]
* **Incomplete:** Will always miss terms
* **Maintenance burden:** Must update continuously
* **Domain-specific only:** No general vocabulary
* **Time cost:** Hundreds of hours vs. $0 for WordNet

## Implementation Notes

### Python-Node.js Bridge

**Architecture:** [Code: `src/wordnet/wordnet_service.ts`]
```typescript
// Node.js calls Python via child_process
import { spawn } from 'child_process';

async function getWordNetSynonyms(word: string): Promise<string[]> {
  const python = spawn('python3', ['-c', `
    from nltk.corpus import wordnet as wn
    synsets = wn.synsets('${word}')
    synonyms = set(lemma.name() for synset in synsets for lemma in synset.lemmas())
    print(list(synonyms))
  `]);
  // Parse stdout...
}
```

### Caching Implementation

**Strategy:** [Source: `IMPLEMENTATION_COMPLETE.md`, line 25]
- Cache WordNet lookups in JSON files
- Location: `data/caches/wordnet/`
- Key: Word lowercase
- TTL: Indefinite (WordNet data stable)
- Reduces Python subprocess calls by ~95%

### Technical Context Filtering

**Problem:** General synonyms may be too broad for technical context [Implementation: filtering]

**Solution:** Filter WordNet expansions:
- Keep: Technical relevance score > threshold
- Remove: Common words that introduce noise
- Prioritize: Multi-word technical phrases from corpus over single-word WordNet terms

### Integration Timeline

**October 13, 2025:**
- Initial WordNet integration
- Basic synonym expansion
- Query expander created

**Later Enhancements:**
- Improved caching
- Context filtering
- Weight optimization

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Corpus concepts (70%) + WordNet (30%)
- [ADR-0010: Query Expansion](adr0010-query-expansion.md) - Uses WordNet for expansion
- [ADR-0006: Hybrid Search](adr0006-hybrid-search-strategy.md) - WordNet is 5th signal (10% weight)

## References

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: October 13, 2024
- Metrics from: IMPLEMENTATION_COMPLETE.md lines 21-25, 133-136, 148-152

**Traceability:** .ai/planning/2025-10-13-conceptual-search-implementation/



