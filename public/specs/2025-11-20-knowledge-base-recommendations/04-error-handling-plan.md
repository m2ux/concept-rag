# Error Handling Improvement Plan

**Date:** 2025-11-20  
**Priority:** HIGH (Phase 1, Week 2)  
**Status:** Planning

## Overview

Implement a structured exception hierarchy and consistent error handling patterns throughout the concept-RAG project. This will improve reliability, debugging, and user experience by providing clear, actionable error information.

## Knowledge Base Insights Applied

### Core Error Handling Concepts

**From "Programming Rust," error handling patterns, and related sources:**

1. **Error Hierarchies**
   - Structured exception taxonomy
   - Domain-specific error types
   - Base error classes for common patterns

2. **Error Propagation**
   - Consistent bubbling up the stack
   - Context preservation during propagation
   - Appropriate error boundaries

3. **Multiple Error Types**
   - Handling errors across boundaries
   - Converting between error types
   - Error aggregation

4. **Custom Exceptions**
   - Domain-specific error information
   - Actionable error messages
   - Error codes for programmatic handling

5. **Graceful Degradation**
   - Fallback mechanisms
   - Partial success handling
   - Service resilience

## Current State Assessment

### Existing Error Handling

```typescript
// src/domain/exceptions.ts
export class ConceptRAGError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConceptRAGError';
  }
}

export class ValidationError extends ConceptRAGError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Additional basic error types...
```

### Strengths
✅ Base error class exists  
✅ Some domain-specific errors defined  
✅ Extends JavaScript Error properly

### Weaknesses
⚠️ Limited error hierarchy  
⚠️ No error codes for programmatic handling  
⚠️ Missing context information (e.g., which parameter failed)  
⚠️ No error recovery patterns  
⚠️ Inconsistent error throwing patterns across modules  
⚠️ No error logging/monitoring hooks

## Error Hierarchy Design

### Base Error Structure

```typescript
// src/domain/exceptions/base.ts

/**
 * Base error class for all concept-RAG errors.
 * Provides structured error information for consistent handling.
 */
export abstract class ConceptRAGError extends Error {
  /**
   * Error code for programmatic error handling.
   * Format: CATEGORY_SPECIFIC_ERROR (e.g., VALIDATION_MISSING_FIELD)
   */
  public readonly code: string;
  
  /**
   * Additional context about the error.
   * May include field names, values, suggestions, etc.
   */
  public readonly context: Record<string, unknown>;
  
  /**
   * Timestamp when error occurred.
   */
  public readonly timestamp: Date;
  
  /**
   * Original error if this error wraps another.
   */
  public readonly cause?: Error;
  
  constructor(
    message: string,
    code: string,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.cause = cause;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Get a structured representation of the error.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause?.message
    };
  }
  
  /**
   * Check if this error is of a specific type.
   */
  is(errorClass: new (...args: any[]) => ConceptRAGError): boolean {
    return this instanceof errorClass;
  }
}
```

### Error Categories

#### 1. Validation Errors
```typescript
// src/domain/exceptions/validation.ts

export class ValidationError extends ConceptRAGError {
  constructor(
    message: string,
    field: string,
    value: unknown,
    cause?: Error
  ) {
    super(
      message,
      `VALIDATION_${field.toUpperCase()}_INVALID`,
      { field, value },
      cause
    );
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(
      `Required field '${field}' is missing`,
      field,
      undefined
    );
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(
    field: string,
    value: unknown,
    expectedFormat: string
  ) {
    super(
      `Field '${field}' has invalid format. Expected: ${expectedFormat}`,
      field,
      value
    );
    this.context.expectedFormat = expectedFormat;
  }
}

export class ValueOutOfRangeError extends ValidationError {
  constructor(
    field: string,
    value: number,
    min: number,
    max: number
  ) {
    super(
      `Field '${field}' value ${value} is out of range [${min}, ${max}]`,
      field,
      value
    );
    this.context.min = min;
    this.context.max = max;
  }
}
```

