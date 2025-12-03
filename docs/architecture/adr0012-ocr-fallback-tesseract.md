# 12. OCR Fallback with Tesseract

**Date:** 2025-10-21  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** OCR Evaluation (October 21, 2025)

**Sources:**
- Planning: .ai/planning/2025-10-21-ocr-evaluation/

## Context and Problem Statement

pdf-parse [ADR-0005] handles text-based PDFs well but cannot extract text from scanned documents (images only) [Limitation: pdf-parse]. When processing document collections, encountering scanned PDFs caused extraction failures and those documents were skipped, creating gaps in the knowledge base.

**The Core Problem:** How to handle scanned/image-based PDFs to achieve high document processing success rate (~95%+) without breaking the bank? [Planning: `.ai/planning/2025-10-21-ocr-evaluation/README.md`]

**Decision Drivers:**
* ~5-10% of PDFs are scanned or have image-based pages [Estimate: from corpus analysis]
* Need OCR capability for completeness [Requirement: comprehensive indexing]
* Cost must remain acceptable (~$0.05/doc total budget) [Constraint: cost-effective]
* Simple integration with existing pipeline [Requirement: minimal complexity]
* Acceptable accuracy for search purposes [Requirement: "good enough" text]

## Alternative Options

* **Option 1: Tesseract OCR (Local)** - Open-source local OCR as fallback
* **Option 2: DeepSeek-OCR** - Vision-language model for OCR
* **Option 3: Commercial OCR API** - (Google Cloud Vision, AWS Textract, Azure)
* **Option 4: Skip Scanned PDFs** - No OCR, log and skip
* **Option 5: Manual Processing** - Human transcription

## Decision Outcome

**Chosen option:** "Tesseract OCR as Fallback (Option 1)", because it provides free, local OCR capability with acceptable accuracy for search purposes, integrates easily via command-line, and requires no API costs or GPU infrastructure.

### Implementation

**Fallback Strategy:** [Code: `hybrid_fast_seed.ts`, lines 888-941]
```typescript
// Multi-stage processing
try {
  // Stage 1: Try pdf-parse (fast, text-based PDFs)
  text = await extractPDF(pdfPath);
} catch (error) {
  // Stage 2: Try Tesseract OCR fallback (scanned PDFs)
  console.log(`🔍 OCR processing: ${pdfPath}`);
  const ocrResult = await callOpenRouterOCR(pdfPath);  // Actually uses Tesseract locally
  
  if (ocrResult && ocrResult.documents.length > 0) {
    documents.push(...ocrResult.documents);
    console.log(`✅ OCR: ${totalPages} pages, ${totalChars} chars`);
  } else {
    // Stage 3: Skip with logging
    console.log(`❌ Both pdf-parse and OCR failed, skipping`);
  }
}
```
[Source: `hybrid_fast_seed.ts`, OCR fallback implementation, lines 888-941]

**OCR Processing:** [Code: `hybrid_fast_seed.ts`, lines 192-417]
```typescript
async function callOpenRouterOCR(pdfPath: string) {
  // Step 1: Check Tesseract installation
  execSync('tesseract --help', { stdio: 'ignore' });
  
  // Step 2: Convert PDF pages to images (poppler)
  execSync(`pdftoppm -png "${pdfPath}" "${tempImagePrefix}"`);
  
  // Step 3: OCR each image with Tesseract
  for (const imageFile of imageFiles) {
    const ocrText = execSync(`tesseract "${imageFile}" stdout`);
    documents.push({
      pageContent: ocrText,
      metadata: {
        source: pdfPath,
        page,
        ocr_processed: true,
        ocr_method: 'tesseract_local'
      }
    });
  }
  
  return { documents, ocrStats };
}
```
[Source: Tesseract integration in `hybrid_fast_seed.ts`, lines 192-417]

