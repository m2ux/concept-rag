# Incomplete Document Detection and Reprocessing

## Problem
When document processing failed (e.g., OpenRouter API timeouts), the system would mark documents as "already processed" even if summaries, concepts, or chunks were missing. This meant incomplete documents could never be fixed without using the `--overwrite` flag.

## Solution
Implemented separate completeness checks for:
1. **Catalog records** - Document entry exists
2. **Summaries** - Valid content overview (not a fallback)
3. **Concepts** - Successfully extracted concepts
4. **Chunks** - Document has been chunked

## ⭐ Key Feature: Chunk Preservation
**Intact chunks are NEVER deleted** - the system only regenerates what's actually missing:
- ✅ Missing summary only → Regenerate summary, **preserve chunks**
- ✅ Missing concepts only → Regenerate concepts, **preserve chunks**
- ✅ Missing both → Regenerate summary and concepts, **preserve chunks**
- ⚠️ Missing chunks → Delete and regenerate chunks (expensive operation)

This saves significant time and cost since chunking is expensive to regenerate.

## Key Changes

### 1. Data Completeness Check Interface
```typescript
interface DataCompletenessCheck {
    hasRecord: boolean;      // Catalog entry exists
    hasSummary: boolean;     // Valid summary (not fallback)
    hasConcepts: boolean;    // Concepts extracted
    hasChunks: boolean;      // Chunks created
    isComplete: boolean;     // All components present
    missingComponents: string[];  // List of missing parts
}
```

### 2. Completeness Validation Function
**Function:** `checkDocumentCompleteness()`

**Checks:**
- **Catalog Record**: Queries catalog table for document hash
- **Summary Validation**: Ensures content is not a fallback like:
  - `"Document overview (X pages)"`
  - Very short content (< 10 chars)
  - Contains "OpenRouter summarization failed"
- **Concept Validation**: Checks that:
  - `concepts` metadata exists
  - `primary_concepts` array exists and has length > 0
- **Chunks Validation**: Queries chunks table for matching hash

### 3. Selective Data Cleanup
**Function:** `deleteIncompleteDocumentData()`

**Smart deletion** - only removes what needs regeneration:
- **Catalog entries**: Deleted if summary or concepts missing
- **Chunk entries**: Deleted ONLY if chunks actually missing
- **Preserved data**: Intact chunks are never deleted (expensive to regenerate)
- Concept table is rebuilt after processing (no direct deletion needed)

**Example scenarios:**
- Missing summary only → Delete catalog, preserve chunks
- Missing concepts only → Delete catalog, preserve chunks  
- Missing chunks only → Delete chunks, delete catalog (chunks need regeneration)
- Missing summary + concepts → Delete catalog, preserve chunks
- Missing all → Delete catalog and chunks

### 4. Enhanced Reporting
New console output shows:
```
✅ [hash] filename.pdf (complete)          # All components present
🔄 [hash] filename.pdf (missing: summary)  # Needs reprocessing
  ✅ Preserving existing chunks for filename.pdf (summary will be regenerated)
🔄 [hash] filename.pdf (missing: summary, concepts, chunks)
  🗑️  Deleted incomplete catalog entry for filename.pdf
  🗑️  Deleted incomplete chunks for filename.pdf
```

Summary includes incomplete document list:
```
📊 Summary: • 📥 Loaded: 5 • ⏭️ Skipped: 120 • ⚠️ Error: 0

🔄 Incomplete documents (will reprocess): 3
   • document1.pdf (missing: summary)
   • document2.pdf (missing: concepts)
   • document3.pdf (missing: summary, concepts, chunks)

✅ Preserving existing chunks for 2 document(s) with intact chunk data
🔧 Chunking 1 document(s) that need new chunks...
```

## Usage

