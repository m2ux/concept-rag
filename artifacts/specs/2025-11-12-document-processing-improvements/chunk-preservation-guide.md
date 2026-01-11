# Chunk Preservation Guide

## Overview
The system intelligently preserves expensive chunk data when only summary or concepts need regeneration.

## ⚠️ Why This Matters
- **Chunking is expensive**: Text splitting, embedding generation, database writes
- **Summaries are cheap**: Single API call per document
- **Concepts are moderate**: LLM extraction, but only once per document
- **Chunks are numerous**: Hundreds per document, each needs processing

## Preservation Scenarios

### ✅ Scenario 1: Missing Summary Only
**What's missing:** Summary (API timeout)  
**What's preserved:** Chunks (intact), Concepts (intact)  
**What's deleted:** Catalog entry only  
**What's regenerated:** Summary only  

**Output:**
```bash
🔄 [abc2..def2] document.pdf (missing: summary)
  ✅ Preserving existing chunks for document.pdf (summary will be regenerated)
  🗑️  Deleted incomplete catalog entry for document.pdf

# Later during chunking:
✅ Preserving existing chunks for 1 document(s) with intact chunk data
🔧 Chunking 0 document(s) that need new chunks...
```

**Time saved:** ~5-10 minutes per large document  
**Cost saved:** No additional embedding API calls

---

### ✅ Scenario 2: Missing Concepts Only
**What's missing:** Concepts (LLM extraction failed)  
**What's preserved:** Chunks (intact), Summary (intact)  
**What's deleted:** Catalog entry only  
**What's regenerated:** Concepts only  

**Output:**
```bash
🔄 [abc3..def3] document.pdf (missing: concepts)
  ✅ Preserving existing chunks for document.pdf (concepts will be regenerated)
  🗑️  Deleted incomplete catalog entry for document.pdf
```

**Time saved:** ~5-10 minutes per large document  
**Cost saved:** No chunking/embedding overhead

---

### ✅ Scenario 3: Missing Summary + Concepts
**What's missing:** Summary and concepts  
**What's preserved:** Chunks (intact)  
**What's deleted:** Catalog entry only  
**What's regenerated:** Summary and concepts  

**Output:**
```bash
🔄 [abc4..def4] document.pdf (missing: summary, concepts)
  ✅ Preserving existing chunks for document.pdf (summary, concepts will be regenerated)
  🗑️  Deleted incomplete catalog entry for document.pdf
```

**Time saved:** ~5-10 minutes per large document  
**Cost saved:** No chunking/embedding overhead

---

### ⚠️ Scenario 4: Missing Chunks
**What's missing:** Chunks (database write failed)  
**What's preserved:** Nothing (chunks need regeneration)  
**What's deleted:** Catalog entry AND chunks  
**What's regenerated:** Everything (summary, concepts, chunks)  

**Output:**
```bash
🔄 [abc5..def5] document.pdf (missing: chunks)
  🗑️  Deleted incomplete catalog entry for document.pdf
  🗑️  Deleted incomplete chunks for document.pdf

# Later during chunking:
🔧 Chunking 1 document(s) that need new chunks...
```

**Time penalty:** Full reprocessing required  
**Why:** Chunks can't be regenerated without full document reprocessing

---

### ⚠️ Scenario 5: Missing Everything
**What's missing:** Summary, concepts, and chunks  
**What's preserved:** Nothing  
**What's deleted:** Catalog entry AND chunks  
**What's regenerated:** Everything  

**Output:**
```bash
🔄 [abc6..def6] document.pdf (missing: summary, concepts, chunks)
  🗑️  Deleted incomplete catalog entry for document.pdf
  🗑️  Deleted incomplete chunks for document.pdf
```

**Time penalty:** Full reprocessing required

---

## Technical Implementation

### Deletion Logic
```typescript
async function deleteIncompleteDocumentData(
    catalogTable: lancedb.Table | null,
    chunksTable: lancedb.Table | null,
    hash: string,
    source: string,
    missingComponents: string[]  // KEY: Pass what's missing
): Promise<void> {
    // Only delete catalog if summary or concepts missing
    if (missingComponents.includes('summary') || 
        missingComponents.includes('concepts')) {
        await catalogTable.delete(`hash="${hash}"`);
    }
    
    // Only delete chunks if chunks are ACTUALLY missing
    if (missingComponents.includes('chunks')) {
        await chunksTable.delete(`hash="${hash}"`);
    } else {
        // Show preservation message
        console.log(`✅ Preserving existing chunks...`);
    }
}
```

