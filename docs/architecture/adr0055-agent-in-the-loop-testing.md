# ADR 0055: Agent-in-the-Loop E2E Testing

**Status**: Accepted  
**Date**: 2025-12-27  
**Deciders**: Development Team  
**Related ADRs**: [adr0035](adr0035-test-suite-expansion.md), [adr0019](adr0019-vitest-testing-framework.md), [adr0032](adr0032-tool-selection-guide.md), [adr0031](adr0031-eight-specialized-tools-strategy.md)

## Context

The concept-rag project has a comprehensive test suite (690+ tests) covering individual MCP tool behavior, component integration, and resilience patterns. However, a critical gap exists: **no tests validate whether an AI agent can effectively use the tools to complete information retrieval goals**.

Current test coverage verifies:
- ✅ Individual tools return correctly formatted results
- ✅ Search algorithms produce ranked outputs  
- ✅ Resilience patterns function under load
- ✅ Cross-tool workflows execute correctly

What remains **untested**:
- ❌ Whether an agent can effectively use tool combinations to answer questions
- ❌ Whether tool descriptions guide agents toward optimal tool selection
- ❌ Whether search results contain sufficient context for goal completion
- ❌ How many tool calls an agent needs to reach a correct conclusion

The Tool Selection Guide ([adr0032](adr0032-tool-selection-guide.md)) defines expected tool selection patterns, but these expectations are not validated in automated tests. This creates risk that:
1. Tool descriptions may be unclear or misleading
2. Search results may lack sufficient context
3. Multi-tool workflows may be inefficient
4. Changes to tools or descriptions may degrade agent effectiveness

## Decision

Implement an **Agent-in-the-Loop (AIL) E2E Testing Framework** that uses a configurable real LLM agent to execute test scenarios, recording tool calls and evaluating results against expected outcomes.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AIL Test Suite                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Tier 1     │  │  Tier 2     │  │  Tier 3     │         │
│  │  Single-doc │  │  Cross-doc  │  │  Complex    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Scenario Runner                         │   │
│  │  - Loads scenario definition                         │   │
│  │  - Invokes agent with goal                          │   │
│  │  - Records tool calls via ToolCallRecorder          │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LLM Agent Runner                        │   │
│  │  - Configurable provider (Anthropic, OpenAI, etc.)  │   │
│  │  - Tool execution via ApplicationContainer          │   │
│  │  - Conversation/iteration management                │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Evaluation Engine                       │   │
│  │  - AccuracyEvaluator (LLM-as-judge)                 │   │
│  │  - ToolSelectionEvaluator (vs Tool Selection Guide) │   │
│  │  - EfficiencyEvaluator (call counts, convergence)   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **LLM Agent Runner** (`src/__tests__/ail/agent/`)
   - Configurable LLM provider via OpenRouter API
   - Supports tool calling protocol (function calls)
   - Records all tool invocations with inputs/outputs
   - Manages conversation history and iteration limits

2. **Tool Call Recorder** (`src/__tests__/ail/agent/`)
   - Wraps tool execution to capture all calls
   - Records timing, success/failure, arguments, results
   - Provides analytics (unique tools used, call counts)

3. **Evaluation Engine** (`src/__tests__/ail/evaluation/`)
   - **AccuracyEvaluator**: Compares agent conclusions to ground truth using LLM-as-judge
   - **ToolSelectionEvaluator**: Validates tool choices against Tool Selection Guide patterns
   - **EfficiencyEvaluator**: Measures tool call count, convergence speed

4. **Test Scenarios** (`src/__tests__/ail/scenarios/`)
   - Three tiers of increasing complexity
   - Each scenario defines: goal, expected tools, ground truth, success criteria

### Test Tiers

| Tier | Focus | Example | Pass Target |
|------|-------|---------|-------------|
| 1 | Single-document retrieval | "What are the army formations in Art of War?" | >90% |
| 2 | Cross-document synthesis | "Compare coupling concepts across architecture books" | >75% |
| 3 | Complex research | "What patterns help with problems Sun Tzu describes?" | >60% |

