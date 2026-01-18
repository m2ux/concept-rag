# Intent: Curate Concept Lexicon

## Problem Domain

**User Goal:** The user wants to create a curated dictionary of concepts from the knowledge base that are applicable to a specific project, domain, or codebase.

## Recognition

Match this intent when the user says:
- "Create a concept lexicon for [project/domain]"
- "What concepts from my library apply to [project]?"
- "Build a vocabulary reference for [domain]"
- "Curate concepts relevant to [project]"
- "Extract applicable concepts for [codebase]"
- "Create a domain glossary from my documents"
- "What knowledge base concepts apply to my project?"

## Maps To

**Primary Skill:** [category-exploration](../skills/category-exploration.md)

**Supporting Skills:**
- [concept-exploration](../skills/concept-exploration.md) — Track specific concepts and their sources
- [library-discovery](../skills/library-discovery.md) — Understand overall knowledge base coverage
- [document-analysis](../skills/document-analysis.md) — Extract concepts from key documents

## Expected Outcome

A structured concept lexicon document that:
- Organizes concepts into logical sections (architecture, patterns, practices, etc.)
- Provides brief definitions or application context for each concept
- Cites source documents where concepts are discussed
- Filters for relevance to the target project/domain
- Follows a consistent format for each entry

### Lexicon Format

```markdown
# Concept Lexicon: [Project/Domain Name]

## Executive Summary
[Overview of lexicon purpose and scope]

### Source Categories
| Category | Documents | Unique Concepts |
|----------|-----------|-----------------|
| [name]   | [count]   | [count]         |

## 1. [Topic Section]

### [Subtopic]
- **Concept name** — Brief definition or application context

## 2. [Topic Section]
...

## Application to [Project]
[How these concepts map to the actual implementation]

*Last Updated: [Date]*
```

## Workflow

```
┌─────────────────────────────────────┐
│ 1. CATEGORY DISCOVERY               │
│    Explore available categories     │
│    Filter for domain relevance      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. CONCEPT RETRIEVAL                │◄──┐
│    Get concepts from each category  │   │ LOOP: for each
│    → preserve: concept names, counts│   │ relevant category
└────────────┬────────────────────────┘   │
             │                            │
             ├── more categories? ────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. RELEVANCE FILTERING              │
│    Validate against project scope   │
│    Exclude non-applicable concepts  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. ORGANIZE & DOCUMENT              │
│    Group into logical sections      │
│    Add definitions and context      │
│    Include source attributions      │
└─────────────────────────────────────┘
```

## Scope Boundaries

### Include
- Concepts directly evidenced in project source code
- Concepts from dependencies and frameworks used
- Patterns and practices reflected in the implementation
- Domain-specific terminology

### Exclude
- Concepts only found in planning/AI-generated documentation
- Alternative technologies not actually used (e.g., STARKs when project uses SNARKs)
- Concepts too granular or implementation-specific
- Duplicate concepts (prefer canonical forms)

## Relevance Validation

Before including any concept, validate it exists in the actual codebase:

| Evidence Level | Action |
|----------------|--------|
| **Strong** — Found in dependencies AND source code | Include with high confidence |
| **Moderate** — Found in source code only | Include with verification |
| **Weak** — Found in comments/docs only | Consider excluding |
| **None** — Only in generated documentation | **Exclude** (circular reference) |

## Example Flow

```
User: "Create a concept lexicon for my TypeScript microservices project"

1. Use category-exploration to discover relevant categories
   - software engineering, software architecture, distributed systems, etc.
   - Exclude: embedded systems, cryptography (not applicable)

2. Use concept-exploration to retrieve concepts from each category
   - Get top concepts sorted by document coverage
   - Preserve concept names and frequency

3. Filter for relevance to TypeScript/microservices
   - Include: dependency injection, circuit breaker, API gateway
   - Exclude: RTOS, assembly, hardware interrupts

4. Organize into sections:
   - Architecture patterns
   - Testing practices
   - Infrastructure concepts

5. Generate lexicon document with:
   - Brief definitions
   - Source citations
   - Project application notes
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Target project/domain | Guide relevance filtering |
| Selected categories | Track scope |
| Concept list per category | Build comprehensive inventory |
| Source documents | Enable citations |

## Output Example

See [TDD Concepts for Rust](../../.engineering/artifacts/templates/tdd-concepts-rust.md) for a complete example of a curated concept lexicon.

## Maintenance

Update the lexicon when:
- New documents are added to the knowledge base
- Project architecture changes significantly
- New features introduce new conceptual domains
- Periodic review (quarterly recommended)
