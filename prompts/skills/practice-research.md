# Skill: Practice Research

## Capability

Discover industry best practices and anti-patterns for a domain.

## Fulfills Activity

[identify-best-practices](../activities/identify-best-practices.md)

## Tool Workflow

```
┌─────────────────────────────────────┐
│ 1. broad_chunks_search(practice)    │◄──────────────────┐
│    Find practice discussions        │                   │
│    → preserve: recommendations      │                   │
└────────────┬────────────────────────┘                   │
             │                                            │
             ▼                                            │
┌─────────────────────────────────────┐                   │
│ 2. catalog_search(domain)           │                   │
│    Find authoritative sources       │                   │
│    → preserve: document paths       │                   │
└────────────┬────────────────────────┘                   │
             │                                            │
             ▼                                            │
┌─────────────────────────────────────┐                   │
│ 3. chunks_search(source, practice)  │◄──┐               │
│    Extract specific guidance        │   │ LOOP: for     │
│    → preserve: do's, don'ts         │   │ each source   │
└────────────┬────────────────────────┘   │               │
             │                            │               │
             ├── more sources? ───────────┘               │
             │                                            │
             ├── found related practices? ────────────────┘
             │   (refine search)
             │
             ▼
┌─────────────────────────────────────┐
│ 4. SYNTHESIZE                       │
│    Practices and anti-patterns      │
└─────────────────────────────────────┘
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
