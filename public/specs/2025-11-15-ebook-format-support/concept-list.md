# Concept List: Ebook Format Support (.mobi & .epub)

**Date**: November 15, 2025  
**Task**: Add .mobi and .epub document support to concept-rag

---

## Core Technical Concepts

- **Document Processing**
  - Text extraction
  - Document loaders
  - File type detection
  - Format parsing
  - Content chunking
  - Metadata extraction

- **TypeScript/Node.js**
  - LangChain document loaders
  - LangChain community packages
  - TypeScript interfaces
  - File system operations
  - Streaming file processing
  - Error handling patterns

- **Ebook Formats**
  - EPUB (Electronic Publication)
  - MOBI (Mobipocket)
  - EPUB structure (ZIP container, XHTML/XML)
  - MOBI format variants (KF8, MOBI7)
  - OPF metadata (Open Package Format)
  - NCX navigation (Navigation Control for XML)

## Architecture & Design Concepts

- **Design Patterns**
  - Strategy pattern (document loader selection)
  - Factory pattern (loader instantiation)
  - Adapter pattern (format abstraction)
  - Repository pattern (existing)
  - Dependency injection (existing)

- **Extensibility**
  - Plugin architecture
  - Format abstraction
  - Loader interface
  - Configuration management
  - Extension points

- **Clean Architecture**
  - Separation of concerns
  - Interface-based design
  - Dependency inversion
  - Single responsibility principle
  - Open-closed principle

## Document Processing Concepts

- **Text Extraction**
  - HTML/XHTML parsing
  - XML parsing
  - ZIP archive handling
  - Character encoding
  - Content filtering
  - Format normalization

- **Chunking**
  - Recursive character splitting
  - Semantic chunking
  - Token limits
  - Chunk boundaries
  - Overlap strategies

- **Metadata**
  - Document metadata
  - Author information
  - Title extraction
  - Publisher data
  - ISBN/identifiers
  - Cover art handling

## LangChain Integration

- **LangChain Document Loaders**
  - PDFLoader (existing reference)
  - EPUBLoader (to implement)
  - Custom document loaders
  - Document interface
  - Metadata schema
  - Loader abstraction

- **LangChain Core**
  - Document class
  - Text splitters
  - Document transformers
  - Metadata management

## Testing Concepts

- **Test-Driven Development**
  - Unit testing
  - Integration testing
  - Test doubles (fakes/stubs)
  - Test data builders
  - Four-phase test pattern

- **Test Coverage**
  - Format-specific tests
  - Error handling tests
  - Edge case testing
  - Regression testing
  - Performance testing

## Implementation Concepts

- **Format Libraries**
  - epub.js / epub-parser
  - mobi parsing libraries
  - ZIP extraction (JSZip, AdmZip)
  - XML/HTML parsing (cheerio, jsdom)
  - Buffer handling

- **File System Operations**
  - Recursive file scanning
  - File type detection (MIME types, extensions)
  - Path handling
  - Stream processing
  - Temporary file management

## Error Handling

- **Robustness**
  - Graceful degradation
  - Error recovery
  - Fallback strategies
  - Logging and debugging
  - Validation

- **Edge Cases**
  - Corrupted files
  - Unsupported formats
  - Empty content
  - Encoding issues
  - Malformed structure

## Quality & Process Concepts

- **Code Quality**
  - TypeScript strict mode
  - Type safety
  - Code reusability
  - Maintainability
  - Documentation (JSDoc)

- **Backward Compatibility**
  - Non-breaking changes
  - API stability
  - Configuration compatibility
  - Database schema stability

## Performance Concepts

- **Optimization**
  - Streaming processing
  - Memory management
  - Lazy loading
  - Caching strategies
  - Batch processing

---

## Search Strategy

These concepts will be used with concept-rag MCP to:

1. **Find architecture patterns**: Use `concept_search` for "extensibility", "plugin architecture", "factory pattern"
2. **Document processing research**: Use `broad_chunks_search` for "document loader abstraction", "text extraction patterns"
3. **LangChain documentation**: Use `catalog_search` for "LangChain", "document loaders", "TypeScript"
4. **Testing patterns**: Use `concept_search` for "test-driven development", "integration testing"
5. **Error handling**: Use `broad_chunks_search` for "error recovery", "graceful degradation"

---

**Last Updated**: November 15, 2025

