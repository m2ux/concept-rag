# Concept Taxonomy Quick Reference Guide

## The Three Categories

### Primary Concepts (Thematic/Abstract)
**Purpose:** Semantic search, thematic exploration, "what is this about?"

**What belongs here:**
- ✅ Abstract ideas: "strategic thinking", "emergence", "complexity"
- ✅ Processes: "intelligence gathering", "urban development", "pattern recognition"
- ✅ Phenomena: "exponential growth", "feedback loops", "social change"
- ✅ Relationships: "cause and effect", "competition", "collaboration"
- ✅ Theoretical frameworks: "systems thinking", "complexity theory"
- ✅ Methodologies: "agent-based modeling", "regression analysis", "vector search"
- ✅ Strategies/tactics: "flanking maneuver", "allometric scaling", "pincer movement"
- ✅ Domain concepts (even technical ones): "terrain analysis", "concept extraction"

**What doesn't belong:**
- ❌ Names of people, places, organizations
- ❌ Specific artifacts/objects (weapons, tools)
- ❌ Precise mathematical notation
- ❌ Dates, numbers, measurements
- ❌ Proper names of works/publications

**Search behavior:**
- Fuzzy/semantic matching
- Query expansion via synonyms
- Expansion via related concepts
- Higher recall, semantic coverage

---

### Technical Terms (Terminology/Specific)
**Purpose:** Exact lookup, reference checking, "does it mention X?"

**What belongs here:**
- ✅ Names of people: "Sun Tzu", "David Lane", "Ho Lu"
- ✅ Names of places: "Wu State", "London", "Santa Fe Institute"
- ✅ Names of organizations: "Santa Fe Institute", "CNRS"
- ✅ Specific artifacts/objects: "spears", "halberds", "drums", "chariots"
- ✅ Mathematical notation: "equation 7.2", "r² = 0.8651", "dn/dt"
- ✅ Proper names of works: "Art of War", "Methodos Series"
- ✅ Specific roles/titles: "general", "officers", "concubines"
- ✅ Data/measurements: "Italy 2001", "UK 2001"
- ✅ Software/tools (proper nouns): "LanceDB", "Python"

**What doesn't belong:**
- ❌ Methodologies (those are concepts): "agent-based modeling", "regression analysis"
- ❌ Strategies/tactics (those are concepts): "flanking maneuver", "allometric scaling"
- ❌ Abstract ideas or processes
- ❌ Conceptual relationships

**Search behavior:**
- Exact/precise matching
- Minimal query expansion
- Higher precision, no false positives

---

### Acronyms (NEW!)
**Purpose:** Abbreviations for exact lookup

**What belongs here:**
- ✅ Organizational acronyms: "MIT", "NATO", "UNESCO", "CNRS"
- ✅ Technical abbreviations: "DNA", "GDP", "AI", "ML"
- ✅ Domain abbreviations: "GIS", "SNA", "ABM"

**Search behavior:**
- Exact matching only
- Treated as terminology
- Slightly lower weight than full terms

---

## Decision Tree

```
Is it metadata (page#, ISBN, copyright, etc.)?
├─ YES → EXCLUDE (don't extract)
└─ NO
   ├─ Is it an acronym/abbreviation?
   │  └─ YES → Acronyms
   └─ NO
      ├─ Is it a proper noun (person, org, work)?
      │  └─ YES → Technical Term
      └─ NO
         ├─ Is it an artifact/object?
         │  └─ YES → Technical Term
         └─ NO
            └─ Is it an idea/method/concept?
               └─ YES → Primary Concept
```

**Key insight:** Methodologies, strategies, and approaches are CONCEPTS, not terms, even if they're technical or domain-specific.

---

## Examples

### Military/Strategy Domain

| Term | Category | Reasoning |
|------|----------|-----------|
| military strategy | Primary Concept | Abstract idea, can be expressed many ways |
| Sun Tzu | Technical Term | Proper noun (person) |
| intelligence gathering | Primary Concept | General process, abstract activity |
| spears | Technical Term | Specific artifact |
| tactical planning | Primary Concept | Abstract process |
| Wu State | Technical Term | Proper noun (place) |
| leadership principles | Primary Concept | Abstract concept |
| Art of War | Technical Term | Proper noun (work title) |

### Science/Complexity Domain

