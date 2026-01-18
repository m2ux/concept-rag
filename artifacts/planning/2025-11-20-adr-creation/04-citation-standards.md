# ADR Citation Standards

**Date:** 2025-11-20  
**Purpose:** Establish citation standards for traceable ADRs

## Citation Requirements

Every decision, fact, or claim in an ADR must be traceable to a source.

### 1. Inline Citations Format

**Format:** `[Source: file/location]` or `[Planning: folder/file]` or `[Code: path]`

**Examples:**
- `TypeScript 5.7 [Source: package.json]`
- `37 tests passing [Source: 2025-11-14-architecture-refactoring/PR-DESCRIPTION.md]`
- `Repository pattern implemented [Code: src/infrastructure/lancedb/*-repository.ts]`
- `80x-240x faster [Planning: 2025-11-14-architecture-refactoring/PR-DESCRIPTION.md, line 19]`

### 2. Source Types

**Planning Documents:**
```
[Planning: 2025-10-13-conceptual-search-implementation/README.md]
```

**Code Evidence:**
```
[Code: src/domain/interfaces/repositories/chunk-repository.ts]
```

**Package/Config:**
```
[Config: package.json, dependencies]
[Config: tsconfig.json, compilerOptions.strict]
```

**Documentation:**
```
[Docs: README.md, "Architecture" section]
```

**PR Descriptions:**
```
[PR: 2025-11-14-architecture-refactoring/PR-DESCRIPTION.md]
```

### 3. References Section Format

Each ADR must have a **References** section listing all sources:

```markdown
## References

### Planning Documents
- [2025-10-13-conceptual-search-implementation/README.md](.engineering/artifacts/planning/2025-10-13-conceptual-search-implementation/README.md)
- [2025-10-13-conceptual-search-implementation/IMPLEMENTATION_PLAN.md](.engineering/artifacts/planning/2025-10-13-conceptual-search-implementation/IMPLEMENTATION_PLAN.md)

### Code Evidence
- Hybrid search implementation: `src/lancedb/hybrid_search_client.ts`
- Repository pattern: `src/infrastructure/lancedb/*-repository.ts`

### Configuration
- Package dependencies: `package.json`
- TypeScript config: `tsconfig.json`

### Documentation
- README.md - Architecture section
- USAGE.md - Tool documentation

### Related ADRs
- [ADR-0001: TypeScript with Node.js](adr0001-typescript-nodejs-runtime.md)
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)
```

### 4. Confidence Level Attribution

```markdown
**Confidence Level:** HIGH
- 4 sources: Planning docs + PR description + Code + Tests
- Explicit decision documented in planning
- Metrics validated in PR description
- Implementation verified in code
```

### 5. Metrics with Citations

```markdown
**Performance Improvements:**
- Concept search: 8-12s → 50-100ms (80x-240x faster) [PR: architecture-refactoring/PR-DESCRIPTION.md, line 19]
- Memory usage: ~5GB → ~5MB (1000x reduction) [PR: architecture-refactoring/PR-DESCRIPTION.md, line 23]
- Algorithm: O(n) → O(log n) [Planning: architecture-refactoring/01-architecture-review-analysis.md, line 178-194]
```

### 6. Decision Attribution

```markdown
## Decision Drivers

* Need for testability [Planning: 2025-11-14-architecture-refactoring/01-architecture-review-analysis.md]
* Performance issues (O(n) scan) [Code analysis: src/tools/operations/concept_search.ts, line 178-194]
* Industry best practices [Knowledge Base: "Clean Architecture" by Robert C. Martin]
* SQL injection vulnerability [Planning: 2025-11-14-architecture-refactoring/01-architecture-review-analysis.md, Security section]
```

## Traceability Requirements

### Every ADR Must Have:

1. **Sources Header:** List of primary sources at top
2. **Inline Citations:** Key facts cited inline
3. **References Section:** Complete bibliography at end
4. **Confidence Attribution:** Why confidence level is assigned

### Verification Checklist:

- [ ] Every metric has source citation
- [ ] Every "before/after" comparison citable
- [ ] Every alternative option sourced (or marked as inferred)
- [ ] Every consequence statement traceable
- [ ] Implementation details reference actual code
- [ ] Cross-references to related ADRs included

## Examples of Good Traceability

### Example 1: Performance Metric
❌ **Poor:** "The system became much faster"
✅ **Good:** "Concept search improved from 8-12s to 50-100ms (80x-240x faster) [PR: 2025-11-14-architecture-refactoring/PR-DESCRIPTION.md, Table Row 2]"

### Example 2: Decision Rationale
❌ **Poor:** "We chose TypeScript for type safety"
✅ **Good:** "TypeScript chosen for type safety with complex data structures (vectors, concepts, search results) [Inferred from: tsconfig.json strict mode, src/domain/models/ type definitions]"

### Example 3: Alternative Options
❌ **Poor:** "We considered Python but rejected it"
✅ **Good:** "Python considered but rejected due to lack of MCP SDK at project inception [Source: @modelcontextprotocol/sdk package dependency in package.json, no Python equivalent available]"

## Update Plan for Existing ADRs

### Phase 0 ADRs (adr0001-0005)
- [x] Add inline citations for key facts
- [x] Add comprehensive References section
- [x] Enhance confidence level attribution

### Future ADRs
- [x] Include inline citations from start
- [x] Build References section as ADR is written
- [x] Cite every decision driver and consequence

## Source Priority

When multiple sources available, prioritize:
1. **Planning Documents** (explicit decisions)
2. **PR Descriptions** (validated outcomes)
3. **Code** (implementation proof)
4. **Documentation** (user-facing rationale)
5. **Inferred** (from code structure, mark clearly)

---

**Status:** Standards established, applying to all ADRs going forward


