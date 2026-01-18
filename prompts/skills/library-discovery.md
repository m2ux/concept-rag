# Skill: Library Discovery

## Capability

Browse and inventory available content to help users understand their library.

## Fulfills Intent

[know-my-library](../intents/know-my-library.md)

## Tool Workflow

```
┌─────────────────────────────────────┐
│ 1. list_categories()                │
│    Get domain overview              │
│    → preserve: categories, counts   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. category_search(category)        │◄──┐
│    Browse specific domain           │   │ LOOP: for each
│    → preserve: document summaries   │   │ category of interest
└────────────┬────────────────────────┘   │
             │                            │
             ├── explore more? ───────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. PRESENT                          │
│    Organized library overview       │
└─────────────────────────────────────┘
```

## Tool Details

### Step 1: Get Categories

```
Tool: list_categories
Input: (none required)
Output: Categories with document counts, descriptions
```

**Preserve:** Category names and counts for presentation.

### Step 2: Browse Category (Optional)

```
Tool: category_search
Input: category name
Output: Documents in that category with summaries
```

**Only if** user asks about a specific domain.

### Step 3: Present Overview

Structure the response as an organized summary:

```markdown
## Your Library Overview

Your library contains [X] documents across [Y] categories.

### Categories

| Category | Documents | Description |
|----------|-----------|-------------|
| Software Engineering | 25 | Design patterns, architecture, testing |
| Philosophy | 12 | Ethics, logic, epistemology |

### To Explore Further

- "Show me software engineering documents"
- "What concepts are in philosophy?"
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Category list | Reference for follow-up questions |
| Document counts | Provide complete picture |
| User interests | Guide deeper exploration |

## Stop Conditions

- Categories listed with counts
- User has overview of library contents
- Maximum 2-3 tool calls for basic overview

## Example

```
User: "What's in my library?"

1. list_categories()
   → Found: 8 categories, 150 documents

2. Present:
   "Your library contains 150 documents across 8 categories:
   - Software Engineering (45 docs)
   - Philosophy (20 docs)
   - Data Science (18 docs)
   ..."
```
