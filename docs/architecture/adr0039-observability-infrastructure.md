# ADR 0039: Observability Infrastructure

**Date**: 2025-11-23  
**Status**: Accepted  
**Context**: Phase 1 of Integrated Roadmap (Observability Infrastructure)  
**Related ADRs**: ADR-0034 (Error Handling), ADR-0035 (Test Suite Expansion)

---

## Context

The Concept-RAG system lacked structured observability, making it difficult to:

1. **Debug production issues** - No structured logs to trace request flow
2. **Identify performance bottlenecks** - No instrumentation of slow operations
3. **Monitor system health** - No visibility into operation durations and failures
4. **Correlate related events** - No trace IDs for request correlation
5. **Troubleshoot in production** - Console logs lacked structure and context

### Requirements

From the concept lexicon and integrated roadmap:

1. **Structured logging** with JSON output for parseability
2. **Performance instrumentation** to measure operation durations
3. **Trace ID propagation** for request correlation
4. **Child loggers** with contextual information
5. **Log level filtering** (debug, info, warn, error)
6. **Zero runtime overhead** when logging is disabled
7. **Integration with dependency injection container**

---

## Decision

Implement a **lightweight observability infrastructure** with:

### 1. Structured Logging (`logger.ts`)

```typescript
export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  logOperation(operation: string, durationMs: number, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): ILogger;
}
```

**Features**:
- JSON-formatted output to stdout (parseable by log aggregators)
- ISO 8601 timestamps for consistent time representation
- Automatic error serialization with stack traces
- Contextual child loggers for scoped logging
- Log level filtering (respects minimum level)
- Slow operation detection (warns when >1s)

### 2. Trace ID Management (`trace-id.ts`)

```typescript
export function generateTraceId(): string;
export function withTraceId<T>(fn: () => Promise<T>): Promise<T>;
```

**Features**:
- Unique 32-character hex trace IDs for request correlation
- `withTraceId()` helper for automatic trace ID lifecycle
- Simple storage (module-level, can be upgraded to AsyncLocalStorage)

### 3. Performance Instrumentation (`instrumentation.ts`)

```typescript
export interface PerformanceInstrumentation {
  measureAsync<T>(operation: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T>;
  measureSync<T>(operation: string, fn: () => T, context?: Record<string, unknown>): T;
}
```

**Features**:
- Transparent operation timing (wraps functions)
- Automatic duration logging with operation name
- Error logging with duration even when operations fail
- Configurable slow operation threshold
- Minimal performance overhead (uses `performance.now()`)

### 4. Container Integration

The `ApplicationContainer` initializes and provides observability infrastructure:

```typescript
class ApplicationContainer {
  private logger: ILogger;
  private instrumentor: PerformanceInstrumentation;
  
  async initialize(databaseUrl: string): Promise<void> {
    this.logger = createLogger({ 
      service: 'concept-rag',
      environment: process.env.NODE_ENV || 'development'
    });
    this.instrumentor = createInstrumentor(this.logger);
    
    // Instrument key operations
    await this.instrumentor.measureAsync(
      'database_connection',
      async () => LanceDBConnection.connect(databaseUrl)
    );
    // ... more instrumentation
  }
  
  getLogger(): ILogger { return this.logger; }
  getInstrumentor(): PerformanceInstrumentation { return this.instrumentor; }
}
```

---

## Consequences

### Positive

1. **✅ Structured Observability**
   - JSON logs are machine-parseable (can be ingested by Grafana, Splunk, etc.)
   - Trace IDs enable request flow tracking across components
   - Contextual logging reduces debugging time

2. **✅ Performance Visibility**
   - Slow operations automatically flagged (>1s)
   - Database connection, table opening, and cache initialization are instrumented
   - Operation durations logged with microsecond precision

3. **✅ Zero Breaking Changes**
   - Existing console.error() calls preserved for user-facing output
   - Structured logs go to console.log() (separate stream)
   - Tools and services unchanged (observability is opt-in)

4. **✅ Lightweight Implementation**
   - No external dependencies (uses Node.js built-ins)
   - Minimal runtime overhead (<1ms per log entry)
   - Simple module-level storage (can be upgraded later)

5. **✅ Testable Design**
   - Logger interface enables mocking in tests
   - 38 unit tests verify correct behavior
   - Integration with container tested via existing suite

### Negative

1. **⚠️ Limited Trace Propagation**
   - Current implementation uses module-level storage (not async-safe across concurrent requests)
   - **Mitigation**: Document limitation; upgrade to AsyncLocalStorage if MCP server handles concurrent requests

2. **⚠️ Console-Only Output**
   - Logs only go to stdout/console.log
   - **Mitigation**: Structured JSON enables easy piping to log aggregators (e.g., `| pino-pretty`, `| bunyan`)

3. **⚠️ No Metrics Collection**
   - Deferred to Phase 1.2 (skipped per implementation matrix)
   - **Mitigation**: Logged operation durations can be parsed for metrics if needed

### Trade-offs

| Aspect | Choice | Alternative | Rationale |
|--------|--------|-------------|-----------|
| **Output Format** | JSON to console.log | Pino/Winston library | Avoid dependencies; JSON is parseable |
| **Trace Storage** | Module-level variable | AsyncLocalStorage | Simplicity; upgrade path exists |
| **Instrumentation** | Wrapper functions | Aspect-oriented programming | Explicit, testable, no magic |
| **Log Levels** | 4 levels (debug/info/warn/error) | More granular (trace, fatal) | Sufficient for current needs |