#### 2. Database Errors
```typescript
// src/domain/exceptions/database.ts

export class DatabaseError extends ConceptRAGError {
  constructor(
    message: string,
    operation: string,
    cause?: Error
  ) {
    super(
      message,
      `DATABASE_${operation.toUpperCase()}_FAILED`,
      { operation },
      cause
    );
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(
    entity: string,
    identifier: string | number
  ) {
    super(
      `${entity} with identifier '${identifier}' not found`,
      'query'
    );
    this.context.entity = entity;
    this.context.identifier = identifier;
  }
}

export class DuplicateRecordError extends DatabaseError {
  constructor(
    entity: string,
    field: string,
    value: unknown
  ) {
    super(
      `${entity} with ${field}='${value}' already exists`,
      'insert'
    );
    this.context.entity = entity;
    this.context.field = field;
    this.context.value = value;
  }
}

export class ConnectionError extends DatabaseError {
  constructor(cause?: Error) {
    super(
      'Failed to connect to database',
      'connection',
      cause
    );
  }
}

export class TransactionError extends DatabaseError {
  constructor(
    operation: string,
    cause?: Error
  ) {
    super(
      `Transaction ${operation} failed`,
      'transaction',
      cause
    );
    this.context.transactionOp = operation;
  }
}
```

#### 3. Embedding Errors
```typescript
// src/domain/exceptions/embedding.ts

export class EmbeddingError extends ConceptRAGError {
  constructor(
    message: string,
    provider: string,
    cause?: Error
  ) {
    super(
      message,
      `EMBEDDING_${provider.toUpperCase()}_ERROR`,
      { provider },
      cause
    );
  }
}

export class EmbeddingProviderError extends EmbeddingError {
  constructor(
    provider: string,
    statusCode?: number,
    cause?: Error
  ) {
    super(
      `Embedding provider '${provider}' request failed`,
      provider,
      cause
    );
    if (statusCode) {
      this.context.statusCode = statusCode;
    }
  }
}

export class RateLimitError extends EmbeddingError {
  constructor(
    provider: string,
    retryAfter?: number
  ) {
    super(
      `Rate limit exceeded for provider '${provider}'`,
      provider
    );
    if (retryAfter) {
      this.context.retryAfter = retryAfter;
    }
  }
}

export class InvalidEmbeddingDimensionsError extends EmbeddingError {
  constructor(
    provider: string,
    expected: number,
    actual: number
  ) {
    super(
      `Invalid embedding dimensions: expected ${expected}, got ${actual}`,
      provider
    );
    this.context.expected = expected;
    this.context.actual = actual;
  }
}
```

#### 4. Search Errors
```typescript
// src/domain/exceptions/search.ts

export class SearchError extends ConceptRAGError {
  constructor(
    message: string,
    searchType: string,
    cause?: Error
  ) {
    super(
      message,
      `SEARCH_${searchType.toUpperCase()}_ERROR`,
      { searchType },
      cause
    );
  }
}

export class InvalidQueryError extends SearchError {
  constructor(
    reason: string,
    query: string
  ) {
    super(
      `Invalid search query: ${reason}`,
      'validation'
    );
    this.context.reason = reason;
    this.context.query = query;
  }
}

export class SearchTimeoutError extends SearchError {
  constructor(
    searchType: string,
    timeoutMs: number
  ) {
    super(
      `Search timed out after ${timeoutMs}ms`,
      searchType
    );
    this.context.timeoutMs = timeoutMs;
  }
}

export class NoResultsError extends SearchError {
  constructor(query: string) {
    super(
      'No results found for query',
      'query'
    );
    this.context.query = query;
  }
}
```

#### 5. Configuration Errors
```typescript
// src/domain/exceptions/configuration.ts

export class ConfigurationError extends ConceptRAGError {
  constructor(
    message: string,
    configKey: string,
    cause?: Error
  ) {
    super(
      message,
      `CONFIG_${configKey.toUpperCase()}_ERROR`,
      { configKey },
      cause
    );
  }
}

export class MissingConfigError extends ConfigurationError {
  constructor(configKey: string) {
    super(
      `Required configuration key '${configKey}' is missing`,
      configKey
    );
  }
}

export class InvalidConfigError extends ConfigurationError {
  constructor(
    configKey: string,
    value: unknown,
    reason: string
  ) {
    super(
      `Configuration '${configKey}' is invalid: ${reason}`,
      configKey
    );
    this.context.value = value;
    this.context.reason = reason;
  }
}
```

