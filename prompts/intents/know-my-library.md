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

**Skill:** [library-discovery](../skills/library-discovery.md)

## Expected Outcome

An organized overview that:
- Shows available categories/domains
- Lists representative documents
- Provides document counts and coverage
- Enables further exploration

## Example Flow

```
User: "What do I have in my library?"

1. Read library-discovery skill
2. Use list_categories to get domain overview
3. Use category_search for specific domains if asked
4. Present organized summary
```

## Context to Preserve

- Categories discovered
- Document counts per category
- User's areas of interest (if stated)
