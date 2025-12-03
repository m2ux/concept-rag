/**
 * Configuration Service
 * 
 * Centralized, type-safe configuration management for Concept-RAG.
 * 
 * **Design Pattern**: Singleton
 * - Single source of truth for all configuration
 * - Lazy initialization on first access
 * - Environment-aware defaults
 * 
 * **Features**:
 * - Type-safe configuration access
 * - Environment variable validation
 * - Sensible defaults
 * - Override capability for testing
 * 
 * @example
 * ```typescript
 * // Initialize with environment variables
 * const config = Configuration.initialize(process.env);
 * 
 * // Access configuration
 * const dbUrl = config.database.url;
 * const model = config.llm.conceptModel;
 * 
 * // Testing with overrides
 * const testConfig = Configuration.initialize(process.env, {
 *   database: { url: '/tmp/test-db' }
 * });
 * ```
 */

import type {
  IConfiguration,
  DatabaseConfig,
  LLMConfig,
  EmbeddingConfig,
  SearchConfig,
  PerformanceConfig,
  LoggingConfig,
  Environment
} from './types.js';

/**
 * Simple environment adapter for process.env or custom environment objects
 */
class EnvironmentAdapter implements Environment {
  constructor(private env: Record<string, string | undefined>) {}
  
  get(key: string): string | undefined;
  get(key: string, defaultValue: string): string;
  get(key: string, defaultValue?: string): string | undefined {
    const value = this.env[key];
    return value !== undefined ? value : defaultValue;
  }
  
  getNumber(key: string, defaultValue: number): number {
    const value = this.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value); // Use parseFloat to handle decimals
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }
}

/**
 * Configuration service - Singleton pattern
 */
export class Configuration implements IConfiguration {
  private static instance: Configuration | null = null;
  
  private constructor(
    private env: EnvironmentAdapter,
    private overrides?: Partial<IConfiguration>
  ) {}
  
  /**
   * Initialize configuration service (singleton)
   * 
   * @param env - Environment object (typically process.env)
   * @param overrides - Optional configuration overrides for testing
   * @returns Configuration instance
   */
  static initialize(
    env: Record<string, string | undefined>,
    overrides?: Partial<IConfiguration>
  ): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(
        new EnvironmentAdapter(env),
        overrides
      );
    }
    return Configuration.instance;
  }
  
  /**
   * Get existing configuration instance
   * 
   * @throws Error if not initialized
   */
  static getInstance(): Configuration {
    if (!Configuration.instance) {
      throw new Error('Configuration not initialized. Call Configuration.initialize() first.');
    }
    return Configuration.instance;
  }
  
  /**
   * Reset configuration (for testing)
   */
  static reset(): void {
    Configuration.instance = null;
  }
  
  /**
   * Database configuration
   */
  get database(): DatabaseConfig {
    return {
      url: this.env.get('DATABASE_URL', '~/.concept_rag'),
      tables: {
        catalog: this.env.get('CATALOG_TABLE_NAME', 'catalog'),
        chunks: this.env.get('CHUNKS_TABLE_NAME', 'chunks'),
        concepts: this.env.get('CONCEPTS_TABLE_NAME', 'concepts'),
        categories: this.env.get('CATEGORIES_TABLE_NAME', 'categories')
      },
      ...this.overrides?.database
    };
  }
  
  /**
   * LLM API configuration
   */
  get llm(): LLMConfig {
    return {
      baseUrl: this.env.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
      apiKey: this.env.get('OPENROUTER_API_KEY'),
      summaryModel: this.env.get('OPENROUTER_SUMMARY_MODEL', 'x-ai/grok-4-fast'),
      conceptModel: this.env.get('OPENROUTER_CONCEPT_MODEL', 'anthropic/claude-sonnet-4.5'),
      ...this.overrides?.llm
    };
  }
  
  /**
   * Embedding configuration
   */
  get embeddings(): EmbeddingConfig {
    return {
      provider: this.env.get('EMBEDDING_PROVIDER', 'simple'),
      model: this.env.get('EMBEDDING_MODEL'),
      dimensions: this.env.getNumber('EMBEDDING_DIMENSIONS', 384),
      batchSize: this.env.getNumber('EMBEDDING_BATCH_SIZE', 100),
      ...this.overrides?.embeddings
    };
  }
  
  /**
   * Search configuration
   */
  get search(): SearchConfig {
    return {
      defaultLimit: this.env.getNumber('SEARCH_DEFAULT_LIMIT', 10),
      maxLimit: this.env.getNumber('SEARCH_MAX_LIMIT', 100),
      weights: {
        vector: this.env.getNumber('SEARCH_WEIGHT_VECTOR', 0.25),
        bm25: this.env.getNumber('SEARCH_WEIGHT_BM25', 0.25),
        title: this.env.getNumber('SEARCH_WEIGHT_TITLE', 0.20),
        concept: this.env.getNumber('SEARCH_WEIGHT_CONCEPT', 0.20),
        wordnet: this.env.getNumber('SEARCH_WEIGHT_WORDNET', 0.10)
      },
      ...this.overrides?.search
    };
  }
  
  /**
   * Performance and caching configuration
   */
  get performance(): PerformanceConfig {
    return {
      enableCaching: this.env.getBoolean('ENABLE_CACHING', true),
      cacheTTL: this.env.getNumber('CACHE_TTL_MS', 300000), // 5 minutes default
      preloadCaches: this.env.getBoolean('PRELOAD_CACHES', true),
      ...this.overrides?.performance
    };
  }
  
  /**
   * Logging configuration
   */
  get logging(): LoggingConfig {
    return {
      level: this.env.get('LOG_LEVEL', 'info'),
      debugSearch: this.env.getBoolean('DEBUG_SEARCH', false),
      enableTiming: this.env.getBoolean('ENABLE_TIMING', false),
      ...this.overrides?.logging
    };
  }
  
  /**
   * Validate configuration
   * 
   * Checks for required values and valid settings.
   * Throws detailed errors if configuration is invalid.
   */
  validate(): void {
    // Database URL is required
    if (!this.database.url) {
      throw new Error('DATABASE_URL is required');
    }
    
    // Validate embedding dimensions
    if (this.embeddings.dimensions <= 0) {
      throw new Error('EMBEDDING_DIMENSIONS must be positive');
    }
    
    // Validate search weights sum to ~1.0
    const weights = this.search.weights;
    const sum = weights.vector + weights.bm25 + weights.title + weights.concept + weights.wordnet;
    if (Math.abs(sum - 1.0) > 0.01) {
      console.warn(`Search weights sum to ${sum.toFixed(3)}, expected 1.0`);
    }
    
    // Validate log level
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(this.logging.level)) {
      throw new Error(`Invalid LOG_LEVEL: ${this.logging.level}. Must be one of: ${validLevels.join(', ')}`);
    }
  }
  
  /**
   * Export configuration as plain object (for debugging/logging)
   */
  toJSON(): IConfiguration {
    return {
      database: this.database,
      llm: {
        ...this.llm,
        apiKey: this.llm.apiKey ? '[REDACTED]' : undefined
      },
      embeddings: this.embeddings,
      search: this.search,
      performance: this.performance,
      logging: this.logging
    };
  }
}

// Export default configuration getter for convenience
export function getConfiguration(): Configuration {
  return Configuration.getInstance();
}
