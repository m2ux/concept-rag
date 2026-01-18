# Alternative Embedding Providers - Implementation Plan

**Date**: November 15, 2025  
**Status**: In Progress  
**Branch**: `feature/alternative-embedding-providers`  
**Priority**: Medium (Quality Improvement)

---

## Overview

This document outlines the implementation plan for adding alternative embedding providers to the Concept-RAG system. This enhancement addresses item #6 from the Optional Enhancements Roadmap, implementing configuration-based embedding provider selection.

**Goal**: Support multiple production-grade embedding services (OpenRouter, OpenAI, HuggingFace) with simple configuration-based switching.

---

## Background

**Current State**:
- Using `SimpleEmbeddingService` (hash-based embeddings)
- 384-dimensional embeddings
- Works for development/testing
- Limited semantic understanding

**Desired State**:
- Support multiple embedding providers
- Configuration-based provider selection
- Production-grade semantic embeddings
- Backward compatible with SimpleEmbedding

---

## Implementation Tasks

### 1. Update Configuration (config.ts) ✅ **IN PROGRESS**

Add embedding provider configuration structure:

```typescript
export interface EmbeddingProviderConfig {
  provider: 'simple' | 'openai' | 'openrouter' | 'huggingface';
  dimension: number;
  openai?: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  openrouter?: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  huggingface?: {
    apiKey?: string;
    model: string;
    useLocal?: boolean;
  };
}

export const embeddingConfig: EmbeddingProviderConfig = {
  provider: (process.env.EMBEDDING_PROVIDER as any) || 'simple',
  dimension: 384,
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    baseUrl: process.env.OPENAI_BASE_URL
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
    useLocal: process.env.HUGGINGFACE_USE_LOCAL === 'true'
  }
};
```

**Environment Variables**:
- `EMBEDDING_PROVIDER`: Provider selection (simple/openai/openrouter/huggingface)
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_EMBEDDING_MODEL`: OpenAI model name
- `OPENAI_BASE_URL`: Custom OpenAI-compatible endpoint
- `OPENROUTER_API_KEY`: OpenRouter API key
- `OPENROUTER_EMBEDDING_MODEL`: OpenRouter model name
- `HUGGINGFACE_API_KEY`: HuggingFace API key (optional for local)
- `HUGGINGFACE_MODEL`: HuggingFace model name
- `HUGGINGFACE_USE_LOCAL`: Use local inference (true/false)

---

### 2. Implement OpenAI Embedding Service

**File**: `src/infrastructure/embeddings/openai-embedding-service.ts`

```typescript
import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import OpenAI from 'openai';

export class OpenAIEmbeddingService implements EmbeddingService {
  private client: OpenAI;
  private model: string;
  
  constructor(config: { apiKey: string; model: string; baseUrl?: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl
    });
    this.model = config.model;
  }
  
  generateEmbedding(text: string): number[] {
    // Call OpenAI embeddings API
    // Return 384-dimensional vector (or pad/truncate as needed)
  }
}
```

**Features**:
- OpenAI API integration
- text-embedding-3-small (1536 dims) → project to 384 dims
- Error handling and retries
- Caching for identical queries

**Cost**: ~$0.02 per 1M tokens

---

### 3. Implement OpenRouter Embedding Service

**File**: `src/infrastructure/embeddings/openrouter-embedding-service.ts`

```typescript
import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import OpenAI from 'openai';

export class OpenRouterEmbeddingService implements EmbeddingService {
  private client: OpenAI;
  private model: string;
  
  constructor(config: { apiKey: string; model: string; baseUrl: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/m2ux/concept-rag',
        'X-Title': 'Concept-RAG'
      }
    });
    this.model = config.model;
  }
  
  generateEmbedding(text: string): number[] {
    // OpenRouter uses OpenAI-compatible API
    // Call embeddings endpoint
    // Return normalized vector
  }
}
```

**Features**:
- OpenRouter API integration (OpenAI-compatible)
- Access to multiple embedding models
- Usage tracking and credits
- Automatic fallback

**Cost**: Variable by model

---

### 4. Implement HuggingFace Embedding Service

**File**: `src/infrastructure/embeddings/huggingface-embedding-service.ts`

```typescript
import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import { HfInference } from '@huggingface/inference';

