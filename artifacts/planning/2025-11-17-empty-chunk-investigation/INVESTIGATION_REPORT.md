# Investigation Report: Empty Chunk Results for Concept Search

**Date**: 2025-11-17  
**Issue**: Concept search returns 0 results despite showing chunk_count > 0  
**Test Case**: Searching for concept "exaptive bootstrapping"  
**Status**: 🔴 **ROOT CAUSE IDENTIFIED**

---

## Executive Summary

The concept search tool reports that "exaptive bootstrapping" exists in 9 chunks across 1 document, but when searching for this concept, it returns **0 results**. 

**Root Cause**: The vector search algorithm used in `findByConceptName()` relies on semantic similarity between concept embeddings and chunk embeddings. However, concept embeddings (created from short phrases like "exaptive bootstrapping") are not semantically similar enough to chunk embeddings (created from full paragraphs) to retrieve the relevant chunks.

**Impact**: This affects ALL concept searches in the system, not just "exaptive bootstrapping". The severity depends on how semantically distant the concept name is from the chunk content.

---

## Investigation Steps

### Step 1: Verify Concept Existence

✅ **Confirmed**: Concept exists in concepts table
- concept: `exaptive bootstrapping`
- chunk_count: `9`
- sources: 1 document (Complexity Perspectives in Innovation and Social Change)
- category: `complex systems science`
- Has valid 384D embedding vector

### Step 2: Verify Chunk Existence

✅ **Confirmed**: Chunks exist for the source document
- Total chunks in database: **270,205**
- Chunks from source document: **3,287**
- Chunks containing "exaptive" or "bootstrapping" in text: **26**

### Step 3: Verify Chunk Enrichment

✅ **Confirmed**: Chunks ARE properly enriched with the concept
- Chunks with "exaptive bootstrapping" in concepts field: **9**
- Example concepts found in chunks:
  - `"exaptive bootstrapping"`
  - `"bootstrapping strategy"`
  - `"agent-artifact space"`
  - `"innovation"`

### Step 4: Test Search Algorithm

❌ **FAILED**: Vector search does not return the enriched chunks

#### Vector Search Results:
Using the concept's embedding for vector search returned 20 candidates:
- **0 chunks** from the target document (Complexity Perspectives...)
- **20 chunks** from unrelated documents (TypeScript, SQL, Blockchain books)
- **0 matches** after filtering with `chunkContainsConcept()`

#### Manual Verification:
Loading all 270,205 chunks and checking directly:
- **9 chunks** correctly contain "exaptive bootstrapping" in their concepts field
- These chunks have IDs: 50703, 50704, 50710, etc.
- **But none of these chunks were returned by the vector search!**

---

## Root Cause Analysis

### Current Algorithm (in `LanceDBChunkRepository.findByConceptName()`)

```typescript
async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
  // 1. Get concept record with its embedding
  const conceptRecord = await this.conceptRepo.findByName(conceptLower);
  
  // 2. Use concept embedding for vector search
  const candidates = await this.chunksTable
    .vectorSearch(conceptRecord.embeddings)  // ⚠️ PROBLEM HERE
    .limit(limit * 3)
    .toArray();
  
  // 3. Filter to chunks that actually contain the concept
  const matches = candidates.filter(chunk => 
    this.chunkContainsConcept(chunk, conceptLower)
  );
  
  return matches;
}
```

### Why This Fails

#### Problem: Semantic Mismatch Between Embeddings

1. **Concept Embeddings**:
   - Created from SHORT PHRASES: `"exaptive bootstrapping"`
   - Represents the abstract meaning of the concept name
   - 384-dimensional vector in semantic space

2. **Chunk Embeddings**:
   - Created from FULL PARAGRAPHS (100-500 words)
   - Represents the contextual meaning of the entire paragraph
   - 384-dimensional vector in semantic space

3. **Vector Search Behavior**:
   - Searches for chunks with SIMILAR embeddings
   - Similarity = cosine distance in vector space
   - **A paragraph ABOUT "exaptive bootstrapping" is not semantically similar to the PHRASE "exaptive bootstrapping"**

#### Example from Investigation

**Concept embedding for**: `"exaptive bootstrapping"`

**Expected to match**: Chunk about complex systems innovation containing:
> "This dynamic, which we call exaptive bootstrapping, has generated the proliferation of artifacts..."

**Actually matches**: Completely unrelated chunks:
- TypeScript documentation about "bootstrapping" (Angular, Vue)
- SQL code with no relation to the concept
- Blockchain chapters

