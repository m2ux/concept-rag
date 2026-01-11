# Planning Branch Architecture Migration

**Status:** 🚧 In Progress  
**Issue:** [#68](https://github.com/m2ux/concept-rag/issues/68)  
**PR:** [#69](https://github.com/m2ux/concept-rag/pull/69)  
**Branch:** `refactor/planning-branch-architecture`

---

## Executive Summary

Migrate engineering artifacts (ADRs, work package plans, reviews) from a separate private planning repository to an orphan `planning` branch within the concept-rag repository. This enables co-location of planning with code while keeping histories separate.

## Goal

- Planning docs accessible from same repo as code
- Clean separation between code history (`main`) and planning history (`planning` branch)
- No disruption to existing workflows during migration

## Approach

1. Create orphan `planning` branch with public structure
2. Filter content for chat history and cross-project references
3. Copy (not move) filtered content to planning branch
4. Set up git worktree for parallel access
5. Maintain existing symlink until full migration complete

## Key Constraints

- ⚠️ **No chat history in public branch** — content inspection required
- ⚠️ **No cross-project references** — redact/substitute before commit
- ⚠️ **Symlink must remain functional** — additive migration only

## Estimated Effort

~2 hours agentic + ~40 min human review

---

📄 See [README.md](README.md) for navigation  
📄 See [01-work-package-plan.md](01-work-package-plan.md) for detailed tasks
