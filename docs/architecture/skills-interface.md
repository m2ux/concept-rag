# Skills Interface

> **Status:** Implemented  
> **Issue:** [#56](https://github.com/m2ux/concept-rag/issues/56)  
> **PR:** [#70](https://github.com/m2ux/concept-rag/pull/70)

## Overview

The skills interface provides a three-tier abstraction layer over MCP tools:

```
Activity (Problem Domain) → Skill (Solution Domain) → Tool (Atomic Operation)
```

This reduces tool selection errors and enables successful multi-step workflows by providing activity-based abstractions with context preservation.

## Architecture

```
Cursor Rule (prompts/agent-quick-rules.md)
    ↓ instructs agent to read
Activity Index (concept-rag://activities)
    ↓ agent matches user goal
Activity Description (concept-rag://activities/{id})
    ↓ maps to skill
Skill Description (concept-rag://skills/{id})
    ↓ guides tool workflow
MCP Tools (existing 11 tools)
```

## Semantic Model

| Layer | Domain | Focus | Example |
|-------|--------|-------|---------|
| **Activity** | Problem | User goals, needs | "I want to understand X" |
| **Skill** | Solution | Multi-tool workflows | `catalog_search` → `chunks_search` → synthesize |
| **Tool** | Solution | Atomic operations | `catalog_search`, `chunks_search` |

## Available Activities

| Activity | User Goal | Skill |
|--------|-----------|-------|
| `understand-topic` | Learn about a topic from the library | deep-research |
| `know-my-library` | Discover available content | library-discovery |

## Available Skills

| Skill | Capability | Tools Used |
|-------|------------|------------|
| `deep-research` | Synthesize knowledge across documents | `catalog_search` → `chunks_search` |
| `library-discovery` | Browse and inventory content | `list_categories` → `category_search` |

## MCP Resources

| Resource URI | Description |
|--------------|-------------|
| `concept-rag://activities` | Activity index (read first) |
| `concept-rag://activities/understand-topic` | Understand a topic activity |
| `concept-rag://activities/know-my-library` | Know my library activity |
| `concept-rag://skills` | Skill index |
| `concept-rag://skills/deep-research` | Deep research skill |
| `concept-rag://skills/library-discovery` | Library discovery skill |

## File Structure

```
prompts/
├── activities/
│   ├── index.md              # Activity index
│   ├── understand-topic.md   # Activity definition
│   └── know-my-library.md    # Activity definition
├── skills/
│   ├── index.md              # Skill index
│   ├── deep-research.md      # Skill definition
│   └── library-discovery.md  # Skill definition
└── agent-quick-rules.md      # Cursor rule
```

## Usage

### For Agents

1. Read the activity index: `concept-rag://activities`
2. Match user's goal to an activity
3. Read the activity's linked skill
4. Follow the skill's tool workflow
5. Synthesize answer with citations

### For Developers

- Add new activities to `prompts/activities/`
- Add new skills to `prompts/skills/`
- Register resources in `src/conceptual_index.ts`
- Update indexes to include new entries

## Design Decisions

- **MCP Resources over Tools**: Reduces tool count, leverages existing infrastructure
- **Static .md files**: Editable, version controlled, no runtime logic
- **Tiered loading**: Index < 50 lines; verbose loaded on demand
- **Separation of concerns**: Problem domain (activities) vs. solution domain (skills/tools)

## References

- [API Reference](../api-reference.md) - Detailed tool documentation
- [MCP Specification](https://modelcontextprotocol.io/) - Official MCP specification
