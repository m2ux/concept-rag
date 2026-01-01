/**
 * Agent-in-the-Loop Testing - Tool Selection Evaluator
 * 
 * Evaluates whether the agent selected appropriate tools based on
 * the Tool Selection Guide patterns.
 */

import { ToolCall } from '../agent/types.js';
import { ToolSelectionResult } from './types.js';

/**
 * Tool selection patterns from the Tool Selection Guide
 * Maps query patterns to expected tool workflows
 */
const TOOL_SELECTION_PATTERNS: Array<{
  pattern: RegExp;
  expectedTools: string[];
  description: string;
}> = [
  // Document discovery
  {
    pattern: /what documents|find documents|documents about|books about/i,
    expectedTools: ['catalog_search'],
    description: 'Document discovery queries should use catalog_search',
  },
  // Category browsing
  {
    pattern: /what categories|list categories|browse categories/i,
    expectedTools: ['list_categories'],
    description: 'Category listing should use list_categories',
  },
  {
    pattern: /documents in .+ category|browse .+ category|show .+ category/i,
    expectedTools: ['category_search'],
    description: 'Category browsing should use category_search',
  },
  {
    pattern: /concepts in .+ category|what concepts are in/i,
    expectedTools: ['list_concepts_in_category'],
    description: 'Concepts in category should use list_concepts_in_category',
  },
  // Concept tracking
  {
    pattern: /which (?:books|documents|sources) (?:discuss|mention|cover)\s+(\w+)/i,
    expectedTools: ['source_concepts'],
    description: 'Source attribution queries should use source_concepts',
  },
  // Single concept search
  {
    pattern: /^(?:find|search for|locate)?\s*["']?(\w+)["']?\s*$/i,
    expectedTools: ['concept_search'],
    description: 'Single concept queries should use concept_search',
  },
  // Extract concepts
  {
    pattern: /extract concepts|list concepts|show concepts|export concepts/i,
    expectedTools: ['extract_concepts'],
    description: 'Concept extraction should use extract_concepts',
  },
  // Specific document search (with known source)
  {
    pattern: /search (?:in|within) .+|find in .+ (?:book|document)/i,
    expectedTools: ['catalog_search', 'chunks_search'],
    description: 'Known document search should use catalog_search → chunks_search',
  },
  // Cross-document research
  {
    pattern: /compare .+ across|how do .+ differ|what do .+ say about/i,
    expectedTools: ['broad_chunks_search'],
    description: 'Cross-document comparison should use broad_chunks_search',
  },
  // Natural language questions
  {
    pattern: /how does|what is the|explain .+ from|describe/i,
    expectedTools: ['catalog_search', 'chunks_search'],
    description: 'Explanatory questions should use catalog_search → chunks_search workflow',
  },
];

/**
 * Tools that are always valid (should not be penalized)
 */
const ALWAYS_VALID_TOOLS = ['get_guidance'];

/**
 * Recommended tool workflows (get_guidance can always prefix these)
 */
const VALID_WORKFLOWS: string[][] = [
  ['catalog_search'],
  ['catalog_search', 'chunks_search'],
  ['catalog_search', 'chunks_search', 'chunks_search'],
  ['list_categories'],
  ['list_categories', 'category_search'],
  ['category_search'],
  ['category_search', 'chunks_search'],
  ['concept_search'],
  ['source_concepts'],
  ['concept_sources'],
  ['broad_chunks_search'],
  ['extract_concepts'],
  ['list_concepts_in_category'],
];

/**
 * Evaluates tool selection quality
 */
export class ToolSelectionEvaluator {
  /**
   * Evaluate tool selection for a query
   * 
   * @param query - The original query/goal
   * @param toolCalls - The tool calls made by the agent
   * @param expectedTools - Optional explicit expected tools (overrides pattern matching)
   * @returns Tool selection evaluation result
   */
  evaluate(
    query: string,
    toolCalls: ToolCall[],
    expectedTools?: string[]
  ): ToolSelectionResult {
    const actualTools = toolCalls.map(tc => tc.name);
    const uniqueActualTools = Array.from(new Set(actualTools));
    
    // Determine expected tools from patterns if not provided
    const expected = expectedTools || this.inferExpectedTools(query);
    
    // Calculate matches (always-valid tools like get_guidance don't count as unexpected)
    const correctTools = uniqueActualTools.filter(t => expected.includes(t));
    const unexpectedTools = uniqueActualTools.filter(t => 
      !expected.includes(t) && !ALWAYS_VALID_TOOLS.includes(t)
    );
    const missingTools = expected.filter(t => 
      !uniqueActualTools.includes(t) && !ALWAYS_VALID_TOOLS.includes(t)
    );
    
    // Calculate score
    // - Full credit for using expected tools
    // - Partial penalty for missing expected tools
    // - Small penalty for unexpected tools (they may still be valid)
    const expectedCoverage = expected.length > 0 
      ? correctTools.length / expected.length 
      : 1.0;
    const unexpectedPenalty = unexpectedTools.length * 0.1;
    const score = Math.max(0, Math.min(1, expectedCoverage - unexpectedPenalty));
    
    // Check if workflow is valid
    const isValidWorkflow = this.isValidWorkflow(actualTools);
    
    // Determine correctness
    // Correct if: all expected tools used OR workflow is valid with reasonable efficiency
    const correct = (missingTools.length === 0 && score >= 0.7) || 
                   (isValidWorkflow && correctTools.length > 0);
    
    return {
      correct,
      score,
      expectedTools: expected,
      actualTools: uniqueActualTools,
      correctTools,
      unexpectedTools,
      missingTools,
      explanation: this.generateExplanation(correct, correctTools, missingTools, unexpectedTools, isValidWorkflow),
    };
  }
  
  /**
   * Infer expected tools from query patterns
   */
  private inferExpectedTools(query: string): string[] {
    for (const { pattern, expectedTools } of TOOL_SELECTION_PATTERNS) {
      if (pattern.test(query)) {
        return expectedTools;
      }
    }
    
    // Default: expect at least catalog_search or broad_chunks_search
    return ['catalog_search'];
  }
  
  /**
   * Check if the tool sequence is a valid workflow
   */
  private isValidWorkflow(tools: string[]): boolean {
    // Empty is valid (though not useful)
    if (tools.length === 0) return true;
    
    // Filter out always-valid tools (like get_guidance) before checking workflow
    const filteredTools = tools.filter(t => !ALWAYS_VALID_TOOLS.includes(t));
    if (filteredTools.length === 0) return true;
    
    // Normalize to unique tools in order
    const normalizedTools: string[] = [];
    for (const tool of filteredTools) {
      if (normalizedTools.length === 0 || normalizedTools[normalizedTools.length - 1] !== tool) {
        normalizedTools.push(tool);
      }
    }
    
    // Check against valid workflows
    for (const workflow of VALID_WORKFLOWS) {
      if (this.matchesWorkflow(normalizedTools, workflow)) {
        return true;
      }
    }
    
    // Also valid if it's a subset/prefix of a valid workflow
    for (const workflow of VALID_WORKFLOWS) {
      if (normalizedTools.length <= workflow.length) {
        const prefix = workflow.slice(0, normalizedTools.length);
        if (this.arraysEqual(normalizedTools, prefix)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if tools match a workflow (allowing repetition)
   */
  private matchesWorkflow(tools: string[], workflow: string[]): boolean {
    if (tools.length === 0) return workflow.length === 0;
    
    let workflowIdx = 0;
    for (const tool of tools) {
      // Tool must match current or future workflow step
      while (workflowIdx < workflow.length && workflow[workflowIdx] !== tool) {
        workflowIdx++;
      }
      if (workflowIdx >= workflow.length) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Check if two arrays are equal
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
  
  /**
   * Generate explanation for the evaluation
   */
  private generateExplanation(
    correct: boolean,
    correctTools: string[],
    missingTools: string[],
    unexpectedTools: string[],
    isValidWorkflow: boolean
  ): string {
    const parts: string[] = [];
    
    if (correct) {
      parts.push('Tool selection was appropriate.');
    } else {
      parts.push('Tool selection needs improvement.');
    }
    
    if (correctTools.length > 0) {
      parts.push(`Correctly used: ${correctTools.join(', ')}.`);
    }
    
    if (missingTools.length > 0) {
      parts.push(`Missing expected tools: ${missingTools.join(', ')}.`);
    }
    
    if (unexpectedTools.length > 0) {
      parts.push(`Additional tools used: ${unexpectedTools.join(', ')}.`);
    }
    
    if (!isValidWorkflow) {
      parts.push('Tool sequence does not follow recommended workflows.');
    }
    
    return parts.join(' ');
  }
}

