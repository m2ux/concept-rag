# Testing Guide: Incomplete Document Detection

## Quick Test

### Test 1: Verify Detection Works
```bash
# Run seed (if some documents had API failures, they'll be incomplete)
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs

# Check output for any 🔄 symbols indicating incomplete documents
# Example output:
# 🔄 [abc2..def2] document.pdf (missing: summary)
```

### Test 2: Verify Reprocessing Works
```bash
# Re-run without --overwrite
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs

# Complete documents show: ✅ [hash] filename.pdf (complete)
# Incomplete documents show: 🔄 [hash] filename.pdf (missing: X)
# Then they get reprocessed
```

### Test 3: Verify Concept Index Rebuilding
```bash
# After reprocessing, check concept index
# It should include concepts from ALL documents, not just reprocessed ones

# You can verify by:
# 1. Note number of concepts before reprocessing
# 2. Reprocess 1 document
# 3. Concept count should remain similar (maybe +/- a few)
```

## Simulated Failure Testing

### Simulate Missing Summary
If you want to test the detection logic:

1. **Manually create incomplete record** (for testing only):
```typescript
// In your test script
const incompleteCatalogRecord = {
    text: "Document overview (5 pages)", // Fallback summary
    source: "/path/to/test.pdf",
    hash: "abc123...",
    concepts: { primary_concepts: ["test"] }
};
```

2. **Run seed command**:
```bash
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

3. **Expected output**:
```
🔄 [abc1..234] test.pdf (missing: summary)
  🗑️  Deleted incomplete catalog entry for test.pdf
📥 [abc1..234] test.pdf (5 pages)
```

### Simulate API Timeout

1. **Temporarily break OpenRouter connection**:
```bash
# Set invalid API key to simulate failures
export OPENROUTER_API_KEY="invalid_key_for_testing"
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

2. **Restore correct key**:
```bash
export OPENROUTER_API_KEY="your_real_key"
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

3. **Expected behavior**:
- First run: Documents processed but summaries/concepts fail
- Second run: Detects incomplete documents and reprocesses them

## Debug Mode Testing

Enable verbose logging:
```bash
DEBUG_OCR=1 npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

**What to look for**:
```
🔍 Hash abc12345...: record=true, summary=false, concepts=true
# This shows what components are present/missing

🔍 Hash abc12345... chunks: false
# Shows if chunks exist

📝 Creating catalog record for OCR'd document: hash=abc12345...
# Tracks OCR-processed documents
```

## Verification Checklist

After running the implementation, verify:

### ✅ Completeness Detection
- [ ] Complete documents show ✅ with "(complete)"
- [ ] Incomplete documents show 🔄 with "(missing: X)"
- [ ] Summary shows count of incomplete documents

### ✅ Reprocessing
- [ ] Incomplete documents are loaded from PDF
- [ ] Summaries are regenerated for documents missing them
- [ ] Concepts are extracted for documents missing them
- [ ] Chunks are created for documents missing them

### ✅ Data Cleanup
- [ ] Old incomplete catalog entries are deleted
- [ ] Old incomplete chunk entries are deleted
- [ ] Console shows "🗑️ Deleted incomplete..." messages

### ✅ Concept Index
- [ ] Concept index includes concepts from ALL documents
- [ ] Reprocessing 1 document doesn't lose concepts from other 99
- [ ] Console shows "📚 Loading existing catalog records..."
- [ ] Console shows total catalog records used for concept index

### ✅ Error Handling
- [ ] Missing tables handled gracefully
- [ ] Corrupted data doesn't crash the process
- [ ] API failures are caught and reported
- [ ] Process completes successfully even with some errors

## Expected Output Examples

### All Complete
```
🔍 Recursively scanning /path/to/pdfs for PDF files...
📚 Found 122 PDF files
🔍 Checking document completeness (summaries, concepts, chunks)...
✅ [abc1..def1] document1.pdf (complete)
✅ [abc2..def2] document2.pdf (complete)
✅ [abc3..def3] document3.pdf (complete)
...

📊 Summary: • 📥 Loaded: 0 • ⏭️ Skipped: 122 • ⚠️ Error: 0

✅ No new documents to process - all files already exist in database.
🎉 Seeding completed successfully (no changes needed)!
```

