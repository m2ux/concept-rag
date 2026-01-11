# ADR 0036: Configuration Centralization with Type Safety

**Status**: Accepted  
**Date**: 2025-11-22  
**Deciders**: Development Team  
**Related ADRs**: [adr0016](adr0016-layered-architecture-refactoring.md), [adr0018](adr0018-dependency-injection-container.md)

## Context

Prior to this decision, the concept-rag project's configuration was scattered across multiple files and locations:

1. **Scattered Constants**: Configuration values spread across modules
   - Database URLs in connection files
   - Table names hardcoded in repositories
   - LLM settings in service files
   - Embedding dimensions in multiple locations

2. **No Single Source of Truth**: Configuration duplicated across files
   - Same values defined multiple times
   - Inconsistent defaults
   - Difficult to change settings

3. **Limited Type Safety**: Configuration accessed as plain strings
   - No compile-time validation
   - Runtime errors from typos
   - No IDE autocomplete

4. **Environment Variable Chaos**: Inconsistent environment variable usage
   - No validation of required variables
   - No default value documentation
   - Silent failures from missing config

5. **Testing Challenges**: Hard to override configuration for tests
   - Global constants can't be mocked
   - Test isolation difficult
   - Configuration state persists across tests

6. **Deployment Issues**: Configuration changes required code changes
   - No separation of configuration from code
   - Environment-specific settings hardcoded
   - Difficult to configure for different environments

As the project grew and added features like multi-provider embeddings ([adr0024](adr0024-multi-provider-embeddings.md)) and category systems ([adr0028](adr0028-category-storage-strategy.md)), the configuration complexity increased, making centralization critical.

## Decision

Implement a centralized configuration service with comprehensive type safety:

### 1. Configuration Interface

Define a comprehensive `IConfiguration` interface:

```typescript
export interface IConfiguration {
  database: DatabaseConfig;
  llm: LLMConfig;
  embeddings: EmbeddingConfig;
  search: SearchConfig;
  performance: PerformanceConfig;
  logging: LoggingConfig;
}

export interface DatabaseConfig {
  catalogUri: string;
  conceptUri: string;
  categoryUri: string;
  catalogTableName: string;
  conceptTableName: string;
  categoryTableName: string;
}

export interface EmbeddingConfig {
  provider: string;           // 'simple' | 'openai' | 'voyage' | 'ollama'
  dimensions: number;
  batchSize: number;
  model?: string;            // Provider-specific model name
}

export interface SearchConfig {
  defaultLimit: number;
  maxLimit: number;
  vectorWeight: number;
  bm25Weight: number;
  conceptWeight: number;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  cacheSize: number;
  preloadTables: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableDebug: boolean;
  logQueries: boolean;
}
```

### 2. Configuration Service

Implement singleton `Configuration` service:

```typescript
export class Configuration implements IConfiguration {
  private static instance: Configuration | null = null;
  
  private constructor(
    private env: NodeJS.ProcessEnv = process.env,
    private overrides: Partial<IConfiguration> = {}
  ) {}
  
  static initialize(
    env: NodeJS.ProcessEnv = process.env,
    overrides: Partial<IConfiguration> = {}
  ): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(env, overrides);
    }
    return Configuration.instance;
  }
  
  static getInstance(): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = Configuration.initialize();
    }
    return Configuration.instance;
  }
  
  static reset(): void {
    Configuration.instance = null;
  }
  
  get database(): DatabaseConfig {
    return {
      catalogUri: this.getEnv('LANCEDB_CATALOG_URI', './data/lancedb/catalog'),
      conceptUri: this.getEnv('LANCEDB_CONCEPT_URI', './data/lancedb/concepts'),
      categoryUri: this.getEnv('LANCEDB_CATEGORY_URI', './data/lancedb/categories'),
      catalogTableName: this.getEnv('CATALOG_TABLE', 'catalog'),
      conceptTableName: this.getEnv('CONCEPT_TABLE', 'concepts'),
      categoryTableName: this.getEnv('CATEGORY_TABLE', 'categories'),
    };
  }
  
  get embeddings(): EmbeddingConfig {
    return {
      provider: this.getEnv('EMBEDDING_PROVIDER', 'simple'),
      dimensions: parseInt(this.getEnv('EMBEDDING_DIMENSIONS', '384')),
      batchSize: parseInt(this.getEnv('EMBEDDING_BATCH_SIZE', '100')),
      model: this.getEnv('EMBEDDING_MODEL', undefined),
    };
  }
  
  // ... other configuration sections
  
  private getEnv(key: string, defaultValue?: string): string {
    const value = this.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new MissingConfigError(key);
      }
      return defaultValue;
    }
    return value;
  }
  
  validate(): void {
    // Validate required fields
    if (!this.database.catalogUri) {
      throw new MissingConfigError('database.catalogUri');
    }
    
    // Validate ranges
    if (this.embeddings.dimensions < 1 || this.embeddings.dimensions > 4096) {
      throw new InvalidConfigError(
        'embeddings.dimensions',
        this.embeddings.dimensions,
        'Must be between 1 and 4096'
      );
    }
    
    // Validate enums
    const validProviders = ['simple', 'openai', 'voyage', 'ollama'];
    if (!validProviders.includes(this.embeddings.provider)) {
      throw new InvalidConfigError(
        'embeddings.provider',
        this.embeddings.provider,
        `Must be one of: ${validProviders.join(', ')}`
      );
    }
  }
}
```

