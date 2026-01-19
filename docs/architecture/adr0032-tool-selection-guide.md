# 32. Tool Selection Guide for AI Agents

**Date:** 2025-11-13  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Tool Documentation Enhancement (November 13, 2025)

**Sources:**
- Planning: [2025-11-13-tool-documentation-enhancement](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-13-tool-documentation-enhancement/)

## Context and Problem Statement

With 5 tools (later 8) serving different use cases [ADR-0031], AI agents struggled to select the appropriate tool [Problem: tool confusion]. Investigation revealed dramatic differences: concept_search returned 100% relevant results while broad_chunks_search returned 0% relevant for the same query ("innovation") with 0% overlap [Evidence: [README.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-13-tool-documentation-enhancement/README.md), lines 17-20].

**The Core Problem:** How to help AI agents (and humans) select the optimal tool for their query intent? [Planning: tool-documentation-enhancement]

**Decision Drivers:**
* 0% overlap between concept_search and broad_chunks_search [Evidence: investigation, lines 17-20]
* 100% vs. 0% precision shows tools serve different needs [Evidence: lines 17-19]
* AI agents need clear selection criteria [Requirement: guidance]
* Embedded MCP tool descriptions insufficient alone [Gap: limited space in description]
* Need comprehensive reference documentation [Requirement: detailed guide]

## Alternative Options

* **Option 1: Comprehensive Guide (5,800+ words) + Embedded Docs** - Detailed external guide + short tool descriptions
* **Option 2: Embedded Descriptions Only** - All guidance in MCP tool descriptions
* **Option 3: Examples Only** - Show examples, no rules
* **Option 4: Decision Tree Only** - Simple flowchart
* **Option 5: No Guidance** - Let agents figure it out

## Decision Outcome

**Chosen option:** "Comprehensive Guide + Embedded Docs (Option 1)", because investigation showed clear guidance is critical (100% vs. 0% precision difference), and two-level documentation (quick embedded + detailed external) serves both AI agents and human developers.

### Two-Level Documentation Strategy

**Level 1: Embedded in Tool Descriptions** [Source: `tool-documentation-enhancement/README.md`, lines 26-55]

**Pattern Applied to All 8 Tools:**
```typescript
description: `
[Tool Purpose - 1 sentence]

USE THIS TOOL WHEN:
- ✅ [Specific use case 1]
- ✅ [Specific use case 2]
- ✅ [Specific use case 3]

DO NOT USE for:
- ❌ [Wrong use case 1]
- ❌ [Wrong use case 2]

[Additional context...]
`
```

**Example - concept_search:** [Source: tool-selection-guide.md, lines 49-63]
```
USE THIS TOOL WHEN:
- ✅ User asks about a CONCEPT (e.g., "innovation", "leadership")
- ✅ Query is single conceptual term (1-3 words)
- ✅ Need high-precision semantic results
- ✅ Tracking concept across documents

DO NOT USE for:
- ❌ Full sentences or questions
- ❌ Exact keyword matches
- ❌ Document-level results
```

**Level 2: Comprehensive External Guide** [Source: `tool-selection-guide.md` created Nov 13]

**Contents:** [Source: tool-documentation README, lines 59-70]
- Quick Decision Tree (visual flowchart)
- Tool Comparison Matrix (side-by-side)
- Detailed Selection Criteria (when/when not)
- Decision Logic Examples (5 real-world queries)
- Common Patterns & Anti-Patterns
- Scoring System Comparison
- Performance Characteristics
- Technical Architecture differences
- "3 Questions" Method (simple framework)
- Test Cases (10 examples with mappings)

**Size:** 5,800+ words [Source: line 59]

### Decision Tree

**Quick Reference:** [Source: tool-selection-guide.md, lines 5-32]
```
START: User asks a question
│
├─ Looking for documents by title/author?
│  └─ YES → catalog_search
│
├─ Browsing by category/domain?
│  ├─ "What categories?" → list_categories
│  ├─ "Documents in [category]" → category_search
│  └─ "Concepts in [category]" → list_concepts_in_category
│
├─ Explicitly extracting/listing ALL concepts?
│  └─ YES → extract_concepts
│
├─ Searching for CONCEPTUAL TOPIC (single concept)?
│  └─ YES → concept_search (highest precision)
│
├─ Know SPECIFIC DOCUMENT to search within?
│  └─ YES → chunks_search (requires source)
│
├─ Searching PHRASES/KEYWORDS/QUESTIONS?
│  └─ YES → broad_chunks_search (comprehensive)
│
└─ DEFAULT → catalog_search (exploration)
```

### Consequences

