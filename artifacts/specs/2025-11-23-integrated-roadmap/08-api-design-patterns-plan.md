# Phase 6: API Design Patterns Implementation Plan

**Date:** November 23, 2025  
**Priority:** LOW-MEDIUM (Polish)  
**Status:** Ready for Implementation  
**Estimated Effort:** 2-3h agentic + 1h review

> **Note:** All time estimates refer to agentic (AI-assisted) development time plus human review time.

---

## Overview

Apply advanced API design patterns (Postel's Law, tolerant reader, API versioning) to make MCP tool interfaces more robust, flexible, and backward-compatible.

---

## Knowledge Base Insights Applied

### Core API Design Concepts (10 concepts from lexicon)

1. **Postel's Law** - Robustness principle (be liberal in what you accept)
2. **Tolerant reader** - Resilient to interface changes
3. **API versioning** - Backward compatibility strategies
4. **Schema validation** - JSON schema enforcement (partial)
5. **Error responses** - Structured error reporting (partial)
6. **Tool composition** - Chaining operations
7. **Interface contracts** - Pre/post conditions
8. **Design by contract** - Formal interface specifications
9. **API evolution** - Managing API changes
10. **Deprecation strategies** - Phasing out old APIs

---

## Current State

### What Exists ✅
- ✅ MCP tool interfaces defined
- ✅ Parameter validation with InputValidator
- ✅ Structured error responses (via exceptions)

### What's Missing ❌
- ❌ Postel's Law not systematically applied
- ❌ No tolerant reader pattern
- ❌ No API versioning strategy
- ❌ No deprecation process
- ❌ Tool composition examples limited

---

## Implementation Tasks

### Task 6.1: Apply Postel's Law (45-60 min agentic)

**Goal:** Make APIs more flexible in accepting input

**Tasks:**
1. Identify overly strict parameter types
2. Add parameter normalization utilities
3. Accept multiple input formats (strings/numbers, singular/arrays)
4. Add backward-compatible defaults
5. Update validation to be more lenient
6. Test with various input formats

**Deliverables:**
- `src/tools/utils/parameter-normalization.ts`
- Updated MCP tools with flexible parameters
- Documentation of accepted formats

**Example:**
```typescript
// Before: Strict
interface CatalogSearchParams {
  text: string;  // Must be string
  limit?: number; // Must be number
}

// After: Liberal (Postel's Law)
interface CatalogSearchParams {
  text: string | string[];  // Accept single or array
  limit?: number | string;  // Accept number or string
  // Normalized internally
}
```

---

### Task 6.2: Implement Tolerant Reader (30-45 min agentic)

**Goal:** Make clients resilient to API response changes

**Tasks:**
1. Design extensible response format
2. Add optional fields that can be ignored by old clients
3. Document guaranteed vs optional fields
4. Add response version indicators
5. Create examples of forward/backward compatibility

**Deliverables:**
- Response format guidelines
- Versioned response types
- Compatibility matrix documentation

---

### Task 6.3: API Versioning Strategy (30-45 min agentic)

**Goal:** Enable API evolution without breaking clients

**Tasks:**
1. Design versioning scheme (tool name + version)
2. Support multiple API versions simultaneously
3. Add version negotiation
4. Document version lifecycle
5. Create migration guide

**Deliverables:**
- `src/tools/versioning.ts`
- Version detection and routing
- Versioning documentation
- Migration guide

---

### Task 6.4: Enhanced Error Responses (15-30 min agentic)

**Goal:** Improve error message quality and consistency

**Tasks:**
1. Standardize error response format
2. Add error codes for programmatic handling
3. Include helpful error messages
4. Add suggestions for fixing errors
5. Document all error codes

**Deliverables:**
- `src/tools/types/error-response.ts`
- Error code catalog
- Error handling guide

---

## Detailed Implementation

### Postel's Law - Parameter Normalization

**File:** `src/tools/utils/parameter-normalization.ts`

```typescript
/**
 * Parameter normalization utilities for Postel's Law compliance.
 * "Be liberal in what you accept, conservative in what you send."
 */

export class ParameterNormalizer {
  /**
   * Normalize text parameter to string.
   * Accepts: string, string[], number
   */
  static normalizeText(value: string | string[] | number): string {
    if (Array.isArray(value)) {
      return value.join(' ');
    }
    return String(value);
  }
  
  /**
   * Normalize limit parameter to number.
   * Accepts: number, string, undefined
   */
  static normalizeLimit(
    value: number | string | undefined,
    defaultValue: number = 10,
    max: number = 100
  ): number {
    if (value === undefined) {
      return defaultValue;
    }
    
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(num) || num < 1) {
      return defaultValue;
    }
    
    return Math.min(num, max);
  }
  
  /**
   * Normalize boolean parameter.
   * Accepts: boolean, string ('true', 'false', '1', '0'), number (0, 1)
   */
  static normalizeBoolean(
    value: boolean | string | number | undefined,
    defaultValue: boolean = false
  ): boolean {
    if (value === undefined) {
      return defaultValue;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return defaultValue;
  }
  
  /**
   * Normalize array parameter.
   * Accepts: T[], T, comma-separated string
   */
  static normalizeArray<T>(
    value: T | T[] | string | undefined,
    parser?: (item: string) => T
  ): T[] {
    if (value === undefined) {
      return [];
    }
    
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'string' && parser) {
      return value.split(',').map(s => parser(s.trim()));
    }
    
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()) as unknown as T[];
    }
    
    return [value];
  }
}
```

---

### Tolerant Reader Pattern

**File:** `src/tools/types/response.ts`

```typescript
/**
 * Tolerant reader response types.
 * Clients can safely ignore unknown fields.
 */

/**
 * Base response with version indicator.
 */
export interface BaseResponse {
  version: string;  // e.g., "1.0"
  [key: string]: unknown;  // Allow additional fields
}

/**
 * Search response following tolerant reader pattern.
 * 
 * Guaranteed fields (will never be removed):
 * - results
 * - metadata.total
 * 
 * Optional fields (may be added in future versions):
 * - metadata.page, metadata.hasMore, etc.
 */
export interface SearchResponse extends BaseResponse {
  // Guaranteed fields
  results: SearchResult[];
  metadata: {
    total: number;
    // Optional fields below
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    query?: string;
    duration?: number;
  };
  // Future versions may add fields here
}

/**
 * Parse search response tolerantly.
 * Extracts only guaranteed fields, ignores unknown fields.
 */
export function parseSearchResponse(data: unknown): SearchResponse {
  const raw = data as any;
  
  return {
    version: raw.version || '1.0',
    results: Array.isArray(raw.results) ? raw.results : [],
    metadata: {
      total: typeof raw.metadata?.total === 'number' ? raw.metadata.total : 0,
      // Optionally extract optional fields if present
      ...(raw.metadata?.page !== undefined && { page: raw.metadata.page }),
      ...(raw.metadata?.pageSize !== undefined && { pageSize: raw.metadata.pageSize }),
      ...(raw.metadata?.hasMore !== undefined && { hasMore: raw.metadata.hasMore })
    }
  };
}
```

---

### API Versioning

**File:** `src/tools/versioning.ts`

```typescript
/**
 * API versioning support for MCP tools.
 */

export type APIVersion = 'v1' | 'v2';

export interface VersionedToolConfig {
  name: string;
  currentVersion: APIVersion;
  supportedVersions: APIVersion[];
  defaultVersion: APIVersion;
}

export interface VersionedTool {
  name: string;
  version: APIVersion;
  handle(params: unknown, version?: APIVersion): Promise<unknown>;
}

export class VersionedToolRouter {
  private handlers: Map<string, Map<APIVersion, VersionedTool>> = new Map();
  
  register(tool: VersionedTool): void {
    if (!this.handlers.has(tool.name)) {
      this.handlers.set(tool.name, new Map());
    }
    
    this.handlers.get(tool.name)!.set(tool.version, tool);
  }
  
  async route(
    toolName: string,
    params: unknown,
    requestedVersion?: APIVersion
  ): Promise<unknown> {
    const toolVersions = this.handlers.get(toolName);
    
    if (!toolVersions || toolVersions.size === 0) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // Detect version from params if not specified
    const version = requestedVersion || this.detectVersion(params) || 'v1';
    
    // Get handler for requested version
    const handler = toolVersions.get(version);
    
    if (!handler) {
      // Fall back to latest version
      const latest = this.getLatestVersion(toolVersions);
      return latest.handle(params, version);
    }
    
    return handler.handle(params, version);
  }
  
  private detectVersion(params: unknown): APIVersion | undefined {
    // Check if params contain version indicator
    if (typeof params === 'object' && params !== null) {
      const version = (params as any).version || (params as any).apiVersion;
      if (version === 'v1' || version === 'v2') {
        return version;
      }
    }
    return undefined;
  }
  
  private getLatestVersion(versions: Map<APIVersion, VersionedTool>): VersionedTool {
    // Return v2 if available, otherwise v1
    return versions.get('v2') || versions.get('v1')!;
  }
}

/**
 * Example: Versioned catalog search tool.
 */
export class CatalogSearchTool implements VersionedTool {
  name = 'catalog_search';
  version: APIVersion = 'v2';
  
  constructor(private service: CatalogSearchService) {}
  
  async handle(params: unknown, version?: APIVersion): Promise<unknown> {
    const requestedVersion = version || 'v2';
    
    if (requestedVersion === 'v1') {
      return this.handleV1(params);
    }
    
    return this.handleV2(params);
  }
  
  private async handleV1(params: unknown): Promise<unknown> {
    // V1 behavior: Simple format
    const { text, limit } = params as any;
    const results = await this.service.search({ text, limit });
    
    return {
      results: results.map(r => ({ id: r.id, title: r.title, score: r.score }))
    };
  }
  
  private async handleV2(params: unknown): Promise<unknown> {
    // V2 behavior: Rich format with metadata
    const normalizedParams = this.normalizeParams(params);
    const results = await this.service.search(normalizedParams);
    
    return {
      version: 'v2',
      results,
      metadata: {
        total: results.length,
        query: normalizedParams.text,
        page: 1,
        hasMore: results.length >= normalizedParams.limit
      }
    };
  }
  
  private normalizeParams(params: unknown): SearchParams {
    const raw = params as any;
    return {
      text: ParameterNormalizer.normalizeText(raw.text),
      limit: ParameterNormalizer.normalizeLimit(raw.limit),
      // V2 supports additional parameters
      filters: raw.filters,
      sort: raw.sort
    };
  }
}
```

---

### Enhanced Error Responses

**File:** `src/tools/types/error-response.ts`

```typescript
/**
 * Standardized error response format.
 */

export interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: unknown;      // Additional error details
    suggestions?: string[]; // Helpful suggestions for fixing
    documentation?: string; // Link to docs
  };
  metadata: {
    timestamp: string;
    traceId?: string;
    path?: string;
  };
}

/**
 * Error codes catalog.
 */
export enum ErrorCode {
  // Validation errors (4xx equivalent)
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  REQUIRED_PARAMETER_MISSING = 'REQUIRED_PARAMETER_MISSING',
  PARAMETER_OUT_OF_RANGE = 'PARAMETER_OUT_OF_RANGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Not found errors (404 equivalent)
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  CONCEPT_NOT_FOUND = 'CONCEPT_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  
  // Server errors (5xx equivalent)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Circuit breaker
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * Create standardized error response.
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  suggestions?: string[],
  traceId?: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      suggestions,
      documentation: getDocumentationUrl(code)
    },
    metadata: {
      timestamp: new Date().toISOString(),
      traceId
    }
  };
}

function getDocumentationUrl(code: ErrorCode): string {
  return `https://docs.concept-rag.dev/errors#${code.toLowerCase()}`;
}