### Evaluation Dimensions

| Dimension | Measurement | Implementation |
|-----------|-------------|----------------|
| Accuracy | Correct conclusion vs ground truth | LLM-as-judge comparison |
| Tool Selection | Correct tools chosen | Pattern matching vs Guide |
| Efficiency | Tool call count | Count ≤ threshold per tier |

### Configuration

```typescript
interface AgentConfig {
  apiKey: string;                    // OpenRouter API key
  model: string;                     // e.g., 'anthropic/claude-sonnet-4'
  temperature?: number;              // Default: 0.1
  maxTokens?: number;                // Default: 4096
  maxIterations?: number;            // Default: 10
  timeoutMs?: number;                // Default: 60000
}
```

Default model: `anthropic/claude-sonnet-4` via OpenRouter.

## Consequences

### Positive

1. **Validates Tool Effectiveness**
   - Tests prove agents can actually use tools to answer questions
   - Catches tool description problems that confuse agents
   - Validates Tool Selection Guide accuracy

2. **Prevents Regressions**
   - Changes to tools or descriptions can be validated
   - Refactoring safety for tool implementations
   - Confidence in MCP server updates

3. **Guides Improvement**
   - Failed scenarios identify specific weaknesses
   - Efficiency metrics highlight optimization opportunities
   - Tool selection errors reveal description gaps

4. **Documentation Validation**
   - Tool Selection Guide claims become testable
   - Test scenarios serve as usage examples
   - Ground truth documents expected behavior

5. **Quality Metrics**
   - Quantifiable success rates per tier
   - Trend tracking across versions
   - Comparison across model configurations

### Negative

1. **LLM API Costs**
   - Real LLM calls incur API charges
   - Each test run costs money
   - Mitigation: Run AIL tests selectively (not on every CI push)

2. **Non-Determinism**
   - LLM responses vary between runs
   - Same scenario may pass/fail non-deterministically
   - Mitigation: Use low temperature (0.1), evaluation thresholds not exact matches

3. **Test Duration**
   - LLM calls add latency (seconds per call)
   - Full suite takes minutes, not seconds
   - Mitigation: Mark as `@slow`, run separately from unit tests

4. **API Key Requirement**
   - Tests require OPENROUTER_API_KEY
   - CI needs secrets configuration
   - Mitigation: Skip tests gracefully if key unavailable

5. **Maintenance Overhead**
   - Ground truth must be maintained
   - New tools require new scenarios
   - Mitigation: Structured scenario definitions, clear documentation

### Neutral

1. **Model Dependency**: Results may vary across model versions
2. **Evaluation Subjectivity**: LLM-as-judge introduces evaluation variance
3. **Coverage Scope**: Not all tool combinations tested (combinatorial explosion)

## Alternatives Considered

### 1. Scripted/Simulated Agent

**Approach**: Use predetermined tool call sequences instead of real LLM

**Pros**:
- Deterministic tests
- No API costs
- Fast execution

**Cons**:
- Doesn't test real agent behavior
- Doesn't validate tool descriptions
- Assumes correct tool selection patterns

**Decision**: Rejected - Defeats the purpose of testing agent effectiveness

### 2. Mock LLM Responses

**Approach**: Mock LLM to return expected tool calls

**Pros**:
- Fast, deterministic
- No API costs
- Easy to control

**Cons**:
- Tests the mock, not real behavior
- Doesn't validate tool descriptions guide correctly
- May pass while real agents fail

**Decision**: Rejected - Doesn't test what we need to test

### 3. Production Monitoring Only

**Approach**: Monitor real production usage instead of testing

**Pros**:
- Real user behavior
- No test infrastructure
- Covers all scenarios

