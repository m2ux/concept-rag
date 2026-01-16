# Architecture Guide

This document describes the architecture for managing engineering artifacts (ADRs, work package plans, reviews) alongside code repositories using Git orphan branches.

## Overview

Engineering artifacts should be:
- **Version-controlled** — Full history of engineering decisions
- **Co-located** — Accessible from the same repository as code (when possible)
- **Separated** — Engineering history distinct from code history
- **Accessible** — Browsable via GitHub and locally via worktrees

## Two Engineering Scenarios

### Scenario A: In-Repo Engineering (Projects You Control)

For projects where you control the repository structure.

**When to use:**
- You own or maintain the repository
- You can create new branches
- You want engineering docs at the same GitHub URL as code

**Setup:**

```bash
# From the project repository
git checkout --orphan engineering
git rm -rf .

# Create structure
mkdir -p artifacts/adr artifacts/planning artifacts/reviews artifacts/templates

# Add content and commit
git add .
git commit -m "docs: initialize engineering branch"
git push -u origin engineering
```

**Access via worktree:**

```bash
# From main checkout
git worktree add ../concept-rag_engineering engineering

# Result:
# project/          → main/feature branches (code)
# project_engineering/ → engineering branch (docs)
```

**Example (this repository):**

```
concept-rag/                      # Main checkout
├── src/
├── docs/
└── .git/

concept-rag_engineering/             # Worktree → engineering branch
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
└── artifacts/
    ├── adr/                      # Architecture Decision Records
    ├── specs/                    # Work package plans
    ├── reviews/                  # Code reviews
    └── templates/                # Reusable templates
```

**GitHub URLs:**
- Code: `https://github.com/owner/repo/tree/main`
- Planning: `https://github.com/owner/repo/tree/engineering`

---

### Scenario B: External Engineering Repository (Projects You Contribute To)

For projects where you cannot or should not add branches (e.g., external open-source projects, client repositories).

**When to use:**
- You contribute to but don't control the repository
- The project has strict branch policies
- You want to keep engineering separate from the main project

**Setup:**

```bash
# Create a dedicated engineering repository
mkdir project_engineering && cd project_engineering
git init

# Create orphan branch for the project
git checkout --orphan project-name
mkdir -p artifacts/adr artifacts/planning artifacts/reviews

# Add content and commit
git add .
git commit -m "docs: initialize engineering for project-name"
git push -u origin project-name
```

**Structure:**

```
~/projects/
├── external-project/             # Main project (external repo)
│   ├── src/
│   └── .git/
│
└── my-engineering/                  # Your engineering repository
    ├── .git/
    ├── external-project/         # Orphan branch for this project
    │   └── artifacts/
    │       ├── adr/
    │       ├── specs/
    │       └── reviews/
    └── another-project/          # Orphan branch for another project
        └── artifacts/
```

**Access via worktree:**

```bash
# Clone engineering repo
git clone git@github.com:you/my-engineering.git
cd my-engineering

# Add worktrees for each project's engineering branch
git worktree add ../concept-rag_engineering engineering external-project
git worktree add ../concept-rag_engineering engineering another-project
```

**GitHub URLs:**
- Code: `https://github.com/org/external-project`
- Planning: `https://github.com/you/my-engineering/tree/external-project`

---

## Directory Structure

Both scenarios use the same directory structure:

```
engineering branch (or orphan branch in engineering repo)
├── README.md                 # Navigation guide
├── AGENTS.md                 # AI agent guidelines (optional)
├── ARCHITECTURE.md           # This document (optional)
└── artifacts/                # Output artifacts from engineering process
    ├── adr/                  # Architecture Decision Records
    │   ├── README.md
    │   ├── adr0001-*.md
    │   └── ...
    ├── specs/                # Work package plans
    │   ├── YYYY-MM-DD-feature-name/
    │   │   ├── START-HERE.md
    │   │   ├── README.md
    │   │   └── 01-work-package-plan.md
    │   └── ...
    ├── reviews/              # Code and architecture reviews
    │   └── *.md
    └── templates/            # Reusable templates
        └── *.md
```

## Workflow Comparison

| Aspect | Scenario A (In-Repo) | Scenario B (External) |
|--------|---------------------|----------------------|
| Planning location | Same repo, `engineering` branch | Separate repo, project-specific branch |
| GitHub URL | `repo/tree/engineering` | `engineering-repo/tree/project-name` |
| Access control | Inherits from main repo | Independent repo permissions |
| Worktree setup | `git worktree add ../concept-rag_engineering engineering` | Clone + worktree per project |
| CI/CD integration | Same repo, easy | Cross-repo, requires setup |
| Best for | Projects you own | External contributions |

## Best Practices

### Content Guidelines

**Direct content (stored in engineering branch):**
- ✅ Architecture Decision Records (ADRs)
- ✅ Work package plans and specifications
- ✅ Code and architecture reviews
- ✅ Project-specific templates
- ✅ Roadmaps and design documents

**Via submodules (referenced from engineering branch):**
- 📦 Agent workflows/prompts → `agent/resources/` submodule (public)
- 📦 AI metadata/history → `agent/metadata/` submodule (private)

**Exclude entirely:**
- ❌ References to other private projects
- ❌ Sensitive paths, credentials, or API keys
- ❌ Source code (belongs on main branch)

### Directory Structure

The engineering branch organizes content as follows:

```
engineering/
├── artifacts/            # Output artifacts from engineering process
│   ├── adr/              # Architecture Decision Records
│   ├── specs/            # Work package plans
│   ├── reviews/          # Code reviews
│   └── templates/        # Project-specific templates
└── agent/                # Agent-related submodules
    ├── resources/        # Submodule → github.com/m2ux/agent-resources (public)
    └── metadata/         # Submodule → github.com/m2ux/ai-metadata (private)
```

**Setting up submodules:**

```bash
# In engineering branch worktree
git submodule add https://github.com/m2ux/agent-resources.git agent/resources
git submodule add https://github.com/m2ux/ai-metadata.git agent/metadata
git commit -m "chore: add workflow and private submodules"
```

**Cloning with submodules:**

```bash
git clone --recurse-submodules <repo-url>
# Or after clone:
git submodule update --init --recursive
```

### Path Hygiene

When migrating content, sanitize paths:

| Original | Replacement |
|----------|-------------|
| `/home/user/projects/repo` | `.` or relative path |
| `/home/user/.config` | `~/.config` |
| Absolute paths to ebooks | `~/Documents/...` |
| Other project names | `[other-project]` or generic name |

### Parallel Editing

Use git worktrees for simultaneous access:

```bash
# Terminal 1: Working on code (feature branch)
cd ~/projects/concept-rag
git checkout feat/new-feature
# ... make code changes ...

# Terminal 2: Updating engineering docs
cd ~/projects/concept-rag_engineering
# ... update specs, create ADR ...
git commit -m "docs(adr): add ADR for new feature"
git push
```