/**
 * Error suggestions generator.
 */
export class ErrorSuggestions {
  static forInvalidParameter(paramName: string, expectedType: string): string[] {
    return [
      `Check that '${paramName}' is a valid ${expectedType}`,
      `See documentation for expected parameter format`,
      `Example: ${this.getExampleValue(expectedType)}`
    ];
  }
  
  static forDocumentNotFound(id: number): string[] {
    return [
      `Verify the document ID ${id} exists`,
      `Use catalog_search to find available documents`,
      `Check if the document has been deleted`
    ];
  }
  
  static forRateLimit(): string[] {
    return [
      `Wait a moment before retrying`,
      `Reduce request frequency`,
      `Consider implementing request queuing`
    ];
  }
  
  private static getExampleValue(type: string): string {
    switch (type) {
      case 'string': return '"example text"';
      case 'number': return '42';
      case 'boolean': return 'true';
      case 'array': return '["item1", "item2"]';
      default: return '...';
    }
  }
}
```

---

## Updated MCP Tool Example

**catalog_search with all patterns applied:**

```typescript
export class CatalogSearchToolV2 implements VersionedTool {
  name = 'catalog_search';
  version: APIVersion = 'v2';
  
  async handle(params: unknown, version?: APIVersion): Promise<unknown> {
    const traceId = generateTraceId();
    
    try {
      // Apply Postel's Law - liberal in what we accept
      const normalizedParams = this.normalizeParams(params);
      
      // Validate (but leniently)
      this.validateParams(normalizedParams);
      
      // Execute search
      const results = await this.service.search(normalizedParams);
      
      // Tolerant reader - conservative in what we send
      return this.formatResponse(results, normalizedParams, version || 'v2');
      
    } catch (error) {
      // Enhanced error response
      return this.formatError(error, traceId);
    }
  }
  
