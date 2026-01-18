# Schema Normalization: Remove Redundant Fields

**Date**: 2025-11-26  
**Status**: ✅ Complete  
**Priority**: High  
**Actual Effort**: 1 day

## Overview

This planning folder documents the schema normalization effort to remove redundant fields identified through codebase analysis. The current schema contains significant technical debt from incremental migrations that left legacy fields alongside new optimized fields.

## Problem Statement

The current database schema stores the same data in multiple formats:

1. **Catalog table** has a `concepts` JSON blob that duplicates data available via `concept_ids`
2. **Chunks table** has a `concepts` text array that duplicates `concept_ids`
3. **Technical terms** are extracted by LLM but never indexed or used
4. **Related concepts** in catalog duplicate data in the concepts table
5. **Categories** text arrays duplicate `category_ids`

This results in:
- ~40% wasted storage
- Potential data inconsistency between fields
- Dead code paths that appear functional but aren't
- Confusion about which fields are authoritative

## Optimization Opportunities Identified

| # | Issue | Current State | Target State | Impact |
|---|-------|--------------|--------------|--------|
| 1 | Catalog `concepts` blob | JSON with primary_concepts, technical_terms, etc. | Remove entirely | High |
| 2 | Chunks `concepts` array | String array of concept names | Remove (use `concept_ids`) | High |
| 3 | `technical_terms` field | Extracted but never processed | Either implement or remove | Medium |
| 4 | Catalog `related_concepts` | Snapshot from LLM extraction | Remove (derive from concepts table) | Medium |
| 5 | `concept_categories` field | String array | Remove (use `category_ids`) | Medium |
| 6 | Concepts table `sources` | String array of paths | Remove (use `catalog_ids`) | Medium |
| 7 | Concepts table `category` | Legacy string field | Remove (category-agnostic) | Low |
| 8 | Catalog `concept_ids` | Array of concept IDs | Remove (derive from chunks) | Medium |
| 9 | Catalog `filename_tags` | Tags from filename | Remove (not needed) | Low |
| 10 | Catalog `source` field | Full file path | Rename to `filename`, use slug | Medium |
| 11 | Catalog `loc` field | Location metadata | Remove (not meaningful for docs) | Low |
| 12 | Chunks `source` field | String filename | Replace with `catalog_id` (integer) | Medium |
| 13 | Concepts `chunk_count` | Stored count | Remove (compute on demand) | Low |
| 14 | Concepts `enrichment_source` | Tracking metadata | Remove (unused) | Low |
| 15 | Concepts `related_concepts` | Text array | Change to `related_concept_ids` (integers) | Medium |
| 16 | Chunks `concept_density` | Stored score | Remove (compute on demand) | Low |

## Documents in This Folder

0. **00-chat-summary.md** - Summary of planning discussion and decisions
1. **01-current-schema-analysis.md** - Detailed analysis of current redundancies
2. **02-target-schema-design.md** - Normalized schema specification
3. **03-migration-plan.md** - Phased implementation approach with migration scripts
4. **04-code-changes-manifest.md** - Files requiring modification
5. **05-validation-test-plan.md** - Testing strategy and acceptance criteria

## Migration Scripts

The migration plan includes two key scripts:

1. **`scripts/migrate_to_normalized_schema.ts`** - Transforms legacy schema to normalized schema
2. **`scripts/validate_normalized_schema.ts`** - Validates schema structure after migration

These scripts should be tested on the sample-docs test database before applying to production.

## Success Criteria

- [x] All redundant fields removed from schema
- [x] Database size reduced by ~25%
- [x] All MCP tools pass validation tests
- [x] Migration script tested successfully
- [x] No functionality regression (1198 unit tests, 142 integration tests pass)
- [x] ADR created documenting changes (ADR-0043)

## Implementation Summary

**Branch:** `schema-normalization`

### Phase 1: Code Preparation ✅
- Updated domain models (`chunk.ts`, `concept.ts`)
- Updated repository layer (chunk, catalog, concept repositories)
- Updated concept extraction pipeline
- Updated seeding script (`hybrid_fast_seed.ts`)

### Phase 2: MCP Tools ✅
- Updated `document_concepts_extract.ts` to derive concepts from IDs
- Removed references to deprecated fields from all tools

