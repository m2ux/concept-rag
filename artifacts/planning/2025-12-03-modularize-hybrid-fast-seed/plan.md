# Work Package: Modularize hybrid_fast_seed.ts

**Date:** 2025-12-03
**Type:** Refactor
**Priority:** MEDIUM
**Status:** Ready
**Estimated Effort:** 4-6h agentic + 1-2h review

---

## Overview

### Problem Statement

`hybrid_fast_seed.ts` at 2,665 lines is a large monolithic file that handles document seeding. This impacts:
- **Maintainability:** Difficult to navigate and understand
- **Testability:** Functions are tightly coupled and not exported
- **Reusability:** OCR, embedding, and table creation logic cannot be reused by other scripts
- **Code duplication:** `createSimpleEmbedding` duplicates `SimpleEmbeddingService`

### Scope

**In Scope:**
- Extracting logical modules to existing infrastructure layer
- Eliminating code duplication
- Maintaining CLI compatibility (same arguments, same behavior)
- Creating proper exports for reusability

**Out of Scope:**
- Changing functionality or behavior
- Performance optimization
- Adding new features
- Database schema changes

---

## Current Implementation Analysis

### Implementation Review

**Current Usage:** Primary seeding script handling:
- Document discovery and loading (PDF, EPUB)
- OCR processing for scanned PDFs (Tesseract)
- LLM-based content summarization
- Concept extraction and enrichment
- LanceDB table creation and indexing
- Checkpoint management for resumable seeding

**Architecture:** Monolithic script with 25 top-level functions in a single file.

**Integration Points:**
- LanceDB for storage
- OpenRouter API for LLM calls
- Tesseract for OCR
- Existing infrastructure modules (`src/infrastructure/`)

### Effectiveness Evaluation

**What's Working Well:** ✅
- Comprehensive end-to-end seeding functionality
- Already imports from modular infrastructure
- Good progress indicators and error handling
- Checkpoint system enables resumable operations

**What's Not Working:** ❌
- Code duplication with `SimpleEmbeddingService`
- Large file size (2,665 lines)
- Mixed responsibilities (CLI, OCR, embeddings, LanceDB, logging)
- Limited testability due to tight coupling

### Baseline Metrics

| Metric | Current Value | Evidence Source |
|--------|---------------|-----------------|
| File size | 2,665 lines | Line count |
| Function count | 25 functions | grep analysis |
| Import count | 23 imports | grep analysis |
| Duplicated code | ~50 lines (embedding) | Code comparison |

### Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| Duplicate embedding code | Maintenance burden, drift risk | HIGH |
| `parseArrayField` not using shared parser | Code duplication | MEDIUM |
| OCR logic embedded in seeding script | Can't reuse OCR independently | MEDIUM |
| LanceDB table creation not reusable | Scripts duplicate table creation | MEDIUM |

### Opportunities for Improvement

1. **Eliminate embedding duplication:** Use existing `SimpleEmbeddingService`
2. **Extract OCR module:** Move to `src/infrastructure/ocr/`
3. **Extract LanceDB seeding utilities:** Move to `src/infrastructure/lancedb/seeding/`
4. **Consolidate field parsers:** Enhance `parseJsonField` to handle Arrow Vectors
5. **Extract document processing:** Move to `src/infrastructure/seeding/`

---

## Knowledge Base Insights

*Discovered via concept-rag MCP research*

### Relevant Concepts
- **Single Responsibility Principle (SRP):** A module should have one, and only one, reason to change
- **Segmentation Principle (TRIZ):** Divide an object into independent parts

### Applicable Design Patterns

| Pattern | Source | How It Applies |
|---------|--------|----------------|
| SRP | Clean Architecture | Each extracted module has single responsibility |
| Segmentation | TRIZ | Divide monolith into independent, reusable parts |

### Best Practices

1. **Extract to existing modules when possible** - Use `SimpleEmbeddingService` rather than creating new
2. **Maintain thin orchestrator** - Keep main script as coordinator, extract workers

---

## Proposed Approach

### Solution Design

