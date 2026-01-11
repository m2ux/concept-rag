# AIL Test Investigation Findings

**Date:** 2025-12-28  
**Issue:** #49 - Agent-in-the-Loop E2E Testing  
**Status:** Investigation Complete - Improvements Implemented

## Executive Summary

The AIL testing framework is functioning correctly and has successfully identified multiple categories of issues across all three test tiers:

1. **Data integrity issues** (resolved)
2. **Tool description issues** (resolved - category tools enhanced)
3. **Agent efficiency issues** (legitimate finding - ongoing)
4. **Agent answer synthesis issues** (legitimate finding - ongoing)
5. **Configuration issues** (resolved - centralized config)

## Latest Test Results

### Model Comparison: Claude Sonnet 4 vs Claude Haiku 4.5

| Metric | Claude Sonnet 4 | Claude Haiku 4.5 |
|--------|-----------------|------------------|
| **Tier 1 Pass Rate** | 0% (0/3) | 0% (0/3) |
| **Tier 2 Pass Rate** | 33.3% (1/3) | 33.3% (1/3) |
| **Tier 3 Pass Rate** | 33.3% (1/3) | 33.3% (1/3) |
| **Tier 1 Avg Tool Calls** | 8.3 | 9.7 |
| **Tier 2 Avg Tool Calls** | 3.7 | 7.0 |
| **Tier 3 Avg Tool Calls** | 8.3 | 7.3 |
| **Total Duration** | 423s | 386s |
| **Relative Cost** | 1x | ~12x cheaper |

**Observation:** Both models achieve identical pass rates. Haiku is faster and cheaper but less efficient (more tool calls).

### Tier 1: Single-Document Retrieval (Haiku 4.5)

| Test Scenario | Status | Tool Calls | Issue |
|---------------|--------|------------|-------|
| Art of War formations | ❌ FAILED | 11 | Agent loops without synthesizing |
| Clean Architecture dependency rule | ❌ FAILED | 11 | Agent loops without synthesizing |
| Art of War supreme excellence | ❌ FAILED | 10 | Efficiency (too many calls) |

**Pass Rate:** 0/3 (0%) - Target: >90%

### Tier 2: Cross-Document Synthesis (Haiku 4.5)

| Test Scenario | Status | Tool Calls | Issue |
|---------------|--------|------------|-------|
| Design patterns sources | ✅ PASSED | 2 | - |
| Architecture themes | ❌ FAILED | 11 | Efficiency (>8 calls) |
| Category exploration | ❌ FAILED | 0 | No tool calls made |

**Pass Rate:** 1/3 (33.3%) - Target: >75%

### Tier 3: Complex Research Tasks (Haiku 4.5)

| Test Scenario | Status | Tool Calls | Issue |
|---------------|--------|------------|-------|
| Cross-domain (Art of War + Software) | ❌ FAILED | 15 | Efficiency (>12 calls) |
| Dependency inversion deep dive | ✅ PASSED | 9 | Used source_concepts correctly! |
| Domain concepts via categories | ✅ PASSED* | 5 | Used category tools correctly |

*Passed in individual test, failed in aggregate run

**Pass Rate:** 1/3 (33.3%) - Target: >60%

## Improvements Implemented

### 1. Tool Description Enhancements (COMPLETED)

Enhanced descriptions for 3 category tools that were missing guidance:

| Tool | Before | After |
|------|--------|-------|
| `list_categories` | 95 chars | 1,173 chars |
| `category_search` | 121 chars | 1,192 chars |
| `list_concepts_in_category` | 117 chars | 1,266 chars |

**Pattern Applied:**
- Added "USE THIS TOOL WHEN" sections
- Added "DO NOT USE for" sections  
- Added "RETURNS" sections
- Added "COMMON WORKFLOW" guidance

**Impact:** When agent decides to use category tools, it now uses them correctly:
```
tier3-domain-concepts:
  Tools: [list_categories, list_concepts_in_category, list_concepts_in_category, 
          category_search, category_search]
  Result: ✅ PASSED
```

### 2. Configuration Centralization (COMPLETED)

Created `src/__tests__/ail/config.ts` with environment variable overrides:

| Setting | Environment Variable | Default |
|---------|---------------------|---------|
| Model | `AIL_MODEL` | `anthropic/claude-haiku-4.5` |
| Eval Model | `AIL_EVAL_MODEL` | `anthropic/claude-haiku-4.5` |
| API Key | `OPENROUTER_API_KEY` | (required) |
| Database | `AIL_TEST_DB` | `./db/test` |
| Temperature | `AIL_TEMPERATURE` | `0.1` |
| Max Tokens | `AIL_MAX_TOKENS` | `4096` |
| Max Iterations | `AIL_MAX_ITERATIONS` | `10` |
| Timeout | `AIL_TIMEOUT_MS` | `60000` |
| Verbose | `AIL_VERBOSE` | `false` |

