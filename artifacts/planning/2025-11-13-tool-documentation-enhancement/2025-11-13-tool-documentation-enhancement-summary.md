# Tool Documentation Enhancement Summary

**Date:** November 13, 2025  
**Task:** Enhance embedded tool documentation to enable optimal AI agent tool selection  
**Status:** ✅ Complete

---

## Overview

Enhanced the embedded documentation in all MCP tool classes to provide clear, actionable guidance for AI agents selecting the appropriate search tool based on query intent and requirements.

## Problem Statement

Initial investigation revealed significant inconsistencies between search methods:
- `concept_search` for "innovation": 10/10 results relevant (100% precision)
- `broad_chunks_search` for "innovation": 0/10 results relevant (0% precision)
- **Zero overlap** between the two methods

This demonstrated the critical need for clear tool selection guidance embedded directly in the tool descriptions that AI agents would see via MCP protocol.

## Changes Made

### 1. Enhanced Tool Class Documentation

Updated embedded `description` fields in all five tool classes:

#### Files Modified:
1. **`src/tools/operations/concept_search.ts`**
   - Added "USE THIS TOOL WHEN" section
   - Added "DO NOT USE for" section
   - Clarified it searches concept-enriched index with semantic tagging
   - Specified query format expectations (single concept terms)

2. **`src/tools/operations/conceptual_broad_chunks_search.ts`**
   - Clarified hybrid search methodology (vector + BM25 + concept + WordNet)
   - Specified use cases: phrases, keywords, natural language questions
   - Warned about potential false positives from keyword matching

3. **`src/tools/operations/conceptual_catalog_search.ts`**
   - Emphasized document-level discovery focus
   - Highlighted title matching bonus (10x weight)
   - Specified use for document overviews, not content search

4. **`src/tools/operations/conceptual_chunks_search.ts`**
   - Clarified requirement for exact source path
   - Added note about two-step workflow (catalog → chunks)
   - Specified when NOT to use (unknown document)

5. **`src/tools/operations/document_concepts_extract.ts`**
   - Emphasized this is for concept export, NOT search
   - Clarified use cases: concept maps, quality review, documentation
   - Added explicit trigger phrases ("extract", "list", "show concepts")

### 2. Created Comprehensive Tool Selection Guide

**File:** `tool-selection-guide.md` (5,800+ words)

#### Contents:
- **Quick Decision Tree**: Visual flowchart for tool selection
- **Tool Comparison Matrix**: Side-by-side feature comparison
- **Detailed Selection Criteria**: When/when not to use each tool
- **Decision Logic Examples**: 5 real-world query examples with analysis
- **Common Patterns & Anti-Patterns**: Best practices and mistakes to avoid
- **Scoring System Comparison**: How each tool ranks results differently
- **Performance Characteristics**: Speed, precision, recall metrics
- **Technical Architecture**: Index differences explained
- **"3 Questions" Method**: Simple decision framework
- **Test Cases**: 10 example queries with correct tool mappings

### 3. Updated User-Facing Documentation

#### README.md Updates:
- Added quick reference table with tool comparison
- Streamlined tool descriptions with clear "Use when" statements
- Added prominent link to tool-selection-guide.md
- Added "For AI Agents" section highlighting embedded documentation

#### USAGE.md Updates:
- Added "Quick Tool Selection" section at top
- Enhanced tool selection table with query type column
- Added importance note about concept_search precision
- Added multiple references to comprehensive guide

### 4. Project Build

- Compiled all TypeScript changes successfully
- No linting errors introduced
- All tool descriptions now available via MCP protocol

---

## Key Documentation Improvements

### Before: Vague Tool Descriptions
```
"Find all document chunks that reference a specific concept."
```

### After: Actionable Decision Criteria
```
USE THIS TOOL WHEN:
- Searching for a conceptual topic (e.g., "innovation", "leadership")
- You want semantically-tagged, high-precision results about a concept
- Tracking where and how a concept is discussed across your library

DO NOT USE for:
- Keyword searches or exact phrase matching (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)

RETURNS: Concept-tagged chunks with concept_density scores, 
related concepts, and semantic categories.
```

---

## Technical Details

### Tool Selection Decision Tree

```
User Query
    │
    ├─ "What documents?" → catalog_search
    ├─ "Extract concepts" → extract_concepts
    ├─ Single concept term → concept_search (100% precision)
    ├─ Know document path → chunks_search
    └─ Phrases/questions → broad_chunks_search
```

### Key Distinctions Documented

1. **Index Architecture**
   - `concept_search`: Queries concept-enriched index (semantic tagging)
   - `broad_chunks_search`: Queries hybrid index (may have concept=0.000)
   - Different data sources = different results

2. **Query Type Expectations**
   - `concept_search`: Single concept terms ("innovation", "leadership")
   - `broad_chunks_search`: Multi-word phrases, questions
   - `catalog_search`: Titles, authors, topics

3. **Precision vs. Recall Trade-offs**
   - `concept_search`: High precision (100%), moderate recall
   - `broad_chunks_search`: High recall, moderate precision
   - Tool selection depends on use case

