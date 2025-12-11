# ADR-0049: Incremental Category Summary Generation

## Status

Proposed

## Context

During document seeding, the system generates LLM-powered summaries for each category extracted from documents. These summaries provide concise descriptions that help users understand what each category covers.

**Technical Forces:**
- The `createCategoriesTable()` function currently regenerates summaries for ALL categories on every seeding run
- For a typical library with ~700 categories, this requires ~24 LLM API calls (30 categories per batch)
- Each batch is rate-limited to 1 second minimum, adding ~24+ seconds to every incremental run
- The existing categories table is dropped before querying, losing all previously generated summaries

**Business Forces:**
- LLM API calls incur cost (OpenRouter billing)
- Incremental seeding should be fast when adding only a few documents
- User experience suffers when adding 5 documents takes as long as initial seeding

**Operational Forces:**
- Most incremental runs add 0-5 new categories out of hundreds existing
- Regenerating identical summaries wastes resources without providing value

## Decision Drivers

1. **Efficiency** - Avoid redundant LLM calls for unchanged data
2. **Cost reduction** - Minimize API usage when existing data is valid
3. **Speed** - Incremental runs should be proportional to new content
4. **Simplicity** - Solution should be straightforward to implement and maintain
5. **Reliability** - Must handle edge cases (first run, empty categories)

## Considered Options

### Option A: Cache Summaries Before Table Drop (Selected)

Query the existing categories table before dropping it to extract all category→summary mappings. Generate LLM summaries only for categories not found in the cache.

**Pros:**
- Simple implementation (~30 lines of code)
- Maintains existing table recreation pattern
- No schema changes required
- 90%+ reduction in LLM calls for incremental runs

**Cons:**
- Requires one additional database query per run
- Summaries are only cached in memory during the run

### Option B: Update Table In-Place

Modify existing records and only insert new categories without dropping the table.

**Pros:**
- No data loss during operation
- Could preserve additional metadata

**Cons:**
- Complex delta handling logic
- Must handle category deletions
- Risk of orphaned records
- Significant code changes

### Option C: External Summary Cache File

Persist summaries to a JSON file outside the database.

**Pros:**
- Survives database issues
- Could be version controlled

**Cons:**
- File synchronization complexity
- Additional I/O operations
- Cache invalidation challenges
- Maintenance overhead

## Decision

Implement **Option A: Cache Summaries Before Table Drop**.

The implementation will:

1. **Query existing table** - At the start of `createCategoriesTable()`, attempt to query the existing categories table and build a `Map<string, string>` of category name to summary
2. **Handle first run** - If the table doesn't exist, proceed with an empty cache (all categories are new)
3. **Identify new categories** - After extracting categories from documents, compute which are genuinely new (not in the cache)
4. **Generate selectively** - Call `generateCategorySummaries()` only for new categories
5. **Merge summaries** - Combine cached summaries with newly generated ones
6. **Build records** - Use the merged map when creating category records

## Consequences

### Positive

- **90%+ reduction in LLM calls** for typical incremental runs
- **Faster incremental seeding** - Proportional to actual new content
- **Cost savings** - Fewer API calls to OpenRouter
- **Minimal code changes** - Localized to one function
- **Backward compatible** - No schema or API changes

### Negative

- **One additional DB query** per run (negligible performance impact)
- **Memory usage** - All existing summaries held in memory during run (acceptable for ~1000 categories)

### Neutral

- First run behavior unchanged (all categories are new)
- Summary quality unchanged (same LLM, same prompts)

## Confirmation

The optimization will be validated by:

1. Running seeder with existing database containing categories
2. Adding a few new documents with 0-2 new categories
3. Observing log output to confirm only new categories trigger LLM calls
4. Verifying existing summaries are preserved in the rebuilt table

## Implementation

**Files to modify:**
- `hybrid_fast_seed.ts` - Modify `createCategoriesTable()` function

**Changes:**
1. Add query for existing category summaries before table drop
2. Filter categories to identify new ones
3. Generate summaries only for new categories
4. Merge cached and new summaries

## References

- `src/concepts/summary_generator.ts` - Summary generation implementation
- ADR-0030: Auto-Extracted Categories - Category extraction design
