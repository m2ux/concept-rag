# Stage Caching Feature Plan

**Date:** November 29, 2025  
**Priority:** CRITICAL  
**Effort:** 4-6h implementation + 1h review  
**Status:** PLANNING

---

## Problem Statement

**The Core Problem:** LLM concept extraction and summary generation are expensive operations (time and cost), but results are held only in memory. If any downstream stage fails (e.g., LanceDB write), all processing work is lost and must be repeated.

### Evidence from Recent Failure

From `log1.txt`:
```
✅ Completed: 212/212 documents
⏱  Total time: 8520.6s (2h 22m)
📊 Rate limiter: 492 requests, avg wait 12357ms
✅ Content overview generated (x212)
📊 Creating catalog table with fast local embeddings...
🔄 Creating simple embeddings for 212 catalog...
✅ Generated 212 embeddings locally
❌ Seeding failed: Error: Could not convert column "category_ids" to Arrow...
```

**Impact:** 2+ hours of LLM processing lost due to a schema bug in the final write stage.

---

## Current State Analysis

### What the Current Checkpoint Tracks

```typescript
// src/infrastructure/checkpoint/seeding-checkpoint.ts
interface SeedingCheckpointData {
    processedHashes: string[];     // Only tracks "was file processed"
    stage: SeedingStage;           // documents | concepts | summaries | complete
    lastFile: string;
    totalProcessed: number;
    totalFailed: number;
    failedFiles: string[];
}
```

**Limitation:** No storage of actual LLM results. The checkpoint says "document X was processed" but the concepts/summary are only in memory.

### ⚠️ Current Checkpoint System Assessment

**The current `SeedingCheckpoint` system should be considered for removal/replacement:**

| Aspect | Current Checkpoint | New Stage Cache |
|--------|-------------------|-----------------|
| Tracks what | "Was file processed?" (boolean) | Full LLM results (concepts, summary, metadata) |
| Recovery | Must re-process all LLM work | Zero re-processing needed |
| Data preserved | None | Everything |
| Failure recovery | Useless if LLM work lost | Complete recovery |
| Complexity | Separate system to maintain | Unified caching approach |

**Recommendation:** The Stage Cache can fully subsume the checkpoint functionality:
- If a document has a cache entry with `concepts` and `summary`, it was processed
- The cache file itself IS the checkpoint
- No need for separate `processedHashes` array

**Migration path:**
1. Implement Stage Cache (this feature)
2. Modify seeding to use cache for "was processed" checks
3. Deprecate `SeedingCheckpoint` class
4. Remove old checkpoint code after validation

**Benefits of removal:**
- Single source of truth for processing state
- Simpler codebase (one system instead of two)
- More robust recovery (data + state in one place)
- No synchronization issues between checkpoint and cache

### Processing Flow (Current)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Load documents from filesystem                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 2. For each document:                                    │
│    - Extract concepts (LLM) ───────────────────────┐    │
│    - Generate summary (LLM) ───────────────────────┼───►│ IN MEMORY ONLY
│    - Build catalog record ─────────────────────────┘    │
│    - Mark hash as processed (checkpoint)                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 3. Write ALL catalog records to LanceDB                  │◄── FAILURE POINT
│    (single batch operation)                              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 4. Create chunks, concepts, categories tables            │◄── MORE FAILURE POINTS
└─────────────────────────────────────────────────────────┘
```

**Problem:** If step 3 or 4 fails, all LLM work from step 2 is lost.

---

## Target State

### Processing Flow (With Stage Caching)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Load documents from filesystem                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 2. For each document:                                    │
│    ├─ Check cache for existing results ◄────────────┐   │
│    │  (if found, use cached data)                    │   │
│    │                                                 │   │
│    └─ If not cached:                                 │   │
│       - Extract concepts (LLM) ──────────────────┐   │   │
│       - Generate summary (LLM) ──────────────────┼───┼──►│ WRITE TO DISK
│       - Build catalog record ────────────────────┘   │   │ IMMEDIATELY
│       - Write to stage cache ◄───────────────────────┘   │
│       - Mark hash as processed (checkpoint)              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 3. Load ALL cached results from disk                     │
│    (no LLM calls needed if cache hit)                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 4. Write catalog records to LanceDB                      │◄── If fails, cache preserved
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 5. Create chunks, concepts, categories tables            │◄── If fails, cache preserved
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 6. On SUCCESS: Clear stage cache (optional cleanup)      │
└─────────────────────────────────────────────────────────┘
```

