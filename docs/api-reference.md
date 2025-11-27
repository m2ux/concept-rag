# Concept-RAG API Reference

This document provides a comprehensive API specification for all MCP tools available in Concept-RAG.

---

## Overview

Concept-RAG provides **10 MCP tools** organized into four categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Document Discovery** | `catalog_search` | Find documents by title, author, topic |
| **Content Search** | `broad_chunks_search`, `chunks_search`, `concept_chunks` | Search within document content |
| **Concept Analysis** | `extract_concepts`, `source_concepts`, `concept_sources` | Analyze and track concepts |
| **Category Browsing** | `category_search`, `list_categories`, `list_concepts_in_category` | Browse by domain/category |

---

## Document Discovery

### `catalog_search`

Search document summaries and metadata to discover relevant documents using semantic similarity.

**Use When:**
- Finding documents about a specific topic or subject area
- Looking for documents by title, author, or keywords
- Starting exploratory research to identify relevant sources

**Do NOT Use For:**
- Listing all documents in your library (use `list_categories` then `category_search` instead)
- Meta-questions like "What documents do I have?" (this performs semantic search, not browsing)

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | - | Search query - topics, titles, authors, or keywords |
| `debug` | boolean | ❌ | `false` | Show query expansion and score breakdown |

**Returns:** Top 10 documents with:
- Document summary/preview
- Hybrid scores (vector + BM25 + title matching)
- Matched concepts
- Source path

**Example:**
```json
{
  "text": "software architecture patterns",
  "debug": false
}
```

**How It Works:**
1. Converts query to a vector embedding
2. Performs semantic search against document summaries
3. Re-ranks results using BM25, title matching, and concept alignment

---

## Content Search

### `broad_chunks_search`

Search across ALL document chunks using hybrid search (vector + BM25 + concept + WordNet).

**Use When:**
- Comprehensive cross-document research on a topic
- Searching for specific phrases, keywords, or technical terms
- Finding passages that discuss a particular subject

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | - | Search query - topics, phrases, keywords |
| `debug` | boolean | ❌ | `false` | Show query expansion and score breakdown |

**Returns:** Top 10 chunks ranked by hybrid scoring with:
- Text content
- Source document path
- Score components (vector, BM25, concept, WordNet)

**Example:**
```json
{
  "text": "implementing dependency injection in enterprise applications",
  "debug": true
}
```

---

### `chunks_search`

Search within a single known document using hybrid search.

**Use When:**
- You know which document contains the information
- Focused analysis of one document's content
- Finding specific passages within a known document

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | - | Search query within the document |
| `source` | string | ✅ | - | Full file path of the source document |
| `debug` | boolean | ❌ | `false` | Show debug information |

**Returns:** Top 5 chunks from the specified document with hybrid scores.

**Example:**
```json
{
  "text": "dependency injection",
  "source": "/home/user/Documents/ebooks/Programming/Clean Architecture.pdf"
}
```

**Note:** Use `catalog_search` first to find the exact document path.

---

### `concept_chunks`

Find all chunks tagged with a specific concept from the concept-enriched index.

**Use When:**
- Researching a specific conceptual topic (e.g., "innovation", "leadership")
- Need semantically-tagged, high-precision results
- Tracking where a concept is discussed across your library

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string | ✅ | - | Conceptual term to search for (single word or short phrase) |
| `limit` | number | ❌ | `10` | Maximum results to return |
| `source_filter` | string | ❌ | - | Filter to documents containing this text in path |

**Returns:** Concept-tagged chunks with:
- Related concepts
- Semantic categories
- Source attribution

**Example:**
```json
{
  "concept": "dependency injection",
  "limit": 15,
  "source_filter": "Programming"
}
```

**Note:** Use conceptual terms, not phrases. Good: "innovation", "leadership", "TDD". Avoid: "innovation process", "leadership in organizations".

---

## Concept Analysis

### `extract_concepts`

Export the complete list of concepts extracted from a specific document.

