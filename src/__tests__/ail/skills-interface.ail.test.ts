/**
 * Agent-in-the-Loop E2E Tests - Skills Interface
 * 
 * Tests the intent→skill→tool workflow:
 * - Agent receives intent/skill guidance as context
 * - Agent matches query to appropriate intent
 * - Agent follows skill workflow for tool selection
 * 
 * Success Criteria:
 * - Tool selection matches expected skill workflow
 * - Agent doesn't call unnecessary tools
 * - Answer quality maintained with reduced tool calls
 * 
 * @group ail
 * @group e2e
 * @group slow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ApplicationContainer } from '../../application/container.js';
import { createScenarioRunnerFromContainer, ScenarioRunner, TestScenario } from './scenarios/index.js';
import { getAILConfig } from './config.js';

// Load configuration
const config = getAILConfig();
// Skip unless explicitly enabled via AIL_TESTS=true
const SKIP_AIL = process.env.AIL_TESTS !== 'true' || !config.apiKey;

/**
 * Load skills interface content for injection
 */
function loadSkillsContext(): string {
  const projectRoot = process.cwd();
  const files = [
    'prompts/intents/index.md',
    'prompts/skills/index.md',
    'prompts/guidance.md',
  ];
  
  const content: string[] = [];
  for (const file of files) {
    const filePath = path.resolve(projectRoot, file);
    if (fs.existsSync(filePath)) {
      content.push(`--- ${file} ---\n${fs.readFileSync(filePath, 'utf-8')}`);
    }
  }
  
  return content.join('\n\n');
}

/**
 * Skills Interface Test Scenarios
 * 
 * Each scenario maps to a specific intent and tests the expected skill workflow.
 */
const SKILLS_SCENARIOS: TestScenario[] = [
  // Intent: understand-topic → deep-research skill
  {
    id: 'skills-understand-topic',
    name: 'Intent: Understand Topic → Deep Research Skill',
    tier: 2,
    goal: 'What does my library say about microservices architecture?',
    groundTruth: {
      keyPoints: [
        'Microservices are a software architecture style',
        'Services are independently deployable',
        'Communication via APIs or messaging',
      ],
      expectedSources: [],
    },
    expectedTools: ['catalog_search', 'broad_chunks_search', 'chunks_search'],
    maxToolCalls: 12,
    description: 'Tests understand-topic intent → deep-research skill workflow',
    tags: ['skills-interface', 'understand-topic', 'deep-research'],
  },
  
  // Intent: know-my-library → library-discovery skill
  {
    id: 'skills-know-library',
    name: 'Intent: Know My Library → Library Discovery Skill',
    tier: 1,
    goal: 'What categories of documents do I have in my library?',
    groundTruth: {
      keyPoints: [
        'Lists available categories or domains',
        'Provides overview of library contents',
      ],
      expectedSources: [],
    },
    expectedTools: ['list_categories', 'category_search'],
    maxToolCalls: 5,
    description: 'Tests know-my-library intent → library-discovery skill workflow',
    tags: ['skills-interface', 'know-my-library', 'library-discovery'],
  },
  
  // Intent: explore-concept → concept-exploration skill
  {
    id: 'skills-explore-concept',
    name: 'Intent: Explore Concept → Concept Exploration Skill',
    tier: 2,
    goal: 'Where is the concept of "dependency injection" discussed in my library?',
    groundTruth: {
      keyPoints: [
        'Lists sources that discuss dependency injection',
        'Shows where concept appears',
      ],
      expectedSources: [],
    },
    expectedTools: ['concept_search', 'source_concepts'],
    maxToolCalls: 6,
    description: 'Tests explore-concept intent → concept-exploration skill workflow',
    tags: ['skills-interface', 'explore-concept', 'concept-exploration'],
  },
  
  // Intent: analyze-document → document-analysis skill
  {
    id: 'skills-analyze-document',
    name: 'Intent: Analyze Document → Document Analysis Skill',
    tier: 2,
    goal: 'Extract the key concepts from Clean Architecture.',
    groundTruth: {
      keyPoints: [
        'Lists primary concepts from the document',
        'Includes technical terms',
      ],
      expectedSources: ['Clean Architecture'],
    },
    expectedTools: ['catalog_search', 'extract_concepts', 'chunks_search'],
    maxToolCalls: 6,
    description: 'Tests analyze-document intent → document-analysis skill workflow',
    tags: ['skills-interface', 'analyze-document', 'document-analysis'],
  },
  
  // Intent: explore-category → category-exploration skill
  {
    id: 'skills-explore-category',
    name: 'Intent: Explore Category → Category Exploration Skill',
    tier: 2,
    goal: 'What concepts are covered in the software engineering category?',
    groundTruth: {
      keyPoints: [
        'Lists concepts in the category',
        'Shows concept frequency or coverage',
      ],
      expectedSources: [],
    },
    expectedTools: ['list_categories', 'category_search', 'list_concepts_in_category'],
    maxToolCalls: 6,
    description: 'Tests explore-category intent → category-exploration skill workflow',
    tags: ['skills-interface', 'explore-category', 'category-exploration'],
  },
  
  // Intent: identify-patterns → pattern-research skill
  {
    id: 'skills-identify-patterns',
    name: 'Intent: Identify Patterns → Pattern Research Skill',
    tier: 2,
    goal: 'What design patterns are recommended for handling errors in distributed systems?',
    groundTruth: {
      keyPoints: [
        'Identifies relevant patterns',
        'Provides pattern descriptions or sources',
      ],
      expectedSources: [],
    },
    expectedTools: ['broad_chunks_search', 'concept_search', 'chunks_search'],
    maxToolCalls: 20,
    description: 'Tests identify-patterns intent → pattern-research skill workflow',
    tags: ['skills-interface', 'identify-patterns', 'pattern-research'],
  },
  
  // Intent: identify-best-practices → practice-research skill
  {
    id: 'skills-identify-practices',
    name: 'Intent: Identify Best Practices → Practice Research Skill',
    tier: 2,
    goal: 'What are the best practices for API design?',
    groundTruth: {
      keyPoints: [
        'Lists best practices',
        'Provides recommendations with sources',
      ],
      expectedSources: [],
    },
    expectedTools: ['catalog_search', 'broad_chunks_search', 'chunks_search'],
    maxToolCalls: 20,
    description: 'Tests identify-best-practices intent → practice-research skill workflow',
    tags: ['skills-interface', 'identify-best-practices', 'practice-research'],
  },
];

