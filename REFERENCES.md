# References

This document lists the design patterns, architectural concepts, and books that have influenced the design and implementation of this project. The concepts are applied throughout the codebase; this reference provides context and further reading for understanding the design decisions.

## Recursive Self-Improvement

**A unique aspect of this project**: The concept-rag system has been used recursively to improve itself. During development, the project's own concept search and retrieval capabilities were used to query a knowledge base containing the books listed below. This enabled the codebase to be augmented with appropriate design patterns and architectural concepts discovered through semantic search.

### The Self-Improvement Process

1. **Knowledge Base Creation** - Software design and architecture books (listed below) were indexed into the concept-rag database
2. **Concept Discovery** - During development, concept search was used to find relevant patterns (e.g., searching for "dependency injection", "repository pattern", "test fixtures")
3. **Pattern Application** - Retrieved concepts and principles were applied to the codebase design
4. **Iterative Refinement** - The system's own broad chunks search and catalog search features were used to explore related concepts and deepen understanding

### Benefits of Recursive Application

- **Practical Validation** - Using the tool to build itself validates its real-world utility
- **Design Consistency** - Pattern applications are grounded in authoritative sources from the knowledge base
- **Knowledge Discovery** - Semantic search revealed relevant patterns that might not have been immediately obvious
- **Documentation Trail** - Search results provided citations and context that informed implementation decisions

This recursive approach demonstrates the power of RAG (Retrieval-Augmented Generation) systems for software development: the ability to query a structured knowledge base to inform architectural decisions in real-time.

## Architecture & Design Patterns

### Domain-Driven Design (DDD)

**Book**: _Domain-Driven Design: Tackling Complexity in the Heart of Software_ by Eric Evans (2003)

**Concepts applied in this codebase:**
- **Repository Pattern** - Abstracts data access behind domain interfaces (see `src/domain/interfaces/repositories/`)
- **Domain Service** - Encapsulates business logic that doesn't naturally fit within entities (see `src/domain/services/`)
- **Domain Models** - Core business entities with rich behavior (see `src/domain/models/`)
- **Layered Architecture** - Separation of domain, application, and infrastructure concerns

**Files using these concepts:**
- `src/domain/interfaces/repositories/chunk-repository.ts`
- `src/domain/services/concept-search-service.ts`
- `src/application/container.ts`

### Clean Architecture / Hexagonal Architecture

**Books**: 
- _Clean Architecture: A Craftsman's Guide to Software Structure and Design_ by Robert C. Martin (2017)
- _Implementing Domain-Driven Design_ by Vaughn Vernon (2013) - Hexagonal Architecture (Ports & Adapters)

**Concepts applied in this codebase:**
- **Composition Root** - Single place where the object graph is constructed
- **Dependency Inversion** - Dependencies flow inward (Domain ← Application ← Infrastructure)
- **Ports and Adapters** - Domain interfaces (ports) with infrastructure implementations (adapters)
- **Interface Segregation** - Small, focused interfaces for each capability

**Files using these concepts:**
- `src/application/container.ts` - Composition Root implementation
- `src/infrastructure/lancedb/searchable-collection-adapter.ts` - Adapter pattern

### Design Patterns

**Book**: _Design Patterns: Elements of Reusable Object-Oriented Software_ by Gamma, Helm, Johnson, and Vlissides (Gang of Four, 1994)

**Concepts applied in this codebase:**
- **Strategy Pattern** - Interchangeable algorithms selected at runtime (see document loaders)
- **Adapter Pattern** - Wraps external libraries to provide consistent interfaces
- **Factory Pattern** - Creates objects without exposing instantiation logic

**Files using these concepts:**
- `src/infrastructure/document-loaders/document-loader.ts` - Strategy Pattern
- `src/infrastructure/document-loaders/pdf-loader.ts` - Adapter Pattern
- `src/infrastructure/lancedb/searchable-collection-adapter.ts` - Adapter Pattern

### Dependency Injection

