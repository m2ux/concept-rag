# Concept Search TRIZ Analysis and Fix

**Date**: November 13, 2025  
**Issue**: TRIZ books with "innovation" in titles not appearing in innovation concept search

## Problem Discovery

### Initial Query
User searched for the concept "innovation" using `concept_search` and found:
- 20 chunks across 2 books
- **0 chunks from TRIZ books** (despite 4+ TRIZ books in collection)

### Investigation Findings

#### Database Health
- **Total chunks**: 211,339
- **Chunks WITH concepts**: 128,766 (60.9%)
- **Chunks WITHOUT concepts**: 82,573 (39.1%)

#### TRIZ Books Status
**3 TRIZ books with 4,088 chunks:**

1. **TRIZICS** (Gordon Cameron) - "teach yourself TRIZ, how to invent, **innovate**..."
   - Chunks: ~1,360
   - Concept coverage: **29.5%** ⚠️
   - "innovation" in extracted concepts: **NO** ❌

2. **The innovation algorithm** (Genrich Altshuller) - Title contains "**innovation**"
   - Chunks: ~1,364  
   - Concept coverage: **29.5%** ⚠️
   - "innovation" in extracted concepts: **NO** ❌

3. **TRIZ: Theory of Inventive Problem Solving Level 1** (Vladimir Petrov)
   - Chunks: ~1,364
   - Concept coverage: **29.5%** ⚠️
   - "innovation" in extracted concepts: Only "materials innovation", "innovation metrics"

**TRIZ Overall**: 70.5% of chunks have NO concept tags (vs. 39.1% database average)

### Root Cause

The **concept extraction prompt** was too restrictive:

```typescript
EXCLUDE:
❌ Generic single words (e.g., "power", "riches", "time", "people")
```

**Impact**: The LLM interpreted important thematic concepts like "innovation", "creativity", "invention" as "generic single words" and excluded them from extraction.

#### Evidence
- Book titled "**The innovation algorithm**" → No "innovation" concept extracted
- Book about "how to invent, **innovate**" → No "innovation" concept extracted  
- 236 concepts extracted from TRIZICS, but missed the core theme
- 248 concepts extracted from Altshuller's book, but missed the title concept

### Cascading Failure
1. Document-level concept extraction incomplete
2. Chunks can't be enriched with missing concepts  
3. Concept search can't find relevant content
4. User gets 0 results from highly relevant books

## Solution Applied

### Code Changes

**File**: `src/concepts/concept_extractor.ts`

**Changed Prompt 1** (lines 119-130):
```diff
  EXCLUDE:
  ❌ Temporal descriptions (e.g., "periods of heavy recruitment")
  ❌ Specific action phrases (e.g., "balancing cohesion with innovation")
  ❌ Suppositions (e.g., "attraction for collaborators")
- ❌ Generic single words (e.g., "power", "riches", "time", "people")
  ❌ Names, dates, metadata

  INCLUDE:
- ✅ Domain terms (e.g., "speciation", "exaptive bootstrapping")
+ ✅ Domain terms (e.g., "speciation", "exaptive bootstrapping", "innovation")
  ✅ Theories, methodologies, processes, phenomena
  ✅ Multi-word concepts
+ ✅ Important single-word thematic concepts (e.g., "creativity", "innovation", "emergence")
```

**Changed Prompt 2** (lines 298-311):
```diff
  IMPORTANT - Extract ONLY reusable concepts, theories, and domain knowledge. DO NOT extract:
  ❌ Temporal/situational descriptions (e.g., "periods of heavy recruitment", "times of crisis", "early adoption phase")
  ❌ Overly specific action phrases (e.g., "balancing broad cohesion with innovation", "managing diverse stakeholders")
  ❌ Suppositions or observations (e.g., "attraction for potential collaborators", "tendency toward cooperation")
- ❌ Generic common single words (e.g., "power", "riches", "time", "space", "people", "work", "money")
  ❌ Names of people, organizations, places, publications
  ❌ Dates, page numbers, metadata

  ✅ DO extract:
  - Core theories (e.g., "complexity theory", "game theory", "field theory")
  - Methodologies (e.g., "agent-based modeling", "regression analysis", "ethnography")
  - Domain-specific technical terms (e.g., "speciation", "exaptive bootstrapping", "allometric scaling")
  - Multi-word conceptual phrases (e.g., "strategic thinking", "social change", "network formation")
  - Processes and phenomena (e.g., "urban scaling", "emergence", "path dependence")
+ - Important single-word thematic concepts (e.g., "innovation", "creativity", "sustainability", "resilience")
```

### Build Status
✅ TypeScript compiled successfully  
✅ No linter errors

## Next Steps

### Option 1: Re-extract TRIZ Books (Recommended)
Run the repair script to re-extract concepts from TRIZ books:

```bash
cd .
npx tsx scripts/repair_missing_concepts.ts --min-concepts 10
```

**Cost**: Requires OpenRouter API calls (3 books × concept extraction)  
**Benefit**: Complete fix with comprehensive concepts

### Option 2: Re-enrich Existing Chunks
If you manually add "innovation" to catalog entries, propagate to chunks:

```bash
npx tsx scripts/reenrich_chunks_with_concepts.ts
```

**Cost**: No API calls (uses existing catalog concepts)  
**Benefit**: Fast, but won't add "innovation" unless catalog is patched first

### Option 3: Full Re-extraction (Comprehensive)
Re-extract ALL documents to capture previously missed thematic concepts:

```bash
# This would require rebuilding the entire database
npm run seed -- --dir ~/Documents/ebooks
```

**Cost**: Expensive (122 documents × API calls)  
**Benefit**: Fixes the issue system-wide, not just TRIZ books

## Recommendations

1. **Immediate**: Run repair script on TRIZ books (Option 1)
2. **Short term**: Monitor concept extraction quality on future documents
3. **Long term**: Consider periodic re-extraction as prompts are refined

## Lessons Learned

### Prompt Design Trade-offs
- **Too restrictive**: Misses important single-word concepts like "innovation"
- **Too permissive**: May extract non-reusable terms like "time", "people"
- **Solution**: Explicitly include "important single-word thematic concepts" category

### Quality Assurance
- Concept extraction quality directly impacts search effectiveness
- Document title words should be strong signals (book titled "innovation algorithm" should extract "innovation")
- Need QA checks: "Does book about X extract concept X?"

### System Architecture
- Cascading dependencies: Bad extraction → bad chunk tagging → failed search
- Health check script was useful for diagnosis
- Repair scripts provide recovery path without full rebuild

## Related Scripts

- **Health Check**: `scripts/check_database_health.ts`
- **TRIZ Analysis**: `scripts/check_triz_concepts.ts` 
- **Catalog Check**: `scripts/check_triz_catalog.ts`
- **Repair**: `scripts/repair_missing_concepts.ts`
- **Re-enrich**: `scripts/reenrich_chunks_with_concepts.ts`

## Files Modified

- `src/concepts/concept_extractor.ts` - Removed generic single word constraint

## Files Created (Analysis)

- `scripts/check_triz_concepts.ts` - TRIZ chunk analysis
- `scripts/check_triz_catalog.ts` - TRIZ catalog analysis
- `.engineering/artifacts/planning/concept-search-triz-analysis.md` - This document

