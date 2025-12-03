# Diagnostic Scripts Documentation

This document provides a comprehensive reference for all diagnostic scripts used to inspect, debug, and analyze the LanceDB database state.

## Running Diagnostics

```bash
# Run any diagnostic script
npx ts-node scripts/diagnostics/<script-name>.ts

# With custom database path (where supported)
npx ts-node scripts/diagnostics/_check_db.ts /path/to/database
```

## Table of Contents

1. [Database Status Scripts](#database-status-scripts)
2. [Catalog Inspection Scripts](#catalog-inspection-scripts)
3. [Chunk Analysis Scripts](#chunk-analysis-scripts)
4. [Concept Analysis Scripts](#concept-analysis-scripts)
5. [Search/Query Debugging Scripts](#searchquery-debugging-scripts)

---

## Database Status Scripts

Scripts for verifying database connectivity, table structure, and overall health.

**Location**: [`scripts/diagnostics/`](.)

### [`_check_db.ts`](./_check_db.ts)

Generic database health check with optional custom path. Displays table names, row counts, and field structure.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `argv[2]` | `./db/test` | Database path |

| Output | Description |
|--------|-------------|
| Table list | Names of all tables |
| Row counts | Number of rows per table |
| Field names | Column names for each table |

**Example output:**
```
Checking database: ./db/test

Tables: catalog, chunks, concepts, categories

catalog: 5 rows
  Fields: id, title, source, summary, ...
```

---

### [`diagnose-db.ts`](./diagnose-db.ts)

Quick database structure overview for `db/test`. Shows tables and first record fields.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |

| Output | Description |
|--------|-------------|
| Table list | All tables in database |
| Row counts | Count per table |
| Field structure | Fields from sample record |

---

### [`check-db-status.ts`](./check-db-status.ts)

Comprehensive status report showing catalog entries, chunk counts, and concept totals with per-document breakdown.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |

| Output | Description |
|--------|-------------|
| Catalog count | Total catalog entries |
| Chunk count | Total chunks |
| Concept count | Total concepts |
| Chunks per document | Distribution by `catalog_title` |
| Document list | All catalog entry titles |

---

### [`inspect_test_db.ts`](./inspect_test_db.ts)

Detailed test database inspection checking for category-related fields. Validates schema for category features.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |

| Output | Description |
|--------|-------------|
| Table list | All tables |
| Catalog fields | Schema including category fields |
| Category presence | Checks for `concept_categories`, `category_ids` |
| Concepts JSON | Parses and displays concept structure |
| Chunks schema | Field presence validation |

---

## Catalog Inspection Scripts

Scripts for examining document catalog entries and metadata.

**Location**: [`scripts/diagnostics/`](.)

### [`check-catalog.ts`](./check-catalog.ts)

Lists all catalog entries and checks for 'architecture' content in text field.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |

| Output | Description |
|--------|-------------|
| Title | Document title |
| Source | Source file (basename) |
| Architecture flag | Whether text contains 'architecture' |

---

### [`check-catalog-fields.ts`](./check-catalog-fields.ts)

Detailed catalog field inspection showing field types and summary content.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Display limit | 100 chars | Truncation for string fields |

| Output | Description |
|--------|-------------|
| All fields | Key-value pairs for first entry |
| Field types | Array/Vector detection |
| Summary preview | First 150 chars of each summary |

---

### [`list-test-data.ts`](./list-test-data.ts)

Lists documents, concepts, and categories from the test database.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Document limit | 50 | Max documents displayed |
| Concept limit | 50 (of 200) | Sample concepts shown |
| Category limit | 50 | Max categories displayed |

| Output | Description |
|--------|-------------|
| Document list | All documents with titles |
| Concept sample | First 50 concepts by name |
| Category list | All categories |
| Totals | Count summaries |

---

## Chunk Analysis Scripts

Scripts for analyzing document chunks and their distribution.

**Location**: [`scripts/diagnostics/`](.)

### [`check-chunks.ts`](./check-chunks.ts)

Counts chunks containing 'architecture' grouped by document.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Search term | `'architecture'` | Case-insensitive |

| Output | Description |
|--------|-------------|
| Architecture chunks | Count per document |
| Empty result | Reports if no matches found |

---

### [`check-titles.ts`](./check-titles.ts)

Lists unique `catalog_title` values in chunks table with counts.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Chunk limit | 1,000,000 | Max chunks queried |

| Output | Description |
|--------|-------------|
| Unique titles | All distinct `catalog_title` values |
| Title counts | Chunk count per title |

---

### [`debug-chunks.ts`](./debug-chunks.ts)

Debug chunk distribution showing total count and title breakdown.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Display truncation | 60 chars | Title display limit |

| Output | Description |
|--------|-------------|
| Total chunks | From `countRows()` |
| Query result count | Actual records returned |
| Title distribution | Chunks per `catalog_title` |

---

### [`debug-chunks2.ts`](./debug-chunks2.ts)

Identical to `debug-chunks.ts` with higher explicit limit. Verifies LanceDB query limit behavior.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Query limit | 100,000 | Explicit high limit |

| Output | Description |
|--------|-------------|
| Total vs queried | Validates limit effectiveness |
| Title distribution | Chunks per document |

---

## Concept Analysis Scripts

Scripts for examining extracted concepts and their relationships.

**Location**: [`scripts/diagnostics/`](.)

### [`check-concept.ts`](./check-concept.ts)

Searches for concepts matching 'architecture' pattern using SQL LIKE.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Search pattern | `'%software%architecture%'` or `'%architecture%'` | SQL LIKE |

| Output | Description |
|--------|-------------|
| Concept name | Matched concept |
| ID | Concept identifier |
| Catalog IDs | Associated document IDs |
| Catalog Titles | Source documents |
| Summary | First 100 chars |

---

### [`check-doc-concepts.ts`](./check-doc-concepts.ts)

Shows concepts per document, filtering for architecture/design/software related terms.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Filter terms | `architect`, `design`, `software` | Case-insensitive |
| Display limit | 10 concepts | Per document |

| Output | Description |
|--------|-------------|
| Document title | With emoji indicator |
| Total concepts | Count for document |
| Filtered concepts | Architecture/design related |

---

### [`check-related-concepts.ts`](./check-related-concepts.ts)

Analyzes population rates of concept relationship fields.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Fields checked | 6 | related_concepts, synonyms, broader_terms, narrower_terms, adjacent_ids, related_ids |

| Output | Description |
|--------|-------------|
| Total concepts | Database-wide count |
| Field population % | Percentage with non-empty values |
| Sample concept | Example with `related_concepts` populated |

---

### [`check-sw-arch.ts`](./check-sw-arch.ts)

Detailed inspection of the 'software architecture' concept specifically.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Search | Exact match `'software architecture'` | SQL WHERE |

| Output | Description |
|--------|-------------|
| Related concepts | First 10 with count |
| Catalog titles | Source documents |
| Not found | Reports if concept missing |

---

## Search/Query Debugging Scripts

Scripts for debugging search behavior and query expansion.

**Location**: [`scripts/diagnostics/`](.)

### [`compare-searches.ts`](./compare-searches.ts)

Finds concepts related to architecture/software by scanning name and summary fields.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Search terms | `architect`, `software`, `architecture`, `software design` | In name/summary |
| Display limit | 15 | Concepts shown |

| Output | Description |
|--------|-------------|
| Match count | Concepts matching criteria |
| Concept name | Matching concept |
| Source documents | Extracted book names |

---

### [`check-design-patterns.ts`](./check-design-patterns.ts)

Analyzes chunks from Design Patterns book specifically.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Database | `./db/test` | Default path |
| Filter | `catalog_title` contains 'design patterns' | Case-insensitive |
| Sample chunks | 3 | Displayed with 300 char preview |
| Term search | `architecture`, `pattern`, `design`, `object` | Frequency analysis |

| Output | Description |
|--------|-------------|
| Chunk count | Total for Design Patterns |
| Sample text | First 3 chunk previews |
| Term frequency | Chunks containing each term |

---

### [`debug-expansion.ts`](./debug-expansion.ts)

Tests word filter logic for query expansion. Demonstrates substring vs whole-word matching.

| Parameter | Value | Description |
|-----------|-------|-------------|
| Test query | `"war"` | Search term |
| Test concept | `"software architecture"` | Concept to match against |

| Output | Description |
|--------|-------------|
| Old filter result | Substring matching (includes false positives) |
| New filter result | Whole word matching |
| Logic explanation | Shows why each filter passes/blocks |

**Purpose**: Validates that "software architecture" is not incorrectly matched when searching for "war" (the substring "war" appears in "software").

---

## Script Categories Summary

| Category | Scripts | Purpose |
|----------|---------|---------|
| Database Status | `_check_db`, `diagnose-db`, `check-db-status`, `inspect_test_db` | Verify connectivity and schema |
| Catalog | `check-catalog`, `check-catalog-fields`, `list-test-data` | Inspect document metadata |
| Chunks | `check-chunks`, `check-titles`, `debug-chunks`, `debug-chunks2` | Analyze chunk distribution |
| Concepts | `check-concept`, `check-doc-concepts`, `check-related-concepts`, `check-sw-arch` | Examine concept extraction |
| Search/Query | `compare-searches`, `check-design-patterns`, `debug-expansion` | Debug search behavior |

---

## Common Use Cases

### Verify Database Health
```bash
npx ts-node scripts/diagnostics/_check_db.ts
```

### Check Document Ingestion
```bash
npx ts-node scripts/diagnostics/check-db-status.ts
npx ts-node scripts/diagnostics/list-test-data.ts
```

### Debug Missing Search Results
```bash
npx ts-node scripts/diagnostics/check-concept.ts
npx ts-node scripts/diagnostics/check-chunks.ts
npx ts-node scripts/diagnostics/compare-searches.ts
```

### Validate Concept Relationships
```bash
npx ts-node scripts/diagnostics/check-related-concepts.ts
npx ts-node scripts/diagnostics/check-sw-arch.ts
```

### Analyze Specific Document
```bash
npx ts-node scripts/diagnostics/check-design-patterns.ts
npx ts-node scripts/diagnostics/check-doc-concepts.ts
```

---

## Maintenance

### Adding New Diagnostics

1. Create script in `scripts/diagnostics/`
2. Document parameters, output, and purpose in this README
3. Add to appropriate category section
4. Update summary table

### Database Path Conventions

| Path | Usage |
|------|-------|
| `./db/test` | Default test database (all scripts) |
| `~/.concept_rag` | Production database |
| Custom via `argv[2]` | `_check_db.ts` only |
