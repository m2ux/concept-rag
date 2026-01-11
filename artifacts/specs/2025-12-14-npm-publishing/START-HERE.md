# NPM Publishing Integration - Analysis

**Date:** 2025-12-14
**Status:** Analysis Complete
**Decision Required:** Go/No-Go

---

## Executive Summary

This document evaluates whether concept-rag should be published to npmjs.com, similar to how Playwright MCP uses `npx @playwright/mcp@latest` for seamless MCP client configuration.

### Recommendation: **Conditional Go**

NPM publishing would benefit the project, but requires addressing Python dependency complexity. A phased approach is recommended.

---

## Comparison: Playwright MCP vs Concept-RAG

| Aspect | Playwright MCP | Concept-RAG | Impact |
|--------|---------------|-------------|--------|
| **Dependencies** | Pure Node.js | Node.js + Python (NLTK/WordNet) | 🔴 High friction |
| **State** | Stateless (browser control) | Stateful (LanceDB database) | 🟡 Medium complexity |
| **Configuration** | CLI flags only | .env file + database path | 🟡 Medium complexity |
| **Setup Steps** | 1 (npx command) | 4+ (clone, build, pip, nltk download) | 🔴 High friction |
| **Runtime** | Spawns browser | Reads local database | 🟢 Similar pattern |

---

## Current State Analysis

### What's Already Configured

The project already has npm publishing scaffolding:

```json
{
  "name": "concept-rag",
  "bin": { "concept-rag": "dist/conceptual_index.js" },
  "files": [ "dist" ],
  "publishConfig": { "access": "public" }
}
```

### What's Missing

1. **GitHub Actions release workflow** - No automated publishing on version tag
2. **Python dependency handling** - Users must manually install NLTK/WordNet
3. **First-run experience** - No guidance when WordNet is missing
4. **Version management** - No CHANGELOG or release process

---

## Value Proposition

### Benefits of NPM Publishing

1. **Simplified MCP Configuration**
   ```json
   {
     "mcpServers": {
       "concept-rag": {
         "command": "npx",
         "args": ["concept-rag@latest", "/path/to/database"]
       }
     }
   }
   ```

2. **Version Pinning** - Users can lock to specific versions
3. **Discoverability** - npm search and npmjs.com listing
4. **Update Notifications** - npm outdated shows new versions
5. **Professional Appearance** - Standard distribution method

### Challenges

1. **Python Dependency**
   - WordNet requires Python + NLTK
   - Cannot be bundled in npm package
   - Requires separate installation step

2. **Onboarding Complexity**
   - Users still need: Python, NLTK, WordNet corpus
   - Database must be seeded before use
   - API keys required (.env configuration)

3. **Scope Name Decision**
   - `concept-rag` may conflict (check availability)
   - Scoped: `@m2ux/concept-rag` guaranteed unique
   - Current GitHub org: `m2ux`

---

## Proposed Approach

### Phase 1: Basic Publishing (Recommended Start)

Publish to npm with clear documentation about prerequisites.

**Changes:**
- Add GitHub Actions workflow for npm publish on version tags
- Add CHANGELOG.md
- Improve error messaging when WordNet missing
- Update README with npx installation option

**User Experience:**
```bash
# Prerequisites (documented in README)
pip install nltk
python -c "import nltk; nltk.download('wordnet')"

# Then use via npx
npx concept-rag ~/.concept_rag
```

### Phase 2: Enhanced Developer Experience (Future)

- Add `concept-rag init` command for guided setup
- Add `concept-rag check-deps` for prerequisite verification
- Consider optional WordNet (graceful degradation)

### Phase 3: Full Automation (Future, Optional)

- Investigate Node.js WordNet alternatives (en-wordnet, wordnet-db)
- Consider embedding WordNet data in package
- Trade-off: Package size vs installation simplicity

---

## NPM Namespace Availability

| Package Name | Availability | Recommendation |
|--------------|--------------|----------------|
| `concept-rag` | ✅ **Available** | Preferred |
| `@m2ux/concept-rag` | Available (scoped) | Fallback option |
| `conceptual-rag` | Unchecked | Alternative |

> **Verified 2025-12-14:** `npm view concept-rag` returns 404 - name is available for registration.

---

## Implementation Effort

| Component | Effort | Complexity |
|-----------|--------|------------|
| GitHub Actions publish workflow | 1-2h | Low |
| Pre-publish checklist | 30min | Low |
| README updates (npx usage) | 30min | Low |
| CHANGELOG creation | 30min | Low |
| Python dep error improvements | 1h | Medium |
| **Total Phase 1** | **3-4h** | Low-Medium |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Python dep confuses npm users | High | Medium | Clear docs, error messages |
| Package name taken | Low | Low | Use scoped name |
| Breaking changes affect users | Medium | High | Semantic versioning |
| Users skip prerequisites | High | Medium | Runtime checks with clear errors |

---

## Decision Matrix

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Do Nothing** | No effort | Miss distribution benefits | ❌ Not recommended |
| **Phase 1 Only** | Quick win, npx works | Users need Python steps | ✅ Recommended |
| **Full Automation** | Seamless like Playwright | High effort, package size | ⏳ Future consideration |

---

## Next Steps (If Approved)

1. Verify `concept-rag` package name availability
2. Implement Phase 1 per [01-work-package-plan.md](01-work-package-plan.md)
3. Publish initial version to npm
4. Update README with npx installation option
5. Gather user feedback on onboarding experience

---

**Decision Required:** Approve Phase 1 implementation?

**Estimated Effort:** 3-4 hours total






