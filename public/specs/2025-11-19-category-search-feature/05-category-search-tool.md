# Category Search Tool Design

**Date**: 2025-11-19  
**Purpose**: Design specification for category-related MCP tools  
**Status**: Design complete

## Overview

Three new MCP tools will enable category-based discovery and navigation:

1. **`category_search`**: Find all documents, chunks, and concepts in a category
2. **`list_categories`**: Browse available categories with statistics
3. **`list_concepts_in_category`**: List all concepts appearing in a category's documents

## Tool 1: category_search

### Purpose

Search for all entities (documents, chunks, concepts) associated with a specific category. Supports category hierarchy traversal and multiple output formats.

### Tool Definition

```typescript
{
  name: 'category_search',
  description: 'Search for documents, chunks, and concepts by category. Supports category names, IDs, or aliases. Can include child categories in hierarchical search.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Category name, ID, or alias (e.g., "software architecture", "ML", "5")'
      },
      includeChildren: {
        type: 'boolean',
        description: 'Include child categories in hierarchy (default: false)',
        default: false
      },
      includeChunks: {
        type: 'boolean',
        description: 'Include individual chunks in results (default: false)',
        default: false
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results per type (default: 10)',
        default: 10
      }
    },
    required: ['category']
  }
}
```

### Input Parameters

#### `category` (required)
- **Type**: string
- **Formats accepted**:
  - Category name: `"software architecture"`
  - Category ID: `"5"`
  - Category alias: `"ML"` (resolves to "machine learning")
- **Case sensitivity**: Name matching is exact, alias matching is case-insensitive
- **Examples**:
  ```typescript
  category: "software architecture"  // By name
  category: "5"                      // By ID
  category: "ML"                     // By alias
  ```

#### `includeChildren` (optional)
- **Type**: boolean
- **Default**: false
- **Purpose**: Include all child categories in hierarchy
- **Example**:
  ```typescript
  // Category: "software engineering" has children:
  // - "software architecture"
  // - "web development"
  // - "database design"
  
  includeChildren: false  // Only "software engineering" documents
  includeChildren: true   // All 4 categories' documents
  ```

#### `includeChunks` (optional)
- **Type**: boolean
- **Default**: false
- **Purpose**: Include individual chunk results (can be large)
- **Note**: Chunks are always counted in statistics, this controls whether they appear in results

#### `limit` (optional)
- **Type**: number
- **Default**: 10
- **Min**: 1
- **Max**: 100
- **Purpose**: Limit results per type to prevent overwhelming output

### Output Format

```typescript
{
  // Category metadata
  category: {
    id: "5",
    name: "software architecture",
    description: "Patterns and principles for structuring software systems",
    hierarchy: [
      "software engineering",        // Root
      "software architecture"        // Current
    ],
    aliases: ["software design", "system architecture"],
    relatedCategories: [
      "distributed systems",
      "design patterns",
      "cloud computing"
    ]
  },
  
  // Usage statistics
  statistics: {
    totalDocuments: 47,
    totalChunks: 2350,
    totalConcepts: 156,
    
    // If includeChildren: true
    childCategories: [
      {
        id: "12",
        name: "microservices",
        documentCount: 15,
        chunkCount: 750
      },
      {
        id: "18",
        name: "design patterns",
        documentCount: 23,
        chunkCount: 1150
      }
    ]
  },
  
  // Document results
  documents: [
    {
      source: "/path/to/Microservices-Patterns.pdf",
      preview: "This book explores patterns for building microservices...",
      concepts: [
        "API gateway",
        "service mesh",
        "event sourcing",
        "CQRS",
        "saga pattern"
      ],
      categories: ["software architecture", "distributed systems"],
      chunkCount: 52
    },
    // ... more documents ...
  ],
  
  // Concept results
  concepts: [
    {
      name: "API gateway",
      type: "thematic",
      category: "software architecture",
      weight: 0.85,
      chunkCount: 47,
      relatedConcepts: ["microservices", "load balancing"]
    },
    // ... more concepts ...
  ],
  
  // Chunk results (only if includeChunks: true)
  chunks: [
    {
      id: "123",
      text: "The API Gateway pattern provides a single entry point...",
      source: "/path/to/doc.pdf",
      concepts: ["API gateway", "microservices"],
      conceptDensity: 0.15
    },
    // ... more chunks ...
  ]
}
```

