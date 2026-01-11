# Implementation Plan: Hierarchical Concept Retrieval

**Date**: 2025-11-27  
**Status**: Ready for Implementation

## Overview

This document outlines the phased implementation approach for integrating the pages table into the concept-RAG retrieval system.

## Prerequisites

- [x] Pages table prototype created (`seed_pages_table.ts`)
- [x] Prototype tested on sample-docs
- [x] Strategy approved (see `01-strategy-appraisal.md`)

## Phase 1: Populate Pages Table for Main Database

**Duration**: 4-8 hours (depends on document count)  
**Risk**: Low  
**Dependencies**: None

### Tasks

1. **Run seeding script on main database**
   ```bash
   cd concept-rag
   source .envrc
   npx tsx scripts/seed_pages_table.ts --batch-size 10
   ```

2. **Monitor progress**
   - Checkpoint saved every 10 documents
   - Can interrupt and resume with `--resume` flag
   - Check `data/pages_seed_checkpoint.json` for status

3. **Validate results**
   ```bash
   npx tsx -e "
   import * as lancedb from '@lancedb/lancedb';
   const db = await lancedb.connect(process.env.HOME + '/.concept_rag');
   const pages = await db.openTable('pages');
   console.log('Pages count:', await pages.countRows());
   "
   ```

### Success Criteria
- [ ] All catalog documents processed
- [ ] Pages table created with >50% pages having concepts
- [ ] No processing failures (or failures logged for investigation)

---

## Phase 2: Add page_number and Restore concept_density to Chunks Table

**Duration**: 3 hours  
**Risk**: Medium (schema change)  
**Dependencies**: None (can run in parallel with Phase 1)

### Tasks

1. **Update domain model** (`src/domain/models/chunk.ts`)
   ```typescript
   export interface Chunk {
     // ... existing fields ...
     
     /** Page number within source document (1-indexed) */
     pageNumber?: number;
     
     /** Concept density score (0-1) based on concept_ids count / word count */
     conceptDensity?: number;
   }
   ```

2. **Update chunk repository** (`src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`)
   - Add `page_number` to `mapRowToChunk()`
   - Add `concept_density` to `mapRowToChunk()`
   - Add both fields to returned `Chunk` objects

3. **Create migration script** (`scripts/add_chunk_fields.ts`)
   ```typescript
   // For each chunk:
   // 1. Parse loc field for pageNumber
   // 2. Calculate concept_density from concept_ids
   
   function calculateConceptDensity(conceptIds: number[], text: string): number {
     const realConceptCount = conceptIds.filter(id => id !== 0).length;
     const wordCount = text.split(/\s+/).length || 1;
     // Normalize: ~10 concepts per 100 words = density of 1.0
     return Math.min(realConceptCount / (wordCount / 10), 1.0);
   }
   ```

4. **Run migration**
   ```bash
   npx tsx scripts/add_chunk_fields.ts
   ```

### Success Criteria
- [ ] Chunk domain model updated with both fields
- [ ] Repository maps page_number and concept_density correctly
- [ ] Migration script populates page_number from loc metadata
- [ ] Migration script calculates concept_density from concept_ids
- [ ] All chunks have page_number and concept_density populated

### Concept Density Calculation

The restored `concept_density` uses a new calculation based on `concept_ids` (not fuzzy text matching):

```typescript
// OLD (removed) - based on fuzzy text matching (42% coverage)
density = matchedConceptNames.length / wordCount;

// NEW - based on assigned concept_ids (100% coverage via pages)
density = concept_ids.filter(id => id !== 0).length / (wordCount / 10);
```

**Normalization**: A chunk with 10 concepts per 100 words has density = 1.0

This enables ranking chunks by conceptual richness when multiple chunks are returned for a page range.

---

## Phase 3: Create Pages Repository

**Duration**: 2 hours  
**Risk**: Low  
**Dependencies**: Phase 1, Phase 2

### Tasks

1. **Create repository interface** (`src/domain/interfaces/repositories/pages-repository.ts`)
   ```typescript
   export interface PagesRepository {
     findByCatalogId(catalogId: number): Promise<Page[]>;
     findByConceptId(conceptId: number): Promise<Page[]>;
     findByConceptAndCatalog(conceptId: number, catalogId: number): Promise<Page[]>;
     search(query: SearchQuery): Promise<Page[]>;
   }
   ```

2. **Create domain model** (`src/domain/models/page.ts`)
   ```typescript
   export interface Page {
     id: number;
     catalogId: number;
     pageNumber: number;
     conceptIds: number[];
     textPreview: string;
     embeddings: number[];
   }
   ```

3. **Implement LanceDB repository** (`src/infrastructure/lancedb/repositories/lancedb-pages-repository.ts`)

4. **Register in container** (`src/application/container.ts`)

### Success Criteria
- [ ] PagesRepository interface defined
- [ ] Page domain model created
- [ ] LanceDB implementation working
- [ ] Repository registered in DI container

---

## Phase 4: Implement Hierarchical Retrieval Service

**Duration**: 3 hours  
**Risk**: Medium  
**Dependencies**: Phase 3

### Tasks

