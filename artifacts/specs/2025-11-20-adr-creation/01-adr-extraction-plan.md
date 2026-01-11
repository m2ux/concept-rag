# ADR Extraction Plan

**Date:** 2025-11-20  
**Status:** In Progress  
**Purpose:** Methodology for extracting and generating ADRs from project history

## Overview

This document outlines the systematic approach to extracting architectural decisions from the concept-RAG project's comprehensive planning documentation and generating well-structured ADRs.

## Extraction Methodology

### Multi-Source Synthesis Approach

Each ADR will be synthesized from multiple information sources:

```
Planning Docs (Context + Rationale)
    ↓
PR Descriptions (Metrics + Results)
    ↓
Code Structure (Implementation Evidence)
    ↓
Documentation (User Context)
    ↓
SYNTHESIZED ADR
```

### Quality Assurance

**Confidence Scoring:**
- **HIGH** (4 sources): Planning + PR + Code + Docs
- **MEDIUM** (2-3 sources): Planning + Code or Planning + PR
- **LOW** (1 source): Single source (mark for review)

**Verification Checklist:**
- [ ] Context clearly stated
- [ ] Alternatives documented
- [ ] Chosen option identified
- [ ] Rationale explained
- [ ] Consequences listed
- [ ] Source attribution included
- [ ] Cross-references added

## ADR Template

Using the template from `06-architecture-documentation-plan.md`:

```markdown
# [Number]. [Title]

**Date:** YYYY-MM-DD  
**Status:** [Accepted | Superseded]  
**Deciders:** Engineering Team  
**Technical Story:** [Link to planning doc or PR]  
**Sources:** [Planning folders, PRs, code references]

## Context and Problem Statement

[Problem description from planning docs]

## Decision Drivers

* [Driver from planning analysis]
* [Constraint from requirements]
* [Performance consideration]

## Considered Options

* [Option 1 from planning]
* [Option 2 from planning]
* [Chosen option]

## Decision Outcome

**Chosen option:** "[option]", because [rationale from planning/PR].

### Consequences

**Positive:**
* [Benefit from PR metrics]
* [Improvement from planning]

**Negative:**
* [Trade-off noted in planning]
* [Limitation from implementation]

**Neutral:**
* [Architectural impact]

### Confirmation

[Metrics from PR description or planning docs]

## Pros and Cons of the Options

### [option 1]

[From planning document analysis]

**Pros:**
* [Advantage]

**Cons:**
* [Disadvantage]

## More Information

**Planning Documents:**
- [Link to planning folder]

**Implementation:**
- [Link to code files]

**Related ADRs:**
- [Cross-references]
```

## Extraction Process

### Step 1: Locate Source Material

**For Each ADR:**
1. Identify relevant planning folder(s)
2. Find corresponding PR description
3. Locate implementation files
4. Check documentation references

### Step 2: Extract Decision Elements

**From Planning Documents:**
- Context/problem statement
- Alternatives considered
- Analysis and comparison
- Recommendations

**From PR Descriptions:**
- Final decision summary
- Performance metrics
- Test results
- Impact assessment

**From Code:**
- Implementation approach
- Technical details
- Pattern usage

**From Documentation:**
- User-facing rationale
- Feature descriptions
- Usage examples

### Step 3: Structure ADR

1. **Title**: Clear, action-oriented
2. **Metadata**: Date, status, sources
3. **Context**: Problem and constraints
4. **Options**: Alternatives with pros/cons
5. **Decision**: Chosen option with rationale
6. **Consequences**: Positive, negative, neutral
7. **Validation**: Metrics and confirmation
8. **References**: Links to sources

### Step 4: Verify and Enhance

1. Cross-reference multiple sources
2. Add metrics from PRs
3. Include code examples where relevant
4. Add cross-references to related ADRs
5. Verify technical accuracy

### Step 5: Review and Finalize

1. Check completeness
2. Verify all sections filled
3. Ensure source attribution
4. Add to master index
5. Place in `docs/architecture/decisions/`

## ADR Numbering Scheme

**Format:** `NNNN-kebab-case-title.md`

