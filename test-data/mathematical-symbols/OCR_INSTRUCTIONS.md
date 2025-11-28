# Instructions for Creating OCR Test PDF

## Purpose
Create a scanned/image-based PDF to test Tesseract OCR's ability to recognize mathematical symbols.

## Method 1: Print and Scan
1. Open math-symbols-test.html in a web browser
2. Print to paper
3. Scan the paper to PDF
4. Save as: test-data/mathematical-symbols/math-symbols-ocr-scanned.pdf

## Method 2: Screenshot to PDF
1. Open math-symbols-test.html in a web browser
2. Take screenshots of the entire page
3. Use an image-to-PDF tool to convert screenshots
4. Save as: test-data/mathematical-symbols/math-symbols-ocr-scanned.pdf

## Method 3: Convert HTML → Image → PDF
Using command-line tools:

```bash
# Install wkhtmltoimage and ImageMagick (Ubuntu/Debian)
sudo apt install wkhtmltopdf imagemagick

# Convert HTML to image
wkhtmltoimage math-symbols-test.html math-symbols.png

# Convert image to PDF (as image-based, not text)
convert math-symbols.png math-symbols-ocr-scanned.pdf
```

## Expected Results
When this OCR PDF is processed:
- ✅ Basic ASCII symbols should be preserved: + - * / = < >
- ❌ Unicode symbols will likely be lost or corrupted: ∫ ∑ α β π
- ⚠️  Greek letters may become Latin: α → a, β → B
- ⚠️  Operators may be simplified: × → x, ÷ → /

This is expected behavior documenting Tesseract's limitations with mathematical Unicode.

## Verification
After creating the OCR PDF:
1. Run: npx tsx scripts/test_math_symbol_extraction.ts
2. Check console output for symbol preservation comparison
3. Review metadata.ocr_processed and metadata.ocr_confidence flags
