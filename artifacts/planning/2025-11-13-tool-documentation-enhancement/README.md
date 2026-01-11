# Tool Documentation Enhancement

**Date:** November 13, 2025  
**Status:** ✅ Complete

## Overview

Enhanced embedded documentation in all MCP tool classes to provide clear, actionable guidance for AI agents selecting the appropriate search tool based on query intent. This work was driven by investigation findings showing significant inconsistencies between search methods.

## Key Deliverables

1. **2025-11-13-tool-documentation-enhancement-summary.md** - Complete implementation documentation
2. **2025-11-13-search-method-comparison-innovation-concept.md** - Investigation showing 0% overlap between concept_search and broad_chunks_search

## Problem Statement

Investigation revealed significant inconsistencies between search methods when searching for "innovation":
- **concept_search**: 10/10 results relevant (100% precision)
- **broad_chunks_search**: 0/10 results relevant (0% precision)  
- **Overlap**: 0% - No common chunks between methods

This demonstrated critical need for clear tool selection guidance embedded directly in tool descriptions that AI agents see via MCP protocol.

## Solution Implemented

### 1. Enhanced Tool Class Documentation

Updated embedded `description` fields in all five tool classes with structured sections:

**Files Modified:**
1. `src/tools/operations/concept_search.ts`
   - Added "USE THIS TOOL WHEN" section
   - Added "DO NOT USE for" section
   - Clarified concept-enriched index with semantic tagging
   - Specified single concept term queries

2. `src/tools/operations/conceptual_broad_chunks_search.ts`
   - Clarified hybrid search methodology (vector + BM25 + concept + WordNet)
   - Specified use cases: phrases, keywords, natural language
   - Warned about potential false positives

3. `src/tools/operations/conceptual_catalog_search.ts`
   - Emphasized document-level discovery focus
   - Highlighted title matching bonus (10x weight)
   - Specified use for overviews, not content search

4. `src/tools/operations/conceptual_chunks_search.ts`
   - Clarified requirement for exact source path
   - Added two-step workflow note (catalog → chunks)
   - Specified when NOT to use

5. `src/tools/operations/document_concepts_extract.ts`
   - Emphasized concept export purpose, NOT search
   - Clarified use cases: concept maps, quality review
   - Added explicit trigger phrases

### 2. Comprehensive Tool Selection Guide

**File:** `tool-selection-guide.md` (5,800+ words)

**Contents:**
- Quick Decision Tree (visual flowchart)
- Tool Comparison Matrix (side-by-side features)
- Detailed Selection Criteria (when/when not to use)
- Decision Logic Examples (5 real-world queries)
- Common Patterns & Anti-Patterns
- Scoring System Comparison (ranking differences)
- Performance Characteristics (speed, precision, recall)
- Technical Architecture (index differences)
- "3 Questions" Method (simple decision framework)
- Test Cases (10 example queries with mappings)

### 3. Updated User-Facing Documentation

**README.md Updates:**
- Quick reference table with tool comparison
- Streamlined tool descriptions with "Use when" statements
- Prominent link to tool-selection-guide.md
- "For AI Agents" section highlighting embedded docs

**USAGE.md Updates:**
- "Quick Tool Selection" section at top
- Detailed examples for each tool
- Common pitfalls and solutions
- Performance comparison table

## Search Method Comparison Results

### Concept Search (Concept-Enriched Index)
- **Data source**: Concept metadata tags from LLM extraction
- **Matching**: Semantic concept matching with fuzzy logic
- **Results for "innovation"**: 10/10 highly relevant
- **Best for**: Tracking specific concepts across documents

### Broad Chunks Search (Hybrid Full-Text)
- **Data source**: Raw chunk text with hybrid ranking
- **Matching**: Vector + BM25 + concept scores + WordNet
- **Results for "innovation"**: 0/10 relevant (false positives)
- **Best for**: Natural language questions, phrase searches

### Key Insight
The two methods are complementary but fundamentally different:
- Concept search = High precision semantic tagging
- Broad chunks search = Comprehensive text coverage

## Impact

### Before
- AI agents struggled to select appropriate tools
- Search results inconsistent between methods
- No clear guidance on tool selection
- Documentation buried in separate files

### After
- Clear embedded guidance in MCP tool descriptions
- AI agents can make informed tool selection decisions
- Comprehensive external documentation for reference
- Better search results through proper tool usage

## Metrics

- **5 tool classes enhanced** with embedded documentation
- **1 comprehensive guide created** (5,800+ words)
- **2 user docs updated** (README.md, USAGE.md)
- **10 test cases documented** for validation

## Outcome

AI agents now have clear, actionable guidance embedded directly in the MCP tool descriptions, enabling optimal tool selection based on query intent. This reduces search confusion and improves result relevance.