**Chronological Ordering:**
- Based on planning folder dates
- Earlier decisions get lower numbers
- Preserves historical context

**Numbering Plan:**
```
0001-0010: Foundation (Oct 2025)
  - Initial architecture
  - Core technology choices
  
0011-0020: Feature Decisions (Nov 2025)
  - Search implementations
  - Category system
  - Provider support
  
0021-0030: Optimization & Quality (Nov 2025)
  - Performance improvements
  - Testing strategy
  - Security fixes
  
0031+: Future Decisions
```

## Extraction Schedule

### Phase 1: Foundation ADRs (4 hours)

**Target:** ADRs 0001-0010  
**Sources:** Architecture refactoring planning

| # | Title | Primary Source | Confidence |
|---|-------|---------------|------------|
| 0001 | Layered Architecture | arch-refactoring | HIGH |
| 0002 | Repository Pattern | arch-refactoring | HIGH |
| 0003 | Dependency Injection | arch-refactoring | HIGH |
| 0004 | LanceDB Vector Storage | README + Code | MEDIUM |
| 0005 | TypeScript Strict Mode | arch-refactoring | HIGH |
| 0006 | Vitest Testing | arch-refactoring | HIGH |
| 0007 | Node.js Runtime | README + package.json | MEDIUM |
| 0008 | MCP Tools Interface | tool-docs + README | HIGH |
| 0009 | Hybrid Search Strategy | hybrid-search | HIGH |
| 0010 | Concept Extraction | conceptual-search | HIGH |

### Phase 2: Feature ADRs (3 hours)

**Target:** ADRs 0011-0020  
**Sources:** Feature planning folders

| # | Title | Primary Source | Confidence |
|---|-------|---------------|------------|
| 0011 | Hash-Based Integer IDs | category-search | HIGH |
| 0012 | Category Storage Strategy | category-search | HIGH |
| 0013 | Multi-Provider Embeddings | alt-embeddings | MEDIUM |
| 0014 | Document Loader Factory | ebook-support | HIGH |
| 0015 | OCR Fallback Strategy | ebook-support | HIGH |
| 0016 | Incremental Seeding | seeding-guides | MEDIUM |
| 0017 | WordNet Integration | README + Code | MEDIUM |
| 0018 | SQL Injection Prevention | arch-refactoring PR | HIGH |
| 0019 | Tool Selection Guide | tool-docs | HIGH |
| 0020 | Eight Specialized Tools | tool-docs + README | HIGH |

### Phase 3: Quality ADRs (2 hours)

**Target:** ADRs 0021-0030  
**Sources:** Quality improvements

| # | Title | Primary Source | Confidence |
|---|-------|---------------|------------|
| 0021 | Performance Optimization | arch-refactoring PR | HIGH |
| 0022 | Testing Infrastructure | arch-refactoring | HIGH |
| 0023 | JSDoc Documentation | arch-refactoring | HIGH |
| 0024 | Hybrid Search Service | arch-refactoring | HIGH |
| 0025 | Code Quality Standards | arch-refactoring | MEDIUM |
| 0026 | Caching Strategy | Code analysis | MEDIUM |
| 0027 | Error Handling Patterns | Code analysis | MEDIUM |
| 0028 | Configuration Management | config.ts | MEDIUM |
| 0029 | Package Management | package.json | MEDIUM |
| 0030 | Build Configuration | tsconfig | MEDIUM |

## Automation Opportunities

### Template Population

**Automated Fields:**
- Date: From planning folder or PR date
- Status: "Accepted" (all historical decisions)
- Deciders: "Engineering Team" (default)
- Technical Story: Planning folder path

**Manual Fields:**
- Context: Requires synthesis
- Options: From planning analysis
- Rationale: From multiple sources
- Consequences: Requires analysis

### Source Parsing Strategy

