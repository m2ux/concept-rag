# Ebook Format Support Implementation Plan

**Date**: November 15, 2025  
**Branch**: `feature/ebook-format-support`  
**Status**: Planning Phase

---

## Executive Summary

This document outlines the implementation plan for adding .mobi and .epub document format support to the concept-rag system. The implementation will extend the existing PDF processing pipeline to handle ebook formats while maintaining backward compatibility and code quality.

---

## Current State Analysis

### Existing PDF Processing Architecture

Based on codebase exploration, the current document processing flow is:

1. **File Discovery** (`hybrid_fast_seed.ts:666-688`)
   - `findPdfFilesRecursively()` - Scans directories for `.pdf` files
   - Hardcoded to only find PDF files

2. **Document Loading** (`hybrid_fast_seed.ts:690-939`)
   - `loadDocumentsWithErrorHandling()` - Main document processing entry point
   - Uses `PDFLoader` from `@langchain/community/document_loaders/fs/pdf`
   - Includes OCR fallback for scanned PDFs
   - Handles document hashing, deduplication, and chunk existence checking

3. **Document Processing** (`hybrid_fast_seed.ts:1085-1163`)
   - `processDocuments()` - Extracts concepts from loaded documents
   - Groups documents by source
   - Calls `ConceptExtractor` for LLM-based concept extraction
   - Generates content overview and document summaries

4. **Text Chunking** (Throughout seeding process)
   - Uses `RecursiveCharacterTextSplitter` from LangChain
   - Chunks are stored in LanceDB `chunks` table

### Key Dependencies

From `package.json`:
- `@langchain/community`: ^0.3.24 (provides PDF loader)
- `@langchain/core`: ^0.2.36 (Document class, text splitters)
- `pdf-parse`: ^1.1.1 (underlying PDF parsing)

### Extension Points Identified

1. **File Discovery**: Need to extend to find `.mobi` and `.epub` files
2. **Loader Selection**: Need factory/strategy to select appropriate loader
3. **Document Loading**: Need new loaders for MOBI and EPUB formats
4. **Error Handling**: Extend existing error handling for new formats
5. **Configuration**: May need format-specific configuration options

---

## Target Architecture

### Document Loader Abstraction

Create a clean abstraction for document loading:

```typescript
// Domain interface
interface DocumentLoader {
  canHandle(filePath: string): boolean;
  load(filePath: string): Promise<Document[]>;
  getSupportedExtensions(): string[];
}

// Factory for loader selection
class DocumentLoaderFactory {
  private loaders: DocumentLoader[];
  
  getLoader(filePath: string): DocumentLoader | null;
  getSupportedExtensions(): string[];
}

// Concrete implementations
class PDFDocumentLoader implements DocumentLoader { ... }
class EPUBDocumentLoader implements DocumentLoader { ... }
class MOBIDocumentLoader implements DocumentLoader { ... }
```

### File Discovery Enhancement

Extend file discovery to support multiple formats:

```typescript
async function findDocumentFilesRecursively(
  dir: string,
  extensions: string[] = ['.pdf', '.epub', '.mobi']
): Promise<string[]>
```

---

## Implementation Tasks

### Phase 1: Infrastructure & Abstraction (Foundation)

#### Task 1.1: Research Ebook Parsing Libraries
**Effort**: 1 hour  
**Deliverable**: Library selection document

Research and select appropriate libraries for parsing:
- **EPUB**: 
  - Option 1: `epub` (npm package)
  - Option 2: `epub-parser`
  - Option 3: Manual ZIP + XML parsing with `jszip` + `cheerio`
- **MOBI**:
  - Option 1: `mobi` (npm package)
  - Option 2: `node-mobi`
  - Option 3: Conversion to EPUB first (via `calibre` or similar)

**Decision Criteria**:
- TypeScript support
- Maintenance status
- Text extraction quality
- Metadata extraction capabilities
- LangChain integration ease

#### Task 1.2: Add Dependencies
**Effort**: 15 minutes  
**Deliverable**: Updated `package.json`

Add selected libraries to project:
```bash
npm install <epub-library> <mobi-library>
npm install --save-dev @types/<library> # if available
```

#### Task 1.3: Create Document Loader Interface
**Effort**: 30 minutes  
**Deliverable**: `src/infrastructure/document-loaders/document-loader.ts`

Create clean abstraction:
```typescript
// src/infrastructure/document-loaders/document-loader.ts
export interface IDocumentLoader {
  canHandle(filePath: string): boolean;
  load(filePath: string): Promise<Document[]>;
  getSupportedExtensions(): string[];
}
```

**Commit**: `feat: add document loader abstraction interface`

#### Task 1.4: Create Document Loader Factory
**Effort**: 45 minutes  
**Deliverable**: `src/infrastructure/document-loaders/document-loader-factory.ts`