### Some Incomplete
```
🔍 Recursively scanning /path/to/pdfs for PDF files...
📚 Found 122 PDF files
🔍 Checking document completeness (summaries, concepts, chunks)...
✅ [abc1..def1] document1.pdf (complete)
🔄 [abc2..def2] document2.pdf (missing: summary)
  🗑️  Deleted incomplete catalog entry for document2.pdf
📥 [abc2..def2] document2.pdf (50 pages)
✅ [abc3..def3] document3.pdf (complete)
...

📊 Summary: • 📥 Loaded: 1 • ⏭️ Skipped: 121 • ⚠️ Error: 0

🔄 Incomplete documents (will reprocess): 1
   • document2.pdf (missing: summary)

🚀 Creating catalog with OpenRouter summaries...
🤖 Extracting concepts for: document2.pdf
✅ Content overview generated
✅ Found: 15 concepts

📊 Creating catalog table with fast local embeddings...
✅ Added 1 new records to existing table: catalog

🔧 Creating chunks with fast local embeddings...
📊 Processing 250 chunks...
✅ Added 250 new records to existing table: chunks

🧠 Building concept index with chunk statistics...
  📚 Loading existing catalog records for concept index...
  ✅ Loaded 122 existing records (121 with concepts)
  📊 Building concept index from 122 total catalog records
✅ Built 450 unique concept records
  🗑️  Dropped existing concepts table
✅ Concept index created successfully

✅ Created 1 catalog records
✅ Created 250 chunk records
🎉 Seeding completed successfully!
```

### Missing Multiple Components
```
🔄 [abc2..def2] document2.pdf (missing: summary, concepts)
  🗑️  Deleted incomplete catalog entry for document2.pdf
  🗑️  Deleted incomplete chunks for document2.pdf
📥 [abc2..def2] document2.pdf (50 pages)

📊 Summary: • 📥 Loaded: 1 • ⏭️ Skipped: 121 • ⚠️ Error: 0

🔄 Incomplete documents (will reprocess): 1
   • document2.pdf (missing: summary, concepts)
```

## Performance Testing

### Small Database (< 100 documents)
- Completeness check: < 1 second per document
- Reprocessing: Depends on API speed (2-5 seconds per document)
- Concept index rebuild: < 5 seconds

### Medium Database (100-1000 documents)
- Completeness check: < 10 seconds total
- Reprocessing: Same per-document speed
- Concept index rebuild: 10-30 seconds

### Large Database (1000-10000 documents)
- Completeness check: < 30 seconds total
- Reprocessing: Same per-document speed
- Concept index rebuild: 1-3 minutes

## Troubleshooting

### "Could not load existing records"
**Issue**: Concept index can't load existing catalog records  
**Impact**: Concept index will only include new documents  
**Fix**: Usually harmless, but you can run `--overwrite` to rebuild from scratch

### "Error checking document completeness"
**Issue**: Database query failed  
**Impact**: Document treated as new (may reprocess unnecessarily)  
**Fix**: Check database permissions and integrity

### "Deleted incomplete data" but still shows incomplete
**Issue**: Deletion failed but was caught  
**Impact**: May create duplicate records  
**Fix**: Use `--overwrite` to clean up duplicates

### All documents marked incomplete on first run
**Issue**: Expected behavior if migrating from old version  
**Impact**: None - all documents will be validated  
**Fix**: Not a bug, just initial validation

## Success Criteria

✅ **Detection**: System identifies incomplete documents correctly  
✅ **Cleanup**: Incomplete data is deleted before reprocessing  
✅ **Reprocessing**: Missing components are regenerated  
✅ **Consistency**: Concept index includes all documents  
✅ **Efficiency**: Complete documents are not reprocessed  
✅ **Reporting**: Clear feedback about what's happening  

## Questions to Verify

1. **Does it detect incomplete documents?**
   - Run seed, check for 🔄 symbols

2. **Does it reprocess them?**
   - Check that documents with 🔄 are loaded from PDF

3. **Does it preserve complete documents?**
   - Complete documents should show ✅ and "(complete)"

4. **Does concept index stay consistent?**
   - Concept count shouldn't drop dramatically when reprocessing 1 document

5. **Does it handle errors gracefully?**
   - Try with invalid API key, missing tables, etc.

## Next Steps

After verifying the implementation works:

1. **Run on production database** (backup first!)
2. **Monitor first run** for any unexpected behavior
3. **Verify concept index** has expected number of concepts
4. **Check database size** is reasonable
5. **Test re-runs** to ensure idempotency

If everything looks good, the system is ready for regular use!

