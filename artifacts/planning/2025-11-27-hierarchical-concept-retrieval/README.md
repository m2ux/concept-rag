# Hierarchical Concept Retrieval: Pages Table & Concept-Centric Search

**Date**: 2025-11-27  
**Status**: 🔄 In Progress  
**Priority**: High  
**Branch**: `schema-normalization` (extends current work)

## Overview

This planning folder documents the implementation of a **pages table** and **hierarchical concept retrieval** strategy to improve concept-to-chunk mapping from ~42% to ~100% coverage. The approach uses LLM-based page-level concept extraction instead of fuzzy text matching.

## Problem Statement

The current system has a fundamental mismatch between concept extraction and chunk assignment:

1. **Concept Extraction**: Semantic (LLM infers concepts from document meaning)
2. **Chunk Assignment**: Syntactic (fuzzy text matching for literal strings)

This results in:
- Only **42% of concepts** have chunk mappings
- ~35,000 concepts exist in the concepts table with no chunk references
- Semantic concepts like "strategic deception" are correctly extracted but never matched to chunks because the exact phrase doesn't appear in the text

## Solution: Page-Based Concept Extraction

Instead of fuzzy text matching, we:
1. Mark document content with page numbers before LLM extraction
2. Have the LLM report which pages each concept appears on
3. Map pages to chunks (chunks already have page metadata)
4. Achieve 100% concept-to-chunk mapping via semantic page attribution

## Key Findings from Investigation

| Metric | Current Approach | Page-Based Approach |
|--------|------------------|---------------------|
| Concept-chunk mapping rate | 42% | 100% |
| Mapping accuracy | Text-verified only | Semantically correct |
| Pages with concepts | N/A | 65.6% |
| Avg concepts per page | N/A | 2.5 |

## Documents in This Folder

| # | Document | Description |
|---|----------|-------------|
| 0 | `00-chat-summary.md` | Summary of planning discussion |
| 1 | `01-strategy-appraisal.md` | Detailed analysis of retrieval strategies |
| 2 | `02-pages-table-schema.md` | Pages table specification |
| 3 | `03-implementation-plan.md` | Phased implementation approach |
| 4 | `04-llm-consumption-patterns.md` | How LLMs use tool results for inference |

## Prototype Artifacts

The following prototype scripts have been created and tested:

1. **`scripts/prototype_page_concept_extraction.ts`** - Proof-of-concept for page-based extraction
2. **`scripts/seed_pages_table.ts`** - Production seeding script with resume capability

### Prototype Test Results (sample-docs)

| Document | Pages | Pages with Concepts | Concepts Extracted |
|----------|-------|---------------------|-------------------|
| Sun Tzu - Art Of War | 144 | 111 (77%) | 88 |
| Clean Architecture | 204 | 163 (80%) | 106 |
| Design Patterns | 431 | 237 (55%) | 111 |
| **Total** | **779** | **511 (65.6%)** | **305** |

## Recommended Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   catalog   │────▶│    pages    │────▶│   chunks    │
│ (documents) │     │ (sections)  │     │ (paragraphs)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  concepts   │
                    │ (the index) │
                    └─────────────┘
```

**Key Changes**:
1. New `pages` table linking documents, concepts, and chunks
2. Add `page_number` field to chunks for efficient joins
3. Hierarchical retrieval: concept → pages → chunks

## Success Criteria

- [ ] Pages table created with all fields (id, catalog_id, page_number, concept_ids, text_preview, vector)
- [ ] All existing documents processed and pages seeded
- [ ] `page_number` added to chunks table
- [ ] `concept_density` restored to chunks table (new calculation from concept_ids)
- [ ] Concept-to-chunk mapping achieves ~100% via page intermediary
- [ ] `concept_search` tool upgraded to use hierarchical retrieval (replaces old implementation)
- [ ] All existing MCP tools continue to function
- [ ] ADR documenting the architectural change

## Implementation Phases

| Phase | Description | Duration |
|-------|-------------|----------|
| 1. Pages Table Seeding | Populate pages table from existing documents | 4-8 hours |
| 2. Schema Migration | Add page_number to chunks | 2 hours |
| 3. Integration | Wire pages table into retrieval flow | 4 hours |
| 4. Testing | Validate all tools work with new architecture | 2 hours |
| 5. Documentation | ADR and schema documentation | 1 hour |

## Related Documents

- `.engineering/artifacts/planning/2025-11-26-schema-normalization/` - Current schema normalization
- `docs/architecture/adr0009-three-table-architecture.md` - Original table architecture
- `docs/architecture/adr0043-schema-normalization.md` - Recent normalization changes
- `docs/database-schema.md` - Current schema specification