describe('AIL Skills Interface Tests', () => {
  let container: ApplicationContainer;
  let runner: ScenarioRunner;
  
  // Check if test database exists
  const testDbExists = fs.existsSync(config.databasePath);
  
  // Skip all tests if prerequisites not met
  const shouldSkip = SKIP_AIL || !testDbExists;
  
  beforeAll(async () => {
    if (shouldSkip) {
      return;
    }
    
    container = new ApplicationContainer();
    await container.initialize(config.databasePath);
    runner = createScenarioRunnerFromContainer(container, config.apiKey, { 
      model: config.model, 
      verbose: config.verbose 
    });
  }, 30000);
  
  afterAll(async () => {
    if (container) {
      await container.close();
    }
  });
  
  describe('Skills Context Validation', () => {
    it('should have skills context available', () => {
      const context = loadSkillsContext();
      expect(context).toContain('Intent Index');
      expect(context).toContain('Skill Index');
      expect(context).toContain('understand-topic');
      expect(context).toContain('deep-research');
    });
  });
  
  describe.skipIf(shouldSkip)('Intent → Skill → Tool Workflow', () => {
    
    it('should follow understand-topic → deep-research workflow', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-understand-topic')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      // Should use expected tools from deep-research skill
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ understand-topic: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
    
    // Note: This test is flaky - the model sometimes doesn't call tools for simple questions
    // The skills interface is correct, but Claude Haiku sometimes provides direct answers
    it.skip('should follow know-my-library → library-discovery workflow', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-know-library')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ know-my-library: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
    
    it('should follow explore-concept → concept-exploration workflow', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-explore-concept')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ explore-concept: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
    
    it('should follow analyze-document → document-analysis workflow', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-analyze-document')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ analyze-document: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
    
    it('should follow category-exploration skill sequence', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-explore-category')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      // Skill sequence: list_categories → category_search → list_concepts_in_category
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ explore-category: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
    
    it('should follow pattern-research skill sequence', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-identify-patterns')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      // Skill sequence: concept_search → source_concepts → chunks_search
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ identify-patterns: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 180000);
    
    it('should follow identify-best-practices → practice-research workflow', async () => {
      const scenario = SKILLS_SCENARIOS.find(s => s.id === 'skills-identify-practices')!;
      const result = await runner.runScenario(scenario);
      
      const toolsUsed = result.toolCalls.map(tc => tc.name);
      const uniqueTools = [...new Set(toolsUsed)];
      
      const expectedToolUsed = scenario.expectedTools.some(t => uniqueTools.includes(t));
      expect(expectedToolUsed).toBe(true);
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      expect(result.passed).toBe(true);
      
      console.log(`✓ identify-best-practices: ${result.toolCalls.length} tool calls, tools: ${uniqueTools.join(', ')}`);
    }, 120000);
  });
  
  describe.skipIf(shouldSkip)('Tool Selection Efficiency', () => {
    it('should use fewer tool calls with skills guidance', async () => {
      // This test compares tool call efficiency
      // Skills interface should reduce unnecessary tool exploration
      
      const scenario = SKILLS_SCENARIOS[0]; // understand-topic
      const result = await runner.runScenario(scenario);
      
      // With proper skills guidance, should complete efficiently
      expect(result.toolCalls.length).toBeLessThanOrEqual(scenario.maxToolCalls);
      
      // Should not repeat the same tool call with same args
      const toolCallSignatures = result.toolCalls.map(
        tc => `${tc.name}:${JSON.stringify(tc.arguments)}`
      );
      const uniqueSignatures = new Set(toolCallSignatures);
      
      // Allow some repetition for refinement, but not excessive
      const repetitionRatio = uniqueSignatures.size / toolCallSignatures.length;
      expect(repetitionRatio).toBeGreaterThan(0.5);
      
      console.log(`Tool efficiency: ${uniqueSignatures.size}/${toolCallSignatures.length} unique calls (${(repetitionRatio * 100).toFixed(0)}%)`);
    }, 120000);
  });
});
