/**
 * Configuration Module
 * 
 * Centralized configuration management for Concept-RAG.
 * 
 * @example
 * ```typescript
 * import { Configuration } from './application/config/index.js';
 * 
 * // Initialize on app startup
 * const config = Configuration.initialize(process.env);
 * config.validate();
 * 
 * // Use throughout application
 * const dbUrl = config.database.url;
 * ```
 */

export { Configuration, getConfiguration } from './configuration.js';
export type {
  IConfiguration,
  DatabaseConfig,
  LLMConfig,
  EmbeddingConfig,
  SearchConfig,
  PerformanceConfig,
  LoggingConfig,
  Environment
} from './types.js';

