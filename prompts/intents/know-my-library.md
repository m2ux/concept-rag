# Intent: Know My Library

## Problem Domain

**User Goal:** The user doesn't know what content is available in their library and wants to discover or explore it.

## Recognition

Match this intent when the user says:
- "What do I have?"
- "What's in my library?"
- "What documents do I have?"
- "Show me my library"
- "What categories exist?"
- "What can I learn from?"
- "Browse my collection"

## Maps To

**Primary Skill:** [library-discovery](../skills/library-discovery.md)

**Supporting Skills:**
- [category-exploration](../skills/category-exploration.md) — Drill into specific domains of interest

## Expected Outcome

An organized overview that:
- Shows available categories/domains
- Lists representative documents
- Provides document counts and coverage
- Enables further exploration into specific areas

## Example Flow

```
User: "What do I have in my library?"

1. Use library-discovery skill to get overview
2. If user shows interest in a domain, use category-exploration
3. Present organized summary with drill-down options
```

## Context to Preserve

- Categories discovered
- Document counts per category
- User's areas of interest (if stated)