Implement factory pattern for loader selection:
```typescript
export class DocumentLoaderFactory {
  private loaders: IDocumentLoader[] = [];
  
  registerLoader(loader: IDocumentLoader): void;
  getLoader(filePath: string): IDocumentLoader | null;
  getSupportedExtensions(): string[];
}
```

**Commit**: `feat: add document loader factory with loader registration`

#### Task 1.5: Wrap Existing PDF Loader
**Effort**: 30 minutes  
**Deliverable**: `src/infrastructure/document-loaders/pdf-loader.ts`

Wrap LangChain's PDFLoader in our abstraction:
```typescript
export class PDFDocumentLoader implements IDocumentLoader {
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.pdf');
  }
  
  async load(filePath: string): Promise<Document[]> {
    const loader = new PDFLoader(filePath);
    return await loader.load();
  }
  
  getSupportedExtensions(): string[] {
    return ['.pdf'];
  }
}
```

**Commit**: `feat: wrap PDF loader in document loader interface`

---

### Phase 2: EPUB Support

#### Task 2.1: Implement EPUB Text Extraction
**Effort**: 2-3 hours  
**Deliverable**: `src/infrastructure/document-loaders/epub-loader.ts`

Create EPUB loader:
1. Extract ZIP contents to temp directory or memory
2. Parse `META-INF/container.xml` to find OPF file
3. Parse OPF file to get reading order
4. Extract text from XHTML/HTML chapters in order
5. Parse metadata (title, author, ISBN)
6. Convert to LangChain Document format

```typescript
export class EPUBDocumentLoader implements IDocumentLoader {
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.epub');
  }
  
  async load(filePath: string): Promise<Document[]> {
    // Implementation details
  }
  
  getSupportedExtensions(): string[] {
    return ['.epub'];
  }
  
  private async extractText(epubFile: string): Promise<string>;
  private async extractMetadata(epubFile: string): Promise<Record<string, any>>;
}
```

**Challenges**:
- EPUB files contain HTML/XHTML - need to strip tags
- Multiple chapters - decide on Document boundaries (one per chapter vs. one per book)
- Images and other media - ignore for text extraction
- Different EPUB versions (2.0 vs 3.0)

**Commit**: `feat: implement EPUB document loader with text extraction`

#### Task 2.2: Add EPUB Unit Tests
**Effort**: 1 hour  
**Deliverable**: `src/__tests__/infrastructure/epub-loader.test.ts`

Test cases:
- Load valid EPUB file
- Extract text content
- Extract metadata
- Handle malformed EPUB
- Handle missing files in EPUB structure
- Handle different EPUB versions

**Commit**: `test: add unit tests for EPUB document loader`

---

### Phase 3: MOBI Support

#### Task 3.1: Implement MOBI Text Extraction
**Effort**: 2-3 hours  
**Deliverable**: `src/infrastructure/document-loaders/mobi-loader.ts`

Create MOBI loader:
1. Parse MOBI file structure (PalmDB format)
2. Detect MOBI type (MOBI 7 vs KF8)
3. Extract text content
4. Parse EXTH metadata records
5. Convert to LangChain Document format

```typescript
export class MOBIDocumentLoader implements IDocumentLoader {
  canHandle(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return ext.endsWith('.mobi') || ext.endsWith('.azw') || ext.endsWith('.azw3');
  }
  
  async load(filePath: string): Promise<Document[]> {
    // Implementation details
  }
  
  getSupportedExtensions(): string[] {
    return ['.mobi', '.azw', '.azw3'];
  }
  
  private async extractText(mobiFile: string): Promise<string>;
  private async extractMetadata(mobiFile: string): Promise<Record<string, any>>;
}
```

**Challenges**:
- MOBI format is more complex than EPUB
- Multiple format variants (MOBI 7, KF8/AZW3)
- May contain DRM (handle gracefully with error)
- Binary format - need proper parsing library

**Alternative Approach**: 
If MOBI parsing is too complex, consider conversion:
1. Use `calibre` CLI tool to convert MOBI → EPUB
2. Then use EPUB loader
3. Cache converted files

**Commit**: `feat: implement MOBI document loader with text extraction`

#### Task 3.2: Add MOBI Unit Tests
**Effort**: 1 hour  
**Deliverable**: `src/__tests__/infrastructure/mobi-loader.test.ts`

Test cases:
- Load valid MOBI file
- Extract text content
- Extract metadata
- Handle malformed MOBI
- Handle DRM-protected files (error handling)
- Handle different MOBI variants

**Commit**: `test: add unit tests for MOBI document loader`

---

### Phase 4: Integration

#### Task 4.1: Update File Discovery
**Effort**: 30 minutes  
**Deliverable**: Updated `hybrid_fast_seed.ts`

