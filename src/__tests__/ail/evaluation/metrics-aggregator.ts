/**
 * Agent-in-the-Loop Testing - Metrics Aggregator
 * 
 * Aggregates evaluation results across multiple scenarios.
 */

import { ScenarioEvaluationResult, AggregatedMetrics, TierMetrics } from './types.js';

/**
 * Aggregates metrics from multiple scenario evaluations
 */
export class MetricsAggregator {
  private results: ScenarioEvaluationResult[] = [];
  
  /**
   * Add a scenario result
   */
  addResult(result: ScenarioEvaluationResult): void {
    this.results.push(result);
  }
  
  /**
   * Add multiple scenario results
   */
  addResults(results: ScenarioEvaluationResult[]): void {
    this.results.push(...results);
  }
  
  /**
   * Get aggregated metrics
   */
  getMetrics(): AggregatedMetrics {
    if (this.results.length === 0) {
      return this.emptyMetrics();
    }
    
    const passed = this.results.filter(r => r.passed);
    const toolUsageStats = this.calculateToolUsage();
    const byTier = this.calculateTierMetrics();
    
    return {
      totalScenarios: this.results.length,
      passedScenarios: passed.length,
      passRate: passed.length / this.results.length,
      avgAccuracyConfidence: this.average(this.results.map(r => r.accuracy.confidence)),
      toolSelectionCorrectness: this.results.filter(r => r.toolSelection.correct).length / this.results.length,
      avgToolCalls: this.average(this.results.map(r => r.toolCalls.length)),
      efficiencyRate: this.results.filter(r => r.efficiency.efficient).length / this.results.length,
      toolUsageStats,
      byTier,
    };
  }
  
  /**
   * Get all results
   */
  getResults(): ScenarioEvaluationResult[] {
    return [...this.results];
  }
  
  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
  }
  
  /**
   * Generate a summary report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [
      '# Agent-in-the-Loop Test Report',
      '',
      '## Summary',
      `- **Total Scenarios:** ${metrics.totalScenarios}`,
      `- **Passed:** ${metrics.passedScenarios} (${(metrics.passRate * 100).toFixed(1)}%)`,
      `- **Avg Accuracy Confidence:** ${(metrics.avgAccuracyConfidence * 100).toFixed(1)}%`,
      `- **Tool Selection Correctness:** ${(metrics.toolSelectionCorrectness * 100).toFixed(1)}%`,
      `- **Avg Tool Calls:** ${metrics.avgToolCalls.toFixed(1)}`,
      `- **Efficiency Rate:** ${(metrics.efficiencyRate * 100).toFixed(1)}%`,
      '',
      '## Results by Tier',
    ];
    
    for (const [tierKey, tierMetrics] of Object.entries(metrics.byTier)) {
      lines.push(`### Tier ${tierMetrics.tier}`);
      lines.push(`- Scenarios: ${tierMetrics.totalScenarios}`);
      lines.push(`- Passed: ${tierMetrics.passedScenarios} (${(tierMetrics.passRate * 100).toFixed(1)}%)`);
      lines.push(`- Avg Tool Calls: ${tierMetrics.avgToolCalls.toFixed(1)}`);
      lines.push('');
    }
    
    lines.push('## Tool Usage');
    const sortedTools = Object.entries(metrics.toolUsageStats)
      .sort((a, b) => b[1] - a[1]);
    for (const [tool, count] of sortedTools) {
      lines.push(`- ${tool}: ${count} calls`);
    }
    
    lines.push('');
    lines.push('## Individual Results');
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      lines.push(`- ${status} **${result.scenarioId}**: ${result.toolCalls.length} tool calls, accuracy: ${(result.accuracy.confidence * 100).toFixed(0)}%`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Calculate tool usage statistics
   */
  private calculateToolUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    
    for (const result of this.results) {
      for (const call of result.toolCalls) {
        usage[call.name] = (usage[call.name] || 0) + 1;
      }
    }
    
    return usage;
  }
  
  /**
   * Calculate metrics by tier
   */
  private calculateTierMetrics(): Record<string, TierMetrics> {
    const byTier: Record<string, TierMetrics> = {};
    
    // Group by tier (extract from scenarioId, e.g., "tier1-fact-lookup")
    const grouped = new Map<number, ScenarioEvaluationResult[]>();
    for (const result of this.results) {
      const tierMatch = result.scenarioId.match(/tier(\d)/i);
      const tier = tierMatch ? parseInt(tierMatch[1]) : 1;
      const existing = grouped.get(tier) || [];
      existing.push(result);
      grouped.set(tier, existing);
    }
    
    for (const [tier, results] of Array.from(grouped)) {
      const passed = results.filter(r => r.passed);
      byTier[`tier${tier}`] = {
        tier,
        totalScenarios: results.length,
        passedScenarios: passed.length,
        passRate: results.length > 0 ? passed.length / results.length : 0,
        avgToolCalls: this.average(results.map(r => r.toolCalls.length)),
      };
    }
    
    return byTier;
  }
  
  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * Return empty metrics
   */
  private emptyMetrics(): AggregatedMetrics {
    return {
      totalScenarios: 0,
      passedScenarios: 0,
      passRate: 0,
      avgAccuracyConfidence: 0,
      toolSelectionCorrectness: 0,
      avgToolCalls: 0,
      efficiencyRate: 0,
      toolUsageStats: {},
      byTier: {},
    };
  }
}

