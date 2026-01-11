# MkDocs Material Documentation Site - Implementation Plan

**Date:** 2025-12-14
**Priority:** HIGH
**Status:** Ready
**Estimated Effort:** 1-2h agentic + 30min review

---

## Overview

### Problem Statement

The concept-rag project has extensive documentation (49 ADRs, API reference, guides) but it's only viewable on GitHub or locally. A documentation site would provide searchable, navigable access to this content.

### Scope

**In Scope:**
- `mkdocs.yml` configuration at project root
- `docs/index.md` homepage
- GitHub Actions workflow for automated deployment
- npm scripts for local development (`docs:serve`, `docs:build`)
- Python dependencies in `requirements.txt`

**Out of Scope:**
- Custom branding/colors (using Material defaults)
- Migrating root-level markdown files (README, SETUP, etc.)
- Custom plugins or extensions
- Search optimization
- Multi-language support

---

## Current Implementation Analysis

### Implementation Review

**Current State:**
- `docs/` folder exists with 55+ markdown files
- 49 ADRs in `docs/architecture/` with comprehensive README index
- No static site generator configured
- `.gitignore` already includes `/site` (MkDocs output)

**Integration Points:**
- npm scripts in `package.json` for development workflows
- Python dependencies in `requirements.txt`
- Existing GitHub Actions in `.github/workflows/ci.yml`

### Baseline Metrics

| Metric | Current Value |
|--------|--------------|
| Documentation files | 55+ markdown |
| Site generator | None |
| Deployment automation | None |

---

## Knowledge Base Insights

*Discovered via concept-rag MCP research*

### Relevant Concepts

- **Docs Like Code:** Treat documentation as code with automated builds
- **Static Site Generators:** Generate web output from markdown source files
- **Navigational Landing Pages:** Each content section needs a landing page

### Applicable Design Patterns

| Pattern | Source | How It Applies |
|---------|--------|----------------|
| Docs Like Code | Anne Gentle | Markdown → static site generator → published output |
| Navigational Landing Pages | Software Architecture | `docs/architecture/README.md` pattern |
| Automated Builds | Docs Like Code | GitHub Actions deploys on push |

---

## Proposed Approach

### Solution Design

1. Add `mkdocs.yml` at project root pointing to existing `docs/` folder
2. Create `docs/index.md` as the homepage
3. Configure MkDocs Material theme with sensible defaults
4. Add GitHub Actions workflow for automated deployment to GitHub Pages
5. Add npm scripts for local development workflow

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| MkDocs Material | Modern, searchable, GitHub Pages native | Requires Python | **Selected** |
| Docusaurus | React-based, modern | Different stack, overkill | Rejected |
| GitHub Wiki | Zero setup | No theming, limited navigation | Rejected |

---

## Implementation Tasks

### Task 1: Create mkdocs.yml (10-15 min)

**Goal:** Configure MkDocs Material with site metadata and navigation

**Deliverables:**
- `mkdocs.yml` at project root

**Configuration:**
- Site name: "Concept-RAG Documentation"
- Theme: Material with default colors
- Navigation: Home, API Reference, Architecture (ADRs), Database Schema

---

### Task 2: Create docs/index.md (10-15 min)

**Goal:** Create homepage with project overview and navigation

**Deliverables:**
- `docs/index.md`

**Content:**
- Project description (from README)
- Quick links to key sections
- Brief feature overview

---

### Task 3: Create GitHub Actions workflow (15-20 min)

**Goal:** Automate documentation deployment to GitHub Pages

**Deliverables:**
- `.github/workflows/docs.yml`

**Configuration:**
- Trigger: push to main branch (paths: docs/**, mkdocs.yml)
- Deploy using `mkdocs gh-deploy --force`

---

### Task 4: Update package.json (5-10 min)

**Goal:** Add npm scripts for local documentation development

**Deliverables:**
- Modified `package.json`

**Scripts to add:**
- `docs:serve` - Run local development server
- `docs:build` - Build static site

---

### Task 5: Update requirements.txt (5 min)

**Goal:** Add MkDocs Material as Python dependency

**Deliverables:**
- Modified `requirements.txt`

**Dependencies:**
- `mkdocs-material>=9.0`

---

### Task 6: Local validation (15-20 min)

**Goal:** Verify site builds and serves correctly

**Validation steps:**
- Install dependencies: `pip install -r requirements.txt`
- Run: `mkdocs serve`
- Verify homepage loads
- Verify navigation works
- Verify ADRs accessible
- Run: `mkdocs build`
- Verify `/site` directory created

---

## Success Criteria

### Functional Requirements

- [ ] `mkdocs serve` runs without errors
- [ ] `mkdocs build` generates `/site` directory
- [ ] Homepage renders correctly
- [ ] Navigation includes all key sections
- [ ] All existing docs accessible

### Quality Requirements

- [ ] No broken links in navigation
- [ ] GitHub Actions workflow valid YAML
- [ ] npm scripts execute correctly

---

## Testing Strategy

### Manual Testing

- Run `mkdocs serve` and browse site locally
- Verify each navigation item loads
- Spot-check ADR pages render correctly

### CI Validation

- GitHub Actions workflow syntax check
- Build verification on push

---

## Dependencies & Risks

### Requires (Blockers)

- [ ] None - all prerequisites met

### Risks

- **Risk:** Existing markdown may have formatting issues | **Mitigation:** This is out of scope; document issues for future fix
- **Risk:** Large number of ADRs may slow navigation | **Mitigation:** Use MkDocs built-in navigation; optimize later if needed

---

**Status:** Ready for implementation






