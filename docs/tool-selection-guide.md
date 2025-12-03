# Tool Selection Guide

This guide assists with selecting which search tool to use based on the user's query intent and requirements.

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
│  └─ YES → Use `concept_search` (highest precision for concepts)
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

## Tool Comparison Matrix

| Tool | Search Scope | Index Type | Precision | Use Case | Query Type |
|------|--------------|------------|-----------|----------|------------|
| **concept_search** | All chunks | Concept-enriched | ⭐⭐⭐⭐⭐ High | Conceptual research | Single concept terms |
| **broad_chunks_search** | All chunks | Hybrid (vector+BM25) | ⭐⭐⭐ Medium | Comprehensive search | Phrases, keywords, questions |
| **catalog_search** | Document summaries | Hybrid + titles | ⭐⭐⭐⭐ High | Document discovery | Titles, topics, authors |
| **chunks_search** | Single document | Hybrid + filter | ⭐⭐⭐⭐ High | Focused document search | Any, within known doc |
| **extract_concepts** | Document metadata | Concept catalog | N/A | Concept export | Document identifier |
| **source_concepts** 🆕 | Concept → sources | Concept index | ⭐⭐⭐⭐⭐ High | Source attribution (union) | Concept name(s) |
| **concept_sources** 🆕 | Concept → sources | Concept index | ⭐⭐⭐⭐⭐ High | Per-concept bibliographies | Concept name(s) |
| **category_search** | Documents in category | Category filter | ⭐⭐⭐⭐⭐ High | Domain-specific browsing | Category name/ID |
| **list_categories** | All categories | Category table | N/A | Category discovery | Optional search filter |
| **list_concepts_in_category** | Category's concepts | Dynamic aggregation | ⭐⭐⭐⭐ High | Domain concept analysis | Category name/ID |

## Detailed Tool Selection Criteria

### 1. `concept_search` - Semantic Concept Tracking

**When to Use:**
- ✅ User asks about a CONCEPT (e.g., "innovation", "leadership", "strategic thinking")
- ✅ Query is a single conceptual term or short conceptual phrase (1-3 words)
- ✅ Need semantically validated, high-precision results
- ✅ Researching how/where a concept is discussed across the library
- ✅ Questions like: "Find information about [concept]", "What is discussed about [concept]?"

**When NOT to Use:**
- ❌ Query contains multiple phrases or full sentences
- ❌ Looking for exact keyword matches (not semantic concepts)
- ❌ User wants documents, not chunks
- ❌ Searching for specific technical phrases or terminology

**Query Examples:**
```
✅ "innovation"
✅ "military strategy"  
✅ "leadership principles"
✅ "organizational learning"
❌ "how do organizations innovate" (use broad_chunks_search)
❌ "leadership in the context of military strategy" (use broad_chunks_search)
```

**What It Returns:**
- Chunks tagged with the specified concept during extraction
- Concept density scores (1.000 = highly relevant)
- Related concepts and semantic categories
- Typically 10-776 results depending on concept prevalence

**Technical Details:**
- Searches concept-enriched index where concepts were semantically validated by Claude Sonnet 4.5
- Loads all chunks and filters in-memory (concepts stored as JSON)
- Returns only chunks explicitly tagged with the concept
- Zero false positives for concept-level queries

---

### 2. `broad_chunks_search` - Comprehensive Hybrid Search

**When to Use:**
- ✅ Searching for PHRASES, KEYWORDS, or TECHNICAL TERMS across all documents
- ✅ Natural language questions spanning multiple concepts
- ✅ Cross-document research requiring comprehensive coverage
- ✅ Looking for content that may not be tagged as a formal concept
- ✅ Need to find ANY mention of specific terminology

**When NOT to Use:**
- ❌ Looking for document titles or document-level results (use catalog_search)
- ❌ Searching within a single known document (use chunks_search)  
- ❌ Need guaranteed concept-level semantic precision (use concept_search)
- ❌ User asks "what documents do I have?" (use catalog_search)

