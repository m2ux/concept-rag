# Architectural Decision Records (ADRs)
## Overview

This directory contains all architectural decisions made during the development of concept-rag, from its fork from lance-mcp (2024) through November 2025. Each ADR documents the context, alternatives considered, decision made, and consequences.

## ADR Index

### Phase 0: Inherited Foundation (2024 - lance-mcp upstream)

**Status:** Inherited from upstream lance-mcp project by adiom-data

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0001](adr0001-typescript-nodejs-runtime.md) | TypeScript with Node.js Runtime | ~2024 | Accepted (Inherited) |
| [adr0002](adr0002-lancedb-vector-storage.md) | LanceDB for Vector Storage | ~2024 | Accepted (Inherited) |
| [adr0003](adr0003-mcp-protocol.md) | MCP Protocol for AI Agent Integration | ~2024 | Accepted (Inherited) |
| [adr0004](adr0004-rag-architecture.md) | RAG Architecture Approach | ~2024 | Accepted (Inherited) |
| [adr0005](adr0005-pdf-document-processing.md) | PDF Document Processing | ~2024 | Accepted (Inherited) |

**Inherited Features:** TypeScript/Node.js stack, LanceDB integration, MCP protocol support, basic RAG architecture, PDF processing with pdf-parse

---

### Phase 1: Conceptual Search Transformation (October 13, 2025)

**Major Enhancement:** Transformed from simple vector search to sophisticated conceptual search system

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0006](adr0006-hybrid-search-strategy.md) | Hybrid Search Strategy (Multi-Signal Ranking) | 2025-10-13 | Accepted |
| [adr0007](adr0007-concept-extraction-llm.md) | Concept Extraction with LLM (Claude Sonnet 4.5) | 2025-10-13 | Accepted |
| [adr0008](adr0008-wordnet-integration.md) | WordNet Integration for Semantic Enrichment | 2025-10-13 | Accepted |
| [adr0009](adr0009-three-table-architecture.md) | Three-Table Architecture (Catalog, Chunks, Concepts) | 2025-10-13 | Accepted |
| [adr0010](adr0010-query-expansion.md) | Query Expansion Strategy (Corpus + WordNet) | 2025-10-13 | Accepted |
| [adr0011](adr0011-multi-model-strategy.md) | Multi-Model Strategy (Claude + Grok) | 2025-10-13 | Accepted |

**Key Improvements:** 5-signal hybrid search, concept extraction pipeline, WordNet integration, 3-table architecture, 4x better synonym matching, 2x better concept matching

---

### Phase 2: Robustness Enhancement (October 21, 2025)

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0012](adr0012-ocr-fallback-tesseract.md) | OCR Fallback with Tesseract | 2025-10-21 | Accepted |

**Achievement:** 95% document processing success rate with OCR fallback

---

### Phase 3: Search Refinement (November 12-13, 2025)

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0013](adr0013-incremental-seeding.md) | Incremental Seeding Strategy | 2025-11-12 | Accepted |
| [adr0014](adr0014-multi-pass-extraction.md) | Multi-Pass Extraction for Large Documents | 2025-11-12 | Accepted |
| [adr0015](adr0015-formal-concept-model.md) | Formal Concept Model Definition | 2025-11-13 | Accepted |

**Key Features:** Smart gap detection, large document support (>100k tokens), formal concept definition

---

### Phase 4: Architecture Refactoring (November 14, 2025)

**Major Refactoring:** Clean Architecture with Domain/Infrastructure/Application layers

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0016](adr0016-layered-architecture-refactoring.md) | Layered Architecture Refactoring | 2025-11-14 | Accepted |
| [adr0017](adr0017-repository-pattern.md) | Repository Pattern for Data Access | 2025-11-14 | Accepted |
| [adr0018](adr0018-dependency-injection-container.md) | Dependency Injection Container | 2025-11-14 | Accepted |
| [adr0019](adr0019-vitest-testing-framework.md) | Vitest as Testing Framework | 2025-11-14 | Accepted |
| [adr0020](adr0020-typescript-strict-mode.md) | TypeScript Strict Mode Enablement | 2025-11-14 | Accepted |
| [adr0021](adr0021-performance-optimization-vector-search.md) | Performance Optimization (O(n) to O(log n)) | 2025-11-14 | Accepted |
| [adr0022](adr0022-hybrid-search-service-extraction.md) | HybridSearchService Extraction | 2025-11-14 | Accepted |
| [adr0023](adr0023-sql-injection-prevention.md) | SQL Injection Prevention | 2025-11-14 | Accepted |

**Achievements:** 80x-240x faster searches, 1000x less memory, 37 tests added (100% passing), SQL injection fixed, zero breaking changes

---

