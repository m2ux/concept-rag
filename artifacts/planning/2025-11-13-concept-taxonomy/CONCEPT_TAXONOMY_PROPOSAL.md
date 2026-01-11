# Concept Taxonomy Improvement Proposal

## Problem Statement

Currently, there is significant ontological overlap between "primary_concepts" and "technical_terms":

**Examples of Overlap:**
- Art of War: "intelligence gathering" (concept) vs "intelligence" (term)
- Art of War: "espionage" (concept) vs "spying" (term) vs "converted spy" (term)
- Complexity: "network structures" (concept) vs "social network analysis" (term)

The system provides minimal differentiation after extraction (only 2x weighting and relationship linking), which doesn't justify the maintenance of two categories.

## Root Cause

1. **Vague extraction prompt**: Terms like "methodologies" and "theories" appear in guidance for both categories
2. **Minimal post-extraction differentiation**: Both are merged and treated identically in search
3. **No functional distinction**: The use cases for each category are nearly identical

## Proposed Solution: Clear Ontological Boundaries

### New Definitions

#### **Primary Concepts** (Thematic/Abstract)
**Purpose**: Semantic search, thematic browsing, "what is this document about?"

**Include**:
- Abstract ideas and principles (e.g., "strategic thinking", "emergence")
- Processes and activities (e.g., "intelligence gathering", "pattern recognition")
- Phenomena and conditions (e.g., "social complexity", "urban scaling")
- Relationships and dynamics (e.g., "cause and effect", "feedback loops")
- Theoretical frameworks (e.g., "complexity theory", "systems thinking")
- Conceptual categories (e.g., "military strategy", "innovation processes")

**Exclude**:
- Proper nouns (names of people, places, organizations)
- Specific artifacts or tools
- Domain-specific jargon that requires definition
- Precise mathematical/scientific notation

**Search behavior**: Fuzzy/semantic matching, query expansion via synonyms and related concepts

---

#### **Technical Terms** (Specific/Concrete)
**Purpose**: Exact lookup, glossary building, "what vocabulary do I need?"

**Include**:
- Named entities: people, places, organizations (e.g., "Sun Tzu", "Santa Fe Institute")
- Specific methodologies with formal names (e.g., "agent-based modeling", "regression analysis")
- Artifacts and tools (e.g., "spears", "halberds", "drums")
- Mathematical/scientific notation (e.g., "equation 7.2", "y₀", "beta coefficient")
- Domain jargon requiring definition (e.g., "flanking maneuver", "allometric scaling")
- Proper names of theories/works (e.g., "Art of War", "Methodos Series")
- Data and measurements (e.g., "r² = 0.8651", "Italy 2001")

**Exclude**:
- Abstract concepts that can be expressed in many ways
- General processes or phenomena
- Ideas that exist independently of specific terminology

**Search behavior**: Exact/precise matching, no expansion (or minimal), useful for "find mentions of X"

---

### Implementation Changes

#### 1. **Updated Extraction Prompt** (`concept_extractor.ts`)
Provide clear, mutually exclusive guidelines with decision rules:
- "If it's a proper noun → technical term"
- "If it requires a specific definition → technical term"  
- "If it's an abstract idea → primary concept"
- "If it describes a general process → primary concept"

#### 2. **Differentiated Search Behavior** (multiple files)

**For Primary Concepts**:
- Enable aggressive query expansion (WordNet, related concepts)
- Use fuzzy matching (partial matches, synonyms)
- Higher weight in semantic/thematic searches
- Link to related concepts for exploration

**For Technical Terms**:
- Minimal or no query expansion (preserve precision)
- Exact matching (or very tight fuzzy threshold)
- Higher weight in specific lookup queries
- Useful for "find all mentions of [person/theory/tool]"

#### 3. **Distinct Indexes or Flags**
- Add `concept_type: 'thematic' | 'terminology'` field to `ConceptRecord`
- Allow search tools to target one or both types
- Enable filtered browsing (e.g., "show me all technical terms in this doc")

#### 4. **Usage in Different Tools**
- **Catalog search**: Emphasize primary concepts (thematic discovery)
- **Exact lookup**: Emphasize technical terms (reference checking)
- **Chunks search**: Use both with different matching strategies
- **Concept extraction display**: Group clearly and label purpose

---

### Examples of Improved Classification

#### Art of War
**Primary Concepts**:
- military strategy
- tactical planning  
- leadership principles
- intelligence gathering
- deception tactics
- terrain analysis
- battlefield reconnaissance

**Technical Terms**:
- Sun Tzu
- Sun Wu
- Art of War (the book)
- converted spy
- halberds
- spears
- thirteen chapters
- Ch'i state
- Ho Lu

#### Complexity Perspectives
**Primary Concepts**:
- complexity perspectives
- innovation processes
- social change
- urban scaling
- network formation
- emergence
- self-organization

**Technical Terms**:
- Santa Fe Institute
- David Lane
- Denise Pumain
- equation 7.2
- r² = 0.8651
- agent-based modeling
- LanceDB (if tool)
- Methodos Series

---

### Benefits

1. **Clearer extraction**: LLM has unambiguous decision rules
2. **Better search precision**: Technical terms don't pollute semantic searches
3. **Better search recall**: Concepts expand appropriately without term noise
4. **Useful for different use cases**: 
   - "What topics does this cover?" → concepts
   - "Does it mention [person/theory]?" → terms
5. **Reduces overlap**: Clear boundaries prevent duplication
6. **Better organization**: Natural taxonomy for browsing/filtering

---

### Migration Strategy

1. Update extraction prompt with new guidelines
2. Add `concept_type` field to types
3. Update concept index builder to tag type
4. Update search clients to use type-specific strategies
5. Re-extract concepts for existing documents (or migrate gradually)
6. Update tool descriptions to mention the distinction

---

### Alternative: Single Category with Sub-types

If maintaining two top-level categories is burdensome, consider:

**One "concepts" array** with objects:
```typescript
{
  concept: "military strategy",
  type: "thematic" | "terminology",
  weight: number
}
```

This simplifies storage while preserving the functional distinction for search behavior.

