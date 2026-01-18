/**
 * Agent-in-the-Loop E2E Tests - Tier 2: Cross-Document Synthesis
 * 
 * Tests agent effectiveness for cross-document synthesis tasks:
 * - Concept comparison across documents
 * - Source aggregation
 * - Theme identification
 * 
 * Success Criteria:
 * - >75% pass rate
 * - ≤8 tool calls per scenario
 * - Multiple sources cited
 * 
 * @group ail
 * @group e2e
 * @group slow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import { ApplicationContainer } from '../../application/container.js';
import { createScenarioRunnerFromContainer, ScenarioRunner, TestScenario } from './scenarios/index.js';
import { getAILConfig } from './config.js';

// Load configuration
const config = getAILConfig();
// Skip unless explicitly enabled via AIL_TESTS=true (prevents CI failures)
const SKIP_AIL = process.env.AIL_TESTS !== 'true' || !config.apiKey;

/**
 * Tier 2 Test Scenarios: Cross-Document Synthesis
 * 
 * These scenarios test the agent's ability to find and synthesize
 * information across multiple documents.
 */
const TIER2_SCENARIOS: TestScenario[] = [
  {
    id: 'tier2-design-patterns-sources',
    name: 'Source Aggregation - Design Patterns',
    tier: 2,
    goal: 'Which documents in my library discuss design patterns? List the sources that cover design patterns.',
    groundTruth: {
      keyPoints: [
        'Identifies documents that discuss design patterns',
        'Mentions the Gang of Four or Design Patterns book',
        'Lists specific source documents or titles with authors',
      ],
    },
    expectedTools: ['source_concepts', 'catalog_search'],
    maxToolCalls: 9,
    description: 'Tests finding multiple sources for a concept',
    tags: ['source-aggregation', 'design-patterns'],
  },
  {
    id: 'tier2-architecture-themes',
    name: 'Theme Identification - Software Architecture',
    tier: 2,
    goal: 'What common themes or principles appear across software architecture documents in my library?',
    groundTruth: {
      keyPoints: [
        'Separation of concerns',
        'Dependency management or inversion',
        'Modularity or component design',
        'Abstraction layers',
      ],
    },
    expectedTools: ['broad_chunks_search', 'catalog_search'],
    maxToolCalls: 9,
    description: 'Tests identifying themes across documents',
    tags: ['theme-identification', 'architecture'],
  },
  {
    id: 'tier2-category-exploration',
    name: 'Category Exploration - Available Categories',
    tier: 2,
    goal: 'What categories of documents do I have in my library? Explore the different subject areas.',
    groundTruth: {
      keyPoints: [
        'Lists multiple categories or subject areas',
        'Includes software or programming related categories',
        'Shows document counts or category statistics',
      ],
    },
    expectedTools: ['list_categories'],
    maxToolCalls: 6,
    description: 'Tests category discovery and exploration',
    tags: ['category-exploration'],
  },
];

describe('AIL Tier 2: Cross-Document Synthesis', () => {
  let container: ApplicationContainer;
  let runner: ScenarioRunner;
  
  // Check if test database exists
  const testDbExists = fs.existsSync(config.databasePath);
  
  beforeAll(async () => {
    if (SKIP_AIL) {
      console.warn('⚠️  AIL tests skipped: OPENROUTER_API_KEY not set');
      return;
    }
    
    if (!testDbExists) {
      console.warn(`⚠️  Test database not found at ${config.databasePath}`);
      console.warn('   Run: ./scripts/seed-test-database.sh');
      return;
    }
    
    // Initialize container with test database
    container = new ApplicationContainer();
    await container.initialize(config.databasePath);
    
    // Create scenario runner with config
    runner = createScenarioRunnerFromContainer(
      container,
      config.apiKey,
      { 
        model: config.model,
        verbose: config.verbose,
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
  
  describe.skipIf(shouldSkip)('Tier 2 Scenarios', () => {
    
    it('should find multiple sources discussing design patterns', async () => {
      const scenario = TIER2_SCENARIOS.find(s => s.id === 'tier2-design-patterns-sources')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 300) + '...',
      });
      
      // Assertions
      expect(result.accuracy.correct).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(12);
    }, 180000);
    
    it('should identify common themes across architecture documents', async () => {
      const scenario = TIER2_SCENARIOS.find(s => s.id === 'tier2-architecture-themes')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 300) + '...',
      });
      
      // Assertions
      expect(result.accuracy.correct).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(12);
    }, 180000);
    
    it('should explore and list library categories', async () => {
      const scenario = TIER2_SCENARIOS.find(s => s.id === 'tier2-category-exploration')!;
      const result = await runner.runScenario(scenario);
      
      console.log('\n📊 Result:', {
        passed: result.passed,
        toolCalls: result.toolCalls.length,
        accuracy: result.accuracy.confidence,
        answer: result.answer.substring(0, 300) + '...',
      });
      
      // Assertions
      expect(result.accuracy.correct).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(12);
    }, 180000);
    
    it('should achieve >75% pass rate for all Tier 2 scenarios', async () => {
      const results = await runner.runScenarios(TIER2_SCENARIOS);
      
      console.log('\n📈 Tier 2 Summary:', {
        total: results.summary.total,
        passed: results.summary.passed,
        passRate: `${(results.summary.passRate * 100).toFixed(1)}%`,
        avgToolCalls: results.summary.avgToolCalls.toFixed(1),
      });
      
      // Tier 2 target: >75% pass rate
      expect(results.summary.passRate).toBeGreaterThan(0.75);
      
      // Average tool calls should be ≤8
      expect(results.summary.avgToolCalls).toBeLessThanOrEqual(12);
    }, 600000);
  });
});

// Export scenarios for reuse
export { TIER2_SCENARIOS };

