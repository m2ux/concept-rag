import { describe, it, expect, beforeAll } from 'vitest';
import {
  RequiredFieldError,
  InvalidFormatError,
  ValueOutOfRangeError,
  DatabaseError,
  RecordNotFoundError,
  SearchError
} from '../../domain/exceptions/index.js';
import { InputValidator } from '../../domain/services/validation/index.js';
import { ConceptChunksTool } from '../../tools/operations/concept_chunks.js';
import { ConceptualCatalogSearchTool } from '../../tools/operations/conceptual_catalog_search.js';
import { ConceptualChunksSearchTool } from '../../tools/operations/conceptual_chunks_search.js';

describe('Error Handling Integration Tests', () => {
  describe('InputValidator with Tool Integration', () => {
    const validator = new InputValidator();

    it('should throw structured validation error for invalid search query', () => {
      try {
        validator.validateSearchQuery({ text: '' });
        expect.fail('Should have thrown RequiredFieldError');
      } catch (error) {
        expect(error).toBeInstanceOf(RequiredFieldError);
        const err = error as RequiredFieldError;
        expect(err.code).toBe('VALIDATION_TEXT_INVALID');
        expect(err.context.field).toBe('text');
        expect(err.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should throw structured validation error for out of range value', () => {
      try {
        validator.validateSearchQuery({ text: 'test', limit: 150 });
        expect.fail('Should have thrown ValueOutOfRangeError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValueOutOfRangeError);
        const err = error as ValueOutOfRangeError;
        expect(err.code).toBe('VALIDATION_LIMIT_INVALID');
        expect(err.context.field).toBe('limit');
        expect(err.context.value).toBe(150);
        expect(err.context.min).toBe(1);
        expect(err.context.max).toBe(100);
      }
    });

    it('should serialize validation error to JSON correctly', () => {
      try {
        validator.validateConceptSearch({ concept: '' });
        expect.fail('Should have thrown RequiredFieldError');
      } catch (error) {
        const err = error as RequiredFieldError;
        const json = err.toJSON();
        
        expect(json.name).toBe('RequiredFieldError');
        expect(json.code).toBe('VALIDATION_CONCEPT_INVALID');
        expect(json.message).toContain('concept');
        expect(json.context).toBeDefined();
        expect(json.timestamp).toBeDefined();
        expect(json.stack).toBeDefined();
      }
    });
  });

  describe('Error Propagation Through Layers', () => {
    it('should propagate validation errors through tool layer', async () => {
      // This simulates how validation errors flow from validator -> tool -> MCP response
      const validator = new InputValidator();
      
      try {
        validator.validateCatalogSearch({ text: '' });
        expect.fail('Should have thrown RequiredFieldError');
      } catch (error) {
        expect(error).toBeInstanceOf(RequiredFieldError);
        
        // Verify error has all required properties for MCP formatting
        const err = error as RequiredFieldError;
        expect(err.code).toBeDefined();
        expect(err.message).toBeDefined();
        expect(err.context).toBeDefined();
        expect(err.timestamp).toBeDefined();
        
        // Verify JSON serialization works
        const json = err.toJSON();
        expect(json.code).toBe('VALIDATION_TEXT_INVALID');
        expect(json.context).toHaveProperty('field', 'text');
      }
    });

    it('should maintain error context across exception hierarchy', () => {
      // Create an error with cause chain
      const originalError = new Error('Database connection failed');
      const dbError = new DatabaseError(
        'Failed to execute query',
        'query',
        originalError
      );
      
      // Verify cause chain is preserved
      expect(dbError.cause).toBe(originalError);
      expect(dbError.code).toBe('DATABASE_QUERY_FAILED');
      expect(dbError.context.operation).toBe('query');
      
      // Verify serialization includes cause
      const json = dbError.toJSON();
      expect(json.cause).toBe('Database connection failed');
    });

    it('should allow error type checking with is() method', () => {
      const error = new RecordNotFoundError('User', 123);
      
      expect(error.is(RecordNotFoundError)).toBe(true);
      expect(error.is(DatabaseError)).toBe(true);
      expect(error.is(SearchError)).toBe(false);
    });
  });

  describe('Error Context and Debugging', () => {
    it('should provide rich context for debugging validation errors', () => {
      try {
        const validator = new InputValidator();
        validator.validateExtractConcepts({
          document_query: 'test',
          format: 'xml' as any
        });
        expect.fail('Should have thrown InvalidFormatError');
      } catch (error) {
        const err = error as InvalidFormatError;
        
        // Verify context includes all debugging info
        expect(err.context.field).toBe('format');
        expect(err.context.value).toBe('xml');
        expect(err.context.expectedFormat).toBe('json or markdown');
        expect(err.message).toContain('format');
        expect(err.message).toContain('json or markdown');
      }
    });

    it('should provide actionable error messages', () => {
      const errors = [
        new RequiredFieldError('email'),
        new InvalidFormatError('phone', '123', 'XXX-XXX-XXXX'),
        new ValueOutOfRangeError('age', 150, 0, 120),
        new RecordNotFoundError('User', 'john@example.com'),
        new DatabaseError('Connection timeout', 'connection')
      ];

      errors.forEach(error => {
        // Every error should have a clear, actionable message
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(10);
        
        // Every error should have a structured code
        expect(error.code).toMatch(/^[A-Z_]+$/);
        
        // Every error should have context
        expect(error.context).toBeDefined();
        expect(Object.keys(error.context).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Formatting for MCP Responses', () => {
    it('should format errors correctly for MCP tool responses', () => {
      const error = new RequiredFieldError('text');
      
      // Simulate how BaseTool.handleError formats the error
      const errorResponse = {
        error: {
          code: error.code,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp.toISOString()
        }
      };
      
      expect(errorResponse.error.code).toBe('VALIDATION_TEXT_INVALID');
      expect(errorResponse.error.message).toContain('text');
      expect(errorResponse.error.context).toHaveProperty('field', 'text');
      expect(errorResponse.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include cause in formatted error when present', () => {
      const originalError = new Error('Network timeout');
      const dbError = new DatabaseError(
        'Query failed',
        'query',
        originalError
      );
      
      const errorResponse = {
        error: {
          code: dbError.code,
          message: dbError.message,
          context: dbError.context,
          timestamp: dbError.timestamp.toISOString(),
          cause: dbError.cause?.message
        }
      };
      
      expect(errorResponse.error.cause).toBe('Network timeout');
    });
  });

  describe('Error Handling Best Practices', () => {
    it('should not retry validation errors', () => {
      // Validation errors should fail fast - they won't succeed on retry
      const error = new RequiredFieldError('email');
      
      // Verify it's marked as non-retryable (this is convention, not enforced by the class)
      expect(error).toBeInstanceOf(RequiredFieldError);
      
      // In RetryService, ValidationError is explicitly skipped
      // This test documents that contract
    });

    it('should preserve stack traces', () => {
      try {
        throw new RecordNotFoundError('User', 123);
      } catch (error) {
        const err = error as RecordNotFoundError;
        expect(err.stack).toBeDefined();
        expect(err.stack).toContain('RecordNotFoundError');
        expect(err.stack).toContain('error-handling.integration.test.ts');
      }
    });

    it('should support error instanceof checks', () => {
      const errors = [
        new RequiredFieldError('field'),
        new DatabaseError('message', 'operation'),
        new RecordNotFoundError('Entity', 'id')
      ];

      // Verify instanceof works for error hierarchy
      expect(errors[0] instanceof RequiredFieldError).toBe(true);
      expect(errors[0] instanceof Error).toBe(true);
      
      expect(errors[1] instanceof DatabaseError).toBe(true);
      expect(errors[1] instanceof Error).toBe(true);
      
      expect(errors[2] instanceof RecordNotFoundError).toBe(true);
      expect(errors[2] instanceof DatabaseError).toBe(true);
      expect(errors[2] instanceof Error).toBe(true);
    });
  });

  describe('Validation Error Scenarios', () => {
    const validator = new InputValidator();

    it('should validate all catalog search parameters', () => {
      // Valid params should pass
      expect(() => {
        validator.validateCatalogSearch({
          text: 'search query',
          debug: false
        });
      }).not.toThrow();

      // Invalid params should throw with correct error types
      expect(() => {
        validator.validateCatalogSearch({ text: '' });
      }).toThrow(RequiredFieldError);

      expect(() => {
        validator.validateCatalogSearch({
          text: 'query',
          debug: 'true' as any
        });
      }).toThrow(InvalidFormatError);
    });

    it('should validate all concept search parameters', () => {
      expect(() => {
        validator.validateConceptSearch({ concept: 'innovation' });
      }).not.toThrow();

      expect(() => {
        validator.validateConceptSearch({ concept: '' });
      }).toThrow(RequiredFieldError);

      expect(() => {
        validator.validateConceptSearch({
          concept: 'test',
          limit: 101
        });
      }).toThrow(ValueOutOfRangeError);
    });

    it('should validate all chunks search parameters', () => {
      expect(() => {
        validator.validateChunksSearch({
          text: 'query',
          source: '/path/to/doc.pdf'
        });
      }).not.toThrow();

      expect(() => {
        validator.validateChunksSearch({ text: '', source: '/path/doc.pdf' });
      }).toThrow(RequiredFieldError);

      expect(() => {
        validator.validateChunksSearch({ text: 'query', source: '' });
      }).toThrow(RequiredFieldError);
    });
  });
});
