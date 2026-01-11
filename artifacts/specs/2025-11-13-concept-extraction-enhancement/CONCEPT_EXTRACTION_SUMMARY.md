# Concept Extraction Summary

## Successfully Extracted (2/3 books)

### ✅ **The Art of War** by Sun Tzu
- **Total Concepts:** 397
- **Primary Concepts:** 367 (much more detailed with updated logic!)
- **Related Concepts:** 30
- **Categories:** 7
- **File:** `art_of_war_concepts.md`

**Highlights:**
- Extremely detailed extraction covering all strategic principles
- Includes specific tactics, terrain types, spy classifications
- Covers fire warfare, water tactics, and psychological warfare
- Very granular concepts like "shuai-jan snake analogy" and "coquettishness of maiden"

### ✅ **Notes on the Synthesis of Form** by Christopher Alexander
- **Total Concepts:** 122
- **Primary Concepts:** 95
- **Related Concepts:** 27
- **Categories:** 5
- **File:** `notes_on_synthesis_of_form_concepts.md`

**Highlights:**
- Deep architectural and design theory concepts
- Mathematical methods (set theory, graph theory, information theory)
- Design process concepts (misfits, diagrams, patterns)
- Systems thinking and cognitive science connections

## ❌ Not Found: Complexity Perspectives

The "Complexity Perspectives in Innovation and Social Change" book was not found in the current database with the new schema. This could mean:

1. The book hasn't been re-indexed with the new concept extraction logic
2. The book might need to be re-processed with `hybrid_fast_seed.ts`
3. The search terms aren't matching the document in the database

### To Re-index This Book:

```bash
# 1. Find the PDF location
ls -la ~/Documents/ebooks/Philosophy/ | grep -i complexity

# 2. Re-index with new logic
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdf/directory --overwrite

# 3. Then extract concepts
npx tsx scripts/extract_concepts.ts "Complexity Perspectives"
```

## Comparison: New vs. Old Extraction Logic

### The Art of War
- **Old:** 209 concepts (83 primary, 92 technical, 34 related)
- **New:** 397 concepts (367 primary, 30 related)
- **Change:** Much more granular, merged technical terms into primary concepts

### Notes on Synthesis of Form
- **Old:** 198 concepts (82 primary, 81 technical, 35 related)
- **New:** 122 concepts (95 primary, 27 related)
- **Change:** More focused, higher quality concept identification

## Key Improvements in New Logic

1. **More Granular Primary Concepts**
   - The Art of War went from 83 to 367 primary concepts
   - Captures specific tactics, analogies, and strategic principles

2. **Eliminated Technical Terms Category**
   - Technical terms are now integrated into primary concepts if meaningful
   - Reduces noise from metadata and publication details

3. **Better Related Concepts**
   - More relevant cross-disciplinary connections
   - Modern applications and theoretical frameworks

4. **Cleaner Categories**
   - More focused domain classifications
   - Art of War: 7 categories (military strategy, leadership, psychology, etc.)
   - Synthesis of Form: 5 categories (design theory, architecture, systems thinking, etc.)

## Files Created

1. `art_of_war_concepts.md` - Complete extraction with 367 primary concepts
2. `notes_on_synthesis_of_form_concepts.md` - 95 design theory concepts
3. `scripts/EXTRACT_CONCEPTS_UPDATE.md` - Documentation for the script update
4. This summary file

## Next Steps

To complete the extraction for all three books:

```bash
# Re-index Complexity Perspectives if needed
npx tsx hybrid_fast_seed.ts --filesdir /path/to/complexity-perspectives-pdf --overwrite

# Extract concepts
npx tsx scripts/extract_concepts.ts "Complexity Perspectives Innovation Social Change"
```