### 3. Environment Variable Loading

Support environment variables with validation:

```typescript
// Load from .env file
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize with validation
const config = Configuration.initialize(process.env);
config.validate();  // Throws if invalid configuration
```

### 4. Dependency Injection Integration

Integrate with ApplicationContainer ([adr0018](adr0018-dependency-injection-container.md)):

```typescript
// In ApplicationContainer
export class ApplicationContainer {
  private config: IConfiguration;
  
  constructor(config?: IConfiguration) {
    this.config = config ?? Configuration.getInstance();
    this.config.validate();
  }
  
  createEmbeddingService(): IEmbeddingService {
    const factory = new EmbeddingProviderFactory(this.config.embeddings);
    return factory.createFromConfig();
  }
  
  // ... other service creation methods
}
```

### 5. Test Configuration Override

Enable easy configuration override for tests:

```typescript
// In tests
describe('Service with custom config', () => {
  beforeEach(() => {
    Configuration.reset();
    Configuration.initialize(process.env, {
      embeddings: {
        provider: 'simple',
        dimensions: 128,  // Different from production
        batchSize: 10
      }
    });
  });
  
  afterEach(() => {
    Configuration.reset();
  });
  
  it('uses test configuration', () => {
    const config = Configuration.getInstance();
    expect(config.embeddings.dimensions).toBe(128);
  });
});
```

### 6. Backward Compatibility

Maintain backward compatibility with deprecated `src/config.ts`:

```typescript
// src/config.ts (deprecated but kept for compatibility)
import { Configuration } from './application/config';

const config = Configuration.getInstance();

/** @deprecated Use Configuration.getInstance().database.catalogUri */
export const LANCEDB_CATALOG_URI = config.database.catalogUri;

/** @deprecated Use Configuration.getInstance().embeddings.dimensions */
export const EMBEDDING_DIMENSIONS = config.embeddings.dimensions;

// ... other deprecated exports with warnings
```

## Implementation

**Date**: 2025-11-22  
**Time**: ~30 minutes agentic implementation

### Files Created

**Application Layer** (`src/application/config/`):
- `types.ts` - Configuration interfaces (IConfiguration, DatabaseConfig, etc.)
- `configuration.ts` - Configuration service implementation
- `index.ts` - Public exports

### Files Modified

- `src/config.ts` - Deprecated, kept for backward compatibility
- `.ai/planning/2025-11-22-architecture-refinement/IMPLEMENTATION-COMPLETE.md` - Documentation

### Configuration Sections Implemented

1. **Database Configuration**
   - Catalog, concept, category URIs
   - Table names
   - Connection settings

2. **LLM Configuration**
   - OpenRouter API key
   - Model selection (Claude Sonnet 4.5, Grok 4)
   - Temperature, max tokens

3. **Embedding Configuration**
   - Provider selection (simple, openai, voyage, ollama)
   - Dimensions (default 384)
   - Batch size
   - Provider-specific settings

4. **Search Configuration**
   - Default/max result limits
   - Scoring weights (vector, BM25, concept)
   - Ranking parameters

5. **Performance Configuration**
   - Cache settings (enable, size)
   - Table preloading
   - Optimization flags

6. **Logging Configuration**
   - Log level (debug, info, warn, error)
   - Debug flags
   - Query logging

## Consequences

### Positive

1. **Single Source of Truth**
   - All configuration in one place
   - Consistent access patterns
   - Easy to audit and modify

2. **Type Safety**
   - Compile-time validation of configuration access
   - IDE autocomplete for config properties
   - Refactoring safety with type checking

3. **Environment Variable Validation**
   - Required variables validated at startup
   - Clear error messages for missing config
   - Documented defaults

4. **Testability**
   - Easy to override configuration for tests
   - Test isolation with reset()
   - Mock configurations for different scenarios

5. **Flexibility**
   - Runtime configuration switching
   - Environment-specific settings
   - No code changes for config updates

6. **Documentation**
   - Configuration interface documents all settings
   - JSDoc explains each configuration option
   - Type definitions serve as documentation

7. **Dependency Injection**
   - Clean integration with ApplicationContainer
   - Configuration injected into services
   - No global state dependencies

### Negative

1. **Migration Effort**
   - Existing code must migrate to new configuration
   - Deprecated exports need eventual removal
   - Documentation updates required
   - Mitigation: Backward compatibility layer minimizes disruption

2. **Singleton Pattern**
   - Global state (albeit managed)
   - Must reset between tests
   - Mitigation: reset() method enables test isolation

3. **Verbosity**
   - More code than simple constants
   - Additional type definitions
   - Mitigation: Type safety and flexibility justify overhead

4. **Learning Curve**
   - Developers must learn new configuration system
   - Must understand initialization and override
   - Mitigation: Clear documentation and examples

