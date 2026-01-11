# Metadata Detection and Improvement - Implementation Plan

**Date:** 2025-12-10  
**Priority:** HIGH  
**Status:** Planning  
**Estimated Effort:** 4-6h agentic + 1h review

---

## Overview

### Problem Statement

The concept-rag database stores bibliographic metadata (title, author, year, publisher, ISBN) in the catalog table. Currently, this metadata is extracted from filenames using a `--` delimiter format. When filenames don't follow this format, metadata fields remain empty or incomplete.

**Impact:**
- Search by author/year is unreliable
- Document attribution is missing
- MCP tools return incomplete source information
- User experience degraded when browsing documents

### Scope

**In Scope:**
1. Diagnostic script to detect missing metadata across databases
2. Content-based metadata extraction from document chunks
3. Evaluation framework for extraction accuracy
4. Integration of fallback extraction into seeding workflow
5. Backfill script for existing database entries

**Out of Scope:**
- External metadata lookup (ISBN databases, DOI resolution)
- Manual metadata entry UI
- PDF metadata dictionary extraction (already handled for papers)
- Changes to the database schema

---

## Current Implementation Analysis

### Current Metadata Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT METADATA EXTRACTION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. parseFilenameMetadata() - Primary extraction                             │
│     Input:  "/path/to/Title -- Author -- 2020 -- Publisher -- ISBN.pdf"     │
│     Output: { title: "Title", author: "Author", year: 2020, ... }           │
│                                                                               │
│  2. extractPaperMetadata() - For research papers only                        │
│     Input:  Document[] (page content)                                        │
│     Output: { title?, authors?, abstract?, doi?, arxivId?, venue? }         │
│                                                                               │
│  3. Seeding writes to catalog table                                          │
│     - Uses filename metadata as primary source                               │
│     - Uses paper metadata for paper-specific fields                          │
│     - No fallback when filename parsing fails                                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Components

| Component | File | Role |
|-----------|------|------|
| Filename Parser | `src/infrastructure/utils/filename-metadata-parser.ts` | Parses `--` delimited filenames |
| Paper Extractor | `src/infrastructure/document-loaders/paper-metadata-extractor.ts` | Extracts metadata from paper content |
| Seeding Script | `hybrid_fast_seed.ts` | Orchestrates document processing |

### Baseline Metrics

To be measured by diagnostic script:

| Metric | Expected Issue |
|--------|----------------|
| Documents with empty `title` | Likely low (filename fallback exists) |
| Documents with empty `author` | High for non-delimited filenames |
| Documents with `year = 0` | High for non-delimited filenames |
| Documents with empty `publisher` | Very high (not commonly in filenames) |
| Documents with empty `isbn` | Very high (requires specific format) |

### Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| No content-based fallback for books | Core metadata missing | HIGH |
| No detection of missing metadata | Can't track improvement | HIGH |
| No backfill mechanism | Existing docs stay incomplete | MEDIUM |
| Paper metadata not used for author/year | Redundant fields empty | LOW |

---

## Proposed Approach

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ENHANCED METADATA EXTRACTION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Phase 1: Diagnostic                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  scripts/diagnose-metadata.ts                                        │    │
│  │  - Connect to database (test or production)                          │    │
│  │  - Query catalog table for all documents                             │    │
│  │  - Analyze metadata completeness per field                           │    │
│  │  - Generate report with statistics and examples                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  Phase 2: Content-Based Extractor                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  src/infrastructure/document-loaders/content-metadata-extractor.ts   │    │
│  │  - Extract title from first chunk (heuristics + LLM)                 │    │
│  │  - Extract author from copyright pages, front matter                 │    │
│  │  - Extract year from copyright, edition info                         │    │
│  │  - Confidence scoring for extracted values                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  Phase 3: Evaluation                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  scripts/evaluate-metadata-extraction.ts                             │    │
│  │  - Compare extracted vs known metadata (from filenames)              │    │
│  │  - Calculate precision/recall per field                              │    │
│  │  - Identify failure patterns                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  Phase 4: Integration                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  hybrid_fast_seed.ts (updated)                                       │    │
│  │  - Try filename extraction first                                     │    │
│  │  - If metadata incomplete, use content extraction                    │    │
│  │  - Merge results with priority to filename                           │    │
│  │                                                                       │    │
│  │  scripts/backfill-metadata.ts                                        │    │
│  │  - Process existing catalog entries                                  │    │
│  │  - Extract metadata from associated chunks                           │    │
│  │  - Update catalog records                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Content-Based Extraction Strategy

