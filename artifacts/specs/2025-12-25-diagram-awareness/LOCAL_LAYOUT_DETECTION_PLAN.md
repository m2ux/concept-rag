# Unified Local Layout Detection

## Objective

Replace Vision LLM classification with a local layout detection model for **all** document types (native and scanned). This eliminates expensive API calls for classification while maintaining extraction quality. Vision LLM is retained **only** for generating semantic descriptions.

## Key Insight

Classification and description are separate concerns:
- **Classification**: Is this a diagram, table, or skip? → Local model (free, fast)
- **Description**: What does this diagram show? → Vision LLM (semantic understanding)

## Background

### Current Pipeline (Inconsistent)
```
Native PDF  → pdfimages → Vision LLM classify → save    ($$$, slow)
Scanned PDF → [not supported]
```

### New Pipeline (Unified)
```
Any PDF → extract/render → Local model classify → save → Vision LLM describe
                                  ↓                              ↓
                              FREE, fast                   Only for saved images
```

## Benefits

| Metric | Before (Vision LLM) | After (Local Model) |
|--------|---------------------|---------------------|
| Cost per image | ~$0.002 | **$0** |
| Speed per image | ~0.5s (API latency) | **~0.1s** |
| Offline capable | ❌ | ✅ |
| Rate limits | Yes | **No** |
| 100 docs × 50 images | ~$10 | **$0** |

## Technology Selection

### Recommended: LayoutParser + Detectron2

**LayoutParser** is a Python library providing:
- Pre-trained models for document layout analysis
- Support for multiple backends (Detectron2, PaddleDetection)
- Models trained on PubLayNet (330k+ document images)

**Detection Categories:**
- `Figure` - Diagrams, charts, illustrations
- `Table` - Tabular data
- `Text` - Text blocks (to exclude)
- `Title` - Headings
- `List` - Bullet points

### Alternative Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **LayoutParser + Detectron2** | High accuracy, well-documented | Python-only, requires PyTorch |
| **DocTR** | Lighter weight, OCR included | Less accurate for figures |
| **PaddleOCR Layout** | Good accuracy, actively maintained | Paddle ecosystem |
| **YOLO-based** | Very fast inference | Needs training data |
| **OpenCV contours** | No dependencies | Low accuracy |

## Architecture

### Unified Pipeline

```
┌────────────────────────────────────────────────────────────────────┐
│                    Visual Extractor (TypeScript)                   │
│                                                                    │
│  1. Analyze document type                                          │
│     └─→ 'native' or 'scanned'                                      │
│                                                                    │
│  2. Get candidate images                                           │
│     ├─→ Native:  pdfimages → pre-filter (skip page-sized)          │
│     └─→ Scanned: pdftoppm → render all pages                       │
│                                                                    │
│  3. Local classification (ALL images)                              │
│     └─→ Python script → LayoutParser → Figure/Table/Skip           │
│                                                                    │
│  4. Process results                                                │
│     ├─→ Native:  save classified images as-is                      │
│     └─→ Scanned: crop detected regions from page images            │
│                                                                    │
│  5. Save to database with placeholder descriptions                 │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                  Describe Visuals (Separate Step)                  │
│                                                                    │
│  Vision LLM generates semantic descriptions for saved images only  │
│  - Much fewer API calls (only classified images)                   │
│  - Can catch classification errors (flag low-quality descriptions) │
└────────────────────────────────────────────────────────────────────┘
```

### Integration Approach

Python script called from TypeScript (simple, no server needed):
```
TypeScript → spawn python classify_visual.py <image_path> → JSON output
```

## Implementation Plan

### Phase 1: Python Classification Script

**File:** `scripts/python/classify_visual.py`

