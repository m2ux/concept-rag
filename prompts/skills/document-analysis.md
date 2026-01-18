# Skill: Document Analysis

## Capability

Extract and analyze concepts from a specific document.

## Fulfills Intent

[analyze-document](../intents/analyze-document.md)

## Tool Workflow

```
1. catalog_search(document) → Find the document, get source path
   ↓ preserve: source path
2. extract_concepts(document_query) → Get all concepts
   ↓ preserve: concept list, categories
3. Synthesize → Present organized concept inventory
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
