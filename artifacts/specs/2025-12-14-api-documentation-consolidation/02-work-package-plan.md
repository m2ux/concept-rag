# API Documentation Consolidation - Implementation Plan

**Date:** 2025-12-14
**Priority:** HIGH
**Status:** Ready
**Estimated Effort:** 2-3h agentic + 30min review

---

## Overview

### Problem Statement

Two documentation files exist with significant content overlap:
- `docs/tool-selection-guide.md` (813 lines) - Detailed selection guidance
- `docs/api-reference.md` (556 lines) - API parameter specifications

Neither document includes complete JSON response schemas, which are essential for developers and AI agents using the tools.

### Scope

**In Scope:**
- Augment `api-reference.md` with full JSON input/response schemas for all 10 tools
- Merge all selection guidance content from `tool-selection-guide.md`
- Preserve decision trees, patterns, anti-patterns, and examples
- Remove `tool-selection-guide.md` after consolidation

**Out of Scope:**
- Code changes to tool implementations
- Adding new tools or parameters
- Changing tool behavior

---

## Current State Analysis

### Content in tool-selection-guide.md (To Be Merged)

| Content | Lines | Action |
|---------|-------|--------|
| Quick Decision Tree | 35 | Merge (comprehensive version) |
| Tool Comparison Matrix | 14 | Merge (with precision ratings) |
| Per-Tool Selection Criteria (11 tools) | ~500 | Merge detailed guidance |
| Decision Logic Examples (8) | 80 | Add to api-reference |
| Common Patterns/Anti-Patterns | 60 | Add to api-reference |
| "3 Questions" Method | 15 | Add to api-reference |
| Test Cases Table | 25 | Add as appendix |
| Revision History | 10 | Add as appendix |

### Content in api-reference.md (To Be Enhanced)

| Content | Lines | Action |
|---------|-------|--------|
| Overview Table | 20 | Keep and enhance |
| Per-Tool Specifications (10 tools) | ~350 | Add response schemas |
| Parameter Tables | 100 | Keep (well-structured) |
| Common Workflows | 35 | Keep |
| Error Handling | 25 | Keep |
| Performance Table | 20 | Enhance with detailed metrics |

### Missing Content (To Be Added)

| Content | Description |
|---------|-------------|
| **Response Schemas** | Full JSON structure for each tool's response |
| **Field Descriptions** | Meaning of each response field |
| **Example Responses** | Realistic example outputs |

---

## Implementation Tasks

### Task 1: Restructure api-reference.md Header (15 min)

**Goal:** Add comprehensive overview section with merged tool comparison matrix.

**Deliverables:**
- Enhanced overview with tool count
- Merged comparison matrix with precision ratings
- Schema version and date

**Template:**
```markdown
# Concept-RAG API Reference

**Schema Version:** v7 (December 2025)
**Tools:** 10 MCP tools across 4 categories

## Overview

| Category | Tools | Purpose |
|----------|-------|---------|
| Document Discovery | catalog_search | Find documents by title, author, topic |
| Content Search | broad_chunks_search, chunks_search | Search within document content |
| Concept Analysis | concept_search, extract_concepts, source_concepts, concept_sources | Analyze and track concepts |
| Category Browsing | category_search, list_categories, list_concepts_in_category | Browse by domain/category |

## Tool Comparison Matrix

| Tool | Search Scope | Precision | Use Case |
|------|--------------|-----------|----------|
| concept_search | All chunks | ⭐⭐⭐⭐⭐ | Conceptual research |
| broad_chunks_search | All chunks | ⭐⭐⭐ | Comprehensive search |
| ... | ... | ... | ... |
```

---

### Task 2: Add Selection Guidance Section (30 min)

**Goal:** Consolidate all selection guidance into a dedicated section.

**Content to include:**
1. Quick Decision Tree (comprehensive version from tool-selection-guide.md)
2. "3 Questions" Method
3. Common Patterns and Anti-Patterns

**Location:** After Overview, before tool specifications.

---

### Task 3: Document catalog_search Full Specification (15 min)

**Goal:** Add complete JSON input and response schemas.

