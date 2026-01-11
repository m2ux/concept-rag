# Metadata Exclusion Guide

## Problem Statement

Concept extraction was including too much document metadata noise (page numbers, ISBNs, copyright info) which:
1. Pollutes search results with irrelevant "concepts"
2. Increases storage without value
3. Makes genuine content harder to find

## Solution

The extraction system now **explicitly excludes** all document metadata and includes a new **acronyms category**.

---

## Three Categories (Updated)

### 1. Primary Concepts (Thematic)
**Purpose:** Ideas, methods, strategies, processes

**Examples:**
- ✅ "military strategy"
- ✅ "agent-based modeling"
- ✅ "flanking maneuver"
- ✅ "regression analysis"

---

### 2. Technical Terms (Terminology)
**Purpose:** Named entities and artifacts

**Examples:**
- ✅ "Sun Tzu" (person)
- ✅ "Santa Fe Institute" (organization)
- ✅ "Art of War" (work title)
- ✅ "spears" (artifact)
- ✅ "general" (role/title)

**What's NOW EXCLUDED:**
- ❌ "page 35", "pp. 188-192", "pages 215-230"
- ❌ "chapter 1", "part I", "introduction"
- ❌ "volume 7", "14th ed.", "2nd edition"

---

### 3. Acronyms (NEW!)
**Purpose:** Abbreviations and acronyms

**Examples:**
- ✅ "MIT"
- ✅ "NATO"
- ✅ "DNA"
- ✅ "GIS" (Geographic Information Systems)
- ✅ "ABM" (Agent-Based Modeling)
- ✅ "GDP"

**Search behavior:** Exact matching, no expansion (like technical terms)

---

## Complete Exclusion List

### ❌ Page References (ALWAYS EXCLUDE)
- "page 35"
- "p. 112"
- "pp. 188-192"
- "pages 215-230"
- "pages 11-82"

### ❌ ISBNs and Identifiers (ALWAYS EXCLUDE)
- "ISBN 978-1-4020-9662-4"
- "e-ISBN 978-1-4020-9663-1"
- "DOI 10.1007/978-1-4020-9663-1"
- "Library of Congress Control Number 2008942069"

### ❌ Stand-alone Dates/Years (EXCLUDE)
- "1960"
- "january 1960"
- "2001"

**Exception:** Data labels like "Italy 2001 census" MAY be kept if meaningful

### ❌ Edition/Volume Numbers (EXCLUDE)
- "14th ed."
- "volume 7"
- "2nd edition"
- "revised edition"

### ❌ Mathematical Formula Strings (EXCLUDE)
- "y = 1.8386x - 17.206"
- "r² = 0.8651"
- "y = 1.3749x - 10.297"

**Instead extract:** The concept being represented (e.g., "regression equation", "correlation coefficient")

### ❌ Copyright/Publishing Metadata (EXCLUDE)
- "printed on acid-free paper"
- "all rights reserved"
- "copyright notice"
- "springer science+business media"
- "retrieval system"
- "photocopying"
- "mechanical reproduction"

### ❌ Generic Document Structure (EXCLUDE)
- "chapter 1", "chapter 2"
- "part I", "part II"
- "introduction", "conclusion"
- "table of contents"
- "index pages"
- "editorial advisory board"

### ❌ Stand-alone Generic Places (EXCLUDE)
- "Paris" (alone, without context)
- "London" (alone)
- "New York" (alone)

**Exception:** Places IN CONTEXT are OK:
- ✅ "University of Paris"
- ✅ "London School of Economics"
- ✅ "Wu State" (historical entity)

---

## Decision Flow (Updated)

```
1. Is it document metadata (page#, ISBN, copyright)?
   └─ YES → EXCLUDE (don't extract)

2. Is it an acronym/abbreviation?
   └─ YES → acronyms category

3. Is it a proper noun NAME (person, org, work)?
   └─ YES → technical_terms

4. Is it an IDEA/METHOD/CONCEPT?
   └─ YES → primary_concepts

5. Is it an ARTIFACT/OBJECT/ROLE?
   └─ YES → technical_terms
```

---

## Examples from Real Documents

### ❌ BAD: What was previously extracted

From "Complexity Perspectives" document:
- pages 153-190 ← **EXCLUDE**
- pages 197-259 ← **EXCLUDE**
- ISBN 978-1-4020-9662-4 ← **EXCLUDE**
- DOI 10.1007/... ← **EXCLUDE**
- chapter 1 ← **EXCLUDE**
- volume 7 ← **EXCLUDE**
- y = 1.8386x - 17.206 ← **EXCLUDE**
- acid-free paper ← **EXCLUDE**

### ✅ GOOD: What should be extracted

**Primary Concepts:**
- complexity theory
- agent-based modeling
- regression analysis
- allometric scaling
- urban scaling

**Technical Terms:**
- David Lane (person)
- Santa Fe Institute (organization)
- Methodos Series (publication)
- Geoffrey West (person)

**Acronyms:**
- CNRS
- UCLA
- MIT

---

## Validation Checklist

After extraction, verify NO instances of:

- [ ] Page numbers (pp., pages, p.)
- [ ] ISBNs or DOIs
- [ ] Chapter/volume numbers
- [ ] Mathematical formula strings
- [ ] Copyright metadata
- [ ] Stand-alone years/dates
- [ ] Generic place names without context

If any of these appear, the extraction needs refinement.

---

## Implementation Notes

### In Prompt
```
WHAT TO EXCLUDE ENTIRELY:
❌ Page numbers: "page 35", "pp. 188-192"
❌ ISBN/DOI/Library numbers
❌ Stand-alone dates/years
❌ Edition/volume numbers
❌ Mathematical formula strings
❌ Copyright/publishing metadata
❌ Generic chapter/section references
❌ Stand-alone generic place names
```

### In Code
```typescript
// Validate no metadata leaked through
if (!concepts.acronyms) {
    concepts.acronyms = []; // Backwards compatibility
}
```

---

## Benefits

### Before (With Metadata Noise)
- 354 "concepts" extracted
- ~30% were metadata (page numbers, ISBNs, etc.)
- Search polluted with irrelevant results
- Genuine content buried in noise

### After (Metadata Excluded)
- ~200 meaningful concepts extracted
- 0% metadata noise
- Clean, focused search results
- Acronyms properly separated

---

## Summary

**Three simple rules:**
1. **Content, not structure** - Extract ideas, not page numbers
2. **Names, not metadata** - Extract "Sun Tzu", not "ISBN 123"
3. **Separate acronyms** - "MIT" gets its own category

This ensures the concept index contains **only meaningful, searchable content**.

