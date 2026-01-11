# Work Package Plan: Improve Published Docs Site

## Problem Statement

The current MkDocs Material documentation site at m2ux.github.io/concept-rag is:
- Disorganized with flat ADR listing (50+ items)
- Contains duplicate content between index.md and README.md
- Uses ASCII art instead of visual diagrams
- Missing FAQ and Troubleshooting integration
- Lacks prominent Quick Start section

## Scope

### In Scope
- Reorganize navigation into collapsible sections
- Create Mermaid architecture diagram
- Add sequence diagram for document seeding workflow
- Add Repository Structure table to landing page
- Create unique landing page content
- Integrate FAQ.md and TROUBLESHOOTING.md into docs site

### Out of Scope
- Complete rewrite of ADR content
- Theme customization beyond MkDocs Material features
- New documentation for undocumented features

## Approach

### Phase 1: Navigation Restructure
- Update mkdocs.yml with collapsible section structure
- Configure Mermaid support
- Add per-page table of contents configuration

### Phase 2: Visual Diagrams
- Create Mermaid architecture flowchart
- Add document seeding sequence diagram
- Embed diagrams in appropriate pages

### Phase 3: Content Consolidation
- Create docs/getting-started.md with Quick Start
- Create docs/faq.md and docs/troubleshooting.md
- Rewrite docs/index.md as unique landing page
- Add Repository Structure table
- Add "How It Works" section

## Tasks

| # | Task | Estimate | Deliverables |
|---|------|----------|--------------|
| 1 | Update mkdocs.yml with new navigation structure and Mermaid support | 15 min | Updated mkdocs.yml |
| 2 | Create getting-started.md with Quick Start | 20 min | docs/getting-started.md |
| 3 | Create faq.md and troubleshooting.md | 15 min | docs/faq.md, docs/troubleshooting.md |
| 4 | Rewrite index.md with unique landing page | 30 min | Updated docs/index.md |
| 5 | Create Mermaid architecture diagram | 20 min | Diagram in index.md or architecture page |
| 6 | Create seeding workflow sequence diagram | 15 min | Diagram in getting-started.md |
| 7 | Validate build and mobile responsiveness | 15 min | Verified site |

**Total Estimated Effort:** ~2-2.5 hours agentic + 30 min review

## Success Criteria

- [ ] Navigation has collapsible sections matching Nudges-style
- [ ] At least 2 Mermaid diagrams render correctly
- [ ] Repository Structure table on landing page
- [ ] No duplicate content between pages
- [ ] FAQ and Troubleshooting accessible from docs site
- [ ] `mkdocs build` succeeds without errors
- [ ] Mobile-responsive layout verified

## References

- Target reference: [docs.nudges.dev](https://docs.nudges.dev)
- Current site: [m2ux.github.io/concept-rag](https://m2ux.github.io/concept-rag)
- GitHub Issue: [#50](https://github.com/m2ux/concept-rag/issues/50)






