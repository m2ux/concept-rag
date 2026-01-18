# Intent: Understand a Topic

## Problem Domain

**User Goal:** The user has a knowledge gap about a specific topic and wants to learn what their library says about it.

## Recognition

Match this intent when the user says:
- "What does my library say about X?"
- "Research topic X"
- "I want to understand X"
- "Deep dive into X"
- "Learn about X from my documents"
- "What do my sources say about X?"

## Maps To

**Skill:** [deep-research](../skills/deep-research.md)

## Expected Outcome

A synthesized answer that:
- Addresses the user's question directly
- Draws from multiple relevant documents
- Includes citations to sources
- Provides key points and insights

## Example Flow

```
User: "What does my library say about microservices?"

1. Read deep-research skill
2. Use catalog_search to find relevant documents
3. Use chunks_search to extract specific content
4. Synthesize answer with citations
```

## Context to Preserve

- The topic being researched
- Documents found relevant
- Key findings from each source
