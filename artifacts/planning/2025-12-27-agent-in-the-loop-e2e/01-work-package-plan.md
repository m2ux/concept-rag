# Work Package Plan: Agent-in-the-Loop E2E Testing

**Issue:** [#49](https://github.com/m2ux/concept-rag/issues/49)
**Created:** 2025-12-27

---

## Problem Statement

Current tests verify that individual MCP tools return correctly formatted results and that resilience patterns function under load. However, there is no testing that validates whether an AI agent can effectively use tool combinations to answer questions.

**What's not tested:**
- Whether an agent can effectively use tool combinations to answer questions
- Whether tool descriptions guide agents toward optimal tool selection
- Whether search results contain sufficient context for goal completion
- How many tool calls an agent needs to reach a correct conclusion

---

## Scope

### In Scope

- Configurable agent harness supporting real LLM providers (via OpenRouter)
- Test scenario framework with Tier 1/2/3 complexity levels
- Evaluation engine measuring:
  - Accuracy (correct conclusions vs ground truth)
  - Tool selection correctness (vs Tool Selection Guide)
  - Efficiency (tool call count, convergence)
- 9 test scenarios across 3 tiers
- Integration with vitest and existing test database

### Out of Scope

- Relevance/completeness evaluation (requires manual annotation)
- Novelty evaluation (qualitative, not automatable)
- Production monitoring
- Automated remediation

---

## Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AIL Test Suite                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Tier 1     │  │  Tier 2     │  │  Tier 3     │         │
│  │  Scenarios  │  │  Scenarios  │  │  Scenarios  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Scenario Runner                         │   │
│  │  - Loads scenario definition                         │   │
│  │  - Invokes agent with goal                          │   │
│  │  - Records tool calls                               │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LLM Agent Runner                        │   │
│  │  - Configurable provider (Anthropic, OpenAI)        │   │
│  │  - Tool execution via ApplicationContainer          │   │
│  │  - Conversation management                          │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Evaluation Engine                       │   │
│  │  - AccuracyEvaluator                                │   │
│  │  - ToolSelectionEvaluator                           │   │
│  │  - EfficiencyEvaluator                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Real LLM Agent**: Use actual LLM API calls (not mocked) to validate tool descriptions
2. **Configurable Provider**: Support multiple providers via OpenRouter
3. **Tool Call Recording**: Record all tool calls for analysis
4. **Ground Truth Comparison**: Define expected answers for accuracy evaluation
5. **Tool Selection Guide Integration**: Validate tool choices against documented guidelines

---

## Tasks

### Task 1: Agent Harness (~1.5-2h)

**Goal:** Create configurable LLM agent that can execute tool calls

**Deliverables:**
- `src/__tests__/ail/agent/types.ts` - Agent interfaces
- `src/__tests__/ail/agent/llm-agent-runner.ts` - Main agent runner
- `src/__tests__/ail/agent/tool-call-recorder.ts` - Tool call recording
- `src/__tests__/ail/agent/index.ts` - Exports

**Implementation:**
- Use OpenRouter API for LLM calls
- Support tool calling via function/tool protocol
- Record all tool invocations with inputs/outputs
- Configurable model, temperature, max iterations

### Task 2: Evaluation Engine (~1.5-2h)

**Goal:** Create evaluation components for measuring agent effectiveness

**Deliverables:**
- `src/__tests__/ail/evaluation/types.ts` - Evaluation interfaces
- `src/__tests__/ail/evaluation/accuracy-evaluator.ts` - Answer correctness
- `src/__tests__/ail/evaluation/tool-selection-evaluator.ts` - Tool choice validation
- `src/__tests__/ail/evaluation/efficiency-evaluator.ts` - Call count metrics
- `src/__tests__/ail/evaluation/metrics-aggregator.ts` - Combined metrics
- `src/__tests__/ail/evaluation/index.ts` - Exports

**Implementation:**
- Accuracy: LLM-as-judge comparing agent answer to ground truth
- Tool selection: Map queries to expected tools from Tool Selection Guide
- Efficiency: Count tool calls, measure convergence

### Task 3: Scenario Framework (~1h)

**Goal:** Create test scenario infrastructure

**Deliverables:**
- `src/__tests__/ail/scenarios/types.ts` - Scenario interfaces
- `src/__tests__/ail/scenarios/scenario-runner.ts` - Scenario execution
- `src/__tests__/ail/scenarios/index.ts` - Exports

**Implementation:**
- Scenario definition with goal, expected tools, ground truth
- Runner that orchestrates agent and evaluation
- Support for all three tiers

### Task 4: Tier 1 Tests (~1h)

**Goal:** Implement single-document retrieval test scenarios

**Deliverables:**
- `src/__tests__/ail/tier1-single-document.ail.test.ts`

**Scenarios:**
1. Direct fact lookup: "What are the three army formations in Art of War?"
2. Concept explanation: "Explain the dependency rule from Clean Architecture"
3. Quote extraction: "Find Sun Tzu's definition of supreme excellence"

**Success Criteria:**
- >90% pass rate
- ≤5 tool calls per scenario
- Correct tool selection (catalog_search → chunks_search workflow)

### Task 5: Tier 2 Tests (~1h)

**Goal:** Implement cross-document synthesis test scenarios

**Deliverables:**
- `src/__tests__/ail/tier2-cross-document.ail.test.ts`

**Scenarios:**
1. Concept comparison: "Compare coupling concepts across architecture books"
2. Source aggregation: "Which documents discuss design patterns?"
3. Theme identification: "What themes appear across software books?"

**Success Criteria:**
- >75% pass rate
- ≤8 tool calls per scenario
- Multiple sources cited

### Task 6: Tier 3 Tests (~1h)

**Goal:** Implement complex research task scenarios

**Deliverables:**
- `src/__tests__/ail/tier3-complex-research.ail.test.ts`

**Scenarios:**
1. Multi-hop reasoning: "What patterns help with the problems Sun Tzu describes?"
2. Gap analysis: "What software topics are not covered in my library?"
3. Category exploration: "What concepts are unique to distributed systems?"

**Success Criteria:**
- >60% pass rate
- Uses appropriate tool combinations
- Demonstrates reasoning across sources

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Tier 1 pass rate | >90% |
| Tier 2 pass rate | >75% |
| Tier 3 pass rate | >60% |
| Tool selection correctness | >85% |
| Avg tool calls (Tier 1) | ≤5 |
| Avg tool calls (Tier 2) | ≤8 |
| All tests CI-compatible | ✓ |

---

## Testing Strategy

### Unit Tests
- Agent harness: Mock LLM responses, verify tool execution
- Evaluators: Test with known good/bad examples

### Integration Tests
- End-to-end scenario execution with real db/test database
- Requires OPENROUTER_API_KEY environment variable

### CI Considerations
- Skip AIL tests if API key not available
- Use `describe.skipIf()` pattern
- Mark as `@slow` for optional exclusion

---

## Dependencies

- `db/test` database (seeded via `./scripts/seed-test-database.sh`)
- `OPENROUTER_API_KEY` environment variable
- Existing `ApplicationContainer` and MCP tools

---

## References

- [Issue #49](https://github.com/m2ux/concept-rag/issues/49)
- [Tool Selection Guide](../../docs/tool-selection-guide.md)
- [MCP Tools Integration Tests](../../src/__tests__/integration/mcp-tools-integration.test.ts)





