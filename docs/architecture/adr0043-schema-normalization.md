# ADR-0043: Schema Normalization

**Date:** 2025-11-26  
**Status:** Accepted  
**Deciders:** Development Team  
**Supersedes:** Partial aspects of ADR-0027

## Context

Following the hash-based integer ID migration (ADR-0027), the database schema contained significant redundancy:

1. **Dual representation of concepts**: Both JSON-serialized string arrays (`concepts`) and integer ID arrays (`concept_ids`) stored the same information
2. **Redundant category fields**: `concept_categories` (names) duplicated `category_ids` (integers)
3. **Computed values stored**: `concept_density` and `chunk_count` stored instead of computed on demand
4. **Dead code fields**: `concept_type`, `enrichment_source`, `technical_terms` never used in queries
5. **Legacy string arrays**: Fields like `sources` and `related_concepts` stored as JSON strings instead of native arrays

This redundancy caused:
- **Storage overhead**: ~25% larger database than necessary
- **Consistency risk**: Multiple sources of truth could diverge
- **Maintenance burden**: Updates required synchronizing multiple fields
- **Query complexity**: Code needed fallback logic for both old and new formats

## Decision

Remove all redundant fields and establish native arrays as the single source of truth.

### Fields Removed

| Table | Removed Fields | Replacement |
|-------|---------------|-------------|
| **Catalog** | `concepts`, `concept_categories`, `loc`, `filename_tags` | `category_ids` (native array) |
| **Chunks** | `concepts`, `concept_categories`, `concept_density` | `concept_ids`, `category_ids` (native arrays) |
| **Concepts** | `concept_type`, `category`, `sources`, `related_concepts`, `chunk_count`, `enrichment_source` | `catalog_ids`, `related_concept_ids` (native arrays) |

### New Schema Principles

1. **Native arrays**: All array fields stored as LanceDB native arrays, not JSON strings
2. **ID-based references**: Relationships use integer IDs exclusively (no string paths)
3. **Compute on demand**: Statistics like `chunk_count` computed via queries when needed
4. **Single source of truth**: No duplicate representations of the same data

## Consequences

### Positive

- **Storage reduction**: ~25% reduction in database size
- **Simpler code**: No fallback logic for legacy formats
- **Faster queries**: Native array operations vs JSON parsing
- **Data integrity**: Single source of truth eliminates consistency issues
- **Cleaner domain models**: TypeScript interfaces match database schema exactly

### Negative

- **Breaking change**: Requires database migration or rebuild
- **Cache dependency**: Concept/category name resolution requires ID caches
- **Computation overhead**: Some values now computed on demand instead of pre-stored

### Migration Strategy

Clean rebuild approach:
1. Update domain models and repositories
2. Create migration script to transform existing data
3. Run validation script to verify schema
4. Re-seed from source documents if migration fails

## Validation

Schema validation script checks:
- Required fields present
- Deprecated fields absent
- Array fields are native arrays (not JSON strings)
- Integer IDs are numbers (not strings)

## Related Decisions

- [ADR-0027: Hash-Based Integer IDs](adr0027-hash-based-integer-ids.md) - Introduced the ID system now fully adopted
- [ADR-0009: Three-Table Architecture](adr0009-three-table-architecture.md) - Original table design
- [ADR-0028: Category Storage Strategy](adr0028-category-storage-strategy.md) - Category table design

## References

- Planning documents: `.ai/planning/2025-11-26-schema-normalization/`
- Migration script: `scripts/migrate_to_normalized_schema.ts`
- Validation script: `scripts/validate_normalized_schema.ts`
- Domain models: `src/domain/models/`






