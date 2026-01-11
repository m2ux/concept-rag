# [Number]. [Title]

**Date:** YYYY-MM-DD  
**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-XXXX | Accepted (Inherited)]  
**Deciders:** [Names or roles | "adiom-data team (lance-mcp)" for inherited | "concept-rag Engineering Team"]  
**Technical Story:** [Brief description of context]

**Sources:**
- Planning: .ai/planning/YYYY-MM-DD-folder/ [If documented decision with planning docs]
- Git Commit: [hash] ([date]) [If implementation commit exists or inherited]
- Chat History: .ai/planning/folder/chat-summary.md [If chat history exists]

**IMPORTANT:** Sources section contains ONLY:
- ✅ Git commits (hash and date)
- ✅ Planning document folders (.ai/planning/*)
- ✅ Chat histories/summaries
- ❌ NO package.json, tsconfig.json, README.md, CHANGELOG.md
- ❌ NO code files (src/*, test/*, scripts/*)
- ❌ NO documentation files (USAGE.md, FAQ.md, etc.)
- ❌ NO external links

## Context and Problem Statement

[Describe the problem that required a decision AS IF at the time - not retrospectively]

[Example: "The system needed..." NOT "The system later needed..."]

**The Core Problem:** [One sentence problem statement]

**Decision Drivers:**
* [Driver 1 with inline citation] [Source: planning-doc.md, line X]
* [Driver 2] [Source: git commit message]
* [Driver 3] [Planning: folder-name]

**INLINE CITATION FORMAT:**
- [Source: file.md, line X] for planning docs
- [Planning: folder-name] for general planning reference  
- [Git: commit-hash] for git commit reference
- [Inferred: reasoning] when inferring from code/structure

## Alternative Options

**NOTE:** Use "Alternative Options" not "Considered Options" (more accurate for inferred decisions)

* **Option 1: [Name]** - [Brief description]
* **Option 2: [Name]** - [Brief description]
* **Option 3: [Name]** - [Brief description]
* **Option 4: [Name]** - [Brief description]
* **Option 5: [Name]** - [Brief description]

## Decision Outcome

**If rationale is DOCUMENTED (HIGH confidence with planning docs):**
```
**Chosen option:** "[Option X]", because [justification with inline citations].
```

**If rationale is INFERRED (MEDIUM confidence, inherited, no planning):**
```
**Chosen option:** "[Option X]"
```
**DO NOT confabulate reasons if no evidence exists!**

### [Optional: Implementation Details]

[Describe implementation AS IT WAS at decision time]

**Code blocks must show code from the commit, not current state:**
```typescript
// Code as it existed at commit [hash]
// NOT current code!
```

**NO retrospective language:**
- ❌ "Later enhanced..."
- ❌ "Evolution timeline..."
- ❌ "Current (Post-refactoring):"
- ❌ "Before/After" (EXCEPT for refactoring ADRs where that's the decision context)
- ✅ Present tense, as if at decision time

### Consequences

**Positive:**
* [Benefit with metric] [Source: planning-doc.md, line X]
* [Benefit validated] [Validation: test results]

**Negative:**
* [Trade-off acknowledged] [Trade-off: explicit limitation]
* [Cost or risk] [Risk: mitigation noted]

**Neutral:**
* [Neutral impact] [Architecture: design choice]

### Confirmation

[How was decision validated? Metrics from planning docs or commit only]

**Example:**
- Metric 1: [Value] [Source: planning-doc.md, line X]
- Test results: [Results] [Planning: folder/file.md]

**NO production metrics unless from planning docs!**

## Pros and Cons of the Options

### Option 1: [Name] - [Chosen or Not]

[Description]

**Pros:**
* [Advantage with source if available]

**Cons:**
* [Disadvantage]

### Option 2: [Name]

[Continue for all options...]

## Implementation Notes

[Optional: Technical details AS THEY WERE at decision time]

**Acceptable here (context, not sources):**
- Configuration examples
- Code snippets (from commit)
- Architecture diagrams
- Technical explanations

**NOT acceptable:**
- Current code state (unless that's the commit)
- Future enhancements
- Evolution timelines
- "Later added..." statements

## Related Decisions

[Cross-references to other ADRs - this is metadata, acceptable to reference future ADRs]

- [ADR-XXXX: Related Decision 1](adrXXXX-title.md) - How it relates
- [ADR-YYYY: Related Decision 2](adrYYYY-title.md) - How it relates

## References

**NO subsections here! Keep minimal:**

### Related Decisions
- [List only if not already in "Related Decisions" section above]

---

**Confidence Level:** [HIGH | MEDIUM-HIGH | MEDIUM | MEDIUM (Inherited)]

**HIGH:** Planning docs + git commit + validation (3+ sources)  
**MEDIUM-HIGH:** Planning docs + git commit OR code evidence  
**MEDIUM:** Inferred from code/inherited, minimal documentation  
**MEDIUM (Inherited):** Inherited from upstream lance-mcp

**Attribution:**
[Explain confidence level with source count]
- Example HIGH: "Planning docs: [date], Git commit: [hash], Metrics from: [file lines]"
- Example MEDIUM: "Inherited from upstream lance-mcp (adiom-data team), Evidence: Git clone commit [hash]"

**Traceability:**
[ONE LINE stating where facts can be verified]
- Example: ".ai/planning/YYYY-MM-DD-folder/"
- Example: "Git commit [hash] in lance-mcp upstream"

---

## ADR Writing Checklist

### Required Elements
- [x] ADR prefix naming (adr0001, adr0002, etc.)
- [x] Sources header with ONLY git/planning/chat
- [x] Alternative Options (not "Considered")
- [x] Decision outcome (with or without "because" based on evidence)
- [x] Consequences (positive, negative, neutral)
- [x] References section (Related Decisions only)
- [x] Confidence level with attribution
- [x] Traceability statement

### Quality Standards
- [x] Every metric has inline citation [Source: file, line]
- [x] Code blocks show state at commit time
- [x] No confabulated rationales for inferred decisions
- [x] No retrospective language (as if at decision time)
- [x] No invalid sources (package.json, README, code files)
- [x] Git commits not duplicated (in Sources only, not References)

### For Inherited Decisions
- [x] Attributed to upstream team (adiom-data)
- [x] Status: "Accepted (Inherited)"
- [x] Git commit from upstream clone
- [x] No confabulated "because" clause
- [x] Code/schema matches upstream state

### For Documented Decisions
- [x] Planning folder in Sources
- [x] Git commit if implementation exists
- [x] Rationale can include "because" with citations
- [x] Metrics from planning docs

---

## Common Mistakes to Avoid

❌ **Don't:**
- Include package.json, README.md, or any project files in Sources
- Duplicate git commits (Sources has it, don't repeat in References)
- Show current code (show code at commit time)
- Use retrospective language ("later", "evolved", "current")
- Confabulate rationales for inferred/inherited decisions
- Reference future ADRs in main content (only in Related Decisions)
- Use "Considered Options" (use "Alternative Options")

✅ **Do:**
- Keep Sources to git/planning/chat only
- Show code as it was at commit
- Write as if at decision time (present tense)
- State choice only if no documented rationale
- Cite every metric with [Source: file, line]
- Keep References minimal (Related Decisions only)

---

**Use this template for all new ADRs to maintain consistency, accuracy, and proper source restrictions.**

