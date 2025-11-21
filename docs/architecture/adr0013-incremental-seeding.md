# 13. Incremental Seeding Strategy

**Date:** 2025-11-12  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Seeding and Enrichment Improvements (November 12, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-12-seeding-and-enrichment-guides/

## Context and Problem Statement

Initial seeding processed all documents from scratch every time, requiring hours of processing and API costs for re-indexing unchanged documents [Problem: inefficient re-processing]. For a personal knowledge base that grows incrementally (adding new books/papers), full re-seeding was impractical. The system needed to detect which documents were already processed and skip them, while still handling updates and gaps.

**The Core Problem:** How to efficiently add new documents or fix gaps without reprocessing the entire corpus? [Planning: `.ai/planning/2025-11-12-seeding-and-enrichment-guides/INCREMENTAL_SEEDING_GUIDE.md`]

**Discovery:** During investigation, found 57 of 122 documents had catalog entries but NO chunks (incomplete processing) [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 5-11]

**Decision Drivers:**
* Adding new documents shouldn't reprocess existing ones [Efficiency: time and cost]
* Need to recover from interrupted seeding [Robustness: gap filling]
* Preserve existing data (no accidental deletion) [Safety: data preservation]
* Detect incomplete documents (catalog but no chunks) [Quality: completeness]
* Zero cost for skipped documents [Cost: no API calls for unchanged]
* Fast turnaround for adding new books (~minutes, not hours) [UX: responsiveness]

## Alternative Options

* **Option 1: Smart Detection with Gap Filling** - Check completeness, process only missing pieces
* **Option 2: Timestamp-Based** - Compare file modification time vs. last indexed time
* **Option 3: Full Re-seeding** - Always reprocess everything  
* **Option 4: Manifest File** - Track processed documents in separate file
* **Option 5: Version-Based** - Track document versions, reprocess on change

## Decision Outcome

**Chosen option:** "Smart Detection with Gap Filling (Option 1)", because it provides the most robust handling of incomplete documents while being simple to use (no manifest files or timestamp tracking required).

### Completeness Check Algorithm

**For Each Document:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 42-57]
```typescript
// Check 4 completeness criteria:
const hasInCatalog = await catalogTable.query()
  .where(`source = '${doc.path}'`)
  .limit(1)
  .toArray();

if (hasInCatalog.length > 0) {
  const catalogEntry = hasInCatalog[0];
  
  // Check completeness
  const hasSummary = catalogEntry.summary && !catalogEntry.summary.includes('Summary not available');
  const hasConcepts = catalogEntry.concepts && catalogEntry.concepts.length > 0;
  const hasChunks = await chunksTable.query()
    .where(`source = '${doc.path}'`)
    .limit(1)
    .toArray().then(r => r.length > 0);
  
  // Determine what needs processing
  if (hasSummary && hasConcepts && hasChunks) {
    return 'SKIP';  // Complete
  } else if (!hasChunks) {
    return 'CHUNK_ONLY';  // Create chunks
  } else if (!hasConcepts) {
    return 'CONCEPTS_ONLY';  // Extract concepts
  }
}
```
[Planning: Completeness checking logic]

### Smart Preservation Logic

**Processing Modes:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 50-57]
```
Document A: catalog + summary + concepts + chunks → ✅ SKIP entirely
Document B: catalog + summary + concepts, NO chunks → 🔄 CREATE chunks only
Document C: catalog + chunks, NO concepts → 🔄 REGENERATE concepts only
Document D: Missing everything → 🔧 FULL processing
```

### Implementation

**Completeness Detection:** [Code: `hybrid_fast_seed.ts`, completeness checking]
```typescript
// Scan phase
console.log('🔍 Checking document completeness...');
const existingRecords = await catalogTable.query().toArray();
const existingBySource = new Map(existingRecords.map(r => [r.source, r]));

for (const docFile of pdfFiles) {
  const exists = existingBySource.has(docFile);
  
  if (exists) {
    const record = existingBySource.get(docFile);
    const hasChunks = await chunksTable.query()
      .where(`source = '${docFile}'`)
      .limit(1)
      .toArray();
    
    if (record.summary && record.concepts && hasChunks.length > 0) {
      console.log(`✅ ${doc File} (complete)`);
      continue;  // Skip this document
    } else {
      console.log(`🔄 ${docFile} (incomplete: ${missingParts})`);
      // Process only missing parts
    }
  }
}
```

**Chunk Preservation:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 103-105; documentation guide]
```
✅ Preserving existing chunks for 65 document(s) with intact chunk data
🔧 Chunking 57 document(s) that need new chunks...
```

### Consequences

**Positive:**
* **Massive time savings:** Process only new/incomplete documents [Benefit: minutes vs. hours]
* **Cost savings:** No API calls for complete documents [Benefit: $0 for unchanged docs]
* **Gap recovery:** Automatically detects and fixes incomplete processing [Feature: self-healing]
* **Data safety:** Preserves existing chunks and catalog entries [Safety: no accidental deletion]
* **Simple UX:** Just run same command, system figures out what's needed [UX: automatic]
* **Validated fix:** 57 documents recovered (had catalog but no chunks) [Result: `INCREMENTAL_SEEDING_GUIDE.md`, line 5]
* **Fast for additions:** Adding 10 new books takes minutes instead of reprocessing all 165 [Performance: incremental]

**Negative:**
* **Complexity:** More logic to detect completeness vs. simple "process all" [Code: detection logic]
* **Assumptions:** Assumes source path stable (if path changes, treated as new) [Limitation: path-dependent]
* **No change detection:** Doesn't detect if PDF content changed (same path = skip) [Limitation: no versioning]
* **Database queries:** Must query database for each file (adds overhead) [Cost: query time]
* **Edge cases:** Complex scenarios (partial chunks, corrupted metadata) need handling [Maintenance: edge cases]