| Term | Category | Reasoning |
|------|----------|-----------|
| complexity theory | Primary Concept | Theoretical framework, abstract |
| Santa Fe Institute | Technical Term | Proper noun (organization) |
| emergence | Primary Concept | Abstract phenomenon |
| agent-based modeling | Primary Concept | Methodology/approach (idea, not name) |
| urban scaling | Primary Concept | General phenomenon |
| equation 7.2 | Technical Term | Specific notation/reference |
| feedback loops | Primary Concept | Abstract concept/pattern |
| David Lane | Technical Term | Proper noun (person) |

---

## Search Use Cases

### Use Case 1: Thematic Discovery
**Goal:** "What documents discuss leadership?"

**Query:** `leadership`

**System behavior:**
- Matches primary concept: "leadership principles"
- Expands to: "command authority", "organizational behavior"
- Uses fuzzy matching
- Returns documents about leadership themes

**Result:** High recall, semantic coverage

---

### Use Case 2: Specific Reference
**Goal:** "Does any document mention Sun Tzu?"

**Query:** `Sun Tzu`

**System behavior:**
- Matches technical term: "Sun Tzu"
- No expansion (preserve precision)
- Exact matching required
- Returns only documents mentioning him by name

**Result:** High precision, no false positives

---

### Use Case 3: Abstract Research
**Goal:** "Find documents about complex systems"

**Query:** `complex systems`

**System behavior:**
- Matches primary concepts: "complexity theory", "emergence", "self-organization"
- Expands via WordNet and related concepts
- Fuzzy matching captures variations
- Returns thematically relevant documents

**Result:** Comprehensive coverage of related topics

---

### Use Case 4: Methodology Discovery
**Goal:** "Which documents discuss agent-based modeling?"

**Query:** `agent-based modeling`

**System behavior:**
- Matches primary concept: "agent-based modeling"
- Expands to related concepts: "multi-agent systems", "simulation modeling"
- Fuzzy matching captures variations
- Returns documents discussing this methodology

**Result:** Comprehensive coverage of methodology and related approaches

---

## Common Pitfalls to Avoid

### ❌ Wrong: Confusing methodology with name
- ~~"agent-based modeling is a technical term because it's specific"~~
- ✅ "agent-based modeling" is a primary concept (methodology/approach, not a proper noun)

### ❌ Wrong: Putting same thing in both
- ~~Primary: "intelligence gathering", Technical: "intelligence"~~
- ✅ Primary: "intelligence gathering" ONLY (abstract process)

### ❌ Wrong: Ignoring proper nouns
- ~~Primary: "Sun Tzu's strategy"~~
- ✅ Primary: "military strategy", Technical: "Sun Tzu"

### ❌ Wrong: Generic becomes specific
- ~~Technical: "strategy"~~
- ✅ Primary: "strategic thinking" (abstract), Technical: "thirteen chapters" (specific)

---

## Validation Checklist

After extraction, verify:

- [ ] All proper nouns in technical_terms?
- [ ] All abstract ideas in primary_concepts?
- [ ] No overlap between categories?
- [ ] Can thematic concepts be paraphrased? (should be YES)
- [ ] Do technical terms have specific definitions? (should be YES)
- [ ] Are there at least 2x technical terms vs concepts? (usually YES for most docs)

---

## For Developers

### Accessing Type Information

```typescript
// In concept index
const record = conceptMap.get('military strategy');
console.log(record.concept_type); // 'thematic'

// In search results
const result = await search('leadership');
console.log(result.matched_concepts); 
// ['[thematic] leadership principles', '[term] Sun Tzu']
```

### Filtering by Type

```typescript
// Get only thematic concepts
const thematic = concepts.filter(c => c.concept_type === 'thematic');

// Get only terminology
const terminology = concepts.filter(c => c.concept_type === 'terminology');
```

### Type-Specific Search

```typescript
// For semantic exploration (emphasize thematic)
const thematicSearch = await searchByType(query, 'thematic');

// For reference lookup (emphasize terminology)
const termSearch = await searchByType(query, 'terminology');
```

---

## Summary

**Two categories, two purposes:**

1. **Primary Concepts (Thematic)** = Abstract ideas for "what is this about?"
   - Fuzzy matching, semantic expansion, high recall

2. **Technical Terms (Terminology)** = Specific references for "does it mention X?"
   - Exact matching, minimal expansion, high precision

**Key principle:** If it's a name or requires specific definition → term. If it's an abstract idea → concept.

