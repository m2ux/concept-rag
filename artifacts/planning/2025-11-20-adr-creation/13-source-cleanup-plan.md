# Source Cleanup Plan

**Date:** 2025-11-20  
**Principle:** ONLY git commits, planning docs, and chat histories are ADR sources

## Invalid Sources to Remove

❌ **Remove from ALL ADRs:**
- package.json
- tsconfig.json
- README.md
- CHANGELOG.md  
- Code files (src/*, except as shown in git commit diffs)
- Configuration files
- Documentation files (USAGE.md, FAQ.md, etc.)
- Any other project files

✅ **Valid Sources:**
- Git commits (commit hash, message, date)
- Planning documents (.ai/planning/*)
- Chat histories/summaries (if exist)

## Strategy

For each ADR:
1. Remove Sources section references to invalid files
2. Keep only: Git commits, Planning docs
3. Update inline citations to reference planning docs only
4. Remove References to package.json, README, code files

## Starting Systematic Cleanup

All 33 ADRs need checking.

