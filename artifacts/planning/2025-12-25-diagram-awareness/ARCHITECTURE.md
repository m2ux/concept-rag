# Diagram Awareness: Architecture

## Design Decisions

### Storage: External Files + DB References

| Approach | Pros | Cons |
|----------|------|------|
| ~~Embedded blobs in LanceDB~~ | Single data store | Significant DB size increase, slower queries |
| **External file storage + DB references** ✓ | Minimal DB impact, efficient image serving | Two systems to maintain |
| ~~Hybrid (thumbnails in DB)~~ | Fast previews | Most complex |

**Decision:** External storage with references - aligns with how document sources are already handled, and images can be large.

### Schema: New `visuals` Table

| Approach | Pros | Cons |
|----------|------|------|
| ~~Extend chunks table~~ | Unified search | Schema pollution, chunks designed for text |
| **New visuals table** ✓ | Clean separation, dedicated indexing | New table to query |
| ~~Linked model~~ | Context preservation | Join complexity |

**Decision:** New `visuals` table with linkage to chunks via `chunk_ids` array.

### Searchability: LLM Descriptions + Existing Embeddings

| Approach | Pros | Cons |
|----------|------|------|
| **LLM descriptions + embeddings** ✓ | Rich semantics, works with existing pipeline | API costs |
| ~~CLIP embeddings~~ | Direct image-to-text | Different embedding space, poor diagram understanding |
| ~~Caption/OCR only~~ | Simple, fast | Limited semantics |

**Decision:** Vision LLM descriptions - provides semantic understanding of diagrams that CLIP cannot achieve. CLIP struggles with technical diagrams (trained on photos) and uses incompatible embedding space.

### Image Storage Format

| Approach | Pros | Cons |
|----------|------|------|
| **Grayscale storage** ✓ | ~66% size reduction, sufficient for reference | Loses color |
| ~~Color storage~~ | Full fidelity | 3x storage cost |
| ~~Adaptive~~ | Best of both | Complex heuristics |

**Decision:** Store images as grayscale for storage efficiency. Vision LLM receives full-color image during analysis (before storage) to capture color semantics in the description.

### Content Filtering

| Approach | Pros | Cons |
|----------|------|------|
| **Store only semantic diagrams** ✓ | Clean data, meaningful search | Classification overhead |
| ~~Store all visuals~~ | Complete extraction | Noise from photos, decorative images |

**Decision:** Only store diagrams with semantic meaning (flowcharts, UML, charts, tables, figures). Photos, screenshots, and decorative images are detected but NOT stored - they add no value to text comprehension.

## System Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   catalog   │──────<│   chunks    │>──────│   visuals   │
│ (documents) │       │  (segments) │       │ (diagrams)  │
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │                      │
      │                     │                      ├── image_path (grayscale PNG)
      │                     │                      ├── description (LLM-generated)
      │                     │                      ├── vector (384-dim embedding)
      │                     │                      ├── visual_type (diagram|chart|...)
      │                     │                      └── concept_ids (linked concepts)
```

## Schema: `visuals` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `number` | Hash-based ID (FNV-1a of catalog_id + page + index) |
| `catalog_id` | `number` | Foreign key to catalog (source document) |
| `catalog_title` | `string` | DERIVED: Document title |
| `image_path` | `string` | Path to extracted image file (relative to db) |
| `description` | `string` | LLM-generated semantic description |
| `vector` | `Float32Array` | 384-dim embedding of description |
| `visual_type` | `string` | `diagram` \| `flowchart` \| `chart` \| `table` \| `figure` |
| `page_number` | `number` | Page in source document |
| `bounding_box` | `string` | JSON: `{x, y, width, height}` |
| `concept_ids` | `number[]` | Concepts extracted from description |
| `concept_names` | `string[]` | DERIVED: Concept names |
| `chunk_ids` | `number[]` | Nearby text chunks (context) |

**Not stored:** `thumbnail_base64`, `caption`, `ocr_text` (removed from original design for simplicity)

## File Storage Layout

```
~/.concept_rag/
├── catalog.lance/
├── chunks.lance/
├── concepts.lance/
├── categories.lance/
├── visuals.lance/          # New table
└── images/                 # New folder
    └── {catalog_id}/
        ├── p{page}_v{index}.png   # Grayscale PNG
        └── ...
```

## Processing Pipeline

```
PDF Document
     │
     ▼
┌─────────────────┐
│ Page Rendering  │  pdftoppm / PyMuPDF
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Layout Detection│  LayoutParser / PyMuPDF
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Vision LLM Classification           │
│ "Is this a diagram/chart/table/     │
│  figure OR photo/decorative?"       │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │ Type?   │
    └────┬────┘
         │
         ├── diagram/flowchart/chart/table/figure → Continue
         │
         └── photo/decorative/screenshot → SKIP (not stored)
         │
         ▼
┌─────────────────┐
│ Save Grayscale  │  Convert to grayscale, save PNG
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vision LLM      │  GPT-4V / Claude 3 (receives COLOR image)
│ (Description)   │  Generates semantic description
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedding       │  all-MiniLM-L6-v2 on description
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Concept Extract │  Existing ConceptExtractor
└────────┬────────┘
         │
         ▼
   visuals table (only semantic diagrams)
```

## Classification Prompt

```
Analyze this image from a technical document.

Classify as ONE of:
- diagram: flowchart, UML, architecture, state machine, sequence diagram
- chart: bar, line, pie, scatter, histogram, graph
- table: structured tabular data
- figure: technical illustration with labels, annotated diagram
- skip: photo, screenshot, decorative image, logo, icon

Respond with ONLY the single word classification.
```

## Search Integration

### Enrichment Mode (MVP)

Existing search tools return `visual_ids` array in results. Client fetches visuals separately.

```typescript
// broad_chunks_search response
{
  chunks: [...],
  visual_ids: [123, 456]  // New field - diagrams near matching chunks
}

// New tool: get_visuals
{
  visuals: [
    { id: 123, image_path: "...", description: "...", visual_type: "diagram" }
  ]
}
```

## Dependencies

### Node.js
```json
{
  "sharp": "^0.33.x"  // Image processing, grayscale conversion
}
```

### Python (for layout detection)
```
PyMuPDF>=1.23.0  # PDF processing with layout detection
# OR
layoutparser[effdet]  # Layout detection with EfficientDet
```

### External Services
- Vision LLM API (OpenRouter: GPT-4V or Claude 3)
- Rate limiting: ~1 image per 2-3 seconds

## Scripts

| Script | Purpose |
|--------|---------|
| `add-visuals-table.ts` | Migration: Add empty visuals table to existing DB |
| `extract-visuals.ts` | Extract diagrams from documents (incremental) |
| `describe-visuals.ts` | Generate descriptions for extracted visuals |

## Configuration

```typescript
interface VisualExtractionConfig {
  enabled: boolean;              // Enable visual extraction (default: false)
  minWidth: number;              // Minimum visual width in pixels (default: 100)
  minHeight: number;             // Minimum visual height in pixels (default: 100)
  storageFormat: 'grayscale';    // Always grayscale for storage
  analysisFormat: 'color';       // Always color for Vision LLM
  visionModel: string;           // OpenRouter model for descriptions
  maxVisualsPerPage: number;     // Limit visuals per page (default: 10)
}
```