### Error Handling

#### Category Not Found
```json
{
  "error": "Category not found: invalid-category",
  "suggestion": "Try using 'list_categories' to see available categories",
  "didYouMean": [
    "software architecture",
    "software design",
    "software engineering"
  ]
}
```

#### Empty Results
```json
{
  "category": {
    "id": "5",
    "name": "software architecture",
    "description": "..."
  },
  "statistics": {
    "totalDocuments": 0,
    "totalChunks": 0,
    "totalConcepts": 0
  },
  "message": "No documents, chunks, or concepts found in this category. This category may have been assigned but content hasn't been indexed yet."
}
```

### Implementation

**File**: `src/tools/operations/category-search.ts`

```typescript
import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache';
import type { CatalogRepository } from '../../domain/interfaces/catalog-repository';
import type { ChunkRepository } from '../../domain/interfaces/chunk-repository';
import type { ConceptRepository } from '../../domain/interfaces/concept-repository';

export interface CategorySearchParams {
  category: string;
  includeChildren?: boolean;
  includeChunks?: boolean;
  limit?: number;
}

export async function categorySearch(
  params: CategorySearchParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  chunkRepo: ChunkRepository,
  conceptRepo: ConceptRepository
): Promise<string> {
  // Resolve category ID (supports name, ID, or alias)
  let categoryId = categoryCache.getId(params.category);
  
  if (!categoryId) {
    categoryId = categoryCache.getIdByAlias(params.category);
  }
  
  if (!categoryId) {
    // Category not found - provide helpful error
    const suggestions = categoryCache.searchByName(params.category);
    return JSON.stringify({
      error: `Category not found: ${params.category}`,
      suggestion: 'Try using list_categories to see available categories',
      didYouMean: suggestions.slice(0, 5).map(id => categoryCache.getName(id))
    }, null, 2);
  }
  
  // Get category metadata
  const metadata = categoryCache.getMetadata(categoryId);
  const statistics = categoryCache.getStatistics(categoryId);
  
  if (!metadata || !statistics) {
    return JSON.stringify({
      error: 'Failed to load category metadata'
    }, null, 2);
  }
  
  // Determine which categories to search
  const categoryIdsToSearch = [categoryId];
  const childCategories = [];
  
  if (params.includeChildren) {
    const children = categoryCache.getChildren(categoryId);
    categoryIdsToSearch.push(...children);
    
    // Build child category info for output
    for (const childId of children) {
      const childStats = categoryCache.getStatistics(childId);
      childCategories.push({
        id: childId,
        name: categoryCache.getName(childId),
        documentCount: childStats?.documentCount || 0,
        chunkCount: childStats?.chunkCount || 0
      });
    }
  }
  
  // Find all documents in these categories
  const documents = [];
  for (const id of categoryIdsToSearch) {
    const docs = await catalogRepo.findByCategory(id);
    documents.push(...docs);
  }
  
  // Find all concepts in these categories
  const concepts = [];
  for (const id of categoryIdsToSearch) {
    const cons = await conceptRepo.findByCategory(id);
    concepts.push(...cons);
  }
  
  // Optionally find chunks
  let chunks = [];
  if (params.includeChunks) {
    for (const id of categoryIdsToSearch) {
      const chnks = await chunkRepo.findByCategory(id);
      chunks.push(...chnks);
    }
  }
  
  // Apply limits
  const limit = Math.min(params.limit || 10, 100);
  
  // Format results
  const result = {
    category: {
      id: categoryId,
      name: metadata.category,
      description: metadata.description,
      hierarchy: categoryCache.getHierarchyPathNames(categoryId),
      aliases: metadata.aliases,
      relatedCategories: metadata.relatedCategories.map(id => 
        categoryCache.getName(id)
      ).filter(Boolean)
    },
    statistics: {
      totalDocuments: statistics.documentCount,
      totalChunks: statistics.chunkCount,
      totalConcepts: statistics.conceptCount,
      ...(params.includeChildren && childCategories.length > 0 && {
        childCategories
      })
    },
    documents: documents.slice(0, limit).map(doc => ({
      source: doc.source,
      preview: doc.text.substring(0, 200) + '...',
      concepts: Array.isArray(doc.concepts) 
        ? doc.concepts.slice(0, 5) 
        : [],
      categories: doc.conceptCategories || [],
      chunkCount: doc.chunkCount || 0
    })),
    concepts: concepts.slice(0, limit).map(con => ({
      name: con.concept,
      type: con.conceptType,
      category: con.category,
      weight: con.weight,
      chunkCount: con.chunkCount,
      relatedConcepts: con.relatedConcepts.slice(0, 3)
    }))
  };
  
  // Add chunks if requested
  if (params.includeChunks) {
    result['chunks'] = chunks.slice(0, limit).map(chunk => ({
      id: chunk.id,
      text: chunk.text.substring(0, 300) + '...',
      source: chunk.source,
      concepts: Array.isArray(chunk.concepts) ? chunk.concepts : [],
      conceptDensity: chunk.conceptDensity || 0
    }));
  }
  
  return JSON.stringify(result, null, 2);
}
```

