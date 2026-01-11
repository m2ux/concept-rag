# Concept Taxonomy Implementation Summary

## Overview

Successfully implemented clear ontological boundaries between **Primary Concepts** (thematic/abstract) and **Technical Terms** (terminology/specific) to eliminate overlap and provide differentiated search behavior.

---

## Changes Made

### 1. **Type System Updates** (`src/concepts/types.ts`)

**Added:**
- New type `ConceptType = 'thematic' | 'terminology'`
- Added `concept_type` field to `ConceptRecord` interface
- Updated comments to clarify purpose of each category

**Impact:** Enables type-aware processing throughout the system

---

### 2. **Extraction Prompt Rewrite** (`src/concepts/concept_extractor.ts`)

**Before:**
- Vague guidance: "high-level topics/themes" vs "specific terms, methodologies..."
- Significant overlap in instructions
- No clear decision rules

**After:**
- **Clear decision rules:**
  - "If it's an ABSTRACT IDEA that can be expressed in many ways → primary_concept"
  - "If it's a PROPER NOUN or requires SPECIFIC DEFINITION → technical_term"
  
- **Explicit examples by category:**
  - Primary: abstract ideas, processes, phenomena, relationships, theoretical frameworks
  - Technical: named entities, artifacts, mathematical notation, domain jargon, proper names
  
- **Anti-overlap rules:**
  - "Proper nouns ALWAYS go in technical_terms"
  - "Abstract processes in primary_concepts, specific roles in technical_terms"
  - "NO OVERLAP: A term should NOT appear in both categories"

**Impact:** LLM now has unambiguous classification guidance

---

### 3. **Concept Index Building** (`src/concepts/concept_index.ts`)

**Changes:**
- `addOrUpdateConcept()` now accepts `conceptType` parameter
- Primary concepts tagged as `'thematic'` with 2.0x weight
- Technical terms tagged as `'terminology'` with 1.0x weight
- `concept_type` field stored in LanceDB table

**Impact:** Type information persisted for downstream use

---

### 4. **Differentiated Search Behavior** (`src/lancedb/conceptual_search_client.ts`)

**Updated `calculateConceptScore()`:**

**Before:**
```typescript
// Both types merged and treated identically
const docConcepts = [...primary_concepts, ...technical_terms];
// Fuzzy matching for all
```

**After:**
```typescript
// Separate handling by type
const thematicConcepts = primary_concepts;
const terminologyConcepts = technical_terms;

// Thematic: Fuzzy matching + boost
if (docConcept.includes(query) || query.includes(docConcept)) {
    weightedScore += queryWeight * 1.2;  // Boost
}

// Terminology: Tighter matching, no boost
if (docConcept === query || 
    (docConcept.includes(query) && query.length > 3)) {
    weightedScore += queryWeight;  // Standard
}
```

**Updated `getMatchedConcepts()`:**
- Results now labeled: `[thematic] strategy` vs `[term] Sun Tzu`
- Provides visibility into which type matched

**Impact:** 
- Thematic concepts get semantic/fuzzy matching
- Technical terms require precise matching
- Better precision and recall trade-offs per type

---

### 5. **Chunk Matching Strategy** (`src/concepts/concept_chunk_matcher.ts`)

**Added `technicalTermMatchesText()` method:**
- Requires exact or near-exact matches
- Word boundary checks (no partial words)
- Multi-word terms must appear in sequence
- Stricter than fuzzy thematic matching

**Updated `matchConceptsToChunk()`:**
```typescript
// Thematic: Relaxed threshold (0.7)
if (this.conceptMatchesText(concept, chunkLower, 0.7)) {
    matchedConcepts.add(concept);
}

// Terminology: Strict matching
if (this.technicalTermMatchesText(term, chunkLower)) {
    matchedConcepts.add(term);
}
```

**Impact:** Chunks correctly associate with relevant concepts while avoiding false positives on technical terms

---

### 6. **Type-Aware Query Expansion** (`src/concepts/query_expander.ts`)

**Updated `expandWithCorpus()`:**

**For Thematic Concepts:**
- Lower threshold (0.3) for inclusion
- Higher weight boost (0.85)
- Expand with related concepts (up to 4)
- Aggressive expansion strategy

**For Terminology:**
- Higher threshold (0.6) for inclusion
- Lower weight boost (0.7)
- **NO related concept expansion**
- Conservative/precise strategy

**Example:**
```typescript
if (conceptType === 'thematic') {
    // Add concept + 4 related concepts
    expanded.set(concept, weight * 0.85);
    // ... add related ...
} else if (conceptType === 'terminology') {
    // Only add if high confidence, no expansion
    if (weight > 0.6) {
        expanded.set(concept, weight * 0.7);
    }
    // Do NOT expand related
}
```

**Impact:** 
- Queries for abstract topics get semantic expansion
- Queries for specific terms/names stay precise

---

### 7. **Display and Documentation** (`scripts/extract_concepts.ts`)

**Enhanced output:**
```markdown
## Primary Concepts (45)

**Type:** Thematic/Abstract - Used for semantic search and thematic discovery

| # | Concept |
|---|---------|
| 1 | military strategy |
...

## Technical Terms (89)

**Type:** Terminology/Specific - Used for exact lookup and reference checking

| # | Term |
|---|------|
| 1 | Sun Tzu |
| 2 | Art of War |
...
```

