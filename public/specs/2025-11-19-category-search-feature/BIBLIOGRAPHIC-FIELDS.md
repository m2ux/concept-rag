# Bibliographic Metadata Fields

**Date**: 2025-11-19  
**Purpose**: Document new bibliographic fields in catalog table  
**Status**: Schema additions (unpopulated)

## New Fields Added to Catalog Table

### Field Definitions

| Field | Type | Purpose | Population Status |
|-------|------|---------|-------------------|
| `origin_hash` | string \| null | Origin hash from ebook metadata (publisher/source identifier) | Not populated (future) |
| `author` | string \| null | Document author/creator | Not populated (future) |
| `year` | string \| null | Publication year | Not populated (future) |
| `publisher` | string \| null | Publishing house/organization | Not populated (future) |
| `isbn` | string \| null | ISBN identifier (books) | Not populated (future) |

**Note on hashes**:
- **`hash`** (existing field): Content hash for deduplication - computed from document content
- **`origin_hash`** (new field): Origin hash from ebook metadata - provided by publisher/source, identifies the book's origin

### Schema Addition

**Catalog table** (updated):
```typescript
interface CatalogEntry {
  // Existing fields
  id: string;
  text: string;
  source: string;
  hash: string;
  loc: string;
  vector: number[];
  concept_ids: number[];
  category_ids: number[];
  filename_tags: string[];
  
  // NEW: Metadata fields (reserved for future)
  origin_hash: string | null;  // Origin hash from ebook metadata
  author: string | null;       // Document author
  year: string | null;         // Publication year
  publisher: string | null;    // Publisher name
  isbn: string | null;         // ISBN identifier
}
```

### Current State

**During migration**: All fields set to `null`

```typescript
{
  source: "/books/Microservices Patterns -- Software Architecture -- OReilly -- 2019.pdf",
  concept_ids: '[3842615478,1829374562]',
  category_ids: '[7362849501]',
  filename_tags: '["Software Architecture","OReilly","2019"]',
  
  // Reserved fields (not populated yet)
  origin_hash: null,
  author: null,
  year: null,
  publisher: null,
  isbn: null
}
```

---

## Future Population Strategies

### Option 1: Parse from Filename Tags

Some information may already be in filename_tags:

```typescript
// Filename: "Book Title -- Author -- Publisher -- Year.pdf"
filename_tags: ["Author", "Publisher", "Year"]

// Could parse into:
author: "Author"
publisher: "Publisher"  
year: "Year"
```

**Heuristics**:
- 4-digit number → likely year
- Known publishers (OReilly, Manning, etc.) → publisher
- Remaining → author

### Option 2: AI Extraction from Content

```typescript
// Use AI to extract from document text/metadata
const metadata = await extractBibliographicMetadata(documentText);

catalog.author = metadata.author;
catalog.year = metadata.year;
catalog.publisher = metadata.publisher;
```

### Option 3: PDF/EPUB Metadata

```typescript
// Extract from document metadata
const pdfMetadata = await extractPDFMetadata(filePath);

catalog.author = pdfMetadata.author;
catalog.year = pdfMetadata.creationDate?.getFullYear().toString();
catalog.publisher = pdfMetadata.creator;
```

### Option 4: Manual Entry

```typescript
// User-provided via tool or configuration file
catalog.author = userProvidedMetadata.author;
catalog.year = userProvidedMetadata.year;
// ...
```

### Option 5: External API (ISBN)

```typescript
// If ISBN known, query book database API
const bookData = await fetchBookData(isbn);

catalog.author = bookData.authors.join(', ');
catalog.year = bookData.publishedYear;
catalog.publisher = bookData.publisher;
```

---

## Use Cases (Once Populated)

### 1. Author-Based Browsing

```typescript
// Find all books by specific author
catalogTable.filter(doc => 
  doc.author?.toLowerCase().includes("martin fowler")
);
```

### 2. Year Filtering

```typescript
// Find recent publications
catalogTable.filter(doc => {
  const year = parseInt(doc.year || "0");
  return year >= 2020 && year <= 2025;
});
```

### 3. Publisher Collections

```typescript
// Browse OReilly books
catalogTable.filter(doc => 
  doc.publisher?.toLowerCase() === "oreilly"
);
```

### 4. ISBN Lookup

```typescript
// Direct book lookup
catalogTable.filter(doc => doc.isbn === "978-1491950357");
```

### 5. Bibliography Generation

```typescript
// Generate citation
function generateCitation(doc: CatalogEntry): string {
  return `${doc.author} (${doc.year}). "${doc.title}". ${doc.publisher}. ISBN: ${doc.isbn}`;
}
```

