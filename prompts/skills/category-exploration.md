# Skill: Category Exploration

## Capability

Understand what concepts appear in a specific domain/category.

## Fulfills Intent

[explore-category](../intents/explore-category.md)

## Tool Workflow

```
1. category_search(category) → Get documents in category
   ↓ preserve: document list, category metadata
2. list_concepts_in_category(category) → Get concepts in domain
   ↓ preserve: concept list, frequencies
3. Synthesize → Present conceptual landscape
```

## Tool Details

### Step 1: Browse Category

```
Tool: category_search
Input: category name
Output: Documents in category with summaries
```

### Step 2: List Concepts

```
Tool: list_concepts_in_category
Input: category name
Output: Concepts sorted by document count
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Category name | Maintain focus |
| Document count | Context |
| Top concepts | For summary |

## Stop Conditions

- Have category overview
- Can list key concepts
- Maximum 2-3 tool calls
