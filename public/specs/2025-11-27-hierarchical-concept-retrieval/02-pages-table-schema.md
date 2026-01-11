# Pages Table Schema Specification

**Date**: 2025-11-27  
**Status**: Implemented (prototype)

## Overview

The `pages` table provides page-level concept associations, enabling hierarchical retrieval from concept → pages → chunks.

## Schema Definition

```typescript
interface PageRecord {
  /** Hash-based unique identifier */
  id: number;
  
  /** Parent document ID (references catalog.id) */
  catalog_id: number;
  
  /** 1-indexed page number within document */
  page_number: number;
  
  /** Concepts discussed on this page (hash-based IDs) */
  concept_ids: number[];
  
  /** First 500 characters of page content */
  text_preview: string;
  
  /** 384-dimensional embedding for page-level similarity search */
  vector: number[];
}
```

## Field Details

### `id`
- **Type**: `number` (integer)
- **Generation**: `hashToId(${catalog_id}-${page_number})`
- **Purpose**: Unique identifier for the page
- **Notes**: Hash-based for stability across rebuilds

### `catalog_id`
- **Type**: `number` (integer)
- **References**: `catalog.id`
- **Purpose**: Links page to parent document
- **Index**: Should be indexed for efficient document lookups

### `page_number`
- **Type**: `number` (integer)
- **Range**: 1 to N (1-indexed)
- **Purpose**: Physical page number in source document
- **Notes**: Extracted from PDF metadata `loc.pageNumber`

### `concept_ids`
- **Type**: `number[]` (array of integers)
- **References**: `concepts.id`
- **Purpose**: Concepts discussed on this page
- **Notes**: 
  - Populated by LLM during extraction
  - Use `[0]` as placeholder for pages with no concepts (LanceDB schema requirement)
  - Typical range: 0-15 concepts per page

### `text_preview`
- **Type**: `string`
- **Max Length**: 500 characters
- **Purpose**: Preview for debugging and quick inspection
- **Notes**: First 500 chars of page content, useful for verification

### `vector`
- **Type**: `number[]` (array of floats)
- **Dimensions**: 384 (matches other tables)
- **Purpose**: Page-level semantic search
- **Notes**: Generated from full page text, enables page similarity queries

## LanceDB Table Creation

```typescript
// From seed_pages_table.ts
const initialRecord: PageRecord = {
  id: 0,
  catalog_id: 0,
  page_number: 0,
  concept_ids: [0],  // Placeholder for schema inference
  text_preview: 'placeholder',
  vector: new Array(384).fill(0)
};

const table = await db.createTable('pages', [initialRecord], { mode: 'create' });
await table.delete('id = 0');  // Remove placeholder
```

## Relationships

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   catalog    │ 1───N   │    pages     │ 1───N   │    chunks    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id           │◄────────│ catalog_id   │         │ catalog_id   │
│ source       │         │ page_number  │────────►│ page_number  │
│ summary      │         │ concept_ids  │         │ concept_ids  │
└──────────────┘         │ text_preview │         │ text         │
                         │ vector       │         │ vector       │
                         └──────────────┘         └──────────────┘
                                │
                                │ N
                                │
                         ┌──────▼───────┐
                         │   concepts   │
                         ├──────────────┤
                         │ id           │
                         │ concept      │
                         │ catalog_ids  │
                         │ chunk_ids    │
                         └──────────────┘
```

## Queries

### Find pages for a concept
```typescript
const pages = await pagesTable
  .query()
  .where(`array_contains(concept_ids, ${conceptId})`)
  .toArray();
```

### Find pages for a document
```typescript
const pages = await pagesTable
  .query()
  .where(`catalog_id = ${catalogId}`)
  .toArray();
```

### Vector search for similar pages
```typescript
const similar = await pagesTable
  .vectorSearch(queryVector)
  .where(`catalog_id = ${catalogId}`)
  .limit(10)
  .toArray();
```

## Statistics from Prototype

| Metric | Value |
|--------|-------|
| Total pages (3 sample docs) | 779 |
| Pages with concepts | 511 (65.6%) |
| Avg concepts per page | 2.5 |
| Pages per document (avg) | 260 |

## Migration Considerations

### For Existing Data
1. Run `seed_pages_table.ts` to populate from original PDFs
2. Script supports resume if interrupted
3. Process in batches (default: 5 documents per checkpoint)

### For New Documents
1. Modify `hybrid_fast_seed.ts` to create page records during seeding
2. Extract concepts with page numbers using page-marked prompts
3. Create page records alongside chunk creation

## Future Enhancements

1. **Section Detection**: Add `section_title` field for chapter/section headers
2. **Page Type**: Classify pages (content, TOC, index, bibliography)
3. **Reading Order**: Add `sequence` field for logical ordering
4. **Cross-References**: Track page-to-page references within document
