**Query Examples:**
```
✅ "how do organizations implement innovation processes"
✅ "strategic deception tactics"
✅ "leadership in complex systems"
✅ "user authentication methods"
❌ "innovation" (use concept_search for higher precision)
❌ "documents about leadership" (use catalog_search)
```

**What It Returns:**
- Top 10 chunks ranked by hybrid score
- Scoring breakdown: vector, BM25, title, WordNet
- Matched concepts and expanded query terms
- May include false positives from keyword matching

**Technical Details:**
- Hybrid search: vector similarity + BM25 keyword matching
- Title scoring for source path relevance
- WordNet expansion for synonyms
- Searches entire chunks table across all documents

---

### 3. `catalog_search` - Document Discovery

**When to Use:**
- ✅ "What documents do I have?"
- ✅ Finding documents by TITLE, AUTHOR, or SUBJECT
- ✅ Document-level results (not chunk-level)
- ✅ Starting exploratory research to identify sources
- ✅ General topic/domain searches for document discovery

**When NOT to Use:**
- ❌ Need specific information from within documents (use chunks_search or broad_chunks_search)
- ❌ Tracking where a specific concept is used (use concept_search)
- ❌ Deep content analysis (use broad_chunks_search)

**Query Examples:**
```
✅ "What documents do I have?"
✅ "Sun Tzu Art of War"
✅ "documents about healthcare"
✅ "books by Christopher Alexander"
❌ "how does Sun Tzu describe deception?" (use chunks_search after finding document)
```

**What It Returns:**
- Top 5 documents
- 200-character text preview from summary
- Hybrid scores with strong title matching bonus (10.0x weight)
- Matched concepts and expanded terms

**Technical Details:**
- Searches document summaries, not full content
- Title matches receive 10.0 scoring multiplier
- Fast document-level discovery
- Use this first, then drill down with chunks_search

---

### 4. `chunks_search` - Single Document Search

**When to Use:**
- ✅ You KNOW the specific document containing the information
- ✅ Following up from catalog_search results with a specific source
- ✅ Focused analysis within one document
- ✅ Have the exact source path from a previous search

**When NOT to Use:**
- ❌ Don't know which document to search (use catalog_search first)
- ❌ Need to search across multiple documents (use broad_chunks_search)
- ❌ Tracking concepts across entire library (use concept_search)
- ❌ Don't have the exact source path

**Query Examples:**
```
✅ chunks_search("deception tactics", source="/path/to/sun_tzu.pdf")
✅ chunks_search("innovation framework", source="/path/to/triz_book.pdf")
❌ chunks_search("innovation") without knowing which document (use concept_search or broad_chunks_search)
```

**What It Returns:**
- Top 5 chunks from the specified document only
- Hybrid scores with concept and WordNet expansion
- Matched concepts

**Technical Details:**
- Requires exact source path match
- Hybrid search filtered to one document
- Best used in two-step workflow: catalog_search → chunks_search

**Recommended Workflow:**
```
Step 1: catalog_search("Sun Tzu") → get source path
Step 2: chunks_search("deception", source="<path from step 1>")
```

---

### 5. `extract_concepts` - Concept Export

**When to Use:**
- ✅ User explicitly asks to "extract", "list", "show", or "export" concepts
- ✅ Creating concept maps or taxonomies
- ✅ Reviewing concept extraction quality
- ✅ Exporting for external analysis
- ✅ Generating documentation of a document's conceptual content

**When NOT to Use:**
- ❌ Searching for information (use search tools)
- ❌ Finding where a concept is discussed (use concept_search)
- ❌ General document discovery (use catalog_search)

**Query Examples:**
```
✅ "Extract all concepts from Sun Tzu's Art of War"
✅ "List concepts in the healthcare document"
✅ "Show me all concepts from the TRIZ book"
✅ "Export concepts as markdown"
❌ "Find information about innovation" (use concept_search or broad_chunks_search)
```

**What It Returns:**
- Complete concept inventory (80-150+ concepts per document)
- Organized by type: primary_concepts, technical_terms, related_concepts
- Document categories and summary (if requested)
- Available in JSON or markdown format