#### 6. Document Processing Errors
```typescript
// src/domain/exceptions/document.ts

export class DocumentError extends ConceptRAGError {
  constructor(
    message: string,
    filePath: string,
    cause?: Error
  ) {
    super(
      message,
      'DOCUMENT_PROCESSING_ERROR',
      { filePath },
      cause
    );
  }
}

export class UnsupportedFormatError extends DocumentError {
  constructor(
    filePath: string,
    format: string
  ) {
    super(
      `Unsupported document format: ${format}`,
      filePath
    );
    this.context.format = format;
  }
}

export class DocumentParseError extends DocumentError {
  constructor(
    filePath: string,
    cause?: Error
  ) {
    super(
      `Failed to parse document`,
      filePath,
      cause
    );
  }
}

export class DocumentTooLargeError extends DocumentError {
  constructor(
    filePath: string,
    sizeBytes: number,
    maxSizeBytes: number
  ) {
    super(
      `Document exceeds maximum size: ${sizeBytes} > ${maxSizeBytes} bytes`,
      filePath
    );
    this.context.sizeBytes = sizeBytes;
    this.context.maxSizeBytes = maxSizeBytes;
  }
}
```

## Error Handling Patterns

### 1. Input Validation Pattern

```typescript
// src/domain/services/validation.ts

export class InputValidator {
  validateSearchQuery(params: SearchQueryParams): void {
    if (!params.text || params.text.trim().length === 0) {
      throw new RequiredFieldError('text');
    }
    
    if (params.text.length > 10000) {
      throw new ValueOutOfRangeError('text', params.text.length, 1, 10000);
    }
    
    if (params.limit !== undefined) {
      if (params.limit < 1 || params.limit > 100) {
        throw new ValueOutOfRangeError('limit', params.limit, 1, 100);
      }
    }
  }
  
  validateDocumentPath(path: string): void {
    if (!path) {
      throw new RequiredFieldError('path');
    }
    
    const ext = path.split('.').pop()?.toLowerCase();
    const supportedFormats = ['pdf', 'epub', 'md', 'txt'];
    
    if (!ext || !supportedFormats.includes(ext)) {
      throw new UnsupportedFormatError(path, ext || 'unknown');
    }
  }
}
```

### 2. Error Propagation Pattern

```typescript
// Service layer - add context and convert errors
export class ConceptService {
  async findByName(name: string): Promise<Concept> {
    try {
      const concept = await this.repository.findByName(name);
      
      if (!concept) {
        throw new RecordNotFoundError('Concept', name);
      }
      
      return concept;
    } catch (error) {
      // If it's already our error, just re-throw
      if (error instanceof ConceptRAGError) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new DatabaseError(
        'Failed to retrieve concept',
        'query',
        error as Error
      );
    }
  }
}
```

### 3. Error Recovery Pattern

```typescript
// Retry with exponential backoff for transient errors
export class EmbeddingService {
  async embedWithRetry(
    text: string,
    maxRetries: number = 3
  ): Promise<Embedding> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.provider.embed(text);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors
        if (error instanceof ValidationError) {
          throw error;
        }
        
        // Retry on rate limits or transient errors
        if (error instanceof RateLimitError) {
          const retryAfter = error.context.retryAfter as number || 1000;
          await this.sleep(retryAfter * Math.pow(2, attempt));
          continue;
        }
        
        // Re-throw other errors immediately
        if (!(error instanceof EmbeddingProviderError)) {
          throw error;
        }
        
        // Exponential backoff for provider errors
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }
    
    throw new EmbeddingProviderError(
      this.provider.name,
      undefined,
      lastError
    );
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Error Boundary Pattern

```typescript
// MCP tool layer - catch and format errors for external consumption
export async function catalogSearch(params: CatalogSearchParams) {
  try {
    // Validate input
    validator.validateSearchQuery(params);
    
    // Execute search
    const results = await searchService.search(params);
    
    return formatSuccess(results);
  } catch (error) {
    if (error instanceof ConceptRAGError) {
      return formatError(error);
    }
    
    // Unknown error - log and return generic error
    logger.error('Unexpected error in catalogSearch', { error });
    return formatError(
      new SearchError('An unexpected error occurred', 'unknown', error as Error)
    );
  }
}