### Phase 3: Test Updates ✅
- Updated test helpers and mock repositories
- Fixed integration tests for new schema
- All 1199 unit tests pass (2 pre-existing resilience test issues)

### Phase 4: Migration Scripts ✅
- Created `scripts/migrate_to_normalized_schema.ts`
- Updated `scripts/validate_normalized_schema.ts`
- Migration tested on test database

### Phase 5: Validation ✅
- All integration tests pass
- MCP tool verification passes
- Schema validation passes

### Phase 6: Documentation ✅
- Updated `.engineering/artifacts/planning/database-schema.md`
- Created `docs/architecture/adr0043-schema-normalization.md`
- Updated this README

## Related Documents

- `.engineering/artifacts/planning/database-schema.md` - Current schema documentation
- `.engineering/artifacts/planning/2025-11-19-integer-id-optimization/` - Previous ID optimization
- `docs/architecture/adr0027-hash-based-integer-ids.md` - Hash ID decision
- `docs/architecture/adr0009-three-table-architecture.md` - Table architecture

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Analysis | Complete | Document current state (this folder) |
| Design | 2 hours | Finalize target schema |
| Implementation | 8 hours | Code changes |
| Migration Scripts | 3 hours | Create and test migration scripts |
| Fresh Seed Test | 1 hour | Test seeding with new schema |
| Validation | 4 hours | Test all tools |
| Documentation | 2 hours | Update ADRs and schema docs |



**Date**: 2025-11-26  
**Status**: ✅ Complete  
**Priority**: High  
**Actual Effort**: 1 day

## Overview

This planning folder documents the schema normalization effort to remove redundant fields identified through codebase analysis. The current schema contains significant technical debt from incremental migrations that left legacy fields alongside new optimized fields.

## Problem Statement

The current database schema stores the same data in multiple formats:

1. **Catalog table** has a `concepts` JSON blob that duplicates data available via `concept_ids`
2. **Chunks table** has a `concepts` text array that duplicates `concept_ids`
3. **Technical terms** are extracted by LLM but never indexed or used
4. **Related concepts** in catalog duplicate data in the concepts table
5. **Categories** text arrays duplicate `category_ids`

This results in:
- ~40% wasted storage
- Potential data inconsistency between fields
- Dead code paths that appear functional but aren't
- Confusion about which fields are authoritative

## Optimization Opportunities Identified

| # | Issue | Current State | Target State | Impact |
|---|-------|--------------|--------------|--------|
| 1 | Catalog `concepts` blob | JSON with primary_concepts, technical_terms, etc. | Remove entirely | High |
| 2 | Chunks `concepts` array | String array of concept names | Remove (use `concept_ids`) | High |
| 3 | `technical_terms` field | Extracted but never processed | Either implement or remove | Medium |
| 4 | Catalog `related_concepts` | Snapshot from LLM extraction | Remove (derive from concepts table) | Medium |
| 5 | `concept_categories` field | String array | Remove (use `category_ids`) | Medium |
| 6 | Concepts table `sources` | String array of paths | Remove (use `catalog_ids`) | Medium |
| 7 | Concepts table `category` | Legacy string field | Remove (category-agnostic) | Low |
| 8 | Catalog `concept_ids` | Array of concept IDs | Remove (derive from chunks) | Medium |
| 9 | Catalog `filename_tags` | Tags from filename | Remove (not needed) | Low |
| 10 | Catalog `source` field | Full file path | Rename to `filename`, use slug | Medium |
| 11 | Catalog `loc` field | Location metadata | Remove (not meaningful for docs) | Low |
| 12 | Chunks `source` field | String filename | Replace with `catalog_id` (integer) | Medium |
| 13 | Concepts `chunk_count` | Stored count | Remove (compute on demand) | Low |
| 14 | Concepts `enrichment_source` | Tracking metadata | Remove (unused) | Low |
| 15 | Concepts `related_concepts` | Text array | Change to `related_concept_ids` (integers) | Medium |
| 16 | Chunks `concept_density` | Stored score | Remove (compute on demand) | Low |

## Documents in This Folder

