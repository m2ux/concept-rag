/**
 * Embedding Provider Factory Tests
 * 
 * Tests for embedding provider factory and selection.
 */

import { describe, it, expect } from 'vitest';
import {
  EmbeddingProviderFactory,
  createEmbeddingService,
  UnsupportedEmbeddingProviderError
} from '../embedding-provider-factory.js';
import { SimpleEmbeddingService } from '../simple-embedding-service.js';
import type { EmbeddingConfig } from '../../../application/config/types.js';

describe('EmbeddingProviderFactory', () => {
  const defaultConfig: EmbeddingConfig = {
    provider: 'simple',
    dimensions: 384,
    batchSize: 100
  };
  
  describe('create', () => {
    it('should create simple provider', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      const provider = factory.create('simple');
      
      expect(provider).toBeInstanceOf(SimpleEmbeddingService);
    });
    
    it('should be case-insensitive', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      
      expect(() => factory.create('SIMPLE')).not.toThrow();
      expect(() => factory.create('Simple')).not.toThrow();
    });
    
    it('should throw for OpenAI provider (not yet implemented)', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      
      expect(() => factory.create('openai')).toThrow('OpenAI embedding provider not yet implemented');
    });
    
    it('should throw for Voyage provider (not yet implemented)', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      
      expect(() => factory.create('voyage')).toThrow('Voyage AI embedding provider not yet implemented');
    });
    
    it('should throw for Ollama provider (not yet implemented)', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      
      expect(() => factory.create('ollama')).toThrow('Ollama embedding provider not yet implemented');
    });
    
    it('should throw UnsupportedEmbeddingProviderError for unknown provider', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      
      expect(() => factory.create('unknown')).toThrow(UnsupportedEmbeddingProviderError);
      expect(() => factory.create('unknown')).toThrow('Unsupported embedding provider: "unknown"');
    });
  });
  
  describe('createFromConfig', () => {
    it('should create provider based on config', () => {
      const config: EmbeddingConfig = {
        provider: 'simple',
        dimensions: 384,
        batchSize: 100
      };
      
      const factory = new EmbeddingProviderFactory(config);
      const provider = factory.createFromConfig();
      
      expect(provider).toBeInstanceOf(SimpleEmbeddingService);
    });
    
    it('should use provider from config', () => {
      const config: EmbeddingConfig = {
        provider: 'SIMPLE',
        dimensions: 384,
        batchSize: 100
      };
      
      const factory = new EmbeddingProviderFactory(config);
      const provider = factory.createFromConfig();
      
      expect(provider).toBeDefined();
    });
  });
  
  describe('isSupported', () => {
    const factory = new EmbeddingProviderFactory(defaultConfig);
    
    it('should return true for supported providers', () => {
      expect(factory.isSupported('simple')).toBe(true);
      expect(factory.isSupported('SIMPLE')).toBe(true);
    });
    
    it('should return false for unsupported providers', () => {
      expect(factory.isSupported('unknown')).toBe(false);
      expect(factory.isSupported('invalid')).toBe(false);
    });
    
    it('should return false for not-yet-implemented providers', () => {
      // These will throw errors but are not in supportedProviders list yet
      expect(factory.isSupported('openai')).toBe(false);
      expect(factory.isSupported('voyage')).toBe(false);
      expect(factory.isSupported('ollama')).toBe(false);
    });
  });
  
  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      const supported = factory.getSupportedProviders();
      
      expect(supported).toContain('simple');
      expect(supported.length).toBeGreaterThan(0);
    });
    
    it('should return a copy of the array', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      const supported1 = factory.getSupportedProviders();
      const supported2 = factory.getSupportedProviders();
      
      expect(supported1).not.toBe(supported2); // Different array instances
      expect(supported1).toEqual(supported2); // Same contents
    });
  });
  
  describe('provider functionality', () => {
    it('should create working embedding service', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      const provider = factory.create('simple');
      
      const embedding = provider.generateEmbedding('test text');
      
      expect(embedding).toHaveLength(384);
      expect(embedding.every(n => typeof n === 'number')).toBe(true);
    });
    
    it('should create consistent embeddings', () => {
      const factory = new EmbeddingProviderFactory(defaultConfig);
      const provider = factory.create('simple');
      
      const emb1 = provider.generateEmbedding('test');
      const emb2 = provider.generateEmbedding('test');
      
      expect(emb1).toEqual(emb2);
    });
  });
});

describe('createEmbeddingService', () => {
  it('should create service from config', () => {
    const config: EmbeddingConfig = {
      provider: 'simple',
      dimensions: 384,
      batchSize: 100
    };
    
    const service = createEmbeddingService(config);
    
    expect(service).toBeInstanceOf(SimpleEmbeddingService);
  });
  
  it('should create working service', () => {
    const config: EmbeddingConfig = {
      provider: 'simple',
      dimensions: 384,
      batchSize: 100
    };
    
    const service = createEmbeddingService(config);
    const embedding = service.generateEmbedding('test');
    
    expect(embedding).toHaveLength(384);
  });
});

describe('UnsupportedEmbeddingProviderError', () => {
  it('should have correct name', () => {
    const error = new UnsupportedEmbeddingProviderError('test', ['simple']);
    expect(error.name).toBe('UnsupportedEmbeddingProviderError');
  });
  
  it('should include provider name in message', () => {
    const error = new UnsupportedEmbeddingProviderError('test', ['simple']);
    expect(error.message).toContain('test');
  });
  
  it('should include supported providers in message', () => {
    const error = new UnsupportedEmbeddingProviderError('test', ['simple', 'other']);
    expect(error.message).toContain('simple, other');
  });
});
