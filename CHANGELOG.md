# Changelog

All notable changes to Concept-RAG will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Contributing guidelines (CONTRIBUTING.md)
- Security policy (SECURITY.md)
- Changelog tracking
- FAQ documentation
- Enhanced troubleshooting guide

## [1.0.0] - 2025-11-13

### Added
- **5 Specialized MCP Tools**:
  - `catalog_search` - Document discovery with title matching
  - `concept_search` - High-precision semantic concept tracking
  - `broad_chunks_search` - Comprehensive cross-document search
  - `chunks_search` - Single document focused search
  - `extract_concepts` - Concept inventory export

- **Multi-Signal Hybrid Ranking**:
  - Vector similarity (384-dimensional embeddings)
  - BM25 keyword matching
  - Concept matching with semantic validation
  - Title matching with 10x boost
  - WordNet synonym expansion

- **Formal Concept Model**:
  - Rigorous concept definition
  - LLM-powered extraction (Claude Sonnet 4.5)
  - 80-150+ concepts per document
  - Three-level hierarchy (primary, technical, related)
  - Semantic validation and disambiguation

- **WordNet Integration**:
  - 161K+ words with synonym expansion
  - Hierarchical concept navigation
  - Python NLTK bridge for semantic enrichment

- **Robust Document Processing**:
  - PDF parsing with OCR fallback
  - Multi-pass extraction for large documents (>100k tokens)
  - Graceful handling of corrupted files
  - Incremental seeding (process only new/changed files)

- **Fast Summaries**:
  - Grok-4-fast for efficient document summarization
  - Document metadata with categories
  - Preview generation for search results

- **Comprehensive Documentation**:
  - README.md with end-to-end walkthrough
  - USAGE.md with workflow examples
  - tool-selection-guide.md with decision tree
  - scripts/README.md for CLI utilities
  - prompts/README.md for prompt customization

- **CLI Scripts**:
  - `extract_concepts.ts` - Extract concepts to JSON/Markdown
  - `rebuild_indexes.ts` - Optimize LanceDB indexes
  - `reenrich_chunks_with_concepts.ts` - Re-tag chunks
  - `repair_missing_concepts.ts` - Fix incomplete extractions

- **Developer Tools**:
  - TypeScript with strict mode
  - MCP Inspector support
  - Local embedding models (no API costs for search)
  - Configurable database paths

### Changed
- Forked from [lance-mcp](https://github.com/adiom-data/lance-mcp)
- Migrated from simple vector search to hybrid conceptual search
- Enhanced error handling with better logging
- Improved JSON parsing with fallback strategies
- Optimized seeding performance (incremental mode)

### Performance
- **Seeding cost**: ~$0.048 per document (one-time)
  - Concept extraction: ~$0.041/doc (Claude Sonnet 4.5)
  - Summarization: ~$0.007/doc (Grok-4-fast)
- **Runtime search**: $0 (local vector search, no API calls)
- **Incremental seeding**: 
  - Initial 100 docs: ~25 minutes
  - Add 10 new docs: ~3 minutes
  - Add 1 new doc: ~15 seconds

### Technical Details
- **Database**: LanceDB for vector storage
- **Embeddings**: Xenova/all-MiniLM-L6-v2 (384-dim, local)
- **Concept Model**: Claude Sonnet 4.5 (anthropic/claude-3.5-sonnet-20240620)
- **Summaries**: Grok-4-fast (x-ai/grok-2-1212)
- **WordNet**: NLTK corpus with Python subprocess bridge
- **Node.js**: 18+ required
- **Python**: 3.9+ required (for WordNet)

### Acknowledgments
This project is forked from [lance-mcp](https://github.com/adiom-data/lance-mcp) by [adiom-data](https://github.com/adiom-data), which provided the foundational MCP server architecture and LanceDB integration.

## [0.1.0] - 2024-XX-XX (lance-mcp origin)

### Initial Release (Upstream Project)
- Basic MCP server implementation
- LanceDB vector storage
- Simple document search
- PDF processing
- Vector embeddings

---

## Version History

### What's a Version Number?

We use [Semantic Versioning](https://semver.org/):
- **Major version** (1.x.x): Breaking changes, major new features
- **Minor version** (x.1.x): New features, backwards compatible
- **Patch version** (x.x.1): Bug fixes, minor improvements

### Release Types

- **[Unreleased]**: Changes in development, not yet released
- **[Version Number]**: Released versions with date

### Change Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed in future versions
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

---

## Upgrading

### From lance-mcp to Concept-RAG 1.0

**Major Changes**:
1. **New database structure**: Requires full re-seeding
2. **New tool names**: Update MCP client configuration
3. **Environment variables**: Add `OPENROUTER_API_KEY`

**Migration Steps**:
```bash
# 1. Backup existing database (if any)
mv ~/.concept_rag ~/.concept_rag.backup

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install
npm run build

# 4. Install WordNet
pip3 install nltk
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# 5. Configure environment
cp .env.example .env
# Edit .env and add your OpenRouter API key

# 6. Re-seed database with concept extraction
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/Documents/pdfs \
  --overwrite
```

### Future Compatibility

We're committed to backwards compatibility within major versions. Breaking changes will only occur in major version updates (2.0.0, 3.0.0, etc.) and will be clearly documented.

---

## Planned Features

See [GitHub Issues](https://github.com/m2ux/concept-rag/issues) for roadmap and feature requests.

### Under Consideration
- Additional document format support (DOCX, TXT, Markdown)
- Automated testing framework
- Web UI for concept exploration
- Multi-language support
- Document clustering and similarity
- Export formats (CSV, Excel)
- Custom embedding model support
- Performance benchmarks

---

## Support

- **Issues**: [GitHub Issues](https://github.com/m2ux/concept-rag/issues)
- **Documentation**: [README.md](README.md), [USAGE.md](USAGE.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)

---

[Unreleased]: https://github.com/m2ux/concept-rag/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/m2ux/concept-rag/releases/tag/v1.0.0

