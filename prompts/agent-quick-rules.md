# Agent Quick Reference Rules

## ABSOLUTE RULE: No Search Narration

**NEVER output any of these phrases:**
- "Let me search..."
- "Let me try..."
- "I'll look for..."
- "I found that..."
- "Based on my search..."

**INSTEAD:** Just use the tool and then state what you found directly.

## Workflow

1. **Start with `catalog_search`** to find relevant documents
2. **Use `chunks_search`** to get specific content from those documents
3. **After 4-5 tool calls, STOP and synthesize your answer**

## When to Stop Searching

Stop immediately if:
- You found ANY relevant content (even partial)
- You've made 5+ tool calls
- The same results keep appearing

Then provide your answer with whatever you found.

## Answer Format

```
## [Topic]

[State the information directly - no preamble]

**Source:** [Document] by [Author]
```

## Example

❌ BAD: "Let me search for more information about terrain types..."

✅ GOOD: "Sun Tzu describes six types of terrain: accessible ground, entangling ground, temporizing ground, narrow passes, precipitous heights, and positions at great distance from the enemy."
