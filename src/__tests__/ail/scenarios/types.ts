/**
 * Agent-in-the-Loop Testing - Scenario Types
 * 
 * Type definitions for test scenarios.
 */

import { GroundTruth } from '../evaluation/types.js';

/**
 * Test scenario tier
 */
export type ScenarioTier = 1 | 2 | 3;

/**
 * Test scenario definition
 */
export interface TestScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Tier level (1, 2, or 3) */
  tier: ScenarioTier;
  
  /** The goal/question for the agent */
  goal: string;
  
  /** Ground truth for accuracy evaluation */
  groundTruth: GroundTruth;
  
  /** Expected tools to be used (for tool selection evaluation) */
  expectedTools: string[];
  
  /** Maximum tool calls allowed (overrides tier default) */
  maxToolCalls?: number;
  
  /** Description of what this scenario tests */
  description?: string;
  
  /** Tags for filtering/grouping */
  tags?: string[];
}

/**
 * Scenario execution options
 */
export interface ScenarioRunOptions {
  /** Skip scenarios with these IDs */
  skip?: string[];
  
  /** Only run scenarios with these IDs */
  only?: string[];
  
  /** Only run scenarios with these tags */
  tags?: string[];
  
  /** Only run scenarios in these tiers */
  tiers?: ScenarioTier[];
  
  /** Verbose logging */
  verbose?: boolean;
  
  /** Stop on first failure */
  failFast?: boolean;
}

/**
 * Result of running a single scenario
 */
export interface ScenarioRunResult {
  /** The scenario that was run */
  scenario: TestScenario;
  
  /** Whether the scenario passed */
  passed: boolean;
  
  /** The agent's answer */
  answer: string;
  
  /** Tool calls made */
  toolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
    success: boolean;
    durationMs: number;
  }>;
  
  /** Accuracy evaluation */
  accuracy: {
    correct: boolean;
    confidence: number;
    explanation: string;
  };
  
  /** Tool selection evaluation */
  toolSelection: {
    correct: boolean;
    score: number;
    explanation: string;
  };
  
  /** Efficiency evaluation */
  efficiency: {
    efficient: boolean;
    totalToolCalls: number;
    targetToolCalls: number;
  };
  
  /** Execution time in ms */
  executionTimeMs: number;
  
  /** Error if failed */
  error?: string;
}

/**
 * Result of running multiple scenarios
 */
export interface ScenarioSuiteResult {
  /** All scenario results */
  results: ScenarioRunResult[];
  
  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    avgToolCalls: number;
    totalExecutionTimeMs: number;
  };
  
  /** Results by tier */
  byTier: Record<ScenarioTier, {
    total: number;
    passed: number;
    passRate: number;
  }>;
}

