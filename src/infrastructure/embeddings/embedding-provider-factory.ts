/**
 * Embedding Provider Factory
 * 
 * Factory for creating embedding service instances based on configuration.
 * Supports multiple embedding providers (simple, OpenAI, Voyage, Ollama).
 * 
 * **Design Pattern**: Factory + Strategy
 * - Factory creates appropriate provider based on configuration
 * - Strategy pattern allows swapping providers at runtime
 * - Follows Open-Closed Principle (add new providers without modifying existing code)
 * 
 * @example
 * ```typescript
 * const factory = new EmbeddingProviderFactory(config);
 * const provider = factory.create('simple');
 * const embedding = provider.generateEmbedding('test');
 * 
 * // Or use config's default provider
 * const defaultProvider = factory.createFromConfig();
 * ```
 */

import type { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import type { EmbeddingConfig } from '../../application/config/types.js';
import { SimpleEmbeddingService } from './simple-embedding-service.js';

/**
 * Error thrown when unsupported embedding provider is requested
 */
export class UnsupportedEmbeddingProviderError extends Error {
  constructor(providerName: string, supportedProviders: string[]) {
    super(
      `Unsupported embedding provider: "${providerName}". ` +
      `Supported providers: ${supportedProviders.join(', ')}`
    );
    this.name = 'UnsupportedEmbeddingProviderError';
  }
}

/**
 * Factory for creating embedding providers
 */
export class EmbeddingProviderFactory {
  private readonly supportedProviders = ['simple'];
  
  constructor(private config: EmbeddingConfig) {}
  
  /**
   * Create an embedding provider by name
   * 
   * @param providerName - Name of the provider ('simple' | 'openai' | 'voyage' | 'ollama')
   * @returns Embedding service instance
   * @throws {UnsupportedEmbeddingProviderError} If provider not supported
   * 
   * @example
   * ```typescript
   * const provider = factory.create('simple');
   * const embedding = provider.generateEmbedding('Hello world');
   * ```
   */
  create(providerName: string): EmbeddingService {
    switch (providerName.toLowerCase()) {
      case 'simple':
        return new SimpleEmbeddingService();
      
      // Future providers (not yet implemented)
      case 'openai':
        throw new Error(
          'OpenAI embedding provider not yet implemented. ' +
          'Please use "simple" provider or contribute an implementation.'
        );
      
      case 'voyage':
        throw new Error(
          'Voyage AI embedding provider not yet implemented. ' +
          'Please use "simple" provider or contribute an implementation.'
        );
      
      case 'ollama':
        throw new Error(
          'Ollama embedding provider not yet implemented. ' +
          'Please use "simple" provider or contribute an implementation.'
        );
      
      default:
        throw new UnsupportedEmbeddingProviderError(
          providerName,
          this.supportedProviders
        );
    }
  }
  
  /**
   * Create embedding provider from configuration
   * 
   * Uses the provider specified in configuration.
   * 
   * @returns Embedding service instance
   * 
   * @example
   * ```typescript
   * // config.embeddings.provider = 'simple'
   * const provider = factory.createFromConfig();
   * ```
   */
  createFromConfig(): EmbeddingService {
    return this.create(this.config.provider);
  }
  
  /**
   * Check if a provider is supported
   * 
   * @param providerName - Provider name to check
   * @returns true if supported, false otherwise
   */
  isSupported(providerName: string): boolean {
    return this.supportedProviders.includes(providerName.toLowerCase());
  }
  
  /**
   * Get list of supported providers
   * 
   * @returns Array of supported provider names
   */
  getSupportedProviders(): string[] {
    return [...this.supportedProviders];
  }
}

/**
 * Convenience function to create embedding service from config
 * 
 * @param config - Embedding configuration
 * @returns Configured embedding service
 * 
 * @example
 * ```typescript
 * import { createEmbeddingService } from './infrastructure/embeddings';
 * const service = createEmbeddingService(config.embeddings);
 * ```
 */
export function createEmbeddingService(config: EmbeddingConfig): EmbeddingService {
  const factory = new EmbeddingProviderFactory(config);
  return factory.createFromConfig();
}