### 3. Data Integrity Issue (RESOLVED)

**Problem:** The PDF file for "Clean Architecture" contained wrong content.

| Property | Expected | Actual (Before Fix) |
|----------|----------|---------------------|
| Title | Clean Architecture | A Philosophy of Software Design |
| Author | Robert C. Martin | John Ousterhout |

**Resolution:** User replaced PDF, database reseeded.

## Remaining Issues

### 1. Agent Answer Synthesis (OPEN)

**Finding:** Agent finds relevant data but fails to synthesize it into an answer.

**Examples:**
```
Clean Architecture: "Let me search more specifically for the Dependency Rule definition:..."
Art of War Quote: "Let me try searching for the specific text that I found earlier..."
```

**Root Cause:** Agent reports search status instead of formulating answers.

### 2. Agent Efficiency (OPEN)

**Finding:** Agent frequently exceeds tool call limits.

| Tier | Expected Max | Actual Avg |
|------|--------------|------------|
| Tier 1 | 5 | 9.7 |
| Tier 2 | 8 | 7.0 |
| Tier 3 | 12 | 7.3 |

### 3. Category Exploration Trigger (OPEN)

**Finding:** Agent doesn't use `list_categories` unless explicitly prompted.

| Test | Goal Wording | Tool Calls |
|------|--------------|------------|
| tier2-category-exploration | "What categories do I have?" | 0 |
| tier3-domain-concepts | "Use the category tools to explore" | 5 ✅ |

**Root Cause:** Agent needs explicit tool mention to trigger category exploration.

## Verified Working

### Search Infrastructure

All 10 MCP tools function correctly when called:

| Tool | Status | Notes |
|------|--------|-------|
| catalog_search | ✅ | Returns relevant documents |
| chunks_search | ✅ | Returns relevant chunks |
| broad_chunks_search | ✅ | Cross-document search works |
| concept_search | ✅ | Concept-based retrieval works |
| source_concepts | ✅ | Now used correctly in tier3 |
| concept_sources | ✅ | Working |
| extract_concepts | ✅ | Working |
| list_categories | ✅ | Returns category list |
| list_concepts_in_category | ✅ | Returns concepts |
| category_search | ✅ | Returns documents in category |

### Tool Descriptions

All 10 tools now have consistent guidance patterns:
- USE THIS TOOL WHEN: 10/10 ✅
- DO NOT USE for: 10/10 ✅
- RETURNS: 10/10 ✅

## Recommendations

### Completed

1. ✅ Fix Clean Architecture PDF file
2. ✅ Reseed test database
3. ✅ Enhance category tool descriptions
4. ✅ Centralize AIL configuration
5. ✅ Test with multiple models

### Next Steps

1. **Agent System Prompt Improvements**
   - Add explicit answer synthesis instructions
   - Include "stop searching when you have enough data" guidance
   - Consider embedding tool selection guide in system prompt

2. **Skills Interface (Issue #56)**
   - Investigate bundling related tools into higher-level "skills"
   - May reduce tool selection complexity for agents

3. **Efficiency Improvements**
   - Add heuristics to recognize sufficient data
   - Consider response caching within sessions

## Technical Details

### Test Configuration

```bash
# Run with default model (Haiku 4.5)
OPENROUTER_API_KEY=sk-... npm test -- --run src/__tests__/ail/

# Run with Sonnet 4
AIL_MODEL="anthropic/claude-sonnet-4" OPENROUTER_API_KEY=sk-... npm test

# Run with verbose output
AIL_VERBOSE=true OPENROUTER_API_KEY=sk-... npm test -- --run src/__tests__/ail/
```

### Database

- **Test DB:** `db/test` (correct schema with `is_meta_content`)
- **Documents:** 23 (after reseed with fixed Clean Architecture)
- **Override:** `AIL_TEST_DB` env variable available

## Conclusion

The AIL testing framework is working as designed and provides valuable signal:

1. **Tool descriptions matter** - Enhanced category tool descriptions led to correct usage
2. **Model choice affects efficiency** - Haiku uses more calls but costs less
3. **Agent synthesis is the primary blocker** - Finds data but doesn't formulate answers
4. **Infrastructure is solid** - All search tools work correctly when called

The framework successfully identifies areas for improvement and validates fixes.

---

*Report generated as part of Issue #49 - Agent-in-the-Loop E2E Testing*  
*Last updated: 2025-12-28*