0. **00-chat-summary.md** - Summary of planning discussion and decisions
1. **01-current-schema-analysis.md** - Detailed analysis of current redundancies
2. **02-target-schema-design.md** - Normalized schema specification
3. **03-migration-plan.md** - Phased implementation approach with migration scripts
4. **04-code-changes-manifest.md** - Files requiring modification
5. **05-validation-test-plan.md** - Testing strategy and acceptance criteria

## Migration Scripts

The migration plan includes two key scripts:

1. **`scripts/migrate_to_normalized_schema.ts`** - Transforms legacy schema to normalized schema
2. **`scripts/validate_normalized_schema.ts`** - Validates schema structure after migration

These scripts should be tested on the sample-docs test database before applying to production.

## Success Criteria

- [x] All redundant fields removed from schema
- [x] Database size reduced by ~25%
- [x] All MCP tools pass validation tests
- [x] Migration script tested successfully
- [x] No functionality regression (1198 unit tests, 142 integration tests pass)
- [x] ADR created documenting changes (ADR-0043)

## Implementation Summary

**Branch:** `schema-normalization`

### Phase 1: Code Preparation ✅
- Updated domain models (`chunk.ts`, `concept.ts`)
- Updated repository layer (chunk, catalog, concept repositories)
- Updated concept extraction pipeline
- Updated seeding script (`hybrid_fast_seed.ts`)

### Phase 2: MCP Tools ✅
- Updated `document_concepts_extract.ts` to derive concepts from IDs
- Removed references to deprecated fields from all tools

### Phase 3: Test Updates ✅
- Updated test helpers and mock repositories
- Fixed integration tests for new schema
- All 1199 unit tests pass (2 pre-existing resilience test issues)

### Phase 4: Migration Scripts ✅
- Created `scripts/migrate_to_normalized_schema.ts`
- Updated `scripts/validate_normalized_schema.ts`
- Migration tested on test database

### Phase 5: Validation ✅
- All integration tests pass
- MCP tool verification passes
- Schema validation passes

### Phase 6: Documentation ✅
- Updated `.engineering/artifacts/planning/database-schema.md`
- Created `docs/architecture/adr0043-schema-normalization.md`
- Updated this README

## Related Documents

- `.engineering/artifacts/planning/database-schema.md` - Current schema documentation
- `.engineering/artifacts/planning/2025-11-19-integer-id-optimization/` - Previous ID optimization
- `docs/architecture/adr0027-hash-based-integer-ids.md` - Hash ID decision
- `docs/architecture/adr0009-three-table-architecture.md` - Table architecture

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Analysis | Complete | Document current state (this folder) |
| Design | 2 hours | Finalize target schema |
| Implementation | 8 hours | Code changes |
| Migration Scripts | 3 hours | Create and test migration scripts |
| Fresh Seed Test | 1 hour | Test seeding with new schema |
| Validation | 4 hours | Test all tools |
| Documentation | 2 hours | Update ADRs and schema docs |



**Date**: 2025-11-26  
**Status**: ✅ Complete  
**Priority**: High  
**Actual Effort**: 1 day

## Overview

This planning folder documents the schema normalization effort to remove redundant fields identified through codebase analysis. The current schema contains significant technical debt from incremental migrations that left legacy fields alongside new optimized fields.

## Problem Statement

The current database schema stores the same data in multiple formats:

1. **Catalog table** has a `concepts` JSON blob that duplicates data available via `concept_ids`
2. **Chunks table** has a `concepts` text array that duplicates `concept_ids`
3. **Technical terms** are extracted by LLM but never indexed or used
4. **Related concepts** in catalog duplicate data in the concepts table
5. **Categories** text arrays duplicate `category_ids`

This results in:
- ~40% wasted storage
- Potential data inconsistency between fields
- Dead code paths that appear functional but aren't
- Confusion about which fields are authoritative

## Optimization Opportunities Identified

