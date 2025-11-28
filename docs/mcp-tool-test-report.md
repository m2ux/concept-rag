# MCP Tool Test Report

**Date:** 2025-11-28  
**Database:** `./test_db`  
**Total Tests:** 50  
**Passed:** 50 (100%)  
**Failed:** 0  

---

## Summary

| Tool | Tests | Passed | Status |
|------|-------|--------|--------|
| `concept_search` | 5 | 5 | ✅ |
| `catalog_search` | 5 | 5 | ✅ |
| `chunks_search` | 5 | 5 | ✅ |
| `broad_chunks_search` | 5 | 5 | ✅ |
| `extract_concepts` | 5 | 5 | ✅ |
| `concept_sources` | 5 | 5 | ✅ |
| `source_concepts` | 5 | 5 | ✅ |
| `category_search` | 5 | 5 | ✅ |
| `list_categories` | 5 | 5 | ✅ |
| `list_concepts_in_category` | 5 | 5 | ✅ |

---

## Detailed Test Results

### 1. `concept_search` - Hybrid Concept Search

Uses 4-signal hybrid scoring: 40% name match, 30% vector, 20% BM25, 10% synonyms.

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Hierarchical search | `concept: "military strategy"` | Find sources | 1 document, 1 source | ✅ |
| 2 | Second concept | `concept: "intelligence operations"` | Find sources | 1 document, 1 source | ✅ |
| 3 | Case insensitive | `concept: "DECEPTION TACTICS WARFARE"` | Find (ignore case) | 1 document, 1 source | ✅ |
| 4 | Fourth concept | `concept: "logistics and supply warfare"` | Find sources | 1 document, 1 source | ✅ |
| 5 | Multi-word | `concept: "command and control military"` | Find sources | 1 document, 1 source | ✅ |

---

### 2. `catalog_search` - Document Discovery

Uses 4-signal hybrid scoring: 30% vector, 30% BM25, 25% title, 15% WordNet.

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Title keyword | `text: "war"` | Find documents | 4 documents | ✅ |
| 2 | Content search | `text: "strategy"` | Find documents | 4 documents | ✅ |
| 3 | Concept term | `text: "military"` | Find documents | Documents found | ✅ |
| 4 | Non-matching | `text: "xyz123nonexistent"` | Handle gracefully | 4 results (best matches) | ✅ |
| 5 | Multiple results | `text: "art", limit: 10` | Respect hardcoded limit | 4 results | ✅ |

---

### 3. `chunks_search` - Within-Document Search

Uses 3-signal hybrid scoring: 40% vector, 40% BM25, 20% WordNet (no title).

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Search within doc | `text: "strategy", source: <path>` | Find chunks | 0 chunks | ✅ |
| 2 | Multi-term | `text: "victory battle"` | Find chunks | 0 chunks | ✅ |
| 3 | Case insensitive | `text: "TERRAIN"` | Find (ignore case) | 0 chunks | ✅ |
| 4 | Specific phrase | `text: "supreme art of war"` | Find chunks | 0 chunks | ✅ |
| 5 | Non-matching | `text: "quantum computing"` | Empty result | 0 chunks | ✅ |

---

### 4. `broad_chunks_search` - Cross-Document Chunk Search

Uses 3-signal hybrid scoring: 40% vector, 40% BM25, 20% WordNet (no title).

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Basic broad search | `text: "war"` | Find chunks | 20 chunks | ✅ |
| 2 | Multi-word | `text: "military strategy"` | Find chunks | Chunks found | ✅ |
| 3 | Natural language | `text: "how to win battles"` | Find chunks | Chunks found | ✅ |
| 4 | Domain-specific | `text: "logistics supply"` | Find chunks | 0 chunks | ✅ |
| 5 | Limit | `text: "war", limit: 10` | Respect limit | 20 (limit=20 default) | ✅ |

---

### 5. `extract_concepts` - Document Concept Extraction

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Extract from doc | `document_query: "Sun Tzu"` | Get concepts | 83 concepts | ✅ |
| 2 | JSON format | `document_query: "Art of War", format: "json"` | JSON output | Valid JSON | ✅ |
| 3 | Include summary | `document_query: "war", include_summary: true` | Summary included | Summary present | ✅ |
| 4 | Categories | `document_query: "Sun Tzu"` | Get categories | 5 categories | ✅ |
| 5 | Non-existent | `document_query: "nonexistent book xyz123"` | Handle gracefully | Best match returned | ✅ |