**Technical Details:**
- Returns metadata, not search results
- One document at a time
- Fast retrieval from catalog table
- No ranking or scoring involved

---

### 6. `source_concepts` - Source Attribution (Union) 🆕

**When to Use:**
- ✅ "Which books mention [concept]?" or "Where is [concept] discussed?"
- ✅ Finding source attribution for research or citation
- ✅ Understanding concept coverage across your library
- ✅ Finding documents that cover MULTIPLE concepts (pass an array)
- ✅ Need a merged/union list showing which sources cover which concepts

**When NOT to Use:**
- ❌ Need separate per-concept lists (use concept_sources)
- ❌ Finding specific text passages (use concept_search)
- ❌ Finding documents by title (use catalog_search)

**Query Examples:**
```
✅ source_concepts(concept="test-driven development")
✅ source_concepts(concept=["tdd", "dependency injection", "ci"])
✅ "Which books discuss dependency injection?"
✅ "Find sources that mention both TDD and refactoring"
❌ "Find passages about TDD" (use concept_search for content)
```

**What It Returns:**
- Union of all sources containing ANY of the input concepts
- Each source includes `concept_indices` array (e.g., `[0, 1]` means matches concepts at index 0 and 1)
- Sources sorted by number of matching concepts (most comprehensive first)
- Title, author, year extracted from filenames
- Optional: summary, primary_concepts, categories from catalog

**Example Output:**
```json
{
  "concepts_searched": ["tdd", "di", "ci"],
  "concepts_found": ["tdd", "di", "ci"],
  "source_count": 34,
  "sources": [
    { "title": "Code That Fits in Your Head", "concept_indices": [0, 1, 2] },
    { "title": "Clean Architecture", "concept_indices": [1] }
  ]
}
```

**Technical Details:**
- Queries concept index for sources field on each concept
- Aggregates and deduplicates across multiple concepts
- Index-based attribution for brevity (maps to concepts_searched array)
- Graceful degradation if catalog metadata unavailable

---

### 7. `concept_sources` - Per-Concept Source Arrays 🆕

**When to Use:**
- ✅ Need separate source lists for each concept (not merged)
- ✅ Building per-concept bibliographies or citations
- ✅ Comparing which sources cover which specific concepts
- ✅ Need to know exactly which sources discuss each individual concept

**When NOT to Use:**
- ❌ Need merged/union list with overlap info (use source_concepts)
- ❌ Finding specific text passages (use concept_search)
- ❌ Finding documents by title (use catalog_search)

**Query Examples:**
```
✅ concept_sources(concept="test-driven development")
✅ concept_sources(concept=["tdd", "di", "ci"])
✅ "List sources for each: TDD, DI, and CI separately"
✅ "What are the sources for dependency injection specifically?"
❌ "Which books cover the most of these topics?" (use source_concepts)
```

**What It Returns:**
- Array where `results[i]` contains sources for `concepts_searched[i]`
- Position in results array corresponds to position in input array
- Each concept may have 0 or more sources
- Title, author, year extracted from filenames

**Example Output:**
```json
{
  "concepts_searched": ["tdd", "di", "ci"],
  "results": [
    [{ "title": "TDD by Example" }, { "title": "Clean Code" }],  // sources for tdd
    [{ "title": "Clean Architecture" }],                          // sources for di
    [{ "title": "Continuous Delivery" }, { "title": "DevOps Handbook" }]  // sources for ci
  ]
}
```

**Technical Details:**
- Queries concept index for each concept independently
- Returns empty array `[]` for concepts not found (preserves position)
- No deduplication - same source may appear in multiple arrays
- Useful for comparing coverage across concepts

**Comparison: source_concepts vs concept_sources:**

| Feature | source_concepts | concept_sources |
|---------|-----------------|-----------------|
| Output | Union with indices | Separate arrays |
| Duplicates | Deduplicated | May repeat across arrays |
| Use case | "What covers these?" | "Sources per concept" |
| Sorting | By match count | By input position |
| Best for | Overlap analysis | Per-concept citations |