```python
#!/usr/bin/env python3
"""
Classify images using LayoutParser local model.

Supports two modes:
1. CLASSIFY: Is this image a diagram/table/skip? (for native PDF images)
2. DETECT: Find diagram regions within a page image (for scanned PDFs)

Usage:
    # Classify a single image (native PDF)
    python classify_visual.py classify <image_path> [--min-score 0.5]
    
    # Detect regions in a page image (scanned PDF)
    python classify_visual.py detect <image_path> [--min-score 0.5]

Output:
    JSON with classification result or detected regions
"""

import sys
import json
import argparse
import layoutparser as lp
from PIL import Image

# Load pre-trained model (cached after first load)
MODEL = None

def get_model():
    global MODEL
    if MODEL is None:
        # PubLayNet model - trained on 330k+ scientific documents
        MODEL = lp.Detectron2LayoutModel(
            config_path='lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config',
            extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.3],
            label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"}
        )
    return MODEL

def classify_image(image_path: str, min_score: float = 0.5) -> dict:
    """
    Classify a single image (from pdfimages extraction).
    Returns the dominant element type.
    """
    image = Image.open(image_path).convert("RGB")
    model = get_model()
    
    layout = model.detect(image)
    
    # Find the largest/highest-confidence figure or table
    best_match = None
    best_score = 0
    
    for block in layout:
        if block.score >= min_score and block.type in ["Figure", "Table"]:
            # Prefer larger regions
            area = block.block.width * block.block.height
            score = block.score * (area / (image.width * image.height))
            if score > best_score:
                best_score = score
                best_match = block
    
    if best_match:
        return {
            "type": best_match.type.lower(),
            "score": round(best_match.score, 3),
            "skip": False
        }
    else:
        return {
            "type": "skip",
            "score": 0,
            "skip": True
        }

def detect_regions(image_path: str, min_score: float = 0.5) -> list:
    """
    Detect all figure/table regions in a page image (for scanned PDFs).
    Returns bounding boxes for cropping.
    """
    image = Image.open(image_path).convert("RGB")
    model = get_model()
    
    layout = model.detect(image)
    
    results = []
    for block in layout:
        if block.score >= min_score and block.type in ["Figure", "Table"]:
            results.append({
                "type": block.type.lower(),
                "score": round(block.score, 3),
                "bbox": {
                    "x": int(block.block.x_1),
                    "y": int(block.block.y_1),
                    "width": int(block.block.width),
                    "height": int(block.block.height)
                }
            })
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["classify", "detect"])
    parser.add_argument("image_path", help="Path to image")
    parser.add_argument("--min-score", type=float, default=0.5)
    args = parser.parse_args()
    
    if args.mode == "classify":
        result = classify_image(args.image_path, args.min_score)
    else:
        result = detect_regions(args.image_path, args.min_score)
    
    print(json.dumps(result))
```

### Phase 2: TypeScript Integration

**File:** `src/infrastructure/visual-extraction/local-classifier.ts`

```typescript
import { spawn } from 'child_process';
import * as path from 'path';

export interface ClassificationResult {
  type: 'figure' | 'table' | 'skip';
  score: number;
  skip: boolean;
}

export interface DetectedRegion {
  type: 'figure' | 'table';
  score: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const SCRIPT_PATH = path.join(__dirname, '../../../scripts/python/classify_visual.py');
const PYTHON_VENV = path.join(__dirname, '../../../scripts/python/venv/bin/python3');

async function runPythonScript(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try venv python first, fall back to system python
    const pythonPath = require('fs').existsSync(PYTHON_VENV) ? PYTHON_VENV : 'python3';
    
    const process = spawn(pythonPath, [SCRIPT_PATH, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => { stdout += data; });
    process.stderr.on('data', (data) => { stderr += data; });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });
  });
}

/**
 * Classify a single image using local model.
 * Used for native PDF images extracted via pdfimages.
 */
export async function classifyImage(
  imagePath: string,
  options: { minScore?: number } = {}
): Promise<ClassificationResult> {
  const { minScore = 0.5 } = options;
  
  const output = await runPythonScript([
    'classify',
    imagePath,
    '--min-score', minScore.toString()
  ]);
  
  return JSON.parse(output);
}

/**
 * Detect diagram regions within a page image.
 * Used for scanned PDFs where each page is a single image.
 */
export async function detectRegions(
  imagePath: string,
  options: { minScore?: number } = {}
): Promise<DetectedRegion[]> {
  const { minScore = 0.5 } = options;
  
  const output = await runPythonScript([
    'detect',
    imagePath,
    '--min-score', minScore.toString()
  ]);
  
  return JSON.parse(output);
}
```

### Phase 3: Update Visual Extractor

**File:** `src/infrastructure/visual-extraction/visual-extractor.ts`

Replace Vision LLM classification with local model:

```typescript
import { classifyImage, detectRegions } from './local-classifier.js';

/**
 * Extract visuals from a native PDF (has embedded image objects).
 * Uses pdfimages to extract, then local model to classify.
 */
async extractFromNativePdf(
  pdfPath: string,
  catalogId: number,
  documentInfo: DocumentInfo,
  options: VisualExtractionOptions = {}
): Promise<VisualExtractionResult> {
  const { onProgress } = options;
  
  // Step 1: Extract embedded images
  const extractionResult = await extractPdfImages(pdfPath, {
    minWidth: this.config.minWidth,
    minHeight: this.config.minHeight
  });
  
  // Step 2: Pre-filter page-sized images
  const candidates = this.preFilterImages(extractionResult.images, pdfPath);
  
  // Step 3: Classify using LOCAL MODEL (not Vision LLM)
  for (const img of candidates) {
    if (onProgress) {
      onProgress('classifying', img.imageIndex, candidates.length, 
        `Classifying image ${img.imageIndex}`);
    }
    
    // Local classification - FREE and FAST
    const classification = await classifyImage(img.imagePath, { minScore: 0.5 });
    
    if (classification.skip) {
      result.imagesFiltered++;
      continue;
    }
    
    // Save the image
    await this.saveVisual(img, classification.type, catalogId, documentInfo);
  }
  
  return result;
}

/**
 * Extract visuals from a scanned PDF (pages stored as images).
 * Renders pages, detects regions, crops diagrams.
 */
async extractFromScannedPdf(
  pdfPath: string,
  catalogId: number,
  documentInfo: DocumentInfo,
  options: VisualExtractionOptions = {}
): Promise<VisualExtractionResult> {
  const { onProgress } = options;
  
  // Step 1: Render PDF pages to images
  const renderResult = await renderPdfPages(pdfPath, { dpi: 150 });
  
  for (let i = 0; i < renderResult.pageImages.length; i++) {
    const pageImage = renderResult.pageImages[i];
    const pageNumber = i + 1;
    
    if (onProgress) {
      onProgress('detecting', pageNumber, renderResult.pageCount, 
        `Detecting layouts on page ${pageNumber}`);
    }
    
    // Step 2: Detect regions using LOCAL MODEL
    const regions = await detectRegions(pageImage, { minScore: 0.5 });
    
    // Step 3: Crop and save each detected region
    for (let j = 0; j < regions.length; j++) {
      const region = regions[j];
      
      const croppedPath = await this.cropAndSaveRegion(
        pageImage, 
        region, 
        catalogId, 
        pageNumber, 
        j,
        documentInfo
      );
      
      result.visuals.push({
        pageNumber,
        visualIndex: j,
        type: region.type as VisualType,
        imagePath: croppedPath,
        boundingBox: region.bbox,
        width: region.bbox.width,
        height: region.bbox.height
      });
    }
  }
  
  return result;
}
```

### Phase 4: Document Type Detection

**File:** `src/infrastructure/visual-extraction/document-analyzer.ts`

```typescript
export type DocumentType = 'native' | 'scanned' | 'mixed';

export async function analyzeDocumentType(pdfPath: string): Promise<DocumentType> {
  // Sample first 5 pages
  const extractResult = await extractPdfImages(pdfPath, { 
    minWidth: 100, 
    minHeight: 100 
  });
  
  if (extractResult.images.length === 0) {
    return 'scanned'; // No embedded images = likely scanned
  }
  
  const pageDimensions = getPdfPageDimensions(pdfPath);
  let pageScans = 0;
  
  for (const img of extractResult.images.slice(0, 10)) {
    const pageDim = pageDimensions.find(p => p.pageNumber === img.pageNumber);
    if (pageDim) {
      const analysis = analyzeImageVsPageSize(
        img.width, img.height,
        pageDim.width, pageDim.height
      );
      if (analysis.shouldSkip && analysis.areaCoverage > 0.8) {
        pageScans++;
      }
    }
  }
  
  // If >60% of sampled images are page-sized, it's a scanned document
  const ratio = pageScans / Math.min(extractResult.images.length, 10);
  if (ratio > 0.6) return 'scanned';
  if (ratio > 0.2) return 'mixed';
  return 'native';
}
```

### Phase 5: Unified Extraction Pipeline

**File:** `src/infrastructure/visual-extraction/visual-extractor.ts`

```typescript
async extractFromPdf(
  pdfPath: string,
  catalogId: number,
  documentInfo: DocumentInfo,
  options: VisualExtractionOptions = {}
): Promise<VisualExtractionResult> {
  // Auto-detect document type
  const docType = await analyzeDocumentType(pdfPath);
  
  if (onProgress) {
    onProgress('analyzing', 0, 1, `Document type: ${docType}`);
  }
  
  if (docType === 'native') {
    // Use pdfimages + pre-filter + LOCAL classification
    return this.extractFromNativePdf(pdfPath, catalogId, documentInfo, options);
  } else {
    // Use page rendering + LOCAL detection + cropping
    return this.extractFromScannedPdf(pdfPath, catalogId, documentInfo, options);
  }
}
```

### Phase 6: Remove Vision LLM from Classification

**Files to update:**

1. `visual-extractor.ts` - Remove `VisionLLMService` dependency for classification
2. `vision-llm-service.ts` - Keep `describeVisual()` only, remove `classifyImage()`
3. `extract-visuals.ts` - No longer needs OPENROUTER_API_KEY for extraction

**Note:** Vision LLM is still used by `describe-visuals.ts` for generating semantic descriptions. The API key is only required for that step, not for extraction.

## Dependencies

### Python Requirements

**File:** `scripts/python/requirements.txt`

```
layoutparser[layoutmodels]==0.3.4
torch>=1.10.0
torchvision>=0.11.0
detectron2
Pillow>=9.0.0
```

### Installation

```bash
# Create virtual environment
cd scripts/python
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Detectron2 (platform-specific)
pip install 'git+https://github.com/facebookresearch/detectron2.git'
```