**Why?** The vector search found chunks whose embeddings happened to be close to "exaptive bootstrapping" in vector space, but for **wrong reasons** (accidental semantic similarity, not actual content).

---

## Impact Assessment

### Severity: **HIGH** 🔴

This is a **fundamental architectural flaw** in the concept search algorithm.

### Affected Functionality

1. **`concept_search` MCP tool**: Returns 0 or wrong results
2. **Concept-based navigation**: Users cannot find chunks by concept
3. **Related concepts feature**: May recommend unrelated concepts
4. **Concept density ranking**: Unreliable since searches fail

### Scope

- Affects **ALL concepts** in the system, not just "exaptive bootstrapping"
- Severity varies by concept:
  - **High impact**: Abstract/theoretical concepts ("exaptive bootstrapping", "ideality index", "dialectical thinking")
  - **Medium impact**: Common technical terms that appear in many contexts ("API", "interface", "pattern")
  - **Low impact**: Very specific terms that dominate chunk content ("React.useState", "PostgreSQL transaction isolation")

### Data Integrity

✅ **Data is correct**: Chunks are properly enriched, concept index is accurate  
❌ **Search algorithm is broken**: Cannot retrieve the correct data

---

## Proposed Solutions

### Option A: SQL-Style Filter on Concepts Field (RECOMMENDED)

**Approach**: Use LanceDB's SQL WHERE clause or post-load filtering

```typescript
async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
  // Load chunks and filter by concepts field
  const conceptLower = concept.toLowerCase();
  
  // Option A1: SQL WHERE (if LanceDB supports JSON_CONTAINS)
  const results = await this.chunksTable
    .query()
    .where(`concepts LIKE '%${escapeSqlString(conceptLower)}%'`)
    .limit(limit)
    .toArray();
  
  // Option A2: Load all and filter (inefficient but works)
  const allChunks = await this.chunksTable.query().limit(100000).toArray();
  return allChunks
    .filter(chunk => this.chunkContainsConcept(chunk, conceptLower))
    .slice(0, limit);
}
```

**Pros**:
- ✅ Guaranteed to find all matching chunks
- ✅ Simple to implement
- ✅ Doesn't require re-embedding

**Cons**:
- ⚠️ May be slow for large databases (depends on LanceDB indexing)
- ⚠️ No semantic expansion (exact concept name match only)

### Option B: Hybrid Search (Vector + Keyword)

**Approach**: Use hybrid search with both vector similarity AND keyword matching on concepts field

```typescript
async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
  // 1. Get concept embedding
  const conceptRecord = await this.conceptRepo.findByName(concept);
  
  // 2. Vector search for semantic candidates (cast wide net)
  const vectorCandidates = await this.chunksTable
    .vectorSearch(conceptRecord.embeddings)
    .limit(limit * 100)  // Much larger candidate set
    .toArray();
  
  // 3. Keyword filter on concepts field
  const matches = vectorCandidates.filter(chunk =>
    this.chunkContainsConcept(chunk, concept)
  );
  
  // 4. Rank by vector similarity
  return matches.slice(0, limit);
}
```

**Pros**:
- ✅ Combines semantic and exact matching
- ✅ Ranks results by relevance
- ✅ Works with existing embeddings

**Cons**:
- ⚠️ Still relies on vector search finding candidates
- ⚠️ Large candidate set required (performance impact)

### Option C: Build Better Concept Embeddings

**Approach**: Create concept embeddings from example usage contexts, not just concept names

```typescript
// During concept index building
for (const concept of concepts) {
  // Instead of: embedding = embed(concept.name)
  // Use: embedding = embed(exampleSentences)
  
  const exampleContexts = findChunksContaining(concept.name)
    .map(chunk => extractSentenceContaining(concept.name))
    .slice(0, 5)
    .join(' ');
  
  concept.embeddings = await embeddings.embed(exampleContexts);
}
```

**Pros**:
- ✅ Concept embeddings match actual usage
- ✅ Better semantic similarity
- ✅ Improves vector search quality

**Cons**:
- ⚠️ Requires re-indexing all concepts
- ⚠️ More complex embedding generation
- ⚠️ May still miss some valid chunks

### Option D: Separate Inverted Index for Concepts

**Approach**: Build a separate concept → chunk_ids mapping table

