# Tool Selection Guide

This guide assists with selecting which search tool to use based on the user's query intent and requirements.

## Quick Decision Tree

```
START: User asks a question
│
├─ Are they asking "what documents do I have?" or looking for documents by title/author?
│  └─ YES → Use `catalog_search`
│
├─ Are they explicitly asking to "extract", "list", "show", or "export" ALL concepts from a document?
│  └─ YES → Use `extract_concepts`
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
- Scoring breakdown: vector, BM25, concept, WordNet
- Matched concepts and expanded query terms
- May include false positives from keyword matching

**Technical Details:**
- Hybrid search: vector similarity + BM25 keyword matching
- Concept scoring contributes but chunks may have 0.000 concept scores
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
- **concept**: Concept match score (often 0.000)
- **wordnet**: Synonym expansion score (0-1)
- May include false positives

### catalog_search Scoring
- **hybrid**: Combined score with title boost
- **vector**: Semantic similarity (often negative, -0.4 to -0.6)
- **bm25**: Keyword in summary (0-1)
- **title**: Title match (0 or 10.000 - huge boost!)
- **concept**: Usually 0.000
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
| "innovation" | concept_search | Single concept term |
| "Find all mentions of leadership" | concept_search | Concept tracking |
| "How do teams collaborate?" | broad_chunks_search | Natural language question |
| "strategic planning frameworks" | broad_chunks_search | Multi-word phrase |
| "Search Sun Tzu for deception" | chunks_search | Known document |
| "Extract concepts from Art of War" | extract_concepts | Explicit extraction request |
| "documents about healthcare" | catalog_search | Document discovery |
| "organizational learning" | concept_search | Conceptual term |
| "What is the process for user authentication?" | broad_chunks_search | Specific technical question |

---

## Revision History

- **2025-11-13**: Initial version based on empirical comparison analysis
- **Motivation**: Resolved 0% overlap between concept_search and broad_chunks_search results for "innovation" query

---

*This guide is based on empirical analysis showing concept_search achieved 100% relevance vs. broad_chunks_search at 0% relevance for conceptual queries, validating the need for clear tool selection guidance.*

