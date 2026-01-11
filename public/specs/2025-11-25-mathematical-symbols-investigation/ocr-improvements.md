# OCR Improvements for Mathematical Symbols

**Date:** 2025-11-26  
**Context:** Investigation of mathematical symbol extraction capabilities  
**Current State:** Tesseract OCR struggles with Unicode mathematical symbols

## Problem Summary

Tesseract OCR (current solution) has significant limitations:
- ❌ Unicode math symbols often lost (∫ ∑ ∏ ∂ ∇)
- ❌ Greek letters misrecognized (α → a, β → B)
- ❌ Operators simplified (× → x, ÷ → /)
- ✅ ASCII symbols work well (+, -, *, /, =)

**Root Cause:** Tesseract trained primarily on text, not mathematical notation.

## Solution Comparison

### Option 1: Mathpix API ⭐ RECOMMENDED

**Description:** Commercial API specialized for mathematical OCR

**Accuracy:** 95%+ for mathematical content

**Cost:** 
- Free tier: 1,000 requests/month
- Paid: $0.004/request
- Monthly: $4-20 for typical usage

**Integration:**
```typescript
import axios from 'axios';

export async function extractMathWithMathpix(imagePath: string) {
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  
  const response = await axios.post(
    'https://api.mathpix.com/v3/text',
    {
      src: `data:image/png;base64,${imageBase64}`,
      formats: ['text', 'latex_styled'],
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$']
    },
    {
      headers: {
        'app_id': process.env.MATHPIX_APP_ID,
        'app_key': process.env.MATHPIX_API_KEY
      }
    }
  );
  
  return {
    text: response.data.text,
    latex: response.data.latex_styled,
    confidence: response.data.confidence
  };
}
```

**Pros:**
- ✅ Highest accuracy for math
- ✅ Fast (~5-10s per page)
- ✅ LaTeX output (can convert to Unicode)
- ✅ Handles complex equations, matrices
- ✅ Simple REST API
- ✅ Free tier sufficient for testing

**Cons:**
- ❌ Requires API key
- ❌ Internet connection required
- ❌ Cost scales with usage
- ❌ Privacy: documents sent to external service

**When to Use:**
- Math-heavy academic papers
- Scanned textbooks with equations
- Documents with >10% mathematical content
- When accuracy is critical

---

### Option 2: Nougat (Meta) ⭐ OPEN SOURCE

**Description:** Neural OCR model by Meta, trained on scientific papers

**Accuracy:** 90%+ for academic papers with math

**Cost:** Free (open source)

**Installation:**
```bash
pip install nougat-ocr

# Requires PyTorch
pip install torch torchvision
```

**Integration:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function extractMathWithNougat(pdfPath: string) {
  // Run Nougat via command line
  const outputDir = '/tmp/nougat-output';
  await execAsync(`nougat "${pdfPath}" -o "${outputDir}" --markdown`);
  
  // Read output markdown file
  const outputFile = path.join(outputDir, 
    path.basename(pdfPath, '.pdf') + '.mmd');
  const markdown = await fs.readFile(outputFile, 'utf-8');
  
  return {
    text: markdown,
    format: 'markdown_with_latex'
  };
}
```

**Pros:**
- ✅ Free and open source
- ✅ Good accuracy on academic papers
- ✅ Markdown + LaTeX output
- ✅ No API costs
- ✅ Local processing (privacy)
- ✅ Trained specifically for scientific documents

**Cons:**
- ❌ Requires Python + PyTorch
- ❌ Large model (~2GB download)
- ❌ GPU recommended (slow on CPU)
- ❌ More complex deployment
- ❌ Memory intensive

**When to Use:**
- Budget-conscious projects
- Privacy requirements
- Processing many documents locally
- Academic/scientific papers

---

### Option 3: Hybrid Approach ⭐ BEST BALANCE

**Description:** Use appropriate OCR based on document type

**Strategy:**
```typescript
export async function intelligentOCR(pdfPath: string) {
  // Stage 1: Try pdf-parse (fast, free)
  try {
    const result = await extractWithPdfParse(pdfPath);
    
    // Check if text extraction succeeded
    if (result.text.length > 100) {
      return {
        text: result.text,
        method: 'pdf-parse',
        confidence: 'high',
        ocr_processed: false
      };
    }
  } catch (error) {
    console.log('pdf-parse failed, trying OCR...');
  }
  
  // Stage 2: Analyze if math-heavy
  const sample = await extractSampleWithTesseract(pdfPath);
  const mathDensity = calculateMathDensity(sample);
  
  if (mathDensity > 0.1) { // >10% math symbols
    console.log('Math-heavy document detected');
    
    // Use specialized math OCR
    if (process.env.MATHPIX_API_KEY) {
      return await extractWithMathpix(pdfPath);
    } else if (await isNougatAvailable()) {
      return await extractWithNougat(pdfPath);
    }
  }
  
  // Stage 3: Fallback to Tesseract
  return await extractWithTesseract(pdfPath);
}

function calculateMathDensity(text: string): number {
  const mathSymbolRegex = /[∫∑∏∂∇√∞∀∃∧∨⇒⇔∈∉⊂⊃∪∩αβγδεπσφψω]/g;
  const mathKeywords = /\b(theorem|proof|equation|formula|integral|derivative)\b/gi;
  
  const symbolMatches = (text.match(mathSymbolRegex) || []).length;
  const keywordMatches = (text.match(mathKeywords) || []).length;
  
  return (symbolMatches * 10 + keywordMatches) / text.length;
}
```

**Pros:**
- ✅ Cost-effective (uses free methods first)
- ✅ Flexible (adapts to document type)
- ✅ High accuracy where needed
- ✅ Graceful degradation

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Requires multiple tools installed

---

### Option 4: Tesseract + Math Training Data

**Description:** Enhance Tesseract with mathematical training

**Installation:**
```bash
# Download math training data
wget https://github.com/Shreeshrii/tessdata_shreetest/raw/master/math.traineddata
sudo mv math.traineddata /usr/share/tesseract-ocr/4.00/tessdata/