### Chunking Filter Logic
```typescript
// Track which documents need chunking during loading
const documentsNeedingChunks = new Set<string>();

// Add to set when:
if (completeness.missingComponents.includes('chunks')) {
    documentsNeedingChunks.add(pdfFile);
}

// Later, filter before chunking:
const docsToChunk = rawDocs.filter(doc => 
    documentsNeedingChunks.has(doc.metadata.source)
);

// Only chunk filtered documents
const docs = await splitter.splitDocuments(docsToChunk);
```

## Real-World Example

### Initial Seed (Some API Failures)
```bash
# 100 documents processed
# 95 successful
# 5 had summary failures (API timeout)

📊 Summary: 
  • 📥 Loaded: 100 
  • ⏭️ Skipped: 0 
  • ⚠️ Error: 0

⚠️ OpenRouter summarization failed: fetch failed (5 times)
```

### Re-run (With Chunk Preservation)
```bash
# Re-run the same command
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs

🔍 Checking document completeness...
✅ [abc1..def1] doc1.pdf (complete)
✅ [abc2..def2] doc2.pdf (complete)
...
✅ 95 documents (complete)
🔄 [abc96..def96] doc96.pdf (missing: summary)
  ✅ Preserving existing chunks for doc96.pdf
🔄 [abc97..def97] doc97.pdf (missing: summary)
  ✅ Preserving existing chunks for doc97.pdf
🔄 [abc98..def98] doc98.pdf (missing: summary)
  ✅ Preserving existing chunks for doc98.pdf
🔄 [abc99..def99] doc99.pdf (missing: summary)
  ✅ Preserving existing chunks for doc99.pdf
🔄 [abc00..def00] doc100.pdf (missing: summary)
  ✅ Preserving existing chunks for doc100.pdf

📊 Summary:
  • 📥 Loaded: 5 (reprocessing)
  • ⏭️ Skipped: 95 (complete)
  • ⚠️ Error: 0

🔄 Incomplete documents (will reprocess): 5
   • doc96.pdf (missing: summary)
   • doc97.pdf (missing: summary)
   • doc98.pdf (missing: summary)
   • doc99.pdf (missing: summary)
   • doc100.pdf (missing: summary)

🚀 Creating catalog with OpenRouter summaries...
✅ Content overview generated (5x)

✅ Preserving existing chunks for 5 document(s) with intact chunk data
🔧 Chunking 0 document(s) that need new chunks...

✅ Created 5 catalog records
✅ Created 0 chunk records (preserved existing)
🎉 Seeding completed successfully!
```

**Time saved:** ~25-50 minutes (5 documents × 5-10 min each)  
**Cost saved:** No embedding API calls for preserved chunks

## Benefits Comparison

### Without Chunk Preservation (Old Behavior)
```
Missing summary → Delete everything → Reprocess everything
Time: 10 minutes per document
Cost: Full embedding API calls
```

### With Chunk Preservation (New Behavior)
```
Missing summary → Delete catalog only → Regenerate summary only
Time: ~30 seconds per document
Cost: One summary API call per document
```

**Improvement:** ~20x faster, ~90% cost reduction for summary-only failures

## Best Practices

### When to Use --overwrite
Use `--overwrite` when:
- You've changed chunking parameters (chunk size, overlap)
- You suspect chunk corruption across many documents
- You want to rebuild everything from scratch

### When NOT to Use --overwrite
Don't use `--overwrite` when:
- Only summaries failed (API timeouts)
- Only concepts failed (LLM errors)
- Chunks are intact but catalog is incomplete

Just re-run without `--overwrite` and the system will preserve chunks automatically.

## Verification

### Check What's Preserved
Look for these messages:
```bash
✅ Preserving existing chunks for X document(s)
```

### Check What's Regenerated
Look for these messages:
```bash
🔧 Chunking X document(s) that need new chunks...
```

### Verify Chunk Count
After reprocessing:
```bash
# Should show 0 new chunks if only summaries/concepts were missing
✅ Created 0 chunk records
```

## Troubleshooting

### "Preserving chunks" but still slow
- Concept extraction might still be running (normal)
- Summary generation is still needed (normal)
- These are cheaper than chunking but not instant

### All documents being chunked
- Chunks were actually missing (not a bug)
- Or using `--overwrite` (expected behavior)
- Check logs for "missing: chunks" messages

### Chunks preserved but queries slow
- Chunks are intact, this is expected
- Concept index might need rebuilding (automatic)
- Database indexes might need optimization

## Summary

✅ **Smart preservation saves time and money**  
✅ **Only regenerates what's actually missing**  
✅ **No user intervention required**  
✅ **Clear feedback about what's preserved**  
✅ **Automatic tracking and filtering**  

The system now intelligently preserves expensive chunk data, making failure recovery much faster and cheaper! 🎉

