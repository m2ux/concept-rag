# GitHub Actions CI Workflow - Implementation Plan

**Date:** 2025-12-09
**Priority:** HIGH
**Status:** Ready
**Estimated Effort:** 1-2h agentic + 30m review

---

## Overview

### Problem Statement

The concept-rag project lacks automated CI/CD workflows. Without automated validation:
- Broken code can be merged into main
- Contributors must manually run all tests locally
- No build verification happens automatically
- PR reviews lack automated quality checks

### Scope

**In Scope:**
- Primary CI workflow for PRs and main branch pushes
- Build verification (TypeScript compilation)
- Running unit, integration, and e2e tests
- npm dependency caching
- Python/NLTK setup for WordNet
- Node.js version pinning via `.nvmrc`

**Out of Scope:**
- Continuous deployment (CD) workflows
- Release automation / npm publishing
- Code coverage threshold enforcement
- External notifications (Slack, etc.)

---

## Current Implementation Analysis

### Implementation Review

**Current Usage:** No CI workflows. All testing is manual via local commands.

**Architecture:**
- Test framework: Vitest
- Test categories: Unit, Integration, E2E
- Dependencies: Node.js 22.x, Python 3 with NLTK

### Baseline Metrics

| Metric | Current Value |
|--------|---------------|
| CI Workflows | 0 |
| Automated PR validation | None |
| Node.js version enforcement | None |

### Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| No CI workflow | Broken code can be merged | HIGH |
| No build verification | TypeScript errors unnoticed | HIGH |
| No Node.js version file | Inconsistent environments | LOW |

---

## Knowledge Base Insights

*Discovered via concept-rag MCP research*

### Relevant Concepts

- **GitHub Actions:** Native CI/CD system with YAML workflow definitions
- **Event-driven triggers:** `push` and `pull_request` events
- **Dependency caching:** Built-in npm caching via `actions/setup-node`

### Applicable Design Patterns

| Pattern | Source | How It Applies |
|---------|--------|----------------|
| Event-driven triggers | Learning GitHub Actions | Use `on: push` and `on: pull_request` |
| Caching strategy | Mastering GitHub Actions | Cache npm dependencies |
| Concurrency control | GitHub Actions docs | Cancel superseded runs |

### Best Practices

1. **Pin action versions:** Use `@v4` for reproducibility
2. **Cache dependencies:** Use built-in npm caching
3. **Clear job naming:** Descriptive names for Actions UI
4. **Fail fast:** Exit quickly on errors

---

## Proposed Approach

### Solution Design

Create a single CI workflow with two sequential jobs:
1. **Build job:** TypeScript compilation verification
2. **Test job:** Run all tests (unit + integration + e2e)

The workflow triggers on:
- Push to `main` branch
- All pull requests

Additional files:
- `.nvmrc` to pin Node.js version

### Workflow Structure

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: ['*']

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    # TypeScript compilation
    
  test:
    needs: build
    # Run all tests
```

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Single workflow, sequential | Simple, clear | Tests wait for build | **Selected** |
| Parallel test jobs | Faster | Complex, more CI minutes | Rejected |
| Node version matrix | Multi-version testing | Not needed | Rejected |

---

## Implementation Tasks

### Task 1: Create .nvmrc file (5 min)

**Goal:** Pin Node.js version for consistency across dev and CI.

**Deliverables:**
- `.nvmrc` file with `22` (Node.js 22.x LTS)

**Details:**
```
22
```

### Task 2: Create CI workflow (30-45 min)

**Goal:** Implement comprehensive CI workflow.

**Deliverables:**
- `.github/workflows/ci.yml`

**Workflow Features:**
1. **Triggers:** Push to main, all PRs
2. **Concurrency:** Cancel superseded runs
3. **Build job:**
   - Checkout code
   - Setup Node.js with npm caching
   - Install dependencies
   - Run TypeScript build
4. **Test job:**
   - Depends on build job
   - Setup Node.js with npm caching
   - Setup Python with pip caching
   - Install npm dependencies
   - Install NLTK/WordNet
   - Run all tests via `npm test`

---

## Success Criteria

### Functional Requirements

- [ ] Workflow triggers on push to main
- [ ] Workflow triggers on all pull requests
- [ ] Build job runs TypeScript compilation
- [ ] Test job runs all tests (unit, integration, e2e)
- [ ] Superseded workflow runs are cancelled

### Performance Targets

- [ ] CI completes in under 10 minutes with caching
- [ ] npm dependencies are cached between runs
- [ ] Python packages are cached between runs

### Quality Requirements

- [ ] All existing tests pass in CI
- [ ] Workflow uses pinned action versions
- [ ] Clear job and step naming

### Measurement Strategy

**How will we validate improvements?**
- GitHub Actions run history shows pass/fail status
- Run duration visible in Actions UI
- Cache hit rates shown in logs

---

## Testing Strategy

### Validation Approach

1. Create PR with the new workflow files
2. Verify workflow triggers on the PR
3. Confirm all tests pass
4. Check caching is working (second run faster)

---

## Dependencies & Risks

### Requires (Blockers)

- None - this is new infrastructure

### Risks

- **Risk:** E2E tests timeout in CI
  - **Mitigation:** Vitest config already has 10s timeout; monitor and adjust if needed
  
- **Risk:** NLTK download fails in CI
  - **Mitigation:** Use pip install with explicit packages; cache Python deps

---

**Status:** Ready for implementation















