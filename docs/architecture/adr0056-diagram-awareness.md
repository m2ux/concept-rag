# ADR0056: Diagram Awareness

## Status

Accepted

## Context

Concept-RAG currently processes PDF and EPUB documents to extract text-based chunks and concepts. However, many technical documents contain valuable visual content (diagrams, flowcharts, charts, figures) that convey information not captured in text. This visual information is lost during ingestion.

**Current state:**
- Documents are chunked as text segments only
- Diagrams are either ignored or produce garbled OCR artifacts
- Search results cannot surface or leverage visual content
- Users cannot find documents based on diagram content

**Desired state:**
- Diagrams with semantic meaning are detected and extracted during ingestion
- Visual content is stored as searchable "visual tokens"
- Search results can be enriched with relevant diagrams
- Visual inference enables concept discovery from diagrams

## Decision

We will add diagram awareness to Concept-RAG using a Vision LLM approach with the following design decisions:

### 1. Vision LLM for Semantic Understanding (Not CLIP)

**Decision:** Use Vision LLM (GPT-4V/Claude 3 via OpenRouter) for diagram classification and description.

**Rationale:**
- CLIP was trained on natural images and struggles with technical diagrams (UML, flowcharts, architecture diagrams)
- CLIP cannot extract semantic meaning—only visual similarity
- CLIP produces embeddings in a different vector space (512-768 dim) incompatible with our 384-dim text embeddings
- Vision LLMs can classify diagram types, understand relationships, and extract concepts

### 2. Store Only Semantic Diagrams

**Decision:** Only store diagrams with semantic meaning. Photos, screenshots, logos, and decorative images are detected but NOT stored.

**Rationale:**
- The goal is to aid text comprehension, not store images
- Photos and decorative images add no semantic value to search
- Reduces storage bloat and search noise
- Classification gate filters content before storage

**Visual types stored:**
- `diagram`: flowcharts, UML, architecture, state machines, sequence diagrams
- `chart`: bar, line, pie, scatter, histogram
- `table`: structured tabular data
- `figure`: technical illustrations with labels

**NOT stored:**
- Photos, screenshots, decorative images, logos, icons

### 3. Grayscale Storage with Color Analysis

**Decision:** Store extracted images as grayscale PNG files. Vision LLM receives full-color image during analysis.

**Rationale:**
- ~66% storage reduction (3 channels → 1 channel)
- Most technical diagrams are already black/white
- Semantic meaning is captured in the text description
- Color information (e.g., "the red error path") is encoded in the LLM-generated description
- Stored images are primarily for human reference/verification

### 4. New `visuals` Table (Not Extending Chunks)

**Decision:** Create a new `visuals` table rather than extending the existing `chunks` table.

**Rationale:**
- Clean separation of concerns—chunks are for text, visuals are for images
- Different indexing requirements
- Avoids schema pollution in the chunks table
- Visuals link to chunks via `chunk_ids` array for context

### 5. External Image Storage with DB References

**Decision:** Store images as external PNG files with database references.

**Rationale:**
- Aligns with existing pattern (documents stored externally, referenced in catalog)
- Avoids significant database size increase
- Efficient for image serving if needed
- Simple file system operations for cleanup

**File structure:**
```
~/.concept_rag/
├── visuals.lance/          # New table
└── images/                 # New folder
    └── {catalog_id}/
        └── p{page}_v{index}.png
```

### 6. Non-Destructive Database Migration

**Decision:** Add visuals capability via migration script that creates new table without modifying existing tables.

**Rationale:**
- Production databases should not be disrupted
- Existing catalog, chunks, concepts, categories tables remain unchanged
- Incremental adoption—visuals can be extracted for existing documents later
- Safe rollback by simply dropping the new table

## Consequences

### Positive
- Diagrams become searchable via semantic descriptions
- Concepts can be extracted from visual content
- Search results enriched with relevant diagrams
- Non-destructive migration preserves existing data
- Grayscale storage reduces footprint by ~66%

### Negative
- Vision LLM API costs (~$0.01-0.03 per image)
- Additional processing time during ingestion
- External dependency on Vision LLM availability
- Two-step classification + description increases API calls

### Neutral
- New `visuals` table adds minimal database complexity
- Images stored externally (consistent with document storage pattern)
- Requires Python for layout detection (optional, can use pure JS alternatives)

## Schema

```
visuals table:
├── id: number                 # Hash-based ID
├── catalog_id: number         # FK to catalog
├── catalog_title: string      # Derived
├── image_path: string         # Path to grayscale PNG
├── description: string        # LLM-generated semantic description
├── vector: Float32Array       # 384-dim embedding of description
├── visual_type: string        # diagram|chart|table|figure
├── page_number: number        # Page in source document
├── bounding_box: string       # JSON: {x, y, width, height}
├── concept_ids: number[]      # Concepts from description
├── concept_names: string[]    # Derived
└── chunk_ids: number[]        # Nearby text chunks
```

## Implementation

Three scripts for incremental adoption:

1. **`add-visuals-table.ts`**: Migration script to add empty visuals table
2. **`extract-visuals.ts`**: Extract diagrams from documents
3. **`describe-visuals.ts`**: Generate semantic descriptions

## Alternatives Considered

### CLIP Embeddings
- **Rejected:** Incompatible embedding space, poor diagram understanding, no concept extraction

### Store All Visuals
- **Rejected:** Photos/decorative images add noise, increase storage without semantic value

### Color Image Storage
- **Rejected:** 3x storage cost, minimal benefit since meaning captured in description

### Extend Chunks Table
- **Rejected:** Schema pollution, different indexing needs, chunks designed for text

## References

- [Issue #51: Add diagram awareness](https://github.com/m2ux/concept-rag/issues/51)
- [ADR0009: Three Table Architecture](./adr0009-three-table-architecture.md)
- [ADR0046: Document Type Classification](./adr0046-document-type-classification.md)