**Positive:**
* **Clear guidance:** AI agents have explicit selection criteria [Benefit: decision support]
* **Two-level docs:** Quick (embedded) + detailed (external) [Architecture: layered help]
* **Investigation-driven:** Based on real 0% overlap evidence [Quality: empirical]
* **Comprehensive:** 5,800+ words cover all scenarios [Coverage: thorough]
* **Decision tree:** Visual flowchart for quick decisions [UX: accessible]
* **Test cases:** 10 examples with correct tool mappings [Validation: concrete]
* **Reduced confusion:** Better tool selection in practice [Result: improved usage]

**Negative:**
* **Long document:** 5,800+ words (may not be fully read) [Length: long]
* **Maintenance:** Must update as tools evolve [Burden: keeping current]
* **Two places:** Embedded + external must stay synchronized [Consistency: dual maintenance]

**Neutral:**
* **README link:** Prominent link to guide in README [Discovery: accessible]
* **AI-specific:** Explicit "For AI agents" section [Audience: targeted]

### Confirmation

**Impact Measured:** [Source: `tool-documentation-enhancement/README.md`, lines 107-118]

**Before:**
- AI agents struggled to select tools
- Results inconsistent
- No clear guidance
- Documentation scattered

**After:**
- Clear embedded guidance in MCP descriptions
- AI agents make informed decisions
- Comprehensive external reference
- Better results through proper tool usage

**Metrics:** [Source: lines 120-125]
- 5 tool classes enhanced
- 1 comprehensive guide (5,800+ words)
- 2 user docs updated (README, USAGE)
- 10 test cases documented

## Pros and Cons of the Options

### Option 1: Comprehensive Guide + Embedded - Chosen

**Pros:**
* Two-level documentation (quick + detailed)
* Investigation-backed (0% overlap evidence)
* 5,800+ words comprehensive
* Decision tree + matrix + examples
* 10 test cases
* Production validated (better tool selection)

**Cons:**
* Long document (maintenance)
* Two places to update
* May not be fully read

### Option 2: Embedded Only

All guidance in MCP tool descriptions.

**Pros:**
* Single source of truth
* Always visible to AI agents
* No external docs

**Cons:**
* **Character limits:** MCP descriptions should be concise [Limitation: length]
* **No deep explanation:** Can't include examples, test cases [Gap: detail]
* **No comparison:** Can't show side-by-side matrix [Gap: context]
* **Investigation insights:** Can't include 0% overlap analysis [Gap: evidence]

### Option 3: Examples Only

Just show examples, no explicit rules.

**Pros:**
* Concrete and practical
* Easy to understand
* Real queries

**Cons:**
* **Incomplete:** Examples don't cover edge cases [Gap: coverage]
* **Ambiguous:** What about queries not in examples? [Problem: generalization]
* **No decision logic:** Agents must infer rules [Gap: explicit criteria]

### Option 4: Decision Tree Only

Just the flowchart, no prose.

**Pros:**
* Visual and quick
* Clear flow
* Simple to follow

**Cons:**
* **Lacks context:** Why these decisions? [Gap: rationale]
* **No examples:** What's a "conceptual topic"? [Gap: concrete]
* **No investigation:** Can't explain 0% overlap finding [Gap: evidence]
* **Incomplete:** Some queries need more nuance [Limitation: binary decisions]

### Option 5: No Guidance

Agents figure it out through trial and error.

**Pros:**
* Zero effort
* Agents learn organically

**Cons:**
* **Poor UX:** Frustrating for users [Problem: confusion]
* **Wasted queries:** Wrong tool = bad results [Inefficiency: retries]
* **Investigation shows:** Tools have 0% overlap - can't guess [Evidence: fundamentally different]
* **Rejected:** Guidance clearly needed

## Implementation Notes

### Files Created

**tool-selection-guide.md:** [Source: Created Nov 13, 2025]
- 5,800+ words
- 10 sections
- 10 test cases
- Decision tree
- Comparison matrix

### Tool Description Updates

**All 5 Tools Updated:** [Source: lines 27-55]
1. concept_search - Added USE/DON'T USE sections
2. broad_chunks_search - Clarified hybrid methodology
3. catalog_search - Emphasized document-level focus
4. chunks_search - Clarified two-step workflow
5. extract_concepts - Emphasized export purpose

**Later (Nov 19):** 3 category tools added with same pattern

### README Integration

**Prominent Link:** [Source: README.md]
```markdown
**For AI agents:** See [API Reference](../api-reference.md) 
for the complete decision tree.
```

**Table:** 8 tools with "Best For" and "Use When" columns

## Related Decisions

- [ADR-0031: Eight Specialized Tools](adr0031-eight-specialized-tools-strategy.md) - Why we need guide
- [ADR-0033: BaseTool Abstraction](adr0033-basetool-abstraction.md) - Tool implementation pattern

## References

### Related Decisions
- [ADR-0031: Eight Specialized Tools](adr0031-eight-specialized-tools-strategy.md)

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 13, 2024
- Investigation documented: tool-documentation-enhancement/README.md lines 14-22

**Traceability:** [2025-11-13-tool-documentation-enhancement](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-13-tool-documentation-enhancement/)