### Detecting Incomplete Documents
Simply run the seed command without `--overwrite`:
```bash
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

The system will:
1. Check each document for completeness
2. Skip complete documents (✅)
3. Reprocess incomplete documents (🔄)
4. Report what was fixed

### Debug Mode
Enable detailed logging:
```bash
DEBUG_OCR=1 npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs
```

This shows:
- Hash checks: record/summary/concepts/chunks status
- What data is being deleted
- Detailed reprocessing steps

## Technical Details

### Why Separate Checks?
Different failure modes require different detection:
- **Summary failures**: API timeouts, rate limits
- **Concept failures**: LLM errors, API issues
- **Chunk failures**: Database write errors

### Hash-Based Tracking
Documents are tracked by SHA-256 hash of file contents:
- Prevents duplicates across runs
- Allows incremental updates
- Enables precise data deletion

### Reprocessing Flow
1. **Detection**: Check completeness for existing hash
2. **Cleanup**: Delete incomplete catalog/chunk entries
3. **Reload**: Load document from PDF
4. **Reprocess**: Extract summary, concepts, chunks
5. **Store**: Write complete data to database

### Concept Table Handling
Concepts are aggregated from all documents:
- `sources` field contains multiple document paths
- When reprocessing documents:
  1. Load ALL existing catalog records from database
  2. Merge with newly processed records (removing duplicates by hash)
  3. Build concept index from complete set
  4. Drop and recreate concepts table
- This ensures concept index remains complete even when reprocessing partial documents
- Example: Reprocessing 1 out of 100 documents still includes concepts from all 100

## Benefits

### 1. Automatic Recovery
- No need to manually identify failed documents
- No need for full database overwrite
- Fixes issues incrementally

### 2. Detailed Feedback
- Know exactly what's missing
- Understand what's being reprocessed
- Track progress during fixes

### 3. Data Integrity
- Ensures all components are present
- Detects fallback content
- Validates concept extraction

### 4. Efficient Updates
- Only reprocesses incomplete documents
- Preserves complete document data
- Minimizes API calls

## Example Scenarios

### Scenario 1: API Timeout During Initial Seed
**Before:**
```
⚠️ OpenRouter summarization failed: fetch failed
...
📊 Summary: • 📥 Loaded: 100 • ⏭️ Skipped: 0 • ⚠️ Error: 0
```

**After (re-run):**
```
📊 Summary: • 📥 Loaded: 0 • ⏭️ Skipped: 122 • ⚠️ Error: 0
# Nothing happens - documents marked as "complete"
```

**With Fix (re-run):**
```
🔄 [abc1..def2] doc1.pdf (missing: summary)
🔄 [abc2..def3] doc2.pdf (missing: summary, concepts)
...
📊 Summary: • 📥 Loaded: 2 • ⏭️ Skipped: 120 • ⚠️ Error: 0
🔄 Incomplete documents (will reprocess): 2
   • doc1.pdf (missing: summary)
   • doc2.pdf (missing: summary, concepts)
```

### Scenario 2: Partial Processing Failure
Some documents succeed, some fail:
```
# First run
✅ [abc1..def1] good-doc.pdf (100 pages)
⚠️ OpenRouter summarization failed for bad-doc.pdf

# Second run (with fix)
✅ [abc1..def1] good-doc.pdf (complete)  # Skipped
🔄 [abc2..def2] bad-doc.pdf (missing: summary, concepts)  # Reprocessed
```

### Scenario 3: Database Corruption
Chunks table corrupted but catalog intact:
```
🔄 [abc1..def1] doc1.pdf (missing: chunks)
🔄 [abc2..def2] doc2.pdf (missing: chunks)
# Recreates chunks without re-extracting concepts/summaries
```

## Future Enhancements

### Possible Improvements
1. **Selective Reprocessing**: Only regenerate missing components (not implemented yet)
2. **Checkpointing**: Save progress during long processing runs
3. **Retry Logic**: Automatic retry with backoff for API failures
4. **Health Checks**: Periodic validation of database integrity

### Configuration Options (Future)
```bash
# Skip specific checks
--skip-summary-check
--skip-concept-check
--skip-chunk-check

# Force reprocessing of specific components
--force-summary
--force-concepts
--force-chunks
```

## Testing

### Verify Detection Works
1. Run initial seed with some API failures
2. Check that incomplete documents are detected
3. Re-run without `--overwrite`
4. Verify incomplete documents are reprocessed

### Simulate Incomplete Data
```bash
# Delete summaries from catalog (for testing)
sqlite3 ~/.concept_rag/catalog.lance "UPDATE ... SET text='Document overview'"

# Re-run seed
npx tsx hybrid_fast_seed.ts --filesdir /path/to/pdfs

# Should detect and fix missing summaries
```

## Notes

- Compatible with existing databases (no migration needed)
- Backward compatible (doesn't break existing functionality)
- Works with both OCR and standard PDF processing
- Handles edge cases (missing tables, corrupted data, etc.)

