# Architecture Refinement Plan

**Date:** 2025-11-20  
**Priority:** MEDIUM (Phase 2, Week 3)  
**Status:** Planning

## Overview

Refine the existing architecture to strengthen separation of concerns, clarify interfaces, and improve maintainability. The project already has a solid layered architecture; this plan focuses on incremental improvements informed by knowledge base insights.

## Knowledge Base Insights Applied

### Core Architecture Principles

**From "Clean Architecture," "Interface-Oriented Design," and related sources:**

1. **Separation of Concerns**
   - Orthogonal concerns should be in separate modules
   - Each component should have a single responsibility
   - Avoid mixing unrelated functionality

2. **Dependency Inversion Principle**
   - High-level modules should not depend on low-level details
   - Both should depend on abstractions (interfaces)
   - Abstractions should not depend on details

3. **Interface Specification**
   - Clear contracts between layers
   - Explicit dependencies
   - Type-safe boundaries

4. **Package by Layer**
   - Organize code by architectural layer
   - Clear vertical boundaries
   - Controlled dependencies between layers

5. **Repository Pattern**
   - Abstract data access behind interfaces
   - Allow swapping implementations
   - Test with fake implementations

## Current Architecture Assessment

### Existing Structure

```
src/
├── domain/              # Business logic and models
│   ├── interfaces/      # Port interfaces
│   ├── models/          # Domain entities
│   ├── services/        # Domain services
│   └── exceptions.ts    # Domain exceptions
├── infrastructure/      # External adapters
│   ├── cache/           # Caching implementations
│   ├── database/        # Database access
│   ├── embeddings/      # Embedding providers
│   └── loaders/         # Document loaders
├── application/         # Application coordination
│   └── container.ts     # DI container
├── tools/               # MCP tool implementations
└── conceptual_index.ts  # Main entry point
```

### Strengths
✅ Clear layer separation (domain, infrastructure, application, tools)  
✅ Dependency injection via container  
✅ Repository pattern for data access  
✅ Service layer for business logic  
✅ Interface-based design in domain layer

### Areas for Improvement
⚠️ Some interface definitions could be more explicit  
⚠️ Dependency flow not always clear  
⚠️ Some services have mixed concerns  
⚠️ Configuration management could be centralized  
⚠️ Error handling patterns inconsistent across layers

## Refinement Strategy

### 1. Strengthen Interface Definitions

#### Current State
Interfaces exist but may not fully capture contracts.

#### Knowledge Base Guidance
> "Creating an interface makes the common need more explicit."  
> — Interface-Oriented Design

#### Implementation

**Step 1.1: Audit Existing Interfaces**
```typescript
// Current: May be implicit
class ConceptRepository {
  async findByName(name: string): Promise<Concept | null> { }
  async save(concept: Concept): Promise<void> { }
}

// Improved: Explicit interface
interface IConceptRepository {
  /**
   * Find a concept by its name.
   * @param name - The concept name (case-sensitive)
   * @returns The concept if found, null otherwise
   * @throws DatabaseError if query fails
   */
  findByName(name: string): Promise<Concept | null>;
  
  /**
   * Save or update a concept.
   * @param concept - The concept to persist
   * @throws ValidationError if concept is invalid
   * @throws DatabaseError if persistence fails
   */
  save(concept: Concept): Promise<void>;
  
  /**
   * Find all concepts in a category.
   * @param category - The category name
   * @param limit - Maximum number of concepts to return
   * @returns Array of concepts, sorted by weight descending
   */
  findByCategory(category: string, limit?: number): Promise<Concept[]>;
}
```

**Step 1.2: Document Interface Contracts**
Add JSDoc to all interfaces with:
- Purpose and usage
- Parameter constraints
- Return value guarantees
- Error conditions
- Examples where helpful

**Step 1.3: Create Missing Interfaces**
Identify concrete classes without interfaces and extract interfaces where appropriate.

**Deliverables:**
- [ ] All repository interfaces explicitly defined
- [ ] All service interfaces documented
- [ ] Embedding provider interface standardized
- [ ] Document loader interface unified