**Input Schema:**
```json
{
  "text": "string (required) - Search query",
  "debug": "boolean (optional, default: false) - Show score breakdown"
}
```

**Response Schema:**
```json
[
  {
    "source": "/path/to/document.pdf",
    "summary": "Full document summary text...",
    "scores": {
      "hybrid": "0.850",
      "vector": "0.720",
      "bm25": "0.650",
      "title": "0.900",
      "concept": "0.500",
      "wordnet": "0.300"
    },
    "expanded_terms": ["synonym1", "related_term"]
  }
]
```

**Field Descriptions:**
- `source`: Full file path to the document
- `summary`: Complete document summary (not truncated)
- `scores.hybrid`: Combined weighted score (30% vector, 25% BM25, 20% title, 15% concept, 10% wordnet)
- `expanded_terms`: Query terms expanded via WordNet synonyms

---

### Task 4: Document broad_chunks_search Full Specification (15 min)

**Response Schema:**
```json
[
  {
    "text": "Chunk content text...",
    "source": "/path/to/document.pdf",
    "scores": {
      "hybrid": "0.750",
      "vector": "0.680",
      "bm25": "0.720",
      "concept": "0.450",
      "wordnet": "0.280"
    },
    "expanded_terms": ["synonym1"]
  }
]
```

**Notes:**
- Title scoring NOT used for chunks (only for catalog search)
- Returns top 20 chunks (hardcoded limit)

---

### Task 5: Document chunks_search Full Specification (15 min)

**Input Schema:**
```json
{
  "text": "string (required) - Search query",
  "source": "string (required) - Full file path to document",
  "debug": "boolean (optional, default: false)"
}
```

**Response Schema:**
```json
[
  {
    "text": "Chunk content text...",
    "source": "/path/to/document.pdf",
    "title": "Document Title",
    "concepts": ["concept1", "concept2"],
    "concept_ids": [123, 456]
  }
]
```

**Notes:**
- Returns top 20 chunks from specified document
- Requires exact source path match
- Use catalog_search first to find document path

---

### Task 6: Document concept_search Full Specification (20 min)

**Input Schema:**
```json
{
  "concept": "string (required) - Conceptual term to search for",
  "limit": "number (optional, default: 20) - Max sources to return",
  "source_filter": "string (optional) - Filter by source path substring",
  "debug": "boolean (optional, default: false)"
}
```

**Response Schema:**
```json
{
  "concept": "dependency injection",
  "concept_id": 12345,
  "summary": "Concept summary from extraction...",
  
  "related_concepts": ["inversion of control", "factory pattern"],
  "synonyms": ["DI", "IOC container"],
  "broader_terms": ["design patterns"],
  "narrower_terms": ["constructor injection", "setter injection"],
  
  "sources": [
    {
      "title": "Clean Architecture",
      "pages": [45, 67, 89],
      "match_type": "primary",
      "via_concept": null,
      "page_previews": ["Preview text..."]
    },
    {
      "title": "Design Patterns",
      "pages": [23],
      "match_type": "related",
      "via_concept": "inversion of control"
    }
  ],
  
  "chunks": [
    {
      "text": "Chunk content about dependency injection...",
      "title": "Clean Architecture",
      "page": 45,
      "concept_density": "0.850",
      "concepts": ["dependency injection", "clean code"]
    }
  ],
  
  "stats": {
    "total_documents": 15,
    "total_chunks": 234,
    "sources_returned": 5,
    "chunks_returned": 15
  },
  
  "scores": {
    "hybrid": "0.920",
    "name": "0.950",
    "vector": "0.800",
    "bm25": "0.700",
    "wordnet": "0.450"
  }
}
```

**Key Features:**
- Hierarchical: Concept → Sources → Chunks
- `match_type`: "primary" (direct match) or "related" (via linked concept)
- `concept_density`: How prominently the concept appears (0.000-1.000)
- Fuzzy matching expands to lexically-related concepts

---

### Task 7: Document extract_concepts Full Specification (15 min)

**Input Schema:**
```json
{
  "document_query": "string (required) - Document title, author, or keywords",
  "format": "string (optional, default: 'json') - 'json' or 'markdown'",
  "include_summary": "boolean (optional, default: true)"
}
```

