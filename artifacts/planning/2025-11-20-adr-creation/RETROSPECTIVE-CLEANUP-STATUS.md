# Retrospective Language Cleanup - Status

**Date:** 2025-11-20  
**Principle:** ADRs written AS IF at time of decision (not looking back)

## What's Acceptable

### For Refactoring ADRs (e.g., adr0016, adr0021)
✅ **"Before" (problem state) and "After" (solution)** - This IS the decision context
- adr0016: "Before: Global state" vs. "After: Layered architecture" ← OK
- adr0021: "Before: O(n)" vs. "After: O(log n)" ← OK
- These document a transformation, so comparison is appropriate

### For Related Decisions Links
✅ **Links to future ADRs** - Cross-references are metadata, not content
- "See ADR-0027 for later optimization" in Related Decisions ← OK

## What Needs Fixing

### 
