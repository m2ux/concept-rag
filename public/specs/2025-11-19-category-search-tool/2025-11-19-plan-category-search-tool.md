# Plan: Category Search Tool

## Goal
Add a new MCP tool `category_search` that allows users to search for content (chunks) and concepts based on semantic categories (e.g., "Software Engineering", "DevOps").

## Context
The current system supports:
- `concept_search`: Find chunks related to a specific concept.
- `catalog_search`: Find documents by title/summary.
- `chunks_search`: Find chunks in a specific document.
- `broad_chunks_search`: Hybrid search across all chunks.

There is no dedicated way to search by "category", even though both `Concept` and `Chunk` models contain category information.
- `Concept` model: `category: string`
- `Chunk` model: `conceptCategories: string[]` (populated during enrichment)

## Architecture Design

### 1. Repositories
We need to extend existing repositories to support category-based retrieval.

#### `ConceptRepository`
Add method to find concepts belonging to a category.
```typescript
findByCategory(category: string, limit: number): Promise<Concept[]>;
```
This will be useful for validating categories and showing "concepts in this category".

#### `ChunkRepository`
Add method to find chunks tagged with a specific category.
```typescript
findByCategory(category: string, limit: number): Promise<Chunk[]>;
```
This will be the primary method for retrieving content.

### 2. Domain Service
Create `CategorySearchService` to encapsulate the logic.
- **Input**: `category`, `limit`, `sourceFilter`.
- **Logic**:
    1.  (Optional) Validate category exists using `ConceptRepository`.
    2.  Find chunks using `ChunkRepository.findByCategory`.
    3.  Apply source filtering if needed (can be done in repo or service, existing pattern suggests repo or service).
    4.  Sort results (e.g., by density or relevance).
- **Output**: `CategorySearchResult` containing chunks and metadata.

### 3. MCP Tool
Create `CategorySearchTool`.
- **Name**: `category_search`
- **Description**: Search for chunks and concepts within a semantic category.
- **Params**: `category` (string), `limit` (number), `source_filter` (string).
- **Response**: JSON with chunks, their concepts, and metadata.

## Implementation Steps

1.  **Update `ConceptRepository`**
    *   Modify `src/domain/interfaces/repositories/concept-repository.ts`.
    *   Implement in `src/infrastructure/lancedb/repositories/lancedb-concept-repository.ts`.

2.  **Update `ChunkRepository`**
    *   Modify `src/domain/interfaces/repositories/chunk-repository.ts`.
    *   Implement in `src/infrastructure/lancedb/repositories/lancedb-chunk-repository.ts`.
    *   *Note*: Ensure efficient filtering (LanceDB query or post-filtering).

3.  **Create Domain Service**
    *   Create `src/domain/services/category-search-service.ts`.
    *   Define interfaces and implement class.

4.  **Create MCP Tool**
    *   Create `src/tools/operations/category_search.ts`.
    *   Implement `CategorySearchTool` using `CategorySearchService`.

5.  **Register Components**
    *   Update `src/application/container.ts` to register the new service and tool.
    *   Update `src/tools/conceptual_registry.ts` (if applicable) or just `container.ts` if it manages registration directly.

6.  **Testing**
    *   Create unit tests for `CategorySearchService`.
    *   Create integration test for `CategorySearchTool`.

## Verification
- Run `category_search` with a known category (e.g., "software engineering").
- Verify chunks returned contain the category.
- Verify `concept_search` still works as expected.






