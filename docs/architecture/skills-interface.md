# Skills Interface

> **Status:** Implemented  
> **Issue:** [#56](https://github.com/m2ux/concept-rag/issues/56)  
> **PR:** [#70](https://github.com/m2ux/concept-rag/pull/70)

## Overview

The skills interface provides a three-tier abstraction layer over MCP tools:

```
Intent (Problem Domain) → Skill (Solution Domain) → Tool (Atomic Operation)
```

This reduces tool selection errors and enables successful multi-step workflows by providing intent-based abstractions with context preservation.

## Architecture

```
Cursor Rule (prompts/agent-quick-rules.md)
    ↓ instructs agent to read
Intent Index (concept-rag://intents)
    ↓ agent matches user goal
Intent Description (concept-rag://intents/{id})
    ↓ maps to skill
Skill Description (concept-rag://skills/{id})
    ↓ guides tool workflow
MCP Tools (existing 11 tools)
```

## Semantic Model

| Layer | Domain | Focus | Example |
|-------|--------|-------|---------|
| **Intent** | Problem | User goals, needs | "I want to understand X" |
| **Skill** | Solution | Multi-tool workflows | `catalog_search` → `chunks_search` → synthesize |
| **Tool** | Solution | Atomic operations | `catalog_search`, `chunks_search` |

## Available Intents

| Intent | User Goal | Skill |
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
| `concept-rag://intents` | Intent index (read first) |
| `concept-rag://intents/understand-topic` | Understand a topic intent |
| `concept-rag://intents/know-my-library` | Know my library intent |
| `concept-rag://skills` | Skill index |
| `concept-rag://skills/deep-research` | Deep research skill |
| `concept-rag://skills/library-discovery` | Library discovery skill |

## File Structure

```
prompts/
├── intents/
│   ├── index.md              # Intent index
│   ├── understand-topic.md   # Intent definition
│   └── know-my-library.md    # Intent definition
├── skills/
│   ├── index.md              # Skill index
│   ├── deep-research.md      # Skill definition
│   └── library-discovery.md  # Skill definition
└── agent-quick-rules.md      # Cursor rule
```

## Usage

### For Agents

1. Read the intent index: `concept-rag://intents`
2. Match user's goal to an intent
3. Read the intent's linked skill
4. Follow the skill's tool workflow
5. Synthesize answer with citations

### For Developers

- Add new intents to `prompts/intents/`
- Add new skills to `prompts/skills/`
- Register resources in `src/conceptual_index.ts`
- Update indexes to include new entries

## Design Decisions

- **MCP Resources over Tools**: Reduces tool count, leverages existing infrastructure
- **Static .md files**: Editable, version controlled, no runtime logic
- **Tiered loading**: Index < 50 lines; verbose loaded on demand
- **Separation of concerns**: Problem domain (intents) vs. solution domain (skills/tools)

## References

- [Tool Selection Guide](../tool-selection-guide.md) - Detailed tool selection criteria
- [MCP Specification](https://modelcontextprotocol.io/) - Official MCP specification