---

### 2. Clarify Dependency Flow

#### Current State
Dependencies generally flow inward, but some violations may exist.

#### Knowledge Base Guidance
> "The Dependency Rule: Source code dependencies must point only inward, toward higher-level policies."  
> — Clean Architecture

#### Implementation

**Step 2.1: Visualize Dependencies**
```typescript
// Tools for dependency analysis
// Run: npx madge --image deps.png src/
// or: npx dependency-cruiser src/
```

**Step 2.2: Enforce Dependency Rules**
```typescript
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: 'domain-independence',
      comment: 'Domain should not depend on infrastructure',
      severity: 'error',
      from: { path: 'src/domain' },
      to: { path: 'src/infrastructure' }
    },
    {
      name: 'infrastructure-to-tools',
      comment: 'Infrastructure should not depend on tools',
      severity: 'error',
      from: { path: 'src/infrastructure' },
      to: { path: 'src/tools' }
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: {},
      circular: true
    }
  ]
};
```

**Step 2.3: Fix Dependency Violations**
- Move misplaced dependencies
- Extract interfaces to break cycles
- Use dependency injection to invert dependencies

**Deliverables:**
- [ ] Dependency graph generated
- [ ] Dependency rules enforced in CI
- [ ] Zero circular dependencies
- [ ] All dependencies flow inward

---

### 3. Improve Separation of Concerns

#### Current State
Some services may mix multiple concerns.

#### Knowledge Base Guidance
> "When varying concerns that are largely orthogonal to each other are not separated but instead aggregated in a single hierarchy, it can result in an explosion of classes."  
> — Refactoring for Software Design Smells

#### Implementation

**Step 3.1: Identify Mixed Concerns**
Review services for:
- Data access mixed with business logic
- Configuration logic in domain services
- Logging/monitoring mixed with core functionality
- Validation scattered across layers

**Step 3.2: Extract Orthogonal Concerns**

**Example: Separate Validation**
```typescript
// Before: Validation mixed with business logic
class ConceptService {
  async extractConcepts(text: string): Promise<Concept[]> {
    if (!text || text.length === 0) {
      throw new Error('Text is required');
    }
    if (text.length > 100000) {
      throw new Error('Text too long');
    }
    // ... business logic
  }
}

// After: Validation separated
class ConceptValidator {
  validate(text: string): ValidationResult {
    if (!text || text.length === 0) {
      return ValidationResult.error('Text is required');
    }
    if (text.length > 100000) {
      return ValidationResult.error('Text too long (max 100KB)');
    }
    return ValidationResult.success();
  }
}

class ConceptService {
  constructor(
    private validator: ConceptValidator,
    private extractor: ConceptExtractor
  ) {}
  
  async extractConcepts(text: string): Promise<Concept[]> {
    const validation = this.validator.validate(text);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    return this.extractor.extract(text);
  }
}
```

**Step 3.3: Create Cross-Cutting Concern Handlers**
- **Logging**: Decorator pattern for consistent logging
- **Validation**: Centralized validation layer
- **Metrics**: Observer pattern for performance tracking
- **Caching**: Decorator pattern for transparent caching

**Deliverables:**
- [ ] Validation layer created
- [ ] Logging decorators implemented
- [ ] Caching decorators applied
- [ ] Business logic isolated from cross-cutting concerns

---

### 4. Centralize Configuration Management

#### Current State
Configuration may be scattered across modules.

#### Knowledge Base Guidance
> "A good system architecture allows decisions to be made at the latest possible moment, without significant impact."  
> — Clean Architecture

#### Implementation

