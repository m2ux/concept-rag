/**
 * Embeddings Module
 * 
 * Provides embedding generation services and factory for creating providers.
 */

export { SimpleEmbeddingService } from './simple-embedding-service.js';
export {
  EmbeddingProviderFactory,
  createEmbeddingService,
  UnsupportedEmbeddingProviderError
} from './embedding-provider-factory.js';
