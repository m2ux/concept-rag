# ADR-0052: Documentation Site Restructure

## Status

Accepted

## Date

2025-12-25

## Context

The current MkDocs Material documentation site at m2ux.github.io/concept-rag has several usability issues:

1. **Flat navigation**: The ADR listing contains 50+ items without hierarchical grouping, making it overwhelming to navigate
2. **Duplicate content**: The index.md page largely duplicates README.md content rather than providing a unique landing experience
3. **ASCII diagrams**: Architecture diagrams use text-based ASCII art instead of rendered visual diagrams
4. **Missing integration**: FAQ.md and TROUBLESHOOTING.md exist in the repository root but aren't accessible from the documentation site
5. **Limited visual hierarchy**: Lack of collapsible sections and visual workflow diagrams

Reference sites like docs.nudges.dev demonstrate better patterns with:
- Collapsible navigation sections
- Mermaid-rendered diagrams
- Repository structure tables
- Prominent Quick Start sections
- Per-page table of contents

## Decision

We will restructure the documentation site with the following changes:

### 1. Navigation Hierarchy

Reorganize `mkdocs.yml` navigation into collapsible sections:
- **Home** - Unique landing page
- **Getting Started** - Quick Start with numbered steps
- **Usage Guide** - FAQ, Troubleshooting, Examples
- **API Reference** - MCP tool documentation
- **Architecture** - Overview with Mermaid diagrams
- **ADRs** - Grouped by development phase
- **Contributing** - Contribution guidelines

### 2. Mermaid Diagram Support

Enable Mermaid rendering via `pymdownx.superfences` configuration:
- Architecture flowchart showing document processing pipeline
- Sequence diagram for document seeding workflow
- Replace ASCII art with rendered diagrams

### 3. Content Consolidation

- Create unique landing page with Repository Structure table
- Add "How It Works" visual explanation
- Integrate FAQ.md and TROUBLESHOOTING.md into docs site
- Create dedicated getting-started.md with Quick Start

### 4. Per-Page Navigation

Configure table of contents for right-side per-page navigation on all pages.

## Consequences

### Positive

- **Better discoverability**: Collapsible sections make finding content easier
- **Visual clarity**: Mermaid diagrams communicate architecture more effectively than ASCII art
- **Reduced duplication**: Unique landing page eliminates README.md copying
- **Complete documentation**: FAQ and Troubleshooting now accessible from docs site
- **Professional appearance**: Matches quality of reference documentation sites

### Negative

- **Maintenance overhead**: More structured navigation requires updating mkdocs.yml when adding new pages
- **Build dependency**: Mermaid rendering requires JavaScript (handled by MkDocs Material)

### Neutral

- FAQ.md and TROUBLESHOOTING.md in root remain for GitHub browsing; docs versions are the canonical references

## References

- [GitHub Issue #50](https://github.com/m2ux/concept-rag/issues/50)
- [MkDocs Material - Setting up navigation](https://squidfunk.github.io/mkdocs-material/setup/setting-up-navigation/)
- [MkDocs Material - Diagrams](https://squidfunk.github.io/mkdocs-material/reference/diagrams/)
- Reference implementation: [docs.nudges.dev](https://docs.nudges.dev)

