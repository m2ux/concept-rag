# Planning & Design Documentation

This branch contains engineering artifacts for the concept-rag project. It maintains **separate history** from the code (`main` branch) to keep code commits clean while preserving full planning context.

## Structure

```
planning (this branch)
├── README.md                 # This file
├── AGENTS.md                 # AI agent guidelines
├── PLANNING-ARCHITECTURE.md  # Documentation of planning scenarios
└── public/
    ├── adr/                  # Architecture Decision Records
    ├── specs/                # Work package plans and specifications
    ├── reviews/              # Code and architecture reviews
    └── templates/            # Reusable templates
```

## Accessing This Branch

### Quick View (GitHub)

Browse directly at: `https://github.com/m2ux/concept-rag/tree/planning`

### Local Access via Worktree (Recommended)

For parallel access to planning and code:

```bash
# From your main concept-rag checkout
cd /path/to/concept-rag

# Add a linked worktree for the planning branch
git worktree add ../concept-rag-planning planning

# Now you have two directories:
# - concept-rag/          (main/feature branches - code)
# - concept-rag-planning/ (planning branch - docs)
```

### Switching Branches (Alternative)

```bash
git checkout planning    # View planning docs
git checkout main        # Return to code
```

## Contributing

1. Use the worktree approach for parallel editing
2. Commit planning artifacts to the `planning` branch
3. Keep code changes on `main` or feature branches
4. Never merge `planning` into `main` (they have no common ancestor)

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

**Note:** This is an orphan branch with no commit history overlap with `main`. This is intentional to keep planning history separate from code history.