export class HuggingFaceEmbeddingService implements EmbeddingService {
  private client?: HfInference;
  private model: string;
  private useLocal: boolean;
  
  constructor(config: { apiKey?: string; model: string; useLocal?: boolean }) {
    this.model = config.model;
    this.useLocal = config.useLocal || false;
    
    if (!this.useLocal && config.apiKey) {
      this.client = new HfInference(config.apiKey);
    }
  }
  
  generateEmbedding(text: string): number[] {
    if (this.useLocal) {
      // Use @huggingface/transformers.js for local inference
      // Runs in Node.js without external API
    } else {
      // Use HuggingFace Inference API
    }
    // Return 384-dimensional vector
  }
}
```

**Features**:
- HuggingFace API integration
- Local inference option (privacy-first)
- sentence-transformers models
- Native 384-dimensional embeddings

**Cost**: Free (local) or HF Inference API pricing

---

### 5. Update ApplicationContainer

**File**: `src/application/container.ts`

Add factory method for embedding service creation:

```typescript
private createEmbeddingService(): EmbeddingService {
  const config = embeddingConfig;
  
  console.error(`🔌 Embedding Provider: ${config.provider}`);
  
  switch (config.provider) {
    case 'openai':
      if (!config.openai?.apiKey) {
        throw new Error('OPENAI_API_KEY environment variable required');
      }
      return new OpenAIEmbeddingService(config.openai);
      
    case 'openrouter':
      if (!config.openrouter?.apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable required');
      }
      return new OpenRouterEmbeddingService(config.openrouter);
      
    case 'huggingface':
      if (!config.huggingface?.useLocal && !config.huggingface?.apiKey) {
        throw new Error('HUGGINGFACE_API_KEY required or set HUGGINGFACE_USE_LOCAL=true');
      }
      return new HuggingFaceEmbeddingService(config.huggingface);
      
    case 'simple':
    default:
      console.error('⚠️  Using SimpleEmbeddingService (development only)');
      return new SimpleEmbeddingService();
  }
}
```

Update `initialize()` method:

```typescript
// Replace:
const embeddingService = new SimpleEmbeddingService();

// With:
const embeddingService = this.createEmbeddingService();
```

---

### 6. Install Dependencies

**NPM Packages Required**:
```bash
npm install openai @huggingface/inference
npm install --save-dev @types/openai
```

**package.json additions**:
```json
{
  "dependencies": {
    "openai": "^4.70.0",
    "@huggingface/inference": "^2.8.0"
  }
}
```

---

### 7. Documentation Updates

#### A. README.md

Add section on embedding providers:

```markdown
## Embedding Providers

Concept-RAG supports multiple embedding providers:

### Simple (Default - Development)
Hash-based embeddings, no API required.
```bash
EMBEDDING_PROVIDER=simple
```

### OpenAI
Production-grade embeddings with OpenAI API.
```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### OpenRouter
Access multiple embedding models via OpenRouter.
```bash
EMBEDDING_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
```

### HuggingFace
Local or API-based embeddings.
```bash
# API mode
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Local mode (privacy-first)
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_USE_LOCAL=true
HUGGINGFACE_MODEL=Xenova/all-MiniLM-L6-v2
```
```

#### B. Configuration Guide

Create `.engineering/artifacts/planning/2025-11-15-alternative-embedding-providers/02-configuration-guide.md`

---

### 8. Testing

#### Unit Tests

Create `src/__tests__/embeddings/embedding-services.test.ts`:

