# Issue #51: Add Diagram Awareness

## Problem Statement

Concept-RAG currently processes PDF and EPUB documents to extract text-based chunks and concepts. However, many technical documents contain valuable visual content (diagrams, flowcharts, charts, figures) that convey information not captured in text. This visual information is currently lost during ingestion.

**Current state:**
- Documents are chunked as text segments only
- Diagrams are either ignored or produce garbled OCR artifacts
- Search results cannot surface or leverage visual content
- Users cannot find documents based on diagram content

**Desired state:**
- Diagrams and visual content are detected and extracted during ingestion
- Visual content is stored as searchable "visual tokens"
- Search results can be enriched with relevant diagrams
- Visual inference enables concept discovery from diagrams

## Goal

Extract and store diagrams as searchable **"visual tokens"** that enrich search results with visually codified information. Enable visual inference on concepts and data.

## Scope

### In Scope
- Flowcharts, UML diagrams, architecture diagrams
- Charts and graphs (bar, line, pie, etc.)
- Figures with captions, photos, illustrations
- Tables (as visual content)

### Out of Scope
- Mathematical equations (already handled via `has_math` flag)

## User Stories

### US-1: Diagram Extraction
> As a user, I want diagrams extracted from my documents during seeding so that visual information is preserved in the knowledge base.

**Acceptance Criteria:**
- [ ] Diagrams, charts, and figures are detected in PDF documents
- [ ] Each visual is extracted as a separate image file
- [ ] Visual metadata includes: page number, bounding box, visual type
- [ ] Extraction works for both native PDFs and scanned documents

### US-2: Visual Description Generation
> As a user, I want each diagram to have an LLM-generated description so that it becomes searchable via semantic search.

**Acceptance Criteria:**
- [ ] Vision LLM generates a textual description of each visual
- [ ] Description captures: diagram type, key elements, relationships depicted
- [ ] Description is embedded using the existing embedding model (all-MiniLM-L6-v2)
- [ ] Concepts are extracted from visual descriptions

### US-3: Visual-Enriched Search Results
> As a user, I want search results to include relevant diagrams so that I get both textual and visual context for my queries.

**Acceptance Criteria:**
- [ ] `broad_chunks_search` can optionally return associated visuals
- [ ] `concept_search` can surface diagrams linked to concepts
- [ ] Visual results include: image reference, description, source document
- [ ] Results are ranked by relevance to query

### US-4: Visual Type Filtering
> As a user, I want to filter search results by visual type so that I can find specific kinds of diagrams.

**Acceptance Criteria:**
- [ ] Visuals are classified by type: `diagram`, `chart`, `figure`, `table`
- [ ] Search tools accept optional `visual_type` filter
- [ ] Classification uses both heuristics and LLM analysis

## Technical Approach

**Hybrid pipeline:**
1. **Detection** (local): LayoutParser or PyMuPDF for bounding box detection
2. **Extraction** (local): Save visual regions as PNG files
3. **Description** (LLM): Vision model generates textual description
4. **Embedding**: Use existing all-MiniLM-L6-v2 on descriptions
5. **Concepts**: Extract concepts from descriptions using existing pipeline

## Schema Addition

New `visuals` table with:
- `image_path`: External file reference
- `description`: LLM-generated description
- `vector`: 384-dim embedding of description
- `visual_type`: diagram | chart | figure | table | photo
- `concept_ids`: Linked concepts from description
- `chunk_ids`: Nearby text chunks for context

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete schema.

## References

- [KDNuggets: Top 7 Open Source OCR Models](https://www.kdnuggets.com/top-7-open-source-ocr-models)
- [LayoutParser](https://layout-parser.github.io/)
- [PaddleOCR Layout Analysis](https://github.com/PaddlePaddle/PaddleOCR)
- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/)






