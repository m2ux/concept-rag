import { describe, it, expect } from 'vitest';
import {
  ConceptRAGError,
  DataIntegrityError,
  ConceptNotFoundError,
  InvalidEmbeddingsError,
  SchemaValidationError
} from '../index.js';

describe('Data-integrity exceptions', () => {
  describe('ConceptNotFoundError', () => {
    it('preserves the conceptName, code, and message', () => {
      const error = new ConceptNotFoundError('machine-learning');

      expect(error.conceptName).toBe('machine-learning');
      expect(error.code).toBe('CONCEPT_NOT_FOUND');
      expect(error.message).toBe('Concept "machine-learning" not found');
      expect(error.context).toMatchObject({ conceptName: 'machine-learning' });
    });

    it('is a ConceptRAGError and a DataIntegrityError', () => {
      const error = new ConceptNotFoundError('x');

      expect(error).toBeInstanceOf(ConceptRAGError);
      expect(error).toBeInstanceOf(DataIntegrityError);
      expect(error.name).toBe('ConceptNotFoundError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('InvalidEmbeddingsError', () => {
    it('preserves conceptName, embeddingDimension, code, and message', () => {
      const error = new InvalidEmbeddingsError('graph-theory', 128);

      expect(error.conceptName).toBe('graph-theory');
      expect(error.embeddingDimension).toBe(128);
      expect(error.code).toBe('INVALID_EMBEDDINGS');
      expect(error.message).toContain('dimension: 128, expected: 384');
      expect(error.context).toMatchObject({
        conceptName: 'graph-theory',
        embeddingDimension: 128,
        expectedDimension: 384
      });
      expect(error).toBeInstanceOf(DataIntegrityError);
    });
  });

  describe('SchemaValidationError', () => {
    it('preserves fieldName, expectedType, actualType, code, and message', () => {
      const error = new SchemaValidationError('vector', 'array', 'string');

      expect(error.fieldName).toBe('vector');
      expect(error.expectedType).toBe('array');
      expect(error.actualType).toBe('string');
      expect(error.code).toBe('SCHEMA_VALIDATION_ERROR');
      expect(error.message).toBe(
        'Schema validation failed for field "vector": expected array, got string'
      );
      expect(error).toBeInstanceOf(DataIntegrityError);
    });
  });
});
