# Skill: Document Analysis

## Capability

Extract and analyze concepts from a specific document.

## Fulfills Activity

[analyze-document](../activities/analyze-document.md)

## Tool Workflow

```
┌─────────────────────────────────────┐
│ 1. catalog_search(document)         │
│    Find document, get source path   │
│    → preserve: source path          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. extract_concepts(document_query) │
│    Get all concepts from document   │
│    → preserve: concepts, categories │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. chunks_search(source, concept)   │◄──┐
│    Get context for key concepts     │   │ LOOP: for 
│    → preserve: excerpts             │   │ interesting concepts
└────────────┬────────────────────────┘   │
             │                            │
             ├── explore concept? ────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. SYNTHESIZE                       │
│    Present concept inventory        │
└─────────────────────────────────────┘
```

## Tool Details

### Step 1: Find Document

```
Tool: catalog_search
Input: document title or keywords
Output: Document with source path
```

### Step 2: Extract Concepts

```
Tool: extract_concepts
Input: document_query (title or keywords)
Output: Primary concepts, technical terms, categories
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Document path | For accurate extraction |
| Primary concepts | For summary |
| Categories | For context |

## Stop Conditions

- Concepts extracted successfully
- Can present organized list
- Maximum 2-3 tool calls