function formatError(error: ConceptRAGError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp.toISOString()
    }
  };
}
```

## Implementation Tasks

### Task 4.1: Create Exception Hierarchy (4 hours)

**Subtasks:**
1. Create base error class (1h)
2. Create category-specific errors (2h)
3. Add error utilities (1h)

**Files to Create:**
- `src/domain/exceptions/base.ts`
- `src/domain/exceptions/validation.ts`
- `src/domain/exceptions/database.ts`
- `src/domain/exceptions/embedding.ts`
- `src/domain/exceptions/search.ts`
- `src/domain/exceptions/configuration.ts`
- `src/domain/exceptions/document.ts`
- `src/domain/exceptions/index.ts` (exports)

### Task 4.2: Add Validation Layer (3 hours)

**Subtasks:**
1. Create validation service (2h)
2. Add validation to MCP tools (1h)

**Files:**
- `src/domain/services/validation/InputValidator.ts`
- `src/domain/services/validation/index.ts`
- Update `src/tools/*.ts` to use validation

### Task 4.3: Update Error Handling Patterns (3 hours)

**Subtasks:**
1. Update repositories (1h)
2. Update services (1h)
3. Update tools layer (1h)

**Changes:**
- Wrap database errors appropriately
- Add context to errors
- Use specific error types

### Task 4.4: Add Error Recovery (2 hours)

**Subtasks:**
1. Implement retry logic for embeddings (1h)
2. Add fallback for non-critical operations (1h)

**Files:**
- Update `src/domain/services/EmbeddingService.ts`
- Add retry utilities

## Testing Strategy

### Unit Tests for Errors

```typescript
describe('ValidationError', () => {
  it('should include field and value in context', () => {
    const error = new RequiredFieldError('text');
    
    expect(error.message).toContain('text');
    expect(error.code).toBe('VALIDATION_TEXT_INVALID');
    expect(error.context.field).toBe('text');
  });
  
  it('should serialize to JSON correctly', () => {
    const error = new RequiredFieldError('text');
    const json = error.toJSON();
    
    expect(json.name).toBe('RequiredFieldError');
    expect(json.code).toBe('VALIDATION_TEXT_INVALID');
    expect(json.context).toEqual({ field: 'text', value: undefined });
  });
});
```

### Integration Tests for Error Handling

```typescript
describe('ConceptService error handling', () => {
  it('should throw RecordNotFoundError when concept does not exist', async () => {
    await expect(service.findByName('nonexistent'))
      .rejects
      .toThrow(RecordNotFoundError);
  });
  
  it('should wrap database errors appropriately', async () => {
    mockRepository.findByName.mockRejectedValue(new Error('DB connection failed'));
    
    await expect(service.findByName('test'))
      .rejects
      .toThrow(DatabaseError);
  });
});
```

## Success Criteria

- [ ] Comprehensive error hierarchy implemented
- [ ] All error types have tests
- [ ] Validation layer created and used in all tools
- [ ] Error propagation consistent across layers
- [ ] Error recovery patterns implemented
- [ ] Documentation for error handling patterns
- [ ] All public APIs document possible errors

## Next Steps

1. **Day 1**: Create base error classes and hierarchy (Task 4.1)
2. **Day 2**: Implement validation layer (Task 4.2)
3. **Day 3**: Update error handling patterns (Task 4.3)
4. **Day 4**: Add error recovery and test (Task 4.4)

---

**Related Documents:**
- [01-analysis-and-priorities.md](01-analysis-and-priorities.md)
- [02-testing-coverage-plan.md](02-testing-coverage-plan.md) (tests validate errors)
- [03-architecture-refinement-plan.md](03-architecture-refinement-plan.md) (integrates with)

**Knowledge Base Sources:**
- "Programming Rust" - Error handling patterns
- Error handling best practices from Software Engineering category


