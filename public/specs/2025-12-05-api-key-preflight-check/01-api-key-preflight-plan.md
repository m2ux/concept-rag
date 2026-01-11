# Phase 1: API Key Preflight Check

**Date:** 2025-12-05
**Priority:** HIGH (Prevents database corruption)
**Status:** ✅ Complete
**Estimated Effort:** 1h agentic + 15m review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

When the OpenRouter API key is invalid or expired, seeding scripts previously proceeded with database operations and file processing before eventually failing on LLM API calls. This resulted in:

1. **Partial database modifications** - Documents get chunked and indexed without summaries
2. **Wasted processing time** - File loading, embedding generation, and database writes occur before the API error is detected
3. **Manual recovery required** - Incomplete records need database restore to fix

This feature adds preflight validation that detects invalid keys **before** any database operations begin.

---

## Current State

### What Exists ✅
- ✅ Environment variable check for `OPENROUTER_API_KEY` presence
- ✅ Error handling in LLM API calls

### What's Missing ❌
- ❌ Validation that the API key actually works
- ❌ Early termination before database modifications

### Current Metrics (Baseline)
- 🔍 **Time to detect invalid key:** 5-30 minutes (depends on file count)
- 🔍 **Recovery effort:** Manual database restore required

---

## Implementation Tasks

### Task 1.1: Add verifyApiKey() to hybrid_fast_seed.ts ✅

**Goal:** Validate API key before database operations in main seeding script

**Implementation:**
- Added `verifyApiKey()` function using minimal chat completion request
- Uses `openai/gpt-4o-mini` with `max_tokens: 1` (minimal cost)
- On 401/403: Prints clear error and exits immediately
- On other errors: Warns but continues (may be transient)
- Called immediately after `validateArgs()`, before any file/database operations

**Deliverables:**
- `hybrid_fast_seed.ts` - `verifyApiKey()` function (~50 lines)

---

### Task 1.2: Add verifyApiKey() to populate_summaries.ts ✅

**Goal:** Validate API key in summary population script

**Implementation:**
- Same `verifyApiKey(apiKey)` function (parameterized)
- Called after API key environment check, before database connection

**Deliverables:**
- `scripts/populate_summaries.ts` - `verifyApiKey()` function

---

### Task 1.3: Add verifyApiKey() to seed_specific.ts ✅

**Goal:** Validate API key in targeted reseeding script

**Implementation:**
- Same `verifyApiKey(apiKey)` function
- Called after API key environment check, before database connection

**Deliverables:**
- `scripts/seed_specific.ts` - `verifyApiKey()` function

---

### Task 1.4: Manual Testing ✅

**Goal:** Verify preflight check catches invalid keys

**Test Results:**

```
$ OPENROUTER_API_KEY=invalid-key npx tsx hybrid_fast_seed.ts --filesdir /tmp --dbpath ./db/test

📝 Log file: .../seed-2025-12-05T07-08-36.log
📂 Database: ./db/test
🔄 Overwrite mode: false
🚀 Parallel mode: 10 workers
🔑 Verifying OpenRouter API key...

❌ API KEY VALIDATION FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Status: 401 Unauthorized
   Error: No cookie auth credentials found

   Your OpenRouter API key is invalid or expired.
   Please check your OPENROUTER_API_KEY in .envrc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exit code: 1
```

✅ Script exits immediately - no database operations attempted

---

## Success Criteria

### Functional Requirements
- [x] Scripts exit immediately on 401/403 API errors
- [x] Clear error message displayed with remediation steps
- [x] No database operations attempted before validation passes

### Performance Targets
- [x] Validation adds <2 seconds to startup time
- [x] Uses minimal API cost (1 token, cheapest model)

### Quality Requirements
- [ ] ADR written documenting the decision
- [x] All existing tests still pass

---

## Testing Strategy

### Manual Tests
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Invalid API key | Exit immediately with clear error | ✅ Pass |
| Valid API key | Proceed to normal operations | ✅ Pass |
| Network error | Warn but continue | ✅ Pass |

---

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Chat completion preflight | Validates actual auth flow | Small cost per run (~$0.0001) | **Selected** |
| /models endpoint | Free, no cost | Public endpoint, doesn't validate auth | Rejected |
| /auth/key endpoint | Direct auth check | Doesn't work with Bearer tokens | Rejected |

---

## Files Changed

**Modified:**
- `hybrid_fast_seed.ts` - Added `verifyApiKey()` function and call
- `scripts/populate_summaries.ts` - Added `verifyApiKey()` function and call
- `scripts/seed_specific.ts` - Added `verifyApiKey()` function and call

---

**Status:** ✅ COMPLETE
**Next:** Create ADR and PR




