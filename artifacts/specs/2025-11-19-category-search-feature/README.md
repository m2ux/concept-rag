# Category Search Feature: Implementation Plan

**Created**: 2025-11-19  
**Status**: ✅ Ready for Implementation  
**Priority**: High  
**Model**: Documents have categories, concepts are category-agnostic

## Quick Start

**Start here**: Read [START-HERE.md](./START-HERE.md) for quick overview

**Then**: Follow [03-migration-plan.md](./03-migration-plan.md) phase by phase

**Safety**: Review [APPROVAL-CHECKPOINTS.md](./APPROVAL-CHECKPOINTS.md) for test-first approach

---

## Core Design

### Hash-Based IDs
- FNV-1a 32-bit hashing for perfect stability
- Same name always produces same ID
- No external mapping files needed

### Document-Category Model
- **Documents have categories** (stored on catalog/chunks)
- **Concepts have NO categories** (cross-domain reusability)
- Direct category queries (no derivation)

### Tables
1. **Categories** - Category definitions with metadata (11 fields)
2. **Catalog** - Documents with category_ids stored (+9 fields)
3. **Chunks** - Text segments with inherited category_ids (+2 fields)
4. **Concepts** - Cross-domain concepts, NO categories

---

## Planning Documents (13 total, ~237 KB)

### Quick Reference

**00. [00-planning-session-summary.md](./00-planning-session-summary.md)** (12 KB)  
Planning session summary - all key decisions documented

**⭐ [START-HERE.md](./START-HERE.md)** (7.9 KB)  
Quick overview - read this first

**📋 [README.md](./README.md)** (this file) (4.6 KB)  
Navigation and overview

### Implementation Documents

**01. [01-categories-table-design.md](./01-categories-table-design.md)** (23 KB)  
Schema design for categories table

**02. [02-category-id-cache-design.md](./02-category-id-cache-design.md)** (26 KB)  
Cache implementation (simplified - no reverse index)

**03. [03-migration-plan.md](./03-migration-plan.md)** (61 KB)  
Migration phases with test-first approach

**04. [04-code-locations-map.md](./04-code-locations-map.md)** (20 KB)  
File-by-file implementation checklist

**05. [05-category-search-tool.md](./05-category-search-tool.md)** (19 KB)  
MCP tools: category_search and list_categories

### Safety & Reference

**⚠️ [APPROVAL-CHECKPOINTS.md](./APPROVAL-CHECKPOINTS.md)** (16 KB)  
Test-first gates and user approval requirements

**📚 [database-schema-reference.md](./database-schema-reference.md)** (29 KB)  
Complete schema for all four tables

**📖 [BIBLIOGRAPHIC-FIELDS.md](./BIBLIOGRAPHIC-FIELDS.md)** (8.7 KB)  
Reserved metadata fields

**🔍 [CONCEPT-BY-CATEGORY-ANALYSIS.md](./CONCEPT-BY-CATEGORY-ANALYSIS.md)** (13 KB)  
Analysis: concept search by category (query-based, no schema change needed)

**✅ [FINAL-DESIGN-SUMMARY.md](./FINAL-DESIGN-SUMMARY.md)** (5.3 KB)  
Final design with corrected model

**📊 [IMPLEMENTATION-READY.md](./IMPLEMENTATION-READY.md)** (4.6 KB)  
Cleanup summary and readiness checklist

---

## Implementation Timeline (AI Agent)

**Phase 0**: ~15 minutes (preparation)  
**Phase 0.5**: ~30-45 minutes (test on sample-docs) 🛑 **USER APPROVAL**  
**Phase 1-6**: ~2-3 hours (implementation + tests)  
**Phase 7**: ~20-30 minutes (main DB migration) 🛑 **USER APPROVAL**  

**Total**: ~3-4 hours agent work + database rebuild time

---

## Final Schema Quick Reference

### Categories (11 fields)
```
id, category, description, parentCategoryId, aliases, relatedCategories,
document_count, chunk_count, concept_count, embeddings
```

### Catalog (adds 9 fields)
```
concept_ids, category_ids, filename_tags,
origin_hash, author, year, publisher, isbn
```

### Chunks (adds 2 fields)
```
concept_ids, category_ids
```

### Concepts (NO categories)
```
id, concept, concept_type, catalog_ids, ...
(NO category field)
```

---

## Key Features

✅ Category search by name/ID/alias  
✅ List concepts in a category (query-based)  
✅ Hash-based stable IDs  
✅ Category hierarchy support  
✅ Filename tags extraction  
✅ Reserved bibliographic fields  
✅ Direct, efficient queries  
✅ Cross-domain concepts  

---

**Next Action**: Begin Phase 0 (preparation)  
**Documents**: All updated to reflect correct model  
**Status**: ✅ Ready
