# Formal Concept Definition Implementation

## Overview

This document summarizes the implementation of the formal concept definition across the Concept-RAG system to ensure consistent concept extraction by AI agents.

## Formal Definition

**A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

## Changes Made

### 1. Created AGENTS.md (Project Root)

Created `./AGENTS.md` containing:

- **Formal definition** of a concept
- **Key components** breakdown (9 essential elements)
- **Document parsing guidelines** (what to include/exclude)
- **Concept extraction process** steps
- **Integration guidelines** for system components
- **Usage instructions** for different parts of the architecture

This file serves as the authoritative reference for all AI agents working with the Concept-RAG system.

### 2. Updated Concept Extractor Prompts

Modified `./src/concepts/concept_extractor.ts`:

#### Multi-Pass Extraction (Line 102)
Added formal definition to the beginning of the chunk extraction prompt:
```
FORMAL DEFINITION:
A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.
```

#### Single-Pass Extraction (Line 197)
Added the same formal definition to the beginning of the single-pass extraction prompt for consistency.

## Benefits

### 1. **Consistency Across Agents**
All LLM agents (Claude Sonnet 4.5, etc.) now receive the same formal definition, ensuring consistent concept extraction quality.

### 2. **Clear Guidelines**
The definition explicitly states what makes something a concept (abstract, reusable, with relations, detection cues, etc.) versus what doesn't (temporal phrases, specific actions, generic words).

### 3. **Improved Extraction Quality**
By emphasizing:
- Uniquely identified abstract ideas
- Relations between concepts
- Detection cues for semantic matching
- Disambiguated retrieval

The extracted concepts should be more useful for semantic search and retrieval.

### 4. **Documentation for Future Development**
The AGENTS.md file serves as authoritative documentation for:
- Training new AI agents
- Evaluating extraction quality
- Designing search strategies
- Onboarding developers

## System Architecture Alignment

The formal definition is now integrated into:

1. **Concept Extractor** (`src/concepts/concept_extractor.ts`) - Uses definition in prompts
2. **Query Expander** (`src/concepts/query_expander.ts`) - Referenced in AGENTS.md
3. **Conceptual Search Client** (`src/lancedb/conceptual_search_client.ts`) - Referenced in AGENTS.md

## Next Steps (Optional Future Enhancements)

While the current implementation is complete, future enhancements could include:

1. **Structured Concept Schema**: Extend ConceptMetadata type to capture relations and detection cues explicitly
2. **Concept Validation**: Add validation logic to ensure extracted concepts meet the formal definition
3. **Relation Extraction**: Explicitly extract and store concept relationships (hierarchical, associative, causal)
4. **Detection Cue Database**: Build a database of detection cues for common concepts
5. **Quality Metrics**: Develop metrics to evaluate how well extractions align with the formal definition

## Verification

- ✅ AGENTS.md created with formal definition
- ✅ Chunk extraction prompt updated
- ✅ Single-pass extraction prompt updated
- ✅ TypeScript compiled successfully
- ✅ No linting errors
- ✅ Planning documentation created

## References

- **Primary File**: `./AGENTS.md`
- **Implementation**: `./src/concepts/concept_extractor.ts`
- **Related Docs**: 
  - `.ai/planning/CONCEPT_TAXONOMY_GUIDE.md`
  - `.ai/planning/CONCEPT_EXTRACTION_SUMMARY.md`
  - `README.md` (Architecture section)













