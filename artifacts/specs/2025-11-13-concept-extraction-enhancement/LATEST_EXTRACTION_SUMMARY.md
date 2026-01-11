# Latest Concept Extraction Summary

**Date:** October 16, 2025  
**Extraction Method:** Updated concept extraction logic with improved script

---

## ✅ All Three Books Successfully Extracted

### 1. The Art of War by Sun Tzu
- **File:** `art_of_war_concepts.md`
- **Total Concepts:** 398
- **Primary Concepts:** 369
- **Related Concepts:** 29
- **Categories:** 5
- **Rank in Search:** #2 (correctly found by title match)

**Key Improvements:**
- Slightly refined from previous 397 concepts
- Cleaner categorization with 5 categories instead of 7
- Related concepts reduced from 30 to 29 (more focused)

### 2. Notes on the Synthesis of Form by Christopher Alexander
- **File:** `notes_on_synthesis_of_form_concepts.md`
- **Total Concepts:** 110
- **Primary Concepts:** 86
- **Related Concepts:** 24
- **Categories:** 5
- **Rank in Search:** #1 (top-ranked match)

**Key Improvements:**
- More focused extraction (down from 122 concepts)
- Removed redundant concepts
- Cleaner primary concept list (86 vs 95)
- Better related concept selection (24 vs 27)

### 3. Complexity Perspectives in Innovation and Social Change
- **File:** `complexity_perspectives_concepts.md`
- **Total Concepts:** 2,169
- **Primary Concepts:** 2,119
- **Related Concepts:** 50
- **Categories:** 7
- **Rank in Search:** #8 (found by smart title matching)

**Key Improvements:**
- Massively expanded from previous 1,993 to 2,169 concepts
- 176 additional primary concepts identified
- Most comprehensive extraction of the three books
- Rich coverage of complexity science, urban dynamics, innovation theory

---

## Comparison: Previous vs Latest Extraction

| Book | Previous Total | Latest Total | Change |
|------|---------------|--------------|---------|
| The Art of War | 397 | 398 | +1 |
| Notes on Synthesis | 122 | 110 | -12 (refined) |
| Complexity Perspectives | 1,993 | 2,169 | +176 |

---

## Key Features of Updated Extraction

### 1. Smart Title Matching
✅ Correctly finds documents even when they rank lower in vector search  
✅ Matches >50% of query words in filename  
✅ Falls back to similarity ranking if no title match

### 2. Improved Concept Quality
- More granular primary concepts
- Better filtering of metadata noise
- Cleaner categorization
- More relevant related concepts

### 3. Comprehensive Coverage
- The Art of War: Detailed tactical and strategic concepts
- Notes on Synthesis: Deep design theory and mathematical methods
- Complexity Perspectives: Extensive coverage of complexity science

---

## Sample Concepts by Book

### The Art of War
Primary concepts include:
- art of war, military leadership, discipline in armies
- deception in warfare, strategic testing, terrain analysis
- five classes of spies, converted spies, intelligence gathering
- simulated disorder, feigning weakness, baiting the enemy

### Notes on the Synthesis of Form
Primary concepts include:
- synthesis of form, design process, diagrams, patterns
- goodness of fit, form and context, misfit analysis
- unselfconscious process, selfconscious process
- set theory, graph theory, decomposition, hierarchical composition

### Complexity Perspectives
Primary concepts include:
- complexity perspectives, innovation, social change
- scaling laws, superlinear scaling, sublinear scaling
- urban dynamics, network-based urban systems
- methodological problems in social sciences
- multilevel analysis, complex systems paradigm

---

## Files Created

1. ✅ `art_of_war_concepts.md` - 398 concepts
2. ✅ `notes_on_synthesis_of_form_concepts.md` - 110 concepts  
3. ✅ `complexity_perspectives_concepts.md` - 2,169 concepts

**Total concepts across all books:** 2,677 unique concepts

---

## Technical Details

### Updated Script Features
- Vector search for semantic matching (top 10 results)
- Title matching for exact document identification
- 50% word match threshold for title recognition
- User feedback showing match rank and method
- Clean filename generation for output files

### Database Schema
```
catalog.concepts = {
  primary_concepts: string[],     // Main concepts
  related_concepts: string[],     // Related topics
  categories: string[]            // Domain categories
}
```

### Extraction Process
1. User provides search query
2. Script performs vector search (top 10)
3. Checks for title matches in results
4. Selects best match (title match > similarity)
5. Extracts structured concepts
6. Generates markdown or JSON output

---

## Usage Examples

```bash
# Extract with exact title
npx tsx scripts/extract_concepts.ts "The Art of War"

# Extract with author name
npx tsx scripts/extract_concepts.ts "Christopher Alexander"

# Extract with partial title
npx tsx scripts/extract_concepts.ts "complexity perspectives"

# Extract to JSON format
npx tsx scripts/extract_concepts.ts "Sun Tzu" json
```

---

## Next Steps

To extract concepts from additional books:

1. Ensure books are indexed with `hybrid_fast_seed.ts`
2. Run extract_concepts script with book title or author
3. Check output markdown file for results
4. Use JSON format for programmatic access if needed

---

## Notes

- The smart title matching fix ensures accurate document selection
- Updated concept extraction logic provides more granular concepts
- Complexity Perspectives book shows the richest concept extraction
- All extractions maintain consistent schema and format


