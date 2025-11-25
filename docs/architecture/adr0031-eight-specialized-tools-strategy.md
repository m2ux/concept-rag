# 31. Eight Specialized Tools Strategy

**Date:** 2025-11-13 to 2025-11-19 (Progressive Evolution)  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Tool Proliferation through Specialization

**Sources:**
- Planning: .ai/planning/2025-11-13-tool-documentation-enhancement/, .ai/planning/2025-11-19-category-search-feature/

## Context and Problem Statement

The system started with 2 basic tools (catalog_search, chunks_search) [Initial: inherited from lance-mcp], evolved to 5 tools with conceptual search (Oct 13) [ADR-0006, ADR-0007], and grew to 8 tools with category features (Nov 19) [ADR-0029]. Each addition created a more specialized tool optimized for a specific use case [Pattern: proliferation].

**The Core Problem:** Should we have few general-purpose tools or many specialized tools? [Design Philosophy: generalization vs. specialization]

**Decision Drivers:**
* Different search modalities need different indexes [Technical: concept vs. hybrid vs. category]
* AI agents benefit from clear tool purposes [UX: explicit intent]
* Specialization enables optimization [Performance: focused algorithms]
* MCP protocol supports multiple tools easily [Context: no tool limit]
* Tool proliferation observed in investigation [Discovery: `.ai/planning/2025-11-13-tool-documentation-enhancement/`]

## Alternative Options

* **Option 1: Eight Specialized Tools** - One tool per use case
* **Option 2: Single Universal Tool** - One tool with complex parameters
* **Option 3: Three General Tools** - Search, browse, extract
* **Option 4: Modes/Flags** - Few tools with mode parameters
* **Option 5: Two Tools Only** - Catalog + chunks (minimal)

## Decision Outcome

**Chosen option:** "Eight Specialized Tools (Option 1)", because investigation showed different tools serve fundamentally different use cases with 0% overlap [Evidence: concept_search vs. broad_chunks_search investigation], and specialized tools enable better optimization, clearer intent, and easier AI agent selection.

### The Eight Tools

**Tool Evolution:** [Source: README.md, line 19; tool-selection-guide.md]

**Initial (lance-mcp, 2024):**
1. catalog_search
2. chunks_search

**Oct 13, 2025 Enhancement:**
3. concept_search (added)
4. broad_chunks_search (added)
5. extract_concepts (added)

**Nov 19, 2025 Enhancement:**
6. category_search (added)
7. list_categories (added)
8. list_concepts_in_category (added)

**Current Total:** 8 specialized tools [Source: README.md, line 19]

### Tool Specialization Matrix

**By Search Scope:** [Source: tool-selection-guide.md, lines 36-45]

| Tool | Scope | Index | Precision | Use Case |
|------|-------|-------|-----------|----------|
| **concept_search** | All chunks | Concept-enriched | ⭐⭐⭐⭐⭐ | Conceptual research |
| **broad_chunks_search** | All chunks | Hybrid | ⭐⭐⭐ | Comprehensive search |
| **catalog_search** | Doc summaries | Hybrid+titles | ⭐⭐⭐⭐ | Document discovery |
| **chunks_search** | Single doc | Hybrid+filter | ⭐⭐⭐⭐ | Focused search |
| **extract_concepts** | Doc metadata | Concept catalog | N/A | Concept export |
| **category_search** | Category docs | Category filter | ⭐⭐⭐⭐⭐ | Domain browsing |
| **list_categories** | All categories | Category table | N/A | Category discovery |
| **list_concepts_in_category** | Category concepts | Aggregation | ⭐⭐⭐⭐ | Domain analysis |

### Investigation Evidence

**"innovation" Search Comparison:** [Source: `.ai/planning/2025-11-13-tool-documentation-enhancement/README.md`, lines 14-22]
- **concept_search**: 10/10 results relevant (100% precision)
- **broad_chunks_search**: 0/10 results relevant (0% precision)
- **Overlap**: 0% - No common chunks

**Key Insight:** [Source: lines 101-104]
> "The two methods are complementary but fundamentally different:
> - Concept search = High precision semantic tagging
> - Broad chunks search = Comprehensive text coverage"

**Conclusion:** Different tools for genuinely different needs [Evidence: 0% overlap validates specialization]

### Consequences

**Positive:**
* **Optimized performance:** Each tool uses best algorithm for its use case [Benefit: optimization]
* **Clear intent:** Tool name indicates purpose [UX: self-documenting]
* **AI agent selection:** Easy for agents to pick right tool [UX: guided choice] [Source: README.md, line 28]
* **Precision control:** High-precision tools (concept, category) separate from broad tools [Feature: precision levels]
* **Complementary:** Tools cover different needs (0% overlap proven) [Evidence: investigation]
* **No feature bloat:** Each tool stays focused [Pattern: SRP]
* **Tool selection guide:** Comprehensive guidance created [Documentation: tool-selection-guide.md]

**Negative:**
* **More to learn:** 8 tools vs. 2 (4x increase) [Complexity: learning curve]
* **Selection burden:** Must choose right tool [UX: decision required]
* **Maintenance:** 8 tools to maintain vs. 2 [Maintenance: overhead]
* **Documentation:** More tools = more docs [Effort: documentation]

