# Diagram Awareness: Implementation Plan

## Timeline Overview

| Milestone | Duration | Focus |
|-----------|----------|-------|
| M1: Infrastructure | Week 1-2 | Schema, storage, repository, migration script |
| M2: Extraction | Week 2-3 | Layout detection, classification, image extraction |
| M3: Description | Week 3-4 | Vision LLM, embedding, concepts |
| M4: Search | Week 4-5 | Tool integration, chunk association |
| M5: Polish | Week 5-6 | Testing, performance, docs |

## Milestone 1: Infrastructure (Week 1-2)

### Tasks
- [ ] Create `Visual` domain model (`src/domain/models/visual.ts`)
- [ ] Add `IVisualRepository` interface (`src/domain/interfaces/repositories/visual-repository.ts`)
- [ ] Implement `LanceDBVisualRepository` (`src/infrastructure/lancedb/repositories/lancedb-visual-repository.ts`)
- [ ] Create `add-visuals-table.ts` migration script
- [ ] Add `sharp` dependency for image processing

### Deliverables
- `src/domain/models/visual.ts`
- `src/domain/interfaces/repositories/visual-repository.ts`
- `src/infrastructure/lancedb/repositories/lancedb-visual-repository.ts`
- `scripts/add-visuals-table.ts`

### Migration Script Behavior
```bash
npx tsx scripts/add-visuals-table.ts --dbpath ~/.concept_rag

# Output:
# 📦 Connecting to database: ~/.concept_rag
# ✅ Existing tables: catalog, chunks, concepts, categories
# 📁 Creating images/ directory...
# 📊 Creating visuals table with schema...
# ✅ Migration complete! visuals table added.
```

## Milestone 2: Extraction Pipeline (Week 2-3)

### Tasks
- [ ] Implement `VisualExtractor` class
- [ ] Integrate layout detection (PyMuPDF or LayoutParser)
- [ ] Add Vision LLM classification step (diagram vs photo)
- [ ] Implement grayscale conversion and PNG saving
- [ ] Create `extract-visuals.ts` script
- [ ] Add progress tracking for visual extraction

### Deliverables
- `src/infrastructure/visual-extraction/visual-extractor.ts`
- `src/infrastructure/visual-extraction/layout-detector.ts`
- `src/infrastructure/visual-extraction/visual-classifier.ts`
- `scripts/extract-visuals.ts`

### Classification Gate
Only these types are stored:
- `diagram` - flowcharts, UML, architecture, state machines
- `flowchart` - process flows, decision trees
- `chart` - bar, line, pie, scatter, histogram
- `table` - structured tabular data
- `figure` - technical illustrations with labels

**NOT stored:** photos, screenshots, decorative images, logos, icons

## Milestone 3: Description & Embedding (Week 3-4)

### Tasks
- [ ] Implement vision LLM integration (OpenRouter)
- [ ] Create semantic description prompt
- [ ] Add rate limiting for vision API calls
- [ ] Generate embeddings from descriptions
- [ ] Extract concepts from descriptions using existing pipeline
- [ ] Link visuals to nearby text chunks
- [ ] Create `describe-visuals.ts` script

### Deliverables
- `src/infrastructure/visual-extraction/visual-describer.ts`
- `prompts/visual-description.txt`
- `prompts/visual-classification.txt`
- `scripts/describe-visuals.ts`

### Semantic Description Prompt
```
Describe this diagram from a technical document.

Focus on:
1. What system, process, or concept does this diagram represent?
2. What are the key components or entities shown?
3. What relationships or flows are depicted?
4. What technical concepts does this illustrate?

Provide a concise description (2-4 sentences) that captures the semantic meaning.
Do not describe visual styling (colors, fonts, arrows) unless semantically relevant.
```

## Milestone 4: Search Integration (Week 4-5)

### Tasks
- [ ] Add `visual_ids` to chunk search results
- [ ] Implement `get_visuals` MCP tool
- [ ] Add visual type filtering to search tools
- [ ] Update tool documentation
- [ ] Add chunk-to-visual association logic

### Deliverables
- `src/tools/get-visuals.ts`
- Updated `broad_chunks_search` with visual enrichment
- API documentation updates

## Milestone 5: Testing & Polish (Week 5-6)

### Tasks
- [ ] Unit tests for VisualExtractor
- [ ] Unit tests for VisualClassifier
- [ ] Unit tests for VisualDescriber
- [ ] Integration tests for full pipeline
- [ ] E2E tests for search enrichment
- [ ] Performance benchmarks
- [ ] Update README and USAGE docs

### Deliverables
- `src/__tests__/unit/visual-extractor.test.ts`
- `src/__tests__/integration/visual-extraction.test.ts`
- `src/__tests__/e2e/visual-search.test.ts`
- Updated documentation

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Vision LLM classification errors | Medium | Medium | Manual review option, confidence threshold |
| Large image files bloat storage | Medium | Low | Grayscale + compression, configurable quality |
| Vision LLM costs increase | Medium | High | Batch processing, caching, configurable |
| Layout detection accuracy varies | Medium | Medium | Fallback to page-level, manual extraction |
| Slow processing for image-heavy docs | Medium | High | Parallel extraction, progress bar, skip option |

## Success Metrics

| Metric | Target |
|--------|--------|
| Classification accuracy | >90% correct diagram vs photo |
| Description quality | >85% semantically accurate (manual review) |
| Search relevance | Diagrams in top-10 when relevant |
| Processing time | <30s additional per 10-page document |
| Storage overhead | <5MB average per document (grayscale) |

## Configuration Options

```typescript
interface VisualExtractionConfig {
  enabled: boolean;              // Enable visual extraction (default: false)
  minWidth: number;              // Minimum visual width in pixels (default: 100)
  minHeight: number;             // Minimum visual height in pixels (default: 100)
  storageFormat: 'grayscale';    // Always grayscale for storage
  visionModel: string;           // OpenRouter model for descriptions
  maxVisualsPerPage: number;     // Limit visuals per page (default: 10)
  classificationModel: string;   // Model for diagram vs photo classification
  skipTypes: string[];           // Visual types to skip (default: [])
}
```

## Command Line Interface

```bash
# Add visuals table to existing database (safe migration)
npx tsx scripts/add-visuals-table.ts --dbpath ~/.concept_rag

# Extract diagrams from all documents
npx tsx scripts/extract-visuals.ts --dbpath ~/.concept_rag

# Extract from specific document
npx tsx scripts/extract-visuals.ts --dbpath ~/.concept_rag --source "Clean Architecture"

# Generate descriptions for extracted visuals
npx tsx scripts/describe-visuals.ts --dbpath ~/.concept_rag

# Re-describe visuals with new prompt
npx tsx scripts/describe-visuals.ts --dbpath ~/.concept_rag --redescribe
```

## Future Enhancements

1. **CLIP supplemental search**: Visual similarity mode for non-semantic matching
2. **Visual diff**: Compare diagrams across document versions
3. **Diagram-to-code**: Generate PlantUML/Mermaid from architecture diagrams
4. **Local vision models**: LLaVA for privacy-sensitive deployments
5. **Interactive exploration**: Click diagram concepts to explore