# Use in extraction
tesseract image.png output -l eng+math
```

**Expected Improvement:** 20-30% better math symbol recognition

**Pros:**
- ✅ Free
- ✅ Minimal changes to existing code
- ✅ No external dependencies

**Cons:**
- ❌ Still limited compared to specialized tools
- ❌ Training data quality varies
- ❌ Complex symbols still problematic

---

### Option 5: GPT-4 Vision / Claude Vision

**Description:** Use vision language models for OCR

**Integration:**
```typescript
export async function extractMathWithVLM(imagePath: string) {
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Extract all text and mathematical equations from this image. 
                 For mathematical content, provide both LaTeX and Unicode representations.
                 Maintain the structure and formatting.`
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${imageBase64}` }
        }
      ]
    }],
    max_tokens: 4096
  });
  
  return response.choices[0].message.content;
}
```

**Cost:** $0.01-0.03 per page (expensive)

**Pros:**
- ✅ Very high accuracy
- ✅ Understands context
- ✅ Can explain equations
- ✅ Handles complex layouts

**Cons:**
- ❌ Expensive at scale
- ❌ API rate limits
- ❌ Slower than specialized OCR

---

## Recommended Implementation Plan

### Phase 1: Immediate (Low Cost)
1. Add Tesseract math training data
2. Implement math density detection
3. Add metadata flag for math-heavy documents

### Phase 2: Short Term (Mathpix Free Tier)
1. Sign up for Mathpix free tier (1000 requests/month)
2. Implement Mathpix fallback for math-heavy pages
3. Track usage and accuracy improvements

### Phase 3: Scale (Choose Based on Volume)
- **Low volume (<1000 docs/month):** Mathpix free tier
- **Medium volume (1000-10000 docs/month):** Mathpix paid or Nougat
- **High volume (>10000 docs/month):** Self-hosted Nougat

### Phase 4: Long Term
- Consider fine-tuning Nougat on your specific document types
- Implement caching for re-processed documents
- Build quality metrics dashboard

## Implementation Example

```typescript
// File: src/infrastructure/ocr/math-ocr-service.ts

import { MathpixOCR } from './providers/mathpix-ocr.js';
import { NougatOCR } from './providers/nougat-ocr.js';
import { TesseractOCR } from './providers/tesseract-ocr.js';

export class MathOCRService {
  private providers: {
    mathpix?: MathpixOCR;
    nougat?: NougatOCR;
    tesseract: TesseractOCR;
  };
  
  constructor() {
    this.providers = {
      tesseract: new TesseractOCR(),
      mathpix: process.env.MATHPIX_API_KEY 
        ? new MathpixOCR() 
        : undefined,
      nougat: this.isNougatInstalled() 
        ? new NougatOCR() 
        : undefined
    };
  }
  
  async extract(pdfPath: string): Promise<OCRResult> {
    // Detect math density from sample
    const sample = await this.providers.tesseract.extractSample(pdfPath);
    const mathDensity = this.calculateMathDensity(sample);
    
    // Choose appropriate provider
    if (mathDensity > 0.1) {
      if (this.providers.mathpix) {
        return await this.providers.mathpix.extract(pdfPath);
      } else if (this.providers.nougat) {
        return await this.providers.nougat.extract(pdfPath);
      }
    }
    
    // Fallback to Tesseract
    return await this.providers.tesseract.extract(pdfPath);
  }
  
  private calculateMathDensity(text: string): number {
    // Implementation from hybrid approach above
  }
}
```

## Cost Analysis

| Solution | Setup Cost | Per-Page Cost | 1000 Pages | 10000 Pages |
|----------|-----------|---------------|------------|-------------|
| Tesseract + math data | Free | Free | Free | Free |
| Mathpix (free tier) | Free | Free | Free* | $40 |
| Mathpix (paid) | Free | $0.004 | $4 | $40 |
| Nougat | GPU setup | Free | Free | Free |
| GPT-4 Vision | Free | $0.01-0.03 | $10-30 | $100-300 |

*First 1000/month free

## Quality Metrics to Track

```typescript
interface OCRQualityMetrics {
  symbolPreservation: {
    ascii: number;        // Expected: >95%
    unicode: number;      // Target: >90%
    greek: number;        // Target: >85%
    calculus: number;     // Target: >85%
  };
  
  processingTime: number;  // Seconds per page
  cost: number;           // USD per page
  confidence: number;     // Provider confidence score
  
  method: 'pdf-parse' | 'tesseract' | 'mathpix' | 'nougat' | 'vlm';
}
```

## Testing Plan

1. Create test set with known mathematical content
2. Process with each OCR method
3. Compare accuracy, speed, cost
4. Document results in `.ai/planning/ocr-comparison.md`

## Next Steps

1. [ ] Sign up for Mathpix free tier
2. [ ] Install Tesseract math training data
3. [ ] Implement math density detection
4. [ ] Create proof-of-concept with hybrid approach
5. [ ] Test on sample of math-heavy documents
6. [ ] Document accuracy improvements
7. [ ] Update ADR-0012 with findings

## References

- Mathpix: https://mathpix.com/ocr
- Nougat: https://github.com/facebookresearch/nougat
- Tesseract Math Data: https://github.com/Shreeshrii/tessdata_shreetest
- Related Investigation: `.ai/planning/2025-11-25-mathematical-symbols-investigation/`





















