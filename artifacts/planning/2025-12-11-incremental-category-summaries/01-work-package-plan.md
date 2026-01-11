# Incremental Category Summaries - Implementation Plan

**Date:** 2025-12-11
**Priority:** HIGH
**Status:** Ready
**Estimated Effort:** 1-2h agentic + 30m review

---

## Overview

### Problem Statement
When adding a few new documents during incremental seeding, the system regenerates LLM summaries for ALL categories (~696), even though most already have valid summaries. This wastes LLM API calls, time (~24+ seconds), and money.

### Scope
**In Scope:**
- Query existing categories table before dropping it
- Extract category→summary mappings
- Filter to identify new categories only
- Generate LLM summaries only for new categories
- Merge cached + new summaries when building records

**Out of Scope:**
- Category extraction logic changes
- Database schema changes
- Concept summary optimization (similar pattern, separate work package)

---

## Current Implementation Analysis

### Implementation Review
**Current Usage:** `createCategoriesTable()` in `hybrid_fast_seed.ts` is called to build the categories table during seeding.

**Architecture:**
1. Extracts all unique categories from ALL catalog documents
2. Generates LLM summaries for ALL categories via `generateCategorySummaries()`
3. Drops existing categories table
4. Creates new table from scratch

**Integration Points:**
- `generateCategorySummaries()` from `src/concepts/summary_generator.ts`
- LanceDB connection for table operations

### Effectiveness Evaluation

**What's Working Well:** ✅
- Categories correctly extracted from documents
- LLM summaries are high quality
- Hash-based IDs provide stable identifiers

**What's Not Working:** ❌
- Existing summaries discarded on every run
- LLM calls made for ALL categories regardless of existing data
- No caching of summaries before table drop

### Baseline Metrics

| Metric | Current Value | Evidence Source |
|--------|--------------|-----------------|
| LLM calls per incremental run | ~24 batches | 696 categories ÷ 30 batch size |
| Time for category summaries | ~24+ seconds | 1s rate limit per batch |
| Categories regenerated | 100% | Code inspection |

### Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| No existing summary lookup | Wasted LLM calls, time, API costs | HIGH |
| Table dropped before data extraction | Loses existing summaries | HIGH |

### Opportunities for Improvement

1. **Query existing summaries before drop:** ~1 DB query to cache all existing summaries
2. **Filter to new categories only:** Simple set difference operation
3. **Expected result:** 90%+ reduction in LLM calls for typical incremental runs

---

## Proposed Approach

### Solution Design

1. Before any category processing, query existing categories table (if exists)
2. Build a Map<category_name, summary> from existing records
3. After extracting new category set, identify which are truly new
4. Call `generateCategorySummaries()` only for new categories
5. Merge cached summaries with newly generated ones
6. Build records using combined summary map

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Cache before drop | Simple, reliable, minimal changes | Extra DB query | **Selected** |
| Update table in-place | No table drop/recreate | Complex delta handling, deletion logic | Rejected |
| External cache file | Survives DB issues | File management, sync issues | Rejected |

---

## Implementation Tasks

### Task 1: Query Existing Category Summaries (15-20 min)
**Goal:** Add logic to query existing categories table and extract summaries before any modifications.

**Deliverables:**
- Add code at start of `createCategoriesTable()` to query existing table
- Build `Map<string, string>` of category→summary
- Handle case where table doesn't exist (first run)
- Log count of cached summaries

### Task 2: Filter to New Categories Only (10-15 min)
**Goal:** Identify which categories are new and only generate summaries for those.

**Deliverables:**
- Compute set difference: newCategories = allCategories - existingCategories
- Only pass new categories to `generateCategorySummaries()`
- Log counts: total, existing, new

### Task 3: Merge Summaries and Build Records (10-15 min)
**Goal:** Combine cached summaries with newly generated ones for record creation.

**Deliverables:**
- Merge newly generated summaries into cached summary map
- Use combined map when building category records
- Verify all categories have summaries (cached or generated)

---

## Success Criteria

### Functional Requirements
- [ ] Existing category summaries are preserved across incremental runs
- [ ] LLM only called for categories not in existing table
- [ ] First run (no existing table) works correctly
- [ ] Edge case: empty categories list handled

### Performance Targets
- [ ] LLM calls reduced from ~24 to ~0-2 for typical incremental runs (90%+ reduction)
- [ ] No regression for first-run performance

### Quality Requirements
- [ ] All existing tests pass
- [ ] Build succeeds
- [ ] ADR written

### Measurement Strategy
- Run seeder with 5 new documents
- Observe log output for category summary generation
- Verify only new categories trigger LLM calls

---

## Testing Strategy

### Manual Testing
- First run: All categories should generate summaries
- Incremental run with no new categories: 0 LLM calls expected
- Incremental run with 2 new categories: Only 2 categories in LLM batch

### Edge Cases
- No existing categories table (first run)
- Empty category set
- All categories already exist

---

## Dependencies & Risks

### Requires (Blockers)
- None

### Risks
- **Risk:** LanceDB query syntax changes | **Mitigation:** Use existing query patterns from codebase

---

**Status:** Ready for implementation













