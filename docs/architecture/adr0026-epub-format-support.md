# 26. EPUB Format Support

**Date:** 2025-11-15  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Ebook Format Support (November 15, 2025)

**Sources:**
- Planning: [2025-11-15-ebook-format-support](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-15-ebook-format-support/)
- Git Commit: 3ff26f4b61be602038de0d0019ff4028e6d2185a (November 15, 2024)

## Context and Problem Statement

The system only supported PDF files [ADR-0005], limiting usability for users with ebook collections [Limitation: single format]. EPUB is a popular ebook format, especially for fiction and Project Gutenberg content [Context: ebook ecosystem]. Users wanted to index EPUB files alongside PDFs in their knowledge base.

**The Core Problem:** How to add EPUB support while maintaining the same concept extraction and search quality as PDFs? [Planning: [01-implementation-plan.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/planning/2025-11-15-ebook-format-support/01-implementation-plan.md)]

**Decision Drivers:**
* User request for EPUB support [Requirement: ebook format]
* EPUB is open standard (widely used) [Context: format popularity]
* Factory pattern enables easy addition [Architecture: extensibility] [ADR-0025]
* Maintain consistent processing pipeline [Requirement: quality parity]
* Project Gutenberg uses EPUB [Use case: public domain books]

## Alternative Options

* **Option 1: Native EPUB Support** - Parse EPUB directly with `epub` npm package
* **Option 2: Convert EPUB→PDF** - Pre-convert to PDF, then process
* **Option 3: Convert EPUB→HTML** - Extract HTML, then parse
* **Option 4: Convert EPUB→Markdown** - Extract to Markdown
* **Option 5: Skip EPUB** - PDF-only, don't support ebooks

## Decision Outcome

**Chosen option:** "Native EPUB Support (Option 1)", because it provides direct text extraction from EPUB structure, preserves reading order, extracts rich metadata, and integrates cleanly via the document loader factory [ADR-0025].

### Implementation

**Library:** `epub` npm package v1.3.0 [Source: `package.json`; `02-implementation-complete.md`, line 63]

**Loader:** `src/infrastructure/document-loaders/epub-loader.ts` [Source: `02-implementation-complete.md`, line 25]

**Process:** [Source: `02-implementation-complete.md`, lines 34-49]
```typescript
class EPUBDocumentLoader implements IDocumentLoader {
  async load(filePath: string): Promise<Document[]> {
    // 1. Parse EPUB structure
    const epub = await EPub.createAsync(filePath);
    
    // 2. Extract all chapters in spine order
    const chapters = [];
    for (const item of epub.flow) {
      const chapter = await epub.getChapterAsync(item.id);
      chapters.push(chapter);
    }
    
    // 3. Clean HTML (strip tags, convert entities)
    const text = chapters
      .map(chapter => stripHtmlTags(chapter))
      .join('\n\n');
    
    // 4. Extract metadata
    const metadata = {
      title: epub.metadata.title,
      author: epub.metadata.creator,
      language: epub.metadata.language,
      publisher: epub.metadata.publisher
    };
    
    // 5. Return as single Document
    return [{
      pageContent: text,
      metadata: { source: filePath, ...metadata }
    }];
  }
}
```

**Features:** [Source: lines 42-49]
- ✅ Text extraction from XHTML/HTML chapters
- ✅ Rich metadata (title, author, publisher, language, date, description)
- ✅ HTML tag stripping for clean text
- ✅ HTML entity conversion (&amp; → &)
- ✅ Chapter order preservation (spine)
- ✅ Empty chapter handling
- ✅ Error handling for corrupted EPUBs

### Integration

**File Discovery:** [Source: `02-implementation-complete.md`, lines 54-56]
```typescript
// Before
const pdfFiles = await findPdfFilesRecursively(filesDir);

// After
const factory = new DocumentLoaderFactory();
const docFiles = await findDocumentFilesRecursively(
  filesDir, 
  factory.getSupportedExtensions()  // ['.pdf', '.epub']
);
```

**Document Loading:** [Source: lines 54-61]
```typescript
const loader = factory.getLoader(filePath);
if (!loader) {
  console.warn(`No loader for ${filePath}`);
  continue;
}
const documents = await loader.load(filePath);
```

### Consequences

**Positive:**
* **EPUB support:** Can now index ebook collections [Feature: `README.md` FAQ line 130]
* **Metadata rich:** Better than PDF metadata extraction [Quality: author, title, etc.]
* **Clean text:** HTML stripped properly [Quality: readable]
* **Factory integration:** Clean addition via pattern [Architecture: extensible]
* **Same pipeline:** Concept extraction works identically [Consistency: unified]
* **3 sample EPUBs:** Tested with public domain books [Validation: tested] [Source: `02-implementation-complete.md`, lines 66-72]
* **Public domain friendly:** Project Gutenberg books work perfectly [Use case: free books]

**Negative:**
* **New dependency:** `epub` package (1.3.0) added [Dependency: npm package]
* **EPUB complexity:** EPUB format has edge cases (DRM, multimedia) [Limitation: complex format]
* **Single document:** Entire book as one doc (unlike PDF with pages) [Trade-off: granularity]
* **No page numbers:** EPUBs don't have fixed pagination [Limitation: format nature]

