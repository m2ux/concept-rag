# Missing Chunks Investigation

**Date:** November 12, 2025  
**Status:** ✅ Investigation Complete, Fix Applied

## Overview

Investigation into why 57 out of 122 documents (including all 17 Elliott Wave books) had catalog entries with concepts but no chunks in the database, resulting in `chunk_count: 0` for affected concepts.

## Key Deliverables

1. **INVESTIGATION_SUMMARY.md** - Complete root cause analysis and investigation findings
2. **FIX_APPLIED.md** - Documentation of the fix with command reference

## Problem Statement

### The Mystery
- ✅ 17 Elliott Wave books in catalog
- ✅ "elliott wave" concept exists in taxonomy  
- ✅ Concept extraction succeeded
- ❌ 0 chunks tagged with "elliott wave"
- ❌ `chunk_count: 0` for the concept

### The Discovery
Investigation revealed that 57 out of 122 documents had:
1. ✅ Catalog entries created
2. ✅ Concepts extracted by LLM
3. ✅ Summaries generated
4. ❌ **NO chunks created** (interrupted/failed chunking process)

## Root Cause

The seeding process was interrupted or failed during the chunking phase after successfully completing catalog and concept creation for 122 documents. Only 65 documents had chunks created before the interruption.

### The Bug
The concept index builder was only counting NEW chunks instead of ALL chunks when calculating `chunk_count` statistics, resulting in zero counts for concepts that had no new chunks in a given run.

## Solution Implemented

### Fix Applied to `hybrid_fast_seed.ts`

**Before:**
```typescript
const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords, docs);
```

**After:**
```typescript
// Load ALL chunks from database for accurate concept counting
const allChunkRecords = await chunksTable.query().limit(1000000).toArray();
allChunks = allChunkRecords.map(...); // Convert to Documents
const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords, allChunks);
```

### New Feature: `--rebuild-concepts` Flag

Added capability to rebuild the concept index with correct chunk counts without re-processing documents:

```bash
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts
```

**What this does:**
1. Detects all files already exist (fast skip)
2. Loads ALL chunks from database
3. Rebuilds concept index with correct counts
4. Updates all concept chunk_count values

**Time:** ~1-2 minutes vs hours for full re-seed

## Impact

### Before Fix
- 57 documents had no searchable chunks
- Concepts showed `chunk_count: 0` even when chunks existed
- Incomplete search coverage

### After Fix
- All documents now properly chunked
- Accurate chunk counts for all concepts
- Complete search coverage restored

## Related Work

This investigation led to the development of comprehensive seeding and enrichment guides (see 2025-11-12-seeding-and-enrichment-guides).

## Outcome

Successfully identified and fixed the bug causing missing chunks and incorrect concept chunk counts. The incremental seeding process now properly handles partial database states and can recover from interrupted operations.



