# Fork History Analysis

**Date:** 2025-11-20  
**Purpose:** Establish proper chronology considering fork origin

## Project Heritage

### Upstream: lance-mcp (2024)

**Source:** [Source: `CHANGELOG.md`, lines 105-112]

```
## [0.1.0] - 2024-XX-XX (lance-mcp origin)

### Initial Release (Upstream Project)
- Basic MCP server implementation
- LanceDB vector storage
- Simple document search
- PDF processing
- Vector embeddings
```

**Original Author:** adiom-data  
**Repository:** https://github.com/adiom-data/lance-mcp

**Inherited Foundational Decisions (2024):**
1. TypeScript with Node.js runtime
2. LanceDB for vector storage
3. MCP Protocol for AI agent integration
4. Basic RAG architecture
5. PDF document processing (pdf-parse)

### Fork: concept-rag (2025)

**Acknowledgment:** [Source: `CHANGELOG.md`, lines 102-103]
> "This project is forked from lance-mcp by adiom-data, which provided the foundational MCP server architecture and LanceDB integration."

**Fork Date:** Sometime before October 13, 2025 (first planning docs)

**Major Enhancements in Fork:**
- Conceptual search system (Oct 13, 2025)
- WordNet integration (Oct 13, 2025)
- Multi-signal hybrid ranking (Oct 13, 2025)
- Concept extraction pipeline (Oct 13, 2025)
- And all subsequent enhancements...

## Revised ADR Chronology

### Phase 0: Inherited Decisions (2024 - lance-mcp)

**ADRs 0001-0005: Date ~2024 (Upstream Project)**

These decisions were made in the original lance-mcp project by adiom-data:

1. **adr0001** - TypeScript with Node.js (2024, lance-mcp)
2. **adr0002** - LanceDB for Vector Storage (2024, lance-mcp)
3. **adr0003** - MCP Protocol (2024, lance-mcp)
4. **adr0004** - RAG Architecture (2024, lance-mcp)
5. **adr0005** - PDF Processing (2024, lance-mcp)

**Status:** INHERITED from upstream  
**Attribution:** Original decisions by adiom-data team  
**Evidence:** CHANGELOG.md lines 105-112

### Phase 1: Fork Enhancements (October 13, 2025)

**ADRs 0006-0011: concept-rag Fork Additions**

These are NEW decisions made in the concept-rag fork:

6. **adr0006** - Hybrid Search Strategy (Oct 13, 2025)
7. **adr0007** - Concept Extraction with LLMs (Oct 13, 2025)
8. **adr0008** - WordNet Integration (Oct 13, 2025)
9. **adr0009** - Three-Table Architecture (Oct 13, 2025)
10. **adr0010** - Query Expansion (Oct 13, 2025)
11. **adr0011** - Multi-Model Strategy (Oct 13, 2025)

**Status:** NEW architectural decisions  
**Attribution:** concept-rag team  
**Evidence:** Planning documents October 13, 2025

### Phases 2-7: Continued Enhancement (Oct 21 - Nov 19, 2025)

All subsequent ADRs (0012-0033+) are concept-rag enhancements.

## ADR Metadata Updates Required

### ADRs 0001-0005 Need Updates

**Current (Incorrect):**
- Date: ~September 2025
- Attribution: Engineering Team (implies concept-rag team)

**Corrected:**
- Date: ~2024
- Attribution: adiom-data (lance-mcp upstream)
- Inherited: concept-rag fork (2025)
- Note: Foundational decisions from upstream project

### Updated Header Format

**For Inherited ADRs:**
```markdown
# N. Title

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational decision from upstream lance-mcp project

**Sources:**
- Upstream: https://github.com/adiom-data/lance-mcp
- CHANGELOG.md - Lines 105-112 (v0.1.0 initial release)
- package.json, tsconfig.json, etc. (inherited configuration)
```

**For New ADRs:**
```markdown
# N. Title

**Date:** 2025-MM-DD  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** [Specific feature/refactoring]

**Sources:**
[Planning docs, code, etc.]
```

## Revised Confidence Levels

### Inherited ADRs (0001-0005)
**Confidence:** MEDIUM (Inherited)
**Reasoning:**
- Can't access original decision rationale from upstream
- Can infer from code structure and patterns
- CHANGELOG confirms these features existed in v0.1.0
- Attribution to upstream team (not us)

### Fork ADRs (0006+)
**Confidence:** HIGH  
**Reasoning:**
- Direct access to planning documents
- Explicit decision rationale documented
- Metrics and validation available
- Made by current team

## Action Items

### Update Existing ADRs (0001-0005)
- [ ] Update dates: ~September 2025 → ~2024
- [ ] Update attribution: Engineering Team → adiom-data (lance-mcp)
- [ ] Add "Inherited" status
- [ ] Add upstream repository link
- [ ] Add fork context note
- [ ] Update confidence attribution

### References Section Addition
Add to each inherited ADR:

```markdown
## Fork Context

**Original Project:** lance-mcp by adiom-data  
**Repository:** https://github.com/adiom-data/lance-mcp  
**Initial Release:** v0.1.0 (2024)  
**Fork:** concept-rag (2025)

**Inherited Features:**
- [List specific features inherited]

**concept-rag Enhancements:**
- See [ADR-XXXX] for major enhancements built on this foundation
```

## Timeline Clarity

```
2024: lance-mcp Project
  ├── TypeScript + Node.js chosen
  ├── LanceDB integrated
  ├── MCP Protocol support
  ├── Basic RAG architecture
  └── PDF processing (pdf-parse)

2025 (Early): Fork Created
  └── concept-rag inherits foundation

2025-10-13: Major Enhancement
  ├── Conceptual search transformation
  ├── WordNet integration
  ├── Multi-signal hybrid ranking
  ├── Concept extraction pipeline
  └── Three-table architecture

2025-11-14: Architecture Refactoring
  ├── Clean Architecture layers
  ├── Repository pattern
  ├── Dependency injection
  └── Performance + Security fixes

2025-11-19: Category System
  ├── Hash-based IDs
  ├── 46 categories
  └── Category search tools
```

---

**Status:** Fork history clarified  
**Next Action:** Update adr0001-0005 with correct dates and attribution  
**Impact:** More accurate historical record