**Neutral:**
* **HTML stripping:** Loses some formatting (tables, lists) [Trade-off: text vs. structure]
* **Chapter concatenation:** All chapters combined [Design: single document]

### Confirmation

**Test Results:** [Source: `02-implementation-complete.md`, lines 76-141]

**Sample Books Processed:**
1. **Alice in Wonderland** (Lewis Carroll) - 196 KB
   - Summary: ✅ Generated
   - Concepts: ✅ Extracted (22 concepts)
   - Chunks: ✅ Created
   - Search: ✅ Findable

2. **Frankenstein** (Mary Shelley) - 351 KB
   - All processing successful

3. **Pride and Prejudice** (Jane Austen) - 548 KB
   - All processing successful

**Integration Test:**
- Catalog search: ✅ Found by title
- Concept search: ✅ Found by concepts
- Chunks search: ✅ Found by content

## Pros and Cons of the Options

### Option 1: Native EPUB Support - Chosen

**Pros:**
* Direct parsing (no conversion)
* Rich metadata extraction
* Clean text output
* Factory pattern integration [ADR-0025]
* 3 EPUBs tested successfully [Validated]
* Works with Project Gutenberg

**Cons:**
* New dependency (`epub` package)
* EPUB format complexity
* Single document per book
* No page numbers

### Option 2: Convert EPUB→PDF

Pre-convert EPUBs to PDF before processing.

**Pros:**
* Reuse all PDF code (no new code)
* Single format internally

**Cons:**
* **Quality loss:** Conversion introduces artifacts [Problem: lossy]
* **External tool:** Requires calibre or similar [Dependency: heavy ~300MB]
* **User workflow:** Extra conversion step [UX: friction]
* **Slower:** Conversion + processing [Performance: overhead]
* **Defeats purpose:** EPUB is already structured text [Philosophy: unnecessary]

### Option 3: Convert EPUB→HTML

Extract HTML chapters, process as HTML.

**Pros:**
* Structured content
* Can preserve formatting

**Cons:**
* **Same as native:** EPUB IS HTML internally [Redundancy: equivalent]
* **Why convert?:** Direct extraction better [Logic: simpler]
* **No benefit:** Native approach does this already

### Option 4: Convert EPUB→Markdown

Extract and convert to Markdown first.

**Pros:**
* Markdown is clean
* Preserves some structure (headers, lists)

**Cons:**
* **Extra step:** HTML → Markdown conversion [Complexity: conversion]
* **Library needed:** HTML→Markdown converter [Dependency: another package]
* **Marginal benefit:** Plain text sufficient for concepts [Use case: text-focused]
* **Overhead:** Conversion adds processing time

### Option 5: Skip EPUB

Don't support ebooks, PDF-only.

**Pros:**
* Zero effort
* No new code
* Status quo

**Cons:**
* **Incomplete:** Users can't index ebook collections [Problem: limitation]
* **Against goal:** Comprehensive knowledge base [Philosophy: completeness]
* **User request:** Specifically requested [Requirement: unmet]
* **Easy to add:** Factory pattern makes it simple [Opportunity: low effort]

## Implementation Notes

### EPUB Structure

**Format:** [EPUB specification]
- ZIP container with XHTML/HTML content
- spine.opf: Reading order
- content.opf: Metadata
- Multiple chapter files

**Parsing:**
```typescript
const epub = await EPub.createAsync(filePath);
// epub.metadata: { title, creator, language, ... }
// epub.flow: [{ id, href }, ...] // Chapters in order
// epub.getChapterAsync(id): Promise<string> // HTML content
```

### HTML Cleaning

**Strip Tags:**
```typescript
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')         // Remove HTML tags
    .replace(/&amp;/g, '&')          // Convert entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
```

### Metadata Mapping

**EPUB → Document Metadata:**
- title → title
- creator → author
- publisher → publisher
- language → language
- date → published_date
- description → description

**Richer than PDF:** EPUBs have structured metadata vs. PDF filename parsing

### Sample Files

**Added:** [Source: `02-implementation-complete.md`, lines 66-72]
- `sample-docs/alice-in-wonderland.epub` (196 KB)
- `sample-docs/frankenstein.epub` (351 KB)
- `sample-docs/pride-and-prejudice.epub` (548 KB)

All from Project Gutenberg (public domain)

## Related Decisions

- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md) - Original format support
- [ADR-0025: Document Loader Factory](adr0025-document-loader-factory.md) - Factory enables EPUB
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Works same for EPUB

## References

### Related Decisions
- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md)
- [ADR-0025: Document Loader Factory](adr0025-document-loader-factory.md)

---

**Confidence Level:** HIGH  
**Attribution:**
- Planning docs: November 15, 2024
- Git commit: 3ff26f4b
- Testing: 02-implementation-complete.md lines 76-141

**Traceability:** [2025-11-15-ebook-format-support](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-11-15-ebook-format-support/)