### Usage Examples

#### Example 1: Basic Category Search
```typescript
// User query
{
  "category": "software architecture"
}

// Result: Top 10 documents and concepts in "software architecture"
```

#### Example 2: Search with Hierarchy
```typescript
{
  "category": "software engineering",
  "includeChildren": true,
  "limit": 5
}

// Result: Documents from "software engineering" AND all child categories
// (software architecture, web development, database design, etc.)
```

#### Example 3: Search by Alias
```typescript
{
  "category": "ML",
  "includeChunks": true
}

// Resolves "ML" → "machine learning"
// Returns documents, concepts, AND individual chunks
```

#### Example 4: Large Limit
```typescript
{
  "category": "distributed systems",
  "limit": 50
}

// Returns up to 50 documents and 50 concepts
```

---

## Tool 2: list_categories

### Purpose

Browse all available categories with statistics, sorted by various criteria.

### Tool Definition

```typescript
{
  name: 'list_categories',
  description: 'List all categories with statistics. Useful for discovering what categories exist and their popularity.',
  inputSchema: {
    type: 'object',
    properties: {
      sortBy: {
        type: 'string',
        enum: ['name', 'popularity', 'documentCount', 'chunkCount', 'conceptCount'],
        description: 'Sort categories by this field (default: popularity)',
        default: 'popularity'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of categories to return (default: 50)',
        default: 50
      },
      includeHierarchy: {
        type: 'boolean',
        description: 'Include parent-child hierarchy information (default: false)',
        default: false
      },
      filter: {
        type: 'string',
        description: 'Filter categories by name substring (case-insensitive)',
        optional: true
      }
    }
  }
}
```

### Input Parameters

#### `sortBy` (optional)
- **Type**: enum
- **Values**: `'name'`, `'popularity'`, `'documentCount'`, `'chunkCount'`, `'conceptCount'`
- **Default**: `'popularity'`
- **Examples**:
  ```typescript
  sortBy: 'name'           // Alphabetical
  sortBy: 'popularity'     // Most popular first
  sortBy: 'documentCount'  // Most documents first
  ```

#### `limit` (optional)
- **Type**: number
- **Default**: 50
- **Min**: 1
- **Max**: 200

#### `includeHierarchy` (optional)
- **Type**: boolean
- **Default**: false
- **Purpose**: Show parent-child relationships

#### `filter` (optional)
- **Type**: string
- **Purpose**: Filter categories by name substring
- **Example**: `filter: "software"` → returns "software architecture", "software engineering", etc.

### Output Format

