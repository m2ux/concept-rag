/**
 * Agent-in-the-Loop Testing - Evaluation Types
 * 
 * Type definitions for the evaluation engine.
 */

import { AgentExecutionResult, ToolCall } from '../agent/types.js';

/**
 * Result of an accuracy evaluation
 */
export interface AccuracyResult {
  /** Whether the agent's answer is correct */
  correct: boolean;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Explanation of the evaluation */
  explanation: string;
  
  /** Key points from ground truth that were covered */
  coveredPoints: string[];
  
  /** Key points from ground truth that were missed */
  missedPoints: string[];
}

/**
 * Result of a tool selection evaluation
 */
export interface ToolSelectionResult {
  /** Whether tool selection was correct */
  correct: boolean;
  
  /** Score (0-1) based on tool selection quality */
  score: number;
  
  /** Tools that were expected to be used */
  expectedTools: string[];
  
  /** Tools that were actually used */
  actualTools: string[];
  
  /** Tools that were correctly used */
  correctTools: string[];
  
  /** Tools that were used but not expected (may not be wrong) */
  unexpectedTools: string[];
  
  /** Tools that were expected but not used */
  missingTools: string[];
  
  /** Explanation of the evaluation */
  explanation: string;
}

/**
 * Result of an efficiency evaluation
 */
export interface EfficiencyResult {
  /** Whether efficiency targets were met */
  efficient: boolean;
  
  /** Total number of tool calls */
  totalToolCalls: number;
  
  /** Target number of tool calls */
  targetToolCalls: number;
  
  /** Number of unique tools used */
  uniqueToolsUsed: number;
  
  /** Number of LLM iterations */
  iterations: number;
  
  /** Average tool calls per iteration */
  avgCallsPerIteration: number;
  
  /** Whether there were redundant calls (same tool, same args) */
  hasRedundantCalls: boolean;
  
  /** Number of redundant calls */
  redundantCallCount: number;
}

/**
 * Combined evaluation result for a scenario
 */
export interface ScenarioEvaluationResult {
  /** Scenario identifier */
  scenarioId: string;
  
  /** Whether the scenario passed overall */
  passed: boolean;
  
  /** Accuracy evaluation result */
  accuracy: AccuracyResult;
  
  /** Tool selection evaluation result */
  toolSelection: ToolSelectionResult;
  
  /** Efficiency evaluation result */
  efficiency: EfficiencyResult;
  
  /** The agent's final answer */
  answer: string;
  
  /** All tool calls made */
  toolCalls: ToolCall[];
  
  /** Total execution time in ms */
  executionTimeMs: number;
  
  /** Any error that occurred */
  error?: string;
}

/**
 * Aggregated metrics across multiple scenarios
 */
export interface AggregatedMetrics {
  /** Total scenarios evaluated */
  totalScenarios: number;
  
  /** Number of passed scenarios */
  passedScenarios: number;
  
  /** Pass rate (0-1) */
  passRate: number;
  
  /** Average accuracy confidence */
  avgAccuracyConfidence: number;
  
  /** Tool selection correctness rate */
  toolSelectionCorrectness: number;
  
  /** Average tool calls per scenario */
  avgToolCalls: number;
  
  /** Efficiency rate (scenarios meeting target) */
  efficiencyRate: number;
  
  /** Most used tools */
  toolUsageStats: Record<string, number>;
  
  /** Results by tier */
  byTier: Record<string, TierMetrics>;
}

/**
 * Metrics for a specific tier
 */
export interface TierMetrics {
  tier: number;
  totalScenarios: number;
  passedScenarios: number;
  passRate: number;
  avgToolCalls: number;
}

/**
 * Configuration for accuracy evaluation
 */
export interface AccuracyEvaluatorConfig {
  /** API key for LLM-as-judge */
  apiKey: string;
  
  /** Model to use for evaluation */
  model?: string;
  
  /** Temperature for evaluation */
  temperature?: number;
}

/**
 * Ground truth definition for a scenario
 */
export interface GroundTruth {
  /** Key points that should be in the answer */
  keyPoints: string[];
  
  /** Optional: exact phrases that should appear */
  requiredPhrases?: string[];
  
  /** Optional: sources that should be cited */
  expectedSources?: string[];
}