Refactor `findPdfFilesRecursively` to `findDocumentFilesRecursively`:
```typescript
async function findDocumentFilesRecursively(
  dir: string,
  extensions: string[] = ['.pdf', '.epub', '.mobi']
): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(directory: string) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await scan(dir);
  return files;
}
```

**Commit**: `refactor: generalize file discovery to support multiple document formats`

#### Task 4.2: Update Document Loading
**Effort**: 1 hour  
**Deliverable**: Updated `hybrid_fast_seed.ts`

Refactor `loadDocumentsWithErrorHandling`:
1. Rename from `pdfFile` → `docFile` for clarity
2. Replace direct `PDFLoader` usage with factory:
   ```typescript
   const factory = new DocumentLoaderFactory();
   factory.registerLoader(new PDFDocumentLoader());
   factory.registerLoader(new EPUBDocumentLoader());
   factory.registerLoader(new MOBIDocumentLoader());
   
   const loader = factory.getLoader(docFile);
   if (!loader) {
     throw new Error(`No loader found for: ${docFile}`);
   }
   
   const docs = await loader.load(docFile);
   ```
3. Keep OCR fallback for PDFs only
4. Update progress messages to be format-agnostic

**Commit**: `refactor: use document loader factory in seeding process`

#### Task 4.3: Update Configuration
**Effort**: 30 minutes  
**Deliverable**: Updated `src/config.ts`

Add configuration for supported formats:
```typescript
export const SUPPORTED_DOCUMENT_EXTENSIONS = ['.pdf', '.epub', '.mobi', '.azw', '.azw3'];
export const EBOOK_PROCESSING_OPTIONS = {
  stripHtml: true,
  preserveFormatting: false,
  extractImages: false
};
```

**Commit**: `config: add configuration for ebook format support`

---

### Phase 5: Testing & Validation

#### Task 5.1: Create Test Ebook Files
**Effort**: 30 minutes  
**Deliverable**: `test/fixtures/ebooks/`

Create or obtain small test ebooks:
- `sample.epub` - Valid EPUB 2.0/3.0 file
- `sample.mobi` - Valid MOBI file
- `malformed.epub` - Corrupted EPUB for error testing
- `malformed.mobi` - Corrupted MOBI for error testing

**Commit**: `test: add ebook test fixtures`

#### Task 5.2: Integration Tests
**Effort**: 1-2 hours  
**Deliverable**: `test/integration/ebook-processing.test.ts`

End-to-end tests:
1. Seed database with mixed PDF/EPUB/MOBI files
2. Verify documents are loaded correctly
3. Verify concepts are extracted
4. Verify chunks are created
5. Verify search works across all formats
6. Test error handling for each format

**Commit**: `test: add integration tests for ebook format processing`

#### Task 5.3: Manual Testing
**Effort**: 1 hour  
**Deliverable**: Testing report

Manual verification:
1. Run seeding with real ebook files
2. Verify text extraction quality
3. Verify metadata extraction
4. Test concept search on ebook content
5. Verify no regressions with PDF files

**Document findings** in `02-testing-results.md`

---

### Phase 6: Documentation & Polish

#### Task 6.1: Update README
**Effort**: 30 minutes  
**Deliverable**: Updated `README.md`

Update documentation:
- Add .mobi and .epub to supported formats list
- Update installation instructions if needed
- Add examples of ebook processing
- Update FAQ with ebook-specific questions

**Commit**: `docs: update README with ebook format support`

#### Task 6.2: Update Usage Documentation
**Effort**: 30 minutes  
**Deliverable**: Updated `USAGE.md`

Add ebook-specific usage examples:
```bash
# Seed with ebooks
npx tsx hybrid_fast_seed.ts --filesdir ~/ebooks --dbpath ~/.concept_rag
```

**Commit**: `docs: add ebook usage examples`

#### Task 6.3: Update Troubleshooting Guide
**Effort**: 30 minutes  
**Deliverable**: Updated `TROUBLESHOOTING.md`

Add ebook-specific troubleshooting:
- EPUB parsing failures
- MOBI format issues
- DRM-protected files
- Character encoding problems

**Commit**: `docs: add ebook troubleshooting guide`

#### Task 6.4: Add JSDoc Documentation
**Effort**: 30 minutes  
**Deliverable**: JSDoc comments in loader files

Document all public interfaces and classes following project standards.

**Commit**: `docs: add JSDoc documentation for document loaders`

---

## Implementation Order Summary

### Recommended Sequence

