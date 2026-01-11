# Gate Scores Behind Debug Flag

**Status:** 🔄 IN PROGRESS  
**Issue:** [#59](https://github.com/m2ux/concept-rag/issues/59)  
**Type:** Refactor  
**Estimated Effort:** 1-2h agentic + 15m review

## Summary

Move scoring profile output (`hybrid`, `vector`, `bm25`, `title`, `concept`, `wordnet`) behind the `debug: true` parameter in MCP tool responses. This reduces response overhead for day-to-day usage while preserving scoring visibility for debugging and evaluation.

## Progress

| Task | Status |
|------|--------|
| 1. Update `catalog_search` | ⬜ Pending |
| 2. Update `broad_chunks_search` | ⬜ Pending |
| 3. Update `concept_search` | ⬜ Pending |
| 4. Update API documentation | ⬜ Pending |
| 5. Verify tests pass | ⬜ Pending |

## Success Criteria

- [ ] Scores only appear in output when `debug: true`
- [ ] `expanded_terms` remains unchanged (always included)
- [ ] All existing tests pass
- [ ] Documentation reflects new behavior