### 6. Duplicate Detection

```typescript
// Find same book from different sources
catalogTable.filter(doc => 
  doc.isbn === knownISBN || 
  (doc.author === knownAuthor && doc.year === knownYear)
);
```

---

## Storage Impact

### Per Document

- `author`: ~30 bytes average ("Martin Fowler")
- `year`: ~4 bytes ("2023")
- `publisher`: ~20 bytes average ("OReilly Media")
- `isbn`: ~17 bytes ("978-1491950357")

**Total**: ~71 bytes per document

**100 documents**: ~7 KB  
**1000 documents**: ~70 KB

**Impact**: Minimal (0.01% of database)

---

## Schema Validation

### When Populating in Future

```typescript
export function validateCatalogEntry(entry: any): void {
  // ... existing validations ...
  
  // Bibliographic fields (optional, nullable)
  if (entry.author !== null && entry.author !== undefined && typeof entry.author !== 'string') {
    throw new Error('catalog.author must be string or null');
  }
  if (entry.year !== null && entry.year !== undefined && typeof entry.year !== 'string') {
    throw new Error('catalog.year must be string or null');
  }
  if (entry.publisher !== null && entry.publisher !== undefined && typeof entry.publisher !== 'string') {
    throw new Error('catalog.publisher must be string or null');
  }
  if (entry.isbn !== null && entry.isbn !== undefined && typeof entry.isbn !== 'string') {
    throw new Error('catalog.isbn must be string or null');
  }
}
```

---

## Migration Implementation

### Phase 3: Ingestion (Updated)

```typescript
// In hybrid_fast_seed.ts - catalog entry creation
const catalogEntry = {
  id: ...,
  text: ...,
  source: ...,
  hash: ...,
  loc: ...,
  vector: ...,
  concept_ids: ...,
  category_ids: ...,
  filename_tags: extractFilenameTags(source),
  
  // Bibliographic metadata (null for now)
  author: null,
  year: null,
  publisher: null,
  isbn: null
};
```

### Future Population Script

**File**: `scripts/enrich_bibliographic_metadata.ts` (to be created later)

```typescript
async function enrichBibliographicMetadata() {
  const catalogTable = await db.openTable('catalog');
  const entries = await catalogTable.toArray();
  
  for (const entry of entries) {
    // Try multiple strategies
    const metadata = 
      await tryPDFMetadata(entry.source) ||
      await tryFilenameTagsParsing(entry.filename_tags) ||
      await tryAIExtraction(entry.text) ||
      {};
    
    // Update entry
    await catalogTable.update({
      where: `id = "${entry.id}"`,
      values: {
        author: metadata.author || null,
        year: metadata.year || null,
        publisher: metadata.publisher || null,
        isbn: metadata.isbn || null
      }
    });
  }
}
```

---

## Relationship to Filename Tags

### Complementary Information

**Filename tags** (from `filename_tags` field):
- Raw tags from filename structure
- Example: `["Software Architecture", "OReilly", "2019"]`

**Bibliographic fields** (from `author`, `year`, `publisher`, `isbn`):
- Parsed/structured metadata
- Example: `{ publisher: "OReilly", year: "2019", author: null, isbn: null }`

**Difference**:
- Filename tags: Raw, unparsed, flexible
- Bibliographic fields: Structured, typed, searchable

**Can derive bibliographic from tags**:
```typescript
// Heuristic: extract year from tags
const yearTag = filename_tags.find(tag => /^\d{4}$/.test(tag));
if (yearTag) {
  catalog.year = yearTag;
}

// Extract known publishers
const knownPublishers = ["OReilly", "Manning", "Packt"];
const publisherTag = filename_tags.find(tag => 
  knownPublishers.some(pub => tag.includes(pub))
);
if (publisherTag) {
  catalog.publisher = publisherTag;
}
```

---

## Summary

**Added to catalog table**:
- ✅ `author` (string | null)
- ✅ `year` (string | null)
- ✅ `publisher` (string | null)
- ✅ `isbn` (string | null)

**Current status**: Fields exist but unpopulated (all null)

**Future**: Will be populated via:
1. PDF/EPUB metadata extraction
2. Filename tags parsing
3. AI content analysis
4. External API lookups (ISBN)
5. Manual enrichment

**Storage cost**: ~7 KB per 100 docs (when populated)

**Benefits** (once populated):
- Author-based browsing
- Year filtering
- Publisher collections
- ISBN lookup
- Citation generation
- Better duplicate detection

---

**Status**: Schema updated with bibliographic fields  
**Population**: Deferred to future implementation  
**Impact**: Minimal storage, significant future value  
**Date**: 2025-11-19

