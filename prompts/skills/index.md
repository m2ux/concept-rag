# Skill Index

Skills define fixed tool sequences to fulfill user intents.

## Available Skills

| Skill | Capability | Tool Sequence |
|-------|------------|---------------|
| [deep-research](deep-research.md) | Synthesize knowledge across documents | `catalog_search` → `chunks_search` |
| [library-discovery](library-discovery.md) | Browse and inventory content | `list_categories` → `category_search` |
| [concept-exploration](concept-exploration.md) | Track concept across sources | `concept_search` → `source_concepts` |
| [document-analysis](document-analysis.md) | Extract concepts from document | `catalog_search` → `extract_concepts` |
| [category-exploration](category-exploration.md) | Understand domain concepts | `list_categories` → `category_search` → `list_concepts_in_category` |
| [pattern-research](pattern-research.md) | Find applicable design patterns | `concept_search` → `source_concepts` → `chunks_search` |
| [practice-research](practice-research.md) | Discover best practices | `broad_chunks_search` → `catalog_search` → `chunks_search` |

## Workflow

1. Match intent to skill(s) - multiple skills may apply
2. Execute chosen skill's tool sequence in order
3. Preserve context between calls
4. Synthesize output with citations
