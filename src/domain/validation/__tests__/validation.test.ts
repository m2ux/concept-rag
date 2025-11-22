/**
 * Validation Layer Tests
 * 
 * Tests for functional validation framework.
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationResult,
  CommonValidations,
  BaseValidator
} from '../validation.js';

describe('ValidationResult', () => {
  describe('ok', () => {
    it('should create successful result', () => {
      const result = ValidationResult.ok();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.firstError).toBeUndefined();
    });
  });
  
  describe('error', () => {
    it('should create failed result with one error', () => {
      const result = ValidationResult.error('Test error');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Test error']);
      expect(result.firstError).toBe('Test error');
    });
  });
  
  describe('errors', () => {
    it('should create failed result with multiple errors', () => {
      const result = ValidationResult.errors(['Error 1', 'Error 2']);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Error 1', 'Error 2']);
      expect(result.firstError).toBe('Error 1');
    });
  });
  
  describe('and', () => {
    it('should combine two successful results', () => {
      const result1 = ValidationResult.ok();
      const result2 = ValidationResult.ok();
      const combined = result1.and(result2);
      
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toEqual([]);
    });
    
    it('should combine success with failure', () => {
      const result1 = ValidationResult.ok();
      const result2 = ValidationResult.error('Error');
      const combined = result1.and(result2);
      
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toEqual(['Error']);
    });
    
    it('should combine two failures', () => {
      const result1 = ValidationResult.error('Error 1');
      const result2 = ValidationResult.error('Error 2');
      const combined = result1.and(result2);
      
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toEqual(['Error 1', 'Error 2']);
    });
  });
  
  describe('map', () => {
    it('should execute function if valid', () => {
      const result = ValidationResult.ok();
      const mapped = result.map(() => 'success');
      
      expect(mapped).toBe('success');
    });
    
    it('should not execute function if invalid', () => {
      const result = ValidationResult.error('Error');
      const mapped = result.map(() => 'success');
      
      expect(mapped).toBeUndefined();
    });
  });
  
  describe('onError', () => {
    it('should execute callback if invalid', () => {
      const result = ValidationResult.error('Test error');
      let called = false;
      let capturedErrors: string[] = [];
      
      result.onError((errors) => {
        called = true;
        capturedErrors = errors;
      });
      
      expect(called).toBe(true);
      expect(capturedErrors).toEqual(['Test error']);
    });
    
    it('should not execute callback if valid', () => {
      const result = ValidationResult.ok();
      let called = false;
      
      result.onError(() => {
        called = true;
      });
      
      expect(called).toBe(false);
    });
    
    it('should return this for chaining', () => {
      const result = ValidationResult.error('Error');
      const returned = result.onError(() => {});
      
      expect(returned).toBe(result);
    });
  });
  
  describe('toJSON', () => {
    it('should serialize valid result', () => {
      const result = ValidationResult.ok();
      const json = result.toJSON();
      
      expect(json).toEqual({
        valid: true,
        errors: []
      });
    });
    
    it('should serialize invalid result', () => {
      const result = ValidationResult.errors(['Error 1', 'Error 2']);
      const json = result.toJSON();
      
      expect(json).toEqual({
        valid: false,
        errors: ['Error 1', 'Error 2']
      });
    });
  });
});

describe('CommonValidations', () => {
  describe('notEmpty', () => {
    const rule = CommonValidations.notEmpty('text');
    
    it('should pass for non-empty string', () => {
      const result = rule.validate('hello');
      expect(result.isValid).toBe(true);
    });
    
    it('should fail for empty string', () => {
      const result = rule.validate('');
      expect(result.isValid).toBe(false);
      expect(result.firstError).toContain('text is required');
    });
    
    it('should fail for whitespace-only string', () => {
      const result = rule.validate('   ');
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('length', () => {
    it('should validate minimum length', () => {
      const rule = CommonValidations.length('password', 8);
      
      expect(rule.validate('1234567').isValid).toBe(false);
      expect(rule.validate('12345678').isValid).toBe(true);
      expect(rule.validate('123456789').isValid).toBe(true);
    });
    
    it('should validate maximum length', () => {
      const rule = CommonValidations.length('username', undefined, 10);
      
      expect(rule.validate('short').isValid).toBe(true);
      expect(rule.validate('1234567890').isValid).toBe(true);
      expect(rule.validate('12345678901').isValid).toBe(false);
    });
    
    it('should validate both min and max', () => {
      const rule = CommonValidations.length('code', 3, 5);
      
      expect(rule.validate('12').isValid).toBe(false);
      expect(rule.validate('123').isValid).toBe(true);
      expect(rule.validate('12345').isValid).toBe(true);
      expect(rule.validate('123456').isValid).toBe(false);
    });
  });
  
  describe('range', () => {
    it('should validate minimum value', () => {
      const rule = CommonValidations.range('age', 0);
      
      expect(rule.validate(-1).isValid).toBe(false);
      expect(rule.validate(0).isValid).toBe(true);
      expect(rule.validate(100).isValid).toBe(true);
    });
    
    it('should validate maximum value', () => {
      const rule = CommonValidations.range('percentage', undefined, 100);
      
      expect(rule.validate(99).isValid).toBe(true);
      expect(rule.validate(100).isValid).toBe(true);
      expect(rule.validate(101).isValid).toBe(false);
    });
    
    it('should validate both min and max', () => {
      const rule = CommonValidations.range('score', 1, 10);
      
      expect(rule.validate(0).isValid).toBe(false);
      expect(rule.validate(5).isValid).toBe(true);
      expect(rule.validate(11).isValid).toBe(false);
    });
  });
  
  describe('positive', () => {
    const rule = CommonValidations.positive('count');
    
    it('should pass for positive numbers', () => {
      expect(rule.validate(1).isValid).toBe(true);
      expect(rule.validate(0.1).isValid).toBe(true);
      expect(rule.validate(1000).isValid).toBe(true);
    });
    
    it('should fail for zero and negative', () => {
      expect(rule.validate(0).isValid).toBe(false);
      expect(rule.validate(-1).isValid).toBe(false);
      expect(rule.validate(-0.1).isValid).toBe(false);
    });
  });
  
  describe('oneOf', () => {
    const rule = CommonValidations.oneOf('status', ['active', 'inactive', 'pending']);
    
    it('should pass for allowed values', () => {
      expect(rule.validate('active').isValid).toBe(true);
      expect(rule.validate('inactive').isValid).toBe(true);
      expect(rule.validate('pending').isValid).toBe(true);
    });
    
    it('should fail for disallowed values', () => {
      const result = rule.validate('unknown');
      expect(result.isValid).toBe(false);
      expect(result.firstError).toContain('active, inactive, pending');
    });
  });
  
  describe('pattern', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rule = CommonValidations.pattern('email', emailPattern);
    
    it('should pass for matching patterns', () => {
      expect(rule.validate('test@example.com').isValid).toBe(true);
    });
    
    it('should fail for non-matching patterns', () => {
      expect(rule.validate('not-an-email').isValid).toBe(false);
      expect(rule.validate('missing@domain').isValid).toBe(false);
    });
    
    it('should use custom error message', () => {
      const customRule = CommonValidations.pattern(
        'code',
        /^[A-Z]{3}$/,
        'Must be 3 uppercase letters'
      );
      
      const result = customRule.validate('abc');
      expect(result.isValid).toBe(false);
      expect(result.firstError).toBe('Must be 3 uppercase letters');
    });
  });
  
  describe('notEmptyArray', () => {
    const rule = CommonValidations.notEmptyArray('items');
    
    it('should pass for non-empty arrays', () => {
      expect(rule.validate([1]).isValid).toBe(true);
      expect(rule.validate([1, 2, 3]).isValid).toBe(true);
    });
    
    it('should fail for empty arrays', () => {
      expect(rule.validate([]).isValid).toBe(false);
    });
  });
  
  describe('custom', () => {
    const evenRule = CommonValidations.custom(
      'number',
      (n: number) => n % 2 === 0,
      'Must be even'
    );
    
    it('should use custom predicate', () => {
      expect(evenRule.validate(2).isValid).toBe(true);
      expect(evenRule.validate(4).isValid).toBe(true);
      expect(evenRule.validate(3).isValid).toBe(false);
    });
    
    it('should use custom error message', () => {
      const result = evenRule.validate(3);
      expect(result.firstError).toBe('Must be even');
    });
  });
});

describe('BaseValidator', () => {
  class TestValidator extends BaseValidator<number> {
    validate(value: number): ValidationResult {
      const rules = [
        this.createRule('positive', (v) => v > 0, 'Must be positive'),
        this.createRule('even', (v) => v % 2 === 0, 'Must be even')
      ];
      return this.validateRules(value, rules);
    }
  }
  
  it('should validate against multiple rules', () => {
    const validator = new TestValidator();
    
    expect(validator.validate(2).isValid).toBe(true);
    expect(validator.validate(4).isValid).toBe(true);
  });
  
  it('should fail if any rule fails', () => {
    const validator = new TestValidator();
    
    const result1 = validator.validate(-2);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain('Must be positive');
    
    const result2 = validator.validate(3);
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Must be even');
  });
  
  it('should collect all errors', () => {
    const validator = new TestValidator();
    
    const result = validator.validate(-3);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Must be positive');
    expect(result.errors).toContain('Must be even');
  });
});

describe('ValidationResult chaining', () => {
  it('should support complex validation chains', () => {
    const textRule = CommonValidations.notEmpty('text');
    const lengthRule = CommonValidations.length('text', 3, 10);
    
    const input = 'hello';
    const result = textRule.validate(input).and(lengthRule.validate(input));
    
    expect(result.isValid).toBe(true);
  });
  
  it('should collect all errors from chain', () => {
    const textRule = CommonValidations.notEmpty('text');
    const lengthRule = CommonValidations.length('text', 10, 20);
    
    const input = 'hi';
    const result = textRule.validate(input).and(lengthRule.validate(input));
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1); // Length check fails
  });
});

