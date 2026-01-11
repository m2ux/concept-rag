# Integer ID Optimization Planning

**Date**: 2025-11-19  
**Branch**: `feature/category-search-tool`  
**Status**: Planning Phase

## Overview

This planning folder contains comprehensive documentation for optimizing the Concept-RAG database schema by replacing text-based cross-references with integer IDs.

## Problem Statement

Current schema uses repeated text strings for cross-references:
- Catalog entries reference concepts by name strings (~50-100 bytes each)
- Concepts table references source documents by file path strings (~100-200 bytes each)
- Chunks reference concepts by name strings

This results in:
- Inefficient storage (70-80% of reference data is redundant)
- Slower comparisons (string matching vs integer equality)
- Higher memory usage during queries

## Proposed Solution

Replace text-based cross-references with integer IDs while maintaining denormalized array structure (no junction tables):

```typescript
// BEFORE
catalog.concepts: '["microservices","API gateway","service mesh"]'
concepts.sources: '["/path/doc1.pdf", "/path/doc2.pdf"]'

// AFTER
catalog.concept_ids: '[42, 73, 156]'  // 70% smaller, faster comparisons
concepts.catalog_ids: '[5, 12, 23]'   // 80% smaller, consistent pattern
```

This preserves LanceDB's vector-database-optimized architecture while gaining relational database benefits.

## Planning Documents

### 1. Migration Plan (`01-migration-plan.md`)
Comprehensive migration strategy covering:
- Schema changes (backward-compatible)
- Data migration procedures
- Rollback strategy
- Testing requirements
- Timeline and risk assessment

### 2. ConceptIdCache Design (`02-concept-id-cache-design.md`)
In-memory caching layer design:
- Cache architecture and initialization
- API design and usage patterns
- Performance characteristics
- Memory footprint analysis

### 3. Code Locations Map (`03-code-locations-map.md`)
Complete inventory of code requiring updates:
- Schema definitions and interfaces
- Repository implementations
- Ingestion pipeline changes
- MCP tool updates
- Test file modifications

### 4. Prototype Implementation Guide (`04-prototype-implementation-guide.md`)
Step-by-step implementation instructions:
- Phase 1: Schema and infrastructure
- Phase 2: Ingestion pipeline
- Phase 3: Query layer updates
- Phase 4: Testing and validation
- Verification procedures

## Design Decisions

### What We're Changing
- ✅ Add `concept_ids` field to catalog table
- ✅ Add `concept_ids` field to chunks table
- ✅ Add `catalog_ids` field to concepts table (replaces file path strings)
- ✅ Implement ConceptIdCache for ID↔name resolution
- ✅ Update ingestion pipeline to populate both old and new fields

### What We're NOT Changing
- ❌ No junction tables (keeps denormalized structure)
- ❌ Keep `source` paths in chunks/catalog (needed for filesystem access)
- ❌ Keep old `concepts` and `sources` fields during migration (backward compatibility)
- ❌ No changes to vector indexes or search algorithms

### Key Principles
1. **Backward Compatible**: Run old and new fields in parallel during migration
2. **LanceDB Native**: Preserve embedded arrays, no relational JOINs
3. **Consistent**: Use integer IDs for all cross-references (concepts and documents)
4. **Measurable**: Add metrics to validate performance improvements
5. **Reversible**: Keep old fields until new system proven stable

## Expected Benefits

### Storage
- 20-30% overall database size reduction
- 70-80% reduction in concept reference storage
- 80% reduction in document reference storage (concepts table)
- Typical 100 MB database → 70-80 MB

### Performance
- 2-3x faster concept filtering (integer equality vs string matching)
- 10-20% faster typical queries
- Reduced memory allocation during JSON parsing

### Maintainability
- Stronger referential integrity (invalid IDs detectable)
- Concept renames don't break references
- Easier to track concept usage statistics

## Trade-offs

### Additional Complexity
- Requires in-memory cache (1-5 MB for 10k concepts)
- Display names need cache lookup (negligible overhead)
- Migration requires database rebuild

### Not Addressing
- Source paths in chunks/catalog (needed for filesystem access)
- Junction table benefits (explicitly rejected)
- Vector index optimization (separate concern)

## Success Metrics

### Must Have
- [ ] All existing tests pass
- [ ] Database size reduced by ≥20%
- [ ] No query performance regression
- [ ] Backward compatibility maintained

### Should Have
- [ ] Concept filtering 2x faster (benchmark)
- [ ] Memory usage unchanged or improved
- [ ] Migration completes in <5 minutes for typical dataset

### Nice to Have
- [ ] Overall query latency reduced 10%+
- [ ] Reduced GC pressure during queries
- [ ] Simpler concept statistics queries

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance regression | Low | High | Benchmark before/after, keep old fields for rollback |
| Migration data loss | Low | Critical | Test migration on copy, validate checksums |
| Cache memory issues | Low | Medium | Lazy loading, configurable cache size |
| Breaking changes | Medium | Medium | Parallel field strategy, comprehensive testing |
| Concept ID collisions | Very Low | High | Use stable auto-generated IDs, validate uniqueness |

## Timeline Estimate

- **Planning**: 1 day (this document)
- **Implementation**: 2-3 days
  - Schema changes: 4 hours
  - Cache implementation: 4 hours
  - Ingestion updates: 6 hours
  - Repository updates: 6 hours
  - Tool updates: 4 hours
- **Testing**: 1 day
- **Migration**: 2 hours (database rebuild)
- **Validation**: 4 hours

**Total**: 4-5 days

## Next Steps

1. ✅ Review planning documents for accuracy and completeness
2. ⏸️ Get stakeholder approval on approach
3. ⏸️ Create feature branch (already done)
4. ⏸️ Implement Phase 1 (schema + cache)
5. ⏸️ Implement Phase 2 (ingestion pipeline)
6. ⏸️ Implement Phase 3 (repositories and tools)
7. ⏸️ Run migration and validate
8. ⏸️ Performance benchmarking
9. ⏸️ Documentation updates
10. ⏸️ Create PR

## Related Resources

- Database schema reference: `database-schema-reference.md`
- Current branch: `feature/category-search-tool`
- Main ingestion: `hybrid_fast_seed.ts`
- Config file: `src/config.ts`

## Notes

- This optimization is complementary to the category search tool work
- Can be implemented incrementally without breaking existing functionality
- Future Phase 2 could optimize source references if profiling shows benefit
- Consider this a "Phase 1.5" - storage optimization before more complex changes

---

**Status Legend**:
- ✅ Completed
- ⏸️ Pending
- 🚧 In Progress
- ❌ Blocked/Cancelled

