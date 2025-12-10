# ADR-0048: Stage Caching for LLM Results

## Status

Proposed

## Context

When seeding the database, the system performs expensive LLM operations (concept extraction, summary generation) for each document. Currently, these results are held only in memory until the final database write stage.

### Technical Forces

- LLM extraction takes 2-10 seconds per document
- Memory usage grows linearly with batch size
- LanceDB writes are atomic but can fail on schema issues
- The existing `SeedingCheckpoint` class only tracks which files have been processed (a boolean flag), not the actual LLM results

### Business Forces

- A real incident: 212 documents processed over 2h 22m with 492 API requests, but a schema bug in `category_ids` caused the LanceDB write to fail, losing all LLM work
- Re-processing after failure doubles API costs and delays
- Production seeding represents significant time investment

### Operational Forces

- Production seeding runs are scheduled overnight
- Failures require manual intervention to resume
- Current "resume" still requires re-running all LLM calls

## Decision Drivers

1. **Zero data loss** - LLM results must survive any downstream failure
2. **Fast resume** - Re-running should skip already-processed documents
3. **Minimal complexity** - Solution should be simple to implement and maintain
4. **No external dependencies** - Avoid adding new infrastructure requirements (Redis, databases)

## Considered Options

### Option 1: File-Based Stage Cache (Selected)

Persist LLM results to individual JSON files on disk immediately after extraction.

**Pros:**
- Simple implementation using Node.js filesystem APIs
- No external dependencies
- Files survive process crashes and can be inspected manually
- Natural file-per-document mapping matches processing model

**Cons:**
- Disk I/O overhead (minimal for JSON writes)
- Requires disk space (~1MB per document average)
- Manual cleanup needed for stale cache files

### Option 2: SQLite Cache

Use an embedded SQLite database to store LLM results.

**Pros:**
- ACID guarantees
- Efficient queries for cache stats
- Single file for all cache data

**Cons:**
- Additional dependency (better-sqlite3)
- More complex schema management
- Overkill for simple key-value storage pattern

### Option 3: In-Memory Cache with Periodic Snapshots

Keep results in memory but periodically write snapshots to disk.

**Pros:**
- Faster access during processing
- Reduced disk I/O

**Cons:**
- Data loss between snapshots if process crashes
- More complex recovery logic
- Doesn't solve the core problem of downstream failures

## Decision

Implement **Option 1: File-Based Stage Cache** because it provides zero data loss with minimal complexity and no external dependencies.

The stage cache persists LLM results to disk immediately after extraction, before any database operations.

### Key Design Choices

1. **Immediate persistence**: Write LLM results to disk right after successful extraction
2. **File-per-document pattern**: Store each document's results in `{cacheDir}/{hash}.json`
3. **Atomic writes**: Use temp file + rename pattern to prevent corruption
4. **TTL support**: Allow stale cache cleanup (default: 7 days)
5. **Cache-as-checkpoint**: Cache presence indicates "was processed" - no separate tracking needed

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

## Confirmation

The decision will be validated through:

1. **Unit tests**: Verify `StageCache` CRUD operations, atomic writes, and TTL expiration
2. **Integration tests**: Simulate failure scenarios and verify resume behavior
3. **Manual validation**: Process sample documents, kill process mid-run, verify resume

**Success criteria:**

| Metric | Target |
|--------|--------|
| Resume time (200 docs cached) | < 30 seconds |
| Cache overhead per document | < 100ms |
| Data loss on any failure | 0% |
| Test coverage (new code) | 100% |

## Implementation

### Files to Create

- `src/infrastructure/checkpoint/stage-cache.ts`
- `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts`
- `src/__tests__/integration/stage-cache-resume.test.ts`

### Files to Modify

- `hybrid_fast_seed.ts` - integrate cache into processing flow
- `src/infrastructure/checkpoint/index.ts` - export StageCache

## References

- Existing checkpoint implementation: `src/infrastructure/checkpoint/seeding-checkpoint.ts`