**Installation Requirements:** [Source: `hybrid_fast_seed.ts`, lines 202-205]
```bash
# Ubuntu/Debian
sudo apt install poppler-utils tesseract-ocr

# macOS
brew install poppler tesseract
```

### Consequences

**Positive:**
* **Zero cost:** Completely free (no API fees) [Benefit: vs. $0.02-0.10/page for commercial]
* **Local processing:** All OCR happens on-machine (privacy) [Benefit: no data leaves system]
* **Acceptable accuracy:** ~95% success rate with OCR fallback [Source: `adr0005-pdf-document-processing.md`, line 253]
* **Simple integration:** Command-line tools via child_process [Implementation: straightforward]
* **Fallback-only:** Only used when pdf-parse fails (minimal overhead) [Design: conditional]
* **Progress tracking:** Per-page OCR progress display [Feature: `hybrid_fast_seed.ts`, lines 39-49]
* **Metadata tracking:** OCR status stored (`ocr_processed`, `ocr_method`, `ocr_confidence`) [Code: lines 319-333]

**Negative:**
* **System dependencies:** Requires poppler-utils and tesseract-ocr installed [Requirement: manual installation]
* **Quality limitations:** Tesseract less accurate than commercial OCR (~80-90% vs. 95-99%) [Trade-off: free vs. accuracy]
* **Slower processing:** OCR takes longer than pdf-parse (~30-60s vs. 1-3s per doc) [Cost: time]
* **Complex PDFs:** Struggles with tables, multi-column layouts, poor scans [Limitation: layout complexity]
* **Cross-platform:** Installation varies by OS (apt vs. brew vs. Windows) [Deployment: platform-specific]

**Neutral:**
* **Conditional execution:** Only runs when pdf-parse fails [Design: fallback pattern]
* **Temp files:** Creates temporary images during processing [Implementation: disk I/O]
* **Error handling:** Gracefully handles OCR failures (log and skip) [Robustness: degradation]

### Confirmation

**Production Validation:** [Source: README.md and production usage]
- **Success rate:** ~95% with OCR fallback (vs. ~90% pdf-parse only) [Source: `adr0005-pdf-document-processing.md`, line 253]
- **Cost:** $0 for OCR (all local processing) [Benefit: zero marginal cost]
- **Documents processed:** 165+ successfully [Source: production stats]
- **OCR usage:** ~5-10% of documents require OCR fallback [Estimate: from processing logs]

**Alternative Evaluation:** [Source: `.ai/planning/2025-10-21-ocr-evaluation/DEEPSEEK_OCR_EVALUATION.md`]
- DeepSeek-OCR evaluated October 21, 2025
- Rejected due to infrastructure complexity and GPU requirements [Planning: evaluation, lines 201-222]
- Tesseract's simplicity and zero cost preferred for fallback use case [Decision: stick with Tesseract]

## Pros and Cons of the Options

### Option 1: Tesseract OCR (Local) - Chosen

**Pros:**
* Zero cost (completely free) [vs. $0.02-0.10/page commercial]
* Local processing (privacy)
* ~95% success rate [Validated: production]
* Simple command-line integration
* Fallback-only (minimal overhead)
* Cross-platform (Linux, macOS, Windows)
* Progress tracking implemented
* Metadata tracking for debugging

**Cons:**
* Requires system dependencies (poppler + tesseract)
* Lower accuracy than commercial (~80-90%)
* Slower than pdf-parse (30-60s vs. 1-3s)
* Struggles with complex layouts
* Platform-specific installation

### Option 2: DeepSeek-OCR

Vision-language model for OCR (evaluated October 21).

**Pros:**
* Higher accuracy than Tesseract [Source: DeepSeek-OCR benchmarks]
* Markdown output with structure preservation
* Tables and figures handled better
* Open-source model