**Title Extraction:**
- First meaningful line(s) of document (after skipping headers)
- Copyright page: "Title" or book name before author
- Table of contents: Document name
- LLM prompt for disambiguation

**Author Extraction:**
- Copyright page: "Copyright © YYYY by Author Name"
- "by Author Name" patterns
- "Author: Name" patterns
- Front matter attribution

**Year Extraction:**
- Copyright year: "Copyright © YYYY" or "© YYYY"
- Edition dates: "First published YYYY", "YYYY Edition"
- Print dates in front matter

**Confidence Scoring:**
Each extraction returns a confidence score (0.0-1.0):
- 0.9+: High confidence (clear pattern match)
- 0.7-0.9: Medium confidence (partial match)
- 0.5-0.7: Low confidence (heuristic guess)
- <0.5: Very low (should be reviewed)

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| LLM-only extraction | Highest accuracy | Expensive, slow | Use for disambiguation only |
| Regex/heuristics only | Fast, cheap | Lower accuracy | Primary approach |
| External API lookup | Authoritative data | Requires ISBN/DOI, API costs | Out of scope |
| Manual curation | 100% accuracy | Doesn't scale | Out of scope |

**Decision:** Use heuristic extraction with optional LLM for low-confidence cases. This balances accuracy with cost/speed.

---

## Implementation Tasks

### Task 1: Create Metadata Diagnostic Script (1-2h)

**Goal:** Analyze existing database to identify documents with missing metadata.

**Deliverables:**
- `scripts/diagnostics/diagnose-metadata.ts`

**Features:**
```typescript
interface MetadataStats {
  totalDocuments: number;
  fieldsAnalysis: {
    title: { empty: number; fromFilename: number; populated: number };
    author: { empty: number; populated: number };
    year: { zero: number; populated: number };
    publisher: { empty: number; populated: number };
    isbn: { empty: number; populated: number };
  };
  examples: {
    missingAll: string[];      // Documents with no metadata
    missingAuthor: string[];   // Documents with title but no author
    complete: string[];        // Documents with full metadata
  };
}
```

**Usage:**
```bash
# Analyze test database
npx tsx scripts/diagnostics/diagnose-metadata.ts --dbpath ~/.concept_rag_test

# Analyze production database
npx tsx scripts/diagnostics/diagnose-metadata.ts --dbpath ~/.concept_rag

# Output JSON for further analysis
npx tsx scripts/diagnostics/diagnose-metadata.ts --json > metadata-report.json
```

**Output Example:**
```
=== Metadata Analysis Report ===
Database: /home/user/.concept_rag
Documents analyzed: 259

Field Coverage:
  title:     100% (259/259) - All have titles (may be filename-derived)
  author:     45% (117/259) - 142 documents missing author
  year:       38% (98/259)  - 161 documents missing year
  publisher:  12% (31/259)  - 228 documents missing publisher
  isbn:        8% (21/259)  - 238 documents missing ISBN

Documents with complete metadata: 21/259 (8%)
Documents with minimal metadata (title only): 89/259 (34%)

Examples of documents missing author:
  - /path/to/simple-filename.pdf
  - /path/to/2204.11193v1.pdf
  - /path/to/Book Title.epub
```

---

### Task 2: Build Content-Based Metadata Extractor (2-3h)

**Goal:** Extract bibliographic metadata from document content (chunks).

**Deliverables:**
- `src/infrastructure/document-loaders/content-metadata-extractor.ts`
- `src/infrastructure/document-loaders/__tests__/content-metadata-extractor.test.ts`

