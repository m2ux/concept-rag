# 45. API Key Preflight Check

**Date:** 2025-12-05
**Status:** Accepted

**Sources:**
- Work Package Plan: [2025-12-05-api-key-preflight-check](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-12-05-api-key-preflight-check/)

## Context and Problem Statement

Seeding scripts (`hybrid_fast_seed.ts`, `populate_summaries.ts`, `seed_specific.ts`) use the OpenRouter API for document summarization and concept extraction. When an invalid or expired API key is provided, the scripts previously:

1. Proceeded with file loading and document chunking
2. Connected to the database and began write operations
3. Failed mid-process when the first LLM API call was attempted
4. Left the database in an inconsistent state (documents indexed without summaries)

This required manual database restoration from backups to recover.

**Decision Drivers:**
* Database integrity - partial seeding corrupts data state
* Developer experience - unclear error messages and wasted processing time
* Recovery effort - manual intervention required after failed runs

## Alternative Options

* **Option 1: Chat completion preflight** - Make a minimal API call to validate the key works
* **Option 2: /models endpoint check** - Check if the models endpoint responds
* **Option 3: /auth/key endpoint** - Use OpenRouter's auth validation endpoint

## Decision Outcome

**Chosen option:** "Option 1: Chat completion preflight", because it validates the actual authentication flow that seeding will use.

### Implementation

Added `verifyApiKey()` function that:
- Sends a 1-token request to `openai/gpt-4o-mini` (cheapest model, ~$0.0001/call)
- On 401/403: Prints clear error message and exits immediately
- On other errors (rate limit, network): Warns but continues (may be transient)
- On success: Prints confirmation and proceeds

Called immediately after argument validation, before any file scanning or database operations.

### Consequences

**Positive:**
* Invalid keys detected in <2 seconds instead of 5-30 minutes
* No database operations attempted before validation passes
* Clear error messages with remediation instructions
* Fail-fast behavior prevents wasted processing

**Negative:**
* Small API cost per run (~$0.0001 for validation request)
* Adds ~1-2 seconds to startup time

### Confirmation

- ✅ **Tests:** Manual testing with invalid key confirms immediate exit
- ✅ **Build:** Zero errors

**Files Modified:**
1. `hybrid_fast_seed.ts` - Added `verifyApiKey()` function and call
2. `scripts/populate_summaries.ts` - Added `verifyApiKey()` function and call  
3. `scripts/seed_specific.ts` - Added `verifyApiKey()` function and call

## Pros and Cons of the Options

### Option 1: Chat completion preflight - Chosen

**Pros:**
- Validates the exact authentication flow used by seeding
- Confirms API key has permission to make completions
- Minimal cost (~$0.0001 per validation)

**Cons:**
- Small cost per run
- Slightly increases startup time

### Option 2: /models endpoint check

**Pros:**
- Free (no API cost)
- Fast

**Cons:**
- `/models` endpoint is public and doesn't require authentication
- Would not catch invalid keys (tested and confirmed)

### Option 3: /auth/key endpoint

**Pros:**
- Direct authentication validation
- No completion cost

**Cons:**
- Requires cookie authentication, doesn't work with Bearer tokens
- Returns 401 even for valid API keys when using Authorization header
