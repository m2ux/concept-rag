# Concept-RAG Agent Rules

When using **concept-rag** MCP tools for document research, follow these rules:

## Before Starting Any Research

**Always call `get_guidance` first** before making any other tool calls.

```
get_guidance
```

This returns research guidelines and tool selection guidance that will help you:
- Select the right tool for each query type
- Limit unnecessary tool calls
- Synthesize proper answers instead of reporting search status

## Key Principles

1. **Call `get_guidance` first** - Every session, before any research
2. **Synthesize answers** - Never narrate your search process
3. **Cite sources** - Include document titles and authors
4. **Stop early** - 4-6 tool calls is usually enough

## Integration

Copy these rules into your project's agent configuration to ensure consistent behavior when using concept-rag tools.
