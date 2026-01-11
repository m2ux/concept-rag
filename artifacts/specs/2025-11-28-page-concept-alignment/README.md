# Page-Concept Alignment Solution

**Date:** 2025-11-28  
**Status:** Planning  
**Problem:** LLM-inferred page numbers don't align with PDF loader page numbers

## Problem Statement

### Current Flow (Broken)
```
PDF → PDFLoader → Pages (page_number from PDF metadata)
         ↓
    Concatenate ALL pages into single text blob
         ↓
    LLM Concept Extraction (must GUESS page numbers)
         ↓
    Pages table (concept_ids with WRONG page numbers)
         ↓
    Hierarchical retrieval: concept → pages → chunks
         ↓
    MISALIGNMENT: chunks on PDF page 15 might not match
                  concepts LLM thought were on "page 15"
```

### Root Cause
- PDF pages are **physical layout boundaries**
- LLM receives continuous text stream
- LLM must infer/guess page numbers from text clues
- No guarantee these match PDF metadata page numbers

### Example
```
PDF Page 15: "...the strategy pattern defines a family..."
PDF Page 16: "...of interchangeable algorithms..."

LLM sees: "...the strategy pattern defines a family of interchangeable algorithms..."
LLM guesses: "strategy pattern" is on "page 15" (but might span 15-16)
```

---

## Proposed Solution: Page-Aware Extraction

### Core Principle
**Feed the LLM pages with EXPLICIT page markers so it doesn't have to guess.**

### New Flow
```
PDF → PDFLoader → Raw pages with page_number (from PDF metadata)
         ↓
    Batch pages into context-sized groups
    (e.g., 10-15 pages per batch, ~8K tokens)
         ↓
    Format with EXPLICIT page markers:
    
    === PAGE 1 ===
    [page 1 content]
    
    === PAGE 2 ===
    [page 2 content]
    ...
         ↓
    LLM extracts concepts WITH page numbers
    (LLM MUST use our page numbers, not infer)
         ↓
    Pages table (ACCURATE concept_ids per page)
```

### Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Input to LLM | Concatenated blob | Page-marked sections |
| Page numbers | LLM guesses | Explicitly provided |
| Batch size | Full document | Context-sized chunks |
| Accuracy | ~50-70% page match | ~99% page match |

---

## Implementation Design

### 1. Page-Batched Input Format

```typescript
interface PageBatch {
  pages: Array<{
    pageNumber: number;      // PDF page number (authoritative)
    content: string;         // Page text content
    catalogId: number;       // Parent document
  }>;
  batchIndex: number;        // For resume capability
  totalBatches: number;
}

function formatBatchForLLM(batch: PageBatch): string {
  let formatted = `DOCUMENT PAGES ${batch.batchIndex + 1}/${batch.totalBatches}\n\n`;
  
  for (const page of batch.pages) {
    formatted += `\n=== PAGE ${page.pageNumber} ===\n`;
    formatted += page.content;
    formatted += `\n=== END PAGE ${page.pageNumber} ===\n`;
  }
  
  return formatted;
}
```

### 2. Updated Extraction Prompt

```
You are extracting concepts from document pages. Each page is clearly marked.

IMPORTANT:
- Use ONLY the page numbers provided (e.g., "PAGE 15")
- Do NOT infer or guess page numbers
- If a concept spans multiple pages, list ALL pages where it appears
- A concept can appear on multiple pages

For each concept found, return:
{
  "concept": "concept name (domain-qualified if ambiguous)",
  "pages": [15, 16],  // EXACT page numbers from markers
  "context": "brief context of how concept is used"
}

Return as JSON array.

PAGES:
{formatted_pages}
```

### 3. Batch Processing Strategy

```
Document: 100 pages
Context window: ~8K tokens
Pages per batch: ~12 (assuming ~600 tokens/page)

Batches:
  Batch 1: Pages 1-12
  Batch 2: Pages 13-24
  ...
  Batch 9: Pages 97-100

For each batch:
  1. Format with page markers
  2. Extract concepts with page numbers
  3. Store in pages table
  4. Deduplicate concepts across batches
```

### 4. Cross-Batch Concept Handling

Concepts may appear in multiple batches. Need to:
1. Merge page numbers for same concept across batches
2. Generate single concept record with all pages

```typescript
// After all batches processed:
const conceptPages = new Map<string, Set<number>>();

for (const batch of batchResults) {
  for (const extraction of batch.concepts) {
    const key = extraction.concept.toLowerCase();
    if (!conceptPages.has(key)) {
      conceptPages.set(key, new Set());
    }
    extraction.pages.forEach(p => conceptPages.get(key)!.add(p));
  }
}
```

---

## Schema Implications

### Pages Table (No Change)
```
pages:
  id            number       Hash of catalogId-pageNumber
  catalog_id    number       Parent document
  page_number   number       PDF page number (authoritative)
  concept_ids   number[]     Concepts on this page (NOW ACCURATE)
  text_preview  string       First ~500 chars
  vector        Float32      Page embedding
```

### Validation
After seeding, can verify alignment:
```typescript
// For each page:
//   - Get page content from PDF
//   - Get concepts from pages table
//   - Verify concept text appears in page content
//   - Flag misalignments for review
```

---

## Implementation Plan

### Phase 1: Update Extraction Script
1. Modify `seed_pages_table.ts` to use page-batched input
2. Update LLM prompt with page markers
3. Add batch processing with resume capability

### Phase 2: Validation
1. Create validation script to check alignment
2. Run on test_db first
3. Review misalignment rate

### Phase 3: Migration
1. Re-extract concepts for existing documents
2. Update pages table with accurate concept_ids

---

## Alternative Considered: Post-hoc Alignment

**Approach:** After LLM extraction, use text matching to verify pages.

**Why Rejected:**
- Adds complexity without fixing root cause
- Fuzzy matching for abstract concepts is unreliable
- Better to get it right at extraction time

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Page alignment accuracy | >95% |
| Concept-page verification | >90% text match |
| Retrieval precision | Improved over baseline |

---

## Questions to Resolve

1. **Batch overlap:** Should adjacent batches overlap by 1-2 pages to catch concepts at boundaries?
2. **Context size:** What's the optimal pages-per-batch for concept extraction quality?
3. **Deduplication:** How to handle slightly different concept names across batches?
















