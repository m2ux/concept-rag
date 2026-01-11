# Text Block Filtering Enhancement

## Problem
The LayoutParser model sometimes classifies text blocks as "Figure", especially:
- Decorative text boxes
- Pull quotes
- Sidebars with text
- Title pages with formatted text

Example: `man_gutenberg-revolution-the-story_2010` extracted 424 images, most containing only text.

## Proposed Solutions

### Option A: Aspect Ratio Filtering (Recommended)
Text blocks tend to have extreme aspect ratios (very wide or very tall columns), while semantic diagrams tend to be more balanced.

**Implementation:**
```typescript
// In classify_visual.py or local-classifier.ts
const aspectRatio = width / height;
const isExtremeAspect = aspectRatio > 4.0 || aspectRatio < 0.25;
if (isExtremeAspect) {
  // Skip - likely a text column or banner
  return { type: 'skip', skip: true };
}
```

**Pros:** Simple, fast, no additional dependencies
**Cons:** May skip some legitimate wide/tall diagrams

### Option B: Minimum Confidence Threshold Increase
Increase the classification threshold from 0.5 to 0.7 or higher.

**Pros:** Simple configuration change
**Cons:** May miss legitimate figures with lower confidence

### Option C: Page Coverage Limit (for Scanned Mode)
In scanned PDF mode, skip detected regions that cover more than 60% of the page area - these are likely full-page text, not focused diagrams.

**Pros:** Targets the specific problem of large text blocks
**Cons:** Only helps scanned mode

### Option D: Text Detection Overlap Check
The PubLayNet model detects both "Figure" AND "Text" regions. If a "Figure" region significantly overlaps with "Text" regions, skip it.

**Implementation:**
```python
# In classify_visual.py detect mode
text_regions = [b for b in layout if b.type == "Text"]
figure_regions = [b for b in layout if b.type == "Figure"]

for fig in figure_regions:
    text_overlap = calculate_overlap(fig, text_regions)
    if text_overlap > 0.5:  # 50% overlap with text
        continue  # Skip this "figure"
```

**Pros:** Uses the model's own text detection
**Cons:** More complex implementation

## Recommended Approach

Implement **Option A + Option C** together:

1. **Aspect ratio filter**: Skip regions with aspect ratio > 4.0 or < 0.25
2. **Page coverage limit**: Skip regions covering > 50% of page in scanned mode
3. **Keep confidence at 0.5**: Don't raise threshold to avoid missing real figures

These filters are fast, require no additional dependencies, and address the specific problems observed.

## Implementation Location

Update `scripts/python/classify_visual.py`:
- Add aspect ratio check in `classify_image()` function
- Add page coverage check in `detect_regions()` function

Return `skip: true` for filtered regions with a reason code for debugging.

