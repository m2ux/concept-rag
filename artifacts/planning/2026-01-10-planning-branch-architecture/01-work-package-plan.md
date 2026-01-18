# Work Package Plan: Engineering Branch Architecture Migration

**Issue:** [#68](https://github.com/m2ux/concept-rag/issues/68)  
**PR:** [#69](https://github.com/m2ux/concept-rag/pull/69)  
**Date:** 2026-01-10  
**Status:** ✅ Complete (All Phases)

---

## Overview

Migrate engineering artifacts to an orphan `engineering` branch within the concept-rag repository, enabling co-location of engineering docs with code while maintaining separate histories.

## Success Criteria

- [x] Planning docs accessible from same repo as code
- [x] ADRs browsable on GitHub at stable URL
- [x] ~~Existing symlink still works during transition~~ (N/A - symlink removed in Phase 4)
- [x] New team members can find planning context without separate repo access
- [x] Planning docs referenceable in PRs via GitHub URLs
- [x] Code history on `main` stays clean of planning commits
- [x] No data loss during migration
- [x] No chat history or cross-project references in public content

---

## Tasks

### Task 1: Create Orphan Engineering Branch (~15 min) ✅

**Goal:** Establish the orphan `engineering` branch with initial structure.

**Steps:**
1. Create orphan branch: `git checkout --orphan engineering`
2. Remove inherited files: `git rm -rf .`
3. Create directory structure:
   ```
   artifacts/
   ├── adr/
   ├── planning/
   ├── reviews/
   └── templates/
   ```
4. Create README.md with navigation guide
5. Initial commit and push

**Deliverables:**
- [x] Orphan branch exists on remote
- [x] Directory structure in place
- [x] README.md with navigation

---

### Task 2: Set Up Git Worktree (~10 min) ✅

**Goal:** Enable parallel access to engineering branch alongside feature branches.

**Steps:**
1. Add worktree: `git worktree add ../concept-rag_engineering engineering`
2. Verify both directories accessible
3. Document worktree setup for future developers

**Deliverables:**
- [x] Worktree created at `../concept-rag_engineering`
- [x] Can commit to engineering branch without switching

---

### Task 3: Audit and Filter Content (~45 min) ✅

**Goal:** Identify content safe for public migration; flag items requiring filtering.

**Filtering criteria:**
1. **Chat history detection:** Conversation patterns ("User:", "Assistant:", "Human:", Q&A format)
2. **Cross-project references:** Other project names, sensitive paths
3. **Sensitive content:** API keys, credentials, internal URLs

**Steps:**
1. Scan `.engineering/artifacts/planning/` for chat-style content
2. Create list of files requiring:
   - Exclusion (chat history → stays in private repo)
   - Redaction (cross-project refs → substitute generic names)
   - Direct migration (clean files)
3. Scan `.engineering/artifacts/reviews/` with same criteria
4. Document filtering decisions

**Deliverables:**
- [x] Audit report: files to exclude
- [x] Audit report: files requiring redaction
- [x] Audit report: files safe for direct migration

---

### Task 4: Migrate ADRs (~15 min) ✅

**Goal:** Copy ADRs from `docs/architecture/` to engineering branch.

**Steps:**
1. Copy all `adr*.md` files to `artifacts/adr/`
2. Copy supporting docs (README.md, etc.)
3. Verify no sensitive content in ADRs
4. Commit to engineering branch

**Deliverables:**
- [x] All ADRs in `artifacts/adr/`
- [x] ADRs accessible via GitHub URL

---

### Task 5: Migrate Work Package Plans (~30 min) ✅

**Goal:** Copy filtered work package plans to engineering branch.

**Steps:**
1. For each clean folder in `.engineering/artifacts/planning/`:
   - Copy to `artifacts/planning/`
2. For folders requiring redaction:
   - Copy and apply redactions
   - Substitute project names with generic placeholders
3. Skip folders identified as chat history
4. Commit in batches

**Deliverables:**
- [x] Work package plans in `artifacts/planning/`
- [x] No chat history in public branch
- [x] No cross-project references in public content

---

### Task 6: Migrate AGENTS.md and Reviews (~10 min) ✅

**Goal:** Copy remaining artifacts to engineering branch.

**Steps:**
1. Copy `AGENTS.md` to agent-workflows repo (shared via submodule)
2. Copy `.engineering/artifacts/reviews/` to `artifacts/reviews/`
3. Copy `.engineering/artifacts/templates/` templates to `artifacts/templates/`
4. Commit

**Deliverables:**
- [x] AGENTS.md in agent-workflows repo
- [x] Reviews migrated
- [x] Templates migrated

---

### Task 7: Update Documentation (~30 min) ✅

**Goal:** Document the new structure, access patterns, and both planning scenarios.

**Steps:**
1. Update engineering branch README with:
   - Structure overview
   - How to access via worktree
   - Contribution guidelines
2. Create `ARCHITECTURE.md` documenting both scenarios:
   - Scenario A: In-repo orphan branch (for projects you control)
   - Scenario B: External planning repo (for projects you contribute to)
   - Worktree setup for both scenarios
   - Directory structure template
3. Add note to main repo README about engineering branch (optional)
4. Update PR description with final details

**Deliverables:**
- [x] Engineering branch fully documented
- [x] Worktree setup instructions included
- [x] Both planning scenarios documented (in-repo vs external)
- [x] Reusable template for Scenario B projects

---

## Constraints

| Constraint | Handling |
|------------|----------|
| No chat history in public | Content inspection + exclusion |
| No cross-project references | Redaction with generic names |
| ~~Symlink must remain functional~~ | ~~Copy only, never delete source~~ (Complete - symlink removed) |
| Parallel access required | Git worktree setup |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Accidentally commit chat history | Audit before migration; review each commit |
| Break existing workflows | Additive approach; symlink preserved during transition |
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

## Completed Phases

### Content Distribution Model

The `engineering` branch serves as the central hub, containing:
- **Direct content:** Project-specific artifacts (ADRs, planning, reviews)
- **Submodules:** References to shared/private repos

| Content Type | Storage | Submodule Target |
|--------------|---------|------------------|
| **ADRs** | Direct in `engineering` branch | — |
| **Work package plans** | Direct in `engineering` branch | — |
| **Reviews** | Direct in `engineering` branch | — |
| **Workflow prompts/templates** | Submodule in `engineering` branch | → public `agent-workflows` repo |
| **AGENTS.md guidelines** | Submodule in `engineering` branch | → public `agent-workflows` repo |
| **AI metadata/history** | Submodule in `engineering` branch | → private `ai-metadata` repo |

**Final structure on `engineering` branch:**
```
.engineering/                     # Worktree checkout location
├── artifacts/                    # Output artifacts from engineering process
│   ├── adr/                      # Direct: project-specific ADRs
│   ├── planning/                 # Direct: work package plans
│   ├── reviews/                  # Direct: code/architecture reviews
│   └── templates/                # Direct: project-specific templates
├── agent/                        # Submodule container
│   ├── workflows/                # Submodule → github.com/m2ux/agent-workflows (public)
│   └── metadata/                 # Submodule → github.com/m2ux/ai-metadata (private, sparse)
├── scripts/                      # Helper scripts
│   ├── update-workflows.sh       # Update workflows submodule to version tag
│   └── update-metadata.sh        # Update metadata submodule to latest HEAD
├── README.md                     # Navigation and setup guide
└── ARCHITECTURE.md               # Two-scenario documentation
```

### Phase 2: Workflow Submodule ✅

**Target repo:** [m2ux/agent-workflows](https://github.com/m2ux/agent-workflows)

**Completed:**
- Added agent-workflows as submodule at `agent/workflows/`
- Version pinned to `v0.1.0` for initial development
- Created `scripts/update-workflows.sh` for version updates

### Phase 3: Metadata Submodule ✅

**Completed:**
- Added ai-metadata as submodule at `agent/metadata/`
- Configured sparse checkout for `projects/concept-rag/` only
- Tracks `master` branch (informal content, no version tags)
- Created `scripts/update-metadata.sh` for updates

### Phase 4: Final Cleanup ✅

**Completed:**
1. Removed `.ai` symlink from concept-rag repo
2. Deleted migrated content from private repo (kept only active work packages)
3. Updated `.gitignore` (removed `.ai` entry)
4. Updated 41 ADR files with new GitHub URLs pointing to `engineering` branch
5. Renamed `artifacts/specs` → `artifacts/planning`

**Safety checklist (verified):**
- [x] All content verified accessible from `engineering` branch
- [x] Workflows submodule (`agent/workflows/`) working correctly
- [x] Metadata submodule (`agent/metadata/`) working correctly
- [x] No active work packages in deleted folders
- [x] Private repo content preserved where needed
