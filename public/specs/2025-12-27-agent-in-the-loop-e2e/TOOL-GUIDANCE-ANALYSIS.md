# Tool Selection Guidance Analysis

**Date:** 2025-12-28  
**Related Issues:** #49 (AIL Testing), #56 (Skills Interface)  
**Status:** Analysis Complete - Recommendations Provided

## Problem Statement

AIL testing revealed that agents:
1. **Use wrong tools** for the task (e.g., `broad_chunks_search` instead of `concept_search`)
2. **Miss optimal tools** entirely (e.g., never use `source_concepts`, `category_search`)
3. **Don't follow recommended workflows** (e.g., `catalog_search` → `chunks_search`)

The question: **How do we provide effective tool selection guidance to LLM agents?**

## Current State Analysis

### What Agents See (MCP Tool Descriptions)

| Tool | Description Length | Has "USE THIS WHEN"? | Has "DO NOT USE"? |
|------|-------------------|----------------------|-------------------|
| `catalog_search` | Long ✅ | Yes ✅ | Yes ✅ |
| `broad_chunks_search` | Long ✅ | Yes ✅ | Yes ✅ |
| `chunks_search` | Long ✅ | Yes ✅ | Yes ✅ |
| `concept_search` | Long ✅ | Yes ✅ | Yes ✅ |
| `extract_concepts` | Long ✅ | Yes ✅ | Yes ✅ |
| `source_concepts` | Long ✅ | Yes ✅ | Yes ✅ |
| `concept_sources` | Long ✅ | Yes ✅ | Yes ✅ |
| **`category_search`** | **Short ❌** | **No ❌** | **No ❌** |
| **`list_categories`** | **Short ❌** | **No ❌** | **No ❌** |
| **`list_concepts_in_category`** | **Short ❌** | **No ❌** | **No ❌** |

**Finding:** 3 of 10 tools (the category tools) have minimal descriptions without usage guidance.

### Example: Good vs. Poor Tool Description

**Good (concept_search):**
```typescript
description = `Find chunks associated with a concept, organized by source documents.

USE THIS TOOL WHEN:
- Searching for a conceptual topic (e.g., "innovation", "leadership")
- Tracking where and how a concept is discussed across your library

DO NOT USE for:
- Keyword searches or exact phrase matching (use broad_chunks_search)
- Finding documents by title (use catalog_search)
- Searching within a known document (use chunks_search)`
```

**Poor (list_categories):**
```typescript
description = "List all available categories with statistics. Discover what subject areas are in your library.";
```

### What Agents DON'T See

1. **Tool Selection Guide** (`docs/tool-selection-guide.md`)
   - Comprehensive decision tree
   - Detailed use cases
   - Common workflows
   - NOT exposed via MCP

2. **Workflow Sequences**
   - `catalog_search` → `chunks_search` pattern
   - `list_categories` → `category_search` pattern
   - NOT encoded in tool descriptions

3. **Tool Relationships**
   - `chunks_search` REQUIRES prior `catalog_search` to get source path
   - `category_search` REQUIRES knowing category exists
   - NOT made explicit

## Root Cause Analysis

### Why Agents Select Wrong Tools

1. **Description Gaps:** Category tools lack "USE THIS WHEN" guidance
2. **No Workflow Context:** Tools don't explain how they relate to each other
3. **Semantic Overlap:** Multiple tools could plausibly answer same query
4. **No Priority Guidance:** Agent doesn't know which tool is "better" for a query

### AIL Test Failure Correlation

| Failed Scenario | Missing Tool | Root Cause |
|-----------------|--------------|------------|
| Category exploration | `list_categories` | Agent made 0 calls - didn't know this tool exists? |
| Dependency inversion | `source_concepts` | Agent used `concept_search` instead (semantic overlap) |
| Domain concepts | `category_search` | Agent used `list_concepts_in_category` only |

## Solution Options

### Option A: Enhanced Tool Descriptions (Recommended First Step)

**Approach:** Add "USE THIS WHEN" and "DO NOT USE" to all 10 tools consistently.

**Pros:**
- Works immediately with all MCP clients
- No new infrastructure required
- Consistent with existing pattern (7/10 tools already have this)
- Client-agnostic (Cursor, Claude Desktop, etc.)

**Cons:**
- Still 10 separate tools for agent to choose from
- Doesn't enforce workflows
- Agent must still parse all descriptions

**Effort:** Low (1-2 hours)

### Option B: Skills Interface (Issue #56)

