# Agent Instructions for Concept-RAG

This document provides formal definitions and instructions for AI agents that work with the Concept-RAG system.

## Formal Definition of a Concept

**A concept is a uniquely identified, abstract idea packaged with its names, definition, distinguishing features, relations, and detection cues, enabling semantic matching and disambiguated retrieval across texts.**

### Key Components of a Concept

Based on this formal definition, when processing documents and extracting concepts, agents should ensure that each concept:

1. **Uniquely Identified**: Has a distinct identity that can be referenced consistently across documents
2. **Abstract Idea**: Represents a generalizable notion rather than a specific instance
3. **Packaged with Names**: Includes all relevant terminology used to refer to the concept
4. **Has a Definition**: Contains clear descriptive information about what the concept means
5. **Distinguishing Features**: Includes characteristics that differentiate it from similar concepts
6. **Relations**: Captures connections to other concepts (hierarchical, associative, causal, etc.)
7. **Detection Cues**: Provides indicators that help identify the concept in various contexts
8. **Enables Semantic Matching**: Structured to support finding conceptually similar content
9. **Disambiguated Retrieval**: Designed to reduce ambiguity when retrieving related information

## Document Parsing Guidelines

### What to Extract as Concepts

**✅ INCLUDE:**
- **Domain-specific terms**: Technical vocabulary from specific fields (e.g., "speciation", "exaptive bootstrapping", "allometric scaling")
- **Theories and frameworks**: Established theoretical constructs (e.g., "complexity theory", "game theory", "field theory")
- **Methodologies and processes**: Systematic approaches and procedures (e.g., "agent-based modeling", "regression analysis", "ethnography")
- **Multi-word conceptual phrases**: Compound terms that represent unified ideas (e.g., "strategic thinking", "social change", "network formation")
- **Phenomena and patterns**: Observable or theoretical patterns (e.g., "urban scaling", "emergence", "path dependence")
- **Abstract principles**: Generalizable rules or guidelines (e.g., "leadership principles", "design patterns")

### What NOT to Extract as Concepts

**❌ EXCLUDE:**
- **Temporal descriptions**: Time-bound or situational phrases (e.g., "periods of heavy recruitment", "times of crisis", "early adoption phase")
- **Specific action phrases**: Context-dependent actions (e.g., "balancing broad cohesion with innovation", "managing diverse stakeholders")
- **Suppositions and observations**: Contextual statements (e.g., "attraction for potential collaborators", "tendency toward cooperation")
- **Generic single words**: Common words without domain specificity (e.g., "power", "riches", "time", "space", "people", "work", "money")
- **Proper names**: Names of people, organizations, places, publications
- **Metadata**: Dates, page numbers, reference numbers, file identifiers

## Concept Extraction Process

When extracting concepts from documents:

1. **Identify abstract, reusable ideas** that could apply across multiple contexts
2. **Capture the full conceptual phrase** rather than isolated words
3. **Note relationships** between concepts (hierarchical, associative, causal)
4. **Record synonyms and variations** to enable semantic matching
5. **Distinguish similar concepts** by their unique features
6. **Provide detection cues** such as common contexts or indicator words

## Integration with Concept-RAG Architecture

### Primary Concepts
The main ideas, methods, and theories that are central to the document's content. These should be:
- Domain-specific and meaningful
- Reusable across contexts
- Clearly defined and distinguishable

### Related Concepts
Broader topics and themes that provide context and enable discovery. These should be:
- Connected to primary concepts through semantic relationships
- Useful for query expansion and semantic search
- Representative of the document's conceptual neighborhood

### Categories
High-level domain classifications (3-7 per document) that situate the content within broader knowledge areas.

## Usage in System Components

### Concept Extractor (`src/concepts/concept_extractor.ts`)
Uses LLMs to extract concepts according to the formal definition and guidelines above.

### Query Expander (`src/concepts/query_expander.ts`)
Expands queries using corpus concepts and WordNet to leverage the semantic relationships captured during extraction.

### Conceptual Search Client (`src/lancedb/conceptual_search_client.ts`)
Performs multi-signal hybrid search utilizing the structured concept data.

---

**Note**: This definition should be referenced when:
- Extracting concepts from new documents
- Evaluating concept extraction quality
- Designing search and retrieval strategies
- Training or prompting AI agents for document analysis


