# Skill: Pattern Research

## Capability

Find design patterns applicable to a specific problem or domain.

## Fulfills Intent

[identify-patterns](../intents/identify-patterns.md)

## Tool Workflow

Execute in sequence:

```
1. concept_search(pattern domain) → Find pattern concepts
   ↓
2. source_concepts(patterns) → Get authoritative sources
   ↓
3. chunks_search(source, pattern) → Extract pattern details
   ↓
4. Synthesize with citations
```

## Tool Details

### Step 1: Find Pattern Concepts

```
Tool: concept_search
Input: pattern domain (e.g., "caching patterns", "error handling")
Output: Concepts related to patterns
```

### Step 2: Get Sources

```
Tool: source_concepts
Input: pattern concept names
Output: Documents discussing patterns
```

### Step 3: Extract Details

```
Tool: chunks_search
Input: source path, pattern query
Output: Pattern descriptions and trade-offs
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Pattern names | Track which patterns found |
| Source documents | For citations |
| Trade-offs | For recommendations |

## Stop Conditions

- Found 2-3 applicable patterns
- Have descriptions and trade-offs
- Maximum 5-6 tool calls
