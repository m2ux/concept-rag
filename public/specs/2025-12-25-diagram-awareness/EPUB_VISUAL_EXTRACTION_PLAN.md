# EPUB Visual Extraction Support

**Date:** 2026-01-04  
**Parent Feature:** [Diagram Awareness](./README.md)  
**Status:** Planning  
**Issue:** Extends [#51](https://github.com/m2ux/concept-rag/issues/51)

---

## Executive Summary

Extend the visual extraction pipeline to support EPUB input documents. Currently, visual extraction only works with PDF files. This plan details the work required to extract and classify diagrams/charts/figures from EPUB e-books.

---

## Current State Analysis

### Visual Extraction (PDF-only)

The existing pipeline (`src/infrastructure/visual-extraction/`) handles PDF documents:

| Component | Purpose | PDF-Specific |
|-----------|---------|--------------|
| `visual-extractor.ts` | Main orchestrator | Uses `pdfimages`, `getPdfPageDimensions` |
| `pdf-page-renderer.ts` | Extract/render images from PDF | Entirely PDF-specific |
| `document-analyzer.ts` | Detect native vs scanned | PDF-specific analysis |
| `local-classifier.ts` | Classify images | Format-agnostic ✓ |
| `image-processor.ts` | Grayscale conversion | Format-agnostic ✓ |
| `region-cropper.ts` | Crop regions | Format-agnostic ✓ |
| `types.ts` | Type definitions | Mostly format-agnostic |

### EPUB Text Extraction

`EPUBDocumentLoader` (`src/infrastructure/document-loaders/epub-loader.ts`) currently:
- Uses the `epub` npm package for parsing
- Extracts text content from chapters
- Extracts metadata (title, author, etc.)
- **Does NOT extract images** - they are currently ignored

### EPUB Structure

EPUB files are ZIP archives with:
```
book.epub/
├── META-INF/
│   └── container.xml       # Points to OPF file
├── OEBPS/
│   ├── content.opf         # Manifest + spine + metadata
│   ├── toc.ncx             # Table of contents
│   ├── chapter1.xhtml      # Content files (spine order)
│   ├── chapter2.xhtml
│   ├── images/             # Image files
│   │   ├── figure1.png
│   │   ├── diagram2.jpg
│   │   └── cover.jpg
│   └── styles/
```

**Image Access via `epub` package:**
```javascript
const epub = new EPub(filePath);
epub.on('end', () => {
  // epub.manifest contains all resources including images
  // Each manifest item has: id, href, 'media-type'
  
  // Get image data:
  epub.getImage(imageId, (err, data, mimeType) => {
    // data is a Buffer containing the image bytes
  });
});
```

---

## Key Design Decisions

### D1: Association Strategy

Unlike PDFs where images have page numbers, EPUBs have images associated with chapters.

| Option | Pros | Cons |
|--------|------|------|
| **Chapter association** ✓ | Semantically correct | Different from PDF structure |
| Page simulation | Consistent with PDF | Artificial, misleading |
| No association | Simple | Loses context |

**Decision:** Associate visuals with **chapter index** (0-based). Store `chapterIndex` instead of `pageNumber` for EPUB visuals. The schema already supports this via nullable `page_number`.

### D2: Chapter Context Detection

Images in EPUBs are referenced in XHTML via `<img>` tags. Need to find which chapter(s) reference each image.

**Approach:**
1. Parse each chapter XHTML to find `<img>` references
2. Map image manifest IDs to chapter indices
3. If image appears in multiple chapters, use first occurrence
4. If image not referenced (e.g., cover), assign to chapter 0

### D3: Pre-filtering Strategy

PDFs have page-sized image pre-filtering. EPUBs need different heuristics:

| Filter | Purpose |
|--------|---------|
| **Cover detection** | Skip cover images (usually largest, first in manifest) |
| **Icon/logo detection** | Skip small icons (<100x100) |
| **Decorative patterns** | Skip based on filename patterns (e.g., "divider", "ornament") |

**Note:** Final classification still uses local model for semantic filtering.

### D4: Implementation Approach

| Option | Pros | Cons |
|--------|------|------|
| **Extend VisualExtractor** ✓ | Unified interface | Requires abstraction |
| New EpubVisualExtractor | Clean separation | Duplication, two classes |
| DocumentVisualExtractor base class | OOP-clean | Over-engineering |

**Decision:** Extend `VisualExtractor` with an `extractFromEpub()` method alongside `extractFromPdf()`. Add a unified `extract()` method that routes based on file extension.

---

## Architecture Changes

### New Components

```
src/infrastructure/visual-extraction/
├── visual-extractor.ts      # Add extractFromEpub(), extract()
├── epub-image-extractor.ts  # NEW: Extract images from EPUB
└── ...
```

### Modified Components

```
visual-extractor.ts:
  + extractFromEpub(epubPath, catalogId, documentInfo, options)
  + extract(filePath, catalogId, documentInfo, options)  // Unified entry
  
types.ts:
  + Update ExtractedVisual to support chapter context
  
VisualExtractionResult:
  + documentFormat: 'pdf' | 'epub'  // Add format indicator
```

### New Type Definitions

```typescript
// epub-image-extractor.ts

export interface EpubImage {
  /** Image ID from manifest */
  manifestId: string;
  /** Image path within EPUB (e.g., "images/figure1.png") */
  href: string;
  /** MIME type (e.g., "image/png") */
  mimeType: string;
  /** Chapter index where image is first referenced (0-based) */
  chapterIndex: number;
  /** Chapter title if available */
  chapterTitle?: string;
  /** Image index within chapter */
  imageIndex: number;
  /** Raw image buffer */
  data: Buffer;
  /** Image dimensions */
  width: number;
  height: number;
}

export interface EpubImageExtractionResult {
  /** Total images in manifest */
  totalImages: number;
  /** Images extracted (passed pre-filters) */
  extractedImages: EpubImage[];
  /** Images skipped by pre-filter (cover, icons, etc.) */
  skipped: {
    cover: number;
    tooSmall: number;
    decorative: number;
  };
  /** Errors encountered */
  errors: string[];
}
```

---

## Implementation Tasks

### Phase 1: EPUB Image Extractor (Core)

#### Task 1.1: Create `epub-image-extractor.ts`
**Effort:** 2-3 hours  
**Deliverable:** `src/infrastructure/visual-extraction/epub-image-extractor.ts`

Implement core EPUB image extraction:

```typescript
export class EpubImageExtractor {
  /**
   * Extract all images from an EPUB file.
   * Maps images to chapters and applies pre-filters.
   */
  async extract(epubPath: string): Promise<EpubImageExtractionResult>;
  
  /**
   * Parse chapter XHTML to find image references.
   */
  private parseChapterImages(epub: EPub, chapterId: string): Promise<string[]>;
  
  /**
   * Build mapping from image manifest ID to chapter index.
   */
  private buildImageChapterMap(epub: EPub): Promise<Map<string, number>>;
  
  /**
   * Apply pre-filters (cover, icons, decorative).
   */
  private shouldSkipImage(image: EpubImage, allImages: EpubImage[]): PreFilterResult;
}
```

**Key implementation details:**
1. Use existing `epub` package (already in dependencies)
2. Parse XHTML chapters using regex or cheerio for `<img>` tags
3. Map `src` attributes to manifest IDs
4. Get image data via `epub.getImage()`
5. Use `sharp` to get image dimensions

**Commit:** `feat(visual): add EPUB image extractor`

#### Task 1.2: Add Pre-filter Heuristics
**Effort:** 1 hour  
**Deliverable:** Pre-filter logic in `epub-image-extractor.ts`

Implement EPUB-specific pre-filters:

```typescript
interface PreFilterResult {
  skip: boolean;
  reason?: 'cover' | 'tooSmall' | 'decorative';
}

private shouldSkipImage(
  image: EpubImage, 
  allImages: EpubImage[],
  options: { minWidth: number; minHeight: number }
): PreFilterResult {
  // 1. Skip if too small
  if (image.width < options.minWidth || image.height < options.minHeight) {
    return { skip: true, reason: 'tooSmall' };
  }
  
  // 2. Skip cover images (heuristics)
  if (this.isCoverImage(image, allImages)) {
    return { skip: true, reason: 'cover' };
  }
  
  // 3. Skip decorative images (filename patterns)
  if (this.isDecorativeImage(image)) {
    return { skip: true, reason: 'decorative' };
  }
  
  return { skip: false };
}

private isCoverImage(image: EpubImage, allImages: EpubImage[]): boolean {
  const href = image.href.toLowerCase();
  // Check filename patterns
  if (href.includes('cover') || href.includes('title')) return true;
  // Check if largest image and in chapter 0
  // ... additional heuristics
}

private isDecorativeImage(image: EpubImage): boolean {
  const patterns = ['divider', 'ornament', 'separator', 'border', 'icon'];
  return patterns.some(p => image.href.toLowerCase().includes(p));
}
```

**Commit:** `feat(visual): add EPUB image pre-filters`

---

### Phase 2: Extend Visual Extractor

#### Task 2.1: Add `extractFromEpub()` Method
**Effort:** 2-3 hours  
**Deliverable:** Updated `visual-extractor.ts`

```typescript
/**
 * Extract visuals from an EPUB document.
 * 
 * @param epubPath - Path to the EPUB file
 * @param catalogId - Catalog ID for the document
 * @param documentInfo - Document metadata for folder naming
 * @param options - Extraction options
 * @returns Extraction result
 */
async extractFromEpub(
  epubPath: string,
  catalogId: number,
  documentInfo: DocumentInfo,
  options: VisualExtractionOptions = {}
): Promise<VisualExtractionResult>;
```

**Implementation:**
1. Use `EpubImageExtractor` to get candidate images
2. Write images to temp files for classification
3. Run local classifier on each candidate
4. Save semantic images as grayscale with metadata
5. Clean up temp files
6. Return result with chapter-based associations

**Commit:** `feat(visual): extend VisualExtractor for EPUB support`

#### Task 2.2: Add Unified `extract()` Entry Point
**Effort:** 30 minutes  
**Deliverable:** Updated `visual-extractor.ts`

```typescript
/**
 * Extract visuals from a document (auto-detects format).
 * 
 * @param filePath - Path to PDF or EPUB file
 * @param catalogId - Catalog ID for the document
 * @param documentInfo - Document metadata
 * @param options - Extraction options
 * @returns Extraction result
 */
async extract(
  filePath: string,
  catalogId: number,
  documentInfo: DocumentInfo,
  options: VisualExtractionOptions = {}
): Promise<VisualExtractionResult> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return this.extractFromPdf(filePath, catalogId, documentInfo, options);
  } else if (ext === '.epub') {
    return this.extractFromEpub(filePath, catalogId, documentInfo, options);
  } else {
    throw new Error(`Unsupported document format: ${ext}`);
  }
}
```

**Commit:** `feat(visual): add unified extract() method`

#### Task 2.3: Update Types for EPUB Support
**Effort:** 30 minutes  
**Deliverable:** Updated `types.ts`

```typescript
export interface ExtractedVisual {
  /** Page number (1-indexed) for PDFs, or 0 for EPUBs */
  pageNumber: number;
  /** Chapter index (0-indexed) for EPUBs, or undefined for PDFs */
  chapterIndex?: number;
  /** Chapter title for EPUBs */
  chapterTitle?: string;
  /** Visual index within page/chapter */
  visualIndex: number;
  /** Visual type */
  type: VisualType;
  /** Path to saved image (relative to db) */
  imagePath: string;
  /** Bounding box (for cropped regions) */
  boundingBox: { x: number; y: number; width: number; height: number };
  /** Image dimensions */
  width: number;
  height: number;
}

export interface VisualExtractionResult {
  // ... existing fields ...
  
  /** Document format */
  documentFormat: 'pdf' | 'epub';
}
```

**Commit:** `refactor(visual): update types for EPUB support`

---

### Phase 3: Integration

#### Task 3.1: Update `extract-visuals.ts` Script
**Effort:** 1 hour  
**Deliverable:** Updated `scripts/extract-visuals.ts`

Modify the extraction script to:
1. Find both PDF and EPUB files
2. Use unified `extract()` method
3. Report format-specific stats

```typescript
// In file discovery
const files = await findDocumentFiles(filesDir, ['.pdf', '.epub']);

// In extraction loop
const result = await visualExtractor.extract(filePath, catalogId, docInfo);
console.log(`  Format: ${result.documentFormat}`);
```

**Commit:** `feat(scripts): update extract-visuals for EPUB support`

#### Task 3.2: Update Seeding Integration
**Effort:** 1 hour  
**Deliverable:** Updated seeding integration (if applicable)

If `SEEDING_INTEGRATION_PLAN.md` is implemented, update:
1. `--extract-visuals` flag to work with EPUBs
2. Progress reporting for EPUB extraction

**Commit:** `feat(seeding): update visual extraction for EPUBs`

---

### Phase 4: Testing

#### Task 4.1: Unit Tests for EpubImageExtractor
**Effort:** 2 hours  
**Deliverable:** `src/__tests__/unit/epub-image-extractor.test.ts`

Test cases:
- Extract images from valid EPUB
- Handle EPUB with no images
- Pre-filter cover images
- Pre-filter small images
- Pre-filter decorative images
- Map images to correct chapters
- Handle malformed EPUB structure

**Commit:** `test(visual): add unit tests for EPUB image extractor`

#### Task 4.2: Integration Tests
**Effort:** 1.5 hours  
**Deliverable:** `src/__tests__/integration/epub-visual-extraction.test.ts`

Test cases:
- End-to-end EPUB extraction with classification
- Mixed PDF/EPUB extraction
- Error handling for corrupted EPUBs
- Verify saved images have correct metadata

**Commit:** `test(visual): add integration tests for EPUB extraction`

#### Task 4.3: Create Test EPUB Fixtures
**Effort:** 1 hour  
**Deliverable:** Test EPUB files in fixtures

Create test EPUBs with:
- Technical diagrams
- Charts and figures
- Cover image
- Decorative elements
- Various chapter structures

**Commit:** `test(fixtures): add EPUB visual extraction test files`

---

### Phase 5: Documentation

#### Task 5.1: Update Planning Documents
**Effort:** 30 minutes  
**Deliverable:** Updated docs in `.ai/planning/2025-12-25-diagram-awareness/`

Update:
- `README.md` - Add EPUB support note
- `ARCHITECTURE.md` - Update pipeline diagram
- `IMPLEMENTATION_PLAN.md` - Mark EPUB tasks

**Commit:** N/A (local planning docs)

#### Task 5.2: Update Code Documentation
**Effort:** 30 minutes  
**Deliverable:** JSDoc in all new/modified files

Add comprehensive JSDoc to:
- `epub-image-extractor.ts`
- Updated methods in `visual-extractor.ts`
- Type definitions

**Commit:** `docs: add JSDoc for EPUB visual extraction`

---

## Implementation Order

```
Phase 1 (Core)
├── Task 1.1: Create epub-image-extractor.ts [2-3h]
└── Task 1.2: Add pre-filter heuristics [1h]

Phase 2 (Extend Visual Extractor)
├── Task 2.1: Add extractFromEpub() [2-3h]
├── Task 2.2: Add unified extract() [30m]
└── Task 2.3: Update types [30m]

Phase 3 (Integration)
├── Task 3.1: Update extract-visuals.ts [1h]
└── Task 3.2: Update seeding (if applicable) [1h]

Phase 4 (Testing)
├── Task 4.1: Unit tests [2h]
├── Task 4.2: Integration tests [1.5h]
└── Task 4.3: Create test fixtures [1h]

Phase 5 (Documentation)
├── Task 5.1: Update planning docs [30m]
└── Task 5.2: Update code docs [30m]
```

---

## Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Core | 2 tasks | 3-4 hours |
| Phase 2: Extend Extractor | 3 tasks | 3-4 hours |
| Phase 3: Integration | 2 tasks | 2 hours |
| Phase 4: Testing | 3 tasks | 4.5 hours |
| Phase 5: Documentation | 2 tasks | 1 hour |
| **Total** | **12 tasks** | **13.5-15.5 hours** |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| `epub` package image API limitations | High | Medium | Test early; fallback to ZIP + JSZip extraction |
| Chapter parsing accuracy | Medium | Medium | Use cheerio for robust HTML parsing |
| Large EPUBs slow extraction | Medium | Low | Stream images, progress callbacks |
| Classification accuracy on EPUB images | Medium | Low | Same classifier used for PDFs |
| Cover detection false positives | Low | Medium | Allow manual override flag |

---

## Success Criteria

### Must Have
- [ ] Extract images from EPUB files
- [ ] Classify images using local model
- [ ] Save semantic images with grayscale conversion
- [ ] Associate visuals with chapter context
- [ ] Skip cover/decorative images
- [ ] No regressions in PDF extraction

### Should Have
- [ ] Progress callbacks for EPUB extraction
- [ ] Unified `extract()` entry point
- [ ] Unit test coverage > 80%
- [ ] Integration test for end-to-end flow

### Nice to Have
- [ ] Chapter title extraction
- [ ] Image caption extraction from XHTML
- [ ] Support for EPUB 3 fixed-layout

---

## Dependencies

### Existing Dependencies (No Changes)
- `epub` - Already installed for EPUBDocumentLoader
- `sharp` - Already installed for image processing
- Local classifier (LayoutParser) - Already set up

### Optional New Dependencies
- `cheerio` - For robust HTML parsing (recommended)

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/infrastructure/visual-extraction/epub-image-extractor.ts` | Core EPUB image extraction |
| `src/__tests__/unit/epub-image-extractor.test.ts` | Unit tests |
| `src/__tests__/integration/epub-visual-extraction.test.ts` | Integration tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/infrastructure/visual-extraction/visual-extractor.ts` | Add `extractFromEpub()`, `extract()` |
| `src/infrastructure/visual-extraction/types.ts` | Add EPUB-specific fields |
| `scripts/extract-visuals.ts` | Support EPUB files |

---

## Future Considerations

1. **MOBI Support**: Similar approach could work for MOBI files (after conversion or with mobi library)
2. **Caption Extraction**: Parse `<figcaption>` elements for image captions
3. **EPUB 3 Fixed Layout**: Handle fixed-layout EPUBs (page-like structure)
4. **SVG Diagrams**: EPUBs may contain inline SVG diagrams - consider rasterization

---

**Last Updated:** 2026-01-04  
**Document Version:** 1.0

