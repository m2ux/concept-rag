# Skill: Category Exploration

## Capability

Understand what concepts appear in a specific domain/category.

## Fulfills Activity

[explore-category](../activities/explore-category.md)

## Tool Workflow

```
┌─────────────────────────────────────┐
│ 1. list_categories()                │
│    Discover available categories    │
│    → preserve: category names       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. category_search(category)        │◄──┐
│    Get documents in category        │   │
│    → preserve: doc titles, summaries│   │
└────────────┬────────────────────────┘   │
             │                            │
             ▼                            │
┌─────────────────────────────────────┐   │ LOOP: for each
│ 3. list_concepts_in_category(cat)   │   │ category of
│    Get concepts in domain           │   │ interest
│    → preserve: concept list         │   │
└────────────┬────────────────────────┘   │
             │                            │
             ├── explore more categories?─┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. SYNTHESIZE                       │
│    Domain overview with concepts    │
└─────────────────────────────────────┘
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
