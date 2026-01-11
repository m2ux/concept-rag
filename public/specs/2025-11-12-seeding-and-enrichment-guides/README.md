# Seeding and Enrichment Guides

**Date Range:** November 12, 2025 (approximate)  
**Status:** ✅ Complete - Operational Documentation

## Overview

Comprehensive operational guides for seeding the database and managing concept enrichment. These guides document how to use the various seeding flags and maintenance scripts to keep the database in a healthy state.

## Key Deliverables

1. **INCREMENTAL_SEEDING_GUIDE.md** - Guide for incremental seeding and gap filling
2. **AUTOMATIC_CONCEPT_ENRICHMENT.md** - Guide for automatic concept metadata enrichment
3. **REBUILD_CONCEPTS_GUIDE.md** - Guide for rebuilding concept index
4. **REENRICH_CHUNKS_GUIDE.md** - Guide for re-enriching chunks with concept metadata
5. **REPAIR_CONCEPTS_GUIDE.md** - Guide for repairing concept metadata issues

## Purpose

These guides serve as operational documentation for maintaining the concept-rag database. They were created in response to issues discovered during the missing chunks investigation (see 2025-11-12-missing-chunks-investigation) and provide step-by-step instructions for common maintenance tasks.

## Guide Summaries

### 1. Incremental Seeding Guide

**Purpose:** How to run incremental seeding to fill gaps without reprocessing everything

**Key Topics:**
- Completeness checking (catalog, summary, concepts, chunks)
- Smart preservation (only process what's missing)
- Data safety guarantees
- Using `--rebuild-concepts` flag
- Common scenarios and commands

**Use When:**
- Adding new documents to existing database
- Recovering from interrupted seeding
- Fixing incomplete document processing

---

### 2. Automatic Concept Enrichment Guide

**Purpose:** How the automatic concept metadata enrichment system works

**Key Topics:**
- Problem: chunks missing concept metadata
- Solution: automatic detection and re-enrichment
- Enhanced completeness checking
- Preserved existing chunks (no deletion)
- In-place updates vs full reprocessing

**Use When:**
- Chunks exist but concept_search returns no results
- Understanding why some documents aren't searchable by concept
- Troubleshooting missing concept metadata

---

### 3. Rebuild Concepts Guide

**Purpose:** How to rebuild the concept index with correct chunk counts

**Key Topics:**
- When concept chunk_count is incorrect
- Using `--rebuild-concepts` flag
- Loading all chunks for accurate counting
- Fast rebuild without reprocessing documents
- Verification commands

**Use When:**
- Concept chunk_count shows 0 but chunks exist
- After fixing database inconsistencies
- After manual chunk additions

---

### 4. Re-enrich Chunks Guide

**Purpose:** How to re-enrich chunks with updated concept metadata

**Key Topics:**
- Forcing concept re-enrichment
- When to use `--reenrich-chunks` flag
- Updating existing chunk concept tags
- Handling concept taxonomy changes
- Performance considerations

**Use When:**
- Concept extraction logic has been updated
- Concept taxonomy has changed
- Chunk concept tags need to be refreshed
- Testing new concept extraction prompts

---

### 5. Repair Concepts Guide

**Purpose:** How to repair broken or missing concept metadata

**Key Topics:**
- Common concept metadata issues
- Diagnostic commands
- Repair strategies
- Recovery procedures
- Prevention tips

**Use When:**
- Concepts are missing from chunks
- Concept counts are inconsistent
- Search results are incomplete
- Database health checks fail

## Command Quick Reference

```bash
# Basic incremental seeding (fills gaps)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks

# Rebuild concept index (fixes chunk counts)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --rebuild-concepts

# Re-enrich all chunks (updates concept tags)
npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --reenrich-chunks

# Check database health
npx tsx scripts/check_database_health.ts

# Extract concepts from document
npx tsx scripts/extract_concepts.ts "document name"
```

## Related Work

These guides were created in response to:
- **2025-11-12-missing-chunks-investigation** - Discovered incomplete seeding issues
- **2025-11-13-concept-extraction-enhancement** - Enhanced concept extraction requiring documentation

## Documentation Type

**Note:** These are operational/maintenance guides, not planning documents. They document how to use existing features rather than planning new ones. However, they're stored in planning as reference documentation for the seeding and enrichment systems.

## Outcome

Users now have comprehensive operational documentation for maintaining the database, recovering from issues, and understanding how the seeding and enrichment systems work. These guides reduce troubleshooting time and provide clear command references.