**Key Change:** LLM results are persisted to disk immediately after extraction, before any database operations.

---

## Implementation Tasks

### Task 1: Stage Cache Infrastructure (45-60 min)

**Goal:** Create a generic stage cache system for persisting intermediate processing results.

**Deliverables:**
- `src/infrastructure/checkpoint/stage-cache.ts`
- `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts`

**Requirements:**
- Store/retrieve JSON-serializable data by hash key
- Atomic writes (temp file + rename) to prevent corruption
- Support TTL/expiration for stale cache cleanup
- Configurable cache directory (default: `{dbPath}/.stage-cache/`)
- File-per-document pattern: `{cacheDir}/{hash}.json`

**Interface Design:**
```typescript
interface StageCacheOptions {
    cacheDir: string;
    ttlMs?: number;        // Optional TTL for cache entries
}

interface CachedDocumentData {
    hash: string;
    source: string;
    processedAt: string;   // ISO timestamp
    
    // Concept extraction results
    concepts?: {
        primary_concepts: ExtractedConcept[];
        technical_terms: string[];
        related_concepts: string[];
        categories: string[];
    };
    
    // Summary/overview results  
    summary?: string;
    
    // Bibliographic metadata (from filename parsing)
    metadata?: {
        title: string;
        author: string;
        year: number;
        publisher: string;
        isbn: string;
    };
}

class StageCache {
    constructor(options: StageCacheOptions);
    
    async get(hash: string): Promise<CachedDocumentData | null>;
    async set(hash: string, data: CachedDocumentData): Promise<void>;
    async has(hash: string): Promise<boolean>;
    async delete(hash: string): Promise<void>;
    async clear(): Promise<void>;
    async getStats(): Promise<{ count: number; totalSize: number }>;
    async cleanExpired(): Promise<number>;
}
```

**Test Cases:**
- Store and retrieve document data
- Handle missing/non-existent cache entries
- Atomic write safety (no partial writes)
- TTL expiration cleanup
- Concurrent access safety
- Large data handling (multi-MB concept lists)

---

### Task 2: Integrate Stage Cache into Document Processing (60-90 min)

**Goal:** Modify `hybrid_fast_seed.ts` to use stage cache for concept extraction and summary generation.

**Deliverables:**
- Modified `hybrid_fast_seed.ts`
- Updated `processDocuments()` and `processDocumentsParallel()` functions

**Changes Required:**

1. **Initialize stage cache at startup:**
```typescript
const stageCache = new StageCache({
    cacheDir: path.join(databaseDir, '.stage-cache'),
    ttlMs: 7 * 24 * 60 * 60 * 1000  // 7 days TTL
});
```

2. **Check cache before LLM calls:**
```typescript
async function processDocument(doc: Document, stageCache: StageCache) {
    const hash = doc.metadata.hash;
    
    // Check cache first
    const cached = await stageCache.get(hash);
    if (cached && cached.concepts && cached.summary) {
        console.log(`📦 Using cached results for ${path.basename(doc.metadata.source)}`);
        return buildCatalogRecordFromCache(doc, cached);
    }
    
    // Cache miss - perform expensive LLM operations
    const concepts = await conceptExtractor.extractConcepts(doc.pageContent);
    const summary = await generateSummary(doc.pageContent);
    
    // Cache immediately after LLM success
    await stageCache.set(hash, {
        hash,
        source: doc.metadata.source,
        processedAt: new Date().toISOString(),
        concepts,
        summary,
        metadata: parseFilenameMetadata(doc.metadata.source)
    });
    
    return buildCatalogRecord(doc, concepts, summary);
}
```