**Step 4.1: Create Configuration Service**
```typescript
// src/application/config/configuration.ts
export interface IConfiguration {
  database: DatabaseConfig;
  embeddings: EmbeddingConfig;
  search: SearchConfig;
  performance: PerformanceConfig;
}

export class Configuration implements IConfiguration {
  private static instance: Configuration;
  
  private constructor(
    private env: Environment,
    private overrides?: Partial<IConfiguration>
  ) {}
  
  static initialize(env: Environment): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(env);
    }
    return Configuration.instance;
  }
  
  get database(): DatabaseConfig {
    return {
      uri: this.env.get('DATABASE_URI'),
      maxConnections: this.env.getNumber('DB_MAX_CONNECTIONS', 10)
    };
  }
  
  get embeddings(): EmbeddingConfig {
    return {
      provider: this.env.get('EMBEDDING_PROVIDER', 'openai'),
      model: this.env.get('EMBEDDING_MODEL'),
      batchSize: this.env.getNumber('EMBEDDING_BATCH_SIZE', 100)
    };
  }
  
  // ... other config sections
}
```

**Step 4.2: Inject Configuration**
```typescript
// In container.ts
container.register('Configuration', {
  useFactory: () => Configuration.initialize(process.env)
});

// In services
class EmbeddingService {
  constructor(
    private config: IConfiguration,
    private provider: IEmbeddingProvider
  ) {}
  
  async embed(texts: string[]): Promise<Embedding[]> {
    const batchSize = this.config.embeddings.batchSize;
    // ... use configuration
  }
}
```

**Deliverables:**
- [ ] Centralized configuration service
- [ ] Environment variable validation
- [ ] Configuration defaults documented
- [ ] Configuration injected via DI

---

### 5. Enhance Factory Patterns

#### Current State
Object creation may be scattered.

#### Knowledge Base Guidance
Use Factory pattern for complex object creation, especially when:
- Object creation involves multiple steps
- Different implementations need to be selected at runtime
- Creation logic needs to be testable

#### Implementation

**Step 5.1: Create Factory Interfaces**
```typescript
// src/domain/interfaces/IEmbeddingProviderFactory.ts
export interface IEmbeddingProviderFactory {
  create(providerName: string): IEmbeddingProvider;
}

// src/infrastructure/embeddings/EmbeddingProviderFactory.ts
export class EmbeddingProviderFactory implements IEmbeddingProviderFactory {
  constructor(private config: IConfiguration) {}
  
  create(providerName: string): IEmbeddingProvider {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return new OpenAIEmbeddingProvider(this.config.embeddings.openai);
      case 'voyage':
        return new VoyageAIEmbeddingProvider(this.config.embeddings.voyage);
      case 'ollama':
        return new OllamaEmbeddingProvider(this.config.embeddings.ollama);
      default:
        throw new UnsupportedProviderError(providerName);
    }
  }
}
```

**Step 5.2: Use Factories in DI Container**
```typescript
// In container.ts
container.register('EmbeddingProviderFactory', {
  useClass: EmbeddingProviderFactory,
  dependencies: ['Configuration']
});

container.register('EmbeddingProvider', {
  useFactory: (container) => {
    const factory = container.resolve<IEmbeddingProviderFactory>('EmbeddingProviderFactory');
    const config = container.resolve<IConfiguration>('Configuration');
    return factory.create(config.embeddings.provider);
  }
});
```

**Deliverables:**
- [ ] Embedding provider factory
- [ ] Document loader factory
- [ ] Repository factory (for testing)
- [ ] Factory tests

---

## Implementation Tasks

### Task 3.1: Interface Enhancement (~45 min agentic)

**Subtasks:**
1. Audit all repository interfaces (~15 min)
2. Add JSDoc to all interfaces (~15 min)
3. Extract missing interfaces (~15 min)

**Files to Update:**
- `src/domain/interfaces/repositories/*.ts`
- `src/domain/interfaces/services/*.ts`
- `src/domain/interfaces/providers/*.ts`

### Task 3.2: Dependency Analysis (~25 min agentic)

**Subtasks:**
1. Install dependency analysis tools (~10 min)
2. Generate dependency graphs (~10 min)
3. Configure dependency rules (~5 min)

**Tools:**
- `madge` for visualization
- `dependency-cruiser` for rules enforcement

### Task 3.3: Separation of Concerns (~1 hour agentic)