**Response Schema (JSON format):**
```json
{
  "document": "/path/to/document.pdf",
  "document_hash": "abc123...",
  "total_concepts": 125,
  "primary_concepts": ["concept1", "concept2", "..."],
  "related_concepts": ["related1", "related2", "..."],
  "categories": ["Software Engineering", "Design Patterns"],
  "summary": "Document summary text..."
}
```

**Response Schema (Markdown format):**
```markdown
# Concepts Extracted from Document

**Document:** Clean Architecture.pdf
**Full Path:** /path/to/Clean Architecture.pdf
**Total Concepts:** 125

---

## Primary Concepts (100)

| # | Concept |
|---|---------|
| 1 | dependency injection |
| 2 | clean architecture |
...

## Categories (3)

- Software Engineering
- Design Patterns
- Clean Code

## Summary

Document summary text...
```

---

### Task 8: Document source_concepts Full Specification (15 min)

**Input Schema:**
```json
{
  "concept": "string | string[] (required) - Concept(s) to find sources for",
  "include_metadata": "boolean (optional, default: true)"
}
```

**Response Schema (single concept):**
```json
{
  "concepts_searched": ["dependency injection"],
  "concepts_found": ["dependency injection"],
  "source_count": 12,
  "sources": [
    {
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "year": "2017",
      "source_path": "/path/to/book.pdf",
      "summary": "Document summary...",
      "primary_concepts": ["clean code", "SOLID"],
      "categories": ["Software Engineering"]
    }
  ]
}
```

**Response Schema (multiple concepts):**
```json
{
  "concepts_searched": ["dependency injection", "test driven development"],
  "concepts_found": ["dependency injection", "test driven development"],
  "concepts_not_found": [],
  "source_count": 18,
  "sources": [
    {
      "title": "Clean Architecture",
      "concept_indices": [0, 1],
      "source_path": "/path/to/book.pdf"
    },
    {
      "title": "TDD by Example",
      "concept_indices": [1],
      "source_path": "/path/to/tdd.pdf"
    }
  ]
}
```

**Key Features:**
- `concept_indices`: Array of indices into `concepts_searched` showing which concepts this source matches
- Sources sorted by number of matching concepts (most comprehensive first)
- Returns union of all sources containing ANY of the input concepts

---

### Task 9: Document concept_sources Full Specification (15 min)

**Input Schema:**
```json
{
  "concept": "string | string[] (required) - Concept(s) to find sources for",
  "include_metadata": "boolean (optional, default: true)"
}
```

**Response Schema:**
```json
{
  "concepts_searched": ["dependency injection", "test driven development"],
  "results": [
    [
      { "title": "Clean Architecture", "source_path": "/path/to/book1.pdf" },
      { "title": "Design Patterns", "source_path": "/path/to/book2.pdf" }
    ],
    [
      { "title": "TDD by Example", "source_path": "/path/to/tdd.pdf" },
      { "title": "Clean Code", "source_path": "/path/to/clean.pdf" }
    ]
  ]
}
```

**Key Features:**
- `results[i]` contains sources for `concepts_searched[i]`
- Empty array `[]` if concept not found (preserves position)
- Same source may appear in multiple arrays (no deduplication)

**Comparison: source_concepts vs concept_sources:**

| Feature | source_concepts | concept_sources |
|---------|-----------------|-----------------|
| Output | Union with concept_indices | Separate arrays |
| Duplicates | Deduplicated | May repeat across arrays |
| Use case | "What covers these?" | "Sources per concept" |
| Sorting | By match count | By input position |

---

### Task 10: Document category_search Full Specification (15 min)

**Input Schema:**
```json
{
  "category": "string (required) - Category name, ID, or alias",
  "includeChildren": "boolean (optional, default: false) - Include child categories",
  "limit": "number (optional, default: 10) - Max documents to return"
}
```

