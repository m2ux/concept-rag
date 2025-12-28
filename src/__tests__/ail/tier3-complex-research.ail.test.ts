/**
 * Agent-in-the-Loop E2E Tests - Tier 3: Complex Research Tasks
 * 
 * Tests agent effectiveness for complex research tasks:
 * - Multi-hop reasoning
 * - Gap analysis
 * - Advanced concept exploration
 * 
 * Success Criteria:
 * - >60% pass rate
 * - ≤12 tool calls per scenario
 * - Demonstrates multi-step reasoning
 * 
 * @group ail
 * @group e2e
 * @group slow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import { ApplicationContainer } from '../../application/container.js';
import { createScenarioRunnerFromContainer, ScenarioRunner, TestScenario } from './scenarios/index.js';

// Skip if no API key available
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SKIP_AIL = !OPENROUTER_API_KEY;

/**
 * Tier 3 Test Scenarios: Complex Research Tasks
 * 
 * These scenarios test the agent's ability to perform complex
 * multi-step research across the document corpus.
 */
const TIER3_SCENARIOS: TestScenario[] = [
  {
    id: 'tier3-cross-domain-application',
    name: 'Cross-Domain Application - Strategy to Software',
    tier: 3,
    goal: 'What strategic principles from Sun Tzu\'s Art of War could be applied to software architecture design? Find connections between these domains.',
    groundTruth: {
      keyPoints: [
        'Identifies principles from Art of War',
        'Relates to software or architecture concepts',
        'Makes meaningful connections between domains',
        'Cites both sources',
      ],
    },
    expectedTools: ['catalog_search', 'chunks_search', 'broad_chunks_search'],
    maxToolCalls: 12,
    description: 'Tests cross-domain reasoning and synthesis',
    tags: ['cross-domain', 'multi-hop'],
  },
  {
    id: 'tier3-concept-deep-dive',
    name: 'Concept Deep Dive - Dependency Inversion',
    tier: 3,
    goal: 'Explore the concept of dependency inversion in my library. What sources discuss it, what related concepts are there, and how is it explained?',
    groundTruth: {
      keyPoints: [
        'Identifies sources discussing dependency inversion',
        'Explains what dependency inversion means',
        'Mentions related concepts like dependency injection or IoC',
        'Provides examples or context from the documents',
      ],
    },
    expectedTools: ['concept_search', 'source_concepts', 'chunks_search'],
    maxToolCalls: 12,
    description: 'Tests deep exploration of a single concept',
    tags: ['concept-exploration', 'deep-dive'],
  },
  {
    id: 'tier3-domain-concepts',
    name: 'Domain Concepts - Software Engineering',
    tier: 3,
    goal: 'What are the key concepts discussed in software engineering or architecture books in my library? Use the category tools to explore.',
    groundTruth: {
      keyPoints: [
        'Uses category-related tools',
        'Identifies software engineering category or similar',
        'Lists key concepts from that domain',
        'Provides some context about the concepts',
      ],
    },
    expectedTools: ['list_categories', 'category_search', 'list_concepts_in_category'],
    maxToolCalls: 10,
    description: 'Tests category-based concept exploration',
    tags: ['category-exploration', 'concepts'],
  },
];

describe('AIL Tier 3: Complex Research Tasks', () => {
  let container: ApplicationContainer;
  let runner: ScenarioRunner;
  
  // Check if test database exists
  // Use AIL_TEST_DB env var or default to db/test
  const testDbPath = process.env.AIL_TEST_DB || './db/test';
  const testDbExists = fs.existsSync(testDbPath);
  
  beforeAll(async () => {
    if (SKIP_AIL) {
      console.warn('⚠️  AIL tests skipped: OPENROUTER_API_KEY not set');
      return;
    }
    
    if (!testDbExists) {
      console.warn('⚠️  Test database not found at ./db/test');
      console.warn('   Run: ./scripts/seed-test-database.sh');
      return;
    }
    
    // Initialize container with test database
    container = new ApplicationContainer();
    await container.initialize(testDbPath);
    
    // Create scenario runner
    runner = createScenarioRunnerFromContainer(
      container,
      OPENROUTER_API_KEY!,
      { 
        model: 'anthropic/claude-sonnet-4',
        verbose: true,
      }
    );
  }, 60000);
  
  afterAll(async () => {
    if (container) {
      await container.close();
    }
  });
  
  // Skip all tests if prerequisites not met
  const shouldSkip = SKIP_AIL || !testDbExists;
  
  describe.skipIf(shouldSkip)('Tier 3 Scenarios', () => {
    
    it('should find cross-domain connections between Art of War and software', async () => {
      const scenario = TIER3_SCENARIOS.find(s => s.id === 'tier3-cross-domain-application')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        tools: result.toolCalls.map(tc => tc.name),
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 400) + '...',
      });
      
      // Assertions - Tier 3 allows more flexibility
      expect(result.toolCalls.length).toBeLessThanOrEqual(12);
      // Log but don't strictly fail on accuracy for complex scenarios
      if (!result.accuracy.correct) {
        console.log('   ⚠️ Accuracy check failed:', result.accuracy.explanation);
      }
    }, 240000);
    
    it('should deeply explore dependency inversion concept', async () => {
      const scenario = TIER3_SCENARIOS.find(s => s.id === 'tier3-concept-deep-dive')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        tools: result.toolCalls.map(tc => tc.name),
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 400) + '...',
      });
      
      // Assertions
      expect(result.toolCalls.length).toBeLessThanOrEqual(12);
    }, 240000);
    
    it('should explore domain concepts via categories', async () => {
      const scenario = TIER3_SCENARIOS.find(s => s.id === 'tier3-domain-concepts')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        tools: result.toolCalls.map(tc => tc.name),
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 400) + '...',
      });
      
      // Assertions
      expect(result.toolCalls.length).toBeLessThanOrEqual(10);
    }, 240000);
    
    it('should achieve >60% pass rate for all Tier 3 scenarios', async () => {
      const results = await runner.runScenarios(TIER3_SCENARIOS);
      
      console.log('\n📈 Tier 3 Summary:', {
        total: results.summary.total,
        passed: results.summary.passed,
        passRate: `${(results.summary.passRate * 100).toFixed(1)}%`,
        avgToolCalls: results.summary.avgToolCalls.toFixed(1),
      });
      
      // Tier 3 target: >60% pass rate
      expect(results.summary.passRate).toBeGreaterThan(0.6);
      
      // Average tool calls should be ≤12
      expect(results.summary.avgToolCalls).toBeLessThanOrEqual(12);
    }, 900000);
  });
});

// Export scenarios for reuse
export { TIER3_SCENARIOS };