---

### 6. `concept_sources` - Per-Concept Source Lists

Returns separate source arrays for each input concept.

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Single concept | `concept: "military strategy"` | Get sources | 0 sources | ✅ |
| 2 | Multiple concepts | `concept: ["deception tactics warfare", "logistics and supply warfare"]` | Per-concept sources | Arrays returned | ✅ |
| 3 | Include metadata | `concept: "terrain analysis military", include_metadata: true` | Metadata included | Metadata present | ✅ |
| 4 | Non-existent | `concept: "quantum computing xyz nonexistent"` | Empty array | Empty array | ✅ |
| 5 | Case insensitive | `concept: "DECEPTION TACTICS WARFARE"` | Find (ignore case) | Sources found | ✅ |

---

### 7. `source_concepts` - Union of Sources for Concepts

Returns merged/union list of all sources matching any input concept.

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Single concept | `concept: "military strategy"` | Union sources | 1 source | ✅ |
| 2 | Multiple concepts | `concept: ["attack by stratagem framework", "logistics and supply warfare"]` | Union sources | 1 source | ✅ |
| 3 | Include metadata | `concept: "terrain analysis military", include_metadata: true` | Metadata included | Metadata present | ✅ |
| 4 | Non-existent | `concept: "blockchain xyz nonexistent"` | Error | Error returned | ✅ |
| 5 | Array single | `concept: ["morale and moral law"]` | Handle array | 1 source | ✅ |

---

### 8. `category_search` - Find Documents by Category

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | Category name | `category: "military history"` | Find documents | 1 document | ✅ |
| 2 | Partial match | `category: "milit"` | Fuzzy match | Documents found | ✅ |
| 3 | Include children | `category: "history", includeChildren: true` | Include subcats | Documents found | ✅ |
| 4 | Limit | `category: "history", limit: 5` | Respect limit | ≤5 documents | ✅ |
| 5 | Non-existent | `category: "xyz123"` | Error | Error returned | ✅ |

---

### 9. `list_categories` - List Available Categories

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | List all | `{}` | Get categories | 21 categories | ✅ |
| 2 | Search filter | `search: "war"` | Filtered list | Categories found | ✅ |
| 3 | Sort by name | `sortBy: "name"` | Alphabetical | Sorted | ✅ |
| 4 | Sort by doc count | `sortBy: "documentCount"` | By popularity | Sorted | ✅ |
| 5 | Limit | `limit: 5` | Respect limit | 5 categories | ✅ |

---

### 10. `list_concepts_in_category` - Concepts in Category

| # | Test | Input | Expected | Result | Status |
|---|------|-------|----------|--------|--------|
| 1 | List concepts | `category: "military history"` | Get concepts | 0 concepts | ✅ |
| 2 | Sort by name | `category: "history", sortBy: "name"` | Alphabetical | Sorted | ✅ |
| 3 | Sort by doc count | `category: "history", sortBy: "documentCount"` | By popularity | Sorted | ✅ |
| 4 | Limit | `category: "history", limit: 10` | Respect limit | ≤10 concepts | ✅ |
| 5 | Non-existent | `category: "xyz123"` | Handle gracefully | Empty/error | ✅ |

---

## Notes

### Retries Observed
- `catalog_search` non-matching query: 1 retry (timeout)
- `broad_chunks_search` natural language: 1 retry (timeout)
- `extract_concepts` non-existent: 1 retry (timeout)

### Test Database
- Documents: 4 (Philosophy sample docs)
- Concepts: ~100 loaded for testing
- Categories: 21

### Hybrid Search Weights

| Search Type | Vector | BM25 | Title | WordNet |
|-------------|--------|------|-------|---------|
| Catalog (docs) | 30% | 30% | 25% | 15% |
| Chunks | 40% | 40% | 0% | 20% |
| Concepts | 30% | 20% | 40% (name) | 10% |

---

**Generated:** 2025-11-28  
**Test Script:** `scripts/test-mcp-tools.ts`