---

## Validation

### Empirical Evidence
From investigation analysis (`2025-11-13-search-method-comparison-innovation-concept.md`):
- **concept_search** returned 10/10 relevant results for "innovation"
- **broad_chunks_search** returned 0/10 relevant results for "innovation"
- Documentation now prevents this misuse pattern

### Test Case Examples

| User Query | Correct Tool | Now Documented |
|------------|--------------|----------------|
| "innovation" | concept_search | ✅ Yes |
| "How do teams innovate?" | broad_chunks_search | ✅ Yes |
| "What documents do I have?" | catalog_search | ✅ Yes |
| "Search Sun Tzu for deception" | chunks_search | ✅ Yes |
| "Extract concepts from..." | extract_concepts | ✅ Yes |

---

## Impact

### For AI Agents
- **Clear selection criteria** embedded in tool descriptions visible via MCP
- **Reduced ambiguity** in when to use each tool
- **Actionable guidance** with specific examples and anti-patterns
- **Technical context** explaining why tools return different results

### For Users
- **Better search results** when AI agents select appropriate tools
- **Comprehensive reference** in TOOL-SELECTION-GUIDE.md
- **Quick reference tables** in README and USAGE
- **Example-driven documentation** for common patterns

### For Developers
- **Consistent documentation structure** across all tool classes
- **Maintenance guidance** for future tool additions
- **Empirical validation** of design decisions

---

## Files Created/Modified

### Created:
1. `tool-selection-guide.md` - Comprehensive decision guide (5,800+ words)
2. `.engineering/artifacts/planning/2025-11-13-search-method-comparison-innovation-concept.md` - Analysis
3. `.engineering/artifacts/planning/2025-11-13-tool-documentation-enhancement-summary.md` - This document

### Modified:
1. `src/tools/operations/concept_search.ts` - Enhanced description
2. `src/tools/operations/conceptual_broad_chunks_search.ts` - Enhanced description
3. `src/tools/operations/conceptual_catalog_search.ts` - Enhanced description
4. `src/tools/operations/conceptual_chunks_search.ts` - Enhanced description
5. `src/tools/operations/document_concepts_extract.ts` - Enhanced description
6. `README.md` - Added quick reference and guide link
7. `USAGE.md` - Added tool selection section and guide references

### Build:
- All TypeScript compiled successfully
- No linting errors
- Changes deployed to `dist/` directory

---

## Documentation Structure

```
concept-rag/
├── tool-selection-guide.md          # Comprehensive guide (primary resource)
├── README.md                         # Quick reference + link to guide
├── USAGE.md                          # Usage examples + link to guide
├── src/tools/operations/
│   ├── concept_search.ts            # USE WHEN / DO NOT USE embedded
│   ├── conceptual_broad_chunks_search.ts  # USE WHEN / DO NOT USE embedded
│   ├── conceptual_catalog_search.ts       # USE WHEN / DO NOT USE embedded
│   ├── conceptual_chunks_search.ts        # USE WHEN / DO NOT USE embedded
│   └── document_concepts_extract.ts       # USE WHEN / DO NOT USE embedded
└── .engineering/artifacts/planning/
    ├── 2025-11-13-search-improvements/
    │   └── 2025-11-13-search-method-comparison-*.md  # Empirical analysis
    └── 2025-11-13-tool-documentation-enhancement/
        └── 2025-11-13-tool-documentation-*.md        # This summary
```

---

## Future Recommendations

### For MCP Protocol Enhancement
Consider adding tool selection metadata to MCP protocol:
```json
{
  "tool": "concept_search",
  "use_cases": ["conceptual_research", "semantic_tracking"],
  "query_types": ["single_concept"],
  "precision": "high",
  "recall": "medium"
}
```

### For Tool Development
When adding new tools:
1. Follow the "USE THIS TOOL WHEN / DO NOT USE for" structure
2. Specify query type expectations clearly
3. Explain return value characteristics
4. Provide anti-pattern examples
5. Update tool-selection-guide.md comparison matrix

### For Documentation Maintenance
- Update guide when tool behavior changes
- Add new test cases as patterns emerge
- Maintain empirical validation with user queries
- Keep decision tree synchronized with tool descriptions

---

## Conclusion

Successfully enhanced all MCP tool documentation to enable optimal AI agent tool selection. The embedded "USE WHEN / DO NOT USE" sections provide clear, actionable guidance directly in the tool descriptions that agents see via the MCP protocol.

The comprehensive tool-selection-guide.md provides deeper context, decision trees, comparison matrices, and examples for both AI agents and human developers.

This documentation update is grounded in empirical analysis showing 100% vs. 0% relevance differences between tools for the same query, validating the critical need for clear selection guidance.

**Status:** Ready for use by AI agents via MCP protocol.

---

**Next Steps:**
- Monitor AI agent tool selection patterns
- Collect feedback on documentation clarity
- Iterate on examples based on real usage
- Consider MCP protocol enhancements for tool metadata

---

*This work ensures that AI agents can make informed, optimal tool selections based on clear, embedded documentation accessible via the MCP protocol.*

