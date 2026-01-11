# Systematic Cleanup Status

**Date:** 2025-11-20  
**Status:** In Progress - Inherited ADRs Being Cleaned

---

## ✅ Completed Verification & Fixes

### adr0001 - TypeScript/Node.js ✅
**Fixed:**
- ❌ Removed: 37 tests reference (added later in concept-rag)
- ❌ Removed: EPUB reference (added later)
- ❌ Removed: Strict mode evolution (added later)
- ❌ Removed: Production metrics from concept-rag
- ✅ Shows: lance-mcp package.json versions only
- ✅ References: Upstream commit 082c38e2

### adr0002 - LanceDB ✅  
**Fixed:**
- ❌ Removed: 3-table schema with concepts (added in concept-rag Oct 13)
- ❌ Removed: concept_ids, category_ids fields (added Nov 18-19)
- ❌ Removed: 165 docs, 37K concepts metrics (concept-rag)
- ❌ Removed: 324MB/699MB/54% reduction (concept-rag Nov 19)
- ✅ Shows: Simple 2-table schema (catalog, chunks)
- ✅ Shows: pageContent, vector, metadata structure
- ✅ Code from: lance-mcp src/seed.ts

### adr0003 - MCP Protocol ✅
**Fixed:**
- ❌ Removed: "grew from 2 to 8 tools" (future looking)
- ❌ Removed: concept_search, category_search references (added later)
- ❌ Removed: "8 tools total" (lance-mcp had 3)
- ✅ Shows: 3 tools (catalog_search, chunks_search, all_chunks_search)
- ✅ Code from: lance-mcp README and src/

### adr0004 - RAG Architecture ✅
**Fixed:**
- ❌ Removed: PDF/EPUB (EPUB added Nov 15)
- ❌ Removed: Concept extraction (added Oct 13)
- ❌ Removed: Concepts table (added Oct 13)
- ❌ Removed: Multi-signal search (added Oct 13)
- ❌ Removed: Claude/Grok models (added Oct 13)
- ❌ Removed: WordNet (added Oct 13)
- ❌ Removed: 165 docs, 37K concepts (concept-rag metrics)
- ✅ Shows: Simple PDF → Ollama summary → chunks → Ollama embeddings
- ✅ Shows: 2 tables only (catalog, chunks)
- ✅ Shows: Local Ollama models (zero cost)

### adr0005 - PDF Processing  
**Fixed:**
- ❌ Removed: EPUB references (added Nov 15)
- ❌ Removed: OCR evolution timeline (added Oct 21)
- ❌ Removed: 95% success rate (concept-rag metric)
- ✅ Shows: Simple pdf-parse with PDFLoader
- ✅ Code from: lance-mcp src/seed.ts

## ⏳ Remaining Verification

### adr0033 - BaseTool
- [ ] Check tool count (should be 3, not 8)
- [ ] Verify code matches lance-mcp tool.ts

### Phase 1 ADRs (0006-0011) - Oct 13, 2024
These have planning docs, should be accurate, but need to verify:
- [ ] No Nov 14 architecture mentions
- [ ] No Nov 19 category mentions
- [ ] Metrics from Oct 13 planning only

### Phases 2-7 ADRs (0012-0032)
Should be accurate (have planning docs/commits), verify:
- [ ] Code matches commits
- [ ] No future references
- [ ] Metrics contemporaneous

---

## Principles Applied

1. **No Confabulation**: Removed fabricated "because" clauses
2. **No Future Looking**: Removed "later", "evolved to", "current"
3. **Code at Commit**: Schema/code matches state at decision time
4. **Metrics at Time**: Only metrics available at decision time
5. **Tool Count at Time**: Show tool count that existed then

---

**Status:** 5/6 inherited ADRs cleaned, continuing systematic verification

