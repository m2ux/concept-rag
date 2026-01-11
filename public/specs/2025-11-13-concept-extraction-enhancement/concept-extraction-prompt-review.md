# Concept Extraction Prompt Review & Recommendations

**Date**: November 13, 2025  
**Context**: Analysis following TRIZ concept search failure

## Current State Analysis

### Formal Definition (Used in Both Prompts)

```
A concept is a uniquely identified, abstract idea packaged with its names, 
definition, distinguishing features, relations, and detection cues, enabling 
semantic matching and disambiguated retrieval across texts.
```

### Two Prompts in Use

**Prompt 1**: `extractConceptsFromChunk()` - For large documents split into chunks  
**Prompt 2**: `extractConceptsSinglePass()` - For regular-sized documents

## Gap Analysis: Definition vs. Instructions

### ✅ What Works Well

1. **Clear Structure**: JSON schema with 3 fields is simple and consistent
2. **Concrete Examples**: Both INCLUDE and EXCLUDE have helpful examples
3. **Lowercase Normalization**: Good for deduplication and matching
4. **Quantity Guidance**: Specific ranges (80-150 primary, 3-7 categories) set expectations

### ❌ Problems Identified

#### 1. **Definition-Instruction Mismatch**

**Definition says:**
- "abstract idea packaged with its names, definition, distinguishing features, relations"

**Instructions emphasize:**
- "reusable concepts, theories, and domain knowledge"
- "Extract ONLY reusable concepts" (Prompt 2)

**Problem**: "Abstract" and "reusable" can be contradictory. The TRIZ case showed:
- "innovation" = abstract but highly reusable → Was excluded as "generic"
- "su-field analysis" = specific and reusable → Was included

**Impact**: High-level thematic concepts get filtered out in favor of technical details.

---

#### 2. **"Reusable" is Ambiguous**

What does "reusable" mean for concept extraction?

**Possible interpretations:**
- ✅ "Can appear in multiple documents" (good)
- ❌ "Is a concrete method/tool" (too narrow)
- ❌ "Has operational definition" (excludes themes)

The LLM appears to interpret it as "concrete and specific" rather than "generalizable."

**Evidence**: Book titled "The Innovation Algorithm" didn't extract "innovation" as reusable.

---

#### 3. **EXCLUDE Rules Too Broad**

Current exclusions:

```
❌ Temporal/situational descriptions (e.g., "periods of heavy recruitment")
❌ Overly specific action phrases (e.g., "balancing broad cohesion with innovation")
❌ Suppositions or observations (e.g., "attraction for potential collaborators")
```

**Problem**: The phrase "balancing broad cohesion with **innovation**" as an exclude example may signal to the LLM that "innovation" itself should be avoided.

**Better approach**: Show that we want "innovation" but not the specific action phrase.

---

#### 4. **Missing Explicit Hierarchy Guidance**

The definition mentions "relations" but the prompt doesn't guide the LLM on:
- Concept hierarchies (general → specific)
- When to extract both levels vs. one
- How to handle nested concepts

**Example from TRIZ:**
- "TRIZ" (general methodology) ← Should extract
- "40 inventive principles" (sub-methodology) ← Should extract
- "Principle 1: Segmentation" (specific principle) ← Should extract?

Current behavior is inconsistent.

---

#### 5. **Inconsistent Specificity**

**INCLUDE says extract:**
- "Domain-specific technical terms" (very specific)
- "Important single-word thematic concepts" (very general)

**These have different search behaviors:**
- Technical terms: Narrow, precise retrieval
- Thematic concepts: Broad, exploratory retrieval

**Problem**: No distinction in extraction means no distinction in search weighting.

---

#### 6. **Category Guidance is Weak**

```
"categories": ["3-7 domains"]
```

**Problems:**
- What's a "domain"? (Software? Programming? Python?)
- How broad/narrow should categories be?
- Should they follow a taxonomy?

**Impact**: Inconsistent categorization reduces category-based search effectiveness.

---

## Proposed Improvements

### Option A: Minimal Changes (Quick Fix)

**Goal**: Fix immediate issues without restructuring

**Changes:**

1. **Clarify "reusable"**:
```diff
- Extract ONLY reusable concepts, theories, and domain knowledge
+ Extract concepts that could appear across multiple texts in this domain
+ Focus on generalizable knowledge, not document-specific instances
```

2. **Better EXCLUDE examples**:
```diff
- ❌ Overly specific action phrases (e.g., "balancing broad cohesion with innovation")
+ ❌ Document-specific action descriptions (e.g., "balancing three competing priorities")
+ Note: Extract the concepts involved ("innovation", "priorities") separately
```