**Interface:**
```typescript
export interface ExtractedMetadata {
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  confidence: {
    title: number;
    author: number;
    year: number;
    publisher: number;
  };
}

export interface ContentMetadataExtractor {
  /**
   * Extract metadata from document chunks.
   * Analyzes first few chunks (front matter) for bibliographic information.
   */
  extract(chunks: ChunkData[]): Promise<ExtractedMetadata>;
  
  /**
   * Extract metadata with LLM assistance for low-confidence cases.
   */
  extractWithLLM(chunks: ChunkData[]): Promise<ExtractedMetadata>;
}
```

**Extraction Patterns:**

```typescript
// Title patterns
const TITLE_PATTERNS = [
  /^([A-Z][^.!?]*?)(?:\n|by\s)/m,                    // First capitalized line before "by"
  /^([A-Z][A-Za-z\s:,'-]+)$/m,                       // Standalone title line
];

// Author patterns  
const AUTHOR_PATTERNS = [
  /(?:by|By|BY)\s+([A-Z][a-zA-Z.\s]+)/,              // "by Author Name"
  /(?:Copyright|©)\s*(?:\d{4})?\s*(?:by\s+)?([A-Z][a-zA-Z.\s]+)/i,  // Copyright attribution
  /(?:Author|Written by):\s*([A-Z][a-zA-Z.\s]+)/i,  // Explicit "Author:" field
];

// Year patterns
const YEAR_PATTERNS = [
  /(?:Copyright|©)\s*(\d{4})/i,                      // Copyright year
  /(?:First published|Published)\s*(?:in\s+)?(\d{4})/i,  // Publication date
  /(\d{4})\s*Edition/i,                              // Edition year
  /Printed\s+(?:in\s+)?(?:\w+\s+)?(\d{4})/i,        // Print date
];

// Publisher patterns
const PUBLISHER_PATTERNS = [
  /(?:Published by|Publisher:)\s*([A-Z][A-Za-z\s&,]+)/i,
  /(?:Printed by)\s*([A-Z][A-Za-z\s&,]+)/i,
  // Common publisher names
  /(O'Reilly|Addison-Wesley|Pearson|Springer|Wiley|McGraw-Hill|Packt|Manning|Pragmatic|Apress)/i,
];
```

**Implementation Notes:**
- Process first 3-5 chunks (front matter, copyright page)
- Use page_number metadata to prioritize page 1-5
- Skip chunks marked as `is_reference=true`
- Return confidence based on pattern specificity

---

### Task 3: Create Evaluation Framework (1h)

**Goal:** Measure accuracy of content-based extraction against known-good data.

**Deliverables:**
- `scripts/evaluate-metadata-extraction.ts`

**Approach:**
1. Use documents with complete filename-derived metadata as ground truth
2. Run content extractor on their chunks
3. Compare extracted vs known values
4. Calculate precision/recall/F1 per field

**Metrics:**
```typescript
interface EvaluationMetrics {
  field: 'title' | 'author' | 'year' | 'publisher';
  total: number;           // Documents evaluated
  extracted: number;       // Documents where extraction returned a value
  correct: number;         // Exact or fuzzy match with ground truth
  precision: number;       // correct / extracted
  recall: number;          // extracted / total
  f1: number;              // Harmonic mean
  avgConfidence: number;   // Average confidence score
  examples: {
    correct: string[];     // Example correct extractions
    incorrect: string[];   // Example incorrect extractions
    missed: string[];      // Examples where extraction failed
  };
}
```

**Fuzzy Matching:**
- Title: Levenshtein distance < 10% of length
- Author: Normalize "Robert C. Martin" = "Robert Martin" = "R. Martin"
- Year: Exact match
- Publisher: Case-insensitive, ignore "Inc", "Ltd", "Publishing"

---

### Task 4: Integrate Fallback into Seeding (1h)

**Goal:** Use content extraction when filename parsing yields incomplete metadata.

**Deliverables:**
- Updated `hybrid_fast_seed.ts` with fallback logic

