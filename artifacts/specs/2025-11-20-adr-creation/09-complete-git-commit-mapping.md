# Complete Git Commit Mapping for All ADRs

**Date:** 2025-11-20  
**Purpose:** Map ALL ADRs to specific git commits

## Timestamp Conversion

Unix timestamp → Date:
- 1760347212 = **October 13, 2024** (clone from m2ux/concept-rag)
- 1763121XXX = **November 14, 2024** (architecture refactoring series)
- 1763206841 = **November 15, 2024** (embedding providers)
- 1763213413 = **November 15, 2024** (EPUB)
- 1763575852 = **November 18, 2024** (integer IDs)
- 1763632758 = **November 19, 2024** (category infrastructure)

## Git Commits by ADR

### ADRs 0001-0005: Inherited from Upstream

**Clone Commit:**
```
Line 1: clone: from https://github.com/m2ux/concept-rag
Commit: Initial (56cf4a47d49d60c523534e2a8449ab9f6375e53b)
Date: October 13, 2024
```

**Status:** These existed in cloned repository (inherited from lance-mcp → m2ux fork → Mike's fork)

**Update:** Add note about clone date and initial commit hash

### ADR 0014: Multi-Pass Extraction

**Potential Commit:**
```
Line 10: commit: model and concept extraction update
Commit: 82212a34ccbcea86a42a87535cb8c63315769165
Date: October 15, 2024
```
**Status:** ✅ ALREADY UPDATED

### ADR 0024: Multi-Provider Embeddings

**Commit:**
```
Line 64: commit: feat: add alternative embedding providers (OpenAI, OpenRouter, HuggingFace)
Commit: b05192e178dad86e7960b86b10699314272c8913
Date: November 15, 2024
```
**Status:** ✅ ALREADY UPDATED

### ADR 0026: EPUB Support

**Commit:**
```
Line 66: commit: feat: add EPUB document format support
Commit: 3ff26f4b61be602038de0d0019ff4028e6d2185a
Date: November 15, 2024
```
**Status:** ✅ ALREADY UPDATED

### ADR 0027: Hash-Based IDs

**Commits Found:**
```
Line 109: commit: feat: add integer ID fields to database schema
Commit: 3f982223203cb0875b43a903c1cc0235f64aa7d0
Date: November 18, 2024

Line 110: commit: feat: implement ConceptIdCache for fast ID↔name resolution
Commit: 604738ada93979e5e99cee958495c22a43787a03
Date: November 18, 2024
```
**Status:** ⚠️ NEEDS UPDATE

### ADR 0028-0030: Category System

**Commits Found:**
```
Line 103: commit: feat: add category_search tool
Commit: d4ce00a4e6417a1d966eb97f624175cf6800baa3
Date: November 18, 2024

Line 118: commit: feat: implement category search infrastructure with hash-based IDs
Commit: 3a59541d3ae93ec7e4055fe17b17eef6752f1d42
Date: November 19, 2024

Line 119: commit: feat: update ingestion pipeline for category search with hash-based IDs
Commit: 55ccee3c07e9a72c36a7b9330e3d899c426b6804
Date: November 19, 2024

Line 121: commit: fix: improve category extraction from concepts structure
Commit: 449e52bb75cdbc8f65d381bc8e3bf7d6745169da
Date: November 19, 2024

Line 128: commit: feat: complete category search migration - main database updated
Commit: ab02832e127d5a47e58d638695e63615b1550dd7
Date: November 19, 2024
```
**Status:** ⚠️ NEEDS UPDATE (add git evidence to all 4 category ADRs)

### ADR 0033: BaseTool Abstraction

**Evidence:**
```
Line 1: clone: (contains BaseTool in src/tools/base/tool.ts)
```
**Status:** Inherited from upstream, present in initial clone

**Update:** Add clone commit reference showing it existed at fork time

## Updates Required

### High Priority: Add Git Commits

1. **adr0001-0005**: Add initial clone commit reference
2. **adr0027**: Add integer ID commits (lines 109-110)
3. **adr0028**: Add category infrastructure commit (line 118)
4. **adr0029**: Add category tools commit (line 103)
5. **adr0030**: Add category extraction commits (lines 119, 121)
6. **adr0033**: Add clone reference (BaseTool existed in initial clone)

---

**Next Action:** Update all 7 ADRs with git commit references


