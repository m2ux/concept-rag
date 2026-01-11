# 15. Formal Concept Model Definition

**Date:** 2025-11-13  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Concept Extraction Enhancement (November 13, 2025)

**Sources:**
- Planning: [2025-11-13-concept-extraction-enhancement](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-13-concept-extraction-enhancement/)

## Context and Problem Statement

While concept extraction was working (since October 13) [ADR-0007], there was no formal definition of what constitutes a "concept" in the system [Gap: definition missing]. This led to potential inconsistencies in extraction quality, unclear inclusion/exclusion criteria, and difficulty evaluating whether extracted concepts met quality standards [Problem: no evaluation criteria].

**The Core Problem:** What exactly IS a concept in the concept-RAG system, and how do we ensure all LLM agents extract concepts consistently? [Planning: [FORMAL_CONCEPT_DEFINITION.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-13-concept-extraction-enhancement/FORMAL_CONCEPT_DEFINITION.md)]

**Decision Drivers:**
* Need consistent extraction across different LLM calls [Requirement: consistency]
* Evaluation criteria for concept quality [Requirement: quality assessment]
* Clear guidelines for inclusion/exclusion [Requirement: explicit criteria]
* Training reference for future LLM agents [Requirement: documentation]
* Foundation for system improvements [Architecture: formal specification]

## Alternative Options

* **Option 1: Formal Definition with Inclusion/Exclusion Rules** - Explicit specification
* **Option 2: Example-Based** - Show examples of good/bad concepts
* **Option 3: No Formal Definition** - Let LLM decide implicitly
* **Option 4: Schema-Based** - Define via type structure only
* **Option 5: Taxonomy-Based** - Define by category membership

## Decision Outcome

**Chosen option:** "Formal Definition with Inclusion/Exclusion Rules (Option 1)", because it provides the clearest guidance for LLM extraction, enables quality evaluation, and serves as authoritative documentation for the entire system.

### The Formal Definition

**Canonical Text:** [Source: `FORMAL_CONCEPT_DEFINITION.md`, line 9; implemented in `AGENTS.md`]

> **A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

### Key Components

**9 Essential Elements:** [Source: `AGENTS.md` created November 13, 2025]

1. **Uniquely Identified** - Distinct from other concepts
2. **Abstract Idea** - Not concrete instances or examples
3. **Names** - Multiple names/terms for the concept
4. **Definition** - Clear meaning and scope
5. **Distinguishing Features** - What makes it unique
6. **Relations** - Connections to other concepts
7. **Detection Cues** - How to recognize in text
8. **Semantic Matching** - Enables search and retrieval
9. **Disambiguated** - Clear boundaries vs. related concepts

### Inclusion Criteria

**✅ INCLUDE:** [Source: README.md, line 137; `AGENTS.md`]
- Domain terms (e.g., "consensus algorithm")
- Theories (e.g., "Elliott Wave Theory")
- Methodologies (e.g., "test-driven development")
- Multi-word conceptual phrases (e.g., "separation of concerns")
- Phenomena (e.g., "race condition")
- Abstract principles (e.g., "single responsibility")

### Exclusion Criteria

**❌ EXCLUDE:** [Source: README.md, line 138; `AGENTS.md`]
- Temporal descriptions ("in 2020", "during the war")
- Action phrases ("should implement", "must configure")
- Suppositions ("might be", "could potentially")
- Proper names (people, places, organizations)
- Dates and numbers
- Generic words without conceptual meaning

### Implementation

**Files Created/Updated:** [Source: `FORMAL_CONCEPT_DEFINITION.md`, lines 13-38]

1. **`AGENTS.md` (Project Root)** [Source: `FORMAL_CONCEPT_DEFINITION.md`, lines 13-24]
   - Formal definition
   - Key components breakdown
   - Extraction guidelines
   - Integration instructions

2. **`src/concepts/concept_extractor.ts`** [Source: `FORMAL_CONCEPT_DEFINITION.md`, lines 26-38]
   - Line 102: Multi-pass extraction prompt updated
   - Line 197: Single-pass extraction prompt updated
   - Both include formal definition at beginning

**Prompt Integration:** [Source: `concept_extractor.ts`, lines 102 and 197]
```typescript
const prompt = `
FORMAL DEFINITION:
A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.

[... rest of extraction prompt ...]
`;
```

### Consequences

**Positive:**
* **Consistency:** All LLM agents receive same definition [Benefit: `FORMAL_CONCEPT_DEFINITION.md`, line 42-43]
* **Quality:** Clear guidelines improve extraction quality [Benefit: lines 48-54]
* **Evaluation:** Can assess if extractions meet criteria [Benefit: quality metrics possible]
* **Documentation:** Authoritative reference for developers [Benefit: lines 57-62]
* **Training:** Future agents can reference formal model [Benefit: onboarding]
* **Disambiguation:** Explicit guidance on concept boundaries [Benefit: clarity]
* **System alignment:** All components reference same model [Benefit: lines 64-70]