```typescript
{
  totalCategories: 47,
  returnedCategories: 20,
  categories: [
    {
      id: "5",
      name: "software architecture",
      description: "Patterns and principles for structuring software systems",
      statistics: {
        documentCount: 47,
        chunkCount: 2350,
        conceptCount: 156
      },
      hierarchy: {  // Only if includeHierarchy: true
        parent: "software engineering",
        children: ["microservices", "design patterns"],
        depth: 1
      },
      aliases: ["software design", "system architecture"],
      relatedCategories: [
        "distributed systems",
        "design patterns",
        "cloud computing"
      ]
    },
    // ... more categories ...
  ],
  
  // Aggregate statistics
  aggregateStats: {
    totalDocuments: 543,
    totalChunks: 27150,
    totalConcepts: 8432,
    averageDocsPerCategory: 11.6,
    averageChunksPerCategory: 578.7,
    mostPopularCategory: "software architecture",
    leastPopularCategory: "cryptography"
  }
}
```

### Implementation

**File**: `src/tools/operations/list-categories.ts`

```typescript
import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache';

export interface ListCategoriesParams {
  sortBy?: 'name' | 'popularity' | 'documentCount' | 'chunkCount' | 'conceptCount';
  limit?: number;
  includeHierarchy?: boolean;
  filter?: string;
}

export async function listCategories(
  params: ListCategoriesParams,
  categoryCache: CategoryIdCache
): Promise<string> {
  // Get all categories
  let allCategories = categoryCache.exportAll();
  
  // Apply filter if provided
  if (params.filter) {
    const filterLower = params.filter.toLowerCase();
    allCategories = allCategories.filter(cat => 
      cat.category.toLowerCase().includes(filterLower)
    );
  }
  
  // Sort
  const sortBy = params.sortBy || 'popularity';
  allCategories.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.category.localeCompare(b.category);
      case 'popularity':
        return b.documentCount - a.documentCount;  // Sort by document count
      case 'documentCount':
        return b.documentCount - a.documentCount;
      case 'chunkCount':
        return b.chunkCount - a.chunkCount;
      case 'conceptCount':
        return b.conceptCount - a.conceptCount;
      default:
        return 0;
    }
  });
  
  // Apply limit
  const limit = Math.min(params.limit || 50, 200);
  const limitedCategories = allCategories.slice(0, limit);
  
  // Format output
  const categories = limitedCategories.map(cat => {
    const result: any = {
      id: cat.id,
      name: cat.category,
      description: cat.description,
      statistics: {
        documentCount: cat.documentCount,
        chunkCount: cat.chunkCount,
        conceptCount: cat.conceptCount
      },
      aliases: cat.aliases,
      relatedCategories: cat.relatedCategories.map(id => 
        categoryCache.getName(id)
      ).filter(Boolean)
    };
    
    // Add hierarchy if requested
    if (params.includeHierarchy) {
      const hierarchy = categoryCache.getHierarchyPath(cat.id);
      result.hierarchy = {
        parent: cat.parentCategoryId 
          ? categoryCache.getName(cat.parentCategoryId) 
          : null,
        children: categoryCache.getChildren(cat.id).map(id => 
          categoryCache.getName(id)
        ).filter(Boolean),
        depth: hierarchy.length - 1
      };
    }
    
    return result;
  });
  
  // Calculate aggregate statistics
  const totalDocs = allCategories.reduce((sum, cat) => sum + cat.documentCount, 0);
  const totalChunks = allCategories.reduce((sum, cat) => sum + cat.chunkCount, 0);
  const totalConcepts = allCategories.reduce((sum, cat) => sum + cat.conceptCount, 0);
  
  const mostPopular = allCategories.reduce((max, cat) => 
    cat.documentCount > max.documentCount ? cat : max
  );
  
  const leastPopular = allCategories.reduce((min, cat) => 
    cat.documentCount < min.documentCount ? cat : min
  );
  
  const result = {
    totalCategories: allCategories.length,
    returnedCategories: categories.length,
    categories,
    aggregateStats: {
      totalDocuments: totalDocs,
      totalChunks: totalChunks,
      totalConcepts: totalConcepts,
      averageDocsPerCategory: totalDocs / allCategories.length,
      averageChunksPerCategory: totalChunks / allCategories.length,
      mostPopularCategory: mostPopular.category,
      leastPopularCategory: leastPopular.category
    }
  };
  
  return JSON.stringify(result, null, 2);
}
```