**Use When:**
- User explicitly asks to "extract concepts" or "list concepts"
- Creating a concept map or overview
- Exporting concept data for external analysis

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document_query` | string | ✅ | - | Document title, author, or keywords to identify it |
| `format` | string | ❌ | `"json"` | Output format: `"json"` or `"markdown"` |
| `include_summary` | boolean | ❌ | `true` | Include document summary and categories |

**Returns:** Complete concept inventory (typically 80-150+ concepts):
- Primary concepts
- Categories
- Related concepts
- Document summary (if requested)

**Example:**
```json
{
  "document_query": "Clean Architecture",
  "format": "markdown",
  "include_summary": true
}
```

---

### `source_concepts`

Find all documents where specific concept(s) appear. Returns a merged/union list.

**Use When:**
- Need to know which documents discuss a concept
- Finding source attribution for research/citations
- Answering "Which books mention X?"

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string \| string[] | ✅ | - | Concept(s) to find sources for |
| `include_metadata` | boolean | ❌ | `true` | Include document summaries and categories |

**Returns:** List of source documents with:
- Title and path
- Summary (if requested)
- Concept metadata
- `concept_indices` showing which concepts each source matches (for multiple concepts)

**Example (single concept):**
```json
{
  "concept": "dependency injection",
  "include_metadata": true
}
```

**Example (multiple concepts - returns union):**
```json
{
  "concept": ["dependency injection", "inversion of control"],
  "include_metadata": true
}
```

---

### `concept_sources`

Get sources for each concept separately (per-concept arrays, not merged).

**Use When:**
- Need separate source lists for each concept (not merged)
- Comparing which sources cover which specific concepts
- Building per-concept bibliographies

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string \| string[] | ✅ | - | Concept(s) to find sources for |
| `include_metadata` | boolean | ❌ | `true` | Include document metadata |

**Returns:** Array where `results[i]` contains sources for `concepts_searched[i]`:
```json
{
  "concepts_searched": ["TDD", "DI"],
  "results": [
    [{"title": "Book A"}, {"title": "Book B"}],
    [{"title": "Book C"}, {"title": "Book A"}]
  ]
}
```

**Example:**
```json
{
  "concept": ["test driven development", "behavior driven development"],
  "include_metadata": false
}
```

---

## Category Browsing

### `category_search`

Find documents by category/domain. Best for browsing your library by subject area.

**Use When:**
- Browse documents in a specific domain
- Filter library by subject area
- List all documents in a category

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ✅ | - | Category name, ID, or alias |
| `includeChildren` | boolean | ❌ | `false` | Include child categories in hierarchy |
| `limit` | number | ❌ | `10` | Maximum documents to return |

**Returns:** Documents in the category with:
- Category metadata and statistics
- Document list with summaries
- Hierarchy information

**Example:**
```json
{
  "category": "software engineering",
  "includeChildren": true,
  "limit": 20
}
```

---

### `list_categories`

List all available categories with statistics. **Best starting point for library exploration.**

**Use When:**
- Discover what subject areas are in your library
- Answer "What documents do I have?" (list categories, then browse each)
- Explore category hierarchy
- Find categories by name

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sortBy` | string | ❌ | `"popularity"` | Sort: `"name"`, `"popularity"`, or `"documentCount"` |
| `limit` | number | ❌ | `50` | Maximum categories to return |
| `search` | string | ❌ | - | Filter categories by name/description |

**Returns:** Categories with:
- Name and description
- Document count per category
- Hierarchy path
- Related categories

**Example:**
```json
{
  "sortBy": "documentCount",
  "limit": 10
}
```

---

### `list_concepts_in_category`

Find all unique concepts in documents of a specific category.

**Use When:**
- Analyze conceptual landscape of a domain
- Find concepts specific to a subject area
- Discover domain vocabulary

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ✅ | - | Category name, ID, or alias |
| `sortBy` | string | ❌ | `"documentCount"` | Sort: `"name"` or `"documentCount"` |
| `limit` | number | ❌ | `50` | Maximum concepts to return |

**Returns:** Concepts in the category with:
- Concept name and summary
- Document count (frequency)
- Related concepts

**Example:**
```json
{
  "category": "distributed systems",
  "sortBy": "documentCount",
  "limit": 30
}
```

---

## Tool Selection Guide

### Decision Tree

```
What do you want to find?
│
├── List my library / What do I have?
│   └── list_categories → category_search (for each)
│
├── Documents about a topic
│   └── catalog_search
│
├── Content (specific passages)
│   ├── Across all documents → broad_chunks_search
│   ├── Within one document → chunks_search
│   └── By concept tag → concept_chunks
│
├── Concept Analysis
│   ├── All concepts from a document → extract_concepts
│   ├── Which docs have a concept → source_concepts
│   └── Per-concept source lists → concept_sources
│
└── Category Browsing
    ├── Documents in category → category_search
    ├── What categories exist → list_categories
    └── Concepts in category → list_concepts_in_category
```

### Common Workflows

**1. Explore Your Library**
```
list_categories → see what subject areas exist
    ↓
category_search → browse documents in each area
```

**2. Research a Topic**
```
catalog_search → find relevant documents
    ↓
chunks_search → dive into specific document
    ↓
extract_concepts → understand document's conceptual structure
```

**3. Track a Concept**
```
concept_chunks → find where concept is discussed
    ↓
source_concepts → get source attribution
```

**4. Explore a Domain**
```
list_categories → discover available domains
    ↓
category_search → browse documents in domain
    ↓
list_concepts_in_category → understand domain vocabulary
```

---

## Error Handling

All tools return structured error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Search query is required",
    "field": "text",
    "context": {}
  },
  "timestamp": "2025-11-27T12:00:00.000Z"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input parameters
- `RECORD_NOT_FOUND` - Document/category not found
- `DATABASE_ERROR` - Database operation failed

---

## Rate Limits & Performance

| Operation | Typical Response Time |
|-----------|----------------------|
| `catalog_search` | 50-200ms |
| `broad_chunks_search` | 100-500ms |
| `chunks_search` | 50-150ms |
| `concept_chunks` | 50-200ms |
| `extract_concepts` | 100-300ms |
| `category_search` | 30-130ms |
| `list_categories` | 10-50ms |

Performance depends on database size and query complexity.
