# Content Overlap Analysis

**Date:** 2025-12-14

This document analyzes the content overlap between `tool-selection-guide.md` and `api-reference.md` to inform the consolidation strategy.

---

## File Statistics

| File | Lines | Primary Purpose |
|------|-------|-----------------|
| `docs/tool-selection-guide.md` | 813 | Tool selection guidance, decision trees, examples |
| `docs/api-reference.md` | 556 | API parameter specifications |

---

## Content Comparison Matrix

| Content Type | tool-selection-guide.md | api-reference.md | Consolidation Action |
|--------------|-------------------------|------------------|---------------------|
| **Tool Overview Table** | ✅ (detailed comparison) | ✅ (brief) | Merge, keep detailed version |
| **Decision Tree** | ✅ (comprehensive) | ✅ (simplified) | Keep comprehensive version |
| **Parameter Tables** | ❌ | ✅ | Keep from api-reference |
| **Input JSON Examples** | ✅ (partial) | ✅ (partial) | Enhance with full schemas |
| **Response Schemas** | ❌ | ❌ | **ADD** - Missing from both |
| **Tool Selection Criteria** | ✅ (detailed per-tool) | ✅ (brief per-tool) | Merge, keep detailed version |
| **When to Use/Not Use** | ✅ | ✅ | Merge |
| **Query Examples** | ✅ (extensive) | ❌ | Add to api-reference |
| **Decision Logic Examples** | ✅ (8 examples) | ❌ | Add to api-reference |
| **Common Patterns/Anti-Patterns** | ✅ | ❌ | Add to api-reference |
| **Scoring System Details** | ✅ (detailed) | ✅ (summary table) | Merge |
| **Performance Characteristics** | ✅ (detailed table) | ✅ (brief table) | Merge, keep detailed |
| **Technical Architecture** | ✅ (index architecture) | ❌ | Add to api-reference |
| **"3 Questions" Method** | ✅ | ❌ | Add to api-reference |
| **Test Cases Table** | ✅ | ❌ | Add to api-reference |
| **Error Handling** | ❌ | ✅ | Keep from api-reference |
| **Workflows** | ❌ | ✅ | Keep from api-reference |

---

## Detailed Overlap Analysis

### 1. Tool Overview

**tool-selection-guide.md** has a more detailed comparison matrix:
- Search scope, index type, precision ratings, use cases, query types

**api-reference.md** has a simpler overview table:
- Categories and purposes

**Action:** Combine both into a comprehensive overview section.

---

### 2. Decision Trees

**tool-selection-guide.md:**
```
START: User asks a question
├─ Are they asking "what documents do I have?"...
├─ Are they asking to browse BY CATEGORY...
├─ Are they explicitly asking to "extract"...
└─ DEFAULT → ...
```
(35+ line decision tree)

**api-reference.md:**
```
What do you want to find?
├── List my library / What do I have?
├── Documents about a topic
├── Content (specific passages)
...
```
(25 line simplified tree)

**Action:** Keep comprehensive version from tool-selection-guide.md.

---

### 3. Per-Tool Documentation

**tool-selection-guide.md** for each tool:
- When to Use (bullet list)
- When NOT to Use (bullet list)
- Query Examples (✅ and ❌ examples)
- What It Returns (detailed)
- Technical Details (architecture notes)

**api-reference.md** for each tool:
- Use When (brief)
- Do NOT Use For (brief)
- Parameters table
- Returns description
- Example JSON input

**Action:** Merge both, keeping:
- Detailed parameters table from api-reference
- Extended guidance from tool-selection-guide
- Add response schemas (currently missing from both)

---

### 4. Missing Content (Must Add)

**Response Schemas:** Neither document includes actual JSON response schemas. This is the primary gap to address.

Examples of what's needed:

```json
// catalog_search response schema
{
  "documents": [
    {
      "source": "string (file path)",
      "catalog_title": "string",
      "summary": "string",
      "primary_concepts": ["string"],
      "categories": ["string"],
      "scores": {
        "hybrid": "number (0-1)",
        "vector": "number (0-1)",
        "bm25": "number (0-1)",
        "title": "number (0-1)",
        "concept": "number (0-1)",
        "wordnet": "number (0-1)"
      }
    }
  ],
  "query_expansion": {
    "original": "string",
    "expanded_terms": ["string"],
    "concepts_matched": ["string"]
  },
  "stats": {
    "total_results": "number",
    "search_time_ms": "number"
  }
}
```

---

## Consolidation Strategy

### Phase 1: Enhance api-reference.md Structure

1. Add comprehensive tool overview table
2. Add full decision tree
3. Restructure each tool section with consistent format

### Phase 2: Add JSON Schemas

For each tool, add:
- **Input Schema:** Complete JSON with types, required fields, constraints
- **Response Schema:** Complete JSON structure with field descriptions

### Phase 3: Merge Selection Guidance

1. Detailed "When to Use" / "When NOT to Use" lists
2. Query examples (✅ and ❌)
3. Common patterns and anti-patterns
4. Decision logic examples
5. "3 Questions" method

### Phase 4: Consolidate Technical Content

1. Scoring system details
2. Performance characteristics
3. Index architecture notes
4. Test cases table

### Phase 5: Cleanup

1. Remove tool-selection-guide.md
2. Update any references to the removed file
3. Validate no broken links

---

## Content Unique to Each File

### Unique to tool-selection-guide.md (must preserve):

1. **Quick Decision Tree** - Comprehensive 35-line tree
2. **Tool Comparison Matrix** - Detailed with precision ratings
3. **Query Examples** - Per-tool ✅/❌ examples
4. **Decision Logic Examples** - 8 detailed scenarios
5. **Common Patterns and Anti-Patterns** - Best practices
6. **Key Technical Differences** - Index architecture details
7. **"3 Questions" Method** - Quick selection heuristic
8. **Testing Your Decision Logic** - Test cases table
9. **Revision History** - Changelog

### Unique to api-reference.md (must preserve):

1. **Parameter Tables** - Structured type/required/default tables
2. **JSON Input Examples** - Per-tool request examples
3. **Common Workflows** - 4 workflow patterns
4. **Error Handling** - Error codes and response format
5. **Rate Limits & Performance** - Response time table
6. **Performance Caches** - EmbeddingCache, SearchResultCache

---

## Proposed Final Structure

```markdown
# Concept-RAG API Reference

## Overview
- Tool summary table (enhanced)
- Hybrid search scoring summary

## Tool Selection Guide
- Quick Decision Tree (comprehensive)
- "3 Questions" Method
- Common Patterns and Anti-Patterns
- Decision Logic Examples

## Document Discovery
### catalog_search
- Description
- When to Use / When NOT to Use
- Parameters (table)
- Input Schema (JSON)
- Response Schema (JSON)
- Query Examples (✅/❌)
- Technical Details

## Content Search
### broad_chunks_search
(same structure)

### chunks_search
(same structure)

## Concept Analysis
### concept_search
(same structure)

### extract_concepts
(same structure)

### source_concepts
(same structure)

### concept_sources
(same structure)

## Category Browsing
### category_search
(same structure)

### list_categories
(same structure)

### list_concepts_in_category
(same structure)

## Common Workflows
(from api-reference.md)

## Error Handling
(from api-reference.md)

## Performance
- Response times
- Caching details
- Performance characteristics table

## Technical Architecture
- Index types
- Scoring weights

## Appendix
- Test cases for tool selection validation
- Revision history
```

---

## Estimated Line Count

| Section | Estimated Lines |
|---------|-----------------|
| Overview | 80-100 |
| Tool Selection Guide | 200-250 |
| 10 Tool Specifications | 800-1000 (80-100 per tool) |
| Workflows | 60-80 |
| Error Handling | 40-50 |
| Performance | 60-80 |
| Technical Architecture | 60-80 |
| Appendix | 80-100 |
| **Total** | **1400-1700 lines** |

This consolidation reduces maintenance burden from 1369 lines across 2 files to ~1500 lines in 1 comprehensive file with full I/O schemas.






