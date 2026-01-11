# Engineering Documentation

This branch contains engineering artifacts for the concept-rag project. It maintains **separate history** from the code (`main` branch) to keep code commits clean while preserving full engineering context.

## Quick Links

| Resource | Description |
|----------|-------------|
| [ADRs](artifacts/adr/) | Architecture Decision Records |
| [Work Package Plans](artifacts/specs/) | Feature/enhancement specifications |
| [Reviews](artifacts/reviews/) | Code and architecture reviews |
| [Templates](artifacts/templates/) | Reusable documentation templates |
| [Workflows](workflows/) | Reusable agent workflows (submodule) |
| [Agent Guidelines](AGENTS.md) | AI agent behavior rules |
| [Architecture](ARCHITECTURE.md) | Guide for in-repo vs external engineering |

## Structure

```
engineering (this branch)
├── README.md                 # This file
├── AGENTS.md                 # AI agent guidelines
├── ARCHITECTURE.md           # Documentation of engineering scenarios
├── artifacts/                # Output artifacts from engineering process
│   ├── adr/                  # Architecture Decision Records (56 files)
│   ├── specs/                # Work package plans (62 folders)
│   ├── reviews/              # Code and architecture reviews
│   └── templates/            # Reusable templates
├── workflows/                # Submodule → m2ux/agent-workflows (public)
└── metadata/                 # Submodule → m2ux/ai-metadata (private)
```

## Submodules

This branch includes two submodules:

| Submodule | Repository | Visibility | Strategy |
|-----------|------------|------------|----------|
| `workflows/` | [m2ux/agent-workflows](https://github.com/m2ux/agent-workflows) | Public | Pinned to version tag |
| `metadata/` | m2ux/ai-metadata | Private | Tracks `master` branch |

### Cloning with Submodules

```bash
# Clone and initialize submodules
git clone --recurse-submodules https://github.com/m2ux/concept-rag.git -b engineering

# Or after cloning
git submodule update --init --recursive
```

**Note:** The `metadata/` submodule requires access to the private repo. Non-collaborators can still use `workflows/`.

### Updating Submodules

```bash
# Update workflows to a specific version
cd workflows
git fetch --tags
git checkout v0.2.0
cd ..
git add workflows
git commit -m "chore: update workflows to v0.2.0"

# Update metadata to latest HEAD
git submodule update --remote metadata
git add metadata
git commit -m "chore: update metadata to latest"
```

## Accessing This Branch

### Quick View (GitHub)

Browse directly at: `https://github.com/m2ux/concept-rag/tree/engineering`

### Local Access via Worktree (Recommended)

For parallel access to engineering and code:

```bash
# From your main concept-rag checkout
cd /path/to/concept-rag

# Add a linked worktree for the engineering branch
git worktree add ../concept-rag_engineering engineering

# Now you have two directories:
# - concept-rag/          (main/feature branches - code)
# - concept-rag_engineering/ (engineering branch - docs)
```

### Switching Branches (Alternative)

```bash
git checkout engineering    # View engineering docs
git checkout main        # Return to code
```

## Contributing

1. Use the worktree approach for parallel editing
2. Commit engineering artifacts to the `engineering` branch
3. Keep code changes on `main` or feature branches
4. Never merge `engineering` into `main` (they have no common ancestor)

## Content Guidelines

### What Belongs Here

- ✅ Architecture Decision Records (ADRs)
- ✅ Work package plans and specifications
- ✅ Code and architecture reviews
- ✅ Agent guidelines and templates

### What Does NOT Belong Here

- ❌ Chat history or AI conversation logs
- ❌ References to other private projects
- ❌ Sensitive paths or credentials
- ❌ Source code (belongs on `main`)

---

**Note:** This is an orphan branch with no commit history overlap with `main`. This is intentional to keep engineering history separate from code history.