  private normalizeParams(params: unknown): SearchParams {
    const raw = params as any;
    
    return {
      text: ParameterNormalizer.normalizeText(raw.text || raw.query || ''),
      limit: ParameterNormalizer.normalizeLimit(raw.limit || raw.maxResults),
      filters: ParameterNormalizer.normalizeArray(raw.filters),
      includeScore: ParameterNormalizer.normalizeBoolean(raw.includeScore, true)
    };
  }
  
  private formatResponse(
    results: SearchResult[],
    params: SearchParams,
    version: APIVersion
  ): SearchResponse {
    return {
      version,
      results,
      metadata: {
        total: results.length,
        query: params.text,
        // Optional fields (tolerant reader can ignore)
        page: 1,
        pageSize: params.limit,
        hasMore: results.length >= params.limit
      }
    };
  }
  
  private formatError(error: unknown, traceId: string): ErrorResponse {
    if (error instanceof ValidationError) {
      return createErrorResponse(
        ErrorCode.INVALID_PARAMETER,
        error.message,
        error.context,
        ErrorSuggestions.forInvalidParameter(error.field, error.expectedType),
        traceId
      );
    }
    
    if (error instanceof DocumentNotFoundError) {
      return createErrorResponse(
        ErrorCode.DOCUMENT_NOT_FOUND,
        error.message,
        { id: error.id },
        ErrorSuggestions.forDocumentNotFound(error.id),
        traceId
      );
    }
    
    // Default error
    return createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      undefined,
      ['Contact support if the problem persists'],
      traceId
    );
  }
}
```

---

## Success Criteria

### Functional Requirements
- [ ] Postel's Law applied to all MCP tools
- [ ] Tolerant reader pattern documented
- [ ] API versioning strategy implemented
- [ ] Enhanced error responses with suggestions
- [ ] Backward compatibility maintained

### Quality Targets
- [ ] All tools accept flexible input formats
- [ ] Error messages include helpful suggestions
- [ ] API version migration guide complete
- [ ] Tool composition examples provided
- [ ] 100% backward compatibility for v1 clients

### Documentation Requirements
- [ ] API design patterns documented
- [ ] Error code catalog published
- [ ] Versioning strategy explained
- [ ] Migration guide for API changes
- [ ] ADR documenting API evolution

---

## Testing Strategy

### Unit Tests
- Parameter normalization edge cases
- Error response formatting
- Version detection and routing
- Backward compatibility

### Integration Tests
- V1 and V2 API compatibility
- Error handling end-to-end
- Tool composition workflows
- Client compatibility

---

## Validation Steps

1. **Backward Compatibility** - Test V1 clients still work
2. **Flexibility** - Test various input formats accepted
3. **Error Quality** - Review error messages
4. **Documentation** - Verify completeness
5. **Migration** - Test upgrade path

---

## Documentation Requirements

### ADR Required
- **ADR 0044:** API Design Patterns and Evolution Strategy
  - Context: Need for robust, evolvable APIs
  - Decision: Postel's Law, tolerant reader, versioning
  - Implementation: ParameterNormalizer, versioning system
  - Migration: How to evolve APIs safely

### User Documentation
- API design principles guide
- Error code reference
- API versioning guide
- Migration guide for breaking changes

---

## Estimated Timeline

| Task | Duration (Agentic) | Review | Total |
|------|-------------------|--------|-------|
| 6.1 Postel's Law | 45-60 min | 15 min | 60-75 min |
| 6.2 Tolerant Reader | 30-45 min | 15 min | 45-60 min |
| 6.3 API Versioning | 30-45 min | 15 min | 45-60 min |
| 6.4 Enhanced Errors | 15-30 min | 15 min | 30-45 min |
| **TOTAL** | **2-3h** | **1h** | **3-4h** |

---

## Implementation Selection Matrix

Use this matrix to select which sub-phases to implement. Mark with ✓ to include or X to skip.

| Sub-Phase | Description | Duration | Include |
|-----------|-------------|----------|---------|
| Task 6.1 | Apply Postel's Law (Liberal Input) | 45-60 min | ✓ |
| Task 6.2 | Implement Tolerant Reader Pattern | 30-45 min | ✓ |
| Task 6.3 | API Versioning Strategy | 30-45 min | ✓ |
| Task 6.4 | Enhanced Error Responses | 15-30 min | ✓ |

**Instructions:** Replace ✓ with X for any sub-phase you wish to skip.

---

**Status:** Ready for implementation  
**All 6 phases planned and documented!** ✅

