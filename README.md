# Engineering

This branch contains engineering artifacts for the concept-rag project. It maintains **separate history** from the code (`main` branch) to keep code commits clean while preserving full engineering context.

## Quick Links

| Resource | Description |
|----------|-------------|
| [ADRs](./artifacts/adr/) | Architecture Decision Records |
| [Work Package Plans](./artifacts/planning/) | Feature/enhancement specifications |
| [Reviews](./artifacts/reviews/) | Code and architecture reviews |
| [Templates](./artifacts/templates/) | Reusable documentation templates |
| [Resources](https://github.com/m2ux/agent-resources) | Reusable agent resources (submodule) |
| [Scripts](./scripts/) | Utility scripts for submodule management |
| [Agent Guidelines](./AGENTS.md) | AI agent behavior rules |
| [Architecture](./ARCHITECTURE.md) | Guide for in-repo vs external engineering |

## Structure

```
engineering (this branch)
├── README.md                 # This file
├── AGENTS.md                 # AI agent guidelines
├── ARCHITECTURE.md           # Documentation of engineering scenarios
├── artifacts/                # Output artifacts from engineering process
│   ├── adr/                  # Architecture Decision Records
│   ├── specs/                # Work package plans
│   ├── reviews/              # Code and architecture reviews
│   └── templates/            # Reusable templates
└── agent/                    # Agent-related submodules
    ├── resources/            # Submodule → m2ux/agent-resources (public)
    │   └── scripts/          # Update scripts (included in submodule)
    └── metadata/             # Submodule (private)
```

## Submodules

This branch includes two submodules under `agent/`:

| Submodule | Repository | Visibility | Strategy |
|-----------|------------|------------|----------|
| `agent/resources/` | [m2ux/agent-resources](https://github.com/m2ux/agent-resources) | Public | Pinned to version tag |
| `agent/metadata/` | m2ux/ai-metadata | Private | Tracks `master` branch |

### Cloning with Submodules

```bash
# Clone and initialize submodules
git clone --recurse-submodules https://github.com/m2ux/concept-rag.git -b engineering

# Or after cloning
git submodule update --init --recursive
```

**Note:** The `agent/metadata/` submodule requires access to the private repo. Non-collaborators can still use `agent/resources/`.

### Updating Submodules

Use the scripts included in the resources submodule:

```bash
# Update resources to a specific version
./agent/resources/scripts/update-resources.sh v0.3.0
git commit -m "chore: update resources to v0.3.0"

# Update metadata to latest HEAD (author only)
./agent/resources/scripts/update-metadata.sh
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

---

**Note:** This is an orphan branch with no commit history overlap with `main`. This is intentional to keep engineering history separate from code history.
