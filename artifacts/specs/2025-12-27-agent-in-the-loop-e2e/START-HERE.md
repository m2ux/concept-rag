# Agent-in-the-Loop E2E Testing

**Issue:** [#49](https://github.com/m2ux/concept-rag/issues/49)
**Status:** ✅ COMPLETE
**Created:** 2025-12-27
**Type:** Feature

---

## Executive Summary

Implement Agent-in-the-Loop (AIL) E2E testing that evaluates the system's effectiveness when a real AI agent uses the MCP tools to complete information retrieval goals.

**Key Deliverables:**
1. Configurable LLM agent harness for testing
2. Test scenario framework with Tier 1/2/3 scenarios
3. Evaluation engine measuring accuracy, relevance, tool selection, efficiency
4. Integration with existing test infrastructure

**Success Criteria:**
- [ ] Tier 1 tests pass at >90% rate
- [ ] Tier 2 tests pass at >75% rate  
- [ ] Tier 3 tests pass at >60% rate
- [ ] Tool selection correctness >85%
- [ ] Average tool calls ≤5 for Tier 1, ≤8 for Tier 2

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Planning | ✅ Complete | Requirements, analysis, approach confirmed |
| Preparation | ✅ Complete | Branch, PR #63 created |
| Task 1: Agent Harness | ✅ Complete | LLMAgentRunner, ToolCallRecorder |
| Task 2: Evaluation Engine | ✅ Complete | Accuracy, ToolSelection, Efficiency |
| Task 3: Scenario Framework | ✅ Complete | ScenarioRunner, types |
| Task 4: Tier 1 Tests | ✅ Complete | 3 scenarios |
| Task 5: Tier 2 Tests | ✅ Complete | 3 scenarios |
| Task 6: Tier 3 Tests | ✅ Complete | 3 scenarios |
| Validation | ✅ Complete | 1424 tests pass, build passes |
| Finalize | ✅ Complete | ADR accepted, PR updated |

---

## Timeline

**Estimated Effort:** 6-10h agentic + 2h review

| Task | Estimate |
|------|----------|
| Agent Harness | 1.5-2h |
| Evaluation Engine | 1.5-2h |
| Scenario Framework | 1h |
| Tier 1 Tests | 1h |
| Tier 2 Tests | 1h |
| Tier 3 Tests | 1h |
| Validation & Finalize | 0.5h |

---

## Quick Links

- [Work Package Plan](01-work-package-plan.md) - Detailed implementation spec
- [README](README.md) - Navigation hub