**Planning Document Parsing:**
```typescript
// Pseudo-code
function extractDecisionFromPlanning(folder: string): DecisionInfo {
  const readme = readFile(`${folder}/README.md`);
  const plan = readFile(`${folder}/*-plan.md`);
  const pr = readFile(`${folder}/PR*.md`);
  
  return {
    context: extractContext(readme),
    alternatives: extractAlternatives(plan),
    decision: extractDecision(pr),
    rationale: extractRationale(plan, pr),
    metrics: extractMetrics(pr)
  };
}
```

**Confidence Calculation:**
```typescript
function calculateConfidence(sources: Source[]): ConfidenceLevel {
  if (sources.length >= 4) return 'HIGH';
  if (sources.length >= 2) return 'MEDIUM';
  return 'LOW';
}
```

## Quality Criteria

### Completeness Checklist

Each ADR must have:
- [ ] Clear problem statement
- [ ] At least 2 alternatives documented
- [ ] Explicit chosen option
- [ ] Rationale with 2+ reasons
- [ ] 2+ positive consequences
- [ ] 1+ negative consequence (honest trade-offs)
- [ ] Metrics or validation approach
- [ ] Source attribution
- [ ] Cross-references (where applicable)

### Content Quality

**Context Section:**
- Background sufficient for new team member
- Problem clearly stated
- Constraints identified
- Decision drivers explicit

**Options Section:**
- Each option described
- Pros and cons listed
- Fair comparison
- Sources cited

**Decision Section:**
- Clear chosen option
- Rationale explicit
- Trade-offs acknowledged
- Metrics included

### Technical Accuracy

**Verification Process:**
1. Cross-reference planning docs
2. Check implementation in code
3. Verify metrics from PRs
4. Validate technical details
5. Ensure consistency with other ADRs

## Output Organization

### File Structure

```
docs/architecture/
├── decisions/
│   ├── 0001-layered-architecture.md
│   ├── 0002-repository-pattern.md
│   ├── 0003-dependency-injection.md
│   ├── ...
│   ├── 0030-build-configuration.md
│   ├── README.md (index)
│   └── template.md
├── diagrams/
│   ├── system-overview.mmd
│   └── layered-architecture.mmd
└── README.md
```

### Master Index

**README.md in decisions/ folder:**
- List of all ADRs with status
- Chronological order
- Cross-reference matrix
- Quick links by category

**Categories:**
- Architecture & Design
- Technology Choices
- Feature Decisions
- Quality & Performance
- Security & Reliability

## Success Metrics

**Quantity:**
- [ ] Minimum 20 ADRs
- [ ] Target 30 ADRs
- [ ] Stretch 40+ ADRs

**Quality:**
- [ ] 90%+ completeness score
- [ ] 80%+ HIGH confidence
- [ ] 100% source attribution
- [ ] All cross-references added

**Usability:**
- [ ] Master index complete
- [ ] Categories assigned
- [ ] Search-friendly titles
- [ ] Clear status indicators

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Missing context | Medium | Use multiple sources, mark LOW confidence |
| Incorrect dates | Low | Use planning folder dates, note uncertainty |
| Wrong attribution | Low | Default to "Engineering Team" |
| Incomplete alternatives | Medium | Infer from context, mark as inferred |
| Technical inaccuracy | High | Verify in code, cross-reference |

## Timeline

**Day 1:**
- ✅ Information source analysis
- ✅ Extraction plan creation
- ⏳ Generate ADRs 0001-0010 (4 hours)

**Day 2:**
- ⏳ Generate ADRs 0011-0020 (3 hours)
- ⏳ Quality review and enhancement (2 hours)

**Day 3:**
- ⏳ Generate ADRs 0021-0030 (2 hours)
- ⏳ Create master index (1 hour)
- ⏳ Final review and placement (1 hour)

**Total Estimated Time:** 13 hours

## Next Steps

1. **Immediate:**
   - Begin extracting ADR 0001 (Layered Architecture)
   - Use arch-refactoring planning docs as source
   - Follow template structure
   - Verify against PR description

2. **First Batch (ADRs 1-5):**
   - Extract from architecture refactoring folder
   - High confidence (4 sources each)
   - Cross-reference appropriately

3. **Validation:**
   - Review first 5 ADRs for quality
   - Adjust template/process if needed
   - Continue with remaining ADRs

---

**Status:** Extraction plan complete, ready to generate ADRs  
**Next:** Begin ADR generation starting with 0001-layered-architecture.md  
**Estimated Time to First ADR:** 30 minutes


