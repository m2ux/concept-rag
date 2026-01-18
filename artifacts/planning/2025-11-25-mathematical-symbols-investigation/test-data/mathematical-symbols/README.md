# Mathematical Symbols Test Data

This directory contains test data for validating mathematical symbol preservation in document loaders.

## Purpose

Test and document the ability to extract Unicode mathematical symbols from:
1. Regular text-based PDFs (via pdf-parse)
2. OCR-scanned PDFs (via Tesseract OCR)
3. EPUB documents (via HTML parsing)

## Files

### Generated Files

- **`math-symbols-content.txt`** - Plain text with all mathematical symbol categories
- **`math-symbols-test.html`** - HTML file containing formatted mathematical symbols (convertible to PDF)
- **`OCR_INSTRUCTIONS.md`** - Instructions for creating OCR test PDF manually
- **`README.md`** - This file

### Test PDFs (To Be Created)

- **`math-symbols-regular.pdf`** - Text-based PDF with embedded Unicode fonts
  - Create by: Opening `math-symbols-test.html` in browser and printing to PDF
  - Expected: Excellent Unicode symbol preservation
  
- **`math-symbols-ocr-scanned.pdf`** - Image-based PDF requiring OCR processing
  - Create by: Following instructions in `OCR_INSTRUCTIONS.md`
  - Expected: Limited Unicode symbol preservation (documented limitation)

## Symbol Categories

The test documents include:

1. **ASCII Mathematical Symbols** (14 symbols)
   - `+ - * / = < > ^ _ ~ | \ % @`

2. **Extended Mathematical Operators** (10 symbols)
   - `± × ÷ ≠ ≤ ≥ ≈ ≡ ∝ ∞`

3. **Greek Letters** (13+ symbols)
   - Lowercase: `α β γ δ ε π σ φ ω`
   - Uppercase: `Δ Σ Π Ω`

4. **Calculus Symbols** (6+ symbols)
   - `∫ ∑ ∏ ∂ ∇ √`

5. **Logic Symbols** (9 symbols)
   - `∀ ∃ ∧ ∨ ¬ ⇒ ⇔ ∴ ∵`

6. **Set Theory Symbols** (9+ symbols)
   - `∈ ∉ ⊂ ⊃ ⊆ ⊇ ∪ ∩ ∅`

**Total: 60+ unique mathematical symbols**

## Expected Results

### Regular Text-based PDF (`math-symbols-regular.pdf`)

| Category | Preservation | Notes |
|----------|-------------|-------|
| ASCII | ✅ EXCELLENT | Always preserved |
| Unicode Operators | ✅ EXCELLENT | If fonts embedded properly |
| Greek Letters | ✅ EXCELLENT | LaTeX fonts (Computer Modern, STIX) |
| Calculus Symbols | ✅ EXCELLENT | Unicode support in PDF |
| Logic Symbols | ✅ EXCELLENT | Standard Unicode |
| Set Theory | ✅ EXCELLENT | Standard Unicode |

**Processing:** `PDF → pdf-parse → Direct text extraction`  
**Metadata:** `ocr_processed: false`

### OCR-Scanned PDF (`math-symbols-ocr-scanned.pdf`)

| Category | Preservation | Notes |
|----------|-------------|-------|
| ASCII | ✅ GOOD | Basic operators work |
| Unicode Operators | ⚠️ POOR | `× → x`, `÷ → /` |
| Greek Letters | ❌ VERY POOR | `α → a`, `β → B` |
| Calculus Symbols | ❌ VERY POOR | Usually lost: `∫ ∑ ∏` |
| Logic Symbols | ❌ VERY POOR | Not in OCR training data |
| Set Theory | ❌ VERY POOR | Not recognized by Tesseract |

**Processing:** `PDF → pdftoppm (images) → Tesseract OCR → Text`  
**Metadata:** `ocr_processed: true`, `ocr_confidence: "low"`

## Usage

### Running Tests

```bash
# Unit tests
npx vitest src/infrastructure/document-loaders/__tests__/mathematical-symbols.test.ts

# Integration tests
npx vitest src/__tests__/integration/mathematical-symbols-integration.test.ts

# Verify symbol extraction (requires test PDFs)
npx tsx scripts/test_math_symbol_extraction.ts
```

### Creating Test PDFs

1. **Regular PDF:**
   ```bash
   # Open in browser
   open test-data/mathematical-symbols/math-symbols-test.html
   # Print to PDF → Save as math-symbols-regular.pdf
   ```

2. **OCR PDF:**
   ```bash
   # Follow instructions in OCR_INSTRUCTIONS.md
   # Requires: wkhtmltopdf, imagemagick, or manual scanning
   ```

## Related Documentation

- **Investigation:** `.engineering/artifacts/planning/2025-11-25-mathematical-symbols-investigation/`
- **Tests:** `src/infrastructure/document-loaders/__tests__/mathematical-symbols.test.ts`
- **Integration Tests:** `src/__tests__/integration/mathematical-symbols-integration.test.ts`
- **ADR-0005:** PDF Document Processing with pdf-parse
- **ADR-0012:** OCR Fallback Strategy with Tesseract

## Key Findings

1. **Regular PDFs:** Excellent Unicode preservation (depends on font encoding)
2. **OCR PDFs:** Limited Unicode support (Tesseract limitation, not a bug)
3. **Metadata:** `ocr_processed` flag distinguishes processing paths
4. **Recommendation:** Prefer text-based PDFs for mathematical content

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Symbols appear as ??? | Missing fonts or encoding issue | Use text-based PDF with embedded fonts |
| Greek → Latin (α → a) | Expected OCR behavior | Use text-based PDF or check original |
| Calculus symbols missing | Tesseract limitation | Use text-based PDF or specialized OCR |
| All text garbled | Encrypted or corrupted PDF | Check file integrity |

---

**Generated:** 2025-11-26  
**Branch:** `feature/mathematical-symbols-testing`

