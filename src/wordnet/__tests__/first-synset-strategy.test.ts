/**
 * Unit Tests for FirstSynsetStrategy
 * 
 * Tests the default synset selection strategy that returns the first
 * (most common) synset from WordNet results.
 * 
 * Follows Four-Phase Test pattern: Setup, Exercise, Verify, Teardown.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FirstSynsetStrategy } from '../strategies/first-synset-strategy.js';
import { SelectionContext } from '../strategies/synset-selection-strategy.js';
import { WordNetSynset } from '../../concepts/types.js';

describe('FirstSynsetStrategy', () => {
  let strategy: FirstSynsetStrategy;
  let defaultContext: SelectionContext;
  
  beforeEach(() => {
    // SETUP
    strategy = new FirstSynsetStrategy();
    defaultContext = {
      queryTerms: ['test', 'query']
    };
  });
  
  describe('name property', () => {
    it('should have correct strategy name', () => {
      // VERIFY
      expect(strategy.name).toBe('first-synset');
    });
  });
  
  describe('selectSynset', () => {
    it('should return first synset from non-empty array', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'test',
          synset_name: 'test.n.01',
          synonyms: ['trial', 'exam'],
          hypernyms: ['examination'],
          hyponyms: ['quiz'],
          meronyms: [],
          definition: 'a set of questions'
        },
        {
          word: 'test',
          synset_name: 'test.v.01',
          synonyms: ['examine', 'try'],
          hypernyms: ['evaluate'],
          hyponyms: [],
          meronyms: [],
          definition: 'to examine or try'
        }
      ];
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, defaultContext);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result?.synset_name).toBe('test.n.01');
      expect(result?.definition).toBe('a set of questions');
    });
    
    it('should return undefined for empty synset array', () => {
      // SETUP
      const synsets: WordNetSynset[] = [];
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, defaultContext);
      
      // VERIFY
      expect(result).toBeUndefined();
    });
    
    it('should ignore context parameter', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'decorator',
          synset_name: 'decorator.n.01',
          synonyms: ['ornament'],
          hypernyms: ['person'],
          hyponyms: [],
          meronyms: [],
          definition: 'a person who decorates'
        },
        {
          word: 'decorator',
          synset_name: 'decorator.n.02',
          synonyms: ['wrapper'],
          hypernyms: ['pattern'],
          hyponyms: [],
          meronyms: [],
          definition: 'a design pattern that wraps objects'
        }
      ];
      
      const technicalContext: SelectionContext = {
        queryTerms: ['software', 'design', 'pattern'],
        domainHints: ['programming', 'software']
      };
      
      // EXERCISE - context should be ignored, still returns first
      const result = strategy.selectSynset(synsets, technicalContext);
      
      // VERIFY
      expect(result?.synset_name).toBe('decorator.n.01');
      expect(result?.definition).toBe('a person who decorates');
    });
    
    it('should handle single synset array', () => {
      // SETUP
      const synsets: WordNetSynset[] = [
        {
          word: 'singleton',
          synset_name: 'singleton.n.01',
          synonyms: [],
          hypernyms: ['set'],
          hyponyms: [],
          meronyms: [],
          definition: 'a set containing exactly one element'
        }
      ];
      
      // EXERCISE
      const result = strategy.selectSynset(synsets, defaultContext);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(result?.synset_name).toBe('singleton.n.01');
    });
  });
  
  describe('scoreSynset', () => {
    it('should return 1.0 for any valid synset', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'test',
        synset_name: 'test.n.01',
        synonyms: ['trial'],
        hypernyms: ['examination'],
        hyponyms: [],
        meronyms: [],
        definition: 'a set of questions'
      };
      
      // EXERCISE
      const score = strategy.scoreSynset(synset, defaultContext);
      
      // VERIFY
      expect(score).toBe(1.0);
    });
    
    it('should return 0.0 for null/undefined synset', () => {
      // EXERCISE
      const score = strategy.scoreSynset(null as any, defaultContext);
      
      // VERIFY
      expect(score).toBe(0.0);
    });
    
    it('should ignore context in scoring', () => {
      // SETUP
      const synset: WordNetSynset = {
        word: 'pattern',
        synset_name: 'pattern.n.01',
        synonyms: ['design'],
        hypernyms: ['structure'],
        hyponyms: [],
        meronyms: [],
        definition: 'a model or design'
      };
      
      const context1: SelectionContext = { queryTerms: ['software'] };
      const context2: SelectionContext = { 
        queryTerms: ['fashion', 'clothing'],
        domainHints: ['textile']
      };
      
      // EXERCISE
      const score1 = strategy.scoreSynset(synset, context1);
      const score2 = strategy.scoreSynset(synset, context2);
      
      // VERIFY - same score regardless of context
      expect(score1).toBe(score2);
    });
  });
  
  describe('defaultStrategy export', () => {
    it('should be importable and functional', async () => {
      // SETUP
      const { defaultStrategy } = await import('../strategies/first-synset-strategy.js');
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
      
      // EXERCISE
      const result = defaultStrategy.selectSynset(synsets, defaultContext);
      
      // VERIFY
      expect(result).toBeDefined();
      expect(defaultStrategy.name).toBe('first-synset');
    });
  });
});
