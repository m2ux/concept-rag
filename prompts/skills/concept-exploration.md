# Skill: Concept Exploration

## Capability

Track where a concept appears across the library and find source attribution.

## Fulfills Activity

[explore-concept](../activities/explore-concept.md)

## Tool Workflow

```
┌─────────────────────────────────────┐
│ 1. concept_search(concept)          │
│    Find concept and discussions     │
│    → preserve: sources, chunks      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. source_concepts(concept)         │
│    Get full source list             │
│    → preserve: titles, authors      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. chunks_search(source, concept)   │◄──┐
│    Get specific passages            │   │ LOOP: for key
│    → preserve: quotes, pages        │   │ sources (2-3)
└────────────┬────────────────────────┘   │
             │                            │
             ├── need more detail? ───────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. SYNTHESIZE                       │
│    Present sources and passages     │
└─────────────────────────────────────┘
```

## Tool Details

### Step 1: Find Concept

```
Tool: concept_search
Input: concept name (1-3 words)
Output: Concept metadata, sources, chunks
```

### Step 2: Get Sources (if needed)

```
Tool: source_concepts
Input: concept (or array of concepts)
Output: Documents with concept coverage
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Concept name | Maintain focus |
| Source paths | For deeper exploration |
| Key passages | For citations |

## Stop Conditions

- Found sources discussing the concept
- Can cite specific passages
- Maximum 3-4 tool calls