---

### 9. `category_search` - Browse Documents by Category

**When to Use:**
- ✅ Browse documents in a specific domain or subject area
- ✅ Filter documents by semantic category
- ✅ Explore what documents exist in a category
- ✅ Category-based discovery and navigation

**When NOT to Use:**
- ❌ Don't know what categories exist (use list_categories first)
- ❌ Need content search, not document listing (use broad_chunks_search)
- ❌ Looking for a concept, not a category (use concept_search)

**Query Examples:**
```
✅ "Show me documents in software engineering"
✅ "What do I have about distributed systems?"
✅ "Browse documents in the healthcare category"
❌ "Find information about API design" (use concept_search - this is a concept, not category)
```

**What It Returns:**
- Documents tagged with the specified category
- Document previews (200 characters)
- Primary concepts for each document
- Category metadata (description, hierarchy, statistics)
- Related categories

**Technical Details:**
- Direct query on `catalog.category_ids` field (hash-based integers)
- Fast filtering (integer comparison, not string matching)
- Categories stored on documents (no derivation needed)
- Can optionally include child categories in hierarchy

**Parameters:**
- `category`: Category name, ID, or alias
- `includeChildren`: Include child categories (default: false)
- `limit`: Max documents to return (default: 10)

---

### 10. `list_categories` - Browse All Categories

**When to Use:**
- ✅ "What categories do I have?"
- ✅ Explore available subject areas in your library
- ✅ Get category statistics and metadata
- ✅ Category discovery before using category_search

**When NOT to Use:**
- ❌ Looking for specific documents (use catalog_search or category_search)
- ❌ Searching content (use search tools)
- ❌ Already know the category (use category_search directly)

**Query Examples:**
```
✅ "What categories are in my library?"
✅ "List all subject areas"
✅ "Show categories related to software"
✅ "What domains are covered?"
❌ "Find documents about software" (use catalog_search or category_search)
```

**What It Returns:**
- All categories with metadata
- Document/chunk/concept counts per category
- Category descriptions and aliases
- Hierarchy information (parent/children)
- Related categories
- Sorted by popularity or name

**Technical Details:**
- Queries categories table (small, <200 entries typically)
- CategoryIdCache provides O(1) metadata access
- Statistics precomputed during ingestion
- Very fast (< 1ms cached, < 10ms uncached)

**Parameters:**
- `sortBy`: 'name', 'popularity', or 'documentCount' (default: 'popularity')
- `limit`: Max categories to return (default: 50)
- `search`: Optional filter by category name/description

---

### 11. `list_concepts_in_category` - Domain Concept Analysis

**When to Use:**
- ✅ "What concepts appear in [category] documents?"
- ✅ Analyze conceptual landscape of a domain
- ✅ Find key concepts for a subject area
- ✅ Cross-domain concept discovery

**When NOT to Use:**
- ❌ Need to search for content (use concept_search or broad_chunks_search)
- ❌ Want documents in a category (use category_search)
- ❌ Looking for a specific concept (use concept_search)

**Query Examples:**
```
✅ "What concepts appear in software engineering documents?"
✅ "List key concepts for distributed systems"
✅ "Show me concepts in the healthcare category"
❌ "Find information about API design" (use concept_search - searching, not listing)
```

**What It Returns:**
- Unique concepts appearing in category's documents
- Concept types (thematic vs terminology)
- Document counts per concept
- Sorted by frequency or alphabetically
- Note: Concepts are category-agnostic (cross-domain)

**Technical Details:**
- Query-time computation through catalog (no redundant storage)
- Aggregates concept_ids from documents in category
- Performance: ~30-130ms for typical libraries
- Dynamic and always up-to-date
- Shows which concepts happen to appear in a category's documents

**Design Note:**
Concepts are category-agnostic (cross-domain entities). This tool shows which concepts appear in a category's documents, not which concepts "belong" to the category. A concept like "optimization" may appear in software, healthcare, and business documents.

