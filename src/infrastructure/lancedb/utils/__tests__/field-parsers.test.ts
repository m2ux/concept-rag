/**
 * Unit Tests for Field Parsers
 * 
 * Tests utility functions for parsing LanceDB fields and SQL escaping.
 * Follows the "Four-Phase Test" pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect } from 'vitest';
import { parseArrayField, parseJsonField, escapeSqlString } from '../field-parsers.js';

describe('parseArrayField', () => {
  describe('when given a JSON string', () => {
    it('should parse valid JSON array string', () => {
      // SETUP
      const input = '["item1", "item2", "item3"]';
      
      // EXERCISE
      const result = parseArrayField(input);
      
      // VERIFY
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });
    
    it('should return empty array for invalid JSON', () => {
      // SETUP
      const input = '{invalid json}';
      
      // EXERCISE
      const result = parseArrayField(input);
      
      // VERIFY
      expect(result).toEqual([]);
    });
  });
  
  describe('when given an array', () => {
    it('should return the array as-is', () => {
      // SETUP
      const input = ['already', 'an', 'array'];
      
      // EXERCISE
      const result = parseArrayField(input);
      
      // VERIFY
      expect(result).toBe(input); // Same reference
      expect(result).toEqual(['already', 'an', 'array']);
    });
  });
  
  describe('when given an Arrow Vector (object with toArray)', () => {
    it('should call toArray and return the result', () => {
      // SETUP - Mock Arrow Vector object
      const mockArrowVector = {
        toArray: () => [1, 2, 3, 4, 5]
      };
      
      // EXERCISE
      const result = parseArrayField<number>(mockArrowVector);
      
      // VERIFY
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should handle Arrow Vector with string values', () => {
      // SETUP
      const mockArrowVector = {
        toArray: () => ['concept_a', 'concept_b']
      };
      
      // EXERCISE
      const result = parseArrayField<string>(mockArrowVector);
      
      // VERIFY
      expect(result).toEqual(['concept_a', 'concept_b']);
    });
    
    it('should handle Arrow Vector returning empty array', () => {
      // SETUP
      const mockArrowVector = {
        toArray: () => []
      };
      
      // EXERCISE
      const result = parseArrayField(mockArrowVector);
      
      // VERIFY
      expect(result).toEqual([]);
    });
  });
  
  describe('when given null or undefined', () => {
    it('should return empty array for null', () => {
      // SETUP & EXERCISE
      const result = parseArrayField(null);
      
      // VERIFY
      expect(result).toEqual([]);
    });
    
    it('should return empty array for undefined', () => {
      // SETUP & EXERCISE
      const result = parseArrayField(undefined);
      
      // VERIFY
      expect(result).toEqual([]);
    });
  });
  
  describe('when given other types', () => {
    it('should return empty array for numbers', () => {
      // SETUP & EXERCISE
      const result = parseArrayField(42 as any);
      
      // VERIFY
      expect(result).toEqual([]);
    });
    
    it('should return empty array for plain objects without toArray', () => {
      // SETUP & EXERCISE
      const result = parseArrayField({ key: 'value' } as any);
      
      // VERIFY
      expect(result).toEqual([]);
    });
  });
});

describe('parseJsonField (deprecated alias)', () => {
  it('should be an alias for parseArrayField', () => {
    // VERIFY
    expect(parseJsonField).toBe(parseArrayField);
  });
});

describe('escapeSqlString', () => {
  describe('SQL injection prevention', () => {
    it('should escape single quotes', () => {
      // SETUP
      const input = "test' OR '1'='1";
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe("test'' OR ''1''=''1");
    });
    
    it('should handle multiple single quotes', () => {
      // SETUP
      const input = "It's a test's string's";
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe("It''s a test''s string''s");
    });
    
    it('should return empty string for empty input', () => {
      // SETUP & EXERCISE
      const result = escapeSqlString('');
      
      // VERIFY
      expect(result).toBe('');
    });
    
    it('should not modify strings without quotes', () => {
      // SETUP
      const input = 'safe_input_123';
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe('safe_input_123');
    });
  });
  
  describe('edge cases', () => {
    it('should handle consecutive single quotes', () => {
      // SETUP
      const input = "''test''";
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe("''''test''''");
    });
    
    it('should handle quote at start', () => {
      // SETUP
      const input = "'test";
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe("''test");
    });
    
    it('should handle quote at end', () => {
      // SETUP
      const input = "test'";
      
      // EXERCISE
      const result = escapeSqlString(input);
      
      // VERIFY
      expect(result).toBe("test''");
    });
  });
});

