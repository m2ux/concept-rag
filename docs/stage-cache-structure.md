# Stage Cache Structure

This document describes the on-disk structure of the Stage Cache, which persists LLM extraction results to enable resume from interrupted seeding operations.

## Overview

The Stage Cache stores the results of expensive LLM operations (concept extraction, content overview generation) immediately after completion, before any database writes. This enables recovery from failures at any point in the seeding pipeline without re-running LLM calls.

## Directory Location

```
<database-dir>/.stage-cache/<collection-hash>/
```

**Examples:**
- Default: `~/.concept_rag/.stage-cache/a1b2c3d4e5f67890/`
- Custom: `/path/to/db/.stage-cache/a1b2c3d4e5f67890/`

The cache directory is created automatically when the first document is cached.

## Collection-Based Organization

Caches are organized by **collection hash**, which is computed from the content hashes of all files at the source path. This provides:

- **Source path independence**: Renaming a folder doesn't invalidate the cache
- **Automatic cleanup**: When all documents in a collection are seeded, the cache is removed
- **Isolation**: Different source paths maintain independent caches

### Collection Hash Computation

1. Scan source directory for all document files (recursive)
2. Compute SHA-256 hash of each file's content
3. Sort all hashes alphabetically
4. Compute SHA-256 of the joined hashes
5. Use first 16 characters as collection folder name

**Example:**
```
Files: doc1.pdf (hash: abc...), doc2.pdf (hash: xyz...)
Sorted: [abc..., xyz...]
Collection hash: a1b2c3d4e5f67890
```

## File Structure

```
<database-dir>/
├── catalog.lance/              # LanceDB catalog table
├── chunks.lance/               # LanceDB chunks table
├── concepts.lance/             # LanceDB concepts table
├── .seeding-checkpoint.json    # Checkpoint for resumable seeding
└── .stage-cache/               # Stage cache base directory
    └── a1b2c3d4e5f67890/       # Collection-specific cache folder
        ├── <file-hash-1>.json  # Cached LLM results for document 1
        ├── <file-hash-2>.json  # Cached LLM results for document 2
        └── ...
```

### File Naming

Each cache file is named using the document's SHA-256 content hash:

```
<64-character-hex-hash>.json
```

**Example:**
```
a1d93afdd8d4213106b926a6efa0893569ba5b2c94c02475479ebd2b8b3f1723.json
```

This ensures:
- Unique identification based on file content
- Automatic cache invalidation when file content changes
- No collisions between different documents

## Cache File Format

Each cache file is a JSON document with the following structure:

```json
{
  "hash": "<sha256-hash>",
  "source": "<relative-path-to-document>",
  "processedAt": "<iso-8601-timestamp>",
  "concepts": {
    "primary_concepts": [...],
    "categories": [...],
    "technical_terms": [...],
    "related_concepts": [...]
  },
  "contentOverview": "<document-summary-text>",
  "metadata": {
    "title": "<extracted-title>",
    "author": "<extracted-author>",
    "year": <publication-year>
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `hash` | string | SHA-256 hash of the source document content |
| `source` | string | Relative path to the source document |
| `processedAt` | string | ISO 8601 timestamp when LLM processing completed |
| `concepts` | object | Extracted concept data from LLM |
| `contentOverview` | string | Generated document summary (1-3 sentences) |
| `metadata` | object | Optional extracted document metadata |

### Concepts Object

The `concepts` field contains the LLM extraction results:

| Field | Type | Description |
|-------|------|-------------|
| `primary_concepts` | array | Main concepts with name and summary |
| `categories` | array | Document categories (e.g., "blockchain technology") |
| `technical_terms` | array | Technical terminology extracted |
| `related_concepts` | array | Related concept names for co-occurrence analysis |

**Primary Concept Format:**
```json
{
  "name": "blockchain interoperability",
  "summary": "The ability of different blockchain networks to communicate..."
}
```

## Example Cache File

```json
{
  "hash": "a1d93afdd8d4213106b926a6efa0893569ba5b2c94c02475479ebd2b8b3f1723",
  "source": "sample-docs/Papers/blockchain-interoperability.pdf",
  "processedAt": "2025-12-11T11:58:25.944Z",
  "concepts": {
    "primary_concepts": [
      {
        "name": "blockchain interoperability",
        "summary": "The ability of different blockchain networks to communicate, share data, and interact with each other."
      },
      {
        "name": "cross-chain communication",
        "summary": "The process of enabling message transmission and data exchange between different blockchain networks."
      }
    ],
    "categories": [
      "blockchain technology",
      "distributed systems",
      "cryptography"
    ],
    "technical_terms": [],
    "related_concepts": []
  },
  "contentOverview": "This comprehensive survey reviews cross-chain solutions for blockchain interoperability, proposing conceptual models for asset and data exchange.",
  "metadata": {
    "author": "Wenqing Li"
  }
}
```

## Cache Lifecycle

### Write Operations

Cache entries are written immediately after successful LLM extraction:

1. Document text extracted from PDF/EPUB
2. LLM generates content overview
3. LLM extracts concepts
4. **Cache entry written to disk** (atomic write via temp file + rename)
5. Database operations proceed

### Read Operations

On subsequent seeding runs, the cache is checked before LLM calls:

1. Compute document hash
2. Check if `<hash>.json` exists in cache
3. Verify entry is not expired (TTL check via file mtime)
4. If valid, load cached data and skip LLM calls
5. If missing/expired, perform LLM extraction and cache result

### Expiration

Cache entries expire based on Time-To-Live (TTL):
- Default TTL: 7 days
- Expiration checked via file modification time
- Expired entries are not used and can be cleaned

### Automatic Cleanup

At the end of a successful seeding run, the cache is automatically cleaned up when:

1. All documents from the source path are present in the catalog table
2. The seeding completed without fatal errors

**Cleanup behavior:**
```
🗑️  All documents seeded - cleaning up collection cache (a1b2c3d4e5f67890)...
   ✅ Removed collection cache
```

This ensures:
- No stale caches accumulate over time
- Disk space is reclaimed after successful seeding
- Interrupted runs preserve cache for resume

## CLI Options

| Flag | Description |
|------|-------------|
| `--no-cache` | Disable stage cache entirely |
| `--clear-cache` | Clear cache before processing |
| `--cache-only` | Only use cached results, fail if not cached |
| `--cache-dir PATH` | Use custom cache directory |

## Disk Space

Typical cache file sizes:
- Small documents (10-20 pages): 20-30 KB
- Medium documents (50-100 pages): 40-60 KB
- Large documents (200+ pages): 80-120 KB

The cache grows linearly with the number of processed documents. For a library of 100 documents, expect approximately 5-10 MB of cache storage.

## Atomic Writes

Cache writes use atomic operations to prevent corruption:

1. Write to temporary file: `<hash>.json.tmp`
2. Rename to final path: `<hash>.json`

This ensures cache files are never partially written, even if the process is killed mid-write.

## Related Documentation

- [ADR-0048: Stage Caching](architecture/adr0048-stage-caching.md) - Architecture decision record
- [Database Schema](database-schema.md) - LanceDB table structures

