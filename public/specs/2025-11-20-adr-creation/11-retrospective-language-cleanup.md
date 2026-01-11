# Retrospective Language Cleanup Strategy

**Date:** 2025-11-20  
**Issue:** 28 ADRs contain retrospective language or future references  
**Principle:** ADRs must be written AS IF at time of decision

## Types of Retrospective Language to Remove

### 1. "Later" references
- "Later Enhanced in concept-rag"
- "Later evolution"
- "Later formalized"
- "Later optimized"

**Fix:** Remove entirely or move to separate "Related Decisions" section

### 2. "Current" / "Before/After" comparisons
- "Current (Post-refactoring):"
- "Initial (Pre-refactoring):"
- "Before/After" code blocks

**Fix:** Show only the code AT THAT TIME

### 3. Future tense
- "will be added"
- "becomes"
- "evolved to"

**Fix:** Present tense only

### 4. Migration/Evolution sections
- "Migration Path"
- "Evolution Timeline"  
- "Future Enhancements"

**Fix:** Remove or move to "Related Decisions"

## High Priority Fixes (Code Blocks Affected)

1. **adr0002** - Shows concepts table that didn't exist ✅ FIXED
2. **adr0005** - Refers to "later OCR" 
3. **adr0016** - Shows "before/after" architecture
4. **adr0021** - Shows "before/after" performance code

## Strategy

**Option A:** Fix all 28 files (massive effort, ~4-6 hours)
**Option B:** Fix high-priority code blocks, document guideline for future
**Option C:** Add note that ADRs written retrospectively, guideline for future

**Recommendation:** Option B - Fix code blocks that show wrong schema/code, document guideline

## Files to Fix (Priority Order)

**Priority 1 - Wrong Code/Schema:**
1. adr0002 - Schema (✅ partially fixed, check remaining)
2. adr0005 - PDF processing evolution
3. adr0016 - Architecture comparison
4. adr0021 - Performance before/after

**Priority 2 - Evolution Sections:**
5. adr0001 - "Later evolution" note
6. adr0003 - Tool evolution timeline
7. adr0033 - Evolution timeline

**Priority 3 - "Later" references in prose:**
8-28. Various ADRs with "later added" prose

## Recommended Action

1. Fix Priority 1 ADRs (code accuracy)
2. Add guideline to template
3. Document that existing ADRs may have retrospective elements
4. Future ADRs follow strict present-tense rule

---

**Decision:** Focus on code accuracy, document guideline for future