3. **Update parallel processing:**
```typescript
async function processDocumentsParallel(
    docsBySource: Record<string, Document[]>,
    checkpoint: SeedingCheckpoint,
    stageCache: StageCache,  // New parameter
    workers: number
) {
    // Pass cache to workers
    // Each worker checks cache before LLM calls
}
```

4. **Cache cleanup on success:**
```typescript
// At end of successful seeding
if (seedingSuccessful) {
    console.log('🧹 Cleaning up stage cache...');
    const cleaned = await stageCache.clear();
    console.log(`✅ Removed ${cleaned} cached entries`);
}
```

---

### Task 3: Handle Partial Failures and Resume (45-60 min)

**Goal:** Ensure the system can resume from any failure point using cached data.

**Deliverables:**
- Modified resume logic in `hybrid_fast_seed.ts`
- New `--use-cache` flag for explicit cache usage

**Scenarios to Handle:**

1. **Failure during LLM processing:**
   - Some documents cached, some not
   - On resume: use cached for processed docs, continue LLM for remaining

2. **Failure during LanceDB write:**
   - All LLM work cached
   - On resume: load all from cache, retry write only

3. **Failure during chunk/concept/category creation:**
   - Catalog written, but downstream tables failed
   - Cache still available for rebuild

**Resume Flow:**
```typescript
async function resumeFromCache(stageCache: StageCache, rawDocs: Document[]) {
    const catalogRecords: Document[] = [];
    const needsProcessing: Document[] = [];
    
    for (const doc of rawDocs) {
        const cached = await stageCache.get(doc.metadata.hash);
        if (cached && cached.concepts && cached.summary) {
            // Use cached data
            catalogRecords.push(buildCatalogRecordFromCache(doc, cached));
        } else {
            // Needs LLM processing
            needsProcessing.push(doc);
        }
    }
    
    console.log(`📦 Found ${catalogRecords.length} cached results`);
    console.log(`🔄 Need to process ${needsProcessing.length} documents`);
    
    return { catalogRecords, needsProcessing };
}
```

---

### Task 4: CLI Flags and User Experience (30-45 min)

**Goal:** Add CLI options to control caching behavior.

**Deliverables:**
- New CLI flags in `hybrid_fast_seed.ts`
- Help text updates

**New Flags:**
```typescript
const argv = minimist(process.argv.slice(2), {
    boolean: [
        "overwrite", 
        "rebuild-concepts", 
        "auto-reseed", 
        "clean-checkpoint", 
        "resume", 
        "with-wordnet",
        "use-cache",      // NEW: Prefer cached LLM results
        "clear-cache",    // NEW: Clear stage cache before processing
        "cache-only"      // NEW: Only use cache, don't make LLM calls
    ],
    string: ["dbpath", "filesdir", "max-docs", "parallel", "cache-dir"]
});
```

**Flag Behavior:**
- `--use-cache` (default: true): Check stage cache before LLM calls
- `--clear-cache`: Remove all cached data before starting
- `--cache-only`: Fail if document not in cache (no LLM calls)
- `--cache-dir`: Custom cache directory location

**Progress Output:**
```
📂 Database: db/preprod_db
📦 Stage cache: db/preprod_db/.stage-cache/
   └─ 180 cached documents (156 MB)

🔄 Processing 212 documents...
   ├─ 180 from cache (85%)
   └─ 32 need LLM processing

📊 Progress: 32/32 (100%) - Processing new documents...
✅ All documents processed

📊 Creating catalog table...
```

---

### Task 5: Testing and Validation (45-60 min)

