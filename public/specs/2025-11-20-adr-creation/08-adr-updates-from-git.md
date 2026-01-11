# ADR Updates from Git Commit History

**Date:** 2025-11-20  
**Purpose:** Update inferred ADRs with precise git commit information

## Git Commits Identified

### 1. Alternative Embedding Providers (ADR-0024)

**Commit Found:**
```
Commit: b05192e178dad86e7960b86b10699314272c8913
Message: "feat: add alternative embedding providers (OpenAI, OpenRouter, HuggingFace)"
Branch: feature/alternative-embedding-providers
Author: Mike Clay
Git Log Line 64
```

**Current ADR Status:** MEDIUM (Planned but implementation in progress)

**UPDATE NEEDED:**
- Add commit reference to ADR-0024
- Note: Implementation was completed (commit exists)
- Update status if needed

### 2. EPUB Format Support (ADR-0026)

**Commit Found:**
```
Commit: 3ff26f4b61be602038de0d0019ff4028e6d2185a
Message: "feat: add EPUB document format support"
Branch: feature/ebook-format-support
Author: Mike Clay
Git Log Line 66
```

**Current ADR Status:** HIGH (Has planning docs + implementation)

**UPDATE:**
- Add commit reference to References section
- Confirms implementation date

### 3. Multi-Pass Extraction (ADR-0014)

**Code Found:**
```
File: src/concepts/concept_extractor.ts
Lines: 61-74
Feature: Multi-pass extraction for documents >100k tokens
```

**Potential Commit:**
```
Commit: 82212a34ccbcea86a42a87535cb8c63315769165
Message: "model and concept extraction update"
Git Log Line 10
```

**Current ADR Status:** MEDIUM (Inferred from README)

**UPDATE NEEDED:**
- Add code reference (concept_extractor.ts lines 61-74)
- Add potential commit reference
- Increase confidence to MEDIUM-HIGH

### 4. BaseTool Abstraction (ADR-0033)

**Code Location:**
```
File: src/tools/base/tool.ts (69 lines)
```

**Status:** Inherited from lance-mcp, enhanced in concept-rag

**UPDATE NEEDED:**
- Search for BaseTool modifications
- Document evolution timeline

## Date Reconciliation Note

**Observation:** Git log timestamps vs. planning folder dates

**Planning Folders:** 2025-10-13, 2025-11-14, 2025-11-15, 2025-11-19  
**Git Timestamps:** Need proper conversion (Unix timestamps)

**Resolution Strategy:**
- Use planning folder dates where explicit planning exists (HIGH confidence)
- Use git commits for inferred decisions (adds evidence)
- Note both in ADRs where applicable

## Updates To Apply

### High Priority (Clear Commits Found)

1. **adr0024-multi-provider-embeddings.md**
   - Add Git Commit section to References
   - Commit: b05192e178dad86e7960b86b10699314272c8913
   - Message: "feat: add alternative embedding providers"
   - Update confidence to HIGH (has commit + planning + code)

2. **adr0026-epub-format-support.md**
   - Add Git Commit section to References  
   - Commit: 3ff26f4b61be602038de0d0019ff4028e6d2185a
   - Message: "feat: add EPUB document format support"
   - Already HIGH, adds commit evidence

### Medium Priority (Code Found, Commit Inferred)

3. **adr0014-multi-pass-extraction.md**
   - Add Code Evidence section
   - Reference: concept_extractor.ts lines 61-74
   - Potential commit: 82212a34cc (model and concept extraction update)
   - Upgrade confidence: MEDIUM → MEDIUM-HIGH

4. **adr0033-basetool-abstraction.md**
   - Already notes inherited + enhanced
   - Code reference: src/tools/base/tool.ts (69 lines)
   - Status appropriate (inherited pattern)

---

**Status:** Analysis complete, ready to apply updates