## File Structure

```
concept-rag/
├── scripts/
│   ├── python/
│   │   ├── classify_visual.py        # Local classification (classify + detect modes)
│   │   ├── requirements.txt          # Python dependencies
│   │   └── venv/                      # Virtual environment (created on setup)
│   ├── extract-visuals.ts            # Updated - no API key needed!
│   └── describe-visuals.ts           # Unchanged - still needs API key
├── src/
│   └── infrastructure/
│       └── visual-extraction/
│           ├── visual-extractor.ts   # Updated: uses local classifier
│           ├── local-classifier.ts   # NEW: TypeScript wrapper for Python script
│           ├── document-analyzer.ts  # NEW: Detect native vs scanned
│           ├── region-cropper.ts     # NEW: Crop regions from page images
│           ├── vision-llm-service.ts # SIMPLIFIED: describeVisual() only
│           └── pdf-page-renderer.ts  # Unchanged
```

## Testing Plan

### Unit Tests

1. `detect_layout.py` with sample page images
2. `layout-detector.ts` integration with Python script
3. `document-analyzer.ts` with native/scanned PDFs
4. Region cropping accuracy

### Integration Tests

1. End-to-end extraction from scanned PDF
2. Mixed document handling
3. Performance benchmarks

### Test Data

Use "Mastering Elliott Wave" as the primary test case:
- 169 pages, all scanned
- Contains multiple diagram types
- Previously extracted 2873 page-sized strips

## Performance Expectations

### Extraction (No API Cost)

| Metric | Native PDF | Scanned PDF |
|--------|------------|-------------|
| Detection method | pdfimages + pre-filter + local classify | pdftoppm + local detect |
| Time per image/page | ~0.1s | ~0.5s |
| Time for 100 images/169 pages | ~10s | ~85s |
| Accuracy | ~85-90% | ~85-90% |
| API Cost | **$0** | **$0** |

### Description (API Cost)

| Metric | Value |
|--------|-------|
| When | After extraction, via `describe-visuals.ts` |
| API calls | Only for saved images (not filtered ones) |
| Cost per image | ~$0.002 |
| Example: 50 diagrams | ~$0.10 |

### Total Pipeline Cost Comparison

| Scenario | Before (LLM classify) | After (Local classify) |
|----------|----------------------|------------------------|
| 100 native PDF images | ~$0.20 | **$0** |
| 169 scanned pages | Not supported | **$0** |
| 50 descriptions | ~$0.10 | ~$0.10 |
| **Total** | ~$0.30+ | **~$0.10** |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Model accuracy lower than LLM | Description step catches errors; can flag low-quality descriptions |
| Detectron2 install complex | Provide setup script; Docker option for CI |
| Large model download (~800MB) | One-time download; cache in venv |
| Python environment conflicts | Isolated venv in `scripts/python/` |
| Complex page layouts | Tune confidence threshold (0.5 default, adjustable) |
| First-run slow (model load) | Model cached after first load; ~3s cold start |
| Non-standard diagram types | PubLayNet trained on scientific docs; good coverage |

### Accuracy Trade-off

Local model accuracy (~85-90%) vs Vision LLM (~95%):

- **Acceptable** because description step provides second check
- **Better for cost** - 10% more false positives but $0 classification cost
- **Recoverable** - can re-run with LLM if needed for specific documents

## Success Criteria

1. ✅ Accurately detect >80% of diagrams in both native and scanned documents
2. ✅ Zero Vision LLM API calls for classification (extraction step)
3. ✅ Processing time <0.5 second per image/page
4. ✅ Automatic document type detection (native vs scanned)
5. ✅ Unified API - same interface regardless of document type
6. ✅ Vision LLM only used for description generation

## Next Steps

1. [ ] Set up Python environment with LayoutParser + Detectron2
2. [ ] Create and test `classify_visual.py` script (both modes)
3. [ ] Implement TypeScript wrapper (`local-classifier.ts`)
4. [ ] Add document type detection (`document-analyzer.ts`)
5. [ ] Add region cropping utility (`region-cropper.ts`)
6. [ ] Update `visual-extractor.ts` - remove Vision LLM for classification
7. [ ] Update `extract-visuals.ts` - remove API key requirement
8. [ ] Test on native PDF (Clean Architecture)
9. [ ] Test on scanned PDF (Mastering Elliott Wave)
10. [ ] Benchmark accuracy and performance
11. [ ] Update documentation

## Migration Notes

### Breaking Changes

- `extract-visuals.ts` no longer requires `OPENROUTER_API_KEY`
- `VisionLLMService.classifyImage()` removed
- New dependency: Python 3.8+ with LayoutParser

### Non-Breaking

- `describe-visuals.ts` unchanged
- Database schema unchanged
- API unchanged

