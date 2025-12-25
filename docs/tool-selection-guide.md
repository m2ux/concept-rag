# Tool Selection Guide

This guide helps AI agents and developers select the appropriate MCP tool for their query. For JSON input/output schemas, see [api-reference.md](api-reference.md).

---

## Overview

Concept-RAG provides **10 MCP tools** organized into four categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Document Discovery** | `catalog_search` | Find documents by title, author, topic |
| **Content Search** | `broad_chunks_search`, `chunks_search` | Search within document content |
| **Concept Analysis** | `concept_search`, `extract_concepts`, `source_concepts`, `concept_sources` | Analyze and track concepts |
| **Category Browsing** | `category_search`, `list_categories`, `list_concepts_in_category` | Browse by domain/category |

---

## Quick Decision Tree

```
START: User asks a question
│
├─ Are they asking "what documents do I have?" or looking for documents by title/author?
│  └─ YES → Use `catalog_search`
│
├─ Are they asking to browse BY CATEGORY or filter by domain?
│  ├─ "What categories?" → Use `list_categories`
│  ├─ "Documents in [category]" → Use `category_search`
│  └─ "Concepts in [category]" → Use `list_concepts_in_category`
│
├─ Are they explicitly asking to "extract", "list", "show", or "export" ALL concepts from a document?
│  └─ YES → Use `extract_concepts`
│
├─ Are they asking which SOURCES/DOCUMENTS contain a concept?
│  ├─ Need merged list with overlap info → Use `source_concepts`
│  └─ Need separate lists per concept → Use `concept_sources`
│
├─ Are they searching for a CONCEPTUAL TOPIC (single concept name like "innovation", "leadership")?
│  └─ YES → Use `concept_search` (highest precision)
│
├─ Do they already know the SPECIFIC DOCUMENT they want to search within?
│  ├─ YES → Use `chunks_search` (requires source path)
│  └─ NO → Continue...
│
├─ Are they searching for SPECIFIC PHRASES, KEYWORDS, or asking NATURAL LANGUAGE QUESTIONS?
│  └─ YES → Use `broad_chunks_search` (comprehensive cross-document)
│
└─ DEFAULT → Use `catalog_search` for exploration, then follow up with more specific tools
```

---

## Detailed Tool Selection Criteria

### catalog_search

✅ Finding documents about a specific topic or subject area  
✅ Looking for documents by title, author, or keywords  
✅ Need document-level results rather than specific chunks  
✅ Starting exploratory research to identify relevant sources

❌ Listing all documents in your library (use `list_categories` then `category_search`)  
❌ Finding specific information within documents (use `broad_chunks_search` or `chunks_search`)  
❌ Tracking specific concept usage across chunks (use `concept_search`)

---

### broad_chunks_search

✅ Searching for specific phrases, keywords, or technical terms across all documents  
✅ Need comprehensive cross-document research on a topic  
✅ Looking for textual content that may or may not be tagged as a concept  
✅ Query contains multiple terms or is phrased as a natural language question  
✅ Want to find content regardless of whether it was identified as a formal concept

❌ Finding documents by title or getting document overviews (use `catalog_search`)  
❌ Searching within a single known document (use `chunks_search`)  
❌ Finding semantically-tagged concept discussions (use `concept_search`)

---

### chunks_search

✅ You know which document contains the information  
✅ Following up from `catalog_search` results with a specific source  
✅ Focused analysis of one document's content  
✅ Have the exact source path from a previous search

❌ Don't know which document to search (use `catalog_search` first)  
❌ Need to search across multiple documents (use `broad_chunks_search`)  
❌ Tracking concepts across entire library (use `concept_search`)  
❌ Don't have the exact source path

---

### concept_search

✅ User asks about a CONCEPT (e.g., "innovation", "leadership", "strategic thinking")  
✅ Query is a single conceptual term or short phrase (1-3 words)  
✅ Need semantically validated, high-precision results  
✅ Researching how/where a concept is discussed across the library

❌ Query contains multiple phrases or full sentences  
❌ Looking for exact keyword matches (not semantic concepts)  
❌ User wants documents, not chunks  
❌ Searching for specific technical phrases

---

### extract_concepts

✅ User explicitly asks to "extract", "list", "show", or "export" concepts  
✅ Creating concept maps or taxonomies  
✅ Reviewing concept extraction quality  
✅ Exporting for external analysis

