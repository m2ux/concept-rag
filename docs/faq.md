# Frequently Asked Questions

Common questions about Concept-RAG answered.

---

## General

### What is Concept-RAG?

Concept-RAG is an MCP (Model Context Protocol) server that enables AI assistants like Claude and Cursor to search your documents using **conceptual understanding** rather than just keywords.

### What does "conceptual search" mean?

Conceptual search finds information based on **meaning**. For example, searching for "innovation" also finds related concepts like "creative process", "novel solutions", and "breakthrough thinking" because they're semantically related.

### Who is this for?

| User | Use Case |
|------|----------|
| **Researchers** | Exploring academic papers and literature |
| **Knowledge workers** | Managing large document collections |
| **Students** | Researching topics across multiple sources |
| **Writers** | Finding information for content creation |
| **Teams** | Sharing organizational knowledge bases |

---

## Setup & Installation

### What are the system requirements?

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Runtime environment |
| Python | 3.9+ | For WordNet integration |
| Storage | ~100MB per 1000 docs | Database size varies |

### How much does OpenRouter cost?

!!! info "One-Time Seeding Costs"
    - Concept extraction (Claude Sonnet): ~$0.041/doc
    - Summary generation (Grok-4-fast): ~$0.007/doc
    - **Total: ~$0.048 per document**

    **Search is always free** — queries run locally with no API calls.

### Do I need a GPU?

**No!** Concept-RAG uses:

- CPU-based local embeddings (Xenova/all-MiniLM-L6-v2)
- Efficient LanceDB vector search
- API calls only for initial concept extraction

### Can I use local LLMs instead of OpenRouter?

Currently, Concept-RAG requires OpenRouter for concept extraction. However:

- Search is completely local (no API calls)
- You could modify the code to use local LLMs
- See [CONTRIBUTING.md](https://github.com/m2ux/concept-rag/blob/main/CONTRIBUTING.md) for development guidelines

---

## Usage & Features

### Which search tool should I use?

| Goal | Tool | Example |
|------|------|---------|
| Find documents | `catalog_search` | "software architecture books" |
| Research a concept | `concept_search` | "design patterns" |
| Search phrases | `broad_chunks_search` | "how to implement caching" |
| Search in known doc | `chunks_search` | "SOLID principles" + source |
| Extract concept list | `extract_concepts` | "Clean Architecture" |

See [Tool Selection Guide](tool-selection-guide.md) for detailed guidance.

### What document formats are supported?

| Format | Status | Notes |
|--------|--------|-------|
| PDF | ✅ Supported | Text-based and scanned (OCR fallback) |
| EPUB | ✅ Supported | Electronic publication format |
| DOCX, TXT, MD | 📋 Planned | Contributions welcome |

### How accurate is concept extraction?

Very accurate! We use:

- **Claude Sonnet 4.5**: State-of-the-art LLM
- **Formal concept model**: Rigorous definition ensuring semantic matching
- **Multi-pass extraction**: For large documents (>100k tokens)
- **80-150+ concepts** per document with high precision

### Can I customize concept extraction?

Yes! Edit `prompts/concept-extraction.txt` to adjust:

- Concept levels (thematic, domain-specific, technical)
- Examples and categorization rules
- Extraction strategy

---

## Costs & Performance

### How fast is search?

| Query | Latency |
|-------|---------|
| First query | 1-3 seconds (database loading) |
| Subsequent queries | <1 second |
| Concept extraction | Instant (pre-computed) |

### How do I reduce seeding costs?

1. **Use incremental seeding** — only process new documents:
   ```bash
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
   ```

2. **Batch processing** — process many documents at once

3. **Selective processing** — only seed documents you need

---

## Data & Privacy

### Is my data private?

| Data | Location |
|------|----------|
| PDF files | ✅ Local only |
| Database (LanceDB) | ✅ Local only |
| Vector embeddings | ✅ Local only |
| Search queries | ✅ Local only |
| Document text (seeding) | ⚠️ Sent to OpenRouter |

!!! note "Search is 100% Local"
    After initial seeding, all search queries run locally with zero API calls.

See [SECURITY.md](https://github.com/m2ux/concept-rag/blob/main/SECURITY.md) for details.

### Can I export my data?

**Concepts** (per document):
```bash
npx tsx scripts/extract_concepts.ts "document name" markdown
npx tsx scripts/extract_concepts.ts "document name" json
```

**Database**: LanceDB uses Apache Arrow format (readable with Arrow libraries)

---

## Still Have Questions?

- 📖 [Troubleshooting Guide](troubleshooting.md)
- 💬 [GitHub Discussions](https://github.com/m2ux/concept-rag/discussions)
- 🐛 [Report an Issue](https://github.com/m2ux/concept-rag/issues)

