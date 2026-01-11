# Codebase Analysis for Stage Caching

**Date:** December 3, 2025  
**Status:** Analysis Complete - Implementation Deferred

---

## Existing Checkpoint System

### File: `src/infrastructure/checkpoint/seeding-checkpoint.ts`

**Key Patterns to Reuse:**
- Atomic writes using temp file + rename (lines 190-216)
- Options interface pattern with `checkpointPath`, validation fields
- Factory method `create()` for load-on-construct
- In-memory Set for O(1) lookups (`processedHashSet`)

**Current Data Structure:**
```typescript
interface SeedingCheckpointData {
    processedHashes: string[];     // Only tracks "was file processed"
    stage: SeedingStage;           // documents | concepts | summaries | complete
    lastFile: string;
    totalProcessed: number;
    totalFailed: number;
    failedFiles: string[];
    version: number;
    databasePath: string;
    filesDir: string;
}
```

**Limitation Confirmed:** No storage of actual LLM results - only flags.

---

## LLM Call Locations in `hybrid_fast_seed.ts`

### 1. Content Overview Generation
```typescript
// Line 553-564
async function generateContentOverview(rawDocs: Document[]): Promise<string> {
    const combinedText = rawDocs.map(doc => doc.pageContent).join('\n\n').slice(0, 10000);
    const summary = await callOpenRouterChat(combinedText);  // LLM CALL
    return summary;
}
```

### 2. Concept Extraction (Sequential)
```typescript
// Lines 1414-1428
const contentOverview = await generateContentOverview(docs);  // LLM CALL 1
concepts = await conceptExtractor.extractConcepts(docs);      // LLM CALL 2
```

### 3. Concept Extraction (Parallel)
```typescript
// Lines 1494-1563
const parallelExtractor = new ParallelConceptExtractor(...);
const results = await parallelExtractor.extractAll(documentSets, {...});
// Results contain concepts but still need contentOverview generated after
```

---

## Data Types for Caching

### From `src/concepts/types.ts`

```typescript
interface ExtractedConcept {
    name: string;
    summary: string;  // One-sentence summary from LLM
}

interface ConceptMetadata {
    primary_concepts: (ExtractedConcept | string)[];  // Mixed format
    categories: string[];
}
```

### Recommended Cache Schema

```typescript
interface CachedDocumentData {
    hash: string;
    source: string;
    processedAt: string;   // ISO timestamp
    
    // LLM Results
    concepts: {
        primary_concepts: (ExtractedConcept | string)[];
        categories: string[];
    };
    contentOverview: string;  // From generateContentOverview()
    
    // Optional bibliographic metadata
    metadata?: {
        title: string;
        author: string;
        year: number;
        publisher: string;
        isbn: string;
    };
}
```

---

## Integration Points Identified

### Sequential Processing (`processDocuments`)
**Location:** Lines 1370-1465

**Cache Check Point:**
```typescript
// Insert BEFORE line 1412
const cached = await stageCache.get(hash);
if (cached?.concepts && cached?.contentOverview) {
    // Use cached data, skip LLM calls
}
```

**Cache Write Point:**
```typescript
// Insert AFTER line 1427 (after successful concept extraction)
await stageCache.set(hash, { ... });
```

### Parallel Processing (`processDocumentsParallel`)
**Location:** Lines 1471-1666

**Integration Strategy:**
- Check cache before adding to `documentSets` Map
- Or: modify `ParallelConceptExtractor` to accept cache (more invasive)
- Recommended: Check cache in the result processing loop (lines 1588-1619)

---

## Test Pattern Reference

From `src/infrastructure/checkpoint/__tests__/seeding-checkpoint.test.ts`:

```typescript
describe('SeedingCheckpoint', () => {
    let tempDir: string;
    
    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'checkpoint-test-'));
    });
    
    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });
    
    // Test cases for CRUD, atomic writes, resume scenarios
});
```

---

## Files to Create/Modify

### New Files
| File | Lines (est) | Purpose |
|------|-------------|---------|
| `src/infrastructure/checkpoint/stage-cache.ts` | ~200 | StageCache class |
| `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts` | ~300 | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `hybrid_fast_seed.ts` | Add cache init, check/write calls, CLI flags |
| `src/infrastructure/checkpoint/index.ts` | Export StageCache |

---

## Implementation Order

1. **Task 1:** StageCache class (no dependencies)
2. **Task 2:** Integration into `hybrid_fast_seed.ts` (depends on Task 1)
3. **Task 3:** Resume logic refinement (depends on Task 2)
4. **Task 4:** CLI flags (depends on Task 2)
5. **Task 5:** Tests (can start after Task 1, expand after each task)

---

## Open Questions

1. **Cache location:** Plan suggests `{dbPath}/.stage-cache/` - confirm this is acceptable
2. **Parallel processing integration:** Modify extractor vs. post-process check?
3. **Cache-on-success vs cache-before-write:** Currently plan says cache immediately after LLM success (safer)

---

## Ready for Implementation

All analysis complete. When ready to implement:
1. Start with Task 1 (StageCache class)
2. Follow AGENTS.md one-task-at-a-time workflow
3. Run tests after each task






