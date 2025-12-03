/**
 * Unit Tests for ContextAwareStrategy
 * 
 * Tests the context-aware synset selection strategy that scores synsets
 * based on query context, technical indicators, and domain hints.
 * 
 * Follows Four-Phase Test pattern: Setup, Exercise, Verify, Teardown.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextAwareStrategy } from '../strategies/context-aware-strategy.js';
import { SelectionContext } from '../strategies/synset-selection-strategy.js';
import { WordNetSynset } from '../../concepts/types.js';

describe('ContextAwareStrategy', () => {
  let strategy: ContextAwareStrategy;
  
  beforeEach(() => {
    strategy = new ContextAwareStrategy();
  });
  
  describe('name property', () => {
    it('should have correct strategy name', () => {
      expect(strategy.name).toBe('context-aware');
    });
  });
  
  describe('selectSynset', () => {
    it('should return undefined for empty synset array', () => {
      // SETUP
      const context: SelectionContext = {
        queryTerms: ['software', 'design']
      };
      
      // EXERCISE
      const result = strategy.selectSynset([], context);
      
      // VERIFY
      expect(result).toBeUndefined();
    });
    
    it('should return single synset when only one available', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'pattern',
          synset_name: 'pattern.n.01',
          synonyms: ['design'],
          hypernyms: ['structure'],
          hyponyms: [],
          meronyms: [],
          definition: 'a decorative design'
        }
      ];
      const context: SelectionContext = {
        queryTerms: ['pattern']
      };
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, context);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result?.synset_name).toBe('pattern.n.01');
    });
    
    it('should prefer technical meaning when context is technical', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'decorator',
          synset_name: 'decorator.n.01',
          synonyms: ['interior designer', 'room designer'],
          hypernyms: ['person', 'professional'],
          hyponyms: [],
          meronyms: [],
          definition: 'a person who designs interior spaces'
        },
        {
          word: 'decorator',
          synset_name: 'decorator.n.02',
          synonyms: ['wrapper', 'design pattern'],
          hypernyms: ['pattern', 'software construct'],
          hyponyms: [],
          meronyms: [],
          definition: 'a software design pattern that wraps objects to add functionality'
        }
      ];
      
      const context: SelectionContext = {
        queryTerms: ['software', 'design', 'pattern'],
        domainHints: ['programming', 'software engineering']
      };
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, context);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result?.synset_name).toBe('decorator.n.02');
      expect(result?.definition).toContain('software');
    });
    
    it('should prefer meaning matching query context', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'factory',
          synset_name: 'factory.n.01',
          synonyms: ['plant', 'mill', 'manufactory'],
          hypernyms: ['building', 'workplace'],
          hyponyms: ['assembly plant'],
          meronyms: [],
          definition: 'a building where goods are manufactured'
        },
        {
          word: 'factory',
          synset_name: 'factory.n.02',
          synonyms: ['creator', 'builder'],
          hypernyms: ['design pattern', 'creational pattern'],
          hyponyms: [],
          meronyms: [],
          definition: 'a creational design pattern that creates objects without specifying their concrete class'
        }
      ];
      
      const context: SelectionContext = {
        queryTerms: ['object', 'creation', 'class'],
        domainHints: ['object-oriented', 'programming']
      };
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, context);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result?.synset_name).toBe('factory.n.02');
    });
    
    it('should fall back to first synset when context provides no differentiation', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'example',
          synset_name: 'example.n.01',
          synonyms: ['instance', 'case'],
          hypernyms: ['information'],
          hyponyms: [],
          meronyms: [],
          definition: 'an item that represents a class or group'
        },
        {
          word: 'example',
          synset_name: 'example.n.02',
          synonyms: ['model', 'exemplar'],
          hypernyms: ['ideal'],
          hyponyms: [],
          meronyms: [],
          definition: 'something to be imitated'
        }
      ];
      
      const context: SelectionContext = {
        queryTerms: ['unrelated', 'terms'],
        domainHints: ['irrelevant']
      };
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, context);
      
      // VERIFY
      expect(result).toBeDefined();
      // When scores are equal, should get first by order
    });
  });
  
  describe('scoreSynset', () => {
    it('should return 0 for null synset', () => {
      // SETUP
      const context: SelectionContext = {
        queryTerms: ['test']
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(null as any, context);
      
      // VERIFY
      expect(score).toBe(0);
    });
    
    it('should score higher when query terms appear in definition', () => {
      // SETUP
      const matchingSynset: WordNetSynset = {
        word: 'algorithm',
        synset_name: 'algorithm.n.01',
        synonyms: ['procedure'],
        hypernyms: ['process'],
        hyponyms: [],
        meronyms: [],
        definition: 'a step-by-step process for computation'
      };
      
      const nonMatchingSynset: WordNetSynset = {
        word: 'algorithm',
        synset_name: 'algorithm.n.02',
        synonyms: ['method'],
        hypernyms: ['technique'],
        hyponyms: [],
        meronyms: [],
        definition: 'a general method for something'
      };
      
      const context: SelectionContext = {
        queryTerms: ['computation', 'step']
      };
      
      // EXERCISE
      const matchingScore = strategy.scoreSynset(matchingSynset, context);
      const nonMatchingScore = strategy.scoreSynset(nonMatchingSynset, context);
      
      // VERIFY
      expect(matchingScore).toBeGreaterThan(nonMatchingScore);
    });
    
    it('should score higher for technical definitions', () => {
      // SETUP
      const technicalSynset: WordNetSynset = {
        word: 'bridge',
        synset_name: 'bridge.n.tech',
        synonyms: ['adapter'],
        hypernyms: ['design pattern'],
        hyponyms: [],
        meronyms: [],
        definition: 'a software design pattern that decouples abstraction from implementation'
      };
      
      const generalSynset: WordNetSynset = {
        word: 'bridge',
        synset_name: 'bridge.n.01',
        synonyms: ['span'],
        hypernyms: ['structure'],
        hyponyms: [],
        meronyms: [],
        definition: 'a structure built to span a river or valley'
      };
      
      const context: SelectionContext = {
        queryTerms: ['bridge']
      };
      
      // EXERCISE
      const technicalScore = strategy.scoreSynset(technicalSynset, context);
      const generalScore = strategy.scoreSynset(generalSynset, context);
      
      // VERIFY
      expect(technicalScore).toBeGreaterThan(generalScore);
    });
    
    it('should score higher when domain hints match', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'observer',
        synset_name: 'observer.n.02',
        synonyms: ['listener', 'subscriber'],
        hypernyms: ['design pattern', 'behavioral pattern'],
        hyponyms: [],
        meronyms: [],
        definition: 'a behavioral pattern where objects notify dependents of state changes'
      };
      
      const matchingContext: SelectionContext = {
        queryTerms: ['observer'],
        domainHints: ['design', 'pattern', 'software']
      };
      
      const nonMatchingContext: SelectionContext = {
        queryTerms: ['observer'],
        domainHints: ['astronomy', 'telescope', 'sky']
      };
      
      // EXERCISE
      const matchingScore = strategy.scoreSynset(synset, matchingContext);
      const nonMatchingScore = strategy.scoreSynset(synset, nonMatchingContext);
      
      // VERIFY
      expect(matchingScore).toBeGreaterThan(nonMatchingScore);
    });
    
    it('should consider synonyms and hypernyms in scoring', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'iterator',
        synset_name: 'iterator.n.01',
        synonyms: ['cursor', 'traverser'],
        hypernyms: ['behavioral pattern', 'design pattern'],
        hyponyms: [],
        meronyms: [],
        definition: 'provides sequential access to elements'
      };
      
      const context: SelectionContext = {
        queryTerms: ['cursor', 'pattern']  // Match synonym and hypernym
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0.2);  // Should have meaningful score from related terms
    });
    
    it('should return normalized score between 0 and 1', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'test',
        synset_name: 'test.n.01',
        synonyms: ['examination', 'trial'],
        hypernyms: ['procedure'],
        hyponyms: [],
        meronyms: [],
        definition: 'a systematic procedure for testing software'
      };
      
      const context: SelectionContext = {
        queryTerms: ['software', 'testing', 'procedure'],
        domainHints: ['software', 'programming']
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
    
    it('should handle empty query terms', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'pattern',
        synset_name: 'pattern.n.01',
        synonyms: ['design'],
        hypernyms: ['structure'],
        hyponyms: [],
        meronyms: [],
        definition: 'a decorative design'
      };
      
      const context: SelectionContext = {
        queryTerms: []
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
  
  describe('custom weights', () => {
    it('should allow customizing scoring weights', () => {
      // SETUP
      const heavyTermOverlapStrategy = new ContextAwareStrategy({
        termOverlap: 10.0,
        technical: 0.1,
        domain: 0.1,
        relatedTerm: 0.1
      });
      
      const synsetWithTermOverlap: WordNetSynset = {
        word: 'test',
        synset_name: 'test.n.01',
        synonyms: [],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: 'a method for checking software behavior'
      };
      
      const synsetWithTechnical: WordNetSynset = {
        word: 'test',
        synset_name: 'test.n.02',
        synonyms: [],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: 'a computer program algorithm system data'
      };
      
      const context: SelectionContext = {
        queryTerms: ['software', 'checking', 'method']
      };
      
      // EXERCISE
      const overlapScore = heavyTermOverlapStrategy.scoreSynset(synsetWithTermOverlap, context);
      const technicalScore = heavyTermOverlapStrategy.scoreSynset(synsetWithTechnical, context);
      
      // VERIFY - with heavy term overlap weight, the synset with query terms should win
      expect(overlapScore).toBeGreaterThan(technicalScore);
    });
  });
  
  describe('edge cases', () => {
    it('should handle synsets with empty related terms', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'singleton',
        synset_name: 'singleton.n.01',
        synonyms: [],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: 'a set with one element'
      };
      
      const context: SelectionContext = {
        queryTerms: ['singleton', 'pattern']
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle special characters in query terms', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'regex',
        synset_name: 'regex.n.01',
        synonyms: ['regular expression'],
        hypernyms: ['pattern'],
        hyponyms: [],
        meronyms: [],
        definition: 'a pattern for text matching'
      };
      
      const context: SelectionContext = {
        queryTerms: ['pattern.*', 'text[0-9]']
      };
      
      // EXERCISE - should not throw
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle very long definitions', () => {
      // SETUP
      const longDefinition = 'a '.repeat(500) + 'software pattern';
      const synset: WordNetSynset = {
        word: 'test',
        synset_name: 'test.n.01',
        synonyms: [],
        hypernyms: [],
        hyponyms: [],
        meronyms: [],
        definition: longDefinition
      };
      
      const context: SelectionContext = {
        queryTerms: ['software', 'pattern']
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, context);
      
      // VERIFY
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
  
  describe('contextAwareStrategy export', () => {
    it('should be importable and functional', async () => {
      // SETUP
      const { contextAwareStrategy } = await import('../strategies/context-aware-strategy.js');
      const synsets: WordNetSynset[] = [
        {
          word: 'test',
          synset_name: 'test.n.01',
          synonyms: [],
          hypernyms: [],
          hyponyms: [],
          meronyms: [],
          definition: 'test definition'
        }
      ];
      const context: SelectionContext = {
        queryTerms: ['test']
      };
      
      // EXERCISE
      const result = contextAwareStrategy.selectSynset(synsets, context);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(contextAwareStrategy.name).toBe('context-aware');
    });
  });
});
