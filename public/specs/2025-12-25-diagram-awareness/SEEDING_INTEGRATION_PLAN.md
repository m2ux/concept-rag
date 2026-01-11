# Visual Extraction Seeding Integration Plan

## Overview

Integrate visual extraction into the document seeding pipeline with an **opt-in flag**. Visual extraction is disabled by default and only runs when explicitly requested via command-line argument.

## Current State

- **Seeding**: `hybrid_fast_seed.ts` processes documents for text, chunks, concepts, embeddings
- **Visual extraction**: Separate manual process via `scripts/extract-visuals.ts`
- **Visual description**: Separate manual process via `scripts/describe-visuals.ts`

## Proposed Change

Add `--extract-visuals` flag to the seeding pipeline that triggers visual extraction during document processing.

## Design Decisions

### 1. Flag Naming

**Option A**: `--extract-visuals` (explicit, clear)
**Option B**: `--with-images` (shorter, intuitive)
**Option C**: `--visuals` (concise)

**Recommendation**: `--extract-visuals` - explicit and self-documenting

### 2. When to Extract

Visual extraction should occur:
- **After** successful text/chunk processing (ensures document is valid)
- **Before** concept enrichment (visuals can contribute to concepts later)
- **Only for PDF files** (other formats don't have embedded images)

### 3. Description Generation

**Decision**: Description always accompanies extraction (single flag).

When `--extract-visuals` is specified:
1. Extract embedded images from PDF
2. Classify each image (diagram/chart/table vs photo/decorative)
3. Save semantic images as grayscale PNGs with embedded metadata
4. Generate semantic descriptions for each saved image
5. Store in database with description and concepts

This ensures visuals are immediately useful for search without requiring a second pass.

### 4. Error Handling

Visual extraction failures should:
- **NOT** fail the entire seeding process
- Log warnings and continue
- Track failed extractions for later retry

## Implementation Plan

### Phase 1: Add Flag to Seeding Script

**File**: `hybrid_fast_seed.ts`

```typescript
// New CLI argument
const extractVisuals = args['extract-visuals'] || false;
```

### Phase 2: Integrate Visual Extractor with Description

**Location**: After document processing, before enrichment

```typescript
// In document processing loop
if (extractVisuals && isPdfDocument(sourcePath)) {
  try {
    // Step 1: Extract and classify images
    const visualResult = await visualExtractor.extractFromPdf(
      sourcePath,
      catalogId,
      { title, author, year }
    );
    
    // Step 2: Generate descriptions and store each visual
    for (const visual of visualResult.visuals) {
      // Generate semantic description
      const description = await visionService.describeVisual(
        path.join(dbPath, visual.imagePath)
      );
      
      // Build complete visual record with description
      const visualRecord = buildVisualRecord(visual, catalogId, description);
      await visualsTable.add([visualRecord]);
    }
    
    stats.visualsExtracted += visualResult.visuals.length;
    stats.visualsFiltered += visualResult.imagesFiltered;
    
    console.log(`   🖼️ Visuals: ${visualResult.visuals.length} extracted, ${visualResult.imagesFiltered} filtered`);
  } catch (error) {
    console.warn(`   ⚠️ Visual extraction failed: ${error.message}`);
    stats.visualExtractionErrors++;
  }
}
```

### Phase 3: Update Documentation

- Update `scripts/README.md` with new flags
- Update seeding guide documentation
- Add examples to help output

## API Key Requirement

Visual extraction requires `OPENROUTER_API_KEY` for:
- Image classification (diagram vs photo)
- Description generation

**Behavior when API key is missing**:
- `--extract-visuals` without API key → Error and skip visual extraction
- Log clear message about missing API key

## Progress Reporting

Extend existing progress reporting:

```
📄 Processing: Clean Architecture.pdf
   ✅ Text extracted (342 chunks)
   ✅ Concepts extracted (45 concepts)
   🖼️ Extracting visuals... (12 found, 8 semantic)
   ✏️ Describing visuals... (8/8 complete)
```

## Configuration

New configuration options in `Configuration`:

```typescript
visual: {
  enabled: boolean;           // Master toggle
  extractOnSeed: boolean;     // Extract during seeding
  describeOnSeed: boolean;    // Describe during seeding
  minImageWidth: number;      // Minimum image width (default: 100)
  minImageHeight: number;     // Minimum image height (default: 100)
  visionModel: string;        // Model for classification/description
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `hybrid_fast_seed.ts` | Add flags, integrate visual extractor |
| `src/application/config/types.ts` | Add visual config types |
| `src/application/config/configuration.ts` | Add visual config |
| `scripts/README.md` | Document new flags |
| `docs/usage/seeding.md` | Update seeding guide |

## Testing

1. **Unit tests**: Mock visual extractor, verify flag handling
2. **Integration tests**: Seed a test PDF with `--extract-visuals`
3. **E2E tests**: Verify visuals appear in database after seeding

## Rollout

1. Implement Phase 1 & 2 (extraction only)
2. Test on sample documents
3. Implement Phase 3 (description)
4. Update documentation
5. Release

## Example Usage

```bash
# Normal seeding (no visuals - default)
npm run seed

# Seeding with visual extraction + description
npm run seed -- --extract-visuals

# With explicit database path
npm run seed -- --dbpath ~/.concept_rag --extract-visuals
```

## Success Criteria

- [ ] `--extract-visuals` flag works correctly
- [ ] Extraction always includes description generation
- [ ] Visual extraction failures don't break seeding
- [ ] Progress reporting shows visual extraction status
- [ ] Missing API key shows clear error message
- [ ] Documentation updated

## Open Questions

1. Should we add `--visual-model` flag to override the default vision model?
2. Should visual extraction run in parallel with concept enrichment?
3. Should we add a `--skip-visuals-for` pattern to exclude certain documents?

---

**Status**: Planning
**Author**: AI Assistant
**Date**: 2026-01-01