**Response Schema:**
```json
{
  "category": {
    "id": 12345,
    "name": "Software Engineering",
    "description": "Documents about software development practices...",
    "hierarchy": ["Technology", "Computer Science", "Software Engineering"],
    "aliases": ["SWE", "software development"],
    "relatedCategories": [
      { "id": 12346, "name": "Design Patterns" },
      { "id": 12347, "name": "Clean Code" }
    ]
  },
  "statistics": {
    "totalDocuments": 45,
    "totalChunks": 1234,
    "totalConcepts": 567,
    "documentsReturned": 10
  },
  "documents": [
    {
      "title": "Clean Architecture",
      "preview": "First 200 characters of summary...",
      "primaryConcepts": ["clean code", "SOLID", "dependency injection"]
    }
  ],
  "includeChildren": false,
  "categoriesSearched": ["Software Engineering"]
}
```

---

### Task 11: Document list_categories Full Specification (15 min)

**Input Schema:**
```json
{
  "sortBy": "string (optional, default: 'popularity') - 'name', 'popularity', or 'documentCount'",
  "limit": "number (optional, default: 50) - Max categories to return",
  "search": "string (optional) - Filter by name/description"
}
```

**Response Schema:**
```json
{
  "summary": {
    "totalCategories": 45,
    "categoriesReturned": 20,
    "rootCategories": 8,
    "totalDocuments": 150,
    "sortedBy": "popularity",
    "searchQuery": null
  },
  "categories": [
    {
      "id": 12345,
      "name": "Software Engineering",
      "description": "Documents about software development...",
      "aliases": ["SWE"],
      "parent": "Computer Science",
      "hierarchy": ["Technology", "Computer Science", "Software Engineering"],
      "statistics": {
        "documents": 45,
        "chunks": 1234,
        "concepts": 567
      },
      "relatedCategories": ["Design Patterns", "Clean Code"]
    }
  ]
}
```

---

### Task 12: Document list_concepts_in_category Full Specification (15 min)

**Input Schema:**
```json
{
  "category": "string (required) - Category name, ID, or alias",
  "sortBy": "string (optional, default: 'documentCount') - 'name' or 'documentCount'",
  "limit": "number (optional, default: 50) - Max concepts to return"
}
```

**Response Schema:**
```json
{
  "category": {
    "id": 12345,
    "name": "Software Engineering",
    "description": "Documents about software development...",
    "hierarchy": ["Technology", "Computer Science", "Software Engineering"]
  },
  "statistics": {
    "totalDocuments": 45,
    "totalChunks": 1234,
    "totalUniqueConcepts": 567,
    "conceptsReturned": 50
  },
  "concepts": [
    { "id": 111, "name": "dependency injection", "documentCount": 35, "weight": 0.85 },
    { "id": 222, "name": "clean code", "documentCount": 28, "weight": 0.72 }
  ],
  "sortedBy": "documentCount",
  "note": "Concepts are category-agnostic and appear across multiple categories"
}
```

---

### Task 13: Add Decision Logic Examples (20 min)

**Goal:** Port the 8 decision logic examples from tool-selection-guide.md.

**Examples to include:**
1. "Find information about innovation" → concept_search
2. "What do my documents say about innovation and organizational change?" → broad_chunks_search
3. "What documents do I have about military strategy?" → catalog_search
4. "Find where Sun Tzu discusses deception" → catalog_search → chunks_search
5. "Extract concepts from the Art of War" → extract_concepts
6. "What categories do I have?" → list_categories
7. "Show me documents about software engineering" → category_search
8. "What concepts are discussed in distributed systems documents?" → list_concepts_in_category

---

### Task 14: Add Patterns and Anti-Patterns Section (15 min)

**Good Patterns:**
```markdown
### ✅ Good Patterns

1. **Exploratory workflow:**
   catalog_search → concept_search → extract_concepts

2. **Precise concept research:**
   concept_search("innovation") → high-precision results

3. **Comprehensive content search:**
   broad_chunks_search("how do organizations innovate?")

4. **Document-focused workflow:**
   catalog_search("Sun Tzu") → chunks_search with source path
```

**Anti-Patterns:**
```markdown
### ❌ Anti-Patterns

1. **Using broad_chunks_search for single concepts:**
   ❌ broad_chunks_search("innovation")
   ✅ concept_search("innovation")

2. **Using concept_search for multi-word queries:**
   ❌ concept_search("how innovation happens in organizations")
   ✅ broad_chunks_search("how innovation happens in organizations")

3. **Using chunks_search without knowing document:**
   ❌ chunks_search("leadership", source="unknown")
   ✅ catalog_search("leadership") first

4. **Using extract_concepts for search:**
   ❌ extract_concepts("documents about innovation")
   ✅ concept_search("innovation")
```

