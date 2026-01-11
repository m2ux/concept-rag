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
mkdir -p public/adr public/specs public/reviews public/templates

# Add content and commit
git add .
git commit -m "docs: initialize engineering branch"
git push -u origin engineering
```

**Access via worktree:**

```bash
# From main checkout
git worktree add ../concept-rag-engineering engineering

# Result:
# project/          → main/feature branches (code)
# project-engineering/ → engineering branch (docs)
```

**Example (this repository):**

```
concept-rag/                      # Main checkout
├── src/
├── docs/
└── .git/

concept-rag-engineering/             # Worktree → engineering branch
├── README.md
├── AGENTS.md
├── PLANNING-ARCHITECTURE.md
└── public/
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
mkdir project-engineering && cd project-engineering
git init

# Create orphan branch for the project
git checkout --orphan project-name
mkdir -p public/adr public/specs public/reviews

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
    │   └── public/
    │       ├── adr/
    │       ├── specs/
    │       └── reviews/
    └── another-project/          # Orphan branch for another project
        └── public/
```

**Access via worktree:**

```bash
# Clone engineering repo
git clone git@github.com:you/my-engineering.git
cd my-engineering

# Add worktrees for each project's engineering branch
git worktree add ../concept-rag-engineering engineering external-project
git worktree add ../concept-rag-engineering engineering another-project
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
├── PLANNING-ARCHITECTURE.md  # This document (optional)
└── public/
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
| Worktree setup | `git worktree add ../concept-rag-engineering engineering` | Clone + worktree per project |
| CI/CD integration | Same repo, easy | Cross-repo, requires setup |
| Best for | Projects you own | External contributions |

## Best Practices

### Parallel Editing

Use git worktrees for simultaneous access:

```bash
# Terminal 1: Working on code (feature branch)
cd ~/projects/concept-rag
git checkout feat/new-feature
# ... make code changes ...

# Terminal 2: Updating engineering docs
cd ~/projects/concept-rag-engineering
# ... update specs, create ADR ...
git commit -m "docs(adr): add ADR for new feature"
git push
```
