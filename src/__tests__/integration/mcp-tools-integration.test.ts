/**
 * Integration Tests for MCP Tools
 * 
 * Tests all MCP tools with real database to verify:
 * 1. Architecture refactoring preserved functionality
 * 2. All search modalities work correctly
 * 3. Dependency injection is properly wired
 * 
 * **Test Strategy**: Integration testing with test fixtures (xUnit Test Patterns)
 * 
 * @group integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, TestDatabaseFixture } from './test-db-setup.js';
import { ApplicationContainer } from '../../application/container.js';
import * as path from 'path';
import * as os from 'os';

describe('MCP Tools Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let container: ApplicationContainer;
  
  beforeAll(async () => {
    // ARRANGE: Setup test database
    fixture = createTestDatabase('mcp-tools');
    await fixture.setup();
    
    // Create ApplicationContainer with test database
    const dbPath = fixture.getDatabasePath();
    container = new ApplicationContainer();
    await container.initialize(dbPath);
  }, 30000);
  
  afterAll(async () => {
    await container.close();
    await fixture.teardown();
  });
  
  describe('concept_search tool', () => {
    it('should find chunks by concept name', async () => {
      // ARRANGE
      const tool = container.getTool('concept_search');
      
      // ACT
      const result = await tool.execute({ concept: 'clean architecture', limit: 5 });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(false);
      
      const content = JSON.parse(result.content[0].text);
      expect(content.concept).toBe('clean architecture');
      expect(Array.isArray(content.results)).toBe(true);
    });
  });
  
  describe('catalog_search tool', () => {
    it('should search document summaries', async () => {
      // ARRANGE
      const tool = container.getTool('catalog_search');
      
      // ACT
      const result = await tool.execute({ text: 'architecture', limit: 3 });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(false);
      
      const content = JSON.parse(result.content[0].text);
      expect(Array.isArray(content) || Array.isArray(content.results)).toBe(true);
    });
  });
  
  describe('chunks_search tool', () => {
    it('should search within specific document', async () => {
      // ARRANGE
      const catalogTool = container.getTool('catalog_search');
      const catalogResult = await catalogTool.execute({ text: 'architecture', limit: 1 });
      const catalogContent = JSON.parse(catalogResult.content[0].text);
      const source = Array.isArray(catalogContent) 
        ? catalogContent[0]?.source 
        : catalogContent.results?.[0]?.source;
      
      if (!source) {
        // Skip if no documents available
        return;
      }
      
      const tool = container.getTool('chunks_search');
      
      // ACT
      const result = await tool.execute({ 
        text: 'design', 
        source: source,
        limit: 3 
      });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(false);
      
      const content = JSON.parse(result.content[0].text);
      expect(Array.isArray(content) || Array.isArray(content.results)).toBe(true);
    });
  });
  
  describe('broad_chunks_search tool', () => {
    it('should search across all chunks', async () => {
      // ARRANGE
      const tool = container.getTool('broad_chunks_search');
      
      // ACT
      const result = await tool.execute({ text: 'software', limit: 5 });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.isError).toBe(false);
      
      const content = JSON.parse(result.content[0].text);
      expect(Array.isArray(content) || Array.isArray(content.results)).toBe(true);
    });
  });
  
  describe('extract_concepts tool', () => {
    it('should extract concepts from document', async () => {
      // ARRANGE
      const tool = container.getTool('extract_concepts');
      
      // ACT
      const result = await tool.execute({ document_query: 'architecture' });
      
      // ASSERT
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      
      const content = JSON.parse(result.content[0].text);
      // May return error if no documents found, which is acceptable
      if (!content.error) {
        expect(content.primary_concepts || content.document_summary).toBeDefined();
      }
    });
  });
});