---

## Implementation Details

### File Structure

```
src/infrastructure/observability/
├── index.ts                    # Public API exports
├── logger.ts                   # Structured logger implementation
├── trace-id.ts                 # Trace ID generation and management
├── instrumentation.ts          # Performance instrumentation
└── __tests__/
    ├── logger.test.ts          # Logger unit tests (18 tests)
    ├── trace-id.test.ts        # Trace ID unit tests (10 tests)
    └── instrumentation.test.ts # Instrumentation unit tests (10 tests)
```

### Integration Points

1. **ApplicationContainer** (`src/application/container.ts`)
   - Initializes logger and instrumentor
   - Provides access via `getLogger()` and `getInstrumentor()`
   - Instruments key initialization operations

2. **Future Integration** (not yet implemented)
   - Domain services can request logger from container
   - Tools can use child loggers with request-specific context
   - Repositories can log query durations

### Usage Examples

#### Basic Logging

```typescript
const logger = createLogger({ service: 'concept-rag' });

logger.info('Processing search request', { query: 'microservices', limit: 10 });
// Output: {"level":"info","timestamp":"2025-11-23T10:12:27.123Z","message":"Processing search request","service":"concept-rag","query":"microservices","limit":10}

logger.error('Search failed', new Error('Database timeout'), { query: 'microservices' });
// Output: {"level":"error","timestamp":"2025-11-23T10:12:28.456Z","message":"Search failed","service":"concept-rag","query":"microservices","error":{"name":"Error","message":"Database timeout","stack":"..."}}
```

#### Child Loggers

```typescript
const requestLogger = logger.child({ requestId: 'abc-123', userId: 'user-1' });
requestLogger.info('Processing request');
// Output includes requestId and userId in every log entry
```

#### Performance Instrumentation

```typescript
const instrumentor = createInstrumentor(logger);

const results = await instrumentor.measureAsync(
  'hybrid_search',
  async () => searchService.search(query),
  { query, limit }
);
// Automatically logs duration: {"level":"info","operation":"hybrid_search","duration":123.45,"query":"...","limit":10}
```

---

## Alternatives Considered

### 1. **Pino** (High-performance logging library)

**Pros**:
- Very fast (20x faster than Winston)
- Child loggers with bindings
- Ecosystem of transports and formatters

**Cons**:
- External dependency (adds 500KB)
- Overkill for current needs
- Learning curve for configuration

**Decision**: Rejected. Custom implementation is sufficient and has zero dependencies.

### 2. **Winston** (Popular logging library)

**Pros**:
- Multiple transports (file, console, HTTP)
- Flexible configuration
- Wide adoption

**Cons**:
- Slower than Pino
- Heavy dependency chain
- More complex than needed

**Decision**: Rejected for same reasons as Pino.

### 3. **OpenTelemetry** (Observability standard)

**Pros**:
- Industry standard
- Comprehensive (metrics, traces, logs)
- Vendor-neutral

**Cons**:
- Heavy dependency (adds 2MB+)
- Complex setup and configuration
- Overkill for current scale

**Decision**: Deferred. Revisit if/when system scales to distributed deployment.

---

## Future Enhancements

### Phase 2: Advanced Observability (Deferred)

If system grows, consider:

1. **Metrics Collection** (Phase 1.2 - skipped)
   - Prometheus client library
   - Counters, histograms, gauges
   - `/metrics` endpoint

2. **Distributed Tracing** (Phase 1.2 - skipped)
   - OpenTelemetry or Jaeger integration
   - Span propagation across service boundaries
   - Trace visualization

3. **Health Checks** (Phase 1.3 - skipped)
   - `/health` endpoint with liveness/readiness
   - Component health checks (database, cache)

4. **Log Aggregation**
   - Ship logs to Grafana Loki or ELK stack
   - Structured query language for log analysis
   - Alerting on log patterns

5. **AsyncLocalStorage for Trace IDs**
   - Upgrade from module-level storage
   - Proper async context propagation
   - Safe for concurrent request handling

---

## Testing

### Coverage

- **38 unit tests** (100% coverage of observability module)
  - 18 tests for logger (levels, context, operations, child loggers)
  - 10 tests for trace IDs (generation, storage, withTraceId)
  - 10 tests for instrumentation (async/sync, errors, duration)

### Integration

- Integrated with `ApplicationContainer` initialization
- Instruments: database connection, table opening, cache initialization, shutdown
- All existing tests pass (no regressions)

---

## References

### Concept Lexicon

This ADR implements concepts from:

- **Observability** (§12)
  - Structured logging
  - Metrics collection (deferred)
  - Distributed tracing (deferred)

- **Performance Monitoring** (§6)
  - Profiling and benchmarking
  - Instrumentation
  - Performance measurement

- **Error Handling** (§9)
  - Logging and monitoring
  - Error context propagation

### Related Documentation

- **Integrated Roadmap**: `.ai/planning/2025-11-23-integrated-roadmap/03-observability-plan.md`
- **ADR-0034**: Comprehensive Error Handling
- **ADR-0035**: Test Suite Expansion
- **REFERENCES.md**: Observability patterns and practices

---

**Authors**: Concept-RAG Development Team  
**Reviewers**: Architecture Review Board  
**Approved**: 2025-11-23

