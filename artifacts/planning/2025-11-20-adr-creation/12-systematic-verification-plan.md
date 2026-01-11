# Systematic ADR Verification Plan

**Date:** 2025-11-20  
**Task:** Verify ALL 33 ADRs for temporal accuracy

## Verification Checklist Per ADR

For each ADR, verify:
- [ ] Code blocks show code from that commit (not later)
- [ ] Schema shows schema from that commit (not evolved)
- [ ] Metrics are from that time (not later measurements)
- [ ] Features mentioned existed at that time
- [ ] No references to future ADRs in main content
- [ ] Tool count matches that time (not current 8)
- [ ] Table count matches that time
- [ ] No "later" / "enhanced" / "evolution" language
- [ ] Consequences reflect knowledge at decision time

## ADR-by-ADR Verification

### Phase 0: Inherited (lance-mcp commit 082c38e2, Nov 19, 2024)

**adr0001 - TypeScript/Node.js**
- [ ] Check: No references to concept-rag features
- [ ] Check: Config from lance-mcp package.json
- [ ] Check: No mention of 37 tests (added later in concept-rag)

**adr0002 - LanceDB**
- [x] FIXED: Schema is 2-table (catalog, chunks)
- [ ] Check: No concept table references
- [ ] Check: Storage size from upstream (not 324MB/699MB from concept-rag)

**adr0003 - MCP Protocol**
- [ ] Check: Tool count is 3 (not 8)
- [ ] Check: Tool names from lance-mcp (catalog_search, chunks_search, broad_chunks_search)

**adr0004 - RAG**
- [x] FIXED: Pipeline shows Ollama (not Claude/Grok)
- [ ] Check: No concept extraction
- [ ] Check: No multi-signal search
- [ ] Check: No metrics from concept-rag

**adr0005 - PDF**
- [x] FIXED: No EPUB, no OCR
- [ ] Check: No success rate from concept-rag

**adr0033 - BaseTool**
- [ ] Check: Shows 3 tools (not 8)
- [ ] Check: Code from lance-mcp tool.ts

### Phase 1: Oct 13-15, 2024 (Conceptual Search)

**adr0006-0011**
- Planning docs exist, should be accurate
- [ ] Verify metrics are from Oct 13 planning
- [ ] Check no Nov 14 architecture mentioned

### Phases 2-7

**adr0012-0032**
- Have planning docs or implementation commits
- [ ] Verify each independently

---

**Status:** Starting systematic verification

