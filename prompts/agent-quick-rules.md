# Concept-RAG Agent Rules

When using concept-rag MCP tools:

1. **Read the intent index first** - Request the `concept-rag://intents` resource to understand available intents
2. **Match the user's goal** to an intent (e.g., "understand-topic" or "know-my-library")
3. **Follow the skill workflow** described in the intent's linked skill
4. **Synthesize answers with citations** - Never narrate your search process

## Quick Intent Reference

| User Goal | Intent | Skill |
|-----------|--------|-------|
| Learn about a topic | `understand-topic` | deep-research |
| Explore the library | `know-my-library` | library-discovery |

## Efficiency Guidelines

- Maximum 4-6 tool calls per research task
- Preserve context between tool calls (document paths, findings)
- Stop searching when you have enough to answer
