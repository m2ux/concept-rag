/**
 * Unit Tests for ConceptEnricher
 * 
 * Tests concept enrichment logic that adds WordNet data to concepts.
 * 
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConceptEnricher } from '../concept_enricher.js';
import { ConceptRecord } from '../types.js';
import { WordNetService } from '../../wordnet/wordnet_service.js';
import { WordNetSynset } from '../types.js';

/**
 * Mock WordNetService for testing
 */
class MockWordNetService {
  private synsets: Map<string, WordNetSynset[]> = new Map();
  private saveCacheCalled = false;

  async getSynsets(word: string): Promise<WordNetSynset[]> {
    const key = word.toLowerCase().trim();
    return Promise.resolve(this.synsets.get(key) || []);
  }

  async saveCache(): Promise<void> {
    this.saveCacheCalled = true;
    return Promise.resolve();
  }

  // Test helpers
  setSynsets(word: string, synsets: WordNetSynset[]): void {
    this.synsets.set(word.toLowerCase().trim(), synsets);
  }

  clear(): void {
    this.synsets.clear();
    this.saveCacheCalled = false;
  }

  wasSaveCacheCalled(): boolean {
    return this.saveCacheCalled;
  }
}

describe('ConceptEnricher', () => {
  let enricher: ConceptEnricher;
  let mockWordNet: MockWordNetService;
  let originalWordNetService: any;

  beforeEach(() => {
    // SETUP: Create mock WordNetService
    mockWordNet = new MockWordNetService();
    
    // Replace WordNetService in ConceptEnricher
    // Since WordNetService is instantiated in constructor, we need to mock it
    // We'll use vi.spyOn to intercept the constructor or mock the methods
    enricher = new ConceptEnricher();
    
    // Access private wordnet property via reflection for testing
    // In a real scenario, we might refactor to inject WordNetService
    (enricher as any).wordnet = mockWordNet;
  });

  describe('enrichConcepts', () => {
    it('should enrich concepts with WordNet data', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'architecture',
          catalog_ids: [12345678],
          related_concepts: [],
          embeddings: [0.1, 0.2, 0.3],
          weight: 10
        }
      ];
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'architecture',
          synset_name: 'architecture.n.01',
          synonyms: ['architecture', 'design', 'structure', 'blueprint', 'plan'],
          hypernyms: ['plan', 'planning'],
          hyponyms: ['software architecture', 'system architecture'],
          meronyms: [],
          definition: 'The design and structure of a system'
        }
      ];
      mockWordNet.setSynsets('architecture', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched[0].synonyms).toEqual(['architecture', 'design', 'structure', 'blueprint', 'plan']);
      expect(enriched[0].broader_terms).toEqual(['plan', 'planning']);
      expect(enriched[0].narrower_terms).toEqual(['software architecture', 'system architecture']);
    });

    it('should limit synonyms to top 5', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'testing',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 5
        }
      ];
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'testing',
          synset_name: 'testing.n.01',
          synonyms: ['syn1', 'syn2', 'syn3', 'syn4', 'syn5', 'syn6', 'syn7'], // 7 synonyms
          hypernyms: [],
          hyponyms: [],
          meronyms: [],
          definition: 'Test definition'
        }
      ];
      mockWordNet.setSynsets('testing', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched[0].synonyms?.length).toBe(5);
      expect(enriched[0].synonyms).toEqual(['syn1', 'syn2', 'syn3', 'syn4', 'syn5']);
    });

    it('should limit hypernyms to top 3', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'pattern',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 8
        }
      ];
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'pattern',
          synset_name: 'pattern.n.01',
          synonyms: [],
          hypernyms: ['hyper1', 'hyper2', 'hyper3', 'hyper4', 'hyper5'], // 5 hypernyms
          hyponyms: [],
          meronyms: [],
          definition: 'Pattern definition'
        }
      ];
      mockWordNet.setSynsets('pattern', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched[0].broader_terms?.length).toBe(3);
      expect(enriched[0].broader_terms).toEqual(['hyper1', 'hyper2', 'hyper3']);
    });

    it('should limit hyponyms to top 5', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'design',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 12
        }
      ];
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'design',
          synset_name: 'design.n.01',
          synonyms: [],
          hypernyms: [],
          hyponyms: ['hypo1', 'hypo2', 'hypo3', 'hypo4', 'hypo5', 'hypo6', 'hypo7'], // 7 hyponyms
          meronyms: [],
          definition: 'Design definition'
        }
      ];
      mockWordNet.setSynsets('design', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched[0].narrower_terms?.length).toBe(5);
      expect(enriched[0].narrower_terms).toEqual(['hypo1', 'hypo2', 'hypo3', 'hypo4', 'hypo5']);
    });

    it('should handle concepts not found in WordNet', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'nonexistent concept',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 1
        }
      ];
      // No synsets set for this concept

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched[0].synonyms).toBeUndefined();
      expect(enriched[0].broader_terms).toBeUndefined();
      expect(enriched[0].narrower_terms).toBeUndefined();
    });

    it('should handle errors gracefully and continue processing', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'error concept',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 1
        },
        {
          name: 'valid concept',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 1
        }
      ];
      
      // Make getSynsets throw for first concept
      const originalGetSynsets = mockWordNet.getSynsets.bind(mockWordNet);
      mockWordNet.getSynsets = vi.fn(async (word: string) => {
        if (word === 'error concept') {
          throw new Error('WordNet lookup failed');
        }
        return originalGetSynsets(word);
      });
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'valid concept',
          synset_name: 'valid.n.01',
          synonyms: ['syn1'],
          hypernyms: [],
          hyponyms: [],
          meronyms: [],
          definition: 'Valid definition'
        }
      ];
      mockWordNet.setSynsets('valid concept', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      // Both concepts should be returned
      expect(enriched.length).toBe(2);
      // Second concept should be enriched
      expect(enriched[1].synonyms).toEqual(['syn1']);
      // First concept should remain unchanged (error handled)
      expect(enriched[0].synonyms).toBeUndefined();
    });

    it('should process multiple concepts', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'architecture',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 10
        },
        {
          name: 'design',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 8
        }
      ];
      
      mockWordNet.setSynsets('architecture', [{
        word: 'architecture',
        synset_name: 'arch.n.01',
        synonyms: ['arch1'],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: 'Arch definition'
      }]);
      
      mockWordNet.setSynsets('design', [{
        word: 'design',
        synset_name: 'design.n.01',
        synonyms: ['design1'],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: 'Design definition'
      }]);

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched.length).toBe(2);
      expect(enriched[0].synonyms).toEqual(['arch1']);
      expect(enriched[1].synonyms).toEqual(['design1']);
    });

    it('should call saveCache after enrichment', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [
        {
          name: 'test',
          catalog_ids: [],
          related_concepts: [],
          embeddings: [],
          weight: 1
        }
      ];
      mockWordNet.setSynsets('test', []);

      // EXERCISE
      await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(mockWordNet.wasSaveCacheCalled()).toBe(true);
    });

    it('should handle empty concepts array', async () => {
      // SETUP
      const concepts: ConceptRecord[] = [];

      // EXERCISE
      const enriched = await enricher.enrichConcepts(concepts);

      // VERIFY
      expect(enriched).toEqual([]);
    });
  });

  describe('enrichSingleConcept', () => {
    it('should enrich a single concept with WordNet data', async () => {
      // SETUP
      const concept: ConceptRecord = {
        name: 'architecture',
        catalog_ids: [],
        related_concepts: [],
        embeddings: [],
        weight: 10
      };
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'architecture',
          synset_name: 'architecture.n.01',
          synonyms: ['syn1', 'syn2'],
          hypernyms: ['hyper1'],
          hyponyms: ['hypo1', 'hypo2'],
          meronyms: [],
          definition: 'Definition'
        }
      ];
      mockWordNet.setSynsets('architecture', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichSingleConcept(concept);

      // VERIFY
      expect(enriched.synonyms).toEqual(['syn1', 'syn2']);
      expect(enriched.broader_terms).toEqual(['hyper1']);
      expect(enriched.narrower_terms).toEqual(['hypo1', 'hypo2']);
    });

    it('should handle concept not found in WordNet', async () => {
      // SETUP
      const concept: ConceptRecord = {
        name: 'nonexistent',
        catalog_ids: [],
        related_concepts: [],
        embeddings: [],
        weight: 1
      };

      // EXERCISE
      const enriched = await enricher.enrichSingleConcept(concept);

      // VERIFY
      expect(enriched.synonyms).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      // SETUP
      const concept: ConceptRecord = {
        name: 'error concept',
        catalog_ids: [],
        related_concepts: [],
        embeddings: [],
        weight: 1
      };
      
      // Make getSynsets throw
      mockWordNet.getSynsets = vi.fn(async () => {
        throw new Error('WordNet lookup failed');
      });

      // EXERCISE
      const enriched = await enricher.enrichSingleConcept(concept);

      // VERIFY
      // Should return concept unchanged (error handled)
      expect(enriched.synonyms).toBeUndefined();
    });

    it('should limit synonyms to top 5', async () => {
      // SETUP
      const concept: ConceptRecord = {
        name: 'test',
        catalog_ids: [],
        related_concepts: [],
        embeddings: [],
        weight: 1
      };
      
      const mockSynsets: WordNetSynset[] = [
        {
          word: 'test',
          synset_name: 'test.n.01',
          synonyms: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
          hypernyms: [],
          hyponyms: [],
          meronyms: [],
          definition: 'Test'
        }
      ];
      mockWordNet.setSynsets('test', mockSynsets);

      // EXERCISE
      const enriched = await enricher.enrichSingleConcept(concept);

      // VERIFY
      expect(enriched.synonyms?.length).toBe(5);
    });
  });
});