Incrementally extract logical modules from `hybrid_fast_seed.ts` into the existing infrastructure layer:

1. Start with eliminating code duplication (lowest risk, immediate benefit)
2. Extract cohesive functional groups (OCR, LanceDB seeding, document processing)
3. Main script becomes thin orchestrator (~500-700 lines)

### Module Extraction Plan

```
src/infrastructure/
├── ocr/                          # NEW
│   ├── __tests__/
│   │   └── tesseract-ocr.test.ts
│   ├── index.ts
│   └── tesseract-ocr.ts          # OCR functions
├── lancedb/
│   ├── seeding/                  # NEW
│   │   ├── __tests__/
│   │   │   └── table-creation.test.ts
│   │   ├── index.ts
│   │   ├── table-creation.ts     # createLanceTableWithSimpleEmbeddings
│   │   ├── index-optimization.ts # createOptimizedIndex
│   │   └── categories.ts         # createCategoriesTable, buildCategoryIdMap
│   └── utils/
│       └── field-parsers.ts      # ENHANCE: handle Arrow Vectors
├── seeding/                      # NEW
│   ├── __tests__/
│   │   └── document-processor.test.ts
│   ├── index.ts
│   ├── document-completeness.ts  # checkDocumentCompleteness, etc.
│   ├── document-loader.ts        # loadDocumentsWithErrorHandling
│   └── document-processor.ts     # processDocuments, processDocumentsParallel
└── cli/
    └── logging.ts                # ENHANCE: add writeToLog
```

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Incremental extraction** | Low risk, testable steps, backward compatible | More commits | **Selected** |
| Complete rewrite | Clean architecture | High risk, regression prone | Rejected |
| Keep monolithic | No effort | Technical debt grows | Rejected |

---

## Implementation Tasks

### Task 1: Eliminate Embedding Duplication (30-45 min)

**Goal:** Replace duplicate embedding code with existing `SimpleEmbeddingService`

**Deliverables:**
- Modify `hybrid_fast_seed.ts` to import and use `SimpleEmbeddingService`
- Remove `createSimpleEmbedding` function (lines 505-534)
- Remove `simpleHash` function (lines 536-544)
- Verify all embedding generation still works correctly

**Changes:**
```typescript
// Before
function createSimpleEmbedding(text: string): number[] { ... }
function simpleHash(str: string): number { ... }

// After
import { SimpleEmbeddingService } from './src/infrastructure/embeddings/simple-embedding-service.js';
const embeddingService = new SimpleEmbeddingService();
// Use embeddingService.generateEmbedding(text)
```

---

### Task 2: Consolidate Field Parsers (20-30 min)

**Goal:** Enhance `parseJsonField` to handle Arrow Vectors and consolidate with `parseArrayField`

**Deliverables:**
- `src/infrastructure/lancedb/utils/field-parsers.ts` - Enhanced to handle Arrow Vectors
- Update `hybrid_fast_seed.ts` to use shared parser
- Update any other files using `parseArrayField` pattern

**Changes:**
```typescript
// Enhanced parseJsonField in field-parsers.ts
export function parseJsonField<T = string>(field: any): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field as T[];
  // NEW: Handle Arrow Vectors
  if (typeof field === 'object' && 'toArray' in field) {
    return Array.from(field.toArray()) as T[];
  }
  if (typeof field === 'string') {
    try { return JSON.parse(field) as T[]; } catch { return []; }
  }
  return [];
}
```

---

### Task 3: Extract OCR Module (45-60 min)

**Goal:** Extract OCR functionality into reusable module

**Deliverables:**
- `src/infrastructure/ocr/tesseract-ocr.ts` - OCR processing class
- `src/infrastructure/ocr/index.ts` - Exports
- `src/infrastructure/ocr/__tests__/tesseract-ocr.test.ts` - Unit tests
- Update `hybrid_fast_seed.ts` to import from new module

**Functions to Extract:**
- `callOpenRouterOCR` (lines 275-502) → `TesseractOCR.processDocument()`
- `pdfToBase64` (lines 269-272) → `TesseractOCR.pdfToBase64()`
- `drawProgressBar` (lines 64-94) → `OcrProgressBar.draw()`