**Parameters:**
- `category`: Category name, ID, or alias
- `sortBy`: 'name' or 'documentCount' (default: 'documentCount')
- `limit`: Max concepts to return (default: 50)

---

## Decision Logic Examples

### Example 1: User asks "Find information about innovation"

**Analysis:**
- Single concept term: "innovation"
- Asking ABOUT a concept, not for documents
- Need high-precision semantic results

**Decision:** Use `concept_search`
```
concept_search(concept="innovation", limit=10)
```

**Result:** 10 concept-tagged chunks with 100% relevance

---

### Example 2: User asks "What do my documents say about innovation and organizational change?"

**Analysis:**
- Multi-concept query with natural language phrasing
- "What do documents say" = need content, not document list
- Comprehensive cross-document search needed

**Decision:** Use `broad_chunks_search`
```
broad_chunks_search(text="innovation and organizational change")
```

**Result:** Top 10 chunks discussing both topics, ranked by hybrid score

---

### Example 3: User asks "What documents do I have about military strategy?"

**Analysis:**
- Explicit question about "documents"
- Topic-based document discovery
- Document-level results needed, not chunks

**Decision:** Use `catalog_search`
```
catalog_search(text="military strategy")
```

**Result:** Top 5 documents about military strategy with summaries

---

### Example 4: User asks "Find where Sun Tzu discusses deception"

**Analysis:**
- Specific document mentioned: "Sun Tzu"
- Looking for specific topic within that document
- Two-step workflow needed

**Decision:** Use `catalog_search` → `chunks_search`
```
Step 1: catalog_search(text="Sun Tzu") → get source path
Step 2: chunks_search(text="deception", source="<path>")
```

**Result:** Deception-related passages from Sun Tzu's work

---

### Example 5: User asks "Extract concepts from the Art of War"

**Analysis:**
- Explicit "extract concepts" request
- Wants concept inventory, not search results
- Single document focus

**Decision:** Use `extract_concepts`
```
extract_concepts(document_query="Art of War", format="markdown")
```

**Result:** Complete list of 100+ concepts organized by type

---

### Example 6: User asks "What categories do I have?"

**Analysis:**
- Asking about categories, not documents or content
- Discovery/browsing query
- Wants to know what domains are covered

**Decision:** Use `list_categories`
```
list_categories(sortBy="popularity", limit=20)
```

**Result:** Top 20 categories with statistics (document counts, chunk counts)

---

### Example 7: User asks "Show me documents about software engineering"

**Analysis:**
- Looking for documents (not content chunks)
- "software engineering" is likely a category
- Domain-based filtering