**Subtasks:**
1. Create validation layer (~20 min)
2. Implement logging decorators (~20 min)
3. Apply caching decorators (~20 min)

**New Files:**
- `src/domain/validation/` directory
- `src/infrastructure/decorators/` directory

### Task 3.4: Configuration Centralization (~30 min agentic)

**Subtasks:**
1. Create configuration service (~20 min)
2. Update DI container (~10 min)

**Files:**
- `src/application/config/configuration.ts`
- `src/application/config/types.ts`
- Update `src/application/container.ts`

### Task 3.5: Factory Implementation (~30 min agentic)

**Subtasks:**
1. Create embedding provider factory (~15 min)
2. Document loader factory already exists ✅

**Files:**
- `src/infrastructure/embeddings/EmbeddingProviderFactory.ts`
- `src/infrastructure/loaders/DocumentLoaderFactory.ts` ✅ (exists)

## Architecture Quality Gates

### Before Refactoring
- [ ] All tests passing
- [ ] Code coverage documented
- [ ] Performance benchmarks recorded

### During Refactoring
- [ ] Tests remain green
- [ ] Coverage does not decrease
- [ ] No new linter errors

### After Refactoring
- [ ] All tests passing
- [ ] Coverage same or improved
- [ ] Dependency rules enforced
- [ ] Documentation updated

## Success Criteria

### Measurable Improvements
- [ ] Zero circular dependencies
- [ ] All interfaces explicitly defined
- [ ] JSDoc coverage > 90% for interfaces
- [ ] Dependency rules enforced in CI
- [ ] Configuration centralized

### Code Quality
- [ ] Each class has single responsibility
- [ ] Dependencies flow inward only
- [ ] Cross-cutting concerns separated
- [ ] Factory patterns for complex creation

### Maintainability
- [ ] Clear module boundaries
- [ ] Easy to add new implementations
- [ ] Test seams well-defined
- [ ] Configuration changes don't require code changes

## Validation Strategy

### Code Review Checklist
- [ ] Interface contracts clear and documented
- [ ] No circular dependencies
- [ ] No layer violations
- [ ] Factory pattern used appropriately
- [ ] Configuration injected, not hardcoded

### Testing Validation
- [ ] All tests pass
- [ ] No decrease in coverage
- [ ] Integration tests use factories
- [ ] Mock implementations validate interfaces

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Breaking changes during refactoring | High | Medium | Comprehensive test coverage first |
| Performance regression | Medium | Low | Benchmark before/after |
| Over-engineering | Low | Medium | Focus on actual pain points |
| Time overrun | Medium | Medium | Prioritize highest-value improvements |

## Integration with Other Recommendations

### Dependencies
- **Testing Coverage (Rec #1)**: Required before refactoring
- **Error Handling (Rec #2)**: Integrate with interface definitions

### Enables
- **Performance Monitoring (Rec #4)**: Decorators make monitoring easier
- **Documentation (Rec #5)**: Clear architecture easier to document

## Next Steps

**Agentic Implementation**: Can complete all tasks in ~3 hours total

1. **Session 1** (~45 min): Interface enhancement (Task 3.1)
2. **Session 1** (~30 min): Configuration centralization (Task 3.4)
3. **Session 2** (~25 min): Dependency analysis (Task 3.2)
4. **Session 2** (~1 hour): Separation of concerns (Task 3.3)
5. **Session 3** (~30 min): Factory implementation (Task 3.5)

---

**Related Documents:**
- [01-analysis-and-priorities.md](01-analysis-and-priorities.md)
- [02-testing-coverage-plan.md](02-testing-coverage-plan.md) (prerequisite)
- [04-error-handling-plan.md](04-error-handling-plan.md) (integrates with)

**Knowledge Base Sources:**
- "Clean Architecture" - Dependency rules, layered architecture
- "Interface-Oriented Design" - Interface patterns
- "Refactoring for Software Design Smells" - Separation of concerns
- "Code That Fits in Your Head" - Factory patterns, DI


