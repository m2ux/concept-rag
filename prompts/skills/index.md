# Skill Index

Skills define tool workflows to fulfill user activities. Workflows may include **loops** for iterative refinement.

## Available Skills

| Skill | Capability |
|-------|------------|
| [deep-research](deep-research.md) | Synthesize knowledge across documents |
| [library-discovery](library-discovery.md) | Browse and inventory content |
| [concept-exploration](concept-exploration.md) | Track concept across sources |
| [document-analysis](document-analysis.md) | Extract concepts from document |
| [category-exploration](category-exploration.md) | Understand domain concepts |
| [pattern-research](pattern-research.md) | Find applicable design patterns |
| [practice-research](practice-research.md) | Discover best practices |

## Execution Model

```
1. Match activity to skill(s)
   │
2. Execute skill workflow
   ├─ Tools may be called multiple times
   ├─ Loops iterate until satisfied
   └─ Preserve context between calls
   │
3. Synthesize output with citations
```

Each skill defines its workflow with loops where applicable. See individual skill files for details.
