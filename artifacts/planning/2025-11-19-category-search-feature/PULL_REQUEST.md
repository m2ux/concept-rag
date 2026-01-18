# Add Category Search with Hash-Based Integer IDs

## Summary

Implements category search feature with hash-based stable IDs for concepts and categories. Adds three new MCP tools for category-based document browsing and concept discovery.

## Changes

### New Tables
- `categories` table with 46 auto-extracted categories, hash-based integer IDs

### Schema Updates
**Catalog**:
- `concept_ids`: Hash-based integer array
- `category_ids`: Hash-based integer array  
- `filename_tags`: Extracted from filename (after `--` delimiter)
- Reserved fields: `origin_hash`, `author`, `year`, `publisher`, `isbn`

**Chunks**:
- `concept_ids`: Hash-based integer array
- `category_ids`: Inherited from parent document

**Concepts**:
- `id`: Changed from sequential string to hash-based integer
- `catalog_ids`: Changed from string array to integer array
- Note: Concepts remain category-agnostic (no `category_id` field)

### New MCP Tools
- `category_search` - Find documents by category
- `list_categories` - Browse all categories
- `list_concepts_in_category` - Aggregate concepts from category documents

### New Scripts
- `scripts/complete_test_db_schema.ts` - Add concept_ids and update concepts table
- `scripts/add_categories_to_test_db.ts` - Add categories table and category_ids
- `scripts/compare_schema_vs_plan.ts` - Validate schema against spec
- Supporting scripts for extraction, validation, and testing

## Technical Details

**Hash Function**: FNV-1a (32-bit) for deterministic ID generation
- Same input always produces same output
- Stable across rebuilds
- No external mapping files needed

**Design**: Categories stored on documents (catalog/chunks), not on concepts
- Concepts are cross-domain entities
- Category-concept relationships computed at query time
- No redundant storage

**Migration**: Targeted updates (~40 sec) vs full re-ingestion (hours)

## Testing

**Schema Validation**: 6/6 checks pass
- Categories table structure
- Hash-based integer IDs
- Required fields present
- Concepts category-agnostic

**Functional Tests**: 7/7 pass
- All three category tools working
- ID resolution bidirectional
- Concept aggregation dynamic

**Test Database**: 4 docs, 18 categories, 640 concepts - all tests pass  
**Main Database**: 165 docs, 46 categories, 37K concepts - migrated successfully

## Performance

- Category search: < 10ms
- List categories: < 1ms (cached)
- Concept aggregation: ~30-130ms
- Storage: 699 MB → 324 MB (54% reduction)

## Backward Compatibility

Maintains old fields for compatibility:
- `concepts` (string field on catalog)
- `concept_categories` (string array)
- `category` (string on concepts table)

Repositories handle both old and new formats transparently.

## Documentation

Updated:
- `tool-selection-guide.md` - Added category tools to decision tree
- `USAGE.md` - Detailed usage examples
- `README.md` - Feature highlights updated
- `.engineering/artifacts/planning/2025-11-19-category-search-feature/` - Complete planning docs

## Deployment

Main database (`~/.concept_rag`) migrated successfully:
- Backup: `~/.concept_rag.backup.20251120_133730` (699 MB)
- Time: 40 seconds
- Rollback available if needed


