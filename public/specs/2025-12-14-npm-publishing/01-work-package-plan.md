# NPM Publishing - Implementation Plan

**Date:** 2025-12-14
**Priority:** MEDIUM
**Status:** Ready (pending approval)
**Estimated Effort:** 3-4h agentic + 30min review

---

## Overview

### Problem Statement

Concept-rag currently requires git clone + npm install + npm run build for installation. Publishing to npm enables `npx concept-rag` usage, aligning with modern MCP server distribution patterns (like Playwright MCP).

### Scope

**In Scope:**
- GitHub Actions workflow for npm publishing
- CHANGELOG.md for version tracking
- Pre-publish validation script
- README updates with npx usage
- Enhanced error messaging for missing Python dependencies

**Out of Scope:**
- Bundling Python/WordNet (Phase 2/3)
- Automated WordNet installation
- Major package.json restructuring
- Scoped package name migration

---

## Current Implementation Analysis

### Package.json Review

```json
{
  "name": "concept-rag",
  "version": "1.0.0",
  "bin": { "concept-rag": "dist/conceptual_index.js" },
  "files": [ "dist" ],
  "publishConfig": { "access": "public" }
}
```

**Status:** Already configured for publishing.

### Missing Components

| Component | Status | Required For |
|-----------|--------|--------------|
| GitHub Actions publish workflow | ❌ Missing | Automated releases |
| CHANGELOG.md | ❌ Missing | Version documentation |
| npm publish dry-run verification | ❌ Missing | Pre-flight checks |
| npx usage documentation | ❌ Missing | User onboarding |

---

## Implementation Tasks

### Task 1: Verify Package Name Availability (5 min)

**Goal:** Confirm `concept-rag` is available on npm registry

**Command:**
```bash
npm view concept-rag
```

**Expected:** 404 (package not found) = available

**Fallback:** Use `@m2ux/concept-rag` (scoped)

---

### Task 2: Create GitHub Actions Publish Workflow (30-45 min)

**Goal:** Automate npm publishing on version tags

**Deliverables:**
- `.github/workflows/publish.yml`

**Workflow Triggers:**
- Push tag matching `v*` (e.g., `v1.0.0`, `v1.1.0`)

**Workflow Steps:**
1. Checkout code
2. Setup Node.js with npm registry
3. Install dependencies
4. Run tests
5. Build
6. Publish to npm

**Template:**

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  id-token: write  # For npm provenance

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install npm dependencies
        run: npm ci

      - name: Install Python dependencies
        run: |
          pip install -r requirements.txt
          python -c "import nltk; nltk.download('wordnet', quiet=True); nltk.download('omw-1.4', quiet=True)"

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Required Secret:**
- `NPM_TOKEN` - npm access token with publish permissions

---

### Task 3: Create CHANGELOG.md (15-20 min)

**Goal:** Document version history for release notes

**Deliverables:**
- `CHANGELOG.md` at project root

**Format:** Keep a Changelog (keepachangelog.com)

**Initial Content:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### Added
- Initial npm release
- 10 MCP tools for document search and concept analysis
- Hybrid search with 4-signal scoring (Vector + BM25 + Concepts + WordNet)
- PDF and EPUB document support with OCR fallback
- Parallel concept extraction (up to 25 documents concurrently)
- Resumable seeding with checkpoint-based recovery
- System resilience patterns (circuit breaker, bulkhead, timeout)
- Normalized 4-table database schema (v7)

### Prerequisites
- Node.js 18+
- Python 3.9+ with NLTK
- OpenRouter API key
```

---

### Task 4: Add Pre-Publish Script (15-20 min)

**Goal:** Verify package contents before publishing

**Deliverables:**
- `scripts/prepublish-check.ts`
- Update `package.json` scripts

**Checks:**
1. dist/ directory exists
2. dist/conceptual_index.js exists and is executable
3. No sensitive files (.env, .ai/) in package
4. Version matches CHANGELOG

**Package.json Addition:**
```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test && npm pack --dry-run"
  }
}
```

---

### Task 5: Update README with npx Usage (15-20 min)

**Goal:** Document npx installation as primary method

**Section to Add (after Quick Start heading):**

```markdown
### Installation via npx (Recommended)

