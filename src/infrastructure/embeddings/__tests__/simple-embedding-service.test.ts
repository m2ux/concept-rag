/**
 * Unit Tests for SimpleEmbeddingService
 * 
 * Tests the hash-based embedding generation service.
 * Follows Four-Phase Test pattern from TDD for Embedded C (Grenning).
 */

import { describe, it, expect } from 'vitest';
import { SimpleEmbeddingService } from '../simple-embedding-service.js';

describe('SimpleEmbeddingService', () => {
  describe('generateEmbedding', () => {
    it('should generate 384-dimensional embedding', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = 'test input';
      
      // EXERCISE
      const embedding = service.generateEmbedding(text);
      
      // VERIFY
      expect(embedding).toHaveLength(384);
    });
    
    it('should generate normalized embedding (unit vector)', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = 'normalize this text';
      
      // EXERCISE
      const embedding = service.generateEmbedding(text);
      
      // VERIFY - Calculate norm (should be ~1.0 for unit vector)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    });
    
    it('should generate different embeddings for different texts', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text1 = 'innovation';
      const text2 = 'creativity';
      
      // EXERCISE
      const embedding1 = service.generateEmbedding(text1);
      const embedding2 = service.generateEmbedding(text2);
      
      // VERIFY - Embeddings should be different
      expect(embedding1).not.toEqual(embedding2);
    });
    
    it('should generate consistent embeddings for same text', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = 'consistency test';
      
      // EXERCISE
      const embedding1 = service.generateEmbedding(text);
      const embedding2 = service.generateEmbedding(text);
      
      // VERIFY - Should be identical
      expect(embedding1).toEqual(embedding2);
    });
    
    it('should handle empty string', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = '';
      
      // EXERCISE
      const embedding = service.generateEmbedding(text);
      
      // VERIFY
      expect(embedding).toHaveLength(384);
      // Empty string is still normalized to unit vector (norm = 1)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    });
    
    it('should handle long text', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = 'word '.repeat(1000); // 5000 characters
      
      // EXERCISE
      const embedding = service.generateEmbedding(text);
      
      // VERIFY
      expect(embedding).toHaveLength(384);
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1.0, 5);
    });
    
    it('should handle special characters', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = '!@#$%^&*()_+-={}[]|:";\'<>?,./';
      
      // EXERCISE
      const embedding = service.generateEmbedding(text);
      
      // VERIFY
      expect(embedding).toHaveLength(384);
    });
    
    it('should encode text length information', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const shortText = 'short';
      const longText = 'this is a much longer text with many more words and characters';
      
      // EXERCISE
      const shortEmbedding = service.generateEmbedding(shortText);
      const longEmbedding = service.generateEmbedding(longText);
      
      // VERIFY - First dimensions encode length information
      // Longer text should have different values in first dimensions
      expect(shortEmbedding[0]).not.toEqual(longEmbedding[0]); // text length
      expect(shortEmbedding[1]).not.toEqual(longEmbedding[1]); // word count
    });
  });
  
  describe('performance characteristics', () => {
    it('should be fast enough for testing (< 10ms)', () => {
      // SETUP
      const service = new SimpleEmbeddingService();
      const text = 'performance test text with some words';
      
      // EXERCISE
      const start = Date.now();
      service.generateEmbedding(text);
      const duration = Date.now() - start;
      
      // VERIFY
      expect(duration).toBeLessThan(10);
    });
  });
});
