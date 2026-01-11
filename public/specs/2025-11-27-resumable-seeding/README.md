# Resumable Seeding Architecture

**Status**: Planned  
**Priority**: Medium  
**Created**: 2025-11-27

## Problem Statement

The `hybrid_fast_seed.ts` script processes all documents in batch, writing catalog entries and chunks in large batches. If terminated mid-way through seeding:
- Database may be left in inconsistent state
- Catalog entries may exist without corresponding chunks
- Chunks may exist without concept assignments
- Concept index may be incomplete

## Current Behavior

- `--overwrite` flag drops all tables and rebuilds from scratch
- Hash-based detection skips already-complete documents
- `--auto-reseed` removes incomplete/duplicate records
- No explicit checkpoint mechanism

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESUMABLE SEEDING FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  For each document file:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Calculate file hash                                   │   │
│  │ 2. Check if hash exists in catalog → skip if complete    │   │
│  │ 3. Load & process document (LLM extraction)             │   │
│  │ 4. Write catalog entry (atomic)                         │   │
│  │ 5. Create chunks (atomic)                               │   │
│  │ 6. Write to checkpoint file                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  After all documents:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 7. Rebuild concept index from complete data              │   │
│  │ 8. Run lexical linking                                  │   │
│  │ 9. Generate summaries                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Checkpoint File Schema

```typescript
interface SeedingCheckpoint {
  // Which files have been fully processed (catalog + chunks)
  processedHashes: string[];
  
  // Current stage
  stage: 'documents' | 'concepts' | 'summaries' | 'complete';
  
  // Last successfully processed file
  lastFile: string;
  
  // Timestamp
  lastUpdatedAt: string;
  
  // Stats
  totalProcessed: number;
  totalFailed: number;
  failedFiles: string[];
}
```

## Implementation Options

### Option A: Per-Document Commits (Recommended)
- Process one document at a time through catalog + chunks
- Commit after each document
- Slower but fully atomic
- Resume continues from last checkpoint

### Option B: Batch with Stage Checkpoints
- Keep batch processing
- Checkpoint after each stage (catalog → chunks → concepts)
- Faster but coarser granularity
- May need to reprocess entire stage on failure

### Option C: Enhanced Hash Detection
- Minimal changes to existing script
- Rely on hash-based skip detection
- Add `--resume` flag that skips concept rebuild if already done
- Simplest but least robust

## Files to Modify

1. `hybrid_fast_seed.ts` - Main seeding script
2. New: `src/infrastructure/checkpoint/seeding-checkpoint.ts` - Checkpoint management

## Acceptance Criteria

- [ ] Script can be interrupted at any point
- [ ] Re-running script continues from where it left off
- [ ] No duplicate catalog entries or chunks
- [ ] Concept index is rebuilt correctly on resume
- [ ] Checkpoint file is human-readable (JSON)
- [ ] `--clean-checkpoint` flag to start fresh

## Related Work

- `scripts/seed_pages_table.ts` already has checkpoint mechanism (can use as reference)
