---

### Task 4: Extract LanceDB Seeding Utilities (60-90 min)

**Goal:** Extract LanceDB table creation and indexing utilities

**Deliverables:**
- `src/infrastructure/lancedb/seeding/table-creation.ts`
- `src/infrastructure/lancedb/seeding/index-optimization.ts`
- `src/infrastructure/lancedb/seeding/categories.ts`
- `src/infrastructure/lancedb/seeding/index.ts`
- Unit tests for each module
- Update `hybrid_fast_seed.ts` imports

**Functions to Extract:**
- `createLanceTableWithSimpleEmbeddings` (lines 1092-1337)
- `createOptimizedIndex` (lines 1339-1368)
- `createCategoriesTable` (lines 1715-1828)
- `buildCategoryIdMap` (lines 1833-1845)
- `rebuildConceptIndexFromExistingData` (lines 1862-1996)

---

### Task 5: Extract Document Processing Utilities (45-60 min)

**Goal:** Extract document loading and processing utilities

**Deliverables:**
- `src/infrastructure/seeding/document-completeness.ts`
- `src/infrastructure/seeding/document-loader.ts`
- `src/infrastructure/seeding/document-processor.ts`
- `src/infrastructure/seeding/index.ts`
- Unit tests
- Update `hybrid_fast_seed.ts` imports

**Functions to Extract:**
- `checkDocumentCompleteness` (lines 576-695)
- `catalogRecordExists` (lines 697-714)
- `deleteIncompleteDocumentData` (lines 716-752)
- `findDocumentFilesRecursively` (lines 754-782)
- `loadDocumentsWithErrorHandling` (lines 784-1090)
- `processDocuments` (lines 1370-1465)
- `processDocumentsParallel` (lines 1471-1666)

---

### Task 6: Extract Remaining Utilities & Final Cleanup (30-45 min)

**Goal:** Extract remaining utilities and clean up main script

**Deliverables:**
- Move `writeToLog` to `src/infrastructure/cli/logging.ts`
- Move `truncateFilePath` to `src/infrastructure/utils/`
- Move `getDatabaseSize` to `src/infrastructure/utils/`
- Move `generateContentOverview` to `src/concepts/`
- Clean up `hybrid_fast_seed.ts` as thin orchestrator
- Final verification all tests pass

**Target:** Main script reduced to ~500-700 lines (orchestration only)

---

## Success Criteria

### Functional Requirements

- [ ] All existing CLI arguments work identically
- [ ] Seeding produces identical database output
- [ ] Checkpoint functionality works correctly
- [ ] OCR processing works correctly
- [ ] All progress indicators display correctly

### Performance Targets

- [ ] No performance regression in seeding time
- [ ] `hybrid_fast_seed.ts` reduced to <800 lines (from 2,665)

### Quality Requirements

- [ ] All existing tests pass
- [ ] New unit tests for extracted modules
- [ ] ADR written documenting the modularization
- [ ] No duplicate code remaining

### Measurement Strategy

**How will we validate improvements?**
- Line count comparison before/after
- Run full seeding workflow to verify identical behavior
- Run existing test suite
- Manual verification of CLI compatibility

---

## Testing Strategy

### Unit Tests

- `tesseract-ocr.test.ts`: Mock Tesseract execution, verify output parsing
- `table-creation.test.ts`: Mock LanceDB, verify correct data structure
- `document-completeness.test.ts`: Test completeness check logic
- `document-processor.test.ts`: Test document processing pipeline

### Integration Tests

- Run `npm run seed -- --filesdir sample-docs --max-docs 2` before/after
- Verify identical database contents

---

## Dependencies & Risks

### Requires (Blockers)

- [ ] None - can start immediately

### Risks

| Risk | Mitigation |
|------|------------|
| Breaking CLI compatibility | Test all CLI flags before/after each task |
| Introducing bugs during extraction | Extract one function at a time, test after each |
| Circular dependencies | Plan import graph before extraction |

---

**Status:** Ready for implementation

