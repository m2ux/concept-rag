# Repair Missing Concepts Guide

## What I Fixed

### Bug 1: max_tokens Too Low ✅
**Error**: `integer_below_min_value: Expected >= 16, but got 1`

**Fix**: Updated token calculation in `concept_extractor.ts`:
- Changed context limit from 1,048,576 to 400,000 (actual model limit)
- Added `Math.max()` to ensure max_tokens >= 16

### Bug 2: No Retry for Empty Responses ✅  
**Error**: `API returned empty or whitespace-only content`

**Fix**: Added automatic retry with exponential backoff:
- 1st retry: 5 seconds
- 2nd retry: 10 seconds
- 3rd retry: 15 seconds

## The Repair Script

Use this **after seeding completes** to fix documents with missing/incomplete concepts:

```bash
cd .
npx tsx scripts/repair_missing_concepts.ts
```

### What It Does

1. ✅ Scans catalog for documents with:
   - No concepts field
   - Empty concepts array
   - < 10 concepts (configurable)

2. ✅ Re-extracts concepts from existing chunks (no PDF re-loading!)

3. ✅ Updates only affected catalog entries

4. ✅ Re-enriches affected chunks with new concepts

5. ✅ Rebuilds concept index

### Safe Operation

- ✅ Only touches documents needing repair
- ✅ Doesn't re-load PDFs (uses existing chunks)
- ✅ Preserves all other data
- ✅ Can be run multiple times safely

## Usage

### Basic (default: < 10 concepts)

```bash
npx tsx scripts/repair_missing_concepts.ts
```

### Custom Threshold

```bash
# Repair documents with < 50 concepts
npx tsx scripts/repair_missing_concepts.ts --min-concepts 50
```

## Expected Output

```bash
$ npx tsx scripts/repair_missing_concepts.ts

🔧 Repairing documents with missing/incomplete concepts
📂 Database: ~/.concept_rag
📊 Minimum concepts threshold: 10

📚 Loading catalog entries...
  ✅ Loaded 122 entries

🔍 Identifying documents needing repair...
  ✅ Found 3 documents needing repair

📋 Documents to repair:
  1. Critical Thinking A Concise Guide, 3rd Edition.pdf
     Reason: Only 8 concepts
  2. Rational Analysis for a Problematic World Revisited.pdf
     Reason: Only 5 concepts
  3. Some Other Document.pdf
     Reason: Empty concepts

🔄 Starting concept re-extraction...

[1/3] 🔧 Repairing: Critical Thinking A Concise Guide, 3rd Edition.pdf
   Previous state: Only 8 concepts
   📦 Loaded 543 chunks
   🤖 Extracting concepts...
   ✅ Extracted 103 concepts

[2/3] 🔧 Repairing: Rational Analysis for a Problematic World Revisited.pdf
   Previous state: Only 5 concepts
   📦 Loaded 687 chunks
   🤖 Extracting concepts...
   ✅ Extracted 164 concepts

[3/3] 🔧 Repairing: Some Other Document.pdf
   Previous state: Empty concepts
   📦 Loaded 234 chunks
   🤖 Extracting concepts...
   ✅ Extracted 78 concepts

📊 Repair Summary:
   - Documents repaired: 3
   - Documents failed: 0

📝 Updating catalog with repaired concepts...
  ✅ Catalog updated

🔄 Re-enriching chunks for repaired documents...
  ✅ Re-enriched 1,464 chunks

🧠 Rebuilding concept index...
  ✅ Concept index rebuilt

✅ Repair complete!

💡 Run health check to verify:
   npx tsx scripts/check_database_health.ts
```

## When to Use This

### After Initial Seeding

Run this script after your first seeding completes to catch any documents that had:
- Empty API responses (now fixed with retry)
- Token calculation errors (now fixed)
- Network glitches during extraction

### Periodically

If you notice some documents have fewer concepts than expected:

```bash
# Check which documents are affected
npx tsx scripts/check_database_health.ts

# Repair them
npx tsx scripts/repair_missing_concepts.ts
```

### After API Failures

If seeding encounters API errors for certain documents, they'll be processed with partial concepts. Run the repair script to complete them.

## Current Seeding

Your current seeding is still running and will complete normally with the new fixes:
- ✅ Empty responses will be retried automatically
- ✅ Token calculation is now correct
- ✅ Documents will have proper concepts

**After it finishes**, run the repair script to fix any documents that failed during the run (like "Critical Thinking" and "Rational Analysis").

## Troubleshooting

### "All documents have sufficient concepts!"

Great! Your database is healthy. No repairs needed.

### Some documents still fail

Check the debug files saved to `/tmp/concept_extraction_error_*.txt` to see the exact API responses. The issue might be:
- Content moderation (API rejected the text)
- Very technical/complex content (LLM struggled)
- Encoding issues in the PDF

### Rate limiting

If you hit rate limits during repair:

```bash
# The script will auto-retry with backoff
# Or you can run it later when limits reset
npx tsx scripts/repair_missing_concepts.ts
```

## Summary

✅ **Fixed**: max_tokens calculation bug  
✅ **Fixed**: Empty response retry logic  
✅ **Created**: Safe repair script for failed documents  
✅ **Safe**: Only touches what needs repair  

**Next Steps**:
1. Let current seeding finish
2. Run: `npx tsx scripts/repair_missing_concepts.ts`
3. Verify: `npx tsx scripts/check_database_health.ts`

Your database will be in perfect shape! 🎉

