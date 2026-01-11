# Git Commit Analysis for Inferred ADRs

**Date:** 2025-11-20  
**Purpose:** Extract precise dates and commit messages for inferred ADRs

## Key Commits Found

### Repository Clone
```
Line 1: clone: from https://github.com/m2ux/concept-rag
Timestamp: 1760347212 (October 13, 2024 UTC)
```

**Significance:** This is Mike Clay's personal fork creation date.

**Upstream Note:** The original m2ux/concept-rag was itself likely forked from lance-mcp earlier.

### Alternative Embedding Providers
```
Line 64: feat: add alternative embedding providers (OpenAI, OpenRouter, HuggingFace)
Commit: b05192e178dad86e7960b86b10699314272c8913
Timestamp: 1763206841 (November 15, 2024 UTC)
Branch: feature/alternative-embedding-providers
```

**For ADR-0024:** Precise commit date and message available

### EPUB Format Support
```
Line 66: feat: add EPUB document format support
Commit: 3ff26f4b61be602038de0d0019ff4028e6d2185a
Timestamp: 1763213413 (November 15, 2024 UTC)
Branch: feature/ebook-format-support
```

**For ADR-0026:** Precise commit date and message available

### Architecture Refactoring Commits

**Lines 29-58: Complete architecture refactoring sequence (November 14, 2024)**

Key commits:
- Line 29: feat(architecture): add domain layer directory structure
- Line 30: feat(domain): add domain models for Chunk, Concept, SearchResult
- Line 31: feat(domain): add repository interfaces for data access
- Line 35: feat(infrastructure): implement LanceDBChunkRepository with vector search
- Line 39: feat(application): add ApplicationContainer for dependency injection
- Line 46: fix(security): eliminate SQL injection risk in concept queries
- Line 49: test: add comprehensive test infrastructure with Vitest
- Line 51: feat: Extract HybridSearchService following Clean Architecture
- Line 52: feat: enable TypeScript strict mode
- Line 53: feat: add comprehensive JSDoc documentation for public APIs

**All dates: November 14, 2024**

## ADRs Needing Git Commit Updates

### Currently MEDIUM Confidence (Inferred)

1. **adr0001-0005** - Inherited from lance-mcp
   - Status: Inherited (already correctly attributed)
   - Git: Clone date October 13, 2024
   - Note: Inherited from upstream, dates are upstream's ~2024

2. **adr0014** - Multi-Pass Extraction
   - Current: Inferred from README
   - Git: Need to search for multi-pass implementation commit

3. **adr0024** - Multi-Provider Embeddings  
   - Current: Planning docs (in progress)
   - Git: Commit b05192e1 on November 15, 2024
   - Message: "feat: add alternative embedding providers (OpenAI, OpenRouter, HuggingFace)"
   - **ACTION: Update with commit reference**

4. **adr0033** - BaseTool Abstraction
   - Current: Inherited and enhanced
   - Git: Need to find initial BaseTool commit

## Timestamp Conversions

Unix timestamps to dates (UTC):
- 1760347212 = October 13, 2024 ~00:06 UTC (clone)
- 1763206841 = November 15, 2024 ~16:07 UTC (embedding providers)
- 1763213413 = November 15, 2024 ~17:56 UTC (EPUB)
- 1763119477-1763141480 = November 14, 2024 (arch refactoring)

## Chronology Correction

### Actual Timeline (from git)

**October 13, 2024:**
- Repository cloned by Mike Clay
- Inherited lance-mcp foundation

**November 9-13, 2024:**
- Concept extraction enhancements
- Model updates
- Concept definition formalized

**November 14, 2024:**
- Architecture refactoring (24 commits)
- Domain/Infrastructure/Application layers
- Repository pattern, DI container
- Testing infrastructure (Vitest)
- TypeScript strict mode
- SQL injection fix
- HybridSearchService extraction

**November 15, 2024:**
- Alternative embedding providers feature
- EPUB format support

**November 19, 2024:**
- Category system (based on planning folder date)
- Hash-based IDs

### Year Correction Needed?

**Git shows 2024, planning folders show 2025!**

This is a discrepancy. Let me check if planning folder dates are correct or if there's a year issue.

Options:
1. Git timestamps are wrong (timezone issue?)
2. Planning folders have wrong year
3. Development span 2024-2025

Most likely: Project work happened late 2024, planning folders created with 2025 dates in error, or timezone conversion issue.

**Resolution:** Use git commit dates as authoritative for actual implementation dates.

## Actions Needed

1. **Verify timestamp conversion** - Double-check date calculations
2. **Update ADR-0024** - Add git commit reference
3. **Search for multi-pass commits** - Find adr0014 implementation
4. **Search for BaseTool** - Find adr0033 initial commit
5. **Reconcile 2024/2025 discrepancy** - Determine correct year

---

**Status:** Git data found, needs parsing and integration into ADRs


