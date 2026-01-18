# ADR Execution Plan with Enhanced Citations

**Date:** 2025-11-20  
**Updated:** With citation requirements

## Execution Strategy

### Phase A: Generate Remaining ADRs with Citations (Priority)
Generate adr0006-0033+ with inline citations and References sections from the start.

### Phase B: Enhance Existing ADRs (After completion)
Add inline citations to adr0001-0005 in focused pass.

## Citation Enhancement Checklist

### Existing ADRs Needing Enhancement (5)

**adr0001 - TypeScript with Node.js**
- [ ] Add inline citations for TypeScript 5.7 [Source: package.json]
- [ ] Add inline citations for Node.js 18+ [Source: package.json, engines]
- [ ] Add inline citations for 37 tests [Source: test results]
- [ ] Convert "More Information" to "References" section
- [ ] Add confidence attribution details

**adr0002 - LanceDB**
- [ ] Add inline citations for @lancedb/lancedb ^0.15.0 [Source: package.json]
- [ ] Add inline citations for storage size (324 MB, 699 MB before) [Source: production database]
- [ ] Add inline citations for 165 documents, 37K concepts [Source: production stats]
- [ ] Convert to References section
- [ ] Add confidence attribution

**adr0003 - MCP Protocol**
- [ ] Add inline citations for SDK version [Source: package.json]
- [ ] Add inline citations for 8 tools [Code: src/tools/operations/]
- [ ] Add inline citations for tool evolution [Planning: various folders]
- [ ] Convert to References section
- [ ] Add confidence attribution

**adr0004 - RAG Architecture**
- [ ] Add inline citations for indexing costs [Planning: conceptual-search docs]
- [ ] Add inline citations for chunk sizes [Code: chunking implementation]
- [ ] Convert to References section
- [ ] Add confidence attribution

**adr0005 - PDF Processing**
- [ ] Add inline citations for pdf-parse ^1.1.1 [Source: package.json]
- [ ] Add inline citations for OCR fallback addition (Oct 21) [Planning: 2025-10-21-ocr-evaluation/]
- [ ] Convert to References section
- [ ] Add confidence attribution

## New ADR Template with Citations

```markdown
# N. Title

**Date:** YYYY-MM-DD  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** [Planning folder or context]

## Context and Problem Statement

[Problem description with inline citations]
- Key fact [Source: specific-file.md, line X]
- Metric [Planning: folder/file, section]

## Decision Drivers

* Driver 1 [Planning: folder/file]
* Driver 2 [Code: path/to/file.ts]
* Driver 3 [Config: package.json]

## Considered Options

* Option 1 [Source: where this was documented or inferred from]
* Option 2 [Source: ...]

## Decision Outcome

**Chosen option:** "Option X", because [reason with citation].

### Consequences

**Positive:**
* Benefit with metric [PR: folder/PR-DESC.md, line X]

**Negative:**
* Trade-off [Planning: folder/file]

### Confirmation

Validated by:
- Metric 1 [Source: specific location]
- Metric 2 [PR: PR description, table]

## References

### Planning Documents
- [Folder/File](../../.engineering/artifacts/planning/folder/file.md)

### Code Evidence
- Implementation: `src/path/to/code.ts`

### Configuration
- package.json
- tsconfig.json

### Related ADRs
- [ADR-NNNN](adrNNNN-title.md)

---

**Confidence Level:** HIGH/MEDIUM/LOW
**Attribution:**
- X sources: Planning + PR + Code + Tests
- Explicit decision in [specific doc]
- Metrics validated in [specific source]
```

## Efficient Execution Order

### Step 1: Generate Phase 1 ADRs (adr0006-0011) with Citations ⏳
**Time:** ~2 hours  
**Source Material:** Excellent (Oct 13 planning)  
**Citation Quality:** HIGH (explicit planning docs)

### Step 2: Generate Phases 2-7 ADRs (adr0012-0033+) with Citations ⏳
**Time:** ~6-7 hours  
**Source Material:** Excellent (Nov planning)  
**Citation Quality:** HIGH

### Step 3: Create Master Index and Template ⏳
**Time:** ~30 minutes

### Step 4: Enhance Phase 0 ADRs (adr0001-0005) Citations ⏳
**Time:** ~1 hour (focused pass)  
**Action:** Add inline citations and References sections

## Progress Tracking

**Generated with Full Citations:**
- [ ] adr0006-0011 (Phase 1)
- [ ] adr0012 (Phase 2)
- [ ] adr0013-0015 (Phase 3)
- [ ] adr0016-0023 (Phase 4)
- [ ] adr0024-0026 (Phase 5)
- [ ] adr0027-0030 (Phase 6)
- [ ] adr0031-0033+ (Phase 7)

**Need Citation Enhancement:**
- [ ] adr0001 (add inline citations)
- [ ] adr0002 (add inline citations)
- [ ] adr0003 (add inline citations)
- [ ] adr0004 (add inline citations)
- [ ] adr0005 (add inline citations)

**Administrative:**
- [ ] Master index/README
- [ ] ADR template
- [ ] Cross-reference verification

## Quality Assurance

### Per-ADR Checklist
Before marking ADR complete:
- [ ] Every metric has source citation
- [ ] Every decision driver cited
- [ ] Every alternative option sourced or marked inferred
- [ ] References section complete
- [ ] Confidence level with attribution
- [ ] Cross-references to related ADRs

### Verification Method
User can verify traceability by:
1. Pick any fact/metric in ADR
2. Check inline citation
3. Verify reference in References section
4. Trace to actual source file
5. Confirm fact exists in source

## Next Actions

1. ✅ Citation standards documented
2. ✅ Execution plan created
3. ⏳ Continue generating adr0006+ with citations
4. ⏳ Complete all new ADRs
5. ⏳ Enhancement pass on adr0001-0005
6. ⏳ Final verification of all citations

---

**Status:** Ready to continue with enhanced citation practices  
**Next:** Generate adr0006 (Hybrid Search Strategy) with full citations