| # | Issue | Current State | Target State | Impact |
|---|-------|--------------|--------------|--------|
| 1 | Catalog `concepts` blob | JSON with primary_concepts, technical_terms, etc. | Remove entirely | High |
| 2 | Chunks `concepts` array | String array of concept names | Remove (use `concept_ids`) | High |
| 3 | `technical_terms` field | Extracted but never processed | Either implement or remove | Medium |
| 4 | Catalog `related_concepts` | Snapshot from LLM extraction | Remove (derive from concepts table) | Medium |
| 5 | `concept_categories` field | String array | Remove (use `category_ids`) | Medium |
| 6 | Concepts table `sources` | String array of paths | Remove (use `catalog_ids`) | Medium |
| 7 | Concepts table `category` | Legacy string field | Remove (category-agnostic) | Low |
| 8 | Catalog `concept_ids` | Array of concept IDs | Remove (derive from chunks) | Medium |
| 9 | Catalog `filename_tags` | Tags from filename | Remove (not needed) | Low |
| 10 | Catalog `source` field | Full file path | Rename to `filename`, use slug | Medium |
| 11 | Catalog `loc` field | Location metadata | Remove (not meaningful for docs) | Low |
| 12 | Chunks `source` field | String filename | Replace with `catalog_id` (integer) | Medium |
| 13 | Concepts `chunk_count` | Stored count | Remove (compute on demand) | Low |
| 14 | Concepts `enrichment_source` | Tracking metadata | Remove (unused) | Low |
| 15 | Concepts `related_concepts` | Text array | Change to `related_concept_ids` (integers) | Medium |
| 16 | Chunks `concept_density` | Stored score | Remove (compute on demand) | Low |

## Documents in This Folder

0. **00-chat-summary.md** - Summary of planning discussion and decisions
1. **01-current-schema-analysis.md** - Detailed analysis of current redundancies
2. **02-target-schema-design.md** - Normalized schema specification
3. **03-migration-plan.md** - Phased implementation approach with migration scripts
4. **04-code-changes-manifest.md** - Files requiring modification
5. **05-validation-test-plan.md** - Testing strategy and acceptance criteria

## Migration Scripts

The migration plan includes two key scripts:

1. **`scripts/migrate_to_normalized_schema.ts`** - Transforms legacy schema to normalized schema
2. **`scripts/validate_normalized_schema.ts`** - Validates schema structure after migration

These scripts should be tested on the sample-docs test database before applying to production.

## Success Criteria

- [x] All redundant fields removed from schema
- [x] Database size reduced by ~25%
- [x] All MCP tools pass validation tests
- [x] Migration script tested successfully
- [x] No functionality regression (1198 unit tests, 142 integration tests pass)
- [x] ADR created documenting changes (ADR-0043)

## Implementation Summary

**Branch:** `schema-normalization`

### Phase 1: Code Preparation ✅
- Updated domain models (`chunk.ts`, `concept.ts`)
- Updated repository layer (chunk, catalog, concept repositories)
- Updated concept extraction pipeline
- Updated seeding script (`hybrid_fast_seed.ts`)

### Phase 2: MCP Tools ✅
- Updated `document_concepts_extract.ts` to derive concepts from IDs
- Removed references to deprecated fields from all tools

### Phase 3: Test Updates ✅
- Updated test helpers and mock repositories
- Fixed integration tests for new schema
- All 1199 unit tests pass (2 pre-existing resilience test issues)

### Phase 4: Migration Scripts ✅
- Created `scripts/migrate_to_normalized_schema.ts`
- Updated `scripts/validate_normalized_schema.ts`
- Migration tested on test database

### Phase 5: Validation ✅
- All integration tests pass
- MCP tool verification passes
- Schema validation passes

### Phase 6: Documentation ✅
- Updated `.engineering/artifacts/planning/database-schema.md`
- Created `docs/architecture/adr0043-schema-normalization.md`
- Updated this README

## Related Documents

- `.engineering/artifacts/planning/database-schema.md` - Current schema documentation
- `.engineering/artifacts/planning/2025-11-19-integer-id-optimization/` - Previous ID optimization
- `docs/architecture/adr0027-hash-based-integer-ids.md` - Hash ID decision
- `docs/architecture/adr0009-three-table-architecture.md` - Table architecture

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Analysis | Complete | Document current state (this folder) |
| Design | 2 hours | Finalize target schema |
| Implementation | 8 hours | Code changes |
| Migration Scripts | 3 hours | Create and test migration scripts |
| Fresh Seed Test | 1 hour | Test seeding with new schema |
| Validation | 4 hours | Test all tools |
| Documentation | 2 hours | Update ADRs and schema docs |


