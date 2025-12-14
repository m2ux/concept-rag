# Concept-RAG API Reference

**Schema Version:** v7 (December 2025)  
**Tools:** 10 MCP tools

This document provides JSON input and output schemas for all MCP tools. For tool selection guidance, decision trees, and usage patterns, see [tool-selection-guide.md](tool-selection-guide.md).

---

## Document Discovery

### catalog_search

Search document summaries and metadata to discover relevant documents.

#### Input Schema

```json
{
  "text": "string",
  "debug": "boolean"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |
| `debug` | boolean | ❌ | `false` | Enable debug logging (output schema unchanged) |

#### Output Schema

> **Note:** Output schema is identical whether `debug` is `true` or `false`. Scores and expanded terms are always included.

```json
[
  {
    "source": "string",
    "summary": "string",
    "scores": {
      "hybrid": "string",
      "vector": "string",
      "bm25": "string",
      "title": "string",
      "concept": "string",
      "wordnet": "string"
    },
    "expanded_terms": ["string"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Full file path to document |
| `summary` | string | Document summary text |
| `scores.hybrid` | string | Combined weighted score |
| `scores.vector` | string | Semantic similarity (0-1) |
| `scores.bm25` | string | Keyword relevance (0-1) |
| `scores.title` | string | Title match (0-1) |
| `scores.concept` | string | Concept alignment (0-1) |
| `scores.wordnet` | string | Synonym expansion (0-1) |
| `expanded_terms` | string[] | Expanded query terms |

**Limits:** 10 documents max.

---

## Content Search

### broad_chunks_search

Search across all document chunks using hybrid search.

#### Input Schema

```json
{
  "text": "string",
  "debug": "boolean"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |
| `debug` | boolean | ❌ | `false` | Enable debug logging (output schema unchanged) |

#### Output Schema

> **Note:** Output schema is identical whether `debug` is `true` or `false`. Scores and expanded terms are always included.

```json
[
  {
    "text": "string",
    "source": "string",
    "scores": {
      "hybrid": "string",
      "vector": "string",
      "bm25": "string",
      "concept": "string",
      "wordnet": "string"
    },
    "expanded_terms": ["string"]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Chunk content |
| `source` | string | Source document path |
| `scores.hybrid` | string | Combined score |
| `scores.vector` | string | Semantic similarity |
| `scores.bm25` | string | Keyword relevance |
| `scores.concept` | string | Concept alignment |
| `scores.wordnet` | string | Synonym expansion |
| `expanded_terms` | string[] | Expanded query terms |

**Limits:** 20 chunks max.

---

### chunks_search

Search within a single known document.

#### Input Schema

```json
{
  "text": "string",
  "source": "string",
  "debug": "boolean"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | — | Search query |
| `source` | string | ✅ | — | Full file path of document |
| `debug` | boolean | ❌ | `false` | Enable debug logging (output schema unchanged) |

#### Output Schema

> **Note:** Output schema is identical whether `debug` is `true` or `false`.

```json
[
  {
    "text": "string",
    "source": "string",
    "title": "string",
    "concepts": ["string"],
    "concept_ids": [0]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Chunk content |
| `source` | string | Source document path |
| `title` | string | Document title |
| `concepts` | string[] | Concept names in chunk |
| `concept_ids` | number[] | Concept IDs |

**Limits:** 20 chunks max.

---

## Concept Analysis

### concept_search

Find chunks associated with a concept, organized hierarchically.

#### Input Schema

```json
{
  "concept": "string",
  "limit": 20,
  "source_filter": "string",
  "debug": "boolean"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `concept` | string | ✅ | — | Concept to search for |
| `limit` | number | ❌ | `20` | Max sources to return |
| `source_filter` | string | ❌ | — | Filter by source path |
| `debug` | boolean | ❌ | `false` | Include `page_previews` in sources |

#### Output Schema

##### Standard Output (`debug: false`)

```json
{
  "concept": "string",
  "concept_id": 0,
  "summary": "string",
  "related_concepts": ["string"],
  "synonyms": ["string"],
  "broader_terms": ["string"],
  "narrower_terms": ["string"],
  "sources": [
    {
      "title": "string",
      "pages": [0],
      "match_type": "primary|related",
      "via_concept": "string|null"
    }
  ],
  "chunks": [
    {
      "text": "string",
      "title": "string",
      "page": 0,
      "concept_density": "string",
      "concepts": ["string"]
    }
  ],
  "stats": {
    "total_documents": 0,
    "total_chunks": 0,
    "sources_returned": 0,
    "chunks_returned": 0
  },
  "scores": {
    "hybrid": "string",
    "name": "string",
    "vector": "string",
    "bm25": "string",
    "wordnet": "string"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `concept` | string | Matched concept name |
| `concept_id` | number | Concept identifier |
| `summary` | string | Concept summary |
| `related_concepts` | string[] | Related concepts |
| `synonyms` | string[] | Alternative names |
| `broader_terms` | string[] | More general concepts |
| `narrower_terms` | string[] | More specific concepts |
| `sources[].title` | string | Document title |
| `sources[].pages` | number[] | Page numbers |
| `sources[].match_type` | string | `"primary"` or `"related"` |
| `sources[].via_concept` | string? | Linking concept if related |
| `chunks[].text` | string | Chunk content |
| `chunks[].page` | number | Page number |
| `chunks[].concept_density` | string | Prominence (0.000-1.000) |
| `stats` | object | Search statistics |
| `scores` | object | Hybrid search scores |

##### Debug Output (`debug: true`)

When `debug: true`, each source includes an additional `page_previews` field:

```json
{
  "sources": [
    {
      "title": "string",
      "pages": [0],
      "match_type": "primary|related",
      "via_concept": "string|null",
      "page_previews": ["Preview text from page..."]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sources[].page_previews` | string[] | Text previews from each page (debug only) |

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
  "includeChildren": false,
  "limit": 10
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ✅ | — | Category name, ID, or alias |
| `includeChildren` | boolean | ❌ | `false` | Include child categories |
| `limit` | number | ❌ | `10` | Max documents |

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