3. **Add concept hierarchy guidance**:
```
Extract concepts at multiple levels:
- Overarching themes (e.g., "innovation", "sustainability")
- Methodologies and frameworks (e.g., "TRIZ", "design thinking")  
- Specific techniques and tools (e.g., "ideality index", "contradiction matrix")
```

4. **Strengthen category guidance**:
```diff
- categories: Array of 3-7 strings (broad domain names)
+ categories: Array of 3-7 strings (academic/professional domains like 
+   "innovation methodology", "systems engineering", "cognitive psychology")
```

---

### Option B: Comprehensive Redesign (Better Long-term)

**Goal**: Align instructions with definition and improve search quality

**New Structure:**

```typescript
interface ConceptMetadata {
    thematic_concepts: string[];      // 10-20 abstract themes
    methodological_concepts: string[]; // 20-40 methods/frameworks
    technical_concepts: string[];      // 40-80 domain-specific terms
    categories: string[];              // 3-7 domains
    related_concepts: string[];        // 20-40 related topics
}
```

**Benefits:**
- Explicit separation by abstraction level
- Different search strategies per type
- Better quality control per category

**Prompt Structure:**

```
FORMAL DEFINITION:
A concept is a uniquely identified, abstract or concrete idea with a clear
definition, distinguishing features, and semantic relations. Concepts enable
retrieval by meaning across diverse texts.

Extract concepts from this document at THREE levels of abstraction:

1. THEMATIC CONCEPTS (10-20 items)
   - High-level themes and principles
   - Examples: "innovation", "sustainability", "emergence", "complexity"
   - These answer: "What is this document fundamentally ABOUT?"

2. METHODOLOGICAL CONCEPTS (20-40 items)  
   - Frameworks, theories, processes, methodologies
   - Examples: "TRIZ", "agent-based modeling", "design thinking"
   - These answer: "What approaches or methods are discussed?"

3. TECHNICAL CONCEPTS (40-80 items)
   - Domain-specific terminology, techniques, metrics
   - Examples: "ideality index", "su-field analysis", "inventive principles"
   - These answer: "What specific tools or terms are defined?"

UNIVERSAL EXCLUSIONS (apply to all levels):
❌ Specific instances or examples (e.g., "the 1995 study")
❌ Temporal descriptions (e.g., "during the crisis period")
❌ Named entities (people, places, organizations)
❌ Metadata (page numbers, dates, citations)
```

**Advantages:**
- Clear alignment with "abstract idea" definition
- Hierarchical structure matches how knowledge is organized
- Enables weighted search (theme boost for exploration, technical precision for specific queries)
- Easier to QA: "Does book about innovation extract 'innovation' as thematic?"

**Disadvantages:**
- Breaking change (requires migration)
- More complex JSON parsing
- Slightly higher token usage

---

### Option C: Hybrid Approach (Recommended)

**Goal**: Improve current structure without breaking changes, prepare for future enhancement

**Immediate Changes (Apply to Both Prompts):**

```typescript
const prompt = `FORMAL DEFINITION:
A concept is an abstract or concrete idea that can be identified, defined, and 
reused across texts. Concepts enable semantic search by capturing the MEANING 
of content at multiple levels of abstraction.

Extract concepts from this document as JSON:

${content}

Return JSON:
{
  "primary_concepts": ["80-150 concepts at ALL levels: themes, methods, terms"],
  "categories": ["3-7 academic/professional domain names"],
  "related_concepts": ["20-40 related concepts from adjacent domains"]
}

EXTRACTION STRATEGY:
Think hierarchically - extract concepts at THREE levels:

🔺 LEVEL 1 - Thematic (10-20): Core themes and principles
   Examples: "innovation", "sustainability", "emergence", "complexity", "creativity"
   Test: "Could this be a book title or course name?"

🔹 LEVEL 2 - Methodological (30-50): Theories, frameworks, processes  
   Examples: "TRIZ", "design thinking", "agent-based modeling", "systems theory"
   Test: "Could someone specialize in this or write a paper about it?"

🔸 LEVEL 3 - Technical (40-80): Domain-specific terminology and techniques
   Examples: "ideality index", "contradiction matrix", "exaptive bootstrapping"
   Test: "Would this appear in a domain glossary or index?"

IMPORTANT RULES:

✅ DO EXTRACT:
- All three levels above
- Both single-word and multi-word concepts
- Concepts that unify multiple discussions
- Book/chapter titles if they're conceptual (e.g., "innovation algorithm")

