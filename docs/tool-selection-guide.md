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

## The "3 Questions" Method

When an AI agent encounters a user query, ask these 3 questions in order:

### Question 1: "Is this about DOCUMENTS or CONTENT?"
- **Documents** → `catalog_search`
- **Content** → Continue to Q2

### Question 2: "Is this a CONCEPT NAME or a PHRASE/QUESTION?"
- **Concept name** (1-3 words, conceptual) → `concept_search`
- **Phrase/question** → Continue to Q3

### Question 3: "Do I know the SPECIFIC DOCUMENT?"
- **Yes, have source path** → `chunks_search`
- **No** → `broad_chunks_search`

### Special Case: "Does the user want to EXTRACT/LIST concepts?"
- **Yes** → `extract_concepts`

This simple decision tree routes 95% of queries correctly.

---

## Detailed Tool Selection Criteria

### catalog_search

**When to Use:**
- ✅ Finding documents about a specific topic or subject area
- ✅ Looking for documents by title, author, or keywords
- ✅ Need document-level results rather than specific chunks
- ✅ Starting exploratory research to identify relevant sources

**When NOT to Use:**
- ❌ Listing all documents in your library (use `list_categories` then `category_search`)
- ❌ Finding specific information within documents (use `broad_chunks_search` or `chunks_search`)
- ❌ Tracking specific concept usage across chunks (use `concept_search`)

**Query Examples:**
```
✅ "What documents do I have?"
✅ "Sun Tzu Art of War"
✅ "documents about healthcare"
✅ "books by Christopher Alexander"
❌ "how does Sun Tzu describe deception?" (use chunks_search after finding document)
```

---

### broad_chunks_search

**When to Use:**
- ✅ Searching for specific phrases, keywords, or technical terms across all documents
- ✅ Need comprehensive cross-document research on a topic
- ✅ Looking for textual content that may or may not be tagged as a concept
- ✅ Query contains multiple terms or is phrased as a natural language question
- ✅ Want to find content regardless of whether it was identified as a formal concept

**When NOT to Use:**
- ❌ Finding documents by title or getting document overviews (use `catalog_search`)
- ❌ Searching within a single known document (use `chunks_search`)
- ❌ Finding semantically-tagged concept discussions (use `concept_search`)

**Query Examples:**
```
✅ "how do organizations implement innovation processes"
✅ "strategic deception tactics"
✅ "leadership in complex systems"
✅ "user authentication methods"
❌ "innovation" (use concept_search for higher precision)
❌ "documents about leadership" (use catalog_search)
```

---

### chunks_search

**When to Use:**
- ✅ You know which document contains the information
- ✅ Following up from `catalog_search` results with a specific source
- ✅ Focused analysis of one document's content
- ✅ Have the exact source path from a previous search

**When NOT to Use:**
- ❌ Don't know which document to search (use `catalog_search` first)
- ❌ Need to search across multiple documents (use `broad_chunks_search`)
- ❌ Tracking concepts across entire library (use `concept_search`)
- ❌ Don't have the exact source path

**Recommended Workflow:**
```
Step 1: catalog_search("Sun Tzu") → get source path
Step 2: chunks_search("deception", source="<path from step 1>")
```

---

### concept_search

**When to Use:**
- ✅ User asks about a CONCEPT (e.g., "innovation", "leadership", "strategic thinking")
- ✅ Query is a single conceptual term or short phrase (1-3 words)
- ✅ Need semantically validated, high-precision results
- ✅ Researching how/where a concept is discussed across the library

**When NOT to Use:**
- ❌ Query contains multiple phrases or full sentences
- ❌ Looking for exact keyword matches (not semantic concepts)
- ❌ User wants documents, not chunks
- ❌ Searching for specific technical phrases

**Query Examples:**
```
✅ "innovation"
✅ "military strategy"  
✅ "leadership principles"
✅ "organizational learning"
❌ "how do organizations innovate" (use broad_chunks_search)
❌ "leadership in the context of military strategy" (use broad_chunks_search)
```

**Technical Note:** Concept search has 100% precision for concept-tagged results. Uses fuzzy matching and expands to lexically-related concepts.

---

### extract_concepts

**When to Use:**
- ✅ User explicitly asks to "extract", "list", "show", or "export" concepts
- ✅ Creating concept maps or taxonomies
- ✅ Reviewing concept extraction quality
- ✅ Exporting for external analysis

**When NOT to Use:**
- ❌ Searching for information (use search tools)
- ❌ Finding where a concept is discussed (use `concept_search`)
- ❌ General document discovery (use `catalog_search`)

**Query Examples:**
```
✅ "Extract all concepts from Sun Tzu's Art of War"
✅ "List concepts in the healthcare document"
✅ "Show me all concepts from the TRIZ book"
❌ "Find information about innovation" (use concept_search)
```

---

### source_concepts

**When to Use:**
- ✅ "Which books mention [concept]?" or "Where is [concept] discussed?"
- ✅ Finding source attribution for research or citation
- ✅ Understanding concept coverage across your library
- ✅ Finding documents that cover MULTIPLE concepts (pass an array)
- ✅ Need overlap analysis (which sources cover the most concepts)

**When NOT to Use:**
- ❌ Need separate per-concept lists (use `concept_sources`)
- ❌ Finding specific text passages (use `concept_search`)
- ❌ Finding documents by title (use `catalog_search`)

