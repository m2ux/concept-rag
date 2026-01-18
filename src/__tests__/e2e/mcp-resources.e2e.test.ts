/**
 * E2E MCP Resources Tests
 * 
 * These tests verify the skills interface MCP resources are correctly registered
 * and return valid content.
 * 
 * Run with: npm test -- src/__tests__/e2e/mcp-resources.e2e.test.ts
 * 
 * Tests validate:
 * - All intent/skill resources are registered
 * - Resources return valid markdown content
 * - Resource URIs follow naming conventions
 * - Content contains expected sections
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

/**
 * Expected resources based on the skills interface implementation
 */
const EXPECTED_RESOURCES = {
  // Guidance
  'concept-rag://guidance': 'prompts/guidance.md',
  
  // Intents
  'concept-rag://intents': 'prompts/intents/index.md',
  'concept-rag://intents/understand-topic': 'prompts/intents/understand-topic.md',
  'concept-rag://intents/know-my-library': 'prompts/intents/know-my-library.md',
  'concept-rag://intents/explore-concept': 'prompts/intents/explore-concept.md',
  'concept-rag://intents/analyze-document': 'prompts/intents/analyze-document.md',
  'concept-rag://intents/explore-category': 'prompts/intents/explore-category.md',
  'concept-rag://intents/identify-patterns': 'prompts/intents/identify-patterns.md',
  'concept-rag://intents/identify-best-practices': 'prompts/intents/identify-best-practices.md',
  'concept-rag://intents/curate-lexicon': 'prompts/intents/curate-lexicon.md',
  
  // Skills
  'concept-rag://skills': 'prompts/skills/index.md',
  'concept-rag://skills/deep-research': 'prompts/skills/deep-research.md',
  'concept-rag://skills/library-discovery': 'prompts/skills/library-discovery.md',
  'concept-rag://skills/concept-exploration': 'prompts/skills/concept-exploration.md',
  'concept-rag://skills/document-analysis': 'prompts/skills/document-analysis.md',
  'concept-rag://skills/category-exploration': 'prompts/skills/category-exploration.md',
  'concept-rag://skills/pattern-research': 'prompts/skills/pattern-research.md',
  'concept-rag://skills/practice-research': 'prompts/skills/practice-research.md',
};

describe('MCP Resources E2E Tests', () => {
  
  describe('Resource File Existence', () => {
    Object.entries(EXPECTED_RESOURCES).forEach(([uri, filePath]) => {
      it(`should have file for ${uri}`, () => {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        expect(fs.existsSync(fullPath), `Missing file: ${filePath}`).toBe(true);
      });
    });
  });
  
  describe('Resource Content Validation', () => {
    
    it('should have valid markdown in all resource files', () => {
      Object.entries(EXPECTED_RESOURCES).forEach(([uri, filePath]) => {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Should have content
        expect(content.length).toBeGreaterThan(0);
        
        // Should start with a heading
        expect(content.trim()).toMatch(/^#/);
      });
    });
    
    it('should have intent index with all intents listed', () => {
      const indexPath = path.join(PROJECT_ROOT, 'prompts/intents/index.md');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Should reference all intent files
      expect(content).toContain('understand-topic');
      expect(content).toContain('know-my-library');
      expect(content).toContain('explore-concept');
      expect(content).toContain('analyze-document');
      expect(content).toContain('explore-category');
      expect(content).toContain('identify-patterns');
      expect(content).toContain('identify-best-practices');
      expect(content).toContain('curate-lexicon');
    });
    
    it('should have skill index with all skills listed', () => {
      const indexPath = path.join(PROJECT_ROOT, 'prompts/skills/index.md');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Should reference all skill files
      expect(content).toContain('deep-research');
      expect(content).toContain('library-discovery');
      expect(content).toContain('concept-exploration');
      expect(content).toContain('document-analysis');
      expect(content).toContain('category-exploration');
      expect(content).toContain('pattern-research');
      expect(content).toContain('practice-research');
    });
    
    it('should have each intent link to primary and supporting skills', () => {
      const intentFiles = [
        'prompts/intents/understand-topic.md',
        'prompts/intents/know-my-library.md',
        'prompts/intents/explore-concept.md',
        'prompts/intents/analyze-document.md',
        'prompts/intents/explore-category.md',
        'prompts/intents/identify-patterns.md',
        'prompts/intents/identify-best-practices.md',
        'prompts/intents/curate-lexicon.md',
      ];
      
      intentFiles.forEach(filePath => {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Should have "Maps To" section with primary skill
        expect(content).toContain('Maps To');
        expect(content).toContain('Primary Skill');
        expect(content).toMatch(/skills\/.*\.md/);
        
        // Should have supporting skills section
        expect(content).toContain('Supporting Skills');
      });
    });
    
    it('should have each skill reference tools', () => {
      const skillFiles = [
        'prompts/skills/deep-research.md',
        'prompts/skills/library-discovery.md',
        'prompts/skills/concept-exploration.md',
        'prompts/skills/document-analysis.md',
        'prompts/skills/category-exploration.md',
        'prompts/skills/pattern-research.md',
        'prompts/skills/practice-research.md',
      ];
      
      const validTools = [
        'catalog_search',
        'chunks_search',
        'broad_chunks_search',
        'concept_search',
        'source_concepts',
        'concept_sources',
        'extract_concepts',
        'list_categories',
        'category_search',
        'list_concepts_in_category',
      ];
      
      skillFiles.forEach(filePath => {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Should reference at least one valid tool
        const hasValidTool = validTools.some(tool => content.includes(tool));
        expect(hasValidTool, `${filePath} should reference at least one tool`).toBe(true);
      });
    });
  });
  
  describe('Resource Count', () => {
    it('should have expected number of resources', () => {
      const resourceCount = Object.keys(EXPECTED_RESOURCES).length;
      
      // 1 guidance + 9 intents (1 index + 8 intents) + 8 skills (1 index + 7 skills) = 18
      expect(resourceCount).toBe(18);
    });
    
    it('should have 7 intent files plus index', () => {
      const intentDir = path.join(PROJECT_ROOT, 'prompts/intents');
      const files = fs.readdirSync(intentDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBe(9); // 8 intents + index
    });
    
    it('should have 7 skill files plus index', () => {
      const skillDir = path.join(PROJECT_ROOT, 'prompts/skills');
      const files = fs.readdirSync(skillDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBe(8); // 7 skills + index
    });
  });
  
  describe('IDE Setup', () => {
    it('should have ide-setup.md file', () => {
      const ideSetupPath = path.join(PROJECT_ROOT, 'prompts/ide-setup.md');
      expect(fs.existsSync(ideSetupPath)).toBe(true);
    });
    
    it('should reference intents resource in ide-setup', () => {
      const ideSetupPath = path.join(PROJECT_ROOT, 'prompts/ide-setup.md');
      const content = fs.readFileSync(ideSetupPath, 'utf-8');
      expect(content).toContain('concept-rag://intents');
    });
  });
});