```typescript
describe('Embedding Services', () => {
  describe('SimpleEmbeddingService', () => {
    // Existing tests
  });
  
  describe('OpenAIEmbeddingService', () => {
    it('should generate embeddings via OpenAI API', async () => {
      // Mock OpenAI client
    });
    
    it('should handle API errors gracefully', async () => {
      // Test error handling
    });
  });
  
  describe('OpenRouterEmbeddingService', () => {
    it('should generate embeddings via OpenRouter API', async () => {
      // Mock OpenRouter client
    });
  });
  
  describe('HuggingFaceEmbeddingService', () => {
    it('should generate embeddings via HF API', async () => {
      // Mock HF client
    });
    
    it('should support local inference', async () => {
      // Test local mode
    });
  });
});
```

#### Integration Tests

Add to `test/integration/test-live-integration.ts`:

```typescript
describe('Embedding Provider Integration', () => {
  it('should use configured embedding provider', async () => {
    // Test with actual provider
  });
});
```

---

## Implementation Timeline

**Estimated Effort**: 3-4 hours (agentic)

### Phase 1: Configuration & OpenAI (1.5 hours)
- ✅ Update config.ts with provider configuration
- ✅ Install npm dependencies
- ✅ Implement OpenAIEmbeddingService
- ✅ Update ApplicationContainer with factory method
- ✅ Test OpenAI provider

### Phase 2: OpenRouter (45 minutes)
- ✅ Implement OpenRouterEmbeddingService
- ✅ Test OpenRouter provider
- ✅ Verify OpenAI compatibility

### Phase 3: HuggingFace (1 hour)
- ✅ Implement HuggingFaceEmbeddingService
- ✅ Support both API and local modes
- ✅ Test both modes

### Phase 4: Documentation & Testing (45 minutes)
- ✅ Update README
- ✅ Create configuration guide
- ✅ Write unit tests
- ✅ Verify all providers work

---

## Success Criteria

- ✅ All three providers (OpenAI, OpenRouter, HuggingFace) implemented
- ✅ Configuration-based provider selection working
- ✅ Simple provider remains default (backward compatible)
- ✅ All existing tests pass
- ✅ New provider-specific tests pass
- ✅ Documentation complete with examples
- ✅ No breaking changes to existing code

---

## Risk Assessment

### Low Risk
- ✅ Implementation isolated via EmbeddingService interface
- ✅ Simple provider remains default (no breaking changes)
- ✅ Configuration via environment variables (no code changes needed)

### Medium Risk
- ⚠️ API key management (must be kept secure)
- ⚠️ Rate limiting and costs (external APIs)
- ⚠️ Dimension mismatch handling (1536 → 384 projection)

### Mitigation Strategies
- Clear documentation on API key security
- Warn users about costs when using paid providers
- Implement proper dimension projection/truncation
- Add error messages for missing API keys
- Keep Simple provider as safe default

---

## Future Enhancements (Out of Scope)

- Embedding caching layer (reduce API costs)
- Batch embedding generation (efficiency)
- Custom dimension configuration per provider
- Embedding quality metrics/comparison
- Automatic provider fallback on errors
- Cost tracking and reporting

---

## References

**Source Document**: 
- `.engineering/artifacts/planning/2025-11-14-architecture-refactoring/07-optional-enhancements-roadmap.md` (Item #6)

**Related Code**:
- `src/domain/interfaces/services/embedding-service.ts` - Interface definition
- `src/infrastructure/embeddings/simple-embedding-service.ts` - Existing implementation
- `src/application/container.ts` - Dependency injection

**External Documentation**:
- OpenAI Embeddings API: https://platform.openai.com/docs/guides/embeddings
- OpenRouter API: https://openrouter.ai/docs
- HuggingFace Inference: https://huggingface.co/docs/api-inference/

---

**Document Status**: ✅ Complete  
**Implementation Status**: 🏗️ In Progress  
**Last Updated**: November 15, 2025

