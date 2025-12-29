/**
 * AIL Test Configuration
 * 
 * Centralized configuration for Agent-in-the-Loop testing.
 * Values can be overridden via environment variables.
 */

export interface AILConfig {
  /** LLM model to use for agent execution */
  model: string;
  
  /** LLM model to use for accuracy evaluation (LLM-as-judge) */
  evalModel: string;
  
  /** OpenRouter API key */
  apiKey: string;
  
  /** Database path for tests */
  databasePath: string;
  
  /** Temperature for agent generation (0.0 - 1.0) */
  temperature: number;
  
  /** Maximum tokens for agent responses */
  maxTokens: number;
  
  /** Maximum iterations per scenario */
  maxIterations: number;
  
  /** Timeout for LLM calls in milliseconds */
  timeoutMs: number;
  
  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Load AIL configuration from environment variables with defaults
 */
export function loadAILConfig(): AILConfig {
  return {
    // Model configuration - Haiku is more cost-effective
    model: process.env.AIL_MODEL || 'anthropic/claude-haiku-4.5',
    evalModel: process.env.AIL_EVAL_MODEL || 'anthropic/claude-haiku-4.5',
    
    // API configuration
    apiKey: process.env.OPENROUTER_API_KEY || '',
    
    // Database configuration
    databasePath: process.env.AIL_TEST_DB || './db/test',
    
    // Generation parameters
    temperature: parseFloat(process.env.AIL_TEMPERATURE || '0.1'),
    maxTokens: parseInt(process.env.AIL_MAX_TOKENS || '4096', 10),
    maxIterations: parseInt(process.env.AIL_MAX_ITERATIONS || '10', 10),
    timeoutMs: parseInt(process.env.AIL_TIMEOUT_MS || '60000', 10),
    
    // Debug
    verbose: process.env.AIL_VERBOSE === 'true',
  };
}

/**
 * Singleton config instance
 */
let _config: AILConfig | null = null;

/**
 * Get the AIL configuration (cached)
 */
export function getAILConfig(): AILConfig {
  if (!_config) {
    _config = loadAILConfig();
  }
  return _config;
}

/**
 * Reset config (for testing)
 */
export function resetAILConfig(): void {
  _config = null;
}