**Goal:** Comprehensive testing of cache functionality and resume scenarios.

**Deliverables:**
- `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts`
- `src/__tests__/integration/stage-cache-resume.test.ts`
- Manual testing script

**Test Scenarios:**

1. **Unit Tests:**
   - StageCache CRUD operations
   - Atomic write safety
   - TTL expiration
   - Concurrent access
   - Error handling

2. **Integration Tests:**
   - Full seeding with cache enabled
   - Resume after simulated failure
   - Cache hit/miss statistics
   - Large document handling

3. **Manual Validation Script:**
```bash
#!/bin/bash
# test/scripts/test-stage-cache.sh

# Test 1: Fresh seed with caching
npx ts-node hybrid_fast_seed.ts --filesdir sample-docs --dbpath db/test_cache

# Test 2: Simulate failure mid-way
# (Ctrl+C during processing)

# Test 3: Resume and verify cache usage
npx ts-node hybrid_fast_seed.ts --filesdir sample-docs --dbpath db/test_cache --resume

# Test 4: Cache-only mode (no LLM calls)
npx ts-node hybrid_fast_seed.ts --filesdir sample-docs --dbpath db/test_cache --cache-only
```

---

## Success Criteria

### Functional
- [ ] LLM results cached to disk immediately after extraction
- [ ] Resume uses cached data without re-calling LLM
- [ ] All CLI flags work as documented
- [ ] Cache cleanup on successful completion

### Performance
- [ ] Cache read/write adds <100ms overhead per document
- [ ] Resume from 200-doc cache completes in <30 seconds (vs 2+ hours for re-processing)
- [ ] Cache size reasonable (<1MB per document average)

### Quality
- [ ] 100% test coverage of new StageCache class
- [ ] Integration tests for all resume scenarios
- [ ] No data loss on any failure scenario

---

## Risk Assessment

### Low Risk
- File I/O operations are well-understood
- JSON serialization is straightforward
- Similar patterns exist in checkpoint code

### Medium Risk
- Parallel worker coordination with cache
- Cache invalidation edge cases
- Disk space management for large libraries

### Mitigation
- Use atomic writes (already in checkpoint code)
- Add cache size monitoring and warnings
- Document cache cleanup procedures

---

## Implementation Selection Matrix

| Task | Priority | Effort | Dependencies | Include |
|------|----------|--------|--------------|---------|
| 1. Stage Cache Infrastructure | HIGH | 45-60m | None | ✓ |
| 2. Document Processing Integration | HIGH | 60-90m | Task 1 | ✓ |
| 3. Partial Failure Resume | HIGH | 45-60m | Task 1, 2 | ✓ |
| 4. CLI Flags and UX | MEDIUM | 30-45m | Task 1, 2 | ✓ |
| 5. Testing and Validation | HIGH | 45-60m | Task 1-4 | ✓ |

**Total Estimated Effort:** 4-6 hours

---

## Files to Create/Modify

### New Files
```
src/infrastructure/checkpoint/stage-cache.ts (~200 lines)
src/infrastructure/checkpoint/__tests__/stage-cache.test.ts (~300 lines)
src/__tests__/integration/stage-cache-resume.test.ts (~150 lines)
test/scripts/test-stage-cache.sh (~30 lines)
```

### Modified Files
```
hybrid_fast_seed.ts
  - Add StageCache initialization
  - Modify processDocuments/processDocumentsParallel
  - Add CLI flags
  - Update progress output
  
src/infrastructure/checkpoint/index.ts
  - Export StageCache
```

---

## Next Steps

1. **Immediate:** Implement Task 1 (Stage Cache Infrastructure)
2. **Then:** Integrate into document processing (Task 2)
3. **Then:** Handle resume scenarios (Task 3)
4. **Then:** Add CLI flags (Task 4)
5. **Finally:** Comprehensive testing (Task 5)

---

**Ready to begin implementation?**

