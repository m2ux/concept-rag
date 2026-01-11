# Rebuild Concept Index Guide

## Quick Start

If all your documents and chunks already exist but concept chunk counts are wrong (like "elliott wave" showing `chunk_count: 0`), use this command:

```bash
cd .
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts
```

## What This Does

The `--rebuild-concepts` flag tells the seeding script to:

1. ✅ Detect that all documents already exist
2. ✅ Skip PDF loading and chunking (fast!)
3. ✅ Load ALL existing catalog records
4. ✅ Load ALL existing chunks (for accurate counting)
5. ✅ Rebuild the concept index with fixed algorithm
6. ✅ Update all `chunk_count` values

## When to Use This

Use `--rebuild-concepts` when:

- ❌ Concept chunk counts are wrong (`chunk_count: 0` but chunks exist)
- ❌ You updated the concept counting algorithm
- ❌ Concept index is missing or corrupted
- ✅ All your documents are already in the database
- ✅ All chunks already exist

**Do NOT use** if you need to:
- Add new documents (just run normal seeding)
- Create missing chunks (just run normal seeding)
- Re-extract concepts (needs full re-seeding with `--overwrite`)

## Example Output

```bash
$ npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts

DATABASE PATH:  ~/.concept_rag
FILES DIRECTORY:  ~/Documents/ebooks
✅ LLM API key configured
🚀 Hybrid approach: LLM summaries + Fast local embeddings

Loading files...
🔍 Recursively scanning ~/Documents/ebooks for PDF files...
📚 Found 122 PDF files
🔍 Checking document completeness (summaries, concepts, chunks)...
✅ [abc1..xyz9] document1.pdf (complete)
✅ [def2..uvw8] document2.pdf (complete)
... (all 122 documents are complete)

📊 Summary: • 📥 Loaded: 0 • ⏭️ Skipped: 122 • ⚠️ Error: 0

✅ No new documents to process - all files already exist in database.

🔍 Rebuild concepts flag detected - rebuilding concept index...
📊 Rebuilding concept index with latest algorithm...
  📚 Loading ALL catalog records...
  ✅ Loaded 122 catalog records (122 with concepts)
  📦 Loading ALL chunks for accurate concept counting...
  ✅ Loaded 269,070 total chunks
  🧠 Building concept index from ALL data...
📊 Building concept index from document metadata...
  ✅ Extracted 24,603 unique concepts
  ✅ Built 24,603 unique concept records

  🔝 Top 10 concepts by chunk count:
    1. "wave principle" - 413 chunks (wave taxonomy and hierarchy)
    2. "monowave" - 238 chunks (technical analysis methodology)
    3. "corrective wave" - 236 chunks (wave taxonomy and hierarchy)
    4. "limiting triangle" - 202 chunks (technical analysis methodology)
    5. "elliott wave" - 187 chunks (technical analysis and pattern recognition) ✅
    6. "impulse wave" - 149 chunks (wave taxonomy and hierarchy)
    7. "triangle" - 143 chunks (wave pattern structures)
    8. "zigzag" - 128 chunks (corrective wave patterns)
    9. "wave count" - 172 chunks (wave taxonomy and hierarchy)
    10. "alternation principle" - 95 chunks (elliott wave theory)

  🗑️  Dropped existing concepts table
📊 Creating concept table 'concepts' with 24,603 concepts...
  ✅ Table created (24,603 vectors - using linear scan, fast and no warnings)
  ✅ Concept index created successfully
🎉 Concept index rebuild completed successfully!
```

## Verification

After running the rebuild, verify the fix worked:

```bash
# Check the database health
npx tsx scripts/check_database_health.ts

# Should show:
# 🧠 Concept Index:
#    Concepts with chunk_count > 0: XXX ← Much higher number!
#    🔝 Top concepts:
#      1. "elliott wave" - 187 chunks ✅ (not 0!)
```

Or test via the MCP tool:

```javascript
mcp_concept-rag_concept_search("elliott wave")

// Should now return actual chunks:
// {
//   "total_chunks_found": 187,  ← Not 0!
//   "results": [...]
// }
```

## Performance

**Speed**: Very fast! Since PDFs aren't loaded and chunks aren't created:
- ~10 seconds to load 269,070 chunks from database
- ~30-60 seconds to rebuild concept index
- **Total: ~1-2 minutes** vs hours for full re-seeding

**Safety**: No data loss risk - only rebuilds the concept index, doesn't touch catalog or chunks.

## Command Reference

```bash
# Basic rebuild (when all files exist)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts

# Normal seeding (adds missing chunks automatically)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks

# Full rebuild (deletes everything - use with caution!)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --overwrite

# Check database health first
npx tsx scripts/check_database_health.ts
```

## Troubleshooting

### "catalog or chunks table missing"
```
💡 Note: --rebuild-concepts flag was set but catalog or chunks table missing
```

**Solution**: You need to run normal seeding first to create the tables.

### "Error rebuilding concept index"
Check the error message. Common causes:
- Database connection issues
- Memory issues (too many chunks to load)
- Corrupted data in catalog/chunks

**Solution**: Try normal seeding or check database integrity.

### Rebuild completes but counts still wrong
**Solution**: Ensure you compiled the latest code before running:
```bash
npm run build
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts
```

## Summary

The `--rebuild-concepts` flag is a **fast, safe way** to fix incorrect concept chunk counts without re-processing your entire document library. It's the perfect solution for the "elliott wave has chunk_count: 0" problem!

**Time**: ~1-2 minutes  
**Risk**: None (read-only on catalog/chunks)  
**Result**: Accurate concept chunk counts ✅


