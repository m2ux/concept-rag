# Source Cleanup Progress

**Date:** 2025-11-20  
**Task:** Remove ALL non-git/non-planning sources from 33 ADRs  
**Token Usage:** 425k/1M (42.5%)  
**Tokens Remaining:** 574k (57.4%)

---

## ✅ Completed Cleanup (7 ADRs)

### Inherited ADRs (6) - COMPLETE
✅ **adr0001** - TypeScript: Removed package.json, README, code files  
✅ **adr0002** - LanceDB: Removed package.json, code files, README  
✅ **adr0003** - MCP: Removed code files, config files, documentation  
✅ **adr0004** - RAG: Removed README, code files, production metrics  
✅ **adr0005** - PDF: Removed package.json, code files, npm links  
✅ **adr0033** - BaseTool: Removed code files, implementation details  

**Now contain ONLY:** Git commit 082c38e2

### Phase 1 Documented ADRs (1 partial)
✅ **adr0006** - Hybrid Search: Removed code files, README  
⏳ **adr0007** - Concept Extraction: Cleaned (just completed)  

**Contain:** Planning docs ONLY

---

## ⏳ Remaining Cleanup (26 ADRs)

### Phase 1 (4 more)
- adr0008 - WordNet
- adr0009 - Three-Table
- adr0010 - Query Expansion  
- adr0011 - Multi-Model

### Phase 2-7 (22 ADRs)
- adr0012 - OCR Fallback
- adr0013 - Incremental Seeding
- adr0014 - Multi-Pass (has git commit + planning)
- adr0015 - Formal Model
- adr0016-0023 - Architecture Refactoring (8 ADRs with planning)
- adr0024 - Embeddings (has git commit + planning)
- adr0025-0026 - Loaders/EPUB (have git commits + planning)
- adr0027-0032 - Categories/Tools (have git commits + planning)

---

## Invalid Sources Being Removed

From all ADRs, removing:
- ❌ package.json references
- ❌ tsconfig.json references
- ❌ README.md references
- ❌ CHANGELOG.md references
- ❌ Code files (src/*, test/*, scripts/*)
- ❌ Configuration files
- ❌ Documentation files (USAGE.md, FAQ.md, tool-selection-guide.md)
- ❌ npm package links
- ❌ External documentation links
- ❌ Production database stats (not from planning)
- ❌ Current code references

## Valid Sources Keeping

Keeping ONLY:
- ✅ Git commits (hash, date, message)
- ✅ Planning documents (.ai/planning/*)
- ✅ Chat histories (if any exist)

---

## Pattern for Cleanup

**Before (Invalid):**
```
## References

### Code Evidence
- Implementation: src/file.ts
- Tests: src/__tests__/file.test.ts

### Configuration
- package.json
- tsconfig.json

### Documentation
- README.md
-