**Decision:** Use `category_search` (if it's a category) or `catalog_search` (general fallback)
```
category_search(category="software engineering", limit=10)
```

**Result:** All documents tagged with "software engineering" category

---

### Example 8: User asks "What concepts are discussed in distributed systems documents?"

**Analysis:**
- Asking for concepts, not content
- Scoped to a category ("distributed systems")
- Domain concept analysis

**Decision:** Use `list_concepts_in_category`
```
list_concepts_in_category(category="distributed systems", sortBy="documentCount", limit=20)
```

**Result:** Top 20 concepts appearing in distributed systems documents (e.g., "consistency", "partitioning", "replication")

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

## Scoring System Comparison

### concept_search Scoring
- **concept_density**: 0.000 to 1.000
- 1.000 = chunk heavily discusses this concept
- Based on semantic tagging during extraction
- All results guaranteed to contain the concept

### broad_chunks_search Scoring  
- **hybrid**: Combined score from multiple signals
- **vector**: Semantic similarity (0-1)
- **bm25**: Keyword frequency/relevance (0-1)
- **title**: Title/source path match (0-1)
- **wordnet**: Synonym expansion score (0-1)
- May include false positives

### catalog_search Scoring
- **hybrid**: Combined score with title boost
- **vector**: Semantic similarity (0-1)
- **bm25**: Keyword in summary (0-1)
- **title**: Title match (0-1, significant boost for matches)
- **wordnet**: Synonym expansion (0-1)

### chunks_search Scoring
- Same as broad_chunks_search but filtered to one source
- Returns top 5 from specified document only

---

## Performance Characteristics

| Tool | Typical Results | Speed | Precision | Recall |
|------|----------------|-------|-----------|--------|
| **concept_search** | 10-776 chunks | Medium† | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **broad_chunks_search** | 10 chunks | Fast | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **catalog_search** | 5 documents | Fast | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **chunks_search** | 5 chunks | Fast | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **extract_concepts** | 80-150 concepts | Instant | N/A | N/A |
| **source_concepts** 🆕 | 1-50 sources | Fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **concept_sources** 🆕 | 1-50 sources/concept | Fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **category_search** | 1-50 documents | Very Fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **list_categories** | 10-50 categories | Instant | N/A | N/A |
| **list_concepts_in_category** | 10-200 concepts | Fast | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

† concept_search loads all chunks into memory for filtering - may be slower on large corpora

---

## Key Technical Differences

### Index Architecture

1. **concept_search**: Queries concept-enriched index
   - Chunks tagged with concepts during Claude Sonnet 4.5 extraction
   - Concepts stored as JSON arrays in chunk metadata
   - Filters by concept tag presence

2. **broad_chunks_search**: Queries base hybrid index
   - Vector embeddings (384-dim, local model)
   - BM25 inverted index
   - Concept scores often 0.000 (not from concept-enriched index)

3. **catalog_search**: Queries document summary index
   - Document-level metadata and summaries
   - Title matching with 10x boost
   - Fast document discovery

4. **chunks_search**: Same as broad_chunks_search + source filter
   - Post-filter by exact source path
   - Best for known-document searches

5. **extract_concepts**: Direct catalog table lookup
   - Retrieves pre-extracted concept metadata
   - No search involved, pure retrieval

---

## Summary: The "3 Questions" Method

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

This simple decision tree will route 95% of queries correctly.

---

## Testing Your Decision Logic

Use these test cases to validate tool selection:

| User Query | Correct Tool | Reasoning |
|------------|--------------|-----------|
| "What documents do I have?" | catalog_search | Asking for documents |
| "What categories do I have?" | list_categories | Asking for categories |
| "innovation" | concept_search | Single concept term |
| "Find all mentions of leadership" | concept_search | Concept tracking |
| "Show me software engineering documents" | category_search | Category-based filtering |
| "What concepts are in distributed systems?" | list_concepts_in_category | Concepts within category |
| "How do teams collaborate?" | broad_chunks_search | Natural language question |
| "strategic planning frameworks" | broad_chunks_search | Multi-word phrase |
| "Search Sun Tzu for deception" | chunks_search | Known document |
| "Extract concepts from Art of War" | extract_concepts | Explicit extraction request |
| "documents about healthcare" | catalog_search | Document discovery |
| "organizational learning" | concept_search | Conceptual term |
| "What is the process for user authentication?" | broad_chunks_search | Specific technical question |
| "Browse real-time systems category" | category_search | Explicit category browsing |
| "Which books discuss TDD?" | source_concepts | Source attribution for concept |
| "Find sources for TDD, DI, and CI" | source_concepts | Multi-concept source lookup |
| "List sources for each concept separately" | concept_sources | Per-concept bibliographies |
| "What books cover the most of these topics?" | source_concepts | Overlap analysis (sorted by match count) |

---

## Revision History

- **2025-11-13**: Initial version based on empirical comparison analysis
- **Motivation**: Resolved 0% overlap between concept_search and broad_chunks_search results for "innovation" query
- **2025-11-20**: Added category search tools (category_search, list_categories, list_concepts_in_category)
- **Purpose**: Enable domain-based browsing and category-scoped concept discovery
- **2025-11-26**: Added concept source attribution tools (source_concepts, concept_sources)
- **Purpose**: Enable "which books mention X?" queries with two complementary output formats

---

*This guide is based on empirical analysis showing concept_search achieved 100% relevance vs. broad_chunks_search at 0% relevance for conceptual queries, validating the need for clear tool selection guidance.*
