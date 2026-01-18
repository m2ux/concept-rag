# Skill: Practice Research

## Capability

Discover industry best practices and anti-patterns for a domain.

## Fulfills Intent

[identify-best-practices](../intents/identify-best-practices.md)

## Tool Workflow

```
1. broad_chunks_search(practice query) → Find practice discussions
   ↓ preserve: key recommendations, sources
2. catalog_search(domain) → Find authoritative sources
   ↓ preserve: document paths
3. chunks_search(source, practice) → Extract specific guidance
   ↓ preserve: do's, don'ts, rationale
4. Synthesize → Present practices with sources
```

## Tool Details

### Step 1: Broad Search

```
Tool: broad_chunks_search
Input: "best practices [domain]" or "[domain] guidelines"
Output: Chunks discussing practices
```

### Step 2: Find Sources

```
Tool: catalog_search
Input: domain keywords
Output: Authoritative documents
```

### Step 3: Extract Guidance

```
Tool: chunks_search
Input: source path, practice query
Output: Specific recommendations
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Recommendations | Core practices found |
| Anti-patterns | What to avoid |
| Sources | For citations |

## Stop Conditions

- Found key practices with sources
- Identified anti-patterns
- Maximum 5-6 tool calls
