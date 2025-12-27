/**
 * Agent-in-the-Loop Testing - Scenario Runner
 * 
 * Orchestrates scenario execution with agent and evaluation.
 */

import { LLMAgentRunner, ToolCallRecorder, AgentConfig, ToolDefinition, ToolExecutor } from '../agent/index.js';
import { 
  AccuracyEvaluator, 
  ToolSelectionEvaluator, 
  EfficiencyEvaluator,
  ScenarioEvaluationResult,
} from '../evaluation/index.js';
import { 
  TestScenario, 
  ScenarioRunOptions, 
  ScenarioRunResult, 
  ScenarioSuiteResult,
  ScenarioTier,
} from './types.js';

/**
 * Configuration for the scenario runner
 */
export interface ScenarioRunnerConfig {
  /** Agent configuration */
  agentConfig: AgentConfig;
  
  /** Available tool definitions */
  tools: ToolDefinition[];
  
  /** Tool executor function */
  toolExecutor: ToolExecutor;
  
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Runs test scenarios using the LLM agent
 */
export class ScenarioRunner {
  private agent: LLMAgentRunner;
  private accuracyEvaluator: AccuracyEvaluator;
  private toolSelectionEvaluator: ToolSelectionEvaluator;
  private efficiencyEvaluator: EfficiencyEvaluator;
  private tools: ToolDefinition[];
  private toolExecutor: ToolExecutor;
  private verbose: boolean;
  
  constructor(config: ScenarioRunnerConfig) {
    this.agent = new LLMAgentRunner(config.agentConfig);
    this.accuracyEvaluator = new AccuracyEvaluator({ 
      apiKey: config.agentConfig.apiKey 
    });
    this.toolSelectionEvaluator = new ToolSelectionEvaluator();
    this.efficiencyEvaluator = new EfficiencyEvaluator();
    this.tools = config.tools;
    this.toolExecutor = config.toolExecutor;
    this.verbose = config.verbose ?? false;
  }
  
