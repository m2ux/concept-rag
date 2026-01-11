# Classification Clarification: Methodologies vs Names

## Important Correction

The initial implementation had a misunderstanding about where methodologies, strategies, and domain-specific concepts belong. This has been corrected.

---

## The Key Insight

**Methodologies, strategies, and approaches are CONCEPTS, not technical terms** — even when they're domain-specific or technical in nature.

### Why?

The distinction is not about **how technical** something is, but about **what it is**:

- **Concepts** = Ideas, methods, strategies, processes (what you DO or THINK)
- **Terms** = Names, entities, artifacts, notation (what you NAME or REFERENCE)

---

## Corrected Classifications

### ✅ PRIMARY CONCEPTS (Not Technical Terms)

These are **concepts/ideas**, even though they're technical:

- ✅ "agent-based modeling" (methodology)
- ✅ "regression analysis" (methodology)
- ✅ "flanking maneuver" (tactical strategy)
- ✅ "allometric scaling" (scientific concept)
- ✅ "vector search" (approach)
- ✅ "concept extraction" (process)
- ✅ "reconnaissance" (activity)
- ✅ "fortifications" (general strategy)

**Why concepts?** These are IDEAS about how to do something or understand something. They're not proper nouns.

---

### ✅ TECHNICAL TERMS (Not Concepts)

These are **specific references** to entities or notation:

- ✅ "Sun Tzu" (person's name)
- ✅ "Wu State" (place name)
- ✅ "Art of War" (work title)
- ✅ "spears" (artifact)
- ✅ "halberds" (artifact)
- ✅ "drums" (artifact)
- ✅ "equation 7.2" (specific notation)
- ✅ "r² = 0.8651" (data)
- ✅ "general" (specific role/title)
- ✅ "LanceDB" (software name)

**Why terms?** These are NAMES of specific things or NOTATION for specific data.

---

## The Critical Distinction

### ❌ WRONG: "Domain-specific = Technical Term"

~~"flanking maneuver is technical military jargon, so it's a technical term"~~

### ✅ CORRECT: "Name vs Idea"

"flanking maneuver is a TACTICAL CONCEPT (idea/strategy), so it's a primary concept"

---

## Decision Rules (Corrected)

### Is it a CONCEPT? (Primary Concepts)

- ✅ Can you DO it? (methodology, strategy, approach)
- ✅ Can you THINK about it abstractly? (idea, principle, theory)
- ✅ Does it describe HOW something works? (process, phenomenon)
- ✅ Is it a WAY of understanding something? (framework, perspective)

**→ Primary Concept** (even if highly technical)

### Is it a TERM? (Technical Terms)

- ✅ Is it someone's NAME?
- ✅ Is it the name of a PLACE or ORGANIZATION?
- ✅ Is it a specific ARTIFACT or OBJECT?
- ✅ Is it MATHEMATICAL NOTATION or DATA?
- ✅ Is it a specific TITLE or ROLE?

**→ Technical Term**

---

## Examples

### Military/Strategy Domain

| Item | Correct Category | Reasoning |
|------|-----------------|-----------|
| flanking maneuver | Primary Concept | Tactical strategy (idea) |
| pincer movement | Primary Concept | Tactical concept (idea) |
| reconnaissance | Primary Concept | Military activity (concept) |
| spears | Technical Term | Physical artifact (object) |
| general | Technical Term | Specific role/title |
| Sun Tzu | Technical Term | Person's name |

### Science/Research Domain

| Item | Correct Category | Reasoning |
|------|-----------------|-----------|
| agent-based modeling | Primary Concept | Methodology (approach/idea) |
| regression analysis | Primary Concept | Statistical method (concept) |
| allometric scaling | Primary Concept | Scientific concept (idea) |
| vector search | Primary Concept | Search methodology (approach) |
| equation 7.2 | Technical Term | Specific notation reference |
| LanceDB | Technical Term | Software name (proper noun) |
| David Lane | Technical Term | Person's name |

---

## Why This Matters

### Search Behavior Impact

**For Methodologies (Concepts):**
```typescript
Query: "agent-based modeling"
✅ Expands to: "multi-agent systems", "simulation modeling", "ABM"
✅ Fuzzy matching: matches "agent based model", "ABM approach"
✅ Result: Comprehensive coverage of methodology discussion
```

**For Names (Terms):**
```typescript
Query: "Sun Tzu"  
✅ Exact matching: requires precise name match
✅ No expansion: doesn't expand to "Chinese military theorist"
✅ Result: Precise references to the person
```

### Why Different Treatment?

- **Methodologies** benefit from expansion (related methods, synonyms)
- **Names** need precision (avoid false positives)

---

## Updated Prompt Guidance

The extraction prompt now clearly states:

```
PRIMARY CONCEPTS include:
- Domain-specific concepts/strategies (e.g., "flanking maneuver", "allometric scaling")
- Methodologies and approaches (e.g., "agent-based modeling", "vector search")

DECISION RULE: 
If it's an IDEA/CONCEPT/METHOD (even if technical) → primary_concept

TECHNICAL TERMS include:
- Named entities ONLY (people, places, organizations)
- Specific artifacts/objects
- Mathematical notation and data

DECISION RULE:
If it's a PROPER NOUN or SPECIFIC NAMED ENTITY → technical_term

CRITICAL: 
Methodologies are concepts ("regression analysis") while 
specific tools/software are terms ("LanceDB", "Python")
```

---

## Migration Notes

### For New Extractions

The corrected prompt will automatically classify:
- Methodologies → Primary Concepts
- Strategies → Primary Concepts  
- Names → Technical Terms
- Artifacts → Technical Terms

### For Existing Data

If you've already extracted concepts with the old guidance, you may see:
- Some methodologies incorrectly in technical_terms
- The system will still work, but with suboptimal search behavior
- Re-extraction with the corrected prompt is recommended

---

## Summary

**The simple rule:**

- **Name or object?** → Technical Term
- **Idea or method?** → Primary Concept

**Don't be fooled by:**
- Domain specificity (technical doesn't mean it's a term)
- Formal names (only if it's a PROPER noun, like "Art of War")
- Jargon (jargon describing concepts = concepts)

**Key examples to remember:**
- "agent-based modeling" = Concept (methodology)
- "LanceDB" = Term (software name)
- "flanking maneuver" = Concept (tactical idea)
- "spears" = Term (physical object)