**Query Examples:**
```
✅ "Which books discuss dependency injection?"
✅ "Find sources that mention both TDD and refactoring"
❌ "Find passages about TDD" (use concept_search for content)
```

---

### concept_sources

**When to Use:**
- ✅ Need separate source lists for each concept (not merged)
- ✅ Comparing which sources cover which specific concepts
- ✅ Building per-concept bibliographies or citations
- ✅ Need to know exactly which sources discuss each individual concept

**When NOT to Use:**
- ❌ Need merged/union list with overlap info (use `source_concepts`)
- ❌ Finding specific text passages (use `concept_search`)
- ❌ Finding documents by title (use `catalog_search`)

**Comparison: source_concepts vs concept_sources:**

| Feature | source_concepts | concept_sources |
|---------|-----------------|-----------------|
| Output | Union with concept_indices | Separate arrays |
| Duplicates | Deduplicated | May repeat across arrays |
| Use case | "What covers these?" | "Sources per concept" |
| Sorting | By match count | By input position |

---

### category_search

**When to Use:**
- ✅ Browse documents in a specific domain or subject area
- ✅ Filter library by category
- ✅ List all documents in a category

**When NOT to Use:**
- ❌ Don't know what categories exist (use `list_categories` first)
- ❌ Need content search, not document listing (use `broad_chunks_search`)
- ❌ Looking for a concept, not a category (use `concept_search`)

---

### list_categories

**When to Use:**
- ✅ "What categories do I have?"
- ✅ Explore available subject areas in your library
- ✅ Get category statistics and metadata
- ✅ Category discovery before using `category_search`

**When NOT to Use:**
- ❌ Looking for specific documents (use `catalog_search` or `category_search`)
- ❌ Searching content (use search tools)
- ❌ Already know the category (use `category_search` directly)

---

### list_concepts_in_category

**When to Use:**
- ✅ "What concepts appear in [category] documents?"
- ✅ Analyze conceptual landscape of a domain
- ✅ Find key concepts for a subject area
- ✅ Cross-domain concept discovery

**When NOT to Use:**
- ❌ Need to search for content (use `concept_search` or `broad_chunks_search`)
- ❌ Want documents in a category (use `category_search`)
- ❌ Looking for a specific concept (use `concept_search`)

---

## Decision Logic Examples

### Example 1: "Find information about innovation"
- **Analysis:** Single concept term, asking ABOUT a concept
- **Decision:** `concept_search`
- **Result:** Concept-tagged chunks with 100% relevance

### Example 2: "What do my documents say about innovation and organizational change?"
- **Analysis:** Multi-concept query, natural language phrasing
- **Decision:** `broad_chunks_search`
- **Result:** Top chunks discussing both topics

### Example 3: "What documents do I have about military strategy?"
- **Analysis:** Explicit question about "documents", topic-based
- **Decision:** `catalog_search`
- **Result:** Top documents about military strategy with summaries

### Example 4: "Find where Sun Tzu discusses deception"
- **Analysis:** Specific document mentioned, specific topic
- **Decision:** `catalog_search` → `chunks_search`
- **Workflow:** Find document path, then search within

### Example 5: "Extract concepts from the Art of War"
- **Analysis:** Explicit "extract concepts" request
- **Decision:** `extract_concepts`
- **Result:** Complete concept inventory (100+ concepts)

### Example 6: "What categories do I have?"
- **Analysis:** Asking about categories, not content
- **Decision:** `list_categories`
- **Result:** All categories with statistics

### Example 7: "Show me documents about software engineering"
- **Analysis:** Domain-based filtering, likely a category
- **Decision:** `category_search`
- **Result:** Documents in software engineering category

### Example 8: "Which books discuss TDD?"
- **Analysis:** Source attribution for a concept
- **Decision:** `source_concepts`
- **Result:** All documents containing "TDD" concept

---

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

1. **Exploratory workflow:**
   ```
   catalog_search("topic") → identify relevant documents
   → concept_search("specific concept") → deep dive
   → extract_concepts("document") → get full concept map
   ```

2. **Precise concept research:**
   ```
   concept_search("innovation") → high-precision concept-tagged results
   ```

3. **Comprehensive content search:**
   ```
   broad_chunks_search("how do organizations innovate?") → hybrid search
   ```

4. **Document-focused workflow:**
   ```
   catalog_search("Sun Tzu") → get source path
   → chunks_search("deception", source=path) → focused search
   ```

### ❌ Anti-Patterns

1. **Using broad_chunks_search for single concepts:**
   ```
   ❌ broad_chunks_search("innovation")
   ✅ concept_search("innovation")
   Reason: Concept search has 100% precision for concepts
   ```

2. **Using concept_search for multi-word queries:**
   ```
   ❌ concept_search("how innovation happens in organizations")
   ✅ broad_chunks_search("how innovation happens in organizations")
   Reason: Concept search expects concept terms, not questions
   ```

3. **Using chunks_search without knowing document:**
   ```
   ❌ chunks_search("leadership", source="unknown")
   ✅ catalog_search("leadership") first to identify documents
   Reason: chunks_search requires exact source path
   ```

4. **Using extract_concepts for search:**
   ```
   ❌ extract_concepts("documents about innovation")
   ✅ concept_search("innovation") OR catalog_search("innovation")
   Reason: extract_concepts is for export, not search
   ```

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
