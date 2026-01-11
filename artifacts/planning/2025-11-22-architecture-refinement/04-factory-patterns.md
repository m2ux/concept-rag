# Factory Patterns Implementation

## Overview

Implemented factory patterns for flexible object creation and dependency injection.

## Factories Implemented

### 1. EmbeddingProviderFactory ✅ NEW

**Location**: `src/infrastructure/embeddings/embedding-provider-factory.ts`

**Purpose**: Create embedding service instances based on configuration.

**Features**:
- Provider selection by name
- Configuration-based creation
- Extensible for future providers (OpenAI, Voyage, Ollama)
- Clear error messages for unsupported providers

**Usage**:
```typescript
import { EmbeddingProviderFactory } from './infrastructure/embeddings';

const factory = new EmbeddingProviderFactory(config.embeddings);

// Create specific provider
const simple = factory.create('simple');

// Or use config's default
const provider = factory.createFromConfig();
```

**Current Providers**:
- ✅ `simple` - SimpleEmbeddingService (hash-based)
- 🔜 `openai` - OpenAI embeddings (future)
- 🔜 `voyage` - Voyage AI embeddings (future)
- 🔜 `ollama` - Local Ollama embeddings (future)

### 2. DocumentLoaderFactory ✅ EXISTING

**Location**: `src/infrastructure/document-loaders/document-loader-factory.ts`

**Status**: Already implemented and well-documented

**Features**:
- Loader registration
- Format detection
- Extensible for new document types

**Usage**:
```typescript
const factory = new DocumentLoaderFactory();
factory.registerLoader(new PDFDocumentLoader());
factory.registerLoader(new EPUBDocumentLoader());

const loader = factory.getLoader('/path/to/book.epub');
const docs = await loader.load('/path/to/book.epub');
```

## Factory Benefits

### 1. Open-Closed Principle
- Add new providers/loaders without modifying existing code
- Register new implementations dynamically

### 2. Testability
- Easy to inject fake implementations for testing
- Factory can be mocked independently

### 3. Configuration-Driven
- Runtime selection based on environment
- No code changes for provider switching

### 4. Type Safety
- All factories return interface types (EmbeddingService, IDocumentLoader)
- Compile-time type checking

## Integration with DI Container

Factories integrate cleanly with the ApplicationContainer:

```typescript
// In container.ts
const embeddingFactory = new EmbeddingProviderFactory(config.embeddings);
const embeddingService = embeddingFactory.createFromConfig();

const loaderFactory = new DocumentLoaderFactory();
loaderFactory.registerLoader(new PDFDocumentLoader());
loaderFactory.registerLoader(new EPUBDocumentLoader());
```

## Future Factory Candidates

### Potential Additions:

1. **RepositoryFactory** (for testing)
   - Create mock repositories for tests
   - Swap LanceDB for alternative storage

2. **SearchStrategyFactory**
   - Different search algorithms (hybrid, pure vector, BM25)
   - A/B testing different ranking strategies

3. **CacheFactory**
   - Different cache backends (memory, Redis, file)
   - Cache warmup strategies

## Architecture Compliance

- ✅ Factories in **infrastructure layer**
- ✅ Return **domain interfaces**
- ✅ Configuration from **application layer**
- ✅ No circular dependencies

## Files Created/Modified

### Created:
- `src/infrastructure/embeddings/embedding-provider-factory.ts`
- `.ai/planning/2025-11-22-architecture-refinement/04-factory-patterns.md`

### Modified:
- `src/infrastructure/embeddings/index.ts` (added exports)

## Estimated Time

**Agentic Implementation**: ~15 minutes ✅

- Design factory interface: 3 min
- Implement EmbeddingProviderFactory: 8 min
- Documentation: 4 min

## Testing Recommendations

```typescript
describe('EmbeddingProviderFactory', () => {
  it('creates simple provider', () => {
    const factory = new EmbeddingProviderFactory({ provider: 'simple', ... });
    const provider = factory.create('simple');
    expect(provider).toBeInstanceOf(SimpleEmbeddingService);
  });
  
  it('throws on unsupported provider', () => {
    const factory = new EmbeddingProviderFactory({ provider: 'simple', ... });
    expect(() => factory.create('invalid')).toThrow(UnsupportedEmbeddingProviderError);
  });
  
  it('creates from config', () => {
    const config = { provider: 'simple', dimensions: 384, batchSize: 100 };
    const factory = new EmbeddingProviderFactory(config);
    const provider = factory.createFromConfig();
    expect(provider).toBeDefined();
  });
});
```

## Summary

✅ **Complete**: Factory patterns implemented  
✅ **Backward Compatible**: No breaking changes  
✅ **Extensible**: Easy to add new providers  
✅ **Type Safe**: Strong typing throughout  
✅ **Documented**: Comprehensive JSDoc


