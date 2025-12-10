# ADR-0048: Stage Caching for LLM Results

## Status

Proposed

## Context

When seeding the database, the system performs expensive LLM operations (concept extraction, summary generation) for each document. Currently, these results are held only in memory until the final database write stage.

This creates a significant risk: if any downstream stage fails (e.g., LanceDB schema error, disk full, connection timeout), all LLM processing work is lost. In a real incident, 212 documents were processed over 2h 22m with 492 API requests, but a schema bug in `category_ids` caused the LanceDB write to fail, losing all LLM work.

The existing `SeedingCheckpoint` class only tracks which files have been processed (a boolean flag), not the actual LLM results. This means "resume" still requires re-running all LLM calls.

## Decision

Implement a **Stage Cache** system that persists LLM results to disk immediately after extraction, before any database operations.

### Design Principles

1. **Immediate persistence**: Write LLM results to disk right after successful extraction
2. **File-per-document pattern**: Store each document's results in `{cacheDir}/{hash}.json`
3. **Atomic writes**: Use temp file + rename pattern to prevent corruption
4. **TTL support**: Allow stale cache cleanup (default: 7 days)
5. **Cache-as-checkpoint**: Cache presence indicates "was processed" - no separate tracking needed

### Interface

```typescript
interface StageCacheOptions {
    cacheDir: string;
    ttlMs?: number;
}

interface CachedDocumentData {
    hash: string;
    source: string;
    processedAt: string;
    concepts?: {
        primary_concepts: ExtractedConcept[];
        technical_terms: string[];
        related_concepts: string[];
        categories: string[];
    };
    summary?: string;
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

### Processing Flow

```
1. Load documents from filesystem
2. For each document:
   ├─ Check cache for existing results
   │  (if found, use cached data - no LLM calls)
   │
   └─ If not cached:
      - Extract concepts (LLM)
      - Generate summary (LLM)
      - Write to stage cache IMMEDIATELY
3. Load all results (cached + newly processed)
4. Write to LanceDB (if fails, cache preserved)
5. Create downstream tables (if fails, cache preserved)
6. On SUCCESS: optionally clear cache
```

### CLI Flags

- `--use-cache` (default: true): Check stage cache before LLM calls
- `--clear-cache`: Remove all cached data before starting
- `--cache-only`: Fail if document not in cache (no LLM calls)
- `--cache-dir`: Custom cache directory location

## Consequences

### Positive

- **Zero data loss**: LLM results survive any downstream failure
- **Fast resume**: Resume from 200-doc cache in <30 seconds vs 2+ hours
- **Unified system**: Cache presence replaces separate checkpoint tracking
- **Cost savings**: No repeated LLM API calls on failure

### Negative

- **Disk space**: Cache requires storage (~1MB per document average)
- **Complexity**: Additional cache management code
- **Stale data risk**: Must handle cache invalidation for document changes

### Neutral

- Deprecates existing `SeedingCheckpoint` class (can be removed after validation)
- Cache directory added to `.gitignore`

## Implementation

### Files to Create

- `src/infrastructure/checkpoint/stage-cache.ts`
- `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts`
- `src/__tests__/integration/stage-cache-resume.test.ts`

### Files to Modify

- `hybrid_fast_seed.ts` - integrate cache into processing flow
- `src/infrastructure/checkpoint/index.ts` - export StageCache

## References

- Planning documents: `.ai/planning/2025-11-29-stage-caching/`
- Existing checkpoint: `src/infrastructure/checkpoint/seeding-checkpoint.ts`