❌ Searching for information (use search tools)  
❌ Finding where a concept is discussed (use `concept_search`)  
❌ General document discovery (use `catalog_search`)

---

### source_concepts

✅ "Which books mention [concept]?" or "Where is [concept] discussed?"  
✅ Finding source attribution for research or citation  
✅ Understanding concept coverage across your library  
✅ Finding documents that cover MULTIPLE concepts (pass an array)  
✅ Need overlap analysis (which sources cover the most concepts)

❌ Need separate per-concept lists (use `concept_sources`)  
❌ Finding specific text passages (use `concept_search`)  
❌ Finding documents by title (use `catalog_search`)

---

### concept_sources

✅ Need separate source lists for each concept (not merged)  
✅ Comparing which sources cover which specific concepts  
✅ Building per-concept bibliographies or citations  
✅ Need to know exactly which sources discuss each individual concept

❌ Need merged/union list with overlap info (use `source_concepts`)  
❌ Finding specific text passages (use `concept_search`)  
❌ Finding documents by title (use `catalog_search`)

---

### category_search

✅ Browse documents in a specific domain or subject area  
✅ Filter library by category  
✅ List all documents in a category

❌ Don't know what categories exist (use `list_categories` first)  
❌ Need content search, not document listing (use `broad_chunks_search`)  
❌ Looking for a concept, not a category (use `concept_search`)

---

### list_categories

✅ "What categories do I have?"  
✅ Explore available subject areas in your library  
✅ Get category statistics and metadata  
✅ Category discovery before using `category_search`

❌ Looking for specific documents (use `catalog_search` or `category_search`)  
❌ Searching content (use search tools)  
❌ Already know the category (use `category_search` directly)

---

### list_concepts_in_category

✅ "What concepts appear in [category] documents?"  
✅ Analyze conceptual landscape of a domain  
✅ Find key concepts for a subject area  
✅ Cross-domain concept discovery

❌ Need to search for content (use `concept_search` or `broad_chunks_search`)  
❌ Want documents in a category (use `category_search`)  
❌ Looking for a specific concept (use `concept_search`)

---

## Common Workflows

### 1. Explore Your Library
```
list_categories → see what subject areas exist
    ↓
category_search → browse documents in each area
```

### 2. Research a Topic
```
catalog_search → find relevant documents
    ↓
chunks_search → dive into specific document
    ↓
extract_concepts → understand document's conceptual structure
```

### 3. Discover Concepts
```
concept_search → find concepts by description
    ↓
concept_search → find where concept is discussed
    ↓
source_concepts → get source attribution
```

### 4. Explore a Domain
```
list_categories → discover available domains
    ↓
category_search → browse documents in domain
    ↓
list_concepts_in_category → understand domain vocabulary
```

---

## Tool Selection Validation Test Cases

| User Query | Correct Tool | Reasoning |
|------------|--------------|-----------|
| "What documents do I have?" | `list_categories` | Asking for library overview |
| "What categories do I have?" | `list_categories` | Asking for categories |
| "innovation" | `concept_search` | Single concept term |
| "Find all mentions of leadership" | `concept_search` | Concept tracking |
| "Show me software engineering documents" | `category_search` | Category-based filtering |
| "What concepts are in distributed systems?" | `list_concepts_in_category` | Concepts within category |
| "How do teams collaborate?" | `broad_chunks_search` | Natural language question |
| "strategic planning frameworks" | `broad_chunks_search` | Multi-word phrase |
| "Search Sun Tzu for deception" | `chunks_search` | Known document |
| "Extract concepts from Art of War" | `extract_concepts` | Explicit extraction request |
| "documents about healthcare" | `catalog_search` | Document discovery |
| "organizational learning" | `concept_search` | Conceptual term |
| "What is the process for user authentication?" | `broad_chunks_search` | Specific technical question |
| "Browse real-time systems category" | `category_search` | Explicit category browsing |
| "Which books discuss TDD?" | `source_concepts` | Source attribution for concept |
| "Find sources for TDD, DI, and CI" | `source_concepts` | Multi-concept source lookup |
| "List sources for each concept separately" | `concept_sources` | Per-concept bibliographies |
| "What books cover the most of these topics?" | `source_concepts` | Overlap analysis |

---

*This guide is based on empirical analysis showing concept_search achieved 100% relevance vs. broad_chunks_search at 0% relevance for conceptual queries, validating the need for clear tool selection guidance.*
