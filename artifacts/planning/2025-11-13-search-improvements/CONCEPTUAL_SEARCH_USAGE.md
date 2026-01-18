# 🧠 Conceptual Search - Usage Guide

## Overview

The conceptual search system enhances document retrieval by combining:
- **Corpus-driven concepts** (LLM-extracted, domain-specific)
- **WordNet semantic relationships** (synonyms, hierarchies)
- **Hybrid scoring** (vector + BM25 + title + concept + WordNet)

## 🚀 Quick Start

### 1. Seed Database with Concept Extraction

```bash
# Build the project
npm run build

# Seed with concept extraction (requires OPENROUTER_API_KEY)
export OPENROUTER_API_KEY=your_key_here
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.lance_mcp \
  --filesdir ~/Documents/sample-docs \
  --overwrite
```

**What happens during seeding:**
- Extracts primary concepts and technical terms from each document
- Builds concept index with co-occurrence relationships
- Creates three tables: `catalog`, `chunks`, `concepts`

### 2. Configure MCP Client

**For Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "lancedb-conceptual": {
      "command": "node",
      "args": [
        "/path/to/lance-mcp/dist/conceptual_index.js",
        "/home/username/.lance_mcp"
      ]
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "lancedb-conceptual": {
      "command": "node",
      "args": [
        "/path/to/lance-mcp/dist/conceptual_index.js",
        "/home/username/.lance_mcp"
      ]
    }
  }
}
```

### 3. Restart Your MCP Client

```bash
# For Cursor
pkill -f Cursor && cursor

# For Claude Desktop
pkill -f Claude && open -a "Claude"
```

## 📖 Usage Examples

### Example 1: Basic Search with Synonym Expansion

**Query:** "thread synchronization mechanisms"

**What happens:**
1. **Query Expansion:**
   - Original: `["thread", "synchronization", "mechanisms"]`
   - Corpus adds: `["mutex", "semaphore", "lock", "race condition"]`
   - WordNet adds: `["concurrent", "parallel", "process"]`
   - Total: 10+ terms

2. **Search Results:**
   - Documents about mutexes rank high (concept match)
   - Documents about "concurrent programming" rank high (WordNet synonym)
   - Documents with "thread" in title get bonus (title match)

**Example conversation:**
```
You: Find documents about thread synchronization mechanisms

AI: [Searches with conceptual expansion]
    Found 3 documents:
    
    1. Concurrent_Programming_Patterns.pdf (score: 0.87)
       Matched concepts: mutex, semaphore, race condition
       
    2. Operating_Systems_Fundamentals.pdf (score: 0.82)
       Matched concepts: synchronization, deadlock, thread safety
       
    3. Java_Concurrency_in_Practice.pdf (score: 0.76)
       Matched concepts: concurrent, lock, atomic operations
```

### Example 2: Technical Term Search

**Query:** "React hooks useState"

**What happens:**
1. **Query Expansion:**
   - Original: `["react", "hooks", "usestate"]`
   - Corpus adds: `["useEffect", "component", "state management"]`
   - WordNet: (no results for React/hooks - domain-specific)
   - Uses corpus-only expansion

2. **Result:**
   - Finds documents about React even if they don't say "hooks"
   - Finds documents about state management
   - Related concepts help find comprehensive results

### Example 3: Concept-Based Discovery

**Query:** "How do I prevent race conditions?"

**Current system (without concepts):**
- Only finds docs with "race conditions" mentioned

**Conceptual system:**
- Finds docs with "race conditions" (exact match)
- **ALSO finds** docs about:
  - Mutex and semaphores (related solutions)
  - Thread safety (parent concept)
  - Deadlock prevention (related problem)
  - Atomic operations (alternative solution)

## 🔍 Debug Mode

Enable debug mode to see how queries are expanded:

**In Cursor/Claude:**
```
Search for "algorithm efficiency" with debug mode
```

**Debug output shows:**
```
🔍 Query Expansion:
  Original: algorithm, efficiency
  + Corpus: sorting, complexity, big O, performance
  + WordNet: procedure, method, process
  Total terms: 9

📊 Top Results with Scores:
1. Algorithm_Analysis.pdf
   Vector: 0.852
   BM25: 0.743
   Title: 0.900
   Concept: 0.891
   WordNet: 0.654
   ➜ Hybrid: 0.808
   Matched: sorting algorithms, time complexity, big O notation
```

## 📊 Understanding Scores

Each result gets scored on 5 signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| **Vector** | 25% | Semantic similarity of embeddings |
| **BM25** | 25% | Keyword relevance with expanded terms |
| **Title** | 20% | Query terms in document title/filename |
| **Concept** | 20% | Matching extracted concepts |
| **WordNet** | 10% | WordNet synonym matches |

**Hybrid Score** = weighted combination of all signals

## 🎯 Best Practices

### 1. Query Formulation

**Good queries:**
- "thread synchronization" (specific technical term)
- "sorting algorithm efficiency" (concept + aspect)
- "implement authentication" (action + concept)
- "prevent race conditions" (goal + problem)

**Less effective:**
- "how to" (too vague)
- Single words (limited expansion)
- Non-technical terms (less concept coverage)

### 2. Using Search Results

**Progressive search pattern:**
```
1. Start broad: "authentication systems"
   → Get overview of relevant documents