**Cons:**
* **GPU requirement:** Needs A100-40G or equivalent [Dealbreaker: infrastructure] [Source: `DEEPSEEK_OCR_EVALUATION.md`, line 99]
* **Infrastructure complexity:** Must deploy and maintain OCR server [Complexity: operations]
* **Self-hosted only:** No API available (at evaluation time) [Limitation: deployment]
* **Slower:** Vision tokens slower than Tesseract [Performance: 30-60s/doc → 60-120s/doc]
* **Over-engineering:** For 5-10% of documents needing OCR [Cost/benefit: not worth it]
* **Evaluation result:** "Continue with existing OCR approach" [Decision: `README.md`, line 23]

### Option 3: Commercial OCR API

Google Cloud Vision, AWS Textract, or Azure Computer Vision.

**Pros:**
* Highest accuracy (95-99%)
* Handles complex layouts, tables, handwriting
* No infrastructure maintenance
* Reliable and scalable
* Professional support

**Cons:**
* **Cost:** $0.02-0.10 per page [vs. $0 Tesseract] [Dealbreaker: budget]
* **For 165 docs × 200 pages × $0.05 = $1,650** (vs. $0 Tesseract) [Calculation: prohibitive]
* **Privacy:** PDFs sent to external service [Concern: sensitive documents]
* **Network dependency:** Requires internet [Limitation: offline]
* **Vendor lock-in:** Proprietary APIs [Risk: dependency]

### Option 4: Skip Scanned PDFs

No OCR, just log and skip image-based PDFs.

**Pros:**
* Simplest implementation
* Zero dependencies
* Zero cost
* Fast (no OCR processing)

**Cons:**
* **Incomplete index:** Missing ~5-10% of documents [Problem: coverage gaps]
* **User frustration:** "Why isn't my document searchable?" [UX: confusion]
* **Defeats purpose:** Knowledge base should include all documents [Goal: completeness]
* **Before OCR fallback:** This was the state, unsatisfactory [History: pre-Oct-21]

### Option 5: Manual Processing

Human transcription or manual OCR tool usage.

**Pros:**
* Perfect accuracy (human transcription)
* No code required
* Complete control

**Cons:**
* **Not scalable:** Hours per document [Effort: prohibitive]
* **Expensive:** Human time >> any API cost [Cost: unrealistic]
* **Defeats automation:** RAG system should be automatic [Philosophy: automation]
* **Not feasible:** For personal knowledge base with 100+ docs [Practicality: impossible]

## Implementation Notes

### Installation Check

**Graceful Error:** [Code: `hybrid_fast_seed.ts`, lines 202-205]
```typescript
try {
  execSync('tesseract --help', { stdio: 'ignore' });
} catch {
  throw new Error('Required tools missing. Install: sudo apt install poppler-utils tesseract-ocr');
}
```

### Progress Tracking

**Per-Page Progress:** [Code: `hybrid_fast_seed.ts`, lines 39-49]
```typescript
// OCR processing: 15% to 100% (85% of total work)
const ocrProgress = (current / total) * 85;
percentage = Math.round(15 + ocrProgress);
statusText = `OCR processing page ${current}/${total}`;

const progress = `🔍 OCR Progress: [${bar}] ${percentage}% (${statusText})`;
```

### Quality Indicators

**Metadata Tracking:** [Code: `hybrid_fast_seed.ts`, lines 319-349]
```typescript
{
  ocr_processed: true,
  ocr_method: 'tesseract_local',
  ocr_confidence: text.length > 100 ? 'good' : 'low',
  ocr_error?: error.message  // If failed
}
```

### Debug Mode

**Environment Variable:** [Code: `hybrid_fast_seed.ts`, line 231]
```bash
DEBUG_OCR=1 npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
```

## Related Decisions

- [ADR-0005: PDF Document Processing](adr0005-pdf-document-processing.md) - Primary PDF parsing (pdf-parse)
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - Document processing pipeline

## References

### Related Decisions
- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: October 21, 2024
- DeepSeek alternative evaluated and rejected

**Traceability:** .ai/planning/2025-10-21-ocr-evaluation/
