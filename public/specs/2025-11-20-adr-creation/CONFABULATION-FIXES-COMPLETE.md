# Confabulation Fixes Complete ✅

**Date:** 2025-11-20  
**Issue:** Fabricated rationales in inferred ADRs  
**Principle:** Don't guess "because" - only state what's evidenced

## ✅ Fixed ADRs (7 total)

### Removed Fabricated "because" Clauses

1. ✅ **adr0001** - TypeScript with Node.js
   - **Was:** "because it provides the best balance of..."
   - **Now:** Just states the choice (no fabricated reason)

2. ✅ **adr0002** - LanceDB
   - **Was:** "because it provides embedded local-first deployment..."
   - **Now:** Just states the choice

3. ✅ **adr0003** - MCP Protocol
   - **Was:** "because it is the emerging standard..."
   - **Now:** Just states the choice

4. ✅ **adr0004** - RAG Architecture
   - **Was:** "because it provides the best balance..."
   - **Now:** Just states the choice

5. ✅ **adr0005** - PDF Processing
   - **Was:** "because it provides pure JavaScript..."
   - **Now:** Just states the choice

6. ✅ **adr0014** - Multi-Pass Extraction
   - **Was:** "because it handles documents of any size..."
   - **Now:** Just states the choice

7. ✅ **adr0033** - BaseTool
   - **Was:** "because it provides code reuse..."
   - **Now:** Just states the choice

## ✅ Template Updated

**Added guidance:**
```
If rationale is documented (HIGH confidence): Add "because" with sources
If rationale is inferred (MEDIUM confidence): No "because" - don't confabulate!
```

## Documented ADRs (26 ADRs) - Rationales KEPT

These have explicit planning docs, so "because" clauses are evidence-based:
- adr0006-0013, 0015-0023, 0024-0032

**No changes needed** - rationales sourced from planning documents

---

## Principle Established

**For Future ADRs:**
- ✅ WITH planning docs → Include "because" with citations
- ✅ WITHOUT planning docs → State choice only, no fabrication
- ✅ Template now includes this guidance

**Status:** ✅ COMPLETE - No more confabulated rationales!


