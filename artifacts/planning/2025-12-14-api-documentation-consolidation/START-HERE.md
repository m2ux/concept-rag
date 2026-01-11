# API Documentation Consolidation - December 2025

**Created:** 2025-12-14
**Status:** Ready
**Type:** Documentation Consolidation

> **Note on Time Estimates:** All effort estimates refer to **agentic (AI-assisted) development time** plus separate **human review time**.

---

## 🎯 Executive Summary

Consolidate `docs/tool-selection-guide.md` into `docs/api-reference.md` by augmenting the API reference with full JSON input/response specifications and incorporating all selection guidance. The result is a single, comprehensive API specification document that eliminates redundancy.

---

## 📊 Progress

| Item | Status | Notes |
|------|--------|-------|
| Task 1: Analyze overlap and gaps | ⬚ Pending | Document current state |
| Task 2: Design response schemas | ⬚ Pending | JSON response specifications |
| Task 3: Augment catalog_search | ⬚ Pending | Full I/O specification |
| Task 4: Augment content search tools | ⬚ Pending | broad_chunks_search, chunks_search |
| Task 5: Augment concept tools | ⬚ Pending | concept_search, extract_concepts, source_concepts, concept_sources |
| Task 6: Augment category tools | ⬚ Pending | category_search, list_categories, list_concepts_in_category |
| Task 7: Consolidate selection guidance | ⬚ Pending | Merge decision tree and patterns |
| Task 8: Remove tool-selection-guide.md | ⬚ Pending | Delete redundant file |
| Task 9: Validation | ⬚ Pending | Review completeness |

---

## 🎯 This Work Package

**Objective:** Create a single, authoritative API reference document with:

1. **Full JSON Input Schemas** - Complete parameter specifications with types, constraints, defaults
2. **Full JSON Response Schemas** - Documented response structure for each tool
3. **Tool Selection Guidance** - Decision trees, patterns, and anti-patterns (from tool-selection-guide.md)
4. **Technical Details** - Scoring, performance, error handling

---

## 📅 Timeline

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Analysis | Task 1 | 15-20min agentic |
| Schema Design | Task 2 | 30-45min agentic |
| Tool Specifications | Tasks 3-6 | 60-90min agentic |
| Consolidation | Tasks 7-8 | 20-30min agentic |
| Validation | Task 9 | 15-20min agentic |

**Total:** 2-3 hours agentic + 30 minutes review

---

## 🎯 Success Criteria

- [ ] Each tool has complete JSON input schema with types, required fields, defaults
- [ ] Each tool has complete JSON response schema with example output
- [ ] All selection guidance from tool-selection-guide.md is incorporated
- [ ] Decision tree, patterns, and anti-patterns preserved
- [ ] Performance characteristics included
- [ ] tool-selection-guide.md removed (no longer needed)
- [ ] No broken links or references

---

## 📚 Document Navigation

| Document | Description |
|----------|-------------|
| **[START-HERE.md](START-HERE.md)** | 👈 You are here |
| [README.md](README.md) | Quick navigation |
| [01-overlap-analysis.md](01-overlap-analysis.md) | Content overlap analysis |
| [02-work-package-plan.md](02-work-package-plan.md) | Implementation details |

---

**Status:** Ready for implementation