---

### Task 15: Add Test Cases Table (10 min)

**Goal:** Include validation test cases from tool-selection-guide.md.

```markdown
## Tool Selection Validation

| User Query | Correct Tool | Reasoning |
|------------|--------------|-----------|
| "What documents do I have?" | list_categories | Asking for documents |
| "What categories do I have?" | list_categories | Asking for categories |
| "innovation" | concept_search | Single concept term |
| "Find all mentions of leadership" | concept_search | Concept tracking |
| "Show me software engineering documents" | category_search | Category-based filtering |
| "What concepts are in distributed systems?" | list_concepts_in_category | Concepts within category |
| "How do teams collaborate?" | broad_chunks_search | Natural language question |
| "strategic planning frameworks" | broad_chunks_search | Multi-word phrase |
| "Search Sun Tzu for deception" | chunks_search | Known document |
| "Extract concepts from Art of War" | extract_concepts | Explicit extraction request |
| "Which books discuss TDD?" | source_concepts | Source attribution for concept |
| "List sources for each concept separately" | concept_sources | Per-concept bibliographies |
```

---

### Task 16: Remove tool-selection-guide.md (5 min)

**Goal:** Delete redundant file after consolidation.

**Checklist:**
- [ ] All content migrated to api-reference.md
- [ ] No broken links to tool-selection-guide.md
- [ ] Update any references in other docs

---

### Task 17: Validation (20 min)

**Goal:** Verify consolidated document is complete and accurate.

**Checklist:**
- [ ] All 10 tools documented with full I/O schemas
- [ ] Response schemas match actual tool implementations
- [ ] Decision tree and selection guidance present
- [ ] Patterns and anti-patterns included
- [ ] Test cases table present
- [ ] No broken internal links
- [ ] Document renders correctly in markdown preview

---

## Success Criteria

### Functional Requirements

- [ ] Each of 10 tools has complete JSON input schema
- [ ] Each of 10 tools has complete JSON response schema
- [ ] All selection guidance from tool-selection-guide.md is incorporated
- [ ] Decision tree preserved (comprehensive version)
- [ ] "3 Questions" method included
- [ ] Patterns and anti-patterns preserved
- [ ] Decision logic examples included
- [ ] Test cases table included

### Quality Requirements

- [ ] Response schemas accurately match tool implementations
- [ ] Consistent formatting across all tool specifications
- [ ] No redundant content
- [ ] Clear navigation structure
- [ ] tool-selection-guide.md removed

---

## Final Document Structure

```markdown
# Concept-RAG API Reference

## Overview (enhanced)
## Tool Comparison Matrix
## Hybrid Search Scoring Summary

## Tool Selection Guide
### Quick Decision Tree
### The "3 Questions" Method
### Common Patterns and Anti-Patterns
### Decision Logic Examples

## Document Discovery
### catalog_search (with full I/O schemas)

## Content Search
### broad_chunks_search (with full I/O schemas)
### chunks_search (with full I/O schemas)

## Concept Analysis
### concept_search (with full I/O schemas)
### extract_concepts (with full I/O schemas)
### source_concepts (with full I/O schemas)
### concept_sources (with full I/O schemas)

## Category Browsing
### category_search (with full I/O schemas)
### list_categories (with full I/O schemas)
### list_concepts_in_category (with full I/O schemas)

## Common Workflows (from api-reference.md)
## Error Handling (from api-reference.md)
## Performance (enhanced with detailed metrics)

## Appendix
### Tool Selection Validation Test Cases
### Revision History
```

---

## Dependencies & Risks

### Requires (Blockers)

- [ ] None - all prerequisites met

### Risks

- **Risk:** Large document may be harder to maintain | **Mitigation:** Clear section structure with table of contents
- **Risk:** Response schemas may drift from implementation | **Mitigation:** Document schema version; consider automated validation in future

---

**Status:** Ready for implementation






