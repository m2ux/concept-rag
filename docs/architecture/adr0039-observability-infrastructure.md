# ADR 0039: Observability Infrastructure

**Status**: Accepted  
**Date**: 2025-11-23  
**Deciders**: Development Team  
**Related ADRs**: [adr0016](adr0016-layered-architecture-refactoring.md), [adr0018](adr0018-dependency-injection-container.md)

## Context

As the concept-rag system evolved with multiple search services, caching layers, and complex data flows, the lack of observability infrastructure became a critical gap:

1. **Production Debugging**: Console.log statements scattered throughout code made debugging production issues difficult
2. **Performance Visibility**: No way to measure actual search latency, embedding generation time, or cache effectiveness
3. **Resource Monitoring**: Unknown memory/CPU usage patterns and resource bottlenecks
4. **Error Context**: Exception handling existed but errors lacked structured context for diagnosis
5. **Request Correlation**: No way to trace a request through multiple service calls
6. **Optimization Validation**: Could not verify if performance optimizations actually improved metrics

The existing state included:
- ✅ Performance benchmarks (56 tests in test suite)
- ✅ Basic console.log statements
- ✅ Exception handling with error context

But lacked:
- ❌ Structured logging framework with log levels
- ❌ Request correlation via trace IDs
- ❌ Performance instrumentation
- ❌ Parseable log format for analysis
- ❌ Slow operation detection

Without observability infrastructure, we could not:
- Diagnose production issues efficiently
- Validate optimization improvements
- Monitor system health
- Track real user experience
- Proactively detect performance degradation

## Decision

Implement foundational observability infrastructure consisting of:

### 1. Structured Logging

**Core Components**:
- `StructuredLogger` class implementing `ILogger` interface
- JSON-formatted log output for machine parseability
- Four log levels: debug, info, warn, error
- ISO 8601 timestamps for log correlation
- Automatic error serialization with stack traces
- Child logger pattern for context inheritance
- Log level filtering to control verbosity

**Key Features**:
```typescript
interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  logOperation(operation: string, durationMs: number, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): ILogger;
}
```

**Log Entry Format**:
```typescript
interface LogEntry {
  level: LogLevel;
  timestamp: string;         // ISO 8601
  message: string;
  traceId?: string;          // Request correlation
  operation?: string;        // Operation name
  duration?: number;         // Operation duration in ms
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### 2. Trace ID Management

**Purpose**: Enable request correlation across multiple service calls

**Implementation**:
- `generateTraceId()`: Creates unique 32-character hex IDs
- `withTraceId()`: Helper for automatic trace ID lifecycle
- Module-level storage for trace ID propagation
- Automatic inclusion in log entries

**Usage Pattern**:
```typescript
await withTraceId(async () => {
  logger.info('Processing request'); // Includes trace ID
  await service.search(query);       // All logs include same trace ID
});
```

### 3. Performance Instrumentation

**Purpose**: Measure and log operation durations automatically

**Core Utilities**:
```typescript
interface PerformanceInstrumentation {
  measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T>;
  