**Neutral:**
* **Tool count growing:** Started 2, now 8, may grow further [Trend: proliferation]
* **MCP scalability:** Protocol handles any number of tools [Capacity: no limit]

### Confirmation

**Usage Validation:**
- **Tool selection guide:** 5,800+ words comprehensive guide created [Source: tool-documentation README, line 59]
- **Investigation:** 0% overlap validates specialization approach [Source: lines 14-22]
- **AI agent success:** Agents reliably select appropriate tools [Observation: production usage]
- **Production:** All 8 tools deployed and working [Status: active]

**Evolution Justified:**
- Oct 13: 3 tools added for conceptual search (fundamentally different indexes)
- Nov 13: Tool docs enhanced after discovering 0% overlap
- Nov 19: 3 tools added for category browsing (new dimension)

## Pros and Cons of the Options

### Option 1: Eight Specialized Tools - Chosen

**Pros:**
* Each tool optimized for use case
* 0% overlap validated (investigation)
* Clear intent per tool
* Easy AI agent selection
* High precision where needed
* Comprehensive coverage
* 8 tools deployed successfully

**Cons:**
* Learning curve (8 vs. 2 tools)
* Selection burden
* More maintenance
* More documentation

### Option 2: Single Universal Tool

One tool with complex parameters (mode, scope, precision, etc.).

**Pros:**
* One tool to learn
* Simple tool list
* Single interface

**Cons:**
* **Complex parameters:** Many parameters confusing [Problem: parameter explosion]
* **Unclear intent:** What does this query do? [UX: ambiguous]
* **Poor optimization:** Can't optimize for all use cases [Performance: compromised]
* **Against MCP philosophy:** Tools should be focused [Pattern: SRP]
* **Investigation shows:** Different indexes needed (can't unify) [Evidence: 0% overlap]

### Option 3: Three General Tools

Search (text), browse (metadata), extract (concepts).

**Pros:**
* Moderate tool count
* Grouped by function
* Simpler than 8

**Cons:**
* **Loses precision control:** concept_search (high) vs. broad_chunks_search (medium) [Trade-off: precision]
* **Category separate:** Categories don't fit into text/browse/extract [Gap: new dimension]
* **Middle ground weakness:** Not specialized enough OR simple enough
* **Investigation:** Would group tools with 0% overlap [Problem: wrong grouping]

### Option 4: Modes/Flags

Few tools with mode parameters (e.g., search(mode='concept')).

**Pros:**
* Fewer tool definitions
* Grouped functionality

**Cons:**
* **Parameter complexity:** Mode='concept'|'broad'|'catalog'|'chunks'... [Problem: confusing]
* **Hidden differences:** Same tool, totally different behavior [UX: misleading]
* **Against MCP pattern:** Tools should be distinct [Pattern: violation]
* **Harder for AI:** Must understand mode semantics [UX: complexity]

### Option 5: Two Tools Only (Minimal)

Just catalog_search and chunks_search (upstream state).

**Pros:**
* Simplest
* Easy to learn
* Minimal maintenance

**Cons:**
* **No conceptual search:** Lost main feature [Gap: core value]
* **No category browsing:** Can't explore domains [Gap: navigation]
* **No concept export:** Can't generate concept lists [Gap: analytics]
* **Upstream limitation:** Why we forked [History: insufficient]

## Implementation Notes

### Tool Decision Tree

**Created:** November 13, 2025 [Source: tool-selection-guide.md, lines 5-32]

**Structure:**
```
Are they looking for documents? → catalog_search
Are they browsing by category? → category_search, list_categories
Are they extracting concepts? → extract_concepts
Are they searching for a concept? → concept_search
Do they know the document? → chunks_search
Are they asking questions/phrases? → broad_chunks_search
```

**Embedded in:** tool-selection-guide.md (AI agents reference)

### Tool Count Evolution

**Timeline:**
- 2024: 2 tools (lance-mcp)
- Oct 13, 2025: 5 tools (+3 conceptual)
- Nov 19, 2025: 8 tools (+3 category)

**Pattern:** Add tools when genuinely different use case emerges

### Specialization Criteria

**When to Add New Tool:**
1. Different index/data source (concept vs. hybrid vs. category)
2. Different precision level (high vs. medium)
3. Different scope (document vs. chunk vs. concept)
4. 0% overlap with existing tools (no redundancy)
5. Clear, distinct use case

## Related Decisions

- [ADR-0003: MCP Protocol](adr0003-mcp-protocol.md) - Protocol supports multiple tools
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Enabled concept_search tool
- [ADR-0029: Category Search Tools](adr0029-category-search-tools.md) - Added 3 category tools
- [ADR-0032: Tool Selection Guide](adr0032-tool-selection-guide.md) - Helps users choose
- [ADR-0033: BaseTool Abstraction](adr0033-basetool-abstraction.md) - Tool implementation pattern

## References

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 13, 2024 (tool documentation), November 19, 2024 (category tools)
- Investigation: tool-documentation-enhancement/README.md lines 14-22

**Traceability:** .ai/planning/2025-11-13-tool-documentation-enhancement/, .ai/planning/2025-11-19-category-search-feature/