❌ DO NOT EXTRACT:
- Specific instances (e.g., "the 2015 study", "Company X's approach")  
- Temporal phrases (e.g., "during the crisis", "in recent years")
- Pure actions without conceptual content (e.g., "balancing three priorities")
  → But DO extract the concepts involved (e.g., "balance", "priority management")
- Names of people, organizations, locations
- Dates, page numbers, figure references

CATEGORIES:
Use standard academic/professional domain names:
- Good: "innovation methodology", "systems engineering", "cognitive psychology"
- Bad: "innovation", "systems", "psychology" (too broad)
- Bad: "TRIZ su-field analysis" (too specific)

Use lowercase throughout. Output only valid JSON.`;
```

**Key Improvements:**
1. ✅ **Explicit hierarchy** with 3 levels and test questions
2. ✅ **"All levels"** directive in primary_concepts description
3. ✅ **Concrete tests** for each level (title test, specialization test, glossary test)
4. ✅ **Better examples** showing theme → method → technical progression
5. ✅ **Action phrase clarity**: Extract concepts FROM phrases, not the phrases themselves
6. ✅ **Updated definition** emphasizing "multiple levels of abstraction"

**Migration Path:**
- Existing `primary_concepts` array still works (no breaking change)
- Better extraction quality immediately
- Can later split into `thematic_concepts`, `methodological_concepts`, `technical_concepts` if desired

---

## Quality Assurance Tests

After implementing changes, test with these scenarios:

### Test 1: Book Title Extraction
**Input**: Book titled "The Innovation Algorithm"  
**Expected**: `primary_concepts` contains "innovation" AND "algorithm"  
**Current**: FAILS (missing "innovation")

### Test 2: Hierarchy Coverage
**Input**: TRIZ textbook  
**Expected**: 
- Thematic: "innovation", "creativity", "invention"
- Methodological: "TRIZ", "inventive problem solving", "systematic innovation"
- Technical: "su-field analysis", "40 principles", "ideality index"  
**Current**: PARTIAL (missing thematic layer)

### Test 3: Over-Extraction Check
**Input**: "During the 1990s crisis, organizations balanced innovation with cost control"  
**Expected**: Extract "innovation", "cost control"; exclude "1990s crisis", "during", entire phrase  
**Current**: UNKNOWN (needs testing)

### Test 4: Category Consistency  
**Input**: 10 TRIZ-related documents  
**Expected**: Majority categorized as "innovation methodology" or similar  
**Current**: INCONSISTENT (needs testing)

---

## Implementation Recommendations

### Phase 1: Immediate (This Week)
1. ✅ Remove "generic single words" constraint (DONE)
2. 🔄 Apply Option C (Hybrid Approach) prompt improvements
3. 🔄 Test with 2-3 TRIZ documents
4. 🔄 Verify "innovation" extraction works

### Phase 2: Repair (Next Week)
1. Run `repair_missing_concepts.ts` on TRIZ books
2. Spot-check 5-10 other books for thematic concept coverage
3. Document any remaining issues

### Phase 3: Enhancement (Future)
1. Consider Option B (three-tier structure) for v2.0
2. Add concept type classification (thematic/methodological/technical)
3. Implement tiered search weighting based on concept type

---

## Open Questions

1. **Should we extract ALL levels or prioritize some?**
   - Current: Extracting 80-150 total concepts
   - With explicit tiers: Still 80-150 total, or more?

2. **How to handle multi-level concepts?**
   - Example: "innovation" (theme) vs "innovation methodology" (method)
   - Extract both? Just the more specific?

3. **Category taxonomy?**
   - Free-form vs. controlled vocabulary?
   - Should categories themselves be concepts?

4. **Relation extraction?**
   - Definition mentions "relations" but we don't extract them
   - Future enhancement?

---

## Related Documents

- `concept-search-triz-analysis.md` - Original problem investigation
- `src/concepts/types.ts` - ConceptMetadata interface definition
- `src/concepts/concept_extractor.ts` - Implementation

---

## Summary

**Core Issue**: Prompt emphasized "reusable domain knowledge" over "abstract ideas," causing thematic concepts to be filtered out.

**Root Cause**: Tension between specificity (for precise retrieval) and abstraction (for thematic search).

**Solution**: Explicitly extract at multiple levels with clear test questions for each level.

**Expected Impact**: 
- Better coverage of high-level themes (solve TRIZ issue)
- Maintain technical term precision
- Enable hierarchical search strategies