**Cons**:
- Reactive, not proactive
- Can't prevent regressions before release
- Privacy concerns with user data

**Decision**: Rejected - Need proactive testing, not just monitoring

### 4. Human Evaluation Only

**Approach**: Manual testing by humans using the tools

**Pros**:
- High-quality evaluation
- Catches subtle issues
- Flexible testing

**Cons**:
- Not automated
- Not scalable
- Not repeatable
- Slow feedback

**Decision**: Rejected - Need automated testing for CI/CD

### 5. Synthetic Benchmark Datasets

**Approach**: Use standardized RAG benchmarks (BEIR, etc.)

**Pros**:
- Industry-standard metrics
- Comparable results
- Well-defined evaluation

**Cons**:
- Generic, not tool-specific
- Doesn't test tool selection
- Doesn't match our corpus

**Decision**: Rejected - Need domain-specific, tool-aware testing

## Implementation

### Directory Structure

```
src/__tests__/ail/
├── agent/
│   ├── types.ts                    # Agent interfaces
│   ├── llm-agent-runner.ts         # Main agent runner
│   ├── tool-call-recorder.ts       # Tool call recording
│   └── index.ts
├── evaluation/
│   ├── types.ts                    # Evaluation interfaces
│   ├── accuracy-evaluator.ts       # Answer correctness
│   ├── tool-selection-evaluator.ts # Tool choice validation
│   ├── efficiency-evaluator.ts     # Call count metrics
│   └── index.ts
├── scenarios/
│   ├── types.ts                    # Scenario interfaces
│   ├── scenario-runner.ts          # Scenario execution
│   └── index.ts
├── tier1-single-document.ail.test.ts
├── tier2-cross-document.ail.test.ts
└── tier3-complex-research.ail.test.ts
```

### Success Metrics

| Metric | Target |
|--------|--------|
| Tier 1 pass rate | >90% |
| Tier 2 pass rate | >75% |
| Tier 3 pass rate | >60% |
| Tool selection correctness | >85% |
| Avg tool calls (Tier 1) | ≤5 |
| Avg tool calls (Tier 2) | ≤8 |

### CI Integration

```yaml
# Run AIL tests separately (requires API key, expensive)
- name: Run AIL Tests
  if: github.event_name == 'schedule' || contains(github.event.head_commit.message, '[ail]')
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: npm test -- src/__tests__/ail/
```

## Related Decisions

- [adr0035](adr0035-test-suite-expansion.md) - Establishes test pyramid and quality standards
- [adr0019](adr0019-vitest-testing-framework.md) - Vitest provides test infrastructure
- [adr0032](adr0032-tool-selection-guide.md) - Defines expected tool selection patterns
- [adr0031](adr0031-eight-specialized-tools-strategy.md) - Tool design this validates
- [adr0042](adr0042-system-resilience-patterns.md) - Resilience patterns for LLM calls

## Future Considerations

1. **Multi-Model Comparison**: Run same scenarios across different models
2. **Regression Tracking**: Track pass rates across versions
3. **Prompt Engineering**: Use test results to improve tool descriptions
4. **Coverage Expansion**: Add more scenarios as tools evolve
5. **Cost Optimization**: Cache embeddings, batch evaluations
6. **Relevance/Completeness**: Add human-in-the-loop for qualitative dimensions

## References

- [Issue #49](https://github.com/m2ux/concept-rag/issues/49) - Original issue
- [Tool Selection Guide](../tool-selection-guide.md) - Expected tool selection patterns
- [MCP Tools Integration Tests](../../src/__tests__/integration/mcp-tools-integration.test.ts) - Existing tool tests

---

**Note**: This ADR documents a new testing paradigm for concept-rag. Agent-in-the-Loop testing bridges the gap between component testing (which verifies tools work) and real-world usage (where agents must effectively combine tools). The framework enables proactive validation that the MCP tool suite achieves its purpose: helping AI agents answer questions using the document corpus.