2. Refine based on concepts:
   → See "JWT" in matched concepts
   → Search: "JWT token validation"

3. Deep dive:
   → Use chunks_search on specific document
```

### 3. Concept Coverage

**Best results when:**
- Documents are technical/specialized
- Clear terminology is used
- Concepts are well-defined

**Less effective for:**
- Very short documents (< 500 words)
- Highly informal content
- Mixed-language documents

## 🔧 Advanced Configuration

### Tuning Search Weights

Edit `src/lancedb/conceptual_search_client.ts`:

```typescript
// Default weights
const hybridScore = 
    (vectorScore * 0.25) +      // 25% vector
    (bm25Score * 0.25) +        // 25% BM25
    (titleScore * 0.20) +       // 20% title
    (conceptScore * 0.20) +     // 20% concepts
    (wordnetScore * 0.10);      // 10% WordNet

// For more concept emphasis:
const hybridScore = 
    (vectorScore * 0.20) +
    (bm25Score * 0.20) +
    (titleScore * 0.15) +
    (conceptScore * 0.35) +     // ← increased
    (wordnetScore * 0.10);

// For more title emphasis:
const hybridScore = 
    (vectorScore * 0.20) +
    (bm25Score * 0.20) +
    (titleScore * 0.40) +       // ← increased
    (conceptScore * 0.15) +
    (wordnetScore * 0.05);
```

### WordNet Cache Management

WordNet lookups are cached in `./data/caches/wordnet_cache.json`

**Clear cache:**
```bash
rm ./data/caches/wordnet_cache.json
```

**View cache stats:**
```bash
cat ./data/caches/wordnet_cache.json | jq 'length'
```

### Re-seeding Strategies

**Incremental updates:**
```bash
# Don't use --overwrite to add new documents
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.lance_mcp \
  --filesdir ~/Documents/new-docs
```

**Full refresh:**
```bash
# Use --overwrite to recreate everything
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.lance_mcp \
  --filesdir ~/Documents/all-docs \
  --overwrite
```

## 🧪 Testing

### Run Basic Tests

```bash
# Test concept extraction and WordNet
npx tsx test/conceptual_search_test.ts
```

### Test Queries

Try these queries to validate functionality:

1. **Synonym expansion:**
   - "function implementation" → should also find "method", "procedure"

2. **Concept matching:**
   - "thread safety" → should find docs about "mutex", "locks", "synchronization"

3. **Hierarchical navigation:**
   - "sorting" → should find "quicksort", "mergesort" (narrower terms)

4. **Technical specificity:**
   - "React hooks" → should stay focused on React (not expand too broadly)

## 📈 Performance Characteristics

### Seeding Time

| Documents | Time (with concepts) | Cost (OpenRouter) |
|-----------|---------------------|-------------------|
| 10 docs   | ~2 minutes          | $0.002-0.005     |
| 100 docs  | ~15 minutes         | $0.02-0.05       |
| 1000 docs | ~2 hours            | $0.20-0.50       |

### Search Time

| Query complexity | Time | Notes |
|-----------------|------|-------|
| Simple (2-3 terms) | 200-400ms | Includes WordNet lookup |
| Complex (5+ terms) | 400-600ms | More expansion needed |
| With debug | +50-100ms | Extra logging |

**Optimizations:**
- WordNet cache reduces lookup from 50-100ms to <1ms
- Concept table vector index speeds up corpus expansion

## 🐛 Troubleshooting

### "Concepts table not found"

**Problem:** Seeding was run before concept extraction was implemented

**Solution:**
```bash
# Re-seed with concept extraction
export OPENROUTER_API_KEY=your_key
npx tsx hybrid_fast_seed.ts --dbpath ~/.lance_mcp --filesdir ~/Documents/docs --overwrite
```

### WordNet not working

**Problem:** Python or NLTK not installed

**Solution:**
```bash
pip3 install nltk
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
```

### Poor concept quality

**Problem:** Documents are too short or informal

**Solution:**
- Use longer, more structured documents
- Adjust concept extraction prompt in `src/concepts/concept_extractor.ts`
- Try different technical domains

### Search too slow

**Problem:** Large database or complex queries

**Solutions:**
1. Disable debug mode
2. Reduce concept table size (fewer terms)
3. Limit query expansion depth
4. Use SSDs for database storage

## 🎓 Next Steps

1. **Experiment with your corpus:**
   - Seed your documents
   - Try various queries
   - Note which concepts are found

2. **Tune for your domain:**
   - Adjust concept extraction prompts
   - Modify search weights
   - Build custom term dictionaries

3. **Monitor and improve:**
   - Log search queries and results
   - Identify gaps in concept coverage
   - Refine based on usage patterns

## 📚 Additional Resources

- [IMPROVING_SEARCH.md](./IMPROVING_SEARCH.md) - Original improvement recommendations
- [WORDNET_INTEGRATION_ANALYSIS.md](./WORDNET_INTEGRATION_ANALYSIS.md) - WordNet analysis
- [IMPLEMENTATION_PLAN.md](../2025-10-13-conceptual-search-implementation/IMPLEMENTATION_PLAN.md) - Full implementation details
- [Open English WordNet](https://github.com/globalwordnet/english-wordnet) - WordNet resource

## 💬 Feedback

Questions or suggestions? File an issue or contribute improvements!



