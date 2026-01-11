# 🚀 Hybrid Search Quick Start

This guide shows you how to enable hybrid search in 5 minutes to ensure books with specific terms in titles are always found.

## ⚡ Quick Implementation

### Step 1: Build the Project

```bash
npm run build
```

### Step 2: Update Your MCP Configuration

Edit your Cursor/Claude config file to use the hybrid search server:

**Before:**
```json
{
  "mcpServers": {
    "lancedb": {
      "command": "node",
      "args": [
        "/path/to/lance-mcp/dist/simple_index.js",
        "/home/username/.lance_mcp"
      ]
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "lancedb": {
      "command": "node",
      "args": [
        "/path/to/lance-mcp/dist/hybrid_index.js",
        "/home/username/.lance_mcp"
      ]
    }
  }
}
```

### Step 3: Restart Cursor/Claude

Close and reopen Cursor or Claude Desktop.

### Step 4: Test It!

Try searching for "Distributed Systems" - you should now see all 4 books:
1. Distributed Computing: 16th International Conference
2. Distributed Systems for Practitioners  
3. Continuous and Distributed Systems
4. Understanding Distributed Systems

## 🎯 What Changed?

The hybrid search combines three signals:

1. **Vector Similarity (40%)** - Semantic meaning from embeddings
2. **BM25 Text Score (30%)** - Keyword matching in document text
3. **Title Match Score (30%)** - Exact term matching in filenames

### Example:

**Query:** "Distributed Systems"

**Old Search (Vector Only):**
```
Result 1: _distance: 1.11 (some match, but might miss others)
Result 2: _distance: 1.14 (weaker match)
```

**New Hybrid Search:**
```
Result 1: _hybrid_score: 8.5 (strong title match + vector match)
  - _vector_score: 0.45
  - _bm25_score: 0.5
  - _title_score: 10.0 (exact match!)
  
Result 2: _hybrid_score: 7.2 (title match)
  - _vector_score: 0.42
  - _bm25_score: 0.3
  - _title_score: 10.0 (exact match!)
```

## 🔧 Tuning (Optional)

If you want to emphasize title matches even more, edit `src/lancedb/hybrid_search_client.ts`:

```typescript
// Line ~110: Adjust weights
const hybridScore = 
  (vectorScore * 0.3) +   // Reduce semantic weight
  (bm25Score * 0.2) +     // Reduce keyword weight
  (titleScore * 0.5);     // Increase title weight
```

Then rebuild: `npm run build`

## 📊 Comparison: Before vs After

### Before (Vector Only)
```bash
Query: "distributed systems"

Found 2 of 4 books:
✓ Distributed Systems for Practitioners (close vector match)
✓ Distributed Computing Conference (close vector match)
✗ Continuous and Distributed Systems (missed)
✗ Understanding Distributed Systems (missed)
```

### After (Hybrid Search)
```bash
Query: "distributed systems"

Found 4 of 4 books:
✓ Distributed Systems for Practitioners (title + vector match)
✓ Distributed Computing Conference (title + vector match)
✓ Continuous and Distributed Systems (title match!)
✓ Understanding Distributed Systems (title match!)
```

## 🎓 Understanding the Scores

When you see search results, you'll now see:

```json
{
  "id": "1",
  "text": "This comprehensive text covers distributed systems...",
  "source": "/path/to/Distributed Systems for practitioners.pdf",
  "_vector_score": 0.45,    // How semantically similar (0-1)
  "_bm25_score": 1.2,        // How well keywords match (0-∞)
  "_title_score": 10.0,      // Title match bonus (0 or 10)
  "_hybrid_score": 8.5,      // Combined score (higher = better)
  "_distance": -7.5          // Inverted for LanceDB compatibility
}
```

## 🐛 Troubleshooting

### "Module not found" error
```bash
npm run build
# Make sure hybrid_index.js exists in dist/
ls -la dist/hybrid_index.js
```

### Search results haven't changed
1. Verify you're using `hybrid_index.js` (not `simple_index.js`)
2. Restart your MCP client completely
3. Check console for "Hybrid Search MCP Server running" message

### Title matches not working
- Check if your filenames contain the search terms
- Filenames are parsed: `Distributed Systems for practitioners.pdf` → "Distributed Systems for practitioners"
- The search is case-insensitive

## 📈 Next Steps

1. ✅ **Use it** - The hybrid search works with your existing database (no re-seeding needed!)
2. 📝 **Consider** - For even better results, see `IMPROVING_SEARCH.md` for adding title metadata to your catalog
3. 🎯 **Tune** - Adjust the scoring weights based on your search patterns

## 💡 Pro Tips

- **Search for concepts**: Hybrid search still works semantically, so "parallel computing" will find distributed systems books
- **Search for titles**: Exact title matches get a big boost
- **Combine both**: "distributed systems consensus" leverages both title matching and semantic understanding

## 🆘 Need Help?

Check the full guide: `IMPROVING_SEARCH.md`

Or open an issue: [GitHub Issues](https://github.com/m2ux/lance-mcp/issues)