**Prerequisites:**
```bash
# Install WordNet (one-time setup)
pip install nltk
python -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
```

**MCP Client Configuration:**

Cursor (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "concept-rag": {
      "command": "npx",
      "args": ["concept-rag@latest", "/path/to/database"],
      "env": {
        "OPENROUTER_API_KEY": "your-key-here"
      }
    }
  }
}
```

**Note:** Database must be seeded before use. See [Seed Your Documents](#seed-your-documents).
```

---

### Task 6: Enhance Python Dependency Error Messages (30-45 min)

**Goal:** Provide clear guidance when WordNet is missing

**File:** `src/wordnet/client.ts` (or equivalent)

**Enhancement:**
- Check for Python/NLTK availability at startup
- Log clear error with installation instructions
- Continue with degraded mode (no synonym expansion)

**Example Error Message:**
```
⚠️  WordNet not available. Synonym expansion disabled.

To enable WordNet features, install the prerequisites:
  pip install nltk
  python -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

The server will continue with reduced functionality.
```

---

### Task 7: Dry-Run Verification (15-20 min)

**Goal:** Verify package contents before first publish

**Commands:**
```bash
# Check what will be published
npm pack --dry-run

# Expected output:
# - dist/conceptual_index.js
# - dist/**/*.js
# - package.json
# - README.md
# - LICENSE
```

**Verify:**
- [ ] No .env files included
- [ ] No .ai/ directory included
- [ ] No node_modules/ included
- [ ] dist/ contains all built files
- [ ] Package size reasonable (<5MB)

---

### Task 8: Initial npm Publish (10 min)

**Goal:** Publish first version to npm

**Prerequisites:**
- npm account with publish permissions
- `npm login` completed
- NPM_TOKEN secret added to GitHub repo

**Manual First Publish:**
```bash
# Verify logged in
npm whoami

# Publish (first time, manual)
npm publish --access public
```

**Subsequent Releases:**
1. Update version in package.json
2. Update CHANGELOG.md
3. Commit: `git commit -m "chore: release v1.x.x"`
4. Tag: `git tag v1.x.x`
5. Push: `git push && git push --tags`
6. GitHub Actions publishes automatically

---

## Success Criteria

### Functional Requirements

- [ ] `npm view concept-rag` returns package info
- [ ] `npx concept-rag --help` works
- [ ] `npx concept-rag /path/to/db` starts server
- [ ] GitHub Actions workflow publishes on tags

### Quality Requirements

- [ ] Package size <5MB
- [ ] No sensitive files in published package
- [ ] Clear error when WordNet missing
- [ ] CHANGELOG documents all versions

---

## Testing Strategy

### Pre-Publish Verification

```bash
# 1. Dry run
npm pack --dry-run

# 2. Local test
npm pack
npm install -g ./concept-rag-1.0.0.tgz
concept-rag --help
npm uninstall -g concept-rag
```

### Post-Publish Verification

```bash
# 1. Install from npm
npx concept-rag@latest --help

# 2. Test MCP configuration
# Add to ~/.cursor/mcp.json and verify in Cursor
```

---

## Dependencies & Risks

### Prerequisites

- [ ] npm account created
- [ ] NPM_TOKEN secret added to GitHub repository
- [ ] Package name `concept-rag` verified available

### Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Package name taken | Low | Use scoped @m2ux/concept-rag |
| Token exposure | Low | Use GitHub secrets only |
| Breaking changes | Medium | Semantic versioning + CHANGELOG |

---

## Release Process (Ongoing)

### Version Bump Workflow

1. Make changes
2. Update `package.json` version
3. Update `CHANGELOG.md` with changes
4. Commit: `git commit -m "chore: release vX.Y.Z"`
5. Tag: `git tag vX.Y.Z`
6. Push: `git push && git push --tags`
7. GitHub Actions publishes to npm

### Semantic Versioning Guide

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking change | Major (X.0.0) | Remove tool, change API |
| New feature | Minor (0.X.0) | Add tool, add parameter |
| Bug fix | Patch (0.0.X) | Fix search, fix error |

---

**Status:** Ready for implementation (pending approval in START-HERE.md)