  /**
   * Run a single scenario
   */
  async runScenario(scenario: TestScenario): Promise<ScenarioRunResult> {
    const startTime = Date.now();
    
    if (this.verbose) {
      console.log(`\n📋 Running scenario: ${scenario.id}`);
      console.log(`   Goal: ${scenario.goal}`);
    }
    
    // Create recorder for this scenario
    const recorder = new ToolCallRecorder(this.toolExecutor);
    
    try {
      // Execute agent with the goal
      const result = await this.agent.execute(
        scenario.goal,
        this.tools,
        recorder
      );
      
      const toolCalls = recorder.getToolCalls();
      
      if (this.verbose) {
        console.log(`   Tool calls: ${toolCalls.length}`);
        console.log(`   Completed: ${result.completed}`);
      }
      
      // Evaluate accuracy
      const accuracy = await this.accuracyEvaluator.evaluate(
        scenario.goal,
        result.answer,
        scenario.groundTruth
      );
      
      // Evaluate tool selection
      const toolSelection = this.toolSelectionEvaluator.evaluate(
        scenario.goal,
        toolCalls,
        scenario.expectedTools
      );
      
      // Evaluate efficiency
      const efficiency = this.efficiencyEvaluator.evaluate(
        toolCalls,
        result.iterations,
        scenario.tier,
        scenario.maxToolCalls
      );
      
      // Determine if scenario passed
      const passed = accuracy.correct && 
                    toolSelection.correct && 
                    efficiency.efficient &&
                    result.completed;
      
      if (this.verbose) {
        const status = passed ? '✅' : '❌';
        console.log(`   Result: ${status} ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed) {
          if (!accuracy.correct) console.log(`     - Accuracy: ${accuracy.explanation}`);
          if (!toolSelection.correct) console.log(`     - Tool Selection: ${toolSelection.explanation}`);
          if (!efficiency.efficient) console.log(`     - Efficiency: ${efficiency.totalToolCalls}/${efficiency.targetToolCalls} calls`);
        }
      }
      
      return {
        scenario,
        passed,
        answer: result.answer,
        toolCalls: toolCalls.map(tc => ({
          name: tc.name,
          arguments: tc.arguments,
          success: tc.success,
          durationMs: tc.durationMs,
        })),
        accuracy: {
          correct: accuracy.correct,
          confidence: accuracy.confidence,
          explanation: accuracy.explanation,
        },
        toolSelection: {
          correct: toolSelection.correct,
          score: toolSelection.score,
          explanation: toolSelection.explanation,
        },
        efficiency: {
          efficient: efficiency.efficient,
          totalToolCalls: efficiency.totalToolCalls,
          targetToolCalls: efficiency.targetToolCalls,
        },
        executionTimeMs: Date.now() - startTime,
        error: result.error,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.verbose) {
        console.log(`   ❌ Error: ${errorMessage}`);
      }
      
      return {
        scenario,
        passed: false,
        answer: '',
        toolCalls: recorder.getToolCalls().map(tc => ({
          name: tc.name,
          arguments: tc.arguments,
          success: tc.success,
          durationMs: tc.durationMs,
        })),
        accuracy: {
          correct: false,
          confidence: 0,
          explanation: 'Scenario failed with error',
        },
        toolSelection: {
          correct: false,
          score: 0,
          explanation: 'Scenario failed with error',
        },
        efficiency: {
          efficient: false,
          totalToolCalls: recorder.getToolCallCount(),
          targetToolCalls: scenario.maxToolCalls ?? 5,
        },
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
  
  /**
   * Run multiple scenarios
   */
  async runScenarios(
    scenarios: TestScenario[],
    options: ScenarioRunOptions = {}
  ): Promise<ScenarioSuiteResult> {
    const filteredScenarios = this.filterScenarios(scenarios, options);
    const results: ScenarioRunResult[] = [];
    
    if (this.verbose) {
      console.log(`\n🧪 Running ${filteredScenarios.length} scenarios...`);
    }
    
    for (const scenario of filteredScenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
      
      if (options.failFast && !result.passed) {
        if (this.verbose) {
          console.log('\n⚠️ Stopping due to failFast option');
        }
        break;
      }
    }
    
    return this.aggregateResults(results);
  }
  
  /**
   * Filter scenarios based on options
   */
  private filterScenarios(
    scenarios: TestScenario[],
    options: ScenarioRunOptions
  ): TestScenario[] {
    let filtered = scenarios;
    
    // Filter by 'only'
    if (options.only && options.only.length > 0) {
      filtered = filtered.filter(s => options.only!.includes(s.id));
    }
    
    // Filter by 'skip'
    if (options.skip && options.skip.length > 0) {
      filtered = filtered.filter(s => !options.skip!.includes(s.id));
    }
    
    // Filter by tiers
    if (options.tiers && options.tiers.length > 0) {
      filtered = filtered.filter(s => options.tiers!.includes(s.tier));
    }
    
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(s => 
        s.tags && s.tags.some(t => options.tags!.includes(t))
      );
    }
    
    return filtered;
  }
  
  /**
   * Aggregate results into suite result
   */
  private aggregateResults(results: ScenarioRunResult[]): ScenarioSuiteResult {
    const passed = results.filter(r => r.passed);
    const totalToolCalls = results.reduce((sum, r) => sum + r.toolCalls.length, 0);
    const totalTime = results.reduce((sum, r) => sum + r.executionTimeMs, 0);
    
    // Calculate by tier
    const byTier: Record<ScenarioTier, { total: number; passed: number; passRate: number }> = {
      1: { total: 0, passed: 0, passRate: 0 },
      2: { total: 0, passed: 0, passRate: 0 },
      3: { total: 0, passed: 0, passRate: 0 },
    };
    
    for (const result of results) {
      const tier = result.scenario.tier;
      byTier[tier].total++;
      if (result.passed) {
        byTier[tier].passed++;
      }
    }
    
    // Calculate pass rates
    for (const tier of [1, 2, 3] as ScenarioTier[]) {
      if (byTier[tier].total > 0) {
        byTier[tier].passRate = byTier[tier].passed / byTier[tier].total;
      }
    }
    
    return {
      results,
      summary: {
        total: results.length,
        passed: passed.length,
        failed: results.length - passed.length,
        passRate: results.length > 0 ? passed.length / results.length : 0,
        avgToolCalls: results.length > 0 ? totalToolCalls / results.length : 0,
        totalExecutionTimeMs: totalTime,
      },
      byTier,
    };
  }
}

/**
 * Create a scenario runner from an ApplicationContainer
 */
export function createScenarioRunnerFromContainer(
  container: { getTool: (name: string) => { execute: (args: any) => Promise<any> }; getAllTools: () => any[] },
  apiKey: string,
  options?: { model?: string; verbose?: boolean }
): ScenarioRunner {
  const tools = container.getAllTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
  
  const toolExecutor: ToolExecutor = async (name, args) => {
    const tool = container.getTool(name);
    return tool.execute(args);
  };
  
  return new ScenarioRunner({
    agentConfig: {
      apiKey,
      model: options?.model ?? 'anthropic/claude-sonnet-4',
    },
    tools,
    toolExecutor,
    verbose: options?.verbose,
  });
}