**Negative:**
* **Rigidity:** Definition may need evolution as system grows [Risk: future constraints]
* **Interpretation:** LLMs may still interpret definition differently [Limitation: LLM variance]
* **Verification:** Hard to programmatically verify compliance [Challenge: quality assurance]
* **Maintenance:** Definition must be kept synchronized across prompts [Burden: consistency maintenance]

**Neutral:**
* **Backward compatibility:** Doesn't invalidate existing concepts [Impact: historical data]
* **Iterative refinement:** Definition can be improved over time [Process: evolutionary]

### Confirmation

**Validation:** [Source: `FORMAL_CONCEPT_DEFINITION.md`, lines 82-88]
- ✅ AGENTS.md created with formal definition
- ✅ Chunk extraction prompt updated (line 102)
- ✅ Single-pass extraction prompt updated (line 197)
- ✅ TypeScript compiled successfully
- ✅ No linting errors
- ✅ Planning documentation created

**Production Impact:**
- Clearer concept extraction from Nov 13 onwards
- Consistent quality across documents indexed after formalization
- Reference point for evaluating existing concepts

## Pros and Cons of the Options

### Option 1: Formal Definition with Rules - Chosen

**Pros:**
* Crystal clear guidelines [Source: definition text]
* Explicit inclusion/exclusion rules [Source: AGENTS.md]
* Evaluatable quality
* Authoritative documentation
* Improves extraction consistency [Validated: FORMAL_CONCEPT_DEFINITION.md]

**Cons:**
* May need evolution
* LLM interpretation variance
* Hard to verify programmatically
* Maintenance burden

### Option 2: Example-Based

Provide good/bad examples instead of formal definition.

**Pros:**
* Concrete and easy to understand
* Shows real cases
* Less abstract

**Cons:**
* **Less precise:** Examples don't cover all cases [Limitation: incomplete]
* **Ambiguity:** What about edge cases not in examples?
* **Maintenance:** Must update examples as system evolves
* **Inconsistent:** Different agents may generalize differently from examples

### Option 3: No Formal Definition

Let LLM decide what concepts are based on its training.

**Pros:**
* Zero effort (current state before Nov 13)
* LLM uses built-in understanding
* Flexible

**Cons:**
* **Inconsistent:** Different calls may extract differently [Problem: variance]
* **No quality criteria:** Can't evaluate extraction quality [Gap: no standards]
* **Unclear expectations:** Developers don't know what to expect [Documentation: lacking]
* **This was the problem:** Why formalization was needed [History: pre-Nov-13 state]

### Option 4: Schema-Based

Define via TypeScript interfaces only.

**Pros:**
* Type-safe
* Programmatically enforced
* IDE support

**Cons:**
* **Doesn't guide extraction:** LLM doesn't see TypeScript types [Gap: not in prompts]
* **Structure without semantics:** Types show "what" not "why"
* **Incomplete:** Doesn't specify inclusion/exclusion criteria

### Option 5: Taxonomy-Based

Define concepts by their position in taxonomy.

**Pros:**
* Hierarchical organization
* Clear categories
* Navigable structure

**Cons:**
* **Doesn't define concept itself:** What makes something a concept? [Gap: fundamental question]
* **Circular:** Need to define concepts before building taxonomy
* **Rigid:** Forces concepts into predetermined categories
* **Over-constrains:** Some concepts span categories

## Implementation Notes

### AGENTS.md Structure

**File Location:** Project root [Source: `FORMAL_CONCEPT_DEFINITION.md`, line 15]

**Sections:** [Source: lines 15-24]
1. Formal definition
2. Key components breakdown (9 elements)
3. Document parsing guidelines
4. Concept extraction process
5. Integration guidelines
6. Usage instructions for system components

### Integration in Extraction

**Both Prompts Updated:** [Source: lines 30-38]
- Multi-pass extraction (line 102 of concept_extractor.ts)
- Single-pass extraction (line 197 of concept_extractor.ts)

**Format:**
```
FORMAL DEFINITION:
[Definition text here]

EXTRACTION GUIDELINES:
[Detailed instructions...]
```

### Future Enhancements

**Optional Improvements:** [Source: `FORMAL_CONCEPT_DEFINITION.md`, lines 72-80]
1. Structured concept schema (capture relations explicitly)
2. Concept validation logic
3. Relation extraction (hierarchical, associative, causal)
4. Detection cue database
5. Quality metrics

## Related Decisions

- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Extraction process formalized
- [ADR-0009: Three-Table Architecture](adr0009-three-table-architecture.md) - Concept storage
- [ADR-0008: WordNet Integration](adr0008-wordnet-integration.md) - Semantic relationships

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 13, 2024
- Documented in: FORMAL_CONCEPT_DEFINITION.md

**Traceability:** [2025-11-13-concept-extraction-enhancement](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-13-concept-extraction-enhancement/)



