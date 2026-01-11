# How Book Titles Are Stored in the Database

## Summary

**Book titles are NOT stored as a separate field in the database.** Instead, they are derived from the **`source` field**, which contains the full file path to the document.

## Database Schema

### Catalog Table Structure

The `catalog` table in LanceDB contains the following fields:

```typescript
{
  id: string,                    // Auto-generated index
  text: string,                  // Document summary (enriched with concepts)
  source: string,                // Full file path (e.g., "/home/user/books/Code That Fits In Your Head.pdf")
  hash: string,                  // Content hash for deduplication
  loc: string,                   // JSON stringified location metadata
  vector: number[],              // 384-dimensional embedding vector
  concepts: string,              // JSON stringified concepts object
  concept_categories: string,    // JSON stringified array of categories
  concept_density?: number       // Optional density score
}
```

### Source Field Details

The **`source`** field is:
- **Full file path** to the original document
- Set during document ingestion from `doc.metadata.source`
- Example: `~/Documents/ebooks/Programming/Clean Code.pdf`

## How Titles Are Displayed

When displaying book titles in reports or search results, the system:

1. **Extracts filename** from the full path
   ```typescript
   const filename = source.split('/').pop();
   // Result: "Clean Code.pdf"
   ```

2. **Cleans up the filename** to create a human-readable title
   ```typescript
   const title = filename
     .replace(/\.pdf$|\.epub$/, '')  // Remove extension
     .replace(/_/g, ' ');             // Replace underscores with spaces
   // Result: "Clean Code"
   ```

### Example from generate_category_report.ts

```typescript
for (const [source, chunks] of Object.entries(chunksBySource)) {
    const filename = source.split('/').pop() || source;
    const title = filename.replace(/\.pdf$|\.epub$/, '').replace(/_/g, ' ');
    
    md += `### ${title}\n\n`;
    md += `*File: ${filename}*\n\n`;
}
```

## Title Matching in Search

The `CatalogRepository` search implementation benefits from **strong title matching**:

```typescript
// From catalog-repository interface documentation
**Ranking Signals**:
- Vector similarity (25%): Semantic document understanding
- BM25 (25%): Keyword matching in summary
- Title matching (20%): Query in document title (high weight)
- Concept alignment (20%): Document's primary concepts match query
- WordNet expansion (10%): Synonym matching
```

The hybrid search service extracts the filename from the `source` field and gives it a **20% weight** in the ranking algorithm, making title-based searches very effective.

## Why No Dedicated Title Field?

The design choice to use the file path as the source of truth has several advantages:

1. **Simplicity**: One field (`source`) serves dual purpose
2. **Consistency**: File path is already unique and required for document management
3. **Flexibility**: Users can organize files with descriptive names
4. **No Duplication**: Avoids storing redundant information

## Implications

### For Users

- **Name files descriptively**: The filename becomes the de facto title
- Use spaces or underscores in filenames for readability
- The system will clean up common patterns (extensions, underscores)

### For Developers

- When displaying titles, always extract and clean the filename from `source`
- Title matching in search queries works by comparing against the filename portion
- To change a "title", you'd need to update the `source` field (and likely the actual file)

## Related Code

- **Schema definition**: `hybrid_fast_seed.ts` lines 988-1009 (`createLanceTableWithSimpleEmbeddings`)
- **Title extraction**: `.ai/planning/2025-11-19-category-search-tool/generate_category_report.ts` lines 63-65
- **Catalog repository**: `src/infrastructure/lancedb/repositories/lancedb-catalog-repository.ts`
- **Hybrid search with title matching**: `src/domain/services/hybrid-search-service.ts`

## Example Data

From the software engineering report:

| Source (stored in DB) | Derived Title (displayed) |
|----------------------|---------------------------|
| `/path/to/Cmp Real-Time Concepts For Embedded Systems Ebook-Lib.pdf` | Cmp Real-Time Concepts For Embedded Systems Ebook-Lib |
| `/path/to/Understanding Distributed Systems.pdf` | Understanding Distributed Systems |
| `/path/to/Embedded_C.pdf` | Embedded C |

## Future Considerations

If explicit title metadata becomes necessary, it could be added to the `concepts` object during ingestion:

```typescript
concepts: {
  primary_concepts: [...],
  categories: [...],
  title: "Clean Code: A Handbook of Agile Software Craftsmanship",  // NEW
  author: "Robert C. Martin",                                        // NEW
  related_concepts: [...]
}
```

This would require changes to:
1. Concept extraction prompt/logic
2. Schema validation
3. Display logic (prefer `concepts.title` over filename if present)






