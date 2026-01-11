# Meta Content Detection - Executive Summary

## Status: 📋 PLANNING COMPLETE

**Work Package:** Exclude title and meta content from discovery
**Issue:** [#47](https://github.com/m2ux/concept-rag/issues/47)
**Type:** Feature Enhancement
**Priority:** High

---

## Quick Status

| Phase | Status | Notes |
|-------|--------|-------|
| Planning | ✅ Complete | Requirements, research, analysis, approach |
| Preparation | ⏳ Pending | ADR, feature branch, PR |
| Implementation | ⏳ Pending | 5 tasks defined |
| Validation | ⏳ Pending | Tests, build verification |
| Finalize | ⏳ Pending | Documentation, PR update |

---

## Problem Statement

Search results are polluted with non-content text (ToC entries, front/back matter) that match query terms but provide no substantive information, reducing retrieval quality.

## Solution Summary

Implement `MetaContentDetector` class following the established `ReferencesDetector` pattern to identify and classify:
- Table of Contents entries
- Front matter (copyright, preface, dedication)
- Back matter (index, glossary, appendix)

Add new chunk classification fields and `excludeMetaContent` search filter option.

## Success Criteria

- [ ] ToC entries detected with >90% accuracy
- [ ] Front/back matter detected for standard document structures
- [ ] Search results exclude meta content by default
- [ ] Migration script classifies existing database chunks
- [ ] Schema migration is backward compatible
- [ ] All existing tests pass

## Timeline

**Estimated Effort:** 6-10h agentic + 2h review

## Next Steps

1. Create feature branch `feat/meta-content-detection`
2. Create ADR documenting the approach
3. Implement tasks in order (see `01-work-package-plan.md`)

---

## Navigation

- [README.md](README.md) - Quick navigation
- [01-work-package-plan.md](01-work-package-plan.md) - Detailed implementation plan
- [02-kb-research.md](02-kb-research.md) - Knowledge base research findings
- [03-implementation-analysis.md](03-implementation-analysis.md) - Current implementation analysis





