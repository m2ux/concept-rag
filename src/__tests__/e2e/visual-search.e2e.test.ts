/**
 * E2E Test: Visual Search Integration
 * 
 * Tests the visual/image search functionality against the test database:
 * 1. GetVisualsTool retrieves visuals by various filters
 * 2. ConceptSearchTool returns image_ids for associated visuals
 * 3. Workflow: concept_search → get_visuals via image_ids
 * 4. Workflow: catalog_search → get_visuals via catalog_id
 * 
 * Requires: db/test with visuals.lance table and images/ directory
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApplicationContainer } from '../../application/container.js';
import * as path from 'path';

// Test database path
const TEST_DB_PATH = path.resolve(process.cwd(), 'db/test');

describe('E2E: Visual Search Integration', () => {
  let container: ApplicationContainer;
  let getVisualsTool: any;
  let conceptSearchTool: any;
  let catalogSearchTool: any;

  beforeAll(async () => {
    container = new ApplicationContainer();
    await container.initialize(TEST_DB_PATH);
    
    getVisualsTool = container.getTool('get_visuals');
    conceptSearchTool = container.getTool('concept_search');
    catalogSearchTool = container.getTool('catalog_search');
  }, 30000);

  afterAll(async () => {
    if (container) {
      await container.close();
    }
  });

  describe('GetVisualsTool Basic Operations', () => {
    it('should retrieve visuals with default limit', async () => {
      const result = await getVisualsTool.execute({});
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.visuals).toBeDefined();
      expect(Array.isArray(response.visuals)).toBe(true);
      expect(response.total_returned).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve visuals by visual_type', async () => {
      const result = await getVisualsTool.execute({ visual_type: 'diagram' });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.visuals).toBeDefined();
      expect(response.filters_applied.visual_type).toBe('diagram');
      
      // All returned visuals should be diagrams
      response.visuals.forEach((v: any) => {
        expect(v.visual_type).toBe('diagram');
      });
    });

    it('should respect limit parameter', async () => {
      const result = await getVisualsTool.execute({ limit: 3 });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.visuals.length).toBeLessThanOrEqual(3);
    });

    it('should return visual with expected schema', async () => {
      const result = await getVisualsTool.execute({ limit: 1 });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      if (response.visuals.length > 0) {
        const visual = response.visuals[0];
        
        // Verify schema fields
        expect(visual).toHaveProperty('id');
        expect(visual).toHaveProperty('catalog_id');
        expect(visual).toHaveProperty('catalog_title');
        expect(visual).toHaveProperty('visual_type');
        expect(visual).toHaveProperty('page_number');
        expect(visual).toHaveProperty('description');
        expect(visual).toHaveProperty('image_path');
        expect(visual).toHaveProperty('concepts');
        
        // Verify types
        expect(typeof visual.id).toBe('number');
        expect(typeof visual.catalog_id).toBe('number');
        expect(typeof visual.image_path).toBe('string');
        expect(Array.isArray(visual.concepts)).toBe(true);
        
        // Should NOT have chunk_ids (removed from schema)
        expect(visual).not.toHaveProperty('chunk_ids');
      }
    });
  });

  describe('GetVisualsTool by IDs', () => {
    it('should retrieve visuals by specific IDs', async () => {
      // First get some visuals to get their IDs
      const initial = await getVisualsTool.execute({ limit: 5 });
      const initialResponse = JSON.parse(initial.content[0].text);
      
      if (initialResponse.visuals.length >= 2) {
        const ids = initialResponse.visuals.slice(0, 2).map((v: any) => v.id);
        
        // Now fetch by IDs
        const result = await getVisualsTool.execute({ ids });
        
        expect(result.isError).toBe(false);
        const response = JSON.parse(result.content[0].text);
        
        expect(response.visuals.length).toBe(2);
        expect(response.filters_applied.ids).toEqual(ids);
        
        // Verify the returned IDs match
        const returnedIds = response.visuals.map((v: any) => v.id);
        expect(returnedIds).toContain(ids[0]);
        expect(returnedIds).toContain(ids[1]);
      }
    });
  });

  describe('GetVisualsTool by Catalog ID', () => {
    it('should retrieve visuals by catalog_id', async () => {
      // First get a visual to find a catalog_id
      const initial = await getVisualsTool.execute({ limit: 1 });
      const initialResponse = JSON.parse(initial.content[0].text);
      
      if (initialResponse.visuals.length > 0) {
        const catalogId = initialResponse.visuals[0].catalog_id;
        
        // Now fetch by catalog_id
        const result = await getVisualsTool.execute({ catalog_id: catalogId });
        
        expect(result.isError).toBe(false);
        const response = JSON.parse(result.content[0].text);
        
        expect(response.filters_applied.catalog_id).toBe(catalogId);
        
        // All visuals should be from the same document
        response.visuals.forEach((v: any) => {
          expect(v.catalog_id).toBe(catalogId);
        });
      }
    });
  });

  describe('ConceptSearchTool with image_ids', () => {
    it('should return image_ids in concept search results', async () => {
      // Search for a concept that likely has associated visuals
      const result = await conceptSearchTool.execute({ concept: 'architecture' });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      // Verify image_ids is present in the response
      expect(response).toHaveProperty('image_ids');
      expect(Array.isArray(response.image_ids)).toBe(true);
      
      // Verify stats includes images_found
      expect(response.stats).toHaveProperty('images_found');
      expect(typeof response.stats.images_found).toBe('number');
    });

    it('should return catalog_id in sources array', async () => {
      const result = await conceptSearchTool.execute({ concept: 'architecture' });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      if (response.sources && response.sources.length > 0) {
        const source = response.sources[0];
        expect(source).toHaveProperty('catalog_id');
        expect(typeof source.catalog_id).toBe('number');
        expect(source).toHaveProperty('title');
      }
    });

    it('should return catalog_id in chunks array', async () => {
      const result = await conceptSearchTool.execute({ concept: 'architecture' });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      if (response.chunks && response.chunks.length > 0) {
        const chunk = response.chunks[0];
        expect(chunk).toHaveProperty('catalog_id');
        expect(typeof chunk.catalog_id).toBe('number');
        expect(chunk).toHaveProperty('title');
      }
    });
  });

  describe('CatalogSearchTool with catalog_id', () => {
    it('should return catalog_id in search results', async () => {
      const result = await catalogSearchTool.execute({ text: 'clean architecture' });
      
      expect(result.isError).toBe(false);
      const response = JSON.parse(result.content[0].text);
      
      if (response.length > 0) {
        const doc = response[0];
        expect(doc).toHaveProperty('catalog_id');
        expect(typeof doc.catalog_id).toBe('number');
        expect(doc).toHaveProperty('title');
        
        // Should NOT have 'source' (replaced with title)
        expect(doc).not.toHaveProperty('source');
      }
    });
  });

  describe('Workflow: concept_search → get_visuals', () => {
    it('should enable visual retrieval via image_ids from concept search', async () => {
      // Step 1: Search for a concept
      const conceptResult = await conceptSearchTool.execute({ concept: 'diagram' });
      const conceptResponse = JSON.parse(conceptResult.content[0].text);
      
      if (conceptResponse.image_ids && conceptResponse.image_ids.length > 0) {
        // Step 2: Retrieve visuals by IDs
        const visualResult = await getVisualsTool.execute({ 
          ids: conceptResponse.image_ids.slice(0, 5) 
        });
        
        expect(visualResult.isError).toBe(false);
        const visualResponse = JSON.parse(visualResult.content[0].text);
        
        expect(visualResponse.visuals.length).toBeGreaterThan(0);
        
        // Verify we got the visuals we asked for
        const requestedIds = conceptResponse.image_ids.slice(0, 5);
        const returnedIds = visualResponse.visuals.map((v: any) => v.id);
        
        requestedIds.forEach((id: number) => {
          expect(returnedIds).toContain(id);
        });
      }
    });
  });

  describe('Workflow: catalog_search → get_visuals', () => {
    it('should enable visual retrieval via catalog_id from catalog search', async () => {
      // Step 1: Search catalog
      const catalogResult = await catalogSearchTool.execute({ text: 'architecture' });
      const catalogResponse = JSON.parse(catalogResult.content[0].text);
      
      if (catalogResponse.length > 0) {
        const catalogId = catalogResponse[0].catalog_id;
        
        // Step 2: Retrieve visuals by catalog_id
        const visualResult = await getVisualsTool.execute({ catalog_id: catalogId });
        
        expect(visualResult.isError).toBe(false);
        const visualResponse = JSON.parse(visualResult.content[0].text);
        
        // All returned visuals should be from the same document
        visualResponse.visuals.forEach((v: any) => {
          expect(v.catalog_id).toBe(catalogId);
        });
      }
    });
  });

  describe('Visual Schema Compliance', () => {
    it('should not include deprecated fields', async () => {
      const result = await getVisualsTool.execute({ limit: 5 });
      const response = JSON.parse(result.content[0].text);
      
      response.visuals.forEach((v: any) => {
        // chunk_ids was removed from schema
        expect(v).not.toHaveProperty('chunk_ids');
      });
    });

    it('should include all required fields', async () => {
      const result = await getVisualsTool.execute({ limit: 5 });
      const response = JSON.parse(result.content[0].text);
      
      const requiredFields = [
        'id', 'catalog_id', 'catalog_title', 'visual_type',
        'page_number', 'description', 'image_path', 'concepts'
      ];
      
      response.visuals.forEach((v: any) => {
        requiredFields.forEach(field => {
          expect(v).toHaveProperty(field);
        });
      });
    });
  });

  describe('Semantic Relevance Validation', () => {
    it('should return images with descriptions relevant to the searched concept', async () => {
      // Search for "architecture" concept
      const conceptResult = await conceptSearchTool.execute({ concept: 'architecture' });
      const conceptResponse = JSON.parse(conceptResult.content[0].text);
      
      if (conceptResponse.image_ids && conceptResponse.image_ids.length > 0) {
        // Retrieve associated images
        const visualResult = await getVisualsTool.execute({ 
          ids: conceptResponse.image_ids.slice(0, 10) 
        });
        const visualResponse = JSON.parse(visualResult.content[0].text);
        
        // Define terms that would indicate relevance to "architecture"
        const relevantTerms = [
          'architecture', 'layer', 'component', 'module', 'system',
          'design', 'pattern', 'structure', 'diagram', 'flow',
          'dependency', 'interface', 'service', 'class', 'model',
          'clean', 'hexagonal', 'onion', 'domain', 'application'
        ];
        
        // Check that at least some images have relevant descriptions
        const imagesWithRelevantDescriptions = visualResponse.visuals.filter((v: any) => {
          const description = (v.description || '').toLowerCase();
          const concepts = (v.concepts || []).map((c: string) => c.toLowerCase());
          const allText = description + ' ' + concepts.join(' ');
          
          return relevantTerms.some(term => allText.includes(term));
        });
        
        // At least 50% of returned images should have relevant descriptions
        const relevanceRatio = imagesWithRelevantDescriptions.length / visualResponse.visuals.length;
        expect(relevanceRatio).toBeGreaterThanOrEqual(0.5);
        
        console.error(`  📊 Relevance: ${imagesWithRelevantDescriptions.length}/${visualResponse.visuals.length} images (${(relevanceRatio * 100).toFixed(0)}%) have architecture-related content`);
      }
    });

    it('should return images with concepts matching the search term', async () => {
      // Search for "dependency" concept
      const conceptResult = await conceptSearchTool.execute({ concept: 'dependency' });
      const conceptResponse = JSON.parse(conceptResult.content[0].text);
      
      if (conceptResponse.image_ids && conceptResponse.image_ids.length > 0) {
        const visualResult = await getVisualsTool.execute({ 
          ids: conceptResponse.image_ids.slice(0, 10) 
        });
        const visualResponse = JSON.parse(visualResult.content[0].text);
        
        // Check that images have the searched concept or related terms
        const relatedTerms = ['dependency', 'injection', 'inversion', 'coupling', 'interface'];
        
        const imagesWithMatchingConcepts = visualResponse.visuals.filter((v: any) => {
          const concepts = (v.concepts || []).map((c: string) => c.toLowerCase());
          const description = (v.description || '').toLowerCase();
          
          return relatedTerms.some(term => 
            concepts.some((c: string) => c.includes(term)) || 
            description.includes(term)
          );
        });
        
        // Log the match results
        console.error(`  📊 Concept match: ${imagesWithMatchingConcepts.length}/${visualResponse.visuals.length} images match "dependency" or related terms`);
        
        // At least one image should match
        if (visualResponse.visuals.length > 0) {
          expect(imagesWithMatchingConcepts.length).toBeGreaterThan(0);
        }
      }
    });

    it('should return images that have the searched concept in their concept list', async () => {
      // Search for a concept and verify images have that concept associated
      const conceptResult = await conceptSearchTool.execute({ concept: 'software' });
      const conceptResponse = JSON.parse(conceptResult.content[0].text);
      
      if (conceptResponse.image_ids && conceptResponse.image_ids.length > 0) {
        // Retrieve associated images
        const visualResult = await getVisualsTool.execute({ 
          ids: conceptResponse.image_ids.slice(0, 10) 
        });
        const visualResponse = JSON.parse(visualResult.content[0].text);
        
        // Verify images have the searched concept or related terms in their concepts/description
        const relatedTerms = ['software', 'application', 'system', 'program', 'code'];
        
        const imagesWithMatchingConcept = visualResponse.visuals.filter((v: any) => {
          const concepts = (v.concepts || []).map((c: string) => c.toLowerCase());
          const description = (v.description || '').toLowerCase();
          
          return relatedTerms.some(term => 
            concepts.some((c: string) => c.includes(term)) || 
            description.includes(term)
          );
        });
        
        console.error(`  📊 Concept association: ${imagesWithMatchingConcept.length}/${visualResponse.visuals.length} images have "software" or related concepts`);
        
        // Images associated with the concept should have relevant content
        if (visualResponse.visuals.length > 0) {
          const matchRatio = imagesWithMatchingConcept.length / visualResponse.visuals.length;
          expect(matchRatio).toBeGreaterThanOrEqual(0.5); // At least half should match
        }
      }
    });

    it('should return diagram-type visuals with meaningful descriptions', async () => {
      // Get diagrams specifically
      const result = await getVisualsTool.execute({ visual_type: 'diagram', limit: 10 });
      const response = JSON.parse(result.content[0].text);
      
      if (response.visuals.length > 0) {
        // Diagrams should have substantive descriptions (not just "No description")
        const diagramsWithMeaningfulDescriptions = response.visuals.filter((v: any) => {
          const desc = v.description || '';
          return desc.length > 20 && 
                 desc !== 'No description available' &&
                 !desc.startsWith('Error');
        });
        
        const meaningfulRatio = diagramsWithMeaningfulDescriptions.length / response.visuals.length;
        
        console.error(`  📊 Description quality: ${diagramsWithMeaningfulDescriptions.length}/${response.visuals.length} diagrams (${(meaningfulRatio * 100).toFixed(0)}%) have meaningful descriptions`);
        
        // At least 70% should have meaningful descriptions
        expect(meaningfulRatio).toBeGreaterThanOrEqual(0.7);
      }
    });
  });
});

