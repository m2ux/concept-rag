# 4. RAG (Retrieval-Augmented Generation) Architecture

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational RAG approach from upstream lance-mcp project  

**Git Commit:**
```
Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2
Date: November 19, 2024
Project: lance-mcp (upstream)
```

## Context and Problem Statement

The project needed an architecture for enabling LLMs to search and retrieve information from personal document collections. The core question: How should documents be processed, stored, and retrieved to best support AI agent queries?

**Decision Drivers:**
* Enable LLMs to access knowledge from personal documents
* Support semantic search (not just keyword matching)
* Efficient retrieval without sending entire documents to LLM
* Scalable to thousands of documents
* Support for various document formats (PDF, EPUB)
* Cost-effective for personal use

## Alternative Options

* **Option 1: RAG with Vector Search** - Index documents as embeddings, retrieve relevant chunks
* **Option 2: Full Document Context** - Send entire documents to LLM (context stuffing)
* **Option 3: Fine-Tuning** - Fine-tune LLM on document corpus
* **Option 4: Knowledge Graph** - Build structured knowledge graph from documents
* **Option 5: Traditional Search** - Keyword-based search only (Elasticsearch/Solr)

## Decision Outcome

**Chosen option:** "RAG with Vector Search (Option 1)"

### RAG Pipeline Architecture

```
PDF Documents
        ↓
   Text Extraction (PDFLoader)
        ↓
   Summary Generation (Ollama LLM)
   map-reduce chain
        ↓
   Text Chunking
   RecursiveCharacterTextSplitter
   (chunk size: 500, overlap: 10)
        ↓
   Embedding Generation
   (Ollama: snowflake-arctic-embed2)
        ↓
   Storage (LanceDB)
   ├── Catalog Table (summaries + vectors)
   └── Chunks Table (chunks + vectors)
        ↓
   Vector Similarity Search
        ↓
   Retrieved Chunks
```
[Source: lance-mcp `src/seed.ts`, lines 69-186]

### Key Design Decisions

1. **Chunking**: RecursiveCharacterTextSplitter, 500 tokens, 10 overlap
2. **Summaries**: Ollama LLM with map-reduce chain
3. **Embeddings**: Ollama (snowflake-arctic-embed2)
4. **Tables**: Two tables (catalog for summaries, chunks for retrieval)
5. **Search**: Vector similarity only

### Consequences

**Positive:**
* **Cost-Effective**: Only relevant chunks sent to LLM (not entire documents)
* **Scalable**: Works with document collections
* **Semantic Search**: Finds relevant information even without keyword matches
* **Up-to-Date**: Can add new documents without retraining
* **Privacy**: All processing local, documents don't leave machine (except LLM API for extraction)
* **Flexible**: Can improve retrieval without changing generation
* **Explainable**: Can see which chunks were retrieved and why

**Negative:**
* **Chunk Boundaries**: May split related information across chunks
* **Context Window**: Limited to K chunks (may miss relevant information)
* **Embedding Quality**: Depends on embedding model quality
* **Two-Stage Latency**: Retrieval + generation adds latency
* **Index Maintenance**: Must re-index when documents change

**Neutral:**
* **Embedding Cost**: One-time cost to generate embeddings (~$0.05/doc)
* **Storage**: Requires vector database
* **Complexity**: More complex than simple search

### Confirmation

System validated by:
- Local Ollama models working
- Vector search functional
- Zero API costs

## Pros and Cons of the Options

### Option 1: RAG with Vector Search (Chosen)

**Pros:**
* Best accuracy for semantic queries
* Cost-effective (only send relevant chunks)
* Scalable to large corpora
* Privacy-friendly (local processing)
* No retraining needed for new documents
* Flexible retrieval strategies

**Cons:**
* Chunking may split information
* Depends on embedding quality
* Two-stage adds latency
* Requires vector database

### Option 2: Full Document Context

**Pros:**
* No retrieval errors (LLM sees everything)
* Simple implementation
* No chunking issues

**Cons:**
* **Expensive**: Context window costs scale with document size
* **Limited**: Can only handle few documents at once (context window limits)
* **Slow**: Large contexts slow LLM processing
* **Not scalable**: Breaks down with many documents

### Option 3: Fine-Tuning

**Pros:**
* Knowledge "baked in" to model
* Fast inference (no retrieval)
* No external storage needed

**Cons:**
* **Very expensive**: $100s-$1000s to fine-tune
* **Static**: Must retrain for new documents
* **Hallucination risk**: Model may confabulate
* **No citations**: Can't trace answers to sources
* **Over-engineering**: Overkill for personal use

### Option 4: Knowledge Graph

**Pros:**
* Structured relationships
* Good for graph queries
* Explicit knowledge representation

**Cons:**
* **High upfront cost**: Expensive to extract graph structure
* **Complex**: Requires ontology design
* **Not suitable**: Documents are unstructured, not graph-structured
* **Over-engineering**: Too complex for search use case

### Option 5: Traditional Search Only

**Pros:**
* Well-understood technology
* Fast keyword search
* Simple implementation

**Cons:**
* **No semantic understanding**: Misses synonyms
* **Keyword dependency**: Must know exact terms
* **Limited query capability**: Requires keyword matches
* **No embeddings**: Can't leverage semantic similarity

## Implementation Notes

### Indexing Pipeline

**Script**: `src/seed.ts`

```typescript
// For each document:
1. Load PDF (PDFLoader from langchain)
2. Generate summary (Ollama LLM with map-reduce)
3. Create chunks (RecursiveCharacterTextSplitter, 500 tokens)
4. Generate embeddings (Ollama snowflake-arctic-embed2)
5. Store in LanceDB (catalog table, chunks table)
```
[Source: lance-mcp `src/seed.ts`]

### Chunking

```typescript
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 10,
});
const docs = await splitter.splitDocuments(filteredRawDocs);
```
[Source: lance-mcp `src/seed.ts`, lines 172-175]

### Embeddings

```typescript
// Ollama embeddings
new OllamaEmbeddings({model: defaults.EMBEDDING_MODEL})
// Default: snowflake-arctic-embed2
```
[Source: lance-mcp `src/seed.ts`, lines 160, 180]

### Cost Analysis

**One-Time Indexing:**
- Ollama local models (zero cost)
- Summary generation: Local
- Embeddings: Local

**Runtime:**
- Vector search: Local (zero cost)
- LLM: Local Ollama

## Related Decisions

- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md) - Storage for RAG
- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md) - Document loading

## More Information

## References

### Related Decisions
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)
- [ADR-0005: PDF Processing](adr0005-pdf-document-processing.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2

