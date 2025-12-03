# 25. Document Loader Factory Pattern

**Date:** 2025-11-15  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Ebook Format Support (November 15, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-15-ebook-format-support/

## Context and Problem Statement

The system only supported PDF files hardcoded in `findPdfFilesRecursively()` [Source: `.ai/planning/2025-11-15-ebook-format-support/02-implementation-complete.md`, lines 54-55]. Adding EPUB support required a clean abstraction for document loading to avoid format-specific code scattered throughout the seeding script [Problem: extensibility].

**The Core Problem:** How to support multiple document formats (PDF, EPUB, potentially MOBI, DOCX) without cluttering the seeding pipeline with format-specific logic? [Planning: `01-implementation-plan.md`, Target Architecture]

**Decision Drivers:**
* Need EPUB support (ebook format) [Requirement: format support]
* Prepare for future formats (MOBI, DOCX, TXT) [Future: extensibility]
* Keep seeding script clean (format-agnostic) [Architecture: separation]
* Reuse existing PDF loader [Efficiency: don't rebuild]
* Follow design patterns (Factory, Strategy, Adapter) [Quality: best practices]

## Alternative Options

* **Option 1: Factory Pattern with Strategy** - Factory selects loader, loaders implement interface
* **Option 2: If-Else Chain** - Direct format checking in seeding script
* **Option 3: Plugin System** - Dynamic loader registration
* **Option 4: One Loader Per Table** - Separate processing per format
* **Option 5: Convert All to PDF** - Pre-process EPUB→PDF

## Decision Outcome

**Chosen option:** "Factory Pattern with Strategy (Option 1)", because it provides clean separation, extensibility for future formats, and follows industry best practices with minimal complexity.

### Implementation

**Files Created:** [Source: `02-implementation-complete.md`, lines 21-25]
1. `src/infrastructure/document-loaders/document-loader.ts` - IDocumentLoader interface
2. `src/infrastructure/document-loaders/document-loader-factory.ts` - Factory
3. `src/infrastructure/document-loaders/pdf-loader.ts` - PDF adapter
4. `src/infrastructure/document-loaders/epub-loader.ts` - EPUB loader

**Interface:** [Source: planning, interface design]
```typescript
interface IDocumentLoader {
  canHandle(filePath: string): boolean;
  load(filePath: string): Promise<Document[]>;
  getSupportedExtensions(): string[];
}
```

**Factory:** [Source: Implementation]
```typescript
class DocumentLoaderFactory {
  private loaders: IDocumentLoader[];
  
  constructor() {
    this.loaders = [
      new PDFDocumentLoader(),
      new EPUBDocumentLoader()
    ];
  }
  
  getLoader(filePath: string): IDocumentLoader | null {
    return this.loaders.find(loader => loader.canHandle(filePath)) || null;
  }
  
  getSupportedExtensions(): string[] {
    return this.loaders.flatMap(loader => loader.getSupportedExtensions());
    // Returns: ['.pdf', '.epub']
  }
}
```

**Usage in Seeding:** [Source: `02-implementation-complete.md`, lines 54-61]
```typescript
// Before: Hardcoded PDF
const pdfFiles = await findPdfFilesRecursively(filesDir);
const doc = await PDFLoader.load(filePath);

// After: Factory pattern
const factory = new DocumentLoaderFactory();
const docFiles = await findDocumentFilesRecursively(filesDir, factory.getSupportedExtensions());
const loader = factory.getLoader(filePath);
const doc = await loader.load(filePath);
```

### Design Patterns Applied

**1. Strategy Pattern:** [Pattern: interchangeable algorithms]
- IDocumentLoader interface
- Multiple implementations (PDF, EPUB)
- Runtime selection

**2. Factory Pattern:** [Pattern: object creation]
- DocumentLoaderFactory creates appropriate loader
- Centralizes loader selection logic
- Easy to add new loaders

**3. Adapter Pattern:** [Pattern: interface adaptation]
- PDFDocumentLoader wraps existing PDFLoader
- Adapts to IDocumentLoader interface
- Reuses existing code

### Consequences

**Positive:**
* **Extensible:** Add new formats by implementing interface [Benefit: `02-implementation-complete.md`, line 23]
* **Clean seeding script:** Format-agnostic processing [Benefit: separation]
* **Type-safe:** Interface enforces contracts [Safety: TypeScript]
* **Testable:** Can mock IDocumentLoader [Testing: unit testable]
* **DRY:** Factory logic centralized [Pattern: single responsibility]
* **Adapter reuse:** Existing PDF code wrapped, not rewritten [Efficiency: reuse]

**Negative:**
* **More files:** 4 new files for abstraction [Trade-off: file count]
* **Indirection:** One more layer to navigate [Complexity: abstraction]
* **Over-engineering risk:** Pattern may be overkill for 2 formats [Risk: premature]

**Neutral:**
* **Standard patterns:** Well-known GoF patterns [Familiarity: established]
* **Easy to extend:** Add format = implement interface [Process: clear]

### Confirmation

**Implementation Validated:** [Source: `02-implementation-complete.md`, testing results]
- ✅ PDF loading still works (adapter successful)
- ✅ EPUB loading works (new loader functional)
- ✅ Factory selects correct loader based on extension
- ✅ 3 sample EPUB files processed successfully

**File Discovery:** [Source: lines 54-56]
- `findDocumentFilesRecursively()` now finds both .pdf and .epub
- Extensions provided by factory (extensible)

## Pros and Cons of the Options

### Option 1: Factory Pattern with Strategy - Chosen

**Pros:**
* Clean extensibility (just implement interface)
* Separation of concerns
* Testable
* Type-safe
* Pattern-based (Factory + Strategy + Adapter)
* 3 EPUBs tested successfully [Validated]

**Cons:**
* 4 new files
* Abstraction overhead
* Potential over-engineering

### Option 2: If-Else Chain

Direct format checking in seeding script.

**Pros:**
* Simplest (no abstraction)
* Fewer files
* Direct and obvious

**Cons:**
* **Seeding script cluttered:** Format logic mixed in [Problem: mixed concerns]
* **Not extensible:** Adding format = modify script [Maintenance: brittle]
* **Not testable:** Can't unit test format logic [Testing: integration only]
* **Violates SRP:** Seeding script does too much [Problem: god function]

### Option 3: Plugin System

Dynamic loader registration at runtime.

**Pros:**
* Most flexible
* Third-party loaders possible
* Dynamic discovery

**Cons:**
* **Over-engineering:** Don't need dynamic plugins [Complexity: unnecessary]
* **More complex:** Registration system, plugin loading [Effort: high]
* **YAGNI:** Won't need third-party loaders [Principle: over-design]
* **Static sufficient:** Know all formats at compile time

### Option 4: One Loader Per Table

Separate processing pipeline per format.

**Pros:**
* Format-optimized processing
* Independent pipelines

**Cons:**
* **Massive duplication:** Same concept extraction, chunking, etc. [Problem: DRY violation]
* **Inconsistent:** Formats processed differently [Risk: divergence]
* **Hard to maintain:** Changes must be made N times [Maintenance: nightmare]
* **Against architecture:** Unified pipeline is strength

### Option 5: Convert All to PDF

Pre-process EPUB→PDF before indexing.

**Pros:**
* Single format to handle
* Reuse all PDF code

**Cons:**
* **Quality loss:** EPUB→PDF conversion lossy [Problem: degradation]
* **Extra step:** Users must convert first [UX: poor]
* **External tool:** Requires calibre or similar [Dependency: heavy]
* **Defeats purpose:** EPUB is already text format [Philosophy: unnecessary]

## Implementation Notes

### Adding New Format

**Process:** [Extensibility demonstration]
```typescript
// 1. Create loader
class DOCXDocumentLoader implements IDocumentLoader {
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.docx');
  }
  
  getSupportedExtensions(): string[] {
    return ['.docx'];
  }
  
  async load(filePath: string): Promise<Document[]> {
    // DOCX parsing logic
  }
}

// 2. Register in factory
constructor() {
  this.loaders = [
    new PDFDocumentLoader(),
    new EPUBDocumentLoader(),
    new DOCXDocumentLoader()  // Add here
  ];
}

// 3. Done! Seeding script automatically supports DOCX
```

### Adapter Pattern for PDF

**Wrapping Existing Code:** [Design: reuse]
```typescript
class PDFDocumentLoader implements IDocumentLoader {
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.pdf');
  }
  
  async load(filePath: string): Promise<Document[]> {
    // Wrap existing PDF loading logic (OCR fallback, etc.)
    return await loadPDFWithOCRFallback(filePath);
  }
}
```

**Benefit:** Existing PDF code (including OCR fallback) reused without modification

## Related Decisions

- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md) - Original PDF support
- [ADR-0012: OCR Fallback](adr0012-ocr-fallback-tesseract.md) - PDF-specific fallback
- [ADR-0026: EPUB Support](adr0026-epub-format-support.md) - First alternative format

## References

### Related Decisions
- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md)
- [ADR-0026: EPUB Support](adr0026-epub-format-support.md)

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 15, 2024
- Documented in: 01-implementation-plan.md, 02-implementation-complete.md lines 19-30

**Traceability:** .ai/planning/2025-11-15-ebook-format-support/