### Phase 5: Multi-Provider & Format Support (November 15, 2025)

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0024](adr0024-multi-provider-embeddings.md) | Multi-Provider Embedding Architecture | 2025-11-15 | Accepted |
| [adr0025](adr0025-document-loader-factory.md) | Document Loader Factory Pattern | 2025-11-15 | Accepted |
| [adr0026](adr0026-epub-format-support.md) | EPUB Format Support | 2025-11-15 | Accepted |

**Expanded Capabilities:** Multiple embedding providers (OpenAI, Voyage, Ollama), EPUB ebook support, extensible document loading

---

### Phase 6: Category System & Optimization (November 19, 2025)

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0027](adr0027-hash-based-integer-ids.md) | Hash-Based Integer IDs (FNV-1a) | 2025-11-19 | Accepted |
| [adr0028](adr0028-category-storage-strategy.md) | Category Storage Strategy (Categories on Documents) | 2025-11-19 | Accepted |
| [adr0029](adr0029-category-search-tools.md) | Category Search Tools (Three New MCP Tools) | 2025-11-19 | Accepted |
| [adr0030](adr0030-auto-extracted-categories.md) | 46 Auto-Extracted Categories | 2025-11-19 | Accepted |

**Major Optimization:** 54% storage reduction (699 MB → 324 MB), 46 categories discovered, 3 new browsing tools

---

### Phase 7: Tool Architecture (Various dates)

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0031](adr0031-eight-specialized-tools-strategy.md) | Eight Specialized Tools Strategy | 2025-10-13 to 2025-11-19 | Accepted |
| [adr0032](adr0032-tool-selection-guide.md) | Tool Selection Guide for AI Agents | 2025-11-13 | Accepted |
| [adr0033](adr0033-basetool-abstraction.md) | BaseTool Abstraction Pattern | ~2024-2025 | Accepted (Inherited & Enhanced) |

**Tool Ecosystem:** 2 tools → 5 tools → 8 tools → 10 tools; selection guide + API reference with full JSON I/O schemas

---

### Phase 8: Infrastructure Maturity (November 22, 2025)

**Major Improvements:** Comprehensive error handling, test suite expansion, configuration management, validation patterns

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0034](adr0034-comprehensive-error-handling.md) | Comprehensive Error Handling Infrastructure | 2025-11-22 | Accepted |
| [adr0035](adr0035-test-suite-expansion.md) | Test Suite Expansion (120 → 534 tests) | 2025-11-22 | Accepted |
| [adr0036](adr0036-configuration-centralization.md) | Configuration Centralization with Type Safety | 2025-11-22 | Accepted |
| [adr0037](adr0037-functional-validation-layer.md) | Functional Validation Layer Pattern | 2025-11-22 | Accepted |
| [adr0038](adr0038-dependency-rules-enforcement.md) | Architecture Dependency Rules Enforcement | 2025-11-22 | Accepted |

**Key Achievements:** 26 error types, 534 tests (345% increase), type-safe configuration, functional validation, automated architecture enforcement

---

### Phase 9: Observability & Functional Patterns (November 23-24, 2025)

**Major Enhancements:** Observability infrastructure, functional error handling, performance caching

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0039](adr0039-observability-infrastructure.md) | Observability Infrastructure (Structured Logging & Instrumentation) | 2025-11-23 | Accepted |
| [adr0040](adr0040-result-option-types.md) | Result/Option Types for Functional Error Handling | 2025-11-23 | Accepted |
| [adr0041](adr0041-advanced-caching.md) | Multi-Level Caching Strategy (LRU + TTL) | 2025-11-24 | Accepted |

**Key Achievements:** Structured JSON logging with trace IDs, 218 new tests for functional types, LRU caching (40-60% latency reduction), 17 railway-oriented programming utilities, bounded memory usage (~130MB max)

---

### Phase 10: Documentation Infrastructure (December 2025)

**Enhancement:** Documentation site with automated deployment, API documentation separation of concerns

| # | Title | Date | Status |
|---|-------|------|--------|
| [adr0050](adr0050-mkdocs-material-documentation-site.md) | MkDocs Material Documentation Site | 2025-12-14 | Accepted |
| [adr0051](adr0051-api-documentation-consolidation.md) | API Documentation Separation of Concerns | 2025-12-14 | Accepted |

**Features:** MkDocs Material static site, GitHub Pages deployment, pure API schema reference + pure usage guidance separation

---

## Using This Documentation

### For Adding New ADRs

1. **Use the template:** [template.md](../../.ai/architecture/template.md)
2. **Determine number:** Next sequential number (adr0034, adr0035, etc.)
3. **Include citations:** Every fact needs source reference
4. **Add to this index:** Update README.md with new ADR
5. **Cross-reference:** Link to related ADRs

### For Updating ADRs

**ADRs are immutable** once accepted. To change a decision:
1. Create new ADR with new decision
2. Update old ADR status to "Superseded by ADR-XXXX"
3. Link between old and new ADRs

### For Deprecating ADRs

If decision is reversed without replacement:
1. Change status to "Deprecated"
2. Add deprecation note explaining why
3. Keep content intact (historical record)

---



