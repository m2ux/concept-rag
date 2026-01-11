# Diagram Awareness Feature

**Date:** 2025-12-25  
**Issue:** [#51](https://github.com/m2ux/concept-rag/issues/51)  
**Status:** In Progress (M1: Infrastructure)

## Overview

Add diagram awareness to Concept-RAG so that visual content (diagrams, charts, figures) is extracted, stored as searchable "visual tokens," and used to enrich search results.

**Key Design Decisions:**
- **Only semantic diagrams** - Photos, screenshots, decorative images are NOT stored
- **Grayscale storage** - Images stored as grayscale for efficiency; Vision LLM receives color for analysis
- **Non-destructive migration** - Augments existing production database without modifying other tables
- **Vision LLM approach** - Uses GPT-4V/Claude 3 for semantic understanding (not CLIP)

## Documents

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, schema design, processing pipeline |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phased implementation roadmap with tasks |
| [EPUB_VISUAL_EXTRACTION_PLAN.md](./EPUB_VISUAL_EXTRACTION_PLAN.md) | EPUB format support extension plan |
| [LOCAL_LAYOUT_DETECTION_PLAN.md](./LOCAL_LAYOUT_DETECTION_PLAN.md) | Local model classification (LayoutParser) |
| [SEEDING_INTEGRATION_PLAN.md](./SEEDING_INTEGRATION_PLAN.md) | Integration with document seeding pipeline |
| [ISSUE_BODY.md](./ISSUE_BODY.md) | GitHub issue description |

## Quick Reference

| Aspect | Decision |
|--------|----------|
| **Goal** | Store diagrams as visual tokens to enable visual inference on concepts |
| **Approach** | Vision LLM classification + description (not CLIP) |
| **Storage** | External grayscale PNG files + `visuals` table references |
| **Scope** | Diagrams, flowcharts, charts, tables, figures only |
| **Timeline** | ~6 weeks (5 milestones) |

## Scripts

| Script | Purpose |
|--------|---------|
| `add-visuals-table.ts` | Safe migration: adds visuals table to existing DB |
| `extract-visuals.ts` | Extract diagrams from documents |
| `describe-visuals.ts` | Generate semantic descriptions |

## Progress

- [x] Planning complete
- [ ] M1: Infrastructure (in progress)
- [ ] M2: Extraction pipeline
- [ ] M3: Description & embedding
- [ ] M4: Search integration
- [ ] M5: Testing & polish