### Usage Examples

#### Example 1: List Top Categories
```typescript
{
  "sortBy": "popularity",
  "limit": 10
}

// Returns top 10 most popular categories
```

#### Example 2: Browse by Name
```typescript
{
  "sortBy": "name",
  "limit": 50
}

// Returns up to 50 categories in alphabetical order
```

#### Example 3: Filter Categories
```typescript
{
  "filter": "software",
  "sortBy": "documentCount"
}

// Returns categories matching "software", sorted by document count
```

#### Example 4: Full Hierarchy View
```typescript
{
  "includeHierarchy": true,
  "sortBy": "name"
}

// Returns categories with parent-child relationships shown
```

---

## Tool 3: list_concepts_in_category

### Purpose

List all unique concepts that appear in documents belonging to a specific category. Useful for understanding the conceptual landscape of a domain.

### Tool Definition

```typescript
{
  name: 'list_concepts_in_category',
  description: 'List all concepts that appear in documents of a specific category. Shows what topics/ideas are discussed within a domain.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Category name, ID, or alias (e.g., "software engineering", "ML")'
      },
      sortBy: {
        type: 'string',
        enum: ['name', 'documentCount', 'weight'],
        description: 'Sort concepts by this field (default: documentCount)',
        default: 'documentCount'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of concepts to return (default: 50)',
        default: 50
      }
    },
    required: ['category']
  }
}
```

### Input Parameters

#### `category` (required)
- **Type**: string
- **Formats**: Category name, ID, or alias
- **Examples**: "software engineering", "ML", "7362849501"

#### `sortBy` (optional)
- **Type**: enum
- **Values**: `'name'`, `'documentCount'`, `'weight'`
- **Default**: `'documentCount'`
- **Purpose**: Order concepts by importance/frequency

#### `limit` (optional)
- **Type**: number
- **Default**: 50
- **Purpose**: Limit results to prevent overwhelming output

### Output Format

```typescript
{
  category: {
    id: 7362849501,
    name: "software engineering",
    description: "Software design, development, and architecture practices"
  },
  statistics: {
    totalDocuments: 47,
    totalConcepts: 156,
    averageConceptsPerDocument: 3.3
  },
  concepts: [
    {
      id: 3842615478,
      name: "API gateway",
      type: "thematic",
      documentCount: 12,        // How many docs in this category mention it
      totalDocumentCount: 18,   // Total docs across all categories
      weight: 0.85,
      relatedConcepts: ["microservices", "load balancing"]
    },
    {
      id: 1829374562,
      name: "microservices",
      type: "thematic",
      documentCount: 23,
      totalDocumentCount: 31,
      weight: 0.92,
      relatedConcepts: ["API gateway", "service mesh"]
    },
    // ... more concepts
  ]
}
```

### Implementation

**File**: `src/tools/operations/list-concepts-in-category.ts`