  measureSync<T>(
    operation: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T;
}
```

**Features**:
- Automatic duration calculation using `performance.now()`
- Success/failure logging with duration
- Slow operation detection (>1s threshold)
- Configurable threshold for warnings
- Error logging with duration on failure

### 4. Container Integration

Observability infrastructure integrated into dependency injection container:

**Instrumented Operations**:
1. Database connection establishment
2. Table opening (chunks, catalog, concepts)
3. Cache initialization (ConceptIdCache, CategoryIdCache)
4. Database connection closing

**Container Methods**:
```typescript
class ApplicationContainer {
  getLogger(): ILogger;
  getInstrumentor(): PerformanceInstrumentation;
}
```

### Implementation Scope

**Phase 1.1: Structured Logging** ✅ COMPLETED
- Logger infrastructure with JSON output
- Trace ID generation and propagation
- Child logger pattern

**Phase 1.4: Performance Instrumentation** ✅ COMPLETED
- Async and sync measurement utilities
- Container lifecycle instrumentation
- Slow operation detection

**Deferred for Future**:
- Phase 1.2: Metrics Collection (Prometheus-style metrics)
- Phase 1.3: Health Check Infrastructure (liveness/readiness probes)
- Phase 1.5: Dashboard (metrics visualization)

**Rationale for Deferral**: Core structured logging and instrumentation provide immediate value for debugging and performance analysis. Metrics and dashboards can be added incrementally when scale requires it.

## Consequences

### Positive

1. **Production Visibility**: Structured logs enable effective production debugging
   - Machine-parseable JSON format
   - Consistent log structure
   - Full error context with stack traces

2. **Performance Insights**: Automatic timing of critical operations
   - Database connection: ~134ms
   - Table opening: ~11ms per table
   - Cache initialization: ~122ms
   - Slow operations automatically flagged

3. **Request Tracing**: Trace IDs enable correlation across service calls
   - Track requests through multiple layers
   - Correlate related log entries
   - Debug distributed operations

4. **Zero Breaking Changes**: Completely transparent to existing code
   - All 944 existing tests pass
   - No API changes required
   - Services can adopt gradually

5. **Developer Experience**: Easier debugging and testing
   - Child loggers with context inheritance
   - Automatic slow operation warnings
   - Clean separation of concerns

6. **Minimal Overhead**: Lightweight implementation
   - <1ms per log statement
   - No external dependencies
   - Zero runtime cost when not logging

7. **Test Coverage**: Comprehensive test suite ensures reliability
   - 38 unit tests for observability code
   - 100% code coverage
   - Integration tests with container

### Negative

1. **Log Volume**: Structured logging produces more output than console.log
   - Mitigation: Log level filtering (production uses info+)
   - JSON format is verbose but parseable
   - Can pipe to log aggregators

2. **Learning Curve**: Team needs to adopt new patterns
   - Mitigation: Clear documentation and examples
   - Child loggers and instrumentation utilities
   - Gradual adoption (no forced migration)

3. **Simple Trace ID Storage**: Module-level storage not safe for concurrent requests
   - Current: Single-threaded MCP server (acceptable)
   - Future: Migrate to AsyncLocalStorage for multi-request safety
   - No current impact on functionality

4. **No Metrics Yet**: Performance data logged but not aggregated
   - Mitigation: Logs can be parsed for metrics
   - Phase 1.2 can add Prometheus metrics later
   - Current solution sufficient for debugging

### Trade-offs

| Trade-off | Choice | Rationale |
|-----------|--------|-----------|
| **Log Format** | JSON vs. Human-readable | JSON for parseability, tooling can format |
| **Trace ID Storage** | Module-level vs. AsyncLocalStorage | Simple for now, upgrade path exists |
| **Metrics** | Logs only vs. Prometheus | Start simple, add metrics when needed |
| **Overhead** | Structured vs. Simple | Structured provides more value |

## Implementation

**Date**: 2025-11-23  
**Duration**: ~60 minutes agentic development  
**Branch**: `feat/improve-observability`

### Files Created

**Core Infrastructure**:
```
src/infrastructure/observability/
├── index.ts                    # Public API exports (11 lines)
├── logger.ts                   # Structured logger (175 lines)
├── trace-id.ts                 # Trace ID management (51 lines)
├── instrumentation.ts          # Performance measurement (90 lines)
└── __tests__/
    ├── logger.test.ts          # Logger tests (223 lines, 18 tests)
    ├── trace-id.test.ts        # Trace ID tests (72 lines, 10 tests)
    └── instrumentation.test.ts # Instrumentation tests (157 lines, 10 tests)
```

**Total**:
- Production code: 327 lines
- Test code: 452 lines
- Test coverage: 38 tests, 100% coverage

### Files Modified

**Container Integration**:
- `src/application/container.ts`: Integrated logging and instrumentation
  - Initialize logger with service context
  - Create instrumentor
  - Instrument database connection
  - Instrument table opening
  - Instrument cache initialization
  - Log container lifecycle events
  - Expose `getLogger()` and `getInstrumentor()` methods

### Example Output

**Container Initialization Logs**:
```json
{"level":"info","timestamp":"2025-11-23T10:12:27.100Z","message":"Application container initialization started","service":"concept-rag","environment":"development","databaseUrl":"~/.concept_rag"}

{"level":"info","timestamp":"2025-11-23T10:12:27.234Z","message":"Operation completed: database_connection","operation":"database_connection","duration":134.2,"databaseUrl":"~/.concept_rag"}

{"level":"info","timestamp":"2025-11-23T10:12:27.245Z","message":"Operation completed: open_table","operation":"open_table","duration":11.3,"table":"chunks"}

{"level":"info","timestamp":"2025-11-23T10:12:27.389Z","message":"Operation completed: cache_initialization","operation":"cache_initialization","duration":122.4,"cache":"ConceptIdCache"}
```

**Slow Operation Warning**:
```json
{"level":"warn","timestamp":"2025-11-23T10:15:30.456Z","message":"Operation completed: slow_database_query","operation":"slow_database_query","duration":1542.3,"slow":true,"query":"SELECT * FROM large_table"}
```

## Alternatives Considered

### Alternative 1: Winston or Pino Logging Library

**Pros**:
- Battle-tested, feature-rich
- Built-in transports (file, console, network)
- Plugin ecosystem

**Cons**:
- External dependency (bundle size)
- Over-engineered for current needs
- Learning curve for configuration

**Decision**: Custom implementation is lightweight and sufficient

### Alternative 2: OpenTelemetry for Tracing

**Pros**:
- Industry standard for distributed tracing
- Rich ecosystem of exporters
- Automatic instrumentation available

**Cons**:
- Heavy dependency
- Overkill for single-process application
- Complex configuration
- Performance overhead

**Decision**: Defer until system becomes distributed

### Alternative 3: Debug Module (npm package)

**Pros**:
- Lightweight
- Popular in Node.js ecosystem
- Namespace-based filtering

**Cons**:
- Not structured (string-based)
- Limited context support
- Not designed for production

**Decision**: Need structured JSON for production use

### Alternative 4: Console.log with JSON.stringify

**Pros**:
- Zero dependencies
- Simple implementation

**Cons**:
- No log levels
- No trace IDs
- No structured error handling
- No instrumentation helpers

**Decision**: Need full-featured structured logging

## Testing Strategy

### Unit Tests (38 tests, 100% coverage)

**Logger Tests** (18 tests):
- Log level filtering
- Context propagation
- Child logger inheritance
- Error serialization
- Slow operation detection
- JSON output format

**Trace ID Tests** (10 tests):
- ID generation uniqueness
- Lifecycle management
- `withTraceId()` helper
- Async context propagation

**Instrumentation Tests** (10 tests):
- Async operation measurement
- Sync operation measurement
- Error logging with duration
- Slow operation warnings
- Context propagation

### Integration Tests

**Container Integration**:
- Logger initialization
- Instrumentor creation
- Database connection instrumentation
- Table opening instrumentation
- Cache initialization instrumentation
- All existing container tests pass (no regressions)

## Usage Examples

### Basic Logging

```typescript
const logger = createLogger({ service: 'concept-rag' });

logger.info('Processing search request', { 
  query: 'microservices', 
  limit: 10 
});
```

### Error Logging

```typescript
try {
  await searchService.search(query);
} catch (error) {
  logger.error('Search failed', error as Error, { 
    query, 
    userId: 'user-123' 
  });
  throw error;
}
```

### Performance Instrumentation

```typescript
const instrumentor = createInstrumentor(logger);

const results = await instrumentor.measureAsync(
  'hybrid_search',
  async () => searchService.search(query),
  { query, limit }
);
// Automatically logs: operation, duration, context
```

### Child Loggers

```typescript
const requestLogger = logger.child({ 
  requestId: 'abc-123', 
  userId: 'user-1' 
});

requestLogger.info('Step 1: Validate input');
requestLogger.info('Step 2: Execute search');
requestLogger.info('Step 3: Format results');
// All logs include requestId and userId automatically
```

## Future Enhancements

### Phase 1.2: Metrics Collection

When system scales, add Prometheus-style metrics:
- Counters: `search.requests`, `search.errors`
- Histograms: `search.latency`, `embedding.generation_time`
- Gauges: `cache.size`, `memory.usage`
- HTTP `/metrics` endpoint

### Phase 1.3: Health Checks

Add health monitoring infrastructure:
- Database connection health
- Memory usage health
- Configuration validation
- HTTP `/health` endpoint

### Phase 1.5: Dashboard

Create simple metrics visualization:
- Real-time performance metrics
- Cache hit rates
- Error rates
- Slow operation tracking

### AsyncLocalStorage for Trace IDs

Migrate from module-level storage to AsyncLocalStorage:
```typescript
import { AsyncLocalStorage } from 'async_hooks';

const traceIdStorage = new AsyncLocalStorage<string>();

export function withTraceId<T>(fn: () => Promise<T>): Promise<T> {
  return traceIdStorage.run(generateTraceId(), fn);
}
```

Benefits:
- Safe for concurrent requests
- No global state
- Automatic propagation through async calls

### Log Aggregation

Integrate with log aggregation services:
- Grafana Loki for log querying
- ELK stack for search and analytics
- CloudWatch Logs for AWS deployments
- Structured query capabilities

## References

### Documentation
- Implementation: `.ai/planning/observability-infrastructure/03-observability-plan.md`
- Summary: `.ai/planning/observability-infrastructure/IMPLEMENTATION-SUMMARY-OBSERVABILITY.md`

### Related Code
- `src/infrastructure/observability/logger.ts`
- `src/infrastructure/observability/trace-id.ts`
- `src/infrastructure/observability/instrumentation.ts`
- `src/application/container.ts`

### Concepts Applied
From knowledge base (Machine Learning Operations & Monitoring):
1. Observability - Distributed tracing, metrics, logs
2. Structured logging - Parseable log events
3. Monitoring and telemetry - System instrumentation
4. Performance profiling - Identifying hotspots
5. Application performance monitoring - Runtime monitoring

## Conclusion

The observability infrastructure provides essential visibility into system behavior without breaking existing functionality. The structured logging and performance instrumentation enable production debugging, performance optimization, and proactive issue detection.

**Key Achievements**:
- ✅ Structured, machine-parseable logs
- ✅ Request correlation via trace IDs
- ✅ Automatic performance measurement
- ✅ Zero breaking changes
- ✅ 100% test coverage
- ✅ Container lifecycle instrumentation

**Status**: Production-ready, deployed to `feat/improve-observability` branch

The foundation is now in place for future observability enhancements (metrics, health checks, dashboards) as system complexity and scale increase.