**Approach:** Create high-level "skills" that bundle tools with sequencing logic.

**Example Skills:**
- `research_topic` → `catalog_search` → `chunks_search` → `extract_concepts`
- `explore_domain` → `list_categories` → `category_search` → `list_concepts_in_category`
- `find_concept_sources` → `source_concepts` or `concept_sources` (auto-selected)

**Pros:**
- Fewer decisions for agent (e.g., 4 skills vs. 10 tools)
- Enforces correct workflows
- Context preservation across steps
- Intent-based interaction ("research topic X")

**Cons:**
- Significant implementation effort
- MCP ecosystem still evolving (no standard skills pattern)
- Client compatibility unknown
- May limit flexibility for advanced users

**Effort:** High (1-2 weeks, plus research)

### Option C: System Prompt Injection

**Approach:** Inject tool selection guide into agent's system prompt.

**Implementation:** For MCP servers, provide a `resources` endpoint that clients can use to add context.

**Pros:**
- Agent sees complete decision tree
- Works with existing tools
- No tool changes required

**Cons:**
- Not all MCP clients support resources
- Increases prompt size/cost
- Still relies on agent reasoning

**Effort:** Medium (3-5 hours)

### Option D: Hybrid (A + B)

**Approach:** 
1. **Immediately:** Fix tool descriptions (Option A)
2. **Later:** Implement skills layer (Option B) as optional enhancement

**Pros:**
- Quick wins now
- Preserves optionality
- Skills can use enhanced tools internally

**Effort:** A now + B later

## Recommendation

### Immediate Action (This PR): Option A - Enhanced Tool Descriptions

Fix the three category tools to have full "USE THIS WHEN" / "DO NOT USE" guidance:

```typescript
// list_categories
description = `List all available categories with statistics. Discover what subject areas are in your library.

USE THIS TOOL WHEN:
- User asks "What categories do I have?"
- Exploring available subject areas in your library
- Need category statistics and metadata
- Category discovery before using category_search

DO NOT USE for:
- Looking for specific documents (use catalog_search or category_search)
- Searching content (use search tools)
- Already know the category (use category_search directly)`;
```

```typescript
// category_search
description = `Find documents by category. Browse documents in a specific domain or subject area. Returns all documents in the category.

USE THIS TOOL WHEN:
- Browse documents in a specific domain or subject area
- Filter library by category
- List all documents in a category

DO NOT USE for:
- Don't know what categories exist (use list_categories first)
- Need content search, not document listing (use broad_chunks_search)
- Looking for a concept, not a category (use concept_search)`;
```

```typescript
// list_concepts_in_category
description = `Find all unique concepts appearing in documents of a specific category. Analyze the conceptual landscape of a domain.

USE THIS TOOL WHEN:
- "What concepts appear in [category] documents?"
- Analyze conceptual landscape of a domain
- Find key concepts for a subject area
- Cross-domain concept discovery

DO NOT USE for:
- Need to search for content (use concept_search or broad_chunks_search)
- Want documents in a category (use category_search)
- Looking for a specific concept (use concept_search)`;
```

### Future Action (Issue #56): Option B - Skills Interface

After tool descriptions are fixed, evaluate skills interface:
1. Research landscape (skill-mcp-fastmcp, emerging patterns)
2. Prototype 2-3 core skills
3. Measure AIL test improvement
4. Decide on full implementation

## Success Metrics

After implementing Option A:

| Metric | Current | Target |
|--------|---------|--------|
| Category tool usage | 0% (tier 2: category exploration) | >50% |
| Tier 2 pass rate | 33.3% | >60% |
| Tier 3 tool selection failures | 2/3 | <1/3 |

## Implementation Plan

### Phase 1: Enhanced Descriptions (This Week)

1. Update `list-categories-tool.ts` description
2. Update `category-search-tool.ts` description
3. Update `list-concepts-in-category-tool.ts` description
4. Re-run AIL tests to measure improvement

### Phase 2: Skills Research (Issue #56)

1. Survey existing frameworks
2. Prototype approach
3. Measure impact
4. Full implementation decision

## References

- [Issue #49 - AIL Testing](https://github.com/m2ux/concept-rag/issues/49)
- [Issue #56 - Skills Interface](https://github.com/m2ux/concept-rag/issues/56)
- [Tool Selection Guide](../../../docs/tool-selection-guide.md)
- [MCP is Broken and Anthropic Just Admitted It](https://www.latent.space/p/mcp-is-broken) - External analysis

---

*Analysis completed as part of AIL E2E Testing investigation*





