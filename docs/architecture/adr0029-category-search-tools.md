# 29. Category Search Tools (Three New MCP Tools)

**Date:** 2025-11-19  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Category Search Feature (November 19, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-19-category-search-feature/
- Git Commits: d4ce00a4e6417a1d966eb97f624175cf6800baa3, f6e7c371de6d631905468c55e540210893336a13 (November 18-19, 2024)

## Context and Problem Statement

Users had 46 auto-extracted categories [ADR-0030] but no way to browse documents by category [Gap: missing functionality]. Existing tools were text-search focused (catalog_search, concept_search) but not category-focused [Limitation: no domain browsing]. Users needed domain-based navigation ("show me all distributed systems books") [Use case: category browsing].

**The Core Problem:** How to enable users to discover and browse documents by domain/category? [Planning: `.ai/planning/2025-11-19-category-search-feature/05-category-search-tool.md`]

**Decision Drivers:**
* 46 categories exist but not accessible [Gap: unused data]
* Domain-based browsing needed [Use case: "browse by topic"]
* Category discovery ("what categories do I have?") [Use case: exploration]
* Concept analysis per category [Use case: "what is X field about?"]
* MCP tool paradigm (specialized tools) [Pattern: tool per use case] [ADR-0031]

## Alternative Options

* **Option 1: Three Specialized Tools** - category_search, list_categories, list_concepts_in_category
* **Option 2: Single Category Tool** - One tool with mode parameter
* **Option 3: Extend Existing Tools** - Add category filter to catalog_search
* **Option 4: Category Query Language** - DSL for category queries
* **Option 5: No Category Tools** - Keep categories internal only

## Decision Outcome

**Chosen option:** "Three Specialized Tools (Option 1)", because it follows the project's pattern of specialized tools optimized for specific use cases [Philosophy: ADR-0031], provides clear interfaces for each operation, and enables AI agents to select the right tool for their intent.

### Three Tools Implemented

**Tool 1: category_search** [Source: `.ai/planning/2025-11-19-category-search-feature/IMPLEMENTATION-COMPLETE.md`, line 67]
```typescript
{
  name: "category_search",
  description: "Find documents by category. Browse documents in a specific domain.",
  input: {
    category: string,        // "software engineering", "distributed systems"
    includeChildren?: boolean,
    limit?: number
  }
}
```

**Use Case:** "Show me software engineering documents"

**Tool 2: list_categories** [Source: line 68]
```typescript
{
  name: "list_categories",
  description: "List all available categories with statistics.",
  input: {
    search?: string,          // Optional filter
    sortBy?: 'name' | 'popularity' | 'documentCount',
    limit?: number
  }
}
```

**Use Case:** "What categories do I have?"

**Tool 3: list_concepts_in_category** [Source: line 69]
```typescript
{
  name: "list_concepts_in_category",
  description: "Find all unique concepts in a category.",
  input: {
    category: string,         // Category name
    sortBy?: 'name' | 'documentCount',
    limit?: number
  }
}
```

**Use Case:** "What concepts are discussed in distributed systems books?"

### Implementation

**Files Created:** [Source: Tool implementation]
- `src/tools/operations/category-search.ts` - category_search tool
- `src/tools/operations/list-categories.ts` - list_categories tool
- `src/tools/operations/list-concepts-in-category.ts` - list_concepts tool

**Repository Support:** [Source: Repository methods]
- `CatalogRepository.findByCategory()` - Queries category_ids field
- `CatalogRepository.getConceptsInCategory()` - Aggregates concepts
- `CategoryRepository.findByName()`, `.getAll()` - Category operations

### Consequences

**Positive:**
* **Domain browsing:** Can explore by category [Feature: navigation]
* **Category discovery:** List all categories [Feature: exploration]
* **Concept analysis:** What's in each domain [Feature: analytics]
* **Fast queries:** category_search < 10ms [Performance: `IMPLEMENTATION-COMPLETE.md`]
* **Specialized tools:** Each tool optimized for use case [Pattern: focused]
* **8 total tools:** Grew from 5 to 8 tools [Source: README.md, line 19]
* **AI agent friendly:** Clear tool descriptions guide usage [UX: self-documenting]

**Negative:**
* **Tool proliferation:** Now 8 tools (was 5) [Trade-off: more complexity]
* **Learning curve:** Users/agents must learn 3 new tools [UX: more to learn]
* **Aggregation cost:** list_concepts_in_category requires aggregation (~30-130ms) [Performance: computational]

**Neutral:**
* **MCP tool pattern:** Follows established tool pattern [Consistency: same approach]
* **Concept aggregation:** Computed at query time (not pre-computed) [Design: on-demand]

### Confirmation

**Testing Results:** [Source: `IMPLEMENTATION-COMPLETE.md`, lines 32-38]
- **Schema validation:** 6/6 checks passed
- **Functional tests:** 7/7 tests passed
- **category_search:** Working
- **list_categories:** Working
- **list_concepts_in_category:** Working
- **ID resolution:** Bidirectional working
- **Concept aggregation:** Dynamic computation working

**Production Usage:**
- All 3 tools available in Cursor/Claude Desktop
- Tool selection guide updated
- README updated with tool descriptions

## Pros and Cons of the Options

### Option 1: Three Specialized Tools - Chosen

**Pros:**
* Each tool optimized for specific use case
* Clear intent (tool name = purpose)
* Follows project pattern (specialized tools) [ADR-0031]
* 7/7 functional tests passed [Validated]
* Fast performance (< 10ms for category_search)
* AI agent friendly (clear descriptions)

**Cons:**
* Tool proliferation (8 total now)
* Learning curve (3 new tools)
* Aggregation cost for list_concepts

### Option 2: Single Category Tool

One tool with mode parameter.

**Pros:**
* Single tool to learn
* Fewer tool definitions
* Centralized category logic

**Cons:**
* **Mode parameter anti-pattern:** Tool should have single purpose [Problem: mixed responsibilities]
* **Against project philosophy:** Specialized tools preferred [Philosophy: ADR-0031]
* **Confusing:** Which mode for which use case? [UX: unclear]
* **Not chosen:** Violates design principles

### Option 3: Extend Existing Tools

Add category filter to catalog_search.

**Pros:**
* No new tools
* Familiar interface
* Optional parameter

**Cons:**
* **Mixes concerns:** catalog_search is text-search, not category-browser [Problem: SRP]
* **Unclear UX:** When to use text vs. category? [UX: confusing]
* **Discovery problem:** How to list categories? [Gap: unaddressed]
* **Against pattern:** Tools should be specialized [Philosophy: dedicated tools]

### Option 4: Category Query Language

Custom DSL for category operations.

**Pros:**
* Powerful and flexible
* Expressive queries

**Cons:**
* **Massive over-engineering:** Need simple browsing, not query language [Complexity: extreme]
* **Learning curve:** Users must learn DSL syntax [UX: steep]
* **AI agent confusion:** Hard for agents to generate correct syntax [Problem: complex]
* **Overkill:** 3 simple tools sufficient [Simplicity: adequate]

### Option 5: No Category Tools

Keep categories internal (storage optimization only).

**Pros:**
* Zero tool code
* Simple

**Cons:**
* **Wasted opportunity:** Have 46 categories but can't use them [Problem: data unused]
* **Against goal:** Categories meant for browsing [Purpose: UX feature]
* **User request:** Category browsing was the goal [Requirement: unmet]
* **Rejected:** Tools are the value [Decision: must expose]

## Implementation Notes

### Tool Registration

**Updated Tool Count:** [Source: README.md, line 19]
```
Before: 5 search tools
After: 8 specialized tools (added 3 category tools)
```

**Tool Selection Guide:** [Source: tool-selection-guide.md updated]
- Decision tree includes category tools
- When to use each tool documented
- Examples provided

### Performance Characteristics

**Observed:** [Source: `IMPLEMENTATION-COMPLETE.md`, performance notes]
- `category_search`: < 10ms (fast array filter)
- `list_categories`: < 1ms (cached, 46 categories)
- `list_concepts_in_category`: ~30-130ms (aggregation cost, varies by category size)

### Tool Descriptions

**Embedded Documentation:** [Source: Tool definitions]
Each tool has detailed description guiding AI agent usage:
- What the tool does
- When to use it
- Parameter descriptions
- Example queries

**Result:** AI agents reliably choose correct tool [Validation: usage patterns]

## Related Decisions

- [ADR-0028: Category Storage](adr0028-category-storage-strategy.md) - Storage enables tools
- [ADR-0027: Hash-Based IDs](adr0027-hash-based-integer-ids.md) - IDs used in queries
- [ADR-0030: 46 Categories](adr0030-auto-extracted-categories.md) - Categories to browse
- [ADR-0031: Eight Specialized Tools](adr0031-eight-specialized-tools-strategy.md) - Tool proliferation strategy

## References

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 18-19, 2024
- Git commits: d4ce00a4, f6e7c371
- Testing: IMPLEMENTATION-COMPLETE.md lines 32-38

**Traceability:** .ai/planning/2025-11-19-category-search-feature/