**Neutral:**
* **Concept index rebuild:** Always rebuilds from all chunks (necessary for accuracy) [Design: consistency]
* **No manifest file:** State tracked in database itself [Architecture: self-contained]

### Confirmation

**Production Validation:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 132-158]

**Gap Recovery Test:**
- **Before:** 57/122 documents missing chunks [Problem: `INCREMENTAL_SEEDING_GUIDE.md`, line 5]
- **After:** 0/122 documents incomplete [Result: gap filled]
- **Chunks added:** ~15,000 new chunks for Elliott Wave books [Result: lines 145]
- **Concept stats fixed:** "elliott wave" concept now has 247 chunks (was 0) [Result: line 128]

**Time Savings Example:**
- **Full re-seeding:** 165 docs × 2-3 min = 330-495 minutes (5.5-8 hours)
- **Adding 10 new docs:** 10 × 2-3 min = 20-30 minutes
- **Savings:** 90-95% time reduction for incremental additions

**Cost Savings Example:**
- **Full re-seeding:** 165 docs × $0.048 = $7.92
- **Adding 10 new docs:** 10 × $0.048 = $0.48
- **Savings:** $7.44 saved (95%)

## Pros and Cons of the Options

### Option 1: Smart Detection with Gap Filling - Chosen

**Pros:**
* Automatic gap detection and recovery
* No manual tracking required
* Handles interrupted processing gracefully
* Data safety (preserves existing)
* Simple UX (same command)
* Validated: recovered 57 incomplete documents [Source: line 5]
* Time savings: 90-95% for incremental additions

**Cons:**
* More complex detection logic
* Assumes stable file paths
* No content change detection
* Database queries for each file

### Option 2: Timestamp-Based

Compare file modification time vs. last indexed timestamp.

**Pros:**
* Can detect document updates
* Standard approach for incremental processing
* Clear "last processed" time

**Cons:**
* **Doesn't detect gaps:** Catalog exists but chunks missing? [Gap: incomplete handling]
* **Timestamp unreliable:** File systems don't always preserve mtime
* **Clock skew:** Problems with synchronized folders, backups
* **Extra field:** Must store last_indexed timestamp
* **False positives:** Touch command triggers full reprocess

### Option 3: Full Re-seeding

Always reprocess everything.

**Pros:**
* Simplest implementation
* No state tracking
* Always consistent
* Detects document updates

**Cons:**
* **Massive waste:** Reprocess 165 docs to add 1 new doc [Inefficiency: extreme]
* **Time:** Hours for every addition [UX: terrible]
* **Cost:** $7.92 every time [Budget: unsustainable]
* **Original problem:** This is what we had before, it's impractical

### Option 4: Manifest File

External file tracking processed documents (JSON/CSV).

**Pros:**
* Explicit tracking
* Can store additional metadata
* Easy to inspect/edit

**Cons:**
* **Extra file to manage:** `processed_docs.json` needs maintenance [Complexity: external state]
* **Sync issues:** File and database can get out of sync [Risk: inconsistency]
* **Backup complexity:** Must backup manifest too [Operations: extra file]
* **Not self-describing:** Database doesn't show its own state [Philosophy: external dependency]

### Option 5: Version-Based

Hash document content, reprocess if hash changes.

**Pros:**
* Detects actual content changes (not just timestamp)
* Cryptographic hash (MD5/SHA) for reliable detection

**Cons:**
* **Must read entire PDF:** To compute hash (expensive for large files) [Cost: disk I/O]
* **Already implemented:** Content hash used for chunks [Note: partial implementation]
* **Catalog-level hash:** Would need to add for detection
* **Complexity:** More fields, more logic
* **Marginal benefit:** Documents rarely change in practice

## Implementation Notes

### Incomplete Document Detection

**Discovery Process:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 5-18]
1. Query all catalog entries (122 documents)
2. For each catalog entry, query chunks table
3. Found: 57 documents with catalog.summary but zero chunks
4. Root cause: Chunking failed or was interrupted during initial seeding

### Bug Fix

**Issue:** Concept chunk_count showed 0 even when chunks existed [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 22-36]

**Before:**
```typescript
// Only counted NEW chunks being processed
const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords, docs);
```

**After:**
```typescript
// Load ALL chunks from database for accurate counting
const allChunkRecords = await chunksTable.query().limit(1000000).toArray();
const allChunks = allChunkRecords.map(r => convertToDocument(r));
const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords, allChunks);
```
[Source: Fix in `hybrid_fast_seed.ts`, line 1320]

### Logging

**Detection Phase:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 94-99]
```
✅ [abc123...xyz789] document1.pdf (complete)           
🔄 [def456...uvw890] document2.pdf (missing: chunks)    
✅ [ghi789...rst901] document3.pdf (complete)           
```

### User Command

**Simple Interface:** [Source: `INCREMENTAL_SEEDING_GUIDE.md`, lines 72-81; README.md]
```bash
# Incremental seeding (add new documents only - much faster!)
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/my-pdfs
```

**Important:** No `--overwrite` flag = incremental mode [Safety: default safe]

## Related Decisions

- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - Indexing pipeline
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Concepts need accurate counting
- [ADR-0009: Three-Table Architecture](adr0009-three-table-architecture.md) - Completeness check across tables

## References

### Related Decisions
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md)
- [ADR-0009: Three-Table Architecture](adr0009-three-table-architecture.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 12, 2024
- Metrics from: INCREMENTAL_SEEDING_GUIDE.md lines 5, 128-145

**Traceability:** .ai/planning/2025-11-12-seeding-and-enrichment-guides/



