# Architecture

## Repository Structure

| Directory | Contents |
|-----------|----------|
| `src/` | TypeScript source code |
| `src/application/` | Composition root, dependency injection |
| `src/domain/` | Domain models, services, interfaces |
| `src/infrastructure/` | Database adapters, search, embeddings, resilience |
| `src/concepts/` | Concept extraction, indexing, query expansion |
| `src/tools/` | MCP tool implementations (10 tools) |
| `src/wordnet/` | WordNet integration and strategies |
| `docs/` | MkDocs documentation site |
| `docs/architecture/` | 52 Architecture Decision Records |
| `scripts/` | Maintenance and diagnostic utilities |
| `prompts/` | LLM prompt templates |

---

## Architectural Decision Records (ADRs)

This directory contains all architectural decisions made during the development of concept-rag, from its fork from lance-mcp (2024) through December 2025. Each ADR documents the context, alternatives considered, decision made, and consequences.

### ADR Index

| # | Title | Date | Status |
|---|-------|------|--------|
| [ADR-0001](adr0001-typescript-nodejs-runtime.md) | TypeScript with Node.js Runtime | ~2024 | Accepted (Inherited) |
| [ADR-0002](adr0002-lancedb-vector-storage.md) | LanceDB for Vector Storage | ~2024 | Accepted (Inherited) |
| [ADR-0003](adr0003-mcp-protocol.md) | MCP Protocol for AI Agent Integration | ~2024 | Accepted (Inherited) |
| [ADR-0004](adr0004-rag-architecture.md) | RAG Architecture Approach | ~2024 | Accepted (Inherited) |
| [ADR-0005](adr0005-pdf-document-processing.md) | PDF Document Processing | ~2024 | Accepted (Inherited) |
| [ADR-0006](adr0006-hybrid-search-strategy.md) | Hybrid Search Strategy (Multi-Signal Ranking) | 2025-10-13 | Accepted |
| [ADR-0007](adr0007-concept-extraction-llm.md) | Concept Extraction with LLM (Claude Sonnet 4.5) | 2025-10-13 | Accepted |
| [ADR-0008](adr0008-wordnet-integration.md) | WordNet Integration for Semantic Enrichment | 2025-10-13 | Accepted |
| [ADR-0009](adr0009-three-table-architecture.md) | Three-Table Architecture (Catalog, Chunks, Concepts) | 2025-10-13 | Accepted |
| [ADR-0010](adr0010-query-expansion.md) | Query Expansion Strategy (Corpus + WordNet) | 2025-10-13 | Accepted |
| [ADR-0011](adr0011-multi-model-strategy.md) | Multi-Model Strategy (Claude + Grok) | 2025-10-13 | Accepted |
| [ADR-0012](adr0012-ocr-fallback-tesseract.md) | OCR Fallback with Tesseract | 2025-10-21 | Accepted |
| [ADR-0013](adr0013-incremental-seeding.md) | Incremental Seeding Strategy | 2025-11-12 | Accepted |
| [ADR-0014](adr0014-multi-pass-extraction.md) | Multi-Pass Extraction for Large Documents | 2025-11-12 | Accepted |
| [ADR-0015](adr0015-formal-concept-model.md) | Formal Concept Model Definition | 2025-11-13 | Accepted |
| [ADR-0016](adr0016-layered-architecture-refactoring.md) | Layered Architecture Refactoring | 2025-11-14 | Accepted |
| [ADR-0017](adr0017-repository-pattern.md) | Repository Pattern for Data Access | 2025-11-14 | Accepted |
| [ADR-0018](adr0018-dependency-injection-container.md) | Dependency Injection Container | 2025-11-14 | Accepted |
| [ADR-0019](adr0019-vitest-testing-framework.md) | Vitest as Testing Framework | 2025-11-14 | Accepted |
| [ADR-0020](adr0020-typescript-strict-mode.md) | TypeScript Strict Mode Enablement | 2025-11-14 | Accepted |
| [ADR-0021](adr0021-performance-optimization-vector-search.md) | Performance Optimization (O(n) to O(log n)) | 2025-11-14 | Accepted |
| [ADR-0022](adr0022-hybrid-search-service-extraction.md) | HybridSearchService Extraction | 2025-11-14 | Accepted |
| [ADR-0023](adr0023-sql-injection-prevention.md) | SQL Injection Prevention | 2025-11-14 | Accepted |
| [ADR-0024](adr0024-multi-provider-embeddings.md) | Multi-Provider Embedding Architecture | 2025-11-15 | Accepted |
| [ADR-0025](adr0025-document-loader-factory.md) | Document Loader Factory Pattern | 2025-11-15 | Accepted |
| [ADR-0026](adr0026-epub-format-support.md) | EPUB Format Support | 2025-11-15 | Accepted |
| [ADR-0027](adr0027-hash-based-integer-ids.md) | Hash-Based Integer IDs (FNV-1a) | 2025-11-19 | Accepted |
| [ADR-0028](adr0028-category-storage-strategy.md) | Category Storage Strategy | 2025-11-19 | Accepted |
| [ADR-0029](adr0029-category-search-tools.md) | Category Search Tools | 2025-11-19 | Accepted |
| [ADR-0030](adr0030-auto-extracted-categories.md) | 46 Auto-Extracted Categories | 2025-11-19 | Accepted |
| [ADR-0031](adr0031-eight-specialized-tools-strategy.md) | Eight Specialized Tools Strategy | 2025-11-19 | Accepted |
| [ADR-0032](adr0032-tool-selection-guide.md) | Tool Selection Guide for AI Agents | 2025-11-13 | Accepted |
| [ADR-0033](adr0033-basetool-abstraction.md) | BaseTool Abstraction Pattern | ~2024-2025 | Accepted |
| [ADR-0034](adr0034-comprehensive-error-handling.md) | Comprehensive Error Handling Infrastructure | 2025-11-22 | Accepted |
| [ADR-0035](adr0035-test-suite-expansion.md) | Test Suite Expansion (120 → 534 tests) | 2025-11-22 | Accepted |
| [ADR-0036](adr0036-configuration-centralization.md) | Configuration Centralization with Type Safety | 2025-11-22 | Accepted |
| [ADR-0037](adr0037-functional-validation-layer.md) | Functional Validation Layer Pattern | 2025-11-22 | Accepted |
| [ADR-0038](adr0038-dependency-rules-enforcement.md) | Architecture Dependency Rules Enforcement | 2025-11-22 | Accepted |
| [ADR-0039](adr0039-observability-infrastructure.md) | Observability Infrastructure | 2025-11-23 | Accepted |
| [ADR-0040](adr0040-result-option-types.md) | Result/Option Types for Functional Error Handling | 2025-11-23 | Accepted |
| [ADR-0041](adr0041-advanced-caching.md) | Multi-Level Caching Strategy (LRU + TTL) | 2025-11-24 | Accepted |
| [ADR-0042](adr0042-system-resilience-patterns.md) | System Resilience Patterns | 2025-11-25 | Accepted |
| [ADR-0043](adr0043-schema-normalization.md) | Schema Normalization | 2025-11-26 | Accepted |
| [ADR-0044](adr0044-seeding-script-modularization.md) | Seeding Script Modularization | 2025-12-03 | Accepted |
| [ADR-0045](adr0045-api-key-preflight-check.md) | API Key Preflight Check | 2025-12-05 | Accepted |
| [ADR-0046](adr0046-document-type-classification.md) | Document Type Classification | 2025-12-07 | Accepted |
| [ADR-0047](adr0047-architecture-review-dec-2025.md) | Architecture Review December 2025 | 2025-12-08 | Accepted |
| [ADR-0048](adr0048-stage-caching.md) | Stage Caching | 2025-12-10 | Accepted |
| [ADR-0049](adr0049-incremental-category-summaries.md) | Incremental Category Summaries | 2025-12-12 | Accepted |
| [ADR-0050](adr0050-mkdocs-material-documentation-site.md) | MkDocs Material Documentation Site | 2025-12-14 | Accepted |
| [ADR-0051](adr0051-api-documentation-consolidation.md) | API Documentation Separation of Concerns | 2025-12-14 | Accepted |
| [ADR-0052](adr0052-documentation-site-restructure.md) | Documentation Site Restructure | 2025-12-25 | Accepted |

---

### Using This Documentation

#### For Adding New ADRs

1. **Use the template:** Copy an existing ADR as a starting point
2. **Determine number:** Next sequential number (adr0053, adr0054, etc.)
3. **Include citations:** Every fact needs source reference
4. **Add to this index:** Update README.md with new ADR
5. **Cross-reference:** Link to related ADRs

#### For Updating ADRs

**ADRs are immutable** once accepted. To change a decision:

1. Create new ADR with new decision
2. Update old ADR status to "Superseded by ADR-XXXX"
3. Link between old and new ADRs

#### For Deprecating ADRs

If decision is reversed without replacement:

1. Change status to "Deprecated"
2. Add deprecation note explaining why
3. Keep content intact (historical record)