1. **Phase 1** (Infrastructure) - Tasks 1.1 → 1.5
2. **Phase 2** (EPUB) - Tasks 2.1 → 2.2
3. **Phase 4.1-4.2** (Partial Integration) - Test EPUB works end-to-end
4. **Phase 3** (MOBI) - Tasks 3.1 → 3.2
5. **Phase 4.3** (Complete Integration) - Configuration
6. **Phase 5** (Testing) - Tasks 5.1 → 5.3
7. **Phase 6** (Documentation) - Tasks 6.1 → 6.4

### Alternative: Incremental Approach

Implement one format at a time with full integration:
1. Infrastructure (Phase 1)
2. EPUB only (Phase 2 + Integration + Testing)
3. MOBI only (Phase 3 + Integration + Testing)
4. Documentation (Phase 6)

---

## Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Infrastructure | 5 tasks | 3 hours |
| Phase 2: EPUB Support | 2 tasks | 3-4 hours |
| Phase 3: MOBI Support | 2 tasks | 3-4 hours |
| Phase 4: Integration | 3 tasks | 2 hours |
| Phase 5: Testing | 3 tasks | 2.5-3 hours |
| Phase 6: Documentation | 4 tasks | 2 hours |
| **Total** | **19 tasks** | **15.5-18 hours** |

**Note**: Times are estimates for agentic implementation. May vary based on library complexity and issues encountered.

---

## Risk Assessment

### High Risk Areas

1. **MOBI Format Complexity**
   - **Risk**: MOBI parsing libraries may be immature or unmaintained
   - **Mitigation**: Research thoroughly; consider conversion approach as fallback

2. **DRM-Protected Files**
   - **Risk**: Cannot read DRM-protected ebooks legally or technically
   - **Mitigation**: Graceful error handling; clear documentation

3. **Text Extraction Quality**
   - **Risk**: Ebook text may have poor formatting, missing content
   - **Mitigation**: Extensive testing; consider format-specific post-processing

### Medium Risk Areas

4. **Memory Usage**
   - **Risk**: Loading large ebooks into memory
   - **Mitigation**: Stream processing where possible; test with large files

5. **Character Encoding**
   - **Risk**: Non-UTF-8 encodings in old ebooks
   - **Mitigation**: Proper encoding detection and conversion

### Low Risk Areas

6. **Breaking Changes**
   - **Risk**: Changes break existing PDF processing
   - **Mitigation**: Good test coverage; maintain backward compatibility

---

## Success Criteria

### Must Have
- ✅ Successfully load and index .epub files
- ✅ Successfully load and index .mobi files
- ✅ Text extraction quality comparable to PDF
- ✅ All existing tests pass (no regressions)
- ✅ New format-specific tests added and passing
- ✅ Documentation updated

### Should Have
- ✅ Graceful handling of malformed files
- ✅ Metadata extraction (title, author)
- ✅ Performance comparable to PDF processing
- ✅ Clear error messages for unsupported features (DRM)

### Nice to Have
- 🎯 Support for additional formats (.azw, .azw3)
- 🎯 Format conversion fallbacks
- 🎯 Image extraction from ebooks
- 🎯 Table of contents preservation

---

## Dependencies & Prerequisites

### Technical Dependencies
- Node.js environment (existing)
- TypeScript (existing)
- LangChain packages (existing)
- Selected ebook parsing libraries (to be added)

### Knowledge Prerequisites
- EPUB format specification
- MOBI format basics
- ZIP file handling
- XML/HTML parsing
- LangChain document loader patterns

---

## Rollback Plan

If implementation encounters critical issues:

1. **Revert Strategy**: All changes are on feature branch - can abandon branch
2. **Partial Rollback**: Remove specific format support (e.g., keep EPUB, remove MOBI)
3. **Graceful Degradation**: If a format fails, skip it and continue with others

---

## Post-Implementation Tasks

After successful implementation:

1. **Performance Benchmarking**: Compare ebook vs PDF processing speed
2. **User Feedback Collection**: Gather feedback on text extraction quality
3. **Enhancement Roadmap**: Identify future improvements:
   - Additional formats (.azw, .txt, .rtf)
   - Better HTML stripping/formatting
   - Chapter-level chunking
   - Image and diagram extraction

---

## References

### Format Specifications
- EPUB 3.3 Specification: https://www.w3.org/TR/epub-33/
- EPUB 2.0 Specification: http://idpf.org/epub/20/spec/
- MOBI Format Documentation: https://wiki.mobileread.com/wiki/MOBI

### Library Documentation
- LangChain Document Loaders: https://js.langchain.com/docs/modules/data_connection/document_loaders/
- LangChain Community Loaders: https://js.langchain.com/docs/integrations/document_loaders/

### Related Project Files
- `hybrid_fast_seed.ts` - Main seeding script
- `src/config.ts` - Configuration
- `package.json` - Dependencies
- `src/infrastructure/` - Infrastructure layer

---

**Last Updated**: November 15, 2025  
**Document Version**: 1.0

