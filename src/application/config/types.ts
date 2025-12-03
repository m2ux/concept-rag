/**
 * Configuration Type Definitions
 * 
 * Comprehensive type-safe configuration for the Concept-RAG application.
 * Centralizes all configuration concerns in one place.
 */

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Path to LanceDB database directory */
  url: string;
  
  /** Table names */
  tables: {
    catalog: string;
    chunks: string;
    concepts: string;
    categories: string;
  };
}

/**
 * LLM API configuration (OpenRouter-compatible)
 */
export interface LLMConfig {
  /** Base URL for OpenRouter API */
  baseUrl: string;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Model for document summarization (fast) */
  summaryModel: string;
  
  /** Model for concept extraction (comprehensive) */
  conceptModel: string;
}

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  /** Embedding provider: 'simple' | 'openai' | 'voyage' | 'ollama' */
  provider: string;
  
  /** Model name for embeddings */
  model?: string;
  
  /** Embedding dimensions (default: 384) */
  dimensions: number;
  
  /** Batch size for bulk embedding operations */
  batchSize: number;
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Default result limit */
  defaultLimit: number;
  
  /** Maximum result limit */
  maxLimit: number;
  
  /** Hybrid search weights */
  weights: {
    vector: number;      // Semantic similarity
    bm25: number;        // Keyword matching
    title: number;       // Title matching
    concept: number;     // Conceptual alignment
    wordnet: number;     // Synonym expansion
  };
}

/**
 * Performance and caching configuration
 */
export interface PerformanceConfig {
  /** Enable query result caching */
  enableCaching: boolean;
  
  /** Cache TTL in milliseconds */
  cacheTTL: number;
  
  /** Initialize caches on startup */
  preloadCaches: boolean;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  level: string;
  
  /** Enable debug output for hybrid search */
  debugSearch: boolean;
  
  /** Enable performance timing logs */
  enableTiming: boolean;
}

/**
 * Complete application configuration
 */
export interface IConfiguration {
  database: DatabaseConfig;
  llm: LLMConfig;
  embeddings: EmbeddingConfig;
  search: SearchConfig;
  performance: PerformanceConfig;
  logging: LoggingConfig;
}

/**
 * Environment variables interface
 */
export interface Environment {
  get(key: string): string | undefined;
  get(key: string, defaultValue: string): string;
}