### Neutral

1. **Performance**: Negligible overhead (configuration cached in memory)
2. **Bundle Size**: Minimal increase from additional types
3. **Dependencies**: No new external dependencies

## Alternatives Considered

### 1. Environment Variables Only (Status Quo)

**Approach**: Continue using environment variables directly

```typescript
const dbUri = process.env.LANCEDB_CATALOG_URI || './data/lancedb/catalog';
```

**Pros**:
- Simple to understand
- No additional abstraction
- Direct access

**Cons**:
- No type safety
- Scattered throughout codebase
- No validation
- Hard to test
- No structure

**Decision**: Rejected - Doesn't scale with complexity

### 2. JSON Configuration File

**Approach**: Load configuration from JSON file

```typescript
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
```

**Pros**:
- Easy to read/edit
- Can version control
- Structured format

**Cons**:
- No type safety
- No environment variable support
- Requires file parsing
- Hard to override for tests
- Security risk (committing secrets)

**Decision**: Rejected - Less flexible than code-based config

### 3. Configuration Library (dotenv-extended, config, convict)

**Approach**: Use third-party configuration library

**Pros**:
- Battle-tested solutions
- Rich feature sets
- Community support

**Cons**:
- External dependency
- Learning curve for library API
- May be overkill for needs
- Additional bundle size

**Decision**: Rejected - Simple needs don't justify dependency

### 4. Separate Config Files Per Environment

**Approach**: config.dev.ts, config.prod.ts, config.test.ts

**Pros**:
- Clear separation of environments
- Easy to see differences
- No conditional logic

**Cons**:
- Code duplication
- Environment detection required
- Harder to maintain consistency
- Build complexity

**Decision**: Rejected - Single file with env vars more flexible

### 5. Global Configuration Object

**Approach**: Export mutable configuration object

```typescript
export const config = {
  database: { uri: '...' },
  // ...
};
```

**Pros**:
- Very simple
- Easy to access
- Can mutate for tests

**Cons**:
- No encapsulation
- Global mutable state
- No validation
- Hard to track changes
- No initialization control

**Decision**: Rejected - Global mutable state is anti-pattern

## Evidence

### Implementation Artifacts

1. **Planning Document**: `.ai/planning/2025-11-20-knowledge-base-recommendations/03-architecture-refinement-plan.md`
2. **Implementation Summary**: `.ai/planning/2025-11-22-architecture-refinement/IMPLEMENTATION-COMPLETE.md`
3. **Configuration Types**: `src/application/config/types.ts`
4. **Configuration Service**: `src/application/config/configuration.ts`

### Code Statistics

**Files Created**: 3 files
- `src/application/config/types.ts` (~150 lines)
- `src/application/config/configuration.ts` (~200 lines)
- `src/application/config/index.ts` (~5 lines)

**Files Modified**: 1 file
- `src/config.ts` (deprecated with backward compatibility)

**Time Investment**: ~30 minutes

### Configuration Sections

**Total**: 6 configuration sections
- Database (6 settings)
- LLM (5 settings)
- Embeddings (4 settings)
- Search (5 settings)
- Performance (3 settings)
- Logging (3 settings)

**Total Settings**: 26 configuration options

### Knowledge Base Sources

This decision was informed by:
- "Clean Architecture" - Configuration at outer layer
- "Code That Fits in Your Head" - Composition root pattern
- "12-Factor App" - Configuration via environment
- TypeScript best practices for type-safe configuration

## Related Decisions

- [adr0016](adr0016-layered-architecture-refactoring.md) - Configuration belongs in application layer
- [adr0018](adr0018-dependency-injection-container.md) - Configuration injected via DI container
- [adr0024](adr0024-multi-provider-embeddings.md) - Embedding provider selection via configuration
- [adr0034](adr0034-comprehensive-error-handling.md) - Configuration errors use structured exceptions

## Future Considerations

1. **Configuration Validation Schema**: Add JSON Schema validation
2. **Configuration Reloading**: Support hot reloading of configuration
3. **Configuration Versioning**: Track configuration changes over time
4. **Configuration UI**: Admin interface for configuration management
5. **Secret Management**: Integrate with secret management systems (AWS Secrets Manager, Vault)
6. **Configuration Auditing**: Log configuration changes for compliance
7. **Multi-Environment Support**: Enhanced support for dev/staging/prod environments

## Notes

This ADR documents a significant improvement in configuration management, moving from scattered constants to a centralized, type-safe, validated configuration service. The singleton pattern provides convenient access while maintaining control over initialization and test isolation.

The backward compatibility layer ensures zero breaking changes, allowing gradual migration of existing code to the new configuration system. The type-safe interface provides excellent developer experience with IDE autocomplete and compile-time validation.

The implementation took only 30 minutes but provides substantial long-term benefits in maintainability, testability, and flexibility.

---

**References**:
- Implementation: `.ai/planning/2025-11-22-architecture-refinement/`
- Configuration Service: `src/application/config/configuration.ts`
- Time Investment: ~30 minutes
- Breaking Changes: None (backward compatible)

