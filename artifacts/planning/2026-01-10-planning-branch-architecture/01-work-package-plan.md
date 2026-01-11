# Work Package Plan: Engineering Branch Architecture Migration

**Issue:** [#68](https://github.com/m2ux/concept-rag/issues/68)  
**PR:** [#69](https://github.com/m2ux/concept-rag/pull/69)  
**Date:** 2026-01-10  
**Status:** ✅ Phase 1 Complete

---

## Overview

Migrate engineering artifacts to an orphan `engineering` branch within the concept-rag repository, enabling co-location of engineering docs with code while maintaining separate histories.

## Success Criteria

- [ ] Planning docs accessible from same repo as code
- [ ] ADRs browsable on GitHub at stable URL
- [ ] Existing symlink still works during transition
- [ ] New team members can find planning context without separate repo access
- [ ] Planning docs referenceable in PRs via GitHub URLs
- [ ] Code history on `main` stays clean of planning commits
- [ ] No data loss during migration
- [ ] No chat history or cross-project references in public content

---

## Tasks

### Task 1: Create Orphan Planning Branch (~15 min)

**Goal:** Establish the orphan `planning` branch with initial structure.

**Steps:**
1. Create orphan branch: `git checkout --orphan planning`
2. Remove inherited files: `git rm -rf .`
3. Create directory structure:
   ```
   artifacts/
   ├── adr/
   ├── specs/
   ├── reviews/
   └── templates/
   ```
4. Create README.md with navigation guide
5. Initial commit and push

**Deliverables:**
- [ ] Orphan branch exists on remote
- [ ] Directory structure in place
- [ ] README.md with navigation

---

### Task 2: Set Up Git Worktree (~10 min)

**Goal:** Enable parallel access to planning branch alongside feature branches.

**Steps:**
1. Add worktree: `git worktree add ../concept-rag-planning planning`
2. Verify both directories accessible
3. Document worktree setup for future developers

**Deliverables:**
- [ ] Worktree created at `../concept-rag-planning`
- [ ] Can commit to planning branch without switching

---

### Task 3: Audit and Filter Content (~45 min)

**Goal:** Identify content safe for public migration; flag items requiring filtering.

**Filtering criteria:**
1. **Chat history detection:** Conversation patterns ("User:", "Assistant:", "Human:", Q&A format)
2. **Cross-project references:** Other project names, sensitive paths
3. **Sensitive content:** API keys, credentials, internal URLs

**Steps:**
1. Scan `.ai/planning/` for chat-style content
2. Create list of files requiring:
   - Exclusion (chat history → stays in private repo)
   - Redaction (cross-project refs → substitute generic names)
   - Direct migration (clean files)
3. Scan `.ai/reviews/` with same criteria
4. Document filtering decisions

**Deliverables:**
- [ ] Audit report: files to exclude
- [ ] Audit report: files requiring redaction
- [ ] Audit report: files safe for direct migration

---

### Task 4: Migrate ADRs (~15 min)

**Goal:** Copy ADRs from `docs/architecture/` to planning branch.

**Steps:**
1. Copy all `adr*.md` files to `artifacts/adr/`
2. Copy supporting docs (README.md, etc.)
3. Verify no sensitive content in ADRs
4. Commit to planning branch

**Deliverables:**
- [ ] All ADRs in `artifacts/adr/`
- [ ] ADRs accessible via GitHub URL

---

### Task 5: Migrate Work Package Plans (~30 min)

**Goal:** Copy filtered work package plans to planning branch.

**Steps:**
1. For each clean folder in `.ai/planning/`:
   - Copy to `artifacts/specs/`
2. For folders requiring redaction:
   - Copy and apply redactions
   - Substitute project names with generic placeholders
3. Skip folders identified as chat history
4. Commit in batches

**Deliverables:**
- [ ] Work package plans in `artifacts/specs/`
- [ ] No chat history in public branch
- [ ] No cross-project references in public content

---

### Task 6: Migrate AGENTS.md and Reviews (~10 min)

**Goal:** Copy remaining artifacts to planning branch.

**Steps:**
1. Copy `AGENTS.md` to planning branch root
2. Copy `.ai/reviews/` to `artifacts/reviews/` (if appropriate)
3. Copy `.ai/architecture/` templates to `artifacts/templates/`
4. Commit

**Deliverables:**
- [ ] AGENTS.md in planning branch
- [ ] Reviews migrated (if applicable)
- [ ] Templates migrated

---

### Task 7: Update Documentation (~30 min)

**Goal:** Document the new structure, access patterns, and both planning scenarios.

**Steps:**
1. Update planning branch README with:
   - Structure overview
   - How to access via worktree
   - Contribution guidelines
2. Create `PLANNING-ARCHITECTURE.md` documenting both scenarios:
   - Scenario A: In-repo orphan branch (for projects you control)
   - Scenario B: External planning repo (for projects you contribute to)
   - Worktree setup for both scenarios
   - Directory structure template
3. Add note to main repo README about planning branch (optional)
4. Update PR description with final details

**Deliverables:**
- [ ] Planning branch fully documented
- [ ] Worktree setup instructions included
- [ ] Both planning scenarios documented (in-repo vs external)
- [ ] Reusable template for Scenario B projects

---

## Constraints

| Constraint | Handling |
|------------|----------|
| No chat history in public | Content inspection + exclusion |
| No cross-project references | Redaction with generic names |
| Symlink must remain functional | Copy only, never delete source |
| Parallel access required | Git worktree setup |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Accidentally commit chat history | Audit before migration; review each commit |
| Break existing workflows | Additive approach; symlink preserved |
| Miss cross-project references | Grep for known patterns before commit |
| Large migration causes issues | Commit in batches; verify after each |

---

## Estimated Effort

| Task | Agentic | Review |
|------|---------|--------|
| Task 1: Orphan branch | 15 min | 5 min |
| Task 2: Git worktree | 10 min | 5 min |
| Task 3: Audit/filter | 45 min | 15 min |
| Task 4: Migrate ADRs | 15 min | 5 min |
| Task 5: Migrate plans | 30 min | 10 min |
| Task 6: AGENTS/reviews | 10 min | 5 min |
| Task 7: Documentation (both scenarios) | 30 min | 10 min |
| **Total** | **~2.5 hrs** | **~55 min** |

---

## Future Phases

### Content Distribution Model

The `engineering` branch serves as the central hub, containing:
- **Direct content:** Project-specific artifacts (ADRs, specs, reviews)
- **Submodules:** References to shared/private repos

| Content Type | Storage | Submodule Target |
|--------------|---------|------------------|
| **ADRs** | Direct in `engineering` branch | — |
| **Work package plans** | Direct in `engineering` branch | — |
| **Reviews** | Direct in `engineering` branch | — |
| **Workflow prompts/templates** | Submodule in `engineering` branch | → public `agent-workflows` repo |
| **AGENTS.md guidelines** | Submodule in `engineering` branch | → public `agent-workflows` repo |
| **AI metadata/history** | Submodule in `engineering` branch | → private `ai-metadata` repo |

**Resulting structure on `engineering` branch:**
```
engineering/
├── artifacts/            # Output artifacts from engineering process
│   ├── adr/              # Direct: project-specific ADRs
│   ├── specs/            # Direct: work package plans
│   ├── reviews/          # Direct: code/architecture reviews
│   └── templates/        # Direct: project-specific templates
├── workflows/            # Submodule → github.com/m2ux/agent-workflows (public)
└── private-metadata/     # Submodule → github.com/m2ux/ai-metadata (private)
```

### Phase 2: Workflow Submodule (Future Work Package)

**Target repo:** [m2ux/agent-workflows](https://github.com/m2ux/agent-workflows)

**Goal:** Public workflow artifacts available via submodule in `engineering` branch.

**Content to migrate:**
- `.ai/prompts/work-package/_workflow.md` → workflow templates
- `.ai/prompts/*.md` → prompt templates
- `AGENTS.md` → agent guidelines
- Reusable checklists and runbooks

**Setup in engineering branch:**
```bash
cd concept-rag_engineering
git submodule add https://github.com/m2ux/agent-workflows.git workflows
git commit -m "chore: add agent-workflows submodule"
```

**Benefits:**
- Single source of truth for workflows
- Version-pinned per project (deterministic behavior)
- Public, Apache-2.0 licensed
- Reusable across all projects
- Changes to workflows propagate via submodule updates

### Phase 3: Metadata Submodule (Future Work Package)

- Add private `ai-metadata` repo as submodule at `metadata/`
- Migrate `.ai/history/` content to `ai-metadata` repo
- Result: `git submodule add https://github.com/m2ux/ai-metadata.git metadata`

### Phase 4: Final Cleanup (Future Work Package)

**Prerequisites:** Phases 2 and 3 complete

**Tasks:**
1. Remove `.ai` symlink from concept-rag repo
2. Delete migrated content from private repo:
   - `planning/` (all folders except active work packages)
   - `reviews/`
   - `architecture/`
3. Update `.gitignore` (remove `.ai` entry if no longer needed)
4. Update any documentation referencing old structure

**Safety checklist before cleanup:**
- [ ] All content verified accessible from `engineering` branch
- [ ] Workflows submodule (`workflows/`) working correctly
- [ ] Metadata submodule (`private-metadata/`) working correctly
- [ ] No active work packages in folders to be deleted
- [ ] Backup taken of private repo before deletion
