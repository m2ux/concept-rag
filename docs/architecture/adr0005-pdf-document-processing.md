# 5. PDF Document Processing with pdf-parse

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational PDF processing from upstream lance-mcp project  

**Sources:**
- Git Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2 (November 19, 2024, lance-mcp upstream)

## Context and Problem Statement

The project needed to extract text from PDF documents for indexing and search. PDFs are the primary document format for technical books, papers, and documentation. The solution needed to handle various PDF types (text-based and scanned) and integrate with the TypeScript/Node.js stack.

**Decision Drivers:**
* Primary format is PDF (technical books, papers)
* Need text extraction for chunking and indexing
* TypeScript/Node.js compatibility required
* Simple integration preferred
* Cost-effective (prefer open-source)
* Acceptable accuracy for text-based PDFs

## Alternative Options

* **Option 1: pdf-parse** - Pure JavaScript PDF parser
* **Option 2: pdf.js** - Mozilla's PDF renderer (also supports text extraction)
* **Option 3: pdftotext** - Command-line tool (poppler)
* **Option 4: PyPDF2/pdfplumber** - Python libraries (via child process)
* **Option 5: Commercial API** - (e.g., Adobe PDF Services)

## Decision Outcome

**Chosen option:** "pdf-parse (Option 1)"

### Configuration

```typescript
import pdf from 'pdf-parse';
import fs from 'fs/promises';

async function extractPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;  // Extracted text
}
```

### Integration in Pipeline

```typescript
// From lance-mcp src/seed.ts
const directoryLoader = new DirectoryLoader(
  filesDir,
  {
   ".pdf": (path: string) => new PDFLoader(path),
  },
);

const rawDocs = await directoryLoader.load();
// PDFLoader uses pdf-parse internally
```
[Source: lance-mcp `src/seed.ts`, lines 69-74]

### Consequences

**Positive:**
* **Simple Integration**: Pure JavaScript, no external dependencies
* **Async/Await**: Modern async API fits Node.js patterns
* **Lightweight**: No heavy dependencies or binaries
* **Fast**: Good performance for text-based PDFs
* **npm Package**: Easy installation and updates
* **TypeScript Types**: Type definitions available

**Negative:**
* **Scanned PDFs**: Cannot extract text from scanned documents (images only)
* **Complex Layouts**: Struggles with multi-column layouts, tables
* **Font Issues**: Problems with embedded fonts or special characters
* **No OCR**: Cannot handle image-based PDFs
* **Limited Metadata**: Basic metadata extraction only

**Neutral:**
* **Accuracy**: ~95% for simple text PDFs, lower for complex layouts
* **Maintenance**: Actively maintained but not as robust as commercial tools

### Confirmation

Decision validated by:
- **165 documents** processed successfully in production
- **Fallback added**: OCR fallback for scanned PDFs (Oct 21, 2025)
- **Acceptable accuracy**: Text extraction quality sufficient for search
- **Zero cost**: No API fees or licensing costs
- **Robustness**: Graceful error handling implemented

### Evolution: OCR Fallback

**October 21, 2025**: Added Tesseract OCR fallback for scanned documents

See [ADR-0012: OCR Fallback Strategy](adr0012-ocr-fallback.md)

## Pros and Cons of the Options

### Option 1: pdf-parse (Chosen)

**Pros:**
* Pure JavaScript (no external dependencies)
* Simple async API
* TypeScript support
* Lightweight
* Fast for text PDFs
* Free and open-source

**Cons:**
* No OCR (scanned PDFs unsupported initially)
* Struggles with complex layouts
* Limited font support
* Basic metadata only

### Option 2: pdf.js

**Pros:**
* Robust (Mozilla project)
* Good layout handling
* Can render PDFs (not needed)

**Cons:**
* More complex API
* Heavier weight
* Designed for rendering, not just text extraction
* Overkill for server-side text extraction

### Option 3: pdftotext (poppler)

**Pros:**
* Very accurate
* Handles complex layouts well
* Mature and tested
* Fast

**Cons:**
* **External dependency**: Requires poppler installation
* Cross-platform complexity (Windows/Mac/Linux)
* Child process overhead
* Not pure JavaScript
* Deployment complexity

### Option 4: PyPDF2/pdfplumber

**Pros:**
* Python ecosystem (rich PDF tools)
* Good accuracy
* Flexible

**Cons:**
* **Requires Python runtime**
* Child process complexity
* Cross-language integration overhead
* Not native to TypeScript ecosystem
* Deployment complexity

### Option 5: Commercial API

**Pros:**
* Highest accuracy
* OCR included
* Professional support
* Handles all PDF types

**Cons:**
* **Cost**: Pay per document/API call
* **Privacy**: Documents sent to external service
* Network dependency
* Not local-first
* Over-engineering for personal use

## Implementation Notes

### Error Handling

```typescript
async function extractPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text extracted (possibly scanned PDF)');
    }
    
    return data.text;
  } catch (error) {
    console.error(`PDF extraction failed for ${filePath}:`, error);
    throw error;  // Let caller decide fallback strategy
  }
}
```

### Error Handling

Documents that fail PDF extraction are skipped with logging.


## Related Decisions

- [ADR-0001: TypeScript/Node.js](adr0001-typescript-nodejs-runtime.md) - Requires JavaScript-based PDF parser
- [ADR-0012: OCR Fallback](adr0012-ocr-fallback.md) - Handles scanned PDFs
- [ADR-0025: Document Loader Factory](adr0025-document-loader-factory.md) - Abstraction for multiple formats
- [ADR-0026: EPUB Support](adr0026-epub-format-support.md) - Additional format

## References

### Related Decisions
- [ADR-0001: TypeScript/Node.js](adr0001-typescript-nodejs-runtime.md)
- [ADR-0012: OCR Fallback](adr0012-ocr-fallback.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2

