# Stage Caching Planning Session

**Date:** November 29, 2025  
**Objective:** Implement disk-based caching for expensive LLM operations during seeding  
**Trigger:** 2+ hours of LLM processing lost due to LanceDB write failure  
**Status:** 📋 Planning Complete - Implementation Deferred  
**Last Updated:** December 3, 2025

---

## 🎯 Problem Summary

When seeding the database:
1. **212 documents** were processed over **2h 22m** with expensive LLM calls
2. **492 API requests** were made for concept extraction and summaries
3. All results were held **only in memory**
4. A schema bug in `category_ids` caused the LanceDB write to fail
5. **All LLM work was lost** - must repeat 2+ hours of processing

**Root Cause:** No intermediate caching of LLM results between processing and database write stages.

---

## 📋 Planning Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [01-stage-caching-plan.md](01-stage-caching-plan.md) | Detailed feature plan with tasks | ✅ Complete |
| [02-codebase-analysis.md](02-codebase-analysis.md) | Codebase analysis and integration points | ✅ Complete |
| STAGE-CACHING-COMPLETE.md | Implementation summary | 🔜 After implementation |

---

## 🚀 Implementation Tasks

### Task 1: Stage Cache Infrastructure
**Effort:** 45-60 min | **Priority:** HIGH

Create `StageCache` class for persisting LLM results to disk:
- File-per-document pattern: `{cacheDir}/{hash}.json`
- Atomic writes (temp + rename)
- TTL support for cleanup

**Deliverables:**
- `src/infrastructure/checkpoint/stage-cache.ts`
- `src/infrastructure/checkpoint/__tests__/stage-cache.test.ts`

### Task 2: Document Processing Integration  
**Effort:** 60-90 min | **Priority:** HIGH

Modify `hybrid_fast_seed.ts` to:
- Check cache before LLM calls
- Write to cache immediately after LLM success
- Load from cache on resume

### Task 3: Partial Failure Resume
**Effort:** 45-60 min | **Priority:** HIGH

Handle all failure scenarios:
- Mid-processing failure (some cached, some not)
- LanceDB write failure (all cached)
- Downstream table failures

### Task 4: CLI Flags and UX
**Effort:** 30-45 min | **Priority:** MEDIUM

Add flags:
- `--use-cache` (default: true)
- `--clear-cache`
- `--cache-only`
- `--cache-dir`

### Task 5: Testing and Validation
**Effort:** 45-60 min | **Priority:** HIGH

- Unit tests for StageCache
- Integration tests for resume scenarios
- Manual validation script

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Resume time (200 docs cached) | <30 seconds |
| Cache overhead per document | <100ms |
| Data loss on any failure | 0% |
| Test coverage (new code) | 100% |

---

## 🛡️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Disk space | Monitor size, add warnings |
| Parallel worker conflicts | Use file-per-document pattern |
| Stale cache | TTL expiration (7 days default) |
| Cache corruption | Atomic writes |

---

## 📂 Files Overview

### New Files
```
src/infrastructure/checkpoint/stage-cache.ts
src/infrastructure/checkpoint/__tests__/stage-cache.test.ts
src/__tests__/integration/stage-cache-resume.test.ts
test/scripts/test-stage-cache.sh
```

### Modified Files
```
hybrid_fast_seed.ts
src/infrastructure/checkpoint/index.ts
```

---

## ⏭️ Next Steps (When Ready)

**Implementation deferred.** When ready to proceed:

1. Create feature branch:
```bash
git checkout -b feat/stage-caching
```

2. Begin Task 1: Create `StageCache` class
3. See [02-codebase-analysis.md](02-codebase-analysis.md) for integration points

---

## 📝 Notes

- This is a **CRITICAL** fix - prevents hours of wasted LLM processing
- The current `SeedingCheckpoint` only tracks "was processed" - not the results
- The fix for `category_ids` (placeholder array) is already in place
- After this feature, re-seeding can recover from any failure point

## 🔍 Analysis Summary (Dec 3, 2025)

**Key Findings:**
- Existing checkpoint uses atomic writes (temp + rename) - pattern to reuse
- LLM calls in `hybrid_fast_seed.ts`: `generateContentOverview()` and `extractConcepts()`
- Integration points identified in both sequential and parallel processing paths
- Test patterns established in `seeding-checkpoint.test.ts`

**Ready to implement** - see [02-codebase-analysis.md](02-codebase-analysis.md) for details.

---

## ⚠️ Current Checkpoint System

**The existing `SeedingCheckpoint` class should be considered for removal.**

The new Stage Cache is a **superior alternative** that:
- Stores actual LLM results, not just "was processed" flags
- Enables true recovery (no re-processing needed)
- Provides a single source of truth

**Migration Path:**
1. Implement Stage Cache
2. Use cache presence as "was processed" check
3. Deprecate `SeedingCheckpoint`
4. Remove after validation

See [01-stage-caching-plan.md](01-stage-caching-plan.md) for detailed comparison.

