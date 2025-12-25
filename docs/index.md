# Concept-RAG

**Search your documents by meaning, not just keywords.**

Concept-RAG is an MCP server that enables AI assistants to interact with your PDF and EPUB documents through conceptual search. It combines corpus-driven concept extraction, WordNet semantic enrichment, and multi-signal hybrid ranking for superior retrieval accuracy.

<div class="grid cards" markdown>

-   :material-brain:{ .lg .middle } **Conceptual Search**

    ---

    Search by meaning with 80-150+ extracted concepts per document

    [:octicons-arrow-right-24: How it works](#how-it-works)

-   :material-magnify:{ .lg .middle } **Hybrid Ranking**

    ---

    4-signal scoring: Vector + BM25 + Concepts + WordNet

    [:octicons-arrow-right-24: Architecture](architecture/README.md)

-   :material-book-multiple:{ .lg .middle } **Multi-Format**

    ---

    PDF and EPUB with OCR fallback for scanned documents

    [:octicons-arrow-right-24: Getting Started](getting-started.md)

-   :material-lightning-bolt:{ .lg .middle } **High Performance**

    ---

    80x-240x faster searches with optimized indexing

    [:octicons-arrow-right-24: API Reference](api-reference.md)

</div>

---

## How It Works

```mermaid
flowchart TB
    subgraph Input["📄 Documents"]
        PDF[PDF Files]
        EPUB[EPUB Files]
    end

    subgraph Processing["⚙️ Processing Pipeline"]
        Parse[Parse & Extract Text]
        OCR[OCR Fallback]
        Chunk[Chunk Text]
        Extract[Extract Concepts<br/>Claude Sonnet]
        Embed[Generate Embeddings]
        Summarize[Generate Summary<br/>Grok-4-fast]
    end

    subgraph Storage["💾 LanceDB Storage"]
        Catalog[(Catalog<br/>Documents)]
        Chunks[(Chunks<br/>Text Segments)]
        Concepts[(Concepts<br/>Index)]
        Categories[(Categories<br/>Taxonomy)]
    end

    subgraph Search["🔍 Hybrid Search"]
        Vector[Vector Similarity]
        BM25[BM25 Keywords]
        ConceptMatch[Concept Matching]
        WordNet[WordNet Expansion]
        Rank[Weighted Ranking]
    end

    subgraph Output["🤖 MCP Tools"]
        Tools[10 Specialized Tools]
        AI[AI Assistants]
    end

    PDF --> Parse
    EPUB --> Parse
    Parse --> OCR
    OCR --> Chunk
    Chunk --> Extract
    Chunk --> Embed
    Extract --> Summarize

    Embed --> Chunks
    Extract --> Concepts
    Summarize --> Catalog
    Extract --> Categories

    Catalog --> Vector
    Chunks --> Vector
    Concepts --> ConceptMatch
    
    Vector --> Rank
    BM25 --> Rank
    ConceptMatch --> Rank
    WordNet --> Rank
    
    Rank --> Tools
    Tools --> AI
```

---

## Quick Links

<div class="grid cards" markdown>

-   [:material-rocket-launch: **Getting Started**](getting-started.md)

    Install and configure in under 10 minutes

-   [:material-compass: **Tool Selection Guide**](tool-selection-guide.md)

    Choose the right tool for your query

-   [:material-api: **API Reference**](api-reference.md)

    Complete MCP tool documentation

-   [:material-help-circle: **FAQ**](faq.md)

    Common questions answered

-   [:material-wrench: **Troubleshooting**](troubleshooting.md)

    Fix common issues

-   [:material-github: **GitHub**](https://github.com/m2ux/concept-rag)

    Source code and contributions

</div>