1. **Create service** (`src/domain/services/hierarchical-concept-service.ts`)
   ```typescript
   export class HierarchicalConceptService {
     constructor(
       private conceptRepo: ConceptRepository,
       private pagesRepo: PagesRepository,
       private chunkRepo: ChunkRepository,
       private catalogRepo: CatalogRepository
     ) {}
     
     async getConceptDeepDive(concept: string, options: DeepDiveOptions): Promise<DeepDiveResult> {
       // 1. Find concept
       // 2. Get pages where concept appears
       // 3. Get chunks for those pages
       // 4. Compose comprehensive response
     }
   }
   ```

2. **Define result types**
   ```typescript
   export interface DeepDiveResult {
     concept: Concept;
     sources: SourceWithContent[];
     relatedConcepts: Concept[];
   }
   
   export interface SourceWithContent {
     document: CatalogEntry;
     pages: PageReference[];
     passages: Chunk[];
   }
   ```

3. **Wire into container**

### Success Criteria
- [ ] Service implementation complete
- [ ] Query flow: concept → pages → chunks working
- [ ] Results include document metadata and page numbers

---

## Phase 5: Replace concept_search with Hierarchical Implementation

**Duration**: 2 hours  
**Risk**: Medium (replacing existing tool)  
**Dependencies**: Phase 4

### Tasks

1. **Update existing tool** (`src/tools/operations/concept_chunks.ts`)
   ```typescript
   export class ConceptChunksTool extends BaseTool<ConceptSearchParams> {
     name = "concept_search";  // Keep existing name
     description = `Find all chunks tagged with a specific concept. Returns concept 
       definition, source documents with page locations, relevant passages, and 
       related concepts for exploration.`;
     
     async execute(params: ConceptSearchParams) {
       // Use new hierarchical service instead of old approach
       const result = await this.hierarchicalService.getConceptDeepDive(
         params.concept,
         { 
           limit: params.limit || 10, 
           sourceFilter: params.source_filter,
           includeRelated: true
         }
       );
       return this.formatResponse(result);
     }
   }
   ```

2. **Update response format** to include:
   - Concept definition/summary
   - Source documents with page numbers
   - Passages with page attribution
   - Related concepts

3. **Maintain backward compatibility**:
   - Keep same input parameters
   - Existing fields still present in output
   - New fields are additions, not replacements

4. **Update tool description** in MCP registry

### Success Criteria
- [ ] `concept_search` uses hierarchical retrieval internally
- [ ] Returns structured response with concept + sources + passages + pages
- [ ] Backward compatible - existing callers still work
- [ ] Improved coverage (~100% vs 42%)

---

## Phase 6: Update Related Tools (Optional)

**Duration**: 2 hours  
**Risk**: Low  
**Dependencies**: Phase 3

### Tasks

1. **Update `chunks_search`** to support page filtering
   ```typescript
   interface ChunksSearchParams {
     // ... existing ...
     page_range?: { start: number; end: number };
   }
   ```

2. **Update `broad_chunks_search`** to include page info in results

3. **Update tool selection guide** to reflect enhanced `concept_search`

### Success Criteria
- [ ] Related tools continue to work (backward compatible)
- [ ] New page-based filtering available where useful
- [ ] Documentation updated

---

## Phase 7: Testing

**Duration**: 2 hours  
**Risk**: Low  
**Dependencies**: All previous phases

### Tasks

1. **Unit tests for PagesRepository**
   - findByCatalogId
   - findByConceptId
   - search

2. **Integration tests for HierarchicalConceptService**
   - Full query flow
   - Multiple sources
   - Edge cases (no pages, no chunks)

3. **MCP tool tests**
   - concept_deep_dive execution
   - Response format validation

4. **Regression tests**
   - Ensure existing tools still work
   - Run full test suite

### Success Criteria
- [ ] >80% code coverage for new code
- [ ] All integration tests pass
- [ ] No regression in existing functionality

---

## Phase 8: Documentation

**Duration**: 1 hour  
**Risk**: None  
**Dependencies**: All previous phases

### Tasks

1. **Create ADR** (`docs/architecture/adr0044-hierarchical-concept-retrieval.md`)
   - Problem statement
   - Decision
   - Consequences

2. **Update database-schema.md**
   - Add pages table specification
   - Update relationships diagram

3. **Update tool documentation**
   - Document new concept_deep_dive tool
   - Update tool selection guide

### Success Criteria
- [ ] ADR created and linked
- [ ] Schema documentation updated
- [ ] Tool docs updated

---

## Rollout Plan

### Day 1
- [ ] Phase 1: Run pages seeding on main database (background)
- [ ] Phase 2: Add page_number to chunks

### Day 2
- [ ] Phase 3: Create Pages Repository
- [ ] Phase 4: Implement Hierarchical Service

### Day 3
- [ ] Phase 5: Create concept_deep_dive tool
- [ ] Phase 6: Update existing tools (optional)
- [ ] Phase 7: Testing

### Day 4
- [ ] Phase 8: Documentation
- [ ] Final validation
- [ ] Merge to main

## Rollback Plan

If issues arise:
1. Pages table is additive - can be dropped without affecting other functionality
2. page_number on chunks is optional - existing code ignores it
3. New service/tool can be disabled in container registration
4. Existing tools remain unchanged (backward compatible)

## Monitoring

After deployment:
1. Track concept_deep_dive usage
2. Monitor query latency
3. Collect feedback on retrieval quality
4. Adjust page→chunk mapping if needed

