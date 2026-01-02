# Concept-RAG API Reference

**Schema Version:** v8 (December 2025)  
**Tools:** 12 MCP tools

This document provides JSON input and output schemas for all MCP tools. For tool selection guidance, decision trees, and usage patterns, see [tool-selection-guide.md](tool-selection-guide.md).

---

## Document Discovery

### catalog_search

Search document summaries and metadata to discover relevant documents.

#### Input Schema

```json
{
  "text": "string"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |

> **Debug Output:** Enable via `DEBUG_SEARCH=true` environment variable.

#### Output Schema

```json
[
  {
    "catalog_id": 0,
    "title": "string",
    "summary": "string",
    "score": "string",
    "expanded_terms": ["string"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `catalog_id` | number | Document ID for subsequent tool calls |
| `title` | string | Document title |
| `summary` | string | Document summary text |
| `score` | string | Combined hybrid score (0.000-1.000) |
| `expanded_terms` | string[] | Expanded query terms |

**Result Filtering:** Gap detection (elbow method) - returns high-scoring cluster based on score gaps, not a fixed count. Typically 1-10 results depending on query specificity.

#### Additional Fields with Debug Enabled

When `DEBUG_SEARCH=true`, each result includes score component breakdown:

| Field | Type | Description |
|-------|------|-------------|
| `score_components.vector` | string | Semantic similarity (0-1) |
| `score_components.bm25` | string | Keyword relevance (0-1) |
| `score_components.title` | string | Title match (0-1) |
| `score_components.concept` | string | Concept alignment (0-1) |
| `score_components.wordnet` | string | Synonym expansion (0-1) |

---

## Content Search

### broad_chunks_search

Search across all document chunks using hybrid search.

#### Input Schema

```json
{
  "text": "string"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |

> **Debug Output:** Enable via `DEBUG_SEARCH=true` environment variable.

#### Output Schema

```json
[
  {
    "catalog_id": 0,
    "title": "string",
    "text": "string",
    "page_number": 0,
    "concepts": ["string"],
    "score": "string",
    "expanded_terms": ["string"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `catalog_id` | number | Document ID for subsequent tool calls |
| `title` | string | Document title |
| `text` | string | Chunk content |
| `page_number` | number | Page number in document |
| `concepts` | string[] | Concept names in chunk |
| `score` | string | Combined hybrid score (0.000-1.000) |
| `expanded_terms` | string[] | Expanded query terms |

**Result Filtering:** Gap detection (elbow method) - returns high-scoring cluster based on score gaps, not a fixed count. Typically 1-30 results depending on query specificity.

#### Additional Fields with Debug Enabled

When `DEBUG_SEARCH=true`, each result includes score component breakdown:

| Field | Type | Description |
|-------|------|-------------|
| `score_components.vector` | string | Semantic similarity (0-1) |
| `score_components.bm25` | string | Keyword relevance (0-1) |
| `score_components.concept` | string | Concept alignment (0-1) |
| `score_components.wordnet` | string | Synonym expansion (0-1) |

---

### chunks_search

Search within a single known document.

#### Input Schema

```json
{
  "text": "string",
  "catalog_id": 0
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |
| `catalog_id` | number | ✅ | — | Document ID from `catalog_search` |

> **Note:** First use `catalog_search` to find the document and get its `catalog_id`.

#### Output Schema

```json
[
  {
    "title": "string",
    "text": "string",
    "concepts": ["string"],
    "concept_ids": [0]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Document title |
| `text` | string | Chunk content |
| `concepts` | string[] | Concept names in chunk |
| `concept_ids` | number[] | Concept IDs |

**Limits:** Top chunks from the document (fixed limit for single-document search).

---

## Concept Analysis

### concept_search

Find chunks associated with a concept, organized hierarchically.

#### Input Schema

```json
{
  "concept": "string",
  "title_filter": "string"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string | ✅ | — | Concept to search for |
| `title_filter` | string | ❌ | — | Filter by document title |

**Result Filtering:** Returns all matching sources and chunks (no fixed limit).

> **Debug Output:** Enable via `DEBUG_SEARCH=true` environment variable. When enabled, includes `page_previews` in sources.

#### Output Schema

```json
{
  "concept": "string",
  "concept_id": 0,
  "summary": "string",
  "image_ids": [0],
  "related_concepts": ["string"],
  "synonyms": ["string"],
  "broader_terms": ["string"],
  "narrower_terms": ["string"],
  "sources": [
    {
      "catalog_id": 0,
      "title": "string",
      "pages": [0],
      "match_type": "primary|related",
      "via_concept": "string|null"
    }
  ],
  "chunks": [
    {
      "catalog_id": 0,
      "title": "string",
      "text": "string",
      "page": 0,
      "concept_density": "string",
      "concepts": ["string"]
    }
  ],
  "stats": {
    "total_documents": 0,
    "total_chunks": 0,
    "sources_returned": 0,
    "chunks_returned": 0,
    "images_found": 0
  },
  "score": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `concept` | string | Matched concept name |
| `concept_id` | number | Concept identifier |
| `summary` | string | Concept summary |
| `image_ids` | number[] | Visual IDs for `get_visuals` |
| `related_concepts` | string[] | Related concepts |
| `synonyms` | string[] | Alternative names |
| `broader_terms` | string[] | More general concepts |
| `narrower_terms` | string[] | More specific concepts |
| `sources[].catalog_id` | number | Document ID |
| `sources[].title` | string | Document title |
| `sources[].pages` | number[] | Page numbers |
| `sources[].match_type` | string | `"primary"` or `"related"` |
| `sources[].via_concept` | string? | Linking concept if related |
| `chunks[].catalog_id` | number | Document ID |
| `chunks[].title` | string | Document title |
| `chunks[].text` | string | Chunk content |
| `chunks[].page` | number | Page number |
| `chunks[].concept_density` | string | Prominence (0.000-1.000) |
| `stats` | object | Search statistics |
| `stats.images_found` | number | Count of associated visuals |
| `score` | string | Combined hybrid score (0.000-1.000) |

#### Additional Fields with Debug Enabled

When `DEBUG_SEARCH=true` environment variable is set:

**Sources include page previews:**

| Field | Type | Description |
|-------|------|-------------|
| `sources[].page_previews` | string[] | Text previews from each page |

**Score component breakdown is included:**

| Field | Type | Description |
|-------|------|-------------|
| `score_components.name` | string | Concept name match (0-1) |
| `score_components.vector` | string | Semantic similarity (0-1) |
| `score_components.bm25` | string | Keyword relevance (0-1) |
| `score_components.wordnet` | string | Synonym expansion (0-1) |

---

### extract_concepts

Export concepts from a specific document.

#### Input Schema

```json
{
  "document_query": "string",
  "format": "json|markdown",
  "include_summary": true
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `document_query` | string | ✅ | — | Document title or keywords |
| `format` | string | ❌ | `"json"` | Output format |
| `include_summary` | boolean | ❌ | `true` | Include summary |

#### Output Schema (JSON format)

```json
{
  "document": "string",
  "document_hash": "string",
  "total_concepts": 0,
  "primary_concepts": ["string"],
  "related_concepts": ["string"],
  "categories": ["string"],
  "summary": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `document` | string | Document path |
| `document_hash` | string | Document hash |
| `total_concepts` | number | Total concept count |
| `primary_concepts` | string[] | Primary concepts |
| `related_concepts` | string[] | Related concepts |
| `categories` | string[] | Document categories |
| `summary` | string | Document summary |

#### Output Schema (Markdown format)

When `format: "markdown"`, returns a formatted markdown string with tables.

---

### source_concepts

Find documents where concept(s) appear. Returns merged/union list.

#### Input Schema

```json
{
  "concept": "string | string[]",
  "include_metadata": true
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string \| string[] | ✅ | — | Concept(s) to find |
| `include_metadata` | boolean | ❌ | `true` | Include document metadata |

#### Output Schema

```json
{
  "concepts_searched": ["string"],
  "concepts_found": ["string"],
  "concepts_not_found": ["string"],
  "source_count": 0,
  "sources": [
    {
      "title": "string",
      "author": "string",
      "year": "string",
      "concept_indices": [0],
      "source_path": "string",
      "summary": "string",
      "primary_concepts": ["string"],
      "categories": ["string"]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `concepts_searched` | string[] | Input concepts |
| `concepts_found` | string[] | Found concepts |
| `concepts_not_found` | string[] | Not found concepts |
| `source_count` | number | Total sources |
| `sources[].title` | string | Document title |
| `sources[].author` | string | Author (if available) |
| `sources[].year` | string | Year (if available) |
| `sources[].concept_indices` | number[] | Indices into concepts_searched |
| `sources[].source_path` | string | File path |
| `sources[].summary` | string | Summary (if include_metadata) |
| `sources[].primary_concepts` | string[] | Top concepts |
| `sources[].categories` | string[] | Categories |

---

### concept_sources

Get sources for each concept separately (per-concept arrays).

#### Input Schema

```json
{
  "concept": "string | string[]",
  "include_metadata": true
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string \| string[] | ✅ | — | Concept(s) to find |
| `include_metadata` | boolean | ❌ | `true` | Include metadata |

#### Output Schema

```json
{
  "concepts_searched": ["string"],
  "results": [
    [
      {
        "title": "string",
        "author": "string",
        "year": "string",
        "source_path": "string",
        "summary": "string",
        "primary_concepts": ["string"],
        "categories": ["string"]
      }
    ]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `concepts_searched` | string[] | Input concepts (order preserved) |
| `results` | array[] | `results[i]` = sources for `concepts_searched[i]` |

---

## Category Browsing

### category_search

Find documents by category.

#### Input Schema

```json
{
  "category": "string",
  "includeChildren": false
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ✅ | — | Category name, ID, or alias |
| `includeChildren` | boolean | ❌ | `false` | Include child categories |

**Result Filtering:** Returns all documents in the category (no fixed limit).

#### Output Schema

```json
{
  "category": {
    "id": 0,
    "name": "string",
    "description": "string",
    "hierarchy": ["string"],
    "aliases": ["string"],
    "relatedCategories": [{"id": 0, "name": "string"}]
  },
  "statistics": {
    "totalDocuments": 0,
    "totalChunks": 0,
    "totalConcepts": 0,
    "documentsReturned": 0
  },
  "documents": [
    {
      "title": "string",
      "preview": "string",
      "primaryConcepts": ["string"]
    }
  ],
  "includeChildren": false,
  "categoriesSearched": ["string"]
}
```

---

### list_categories

List all available categories.

#### Input Schema

```json
{
  "sortBy": "name|popularity|documentCount",
  "limit": 50,
  "search": "string"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sortBy` | string | ❌ | `"popularity"` | Sort order |
| `limit` | number | ❌ | `50` | Max categories |
| `search` | string | ❌ | — | Filter by name |

#### Output Schema

```json
{
  "summary": {
    "totalCategories": 0,
    "categoriesReturned": 0,
    "rootCategories": 0,
    "totalDocuments": 0,
    "sortedBy": "string",
    "searchQuery": "string|null"
  },
  "categories": [
    {
      "id": 0,
      "name": "string",
      "description": "string",
      "aliases": ["string"],
      "parent": "string|null",
      "hierarchy": ["string"],
      "statistics": {
        "documents": 0,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": ["string"]
    }
  ]
}
```

---

### list_concepts_in_category

Find concepts in a category's documents.

#### Input Schema

```json
{
  "category": "string",
  "sortBy": "name|documentCount",
  "limit": 50
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ✅ | — | Category name, ID, or alias |
| `sortBy` | string | ❌ | `"documentCount"` | Sort order |
| `limit` | number | ❌ | `50` | Max concepts |

#### Output Schema

```json
{
  "category": {
    "id": 0,
    "name": "string",
    "description": "string",
    "hierarchy": ["string"]
  },
  "statistics": {
    "totalDocuments": 0,
    "totalChunks": 0,
    "totalUniqueConcepts": 0,
    "conceptsReturned": 0
  },
  "concepts": [
    {
      "id": 0,
      "name": "string",
      "documentCount": 0,
      "weight": 0.0
    }
  ],
  "sortedBy": "string",
  "note": "string"
}
```

---

## Visual Content

### get_visuals

Retrieve visual content (diagrams, charts, tables, figures) from documents.

#### Input Schema

```json
{
  "ids": [0],
  "catalog_id": 0,
  "visual_type": "diagram|flowchart|chart|table|figure",
  "concept": "string",
  "limit": 20
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ids` | number[] | ❌ | — | Retrieve specific visuals by ID (from `concept_search` `image_ids`) |
| `catalog_id` | number | ❌ | — | Filter by document ID |
| `visual_type` | string | ❌ | — | Filter by type |
| `concept` | string | ❌ | — | Filter by associated concept |
| `limit` | number | ❌ | `20` | Maximum results |

> **Note:** Use `ids` to fetch visuals returned by `concept_search` `image_ids`. Use `catalog_id` to browse all visuals in a document.

#### Output Schema

```json
{
  "visuals": [
    {
      "id": 0,
      "catalog_id": 0,
      "catalog_title": "string",
      "visual_type": "string",
      "page_number": 0,
      "description": "string",
      "image_path": "string",
      "concepts": ["string"]
    }
  ],
  "total_returned": 0,
  "filters_applied": {}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `visuals[].id` | number | Visual ID |
| `visuals[].catalog_id` | number | Document ID |
| `visuals[].catalog_title` | string | Document title |
| `visuals[].visual_type` | string | Type: diagram, flowchart, chart, table, figure |
| `visuals[].page_number` | number | Page in document |
| `visuals[].description` | string | Semantic description |
| `visuals[].image_path` | string | Path to image file |
| `visuals[].concepts` | string[] | Associated concept names |
| `total_returned` | number | Count of visuals returned |
| `filters_applied` | object | Applied filter parameters |

---

## Error Schema

All tools return errors in this format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "field": "string",
    "type": "string",
    "context": {}
  },
  "timestamp": "string"
}
```

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input parameters |
| `RECORD_NOT_FOUND` | Document/category not found |
| `CONCEPT_NOT_FOUND` | Concept not found |
| `DATABASE_ERROR` | Database operation failed |
| `SEARCH_ERROR` | Search operation failed |

---

## Scoring Weights

| Search Type | Vector | BM25 | Title | Concept | WordNet |
|-------------|--------|------|-------|---------|---------|
| catalog_search | 30% | 25% | 20% | 15% | 10% |
| broad_chunks_search | 35% | 30% | — | 20% | 15% |
| chunks_search | 35% | 30% | — | 20% | 15% |
| concept_search | 30% | 20% | 40% (name) | — | 10% |

---

## Performance

| Tool | Typical Response Time |
|------|----------------------|
| `catalog_search` | 50-200ms |
| `broad_chunks_search` | 100-500ms |
| `chunks_search` | 50-150ms |
| `concept_search` | 50-200ms |
| `extract_concepts` | 100-300ms |
| `source_concepts` | 50-150ms |
| `concept_sources` | 50-200ms |
| `category_search` | 30-130ms |
| `list_categories` | 10-50ms |
| `list_concepts_in_category` | 30-100ms |
| `get_visuals` | 20-100ms |