**Books**:
- _Code That Fits in Your Head: Heuristics for Software Engineering_ by Mark Seemann (2021)
- _Introduction to Software Design and Architecture With TypeScript_ by Khalil Stemmler

**Concepts applied in this codebase:**
- **Constructor Injection** - Dependencies passed through constructors
- **Composition Root** - Single location for wiring dependencies
- **Manual DI** - Explicit dependency wiring without framework magic
- **Interface-based Dependencies** - Depend on abstractions, not concrete implementations

**Files using these concepts:**
- `src/application/container.ts` - Composition Root and DI orchestration

### Exception Design

**Book**: _Framework Design Guidelines: Conventions, Idioms, and Patterns for Reusable .NET Libraries_ by Krzysztof Cwalina and Brad Abrams (2008)

**Concepts applied in this codebase:**
- **Exception Hierarchy** - Base exceptions with specialized subtypes
- **Domain Exceptions** - Domain-specific errors with context
- **Structured Error Handling** - Consistent error propagation and handling

**Files using these concepts:**
- `src/domain/exceptions.ts` - Exception hierarchy implementation

## Testing Patterns

### Test-Driven Development (TDD)

**Books**:
- _Test Driven Development: By Example_ by Kent Beck (2002)
- _Test Driven Development for Embedded C_ by James W. Grenning (2011)

**Concepts applied in this codebase:**
- **Test Data Builder** - Factory functions for creating test data with sensible defaults
- **Arrange-Act-Assert** - Consistent test structure for readability
- **Test Fixtures** - Reusable test data and setup

**Files using these concepts:**
- `src/__tests__/test-helpers/test-data.ts` - Test Data Builder pattern
- `src/__tests__/integration/test-db-setup.ts` - Test Fixture pattern

### xUnit Test Patterns

**Book**: _xUnit Test Patterns: Refactoring Test Code_ by Gerard Meszaros (2007)

**Concepts applied in this codebase:**
- **Test Fixture** - Setup and teardown of test environment
- **Test Data Builder** - Readable test data construction
- **Integration Test Setup** - Isolated test database per suite

**Files using these concepts:**
- `src/__tests__/integration/test-db-setup.ts` - Test Fixture implementation

## Additional Resources

### TypeScript & Design Patterns
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)

### Software Architecture
- [The C4 Model for Software Architecture](https://c4model.com/)
- [Hexagonal Architecture (Ports & Adapters)](https://alistair.cockburn.us/hexagonal-architecture/)

### Domain-Driven Design Community
- [Domain-Driven Design Community](https://www.dddcommunity.org/)
- [DDD Reference by Eric Evans](https://www.domainlanguage.com/ddd/reference/)

## How to Use This Document

When reading code comments that reference design patterns (e.g., "Adapter Pattern", "Repository Pattern"), refer to this document for:
1. **Context** - Which book or methodology introduced the pattern
2. **Application** - How the pattern is applied in this codebase
3. **Further Reading** - Book references for deeper understanding

This approach keeps code comments focused on *what* and *why* specific to this codebase, while this document provides the broader context and references.

## Applying Concept-RAG to Your Own Development

Inspired by this project's recursive self-improvement, you can use concept-rag to inform your own software design:

1. **Index your library** - Load software design and architecture books into the concept-rag database
2. **Search during design** - Use `concept_search` to find patterns relevant to your current problem (e.g., "how to handle domain exceptions", "repository pattern implementation")
3. **Explore relationships** - Use `broad_chunks_search` to discover related concepts and deepen understanding
4. **Document sources** - Reference the books and concepts that informed your decisions (as done in this REFERENCES.md)

The knowledge base becomes a queryable design reference that augments your architectural decision-making process.

## Contributing

When introducing new patterns or architectural concepts:
1. Add the pattern name and brief description to code comments
2. Update this document with the book reference and concept details
3. List the files where the pattern is applied
4. Provide brief rationale for why the pattern was chosen

---

*Last Updated: November 2025*