**Logic Flow:**
```typescript
// In createDataWithEmbeddings(), after parseFilenameMetadata():

const fileMeta = parseFilenameMetadata(doc.metadata.source || '');

// Check if filename parsing yielded incomplete metadata
const isIncomplete = !fileMeta.author || fileMeta.year === 0;

if (isIncomplete && doc.metadata.allChunks) {
  // Get first few chunks for content extraction
  const frontMatterChunks = doc.metadata.allChunks
    .filter((c: any) => c.page_number && c.page_number <= 5)
    .slice(0, 5);
  
  if (frontMatterChunks.length > 0) {
    const contentMeta = await contentMetadataExtractor.extract(frontMatterChunks);
    
    // Merge: filename takes priority, content fills gaps
    baseData.author = fileMeta.author || contentMeta.author || '';
    baseData.year = fileMeta.year || contentMeta.year || 0;
    baseData.publisher = fileMeta.publisher || contentMeta.publisher || '';
    
    // Log extraction for debugging
    console.log(`📝 Content-extracted metadata for ${path.basename(source)}: ` +
      `author=${contentMeta.author}, year=${contentMeta.year}`);
  }
}
```

---

### Task 5: Create Backfill Script (1h)

**Goal:** Update existing catalog entries with extracted metadata.

**Deliverables:**
- `scripts/backfill-metadata.ts`

**Features:**
```bash
# Dry run - show what would be updated
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --dry-run

# Backfill with minimum confidence threshold
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --min-confidence 0.7

# Backfill specific fields only
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --fields author,year

# Process specific documents
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --source "/path/to/doc.pdf"
```

**Workflow:**
1. Query catalog for documents with missing metadata
2. For each document, fetch associated chunks (first 5 pages)
3. Run content extraction
4. Update catalog entry if confidence exceeds threshold
5. Generate summary report

---

## Success Criteria

### Functional Requirements

- [ ] Diagnostic script accurately reports metadata coverage
- [ ] Content extractor identifies title, author, year from book front matter
- [ ] Confidence scores correlate with extraction accuracy
- [ ] Fallback integrates seamlessly into seeding workflow
- [ ] Backfill script can update existing database

### Performance Targets

- [ ] Content extraction adds < 100ms per document (heuristic mode)
- [ ] Backfill processes 100 documents in < 5 minutes
- [ ] No regression in seeding speed for well-formatted filenames

### Quality Requirements

- [ ] Title extraction: 90%+ precision on books with clear front matter
- [ ] Author extraction: 80%+ precision when copyright page exists
- [ ] Year extraction: 85%+ precision (copyright years are usually clear)
- [ ] Overall metadata completeness: Improve from ~10% to ~60%

### Measurement Strategy

1. **Baseline:** Run diagnostic on production database, record current coverage
2. **After implementation:** Run diagnostic again, compare coverage percentages
3. **Accuracy:** Use evaluation script on documents with known metadata
4. **Confidence calibration:** Plot confidence vs actual accuracy

---

## Testing Strategy

### Unit Tests

- `content-metadata-extractor.test.ts`
  - Test each pattern against sample text
  - Test confidence scoring logic
  - Test edge cases (no match, multiple matches)

### Integration Tests

- Test extraction on sample documents with known metadata
- Test fallback integration in seeding workflow
- Test backfill on test database

### Validation

- Run on test database first (smaller dataset)
- Review extraction results manually for sample of documents
- Compare before/after metadata coverage statistics

---

## Dependencies & Risks

### Dependencies

- Existing chunk data in database (needed for content extraction)
- LanceDB connection utilities (already implemented)
- Document content quality (OCR issues may affect extraction)

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low OCR quality | Extraction fails | Medium | Skip documents with `has_extraction_issues=true` |
| Non-English content | Patterns don't match | Low | Focus on English patterns, document limitation |
| Inconsistent front matter | Low extraction rate | Medium | Multiple patterns, LLM fallback for edge cases |
| Copyright page not in first chunks | Misses author/year | Low | Scan up to 10 chunks, not just first 3 |

---

## Notes

### Future Enhancements (Out of Scope)

1. **ISBN lookup:** Use Open Library API to fetch metadata from ISBN
2. **DOI resolution:** Use CrossRef API to get citation metadata
3. **LLM extraction mode:** Full LLM-based extraction for complex cases
4. **Manual override:** Allow users to provide metadata corrections

### Related Work

- `PaperMetadataExtractor` - Similar approach for research papers
- ADR-0046 - Document type classification
- Schema v7 - Metadata field definitions

---

**Status:** Ready for implementation