```typescript
// New table: concept_chunk_index
// Schema: { concept: string, chunk_ids: string[] }

async findByConceptName(concept: string, limit: number): Promise<Chunk[]> {
  // 1. Look up chunk IDs from index
  const index = await this.conceptChunkIndex.get(concept);
  
  // 2. Fetch chunks by ID
  const chunks = await Promise.all(
    index.chunk_ids.slice(0, limit).map(id => 
      this.chunksTable.query().where(`id = '${id}'`).limit(1).toArray()
    )
  );
  
  return chunks.flat();
}
```

**Pros**:
- ✅ O(1) lookup by concept name
- ✅ Guaranteed correct results
- ✅ Very fast

**Cons**:
- ⚠️ Additional data structure to maintain
- ⚠️ Increases storage requirements
- ⚠️ Requires rebuild when chunks change

---

## Recommended Solution

**Implement Option A (SQL-style filtering) as immediate fix, then Option D as long-term solution.**

### Phase 1: Immediate Fix (Option A)
1. Modify `findByConceptName()` to use direct filtering on concepts field
2. Test with "exaptive bootstrapping" and other affected concepts
3. Monitor performance on large databases

### Phase 2: Optimization (Option D)
1. Build inverted index: `Map<concept_name, chunk_ids[]>`
2. Update index when chunks are enriched
3. Use index for O(1) concept lookups
4. Fall back to filtering if index is missing/stale

---

## Testing Plan

### Test Cases

1. **"exaptive bootstrapping"** (current failing case)
   - Expected: 9 chunks
   - Current: 0 chunks

2. **Common concepts** (e.g., "innovation", "API design")
   - Expected: 100+ chunks
   - Verify correct document sources

3. **Rare concepts** (e.g., "ideality index")
   - Expected: 5-10 chunks
   - Verify precision

4. **Multi-word concepts** (e.g., "complex adaptive systems")
   - Expected: Match with exact phrase and partial matches
   - Verify fuzzy matching works

### Success Criteria

- ✅ `concept_search` returns expected number of chunks (within 10% of chunk_count)
- ✅ All returned chunks actually contain the concept in their concepts field
- ✅ Search completes in < 2 seconds for typical concepts
- ✅ No false negatives (missing chunks that contain the concept)
- ✅ Minimal false positives (wrong chunks returned)

---

## Related Issues

### Similar Architectural Issues to Check

1. **Catalog search**: Does it use vector search on document summaries? Same issue?
2. **Broad chunks search**: Hybrid search - verify it works correctly
3. **Concept enrichment**: Verify chunk-to-concept matching is accurate

### Technical Debt

1. **Embedding strategy**: Need clear documentation on when to use phrase embeddings vs context embeddings
2. **Search performance**: Vector search alone is insufficient for structured data (concepts field)
3. **Data validation**: Need automated tests to detect search result anomalies

---

## Action Items

### Immediate (This Session)
- [x] Investigate and identify root cause
- [x] Document findings in this report
- [ ] Implement Option A fix
- [ ] Test with "exaptive bootstrapping"
- [ ] Test with 5 other concepts
- [ ] Update documentation

### Short Term (Next Week)
- [ ] Performance testing with large concept databases
- [ ] Add integration tests for concept search
- [ ] Review other search methods for similar issues

### Long Term (Next Sprint)
- [ ] Design and implement Option D (inverted index)
- [ ] Improve concept embedding strategy (Option C)
- [ ] Build automated search quality monitoring
- [ ] Add search algorithm documentation to REFERENCES.md

---

## Appendix: Investigation Scripts

All investigation scripts are in `.engineering/artifacts/planning/2025-11-17-empty-chunk-investigation/`:

1. `investigate_empty_chunks.ts` - Initial investigation
2. `check_catalog.ts` - Verify catalog vs chunks consistency
3. `check_chunk_enrichment.ts` - Verify chunk concept enrichment
4. `test_search_logic.ts` - Step-by-step search algorithm testing

Run with: `npx tsx .engineering/artifacts/planning/2025-11-17-empty-chunk-investigation/<script>.ts`

---

## Conclusion

This investigation has uncovered a **fundamental architectural issue** in the concept search algorithm. The current approach of using concept name embeddings for vector search does not work because concept embeddings and chunk embeddings exist in different semantic spaces.

The fix is straightforward: **use direct filtering on the concepts field** instead of vector search. This guarantees correct results and is more appropriate for structured data lookups.

**The good news**: This is purely a search algorithm issue. The data is correct, properly enriched, and well-structured. Once we fix the search method, concept search will work as intended.









