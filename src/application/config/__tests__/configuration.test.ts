/**
 * Configuration Service Tests
 * 
 * Tests for centralized configuration management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Configuration } from '../configuration.js';

describe('Configuration', () => {
  afterEach(() => {
    // Reset singleton between tests
    Configuration.reset();
  });
  
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const config = Configuration.initialize({});
      
      expect(config.database.url).toBe('~/.concept_rag');
      expect(config.database.tables.catalog).toBe('catalog');
      expect(config.database.tables.chunks).toBe('chunks');
      expect(config.database.tables.concepts).toBe('concepts');
      expect(config.database.tables.categories).toBe('categories');
    });
    
    it('should read from environment variables', () => {
      const env = {
        DATABASE_URL: '/custom/path',
        CATALOG_TABLE_NAME: 'custom_catalog',
        EMBEDDING_DIMENSIONS: '768',
        SEARCH_DEFAULT_LIMIT: '20'
      };
      
      const config = Configuration.initialize(env);
      
      expect(config.database.url).toBe('/custom/path');
      expect(config.database.tables.catalog).toBe('custom_catalog');
      expect(config.embeddings.dimensions).toBe(768);
      expect(config.search.defaultLimit).toBe(20);
    });
    
    it('should apply overrides', () => {
      const config = Configuration.initialize({}, {
        // @ts-expect-error - Type narrowing limitation
        database: { url: '/test/db' }
      });
      
      expect(config.database.url).toBe('/test/db');
    });
    
    it('should return same instance (singleton)', () => {
      const config1 = Configuration.initialize({});
      const config2 = Configuration.getInstance();
      
      expect(config1).toBe(config2);
    });
    
    it('should auto-initialize with process.env if getInstance called before initialize', () => {
      const config = Configuration.getInstance();
      
      // Should auto-initialize with defaults
      expect(config).toBeDefined();
      expect(config.database.url).toBe('~/.concept_rag');
    });
  });
  
  describe('database configuration', () => {
    it('should provide database configuration', () => {
      const config = Configuration.initialize({
        DATABASE_URL: '~/.my_db'
      });
      
      const db = config.database;
      expect(db.url).toBe('~/.my_db');
      expect(db.tables.catalog).toBe('catalog');
      expect(db.tables.chunks).toBe('chunks');
      expect(db.tables.concepts).toBe('concepts');
      expect(db.tables.categories).toBe('categories');
    });
  });
  
  describe('LLM configuration', () => {
    it('should provide default LLM configuration', () => {
      const config = Configuration.initialize({});
      
      const llm = config.llm;
      expect(llm.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(llm.summaryModel).toBe('x-ai/grok-4-fast');
      expect(llm.conceptModel).toBe('anthropic/claude-sonnet-4.5');
    });
    
    it('should read LLM config from environment', () => {
      const config = Configuration.initialize({
        OPENROUTER_BASE_URL: 'https://custom.api',
        OPENROUTER_API_KEY: 'test-key',
        OPENROUTER_SUMMARY_MODEL: 'custom-model'
      });
      
      const llm = config.llm;
      expect(llm.baseUrl).toBe('https://custom.api');
      expect(llm.apiKey).toBe('test-key');
      expect(llm.summaryModel).toBe('custom-model');
    });
  });
  
  describe('embeddings configuration', () => {
    it('should provide default embeddings configuration', () => {
      const config = Configuration.initialize({});
      
      const emb = config.embeddings;
      expect(emb.provider).toBe('simple');
      expect(emb.dimensions).toBe(384);
      expect(emb.batchSize).toBe(100);
    });
    
    it('should parse numeric values', () => {
      const config = Configuration.initialize({
        EMBEDDING_DIMENSIONS: '768',
        EMBEDDING_BATCH_SIZE: '50'
      });
      
      expect(config.embeddings.dimensions).toBe(768);
      expect(config.embeddings.batchSize).toBe(50);
    });
  });
  
  describe('search configuration', () => {
    it('should provide default search configuration', () => {
      const config = Configuration.initialize({});
      
      const search = config.search;
      expect(search.defaultLimit).toBe(10);
      expect(search.maxLimit).toBe(100);
      expect(search.weights.vector).toBe(0.25);
      expect(search.weights.bm25).toBe(0.25);
      expect(search.weights.title).toBe(0.20);
      expect(search.weights.concept).toBe(0.20);
      expect(search.weights.wordnet).toBe(0.10);
    });
    
    it('should allow custom search weights', () => {
      const config = Configuration.initialize({
        SEARCH_WEIGHT_VECTOR: '0.30',
        SEARCH_WEIGHT_BM25: '0.30',
        SEARCH_WEIGHT_TITLE: '0.15',
        SEARCH_WEIGHT_CONCEPT: '0.15',
        SEARCH_WEIGHT_WORDNET: '0.10'
      });
      
      expect(config.search.weights.vector).toBe(0.30);
      expect(config.search.weights.bm25).toBe(0.30);
    });
  });
  
  describe('performance configuration', () => {
    it('should provide default performance configuration', () => {
      const config = Configuration.initialize({});
      
      const perf = config.performance;
      expect(perf.enableCaching).toBe(true);
      expect(perf.cacheTTL).toBe(300000); // 5 minutes
      expect(perf.preloadCaches).toBe(true);
    });
    
    it('should parse boolean values', () => {
      const config = Configuration.initialize({
        ENABLE_CACHING: 'false',
        PRELOAD_CACHES: '0'
      });
      
      expect(config.performance.enableCaching).toBe(false);
      expect(config.performance.preloadCaches).toBe(false);
    });
  });
  
  describe('logging configuration', () => {
    it('should provide default logging configuration', () => {
      const config = Configuration.initialize({});
      
      const log = config.logging;
      expect(log.level).toBe('info');
      expect(log.debugSearch).toBe(false);
      expect(log.enableTiming).toBe(false);
    });
  });
  
  describe('validation', () => {
    it('should validate successfully with valid config', () => {
      const config = Configuration.initialize({
        DATABASE_URL: '~/.concept_rag'
      });
      
      expect(() => config.validate()).not.toThrow();
    });
    
    it('should throw on invalid embedding dimensions', () => {
      const config = Configuration.initialize({
        EMBEDDING_DIMENSIONS: '0'
      });
      
      expect(() => config.validate()).toThrow('EMBEDDING_DIMENSIONS must be positive');
    });
    
    it('should throw on invalid log level', () => {
      const config = Configuration.initialize({
        LOG_LEVEL: 'invalid'
      });
      
      expect(() => config.validate()).toThrow('Invalid LOG_LEVEL');
    });
    
    it('should warn if search weights do not sum to 1.0', () => {
      const config = Configuration.initialize({
        SEARCH_WEIGHT_VECTOR: '0.50',
        SEARCH_WEIGHT_BM25: '0.50',
        SEARCH_WEIGHT_TITLE: '0.00',
        SEARCH_WEIGHT_CONCEPT: '0.00',
        SEARCH_WEIGHT_WORDNET: '0.00'
      });
      
      // Should not throw, but may warn
      expect(() => config.validate()).not.toThrow();
    });
  });
  
  describe('toJSON', () => {
    it('should export configuration as JSON', () => {
      const config = Configuration.initialize({
        DATABASE_URL: '/test/db'
      });
      
      const json = config.toJSON();
      
      expect(json.database.url).toBe('/test/db');
      expect(json.embeddings.provider).toBe('simple');
    });
    
    it('should redact API keys', () => {
      const config = Configuration.initialize({
        OPENROUTER_API_KEY: 'secret-key-123'
      });
      
      const json = config.toJSON();
      
      expect(json.llm.apiKey).toBe('[REDACTED]');
    });
  });
  
  describe('reset', () => {
    it('should allow reinitialization after reset', () => {
      const config1 = Configuration.initialize({ DATABASE_URL: '/db1' });
      expect(config1.database.url).toBe('/db1');
      
      Configuration.reset();
      
      const config2 = Configuration.initialize({ DATABASE_URL: '/db2' });
      expect(config2.database.url).toBe('/db2');
    });
  });
});