```typescript
import type { CategoryIdCache } from '../../infrastructure/cache/category-id-cache';
import type { CatalogRepository } from '../../domain/interfaces/catalog-repository';
import type { ConceptRepository } from '../../domain/interfaces/concept-repository';

export interface ListConceptsInCategoryParams {
  category: string;
  sortBy?: 'name' | 'documentCount' | 'weight';
  limit?: number;
}

export async function listConceptsInCategory(
  params: ListConceptsInCategoryParams,
  categoryCache: CategoryIdCache,
  catalogRepo: CatalogRepository,
  conceptRepo: ConceptRepository
): Promise<string> {
  // Resolve category ID
  const categoryId = categoryCache.getIdByAlias(params.category) 
    || categoryCache.getId(params.category);
  
  if (!categoryId) {
    return JSON.stringify({
      error: `Category not found: ${params.category}`,
      suggestion: 'Try using list_categories to see available categories'
    }, null, 2);
  }
  
  // Get category metadata
  const metadata = categoryCache.getMetadata(categoryId);
  
  if (!metadata) {
    return JSON.stringify({
      error: 'Failed to load category metadata'
    }, null, 2);
  }
  
  // Find all documents in this category
  const docs = await catalogRepo.findByCategory(categoryId);
  
  // Collect unique concept IDs from these documents
  const conceptIdCounts = new Map<number, number>();
  
  for (const doc of docs) {
    const docConcepts: number[] = JSON.parse(doc.concept_ids || '[]');
    docConcepts.forEach(conceptId => {
      conceptIdCounts.set(conceptId, (conceptIdCounts.get(conceptId) || 0) + 1);
    });
  }
  
  // Fetch concept details
  const conceptIds = Array.from(conceptIdCounts.keys());
  const concepts = await conceptRepo.findByIds(conceptIds);
  
  // Enrich with document counts in this category
  const enrichedConcepts = concepts.map(concept => ({
    id: concept.id,
    name: concept.concept,
    type: concept.conceptType,
    documentCount: conceptIdCounts.get(concept.id) || 0,  // In this category
    totalDocumentCount: concept.catalog_ids?.length || 0,  // Across all categories
    weight: concept.weight,
    relatedConcepts: concept.relatedConcepts?.slice(0, 3) || []
  }));
  
  // Sort
  const sortBy = params.sortBy || 'documentCount';
  enrichedConcepts.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'documentCount':
        return b.documentCount - a.documentCount;
      case 'weight':
        return b.weight - a.weight;
      default:
        return 0;
    }
  });
  
  // Apply limit
  const limit = Math.min(params.limit || 50, 200);
  const limitedConcepts = enrichedConcepts.slice(0, limit);
  
  // Format result
  const result = {
    category: {
      id: categoryId,
      name: metadata.category,
      description: metadata.description
    },
    statistics: {
      totalDocuments: docs.length,
      totalConcepts: conceptIds.length,
      averageConceptsPerDocument: (conceptIds.length / docs.length).toFixed(1)
    },
    concepts: limitedConcepts
  };
  
  return JSON.stringify(result, null, 2);
}
```

### Usage Examples

#### Example 1: Most Common Concepts

```typescript
{
  "category": "software engineering",
  "sortBy": "documentCount",
  "limit": 20
}

// Returns top 20 concepts by frequency in software engineering docs
```

#### Example 2: Alphabetical Browse

```typescript
{
  "category": "machine learning",
  "sortBy": "name",
  "limit": 100
}

// Returns up to 100 concepts alphabetically
```

#### Example 3: By Importance

```typescript
{
  "category": "healthcare",
  "sortBy": "weight",
  "limit": 30
}

// Returns top 30 concepts by weight score
```

---

## Integration with Existing Tools

### Complementary Usage

```typescript
// 1. List categories to discover what's available
list_categories({ sortBy: 'popularity', limit: 20 })

// 2. Search specific category for documents
category_search({ category: 'software engineering', limit: 10 })

// 3. List concepts in that category
list_concepts_in_category({ category: 'software engineering', limit: 50 })

// 4. Deep dive into specific concept
concept_search({ concept: 'API gateway' })

// 5. Find documents with concept
catalog_search({ text: 'API gateway', limit: 5 })
```

### Workflow Examples

#### Research Workflow
```
User: "What categories do I have?"
→ list_categories

User: "Show me software architecture documents"
→ category_search { category: "software architecture" }

User: "Find chunks about API gateway in that category"
→ chunks_search { text: "API gateway", source: <selected document> }
```

#### Discovery Workflow
```
User: "What's in my machine learning collection?"
→ category_search { category: "ML", includeChildren: true }

User: "What concepts are most important?"
→ extract_concepts { document_query: <selected document> }
```

---

**Status**: Design complete  
**Next**: Implement tools in Phase 5 of migration  
**Date**: 2025-11-19

