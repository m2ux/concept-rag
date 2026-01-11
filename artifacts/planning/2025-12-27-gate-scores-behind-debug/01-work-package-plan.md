# Work Package Plan: Gate Scores Behind Debug Flag

## Problem Statement

MCP tool responses include detailed scoring profiles in every result, adding ~4-6KB overhead per query without clear benefit for agent reasoning. The `debug` parameter exists but doesn't control scoring output.

## Scope

### In Scope
- Gate `scores` object behind `debug: true` for 3 tools
- Update API reference documentation

### Out of Scope
- `expanded_terms` behavior (keep as-is)
- Scoring algorithms or weights
- Other tools

## Approach

### Design Decision

Use conditional spread operator pattern (already used in `concept_search.ts`):

```typescript
// Before: scores always included
const result = {
  source: r.source,
  scores: {
    hybrid: r.hybridScore.toFixed(3),
    // ...
  },
  expanded_terms: r.expandedTerms
};

// After: scores only when debug=true
const result = {
  source: r.source,
  ...(debug && {
    scores: {
      hybrid: r.hybridScore.toFixed(3),
      // ...
    }
  }),
  expanded_terms: r.expandedTerms
};
```

This pattern:
- Already exists in `concept_search.ts` (line 195-203)
- Minimal code change
- No new abstractions needed
- Type-safe

### Files to Modify

| File | Change |
|------|--------|
| `src/tools/operations/conceptual_catalog_search.ts` | Gate scores behind `params.debug` |
| `src/tools/operations/conceptual_broad_chunks_search.ts` | Gate scores behind `params.debug` |
| `src/tools/operations/concept_search.ts` | Scores already conditional, verify behavior |
| `docs/api-reference.md` | Document scores as debug-only output |

## Tasks

### Task 1: Update catalog_search (~15m)
- Modify `conceptual_catalog_search.ts`
- Wrap `scores` object in conditional spread with `params.debug`
- Verify debug parameter is passed through

### Task 2: Update broad_chunks_search (~15m)
- Modify `conceptual_broad_chunks_search.ts`
- Wrap `scores` object in conditional spread with `params.debug`
- Verify debug parameter is passed through

### Task 3: Update concept_search (~10m)
- Review existing conditional in `concept_search.ts`
- Verify scores are only included when debug=true
- May already be correct based on existing pattern

### Task 4: Update API documentation (~15m)
- Update `docs/api-reference.md`
- Move scores to "Additional Fields with debug: true" section
- Update output schema examples

### Task 5: Verify tests pass (~10m)
- Run full test suite
- Update any tests that expect scores in non-debug output

## Success Criteria

- [ ] `catalog_search` returns scores only when `debug: true`
- [ ] `broad_chunks_search` returns scores only when `debug: true`
- [ ] `concept_search` returns scores only when `debug: true`
- [ ] `expanded_terms` continues to be included (unchanged)
- [ ] API documentation updated
- [ ] All tests pass

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing consumers expecting scores | This is MCP internal—no external consumers |
| Tests may assert on scores | Update tests to use `debug: true` or remove score assertions |





