# Requirements Elicitation: Planning Branch Architecture Migration

**Issue:** [#68](https://github.com/m2ux/concept-rag/issues/68)  
**PR:** [#69](https://github.com/m2ux/concept-rag/pull/69)  
**Date:** 2026-01-10

---

## Problem Statement

Planning docs are currently stored in a **separate private repo** that holds planning for multiple projects. This causes:

1. **Context switching friction** - repeatedly switching between code and planning repos
2. **Commit overhead** - having to commit planning artifacts to a separate repo
3. **Lack of co-location** - planning not available in same repo as product
4. **Management overhead** - single planning repo grows unwieldy across multiple projects

### Current Workaround

- `.ai/` in concept-rag is a **symlink** (gitignored)
- Points to a checked-out folder from a **separate private planning repo**
- Planning docs ARE version-controlled, but in a different repo

### Desired State

Co-locate planning artifacts with code using an **orphan branch architecture** that:
- Keeps planning history separate from code history
- Enables public access to ADRs and specs
- Supports future private submodule for sensitive content

---

## Stakeholders

| Stakeholder | Need |
|-------------|------|
| Solo developer (now) | Streamlined workflow, less context switching |
| Future team members | Onboarding context without separate repo access |
| External contributors | Access to ADRs and public specifications |

---

## External Integrations

- **Issue trackers** - planning content must be referenceable
- **Pull requests** - planning docs linkable via GitHub URLs
- **CI/CD** - may generate test reports to planning branch (future)

---

## Scope

### In Scope (Phase 1 - This Work Package)

- [ ] Create orphan `planning` branch with public structure
- [ ] Migrate ADRs from `docs/architecture/` to `planning` branch
- [ ] Migrate work package plans from `.engineering/artifacts/planning/` (after filtering)
- [ ] Copy prompts/templates from `.engineering/artifacts/templates/`
- [ ] Migrate `AGENTS.md`
- [ ] Maintain existing symlink during transition
- [ ] Document new structure and navigation
- [ ] Document both planning scenarios (in-repo vs external planning repo)

### Out of Scope (Future Phases)

| Item | Phase |
|------|-------|
| Workflows submodule (`workflows/`) for prompts/AGENTS.md | Phase 2 |
| Metadata submodule (`metadata/`) for `.engineering/artifacts/history/` | Phase 3 |
| CI/CD automation for planning docs | Future |
| Cleanup of separate planning repo | After full migration |

---

## Success Criteria

### Functional

- [ ] Planning docs accessible from same repo as code
- [ ] ADRs browsable on GitHub at stable URL (planning branch)
- [ ] Existing symlink still works during transition
- [ ] New team members can find planning context without separate repo access
- [ ] Planning docs referenceable in PRs via GitHub URLs
- [ ] Code history on `main` stays clean of planning commits

### Quality

- [ ] No data loss during migration
- [ ] All existing ADRs accessible after migration
- [ ] No broken links or references

---

## Constraints

### Critical Safety Requirement

⚠️ **MUST filter chat history from planning folders before any public commit**

**Detection method:** Content inspection for conversation-style patterns:
- "User:", "Assistant:", "Human:", "AI:"
- Q&A formatting
- Chat transcript indicators

Files matching these patterns → **stay private** (not migrated to public branch)

### Migration Approach

- Controlled, sequential migration (no big-bang)
- Symlink remains functional throughout transition
- Content not explicitly included stays in current location

---

## Failure Criteria

The migration is a **failure** if any of the following occur:

- ❌ Planning commits pollute `main` branch history
- ❌ Existing workflows break during transition
- ❌ Private content (chat history) accidentally made public

---

## Planning Scenarios

The architecture must support two scenarios for different project types:

### Scenario A: In-Repo Planning (Projects You Control)

For projects where you have full control (e.g., concept-rag):
- Orphan `planning` branch in the same repository
- Git worktree for parallel access
- Planning docs accessible at `https://github.com/owner/repo/tree/planning`

### Scenario B: External Planning (Projects You Contribute To)

For projects where you contribute but don't control the repo structure:
- Dedicated planning repository (separate from the code repo)
- Orphan branches per-project within that planning repo
- Same directory structure as Scenario A
- Git worktree still provides parallel access

Both scenarios use identical directory structures (`artifacts/adr/`, `artifacts/specs/`, etc.) and support the same workflows.

---

## Migration Phases

```
Phase 1 (This Work Package) ✅ COMPLETE
├── Create orphan `engineering` branch
├── Migrate public content (ADRs, specs, plans)
├── Filter chat history before commit
├── Maintain symlink compatibility
└── Document both engineering scenarios

Phases 2 & 3 (Future): Submodules in engineering branch
├── workflows/  → submodule → github.com/m2ux/agent-workflows (public)
│   └── Prompts, AGENTS.md, workflow templates
└── private-metadata/ → submodule → github.com/m2ux/ai-metadata (private)
    └── AI chat history, sensitive logs

Phase 4 (Future - Final Cleanup)
├── Remove symlink from concept-rag repo
├── Delete migrated content from private repo:
│   ├── planning/ (except active work packages)
│   ├── reviews/
│   └── architecture/
├── Update .gitignore (remove .ai entry)
└── Archive or repurpose private planning repo
```

---

## Elicitation Session

**Date:** 2026-01-10  
**Method:** Sequential one-at-a-time questioning with skip option

### Key Insights from Elicitation

1. Planning docs are already version-controlled in a separate private repo (not just local)
2. The separate repo holds planning for **multiple projects** - consolidation per-project is desired
3. Symlink approach must continue working during transition
4. Content inspection required to identify chat history before public commit
5. Full public content migration is the minimum viable version
