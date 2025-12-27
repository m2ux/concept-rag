/**
 * Agent-in-the-Loop Testing - Efficiency Evaluator
 * 
 * Evaluates the efficiency of the agent's tool usage.
 */

import { ToolCall } from '../agent/types.js';
import { EfficiencyResult } from './types.js';

/**
 * Default tool call limits by tier
 */
export const TIER_LIMITS = {
  1: 5,  // Tier 1: Single-document, max 5 calls
  2: 8,  // Tier 2: Cross-document, max 8 calls
  3: 12, // Tier 3: Complex research, max 12 calls
};

/**
 * Evaluates agent efficiency
 */
export class EfficiencyEvaluator {
  /**
   * Evaluate efficiency of tool usage
   * 
   * @param toolCalls - The tool calls made by the agent
   * @param iterations - Number of LLM iterations
   * @param tier - The scenario tier (1, 2, or 3)
   * @param targetToolCalls - Optional custom target (overrides tier default)
   * @returns Efficiency evaluation result
   */
  evaluate(
    toolCalls: ToolCall[],
    iterations: number,
    tier: 1 | 2 | 3 = 1,
    targetToolCalls?: number
  ): EfficiencyResult {
    const target = targetToolCalls ?? TIER_LIMITS[tier];
    const totalToolCalls = toolCalls.length;
    const uniqueToolsUsed = this.countUniqueTools(toolCalls);
    const { hasRedundant, count: redundantCount } = this.findRedundantCalls(toolCalls);
    
    const avgCallsPerIteration = iterations > 0 
      ? totalToolCalls / iterations 
      : totalToolCalls;
    
    // Efficient if within target and no excessive redundancy
    const efficient = totalToolCalls <= target && redundantCount <= 1;
    
    return {
      efficient,
      totalToolCalls,
      targetToolCalls: target,
      uniqueToolsUsed,
      iterations,
      avgCallsPerIteration: Math.round(avgCallsPerIteration * 100) / 100,
      hasRedundantCalls: hasRedundant,
      redundantCallCount: redundantCount,
    };
  }
  
  /**
   * Count unique tools used
   */
  private countUniqueTools(toolCalls: ToolCall[]): number {
    const unique = new Set(toolCalls.map(tc => tc.name));
    return unique.size;
  }
  
  /**
   * Find redundant tool calls (same tool with same arguments)
   */
  private findRedundantCalls(toolCalls: ToolCall[]): { hasRedundant: boolean; count: number } {
    const seen = new Map<string, number>();
    let redundantCount = 0;
    
    for (const call of toolCalls) {
      const key = this.createCallKey(call);
      const count = seen.get(key) || 0;
      if (count > 0) {
        redundantCount++;
      }
      seen.set(key, count + 1);
    }
    
    return {
      hasRedundant: redundantCount > 0,
      count: redundantCount,
    };
  }
  
  /**
   * Create a unique key for a tool call
   */
  private createCallKey(call: ToolCall): string {
    const sortedArgs = Object.keys(call.arguments)
      .sort()
      .map(k => `${k}:${JSON.stringify(call.arguments[k])}`)
      .join('|');
    return `${call.name}::${sortedArgs}`;
  }
}