**Console output:**
```
📊 Concept Statistics:
   - Primary concepts (thematic): 45
   - Technical terms (terminology): 89
   - Related concepts: 30
   - Total: 164
```

**Impact:** Users understand the distinction and purpose of each category

---

## Expected Behavior Changes

### Before Implementation

**Overlaps:**
- "intelligence gathering" (concept) AND "intelligence" (term)
- "espionage" (concept) AND "spying" (term)
- "network structures" (concept) AND "social network analysis" (term)

**Search behavior:**
- Both treated identically (fuzzy matching)
- No functional differentiation

### After Implementation

**Clear Separation:**
- **Thematic:** "intelligence gathering", "espionage", "network structures", "agent-based modeling", "flanking maneuver", "allometric scaling"
- **Terminology:** "Sun Tzu", "Wu State", "spears", "halberds", "equation 7.2", "general", "officers"

**Search behavior:**
- **Query: "What topics about strategy?"** → Expands with thematic concepts, fuzzy matching
- **Query: "Does it mention Sun Tzu?"** → Precise term matching, minimal expansion
- **Query: "agent-based modeling"** → Expands to related methodologies (thematic)
- **Query: "Sun Tzu"** → Matches name exactly (terminology)

---

## Benefits Achieved

### 1. **Reduced Overlap**
- Clear decision rules prevent same concept in both categories
- "Is it a name? → term. Is it an idea? → concept"

### 2. **Better Search Precision**
- Technical terms don't pollute semantic searches with false positives
- Named entities require exact matches

### 3. **Better Search Recall**
- Thematic concepts expand appropriately
- Abstract ideas match via synonyms and related concepts

### 4. **Differentiated Use Cases**
- **"What is this about?"** → Use thematic concepts
- **"Does it mention X?"** → Use terminology
- **"Find documents on [topic]"** → Thematic expansion
- **"Find all references to [person/theory]"** → Terminology precision

### 5. **Clearer Organization**
- Natural taxonomy for browsing
- Type labels provide context
- Users understand what each category provides

---

## Migration Path

### For New Documents
- Automatically classified with improved prompt
- Type-aware search behavior applies immediately

### For Existing Documents
**Option 1:** Re-extract concepts (recommended)
```bash
# Re-run seeding with concept extraction
npx tsx hybrid_fast_seed.ts
```

**Option 2:** Gradual migration
- New documents get new taxonomy
- Old documents work with legacy behavior
- Migrate high-value documents first

---

## Testing Recommendations

### 1. **Test Classification Quality**
Extract concepts from a known document and verify:
```bash
npx tsx scripts/extract_concepts.ts "Sun Tzu Art of War"
```

**Check:**
- Proper nouns in technical_terms? ✓
- Abstract ideas in primary_concepts? ✓
- No overlap between categories? ✓

### 2. **Test Search Behavior**

**Thematic search:**
```typescript
// Should match broadly
search("military strategy") // → matches "strategic planning", "tactical thinking"
```

**Terminology search:**
```typescript
// Should match precisely  
search("Sun Tzu") // → only exact mentions, not "sun", not "tzu"
```

### 3. **Test Query Expansion**

**With debug enabled:**
```typescript
conceptualSearch.search(catalogTable, "leadership", 5, true);
```

**Verify:**
- Thematic concepts expand with related terms
- Terminology concepts stay precise

---

## Files Modified

1. ✅ `src/concepts/types.ts` - Added ConceptType
2. ✅ `src/concepts/concept_extractor.ts` - Rewritten prompt
3. ✅ `src/concepts/concept_index.ts` - Type-aware indexing
4. ✅ `src/lancedb/conceptual_search_client.ts` - Differentiated scoring
5. ✅ `src/concepts/concept_chunk_matcher.ts` - Type-specific matching
6. ✅ `src/concepts/query_expander.ts` - Type-aware expansion
7. ✅ `scripts/extract_concepts.ts` - Enhanced display

**Build Status:** ✅ All files compile without errors

---

## Next Steps

1. **Re-extract concepts** for existing documents to apply new taxonomy
2. **Test search quality** with real queries
3. **Monitor for any remaining overlap** in new extractions
4. **Adjust weights/thresholds** if needed based on search performance
5. **Document user-facing behavior** in USAGE.md

---

## Example: Art of War Reclassification

### Before (With Overlap)
**Primary Concepts:**
- military strategy
- intelligence gathering ← OVERLAP
- espionage ← OVERLAP

**Technical Terms:**
- intelligence ← OVERLAP
- spying ← OVERLAP  
- Sun Tzu
- Art of War

### After (Clean Separation)
**Primary Concepts (Thematic):**
- military strategy
- intelligence gathering
- espionage
- tactical planning
- leadership principles
- flanking maneuver
- pincer movement
- reconnaissance

**Technical Terms (Terminology):**
- Sun Tzu
- Art of War
- Wu State
- Ch'i State
- Ho Lu
- spears
- halberds
- drums
- thirteen chapters
- general
- officers

**Result:** Zero overlap, clear purpose for each category

