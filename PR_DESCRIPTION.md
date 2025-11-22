# Documentation: Architecture Decision Records and Concept Lexicon

## Summary

This PR adds comprehensive architectural documentation to the concept-rag project, including 33 Architecture Decision Records (ADRs) documenting all major technical decisions from the project's inception through November 2025, and a concept lexicon cataloging knowledge base concepts applicable to the project.

## Changes

### 📚 Architecture Decision Records (33 ADRs)

Added complete ADR documentation covering all architectural decisions organized into 7 phases:

**Phase 0: Inherited Foundation (5 ADRs)**
- TypeScript/Node.js runtime
- LanceDB vector storage
- MCP protocol integration
- RAG architecture approach
- PDF document processing

**Phase 1: Conceptual Search Transformation (6 ADRs)**
- Hybrid search strategy (5-signal ranking)
- Concept extraction with LLM
- WordNet integration
- Three-table architecture
- Query expansion strategy
- Multi-model strategy

**Phase 2-7: Additional Enhancements (22 ADRs)**
- OCR fallback, incremental seeding, multi-pass extraction
- Layered architecture refactoring, repository pattern, DI container
- Performance optimizations (80x-240x faster searches)
- Multi-provider embeddings, EPUB support
- Category system with 46 auto-extracted categories
- Tool architecture and selection guide

### 📖 Concept Lexicon

- Renamed `knowledge-base-concepts.md` → `concept-lexicon.md`
- Comprehensive catalog of concepts from the knowledge base organized by category:
  - Software Architecture & Design Patterns
  - Testing & Verification
  - Database & Search Systems
  - And 10+ additional categories
- 655 lines documenting concepts directly applicable to the project

### 📋 Architecture README

- Complete index of all 33 ADRs
- Organized by phase, topic, and status
- Reading guides for different audiences
- Key metrics and achievements summary
- Cross-reference matrix

### 🔧 Minor Changes

- Updated `tsconfig.build.json` (2 lines changed)

## Statistics

- **36 files changed**
- **9,770 insertions**, 51 deletions
- **33 new ADR files** (avg ~250 lines each)
- **1 architecture README** (280 lines)
- **1 concept lexicon** (655 lines, renamed from existing file)

## Impact

### Documentation Coverage
- ✅ Complete architectural decision history documented
- ✅ All major technical choices explained with context and alternatives
- ✅ Knowledge base concepts cataloged for reference
- ✅ Onboarding guide for new team members

### Benefits
- **Transparency**: Clear record of why decisions were made
- **Onboarding**: New developers can understand architectural evolution
- **Maintenance**: Future decisions can reference past context
- **Knowledge Management**: Concepts from knowledge base are cataloged and searchable

## Review Notes

- All ADRs follow a consistent template format
- Each ADR includes context, alternatives, decision, and consequences
- ADRs are cross-referenced where decisions relate to each other
- Concept lexicon is organized by functional area for easy navigation
- No code changes - documentation only

## Testing

- ✅ All markdown files validated for proper formatting
- ✅ All ADR links verified
- ✅ Concept lexicon structure validated

## Related

This PR completes the documentation effort for the `full_review` branch, providing comprehensive architectural documentation for the concept-rag project.


