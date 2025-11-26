# Concept Lexicon

## Executive Summary

This document catalogs concepts from the knowledge base that are directly applicable to the project.

### Category Selection Process

Categories were determined by **analyzing the project's actual codebase** and mapping each component to relevant knowledge base categories:

| Project Component | Codebase Evidence | Selected Category |
|-------------------|-------------------|-------------------|
| TypeScript language | All `*.ts` files, `package.json` | programming languages |
| Type system patterns | `domain/functional/` (Result, Either, Option) | type systems |
| Vector database | `infrastructure/lancedb/`, LanceDB dependency | database systems |
| Search & retrieval | `infrastructure/search/`, `concepts/query_expander.ts` | information retrieval |
| Layered architecture | `domain/`, `infrastructure/`, `application/`, `tools/` | software architecture |
| Design patterns | Factory, Repository, Circuit Breaker implementations | object-oriented design |
| Test suite | `__tests__/` directories, Vitest, fast-check | software testing |
| Resilience patterns | `infrastructure/resilience/` (circuit-breaker, bulkhead) | devops and site reliability |
| General practices | Throughout codebase | software engineering |

### Source Categories

| Category | Documents | Concepts | Project Mapping |
|----------|-----------|----------|-----------------|
| software engineering | 139 | 18,394 | General practices |
| software architecture | 48 | 8,941 | Layered architecture, DI |
| database systems | 16 | 3,247 | LanceDB, vector storage |
| software testing | 13 | 2,318 | Vitest, property-based testing |
| devops and site reliability | 9 | 1,547 | Resilience patterns, CI |
| object-oriented design | 6 | 1,619 | Factory, Repository patterns |
| information retrieval | 5 | 2,147 | Hybrid search, ranking |
| programming languages | 26 | 4,299 | TypeScript patterns |
| type systems | 4 | 678 | Functional types (Result/Either) |


Concepts were retrieved using `list_concepts_in_category` for each selected category, sorted by document count to prioritize widely-discussed concepts.

**Source Reference System**: Numbers in brackets (e.g., `[1,5,7]`) reference the numbered source list at the end of this document. Sources were verified using `concept_sources` to confirm they contributed the referenced concept.

---

## 1. Software Architecture & Design Patterns

### Core Architecture Concepts
- **Modular software architecture** [115,116] - Layered architecture with clear separation of concerns
- **Dependency injection** [1,2,5,7,18,21,51,87,98] - Container-based DI pattern for loose coupling
- **Constructor injection** [2,51,54] - Injecting dependencies via constructor
- **Repository pattern** [2,10,37,40] - Data access layer abstraction for database operations
- **Service layer** - Domain services encapsulate business logic
- **Factory pattern** [5,10,29,32,54] - Object creation patterns for complex instantiation
- **Domain model** [5,10,29,46,47,67] - Rich domain objects with behavior
- **Domain-driven design** [5,8,10,11,14,19,40,67] - Domain models, bounded contexts, and ubiquitous language
- **Layered architecture** [3,5,10,19,22,23] - Clear separation: domain, infrastructure, application, tools
- **Interface definition** [26,41,55] - Type definitions and contracts between layers
- **API design** [5,10,14,38,91,95] - MCP tool interfaces and versioning considerations
- **Separation of concerns** [3,5,6,10,17,28,32,34,41,42,49,74,79] - Clean boundaries between modules
- **Component-based design** [17,42] - Modular, composable architecture units
- **Componentization** [1,49,74] - Breaking systems into independent components
- **Architectural characteristics** [20,21] - The "-ilities" (scalability, reliability, performance, etc.)
- **Architecture decision records (ADRs)** [19,40] - Documenting architectural decisions and rationale
- **Screaming architecture** - Domain-centric design where architecture reveals intent
- **Ports and adapters** - Hexagonal architecture for testability
- **Modular monolith** [5,8,11,14,16,19,22] - Monolith with clear module boundaries
- **Clean architecture** [5,17,61] - Dependency rule and policy vs. details separation
- **Evolutionary architecture** [12,19,22,40,46,57] - Architecture that supports guided incremental change
- **Bounded context** [5,8,11,12,14,16,19,20,21,22,40,67] - Domain partitioning with explicit boundaries

### Design Patterns
- **Design patterns** [3,5,10,22,28,29,32,42,46,47,54,55,66,73,75] - Proven solutions to recurring problems
- **Strategy pattern** [10,28,29,46,47,54] - Algorithm selection (e.g., different search strategies)
- **Adapter pattern** [5,10,28,29,34,46,47,54] - Document loader abstractions for different file types
- **Decorator pattern** [5,10,28,54] - Enhancing search results with additional metadata
- **Observer pattern** [5,10,28,29,46,54,59] - Event-driven architectures for index updates
- **Singleton pattern** [5,28,29,46,47,54] - Cache and database connection management
- **Template method pattern** [5,10,28,29,46,47,54] - Common workflows with customizable steps
- **Context object pattern** [64] - Avoiding pass-through variables
- **Factory method pattern** [28,29,34,46,47] - Object creation abstraction
- **Abstract factory** [7,28,29,32,34,46,47,54] - Families of related objects
- **Proxy pattern** [28,29,34,42,46,47,87] - Controlling access to objects
- **Façade pattern** [10,28,30,32,46,47] - Simplified interface to complex subsystem
- **Composite pattern** [28,29,34,46,47,54] - Tree structures of objects
- **Mediator pattern** [5,28] - Reducing coupling between components
- **Command pattern** [28,29,46,47,54,72] - Encapsulating requests as objects
- **State pattern** [28,29,46,47,54,72] - State-dependent behavior
- **Builder pattern** [42,72] - Step-by-step object construction
- **Chain of responsibility** [10,28,47] - Passing requests along a handler chain
- **Humble object pattern** - Separating testable from hard-to-test code
- **Strangler pattern** [2,12,19,22] - Incremental migration from legacy systems
- **Value object** [2,10,37,40,67] - Immutable objects defined by value
- **Data transfer object (DTO)** - Simple data containers

### Architectural Principles
- **Functional decomposition** [10,34,43,55,72,75,86,93,96] - Breaking complex operations into smaller units
- **Inversion of control** - Dependency inversion principle application
- **Object-oriented design** [3,29,32,42,74] - Class hierarchies and polymorphism
- **Modular decomposition** [3,52] - Library and module organization
- **Interface specification** [26,41,49,74] - Clear contracts between components
- **Design for debugging** [115] - Structured logging and error tracing
- **Complexity management** [3,5,6,10,11,14,19,20,21,22,47,64,71,88] - Strategic programming vs tactical programming
- **Deep modules** [64] - Modules with simple interfaces and rich functionality
- **Information hiding** [3,6,41,47,52,54] - Encapsulating implementation details
- **Abstraction** [6,10,14,21,31,32,42,43,45,52,61,67,69,70,71,73,76] - Hiding complexity behind simple interfaces
- **Cohesion** [5,8,12,19,20,21,34,52,53,67] - How strongly related module elements are
- **Coupling** [3,5,6,8,10,11,14,16,50,52] - Degree of interdependence between modules
- **Strategic programming** [64] - Investing in design quality for long-term maintainability
- **Tactical programming** [64] - Short-term implementation focus (anti-pattern)
- **Design it twice** [64] - Exploring multiple design alternatives
- **Pull complexity downward** [64] - Moving complexity away from users/callers
- **Define errors out of existence** [64] - Designing APIs to eliminate error cases
- **Obvious code principle** [64] - Code should be self-explanatory
- **Defensive programming** [6,52,61,70,93] - Anticipating failures and edge cases
- **SOLID principles** [3,5,21,22,61] - Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **Liskov substitution principle** [3,21,34,47,52,54] - Subtypes must be substitutable for base types
- **Dependency inversion principle** [5,17,21,32,54] - Depend on abstractions, not concretions
- **DRY principle** - Don't Repeat Yourself
- **YAGNI** - You Aren't Gonna Need It (avoid speculative generality)
- **KISS** - Keep It Simple, Stupid
- **Law of Demeter** [5] - Principle of least knowledge
- **Acyclic dependencies principle** [17,47] - Avoid circular dependencies
- **Stable dependencies principle** [17,81] - Depend on stable components
- **Stable abstractions principle** [17,81] - Abstract components should be stable
- **Package by component** [17] - Organization around business capabilities
- **Package by feature** [17] - Domain-centric organization

### Architectural Styles
- **Service-based architecture** [11,14,16,19,22] - Services with shared database
- **Event-driven architecture** [5,8,12,14,19,22,23,54,56,67,72,77,80,82,99] - Asynchronous event-based communication
- **Microkernel architecture** [11,14,16,19,22] - Plugin-based extensible core
- **Pipeline architecture** - Pipes and filters for data flow
- **Layered architecture** [3,5,10,19,22] - Organized in horizontal layers
- **Hexagonal architecture** [5,14,52] - Ports and adapters pattern
- **Ports and adapters (hexagonal) architecture** - Decoupling core from infrastructure
- **Onion architecture** [5] - Dependency inversion in concentric layers
- **Vertical slice architecture** - Feature-based organization
- **Client-server architecture** [3,33,84] - Request-response patterns
- **Command-query responsibility segregation (CQRS)** - Separating reads from writes
- **Command-query separation (CQS)** [10,40] - Methods should be commands or queries

---

## 2. Testing & Verification

### Testing Strategies
- **Unit testing** [1,2,3,4,6,10,12,21,23,24,26,29,33,36,37,38,39,40,41,43,44,49,51,53,55,56,57,59,61,62,65,68,70,71,72,73,83,85,87] - Component-level tests (project uses Vitest)
- **Integration testing** [1,2,3,10,23,26,29,33,38,41,43,44,49,55,56,57,59,61,65,70,71,72,83,85] - Testing component interactions
- **System testing** [3,26,41,44,55,57] - End-to-end workflow validation
- **Acceptance testing** [1,10,23,29,47,51,55] - Validating against user requirements
- **Test automation** [1,3,12,38,49,56,57,73,75,83] - Automated test suites
- **Regression testing** [1,6,26,37,41,44,49,55,57,59,89] - Preventing regressions during refactoring
- **Test case design** [3,56,70,91] - Systematic test coverage
- **Test-driven development (TDD)** [1,2,3,6,10,21,51,53,62,65] - Write tests before implementation
- **Behavior-driven development (BDD)** [1,5] - Specification through examples
- **Performance testing** [1,12,26,30,44,56,83] - Search performance benchmarks
- **Load testing** [12,44,56,83] - System behavior under load
- **Contract testing** [8,12,14,16,30,40] - API contract validation between layers
- **Property-based testing** [2,59,65,78] - Testing general properties with generated inputs
- **Smoke testing** [1,2,6,24,44] - Basic functionality verification
- **Consumer-driven contracts** [8,10,11,14,16,19,22] - Testing interface compatibility
- **Test isolation** [1,2,37,50,57] - Keeping tests independent
- **A/B testing** [2,12,24,30,66] - Comparing variations in production
- **Exploratory testing** [1,24,44,57,65] - Unscripted manual testing
- **Scalability testing** [1,88] - Testing behavior under scale

### Verification Techniques
- **Design verification** [56,75,89] - Ensuring requirements are met
- **Code review** [49] - Peer review practices
- **Structured walkthroughs** - Team review sessions
- **Test coverage measurement** [1,3,12,26,30,37,44,49,57,65,85] - Statement and branch coverage
- **Branch coverage** [3,6] - Exercising all decision branches
- **Statement coverage** [3,6,56] - Executing all statements
- **Design for testability** [10,21,34,51,59] - Architecture that facilitates testing
- **Test harness** [1,6,44,60] - Testing infrastructure and fixtures
- **Test fixtures** [1,21,51] - Setup and teardown for tests
- **Test doubles** [1,12,51] - Mocks, stubs, spies, fakes
- **Mocks and stubs** [1,51] - Substitutes for dependencies
- **Functional testing (black-box)** - Testing against specifications
- **Structural testing (white-box)** - Internal structure testing
- **Assertions** [3,6,15,34] - Runtime correctness checks
- **Preconditions** [34,42,86,92] - Contract-based verification
- **Postconditions** [34,42,86] - Contract-based verification
- **Invariants** [34,59,67,86] - Properties that always hold
- **Test automation pyramid** [1,61] - More unit tests than integration tests
- **Arrange-Act-Assert (AAA)** - Test structure pattern
- **Red-green-refactor** [21] - TDD cycle

### Quality Assurance
- **Software quality assurance** [56] - Systematic quality activities
- **Risk reduction** [21] - Identifying and mitigating technical risks
- **Risk management** [1,26,34,39,40,49,55,56,65,70,73,75,85,86,94] - Identifying and mitigating risks
- **Cost of defects** [6] - Early detection and correction
- **Static code analysis** [1,69,82] - Linting and type checking (TypeScript)
- **Static analysis** [3,12,37,41,45,69,82,91] - Code inspection without execution
- **Dynamic analysis** [3,41,91] - Runtime behavior analysis
- **Defect tracking** [3,49] - Systematic issue management
- **Defect prevention** [3,21,89] - Proactive quality measures
- **Code metrics** [3] - Quantitative quality measures
- **Cyclomatic complexity** [3,5,10,11,14,47,77,96] - Measuring code complexity
- **Code coverage** [3,12,44,85] - Test effectiveness measurement
- **Test coverage** [1,3,12,26,30,37,44,49,57,65,85] - Percentage of code exercised by tests
- **Quality attributes** [26,29,46,52] - Understandability, changeability, extensibility, reusability, testability, reliability
- **Maintainability** [3,5,6,10,11,14,16,19,22,28,31,43,45,50,51,60,73,76,97] - Ease of modification
- **Readability** [6,52,60,69,86] - Ease of understanding code
- **Testability** [3,5,19,22,52,60,73,97] - Ease of testing
- **Reliability** [3,16,42,43,52,56] - Consistent correct operation
- **Extensibility** [10,16,28,42,76,84] - Ease of adding new functionality
- **Reusability** [42,52,70,73,82] - Applicability in multiple contexts
- **Egoless programming** [3,6] - Separating ego from code ownership
- **Collective code ownership** [2,3,8,40,51,61,63] - Team responsibility for quality

---

## 3. Database & Search Systems

### Database Concepts
- **Vector databases** [68,79] - LanceDB for embedding storage
- **Relational databases** [10,20] - Structured data with ACID properties
- **Indexing** [15,31,43,62,69,72,74] - Efficient data retrieval strategies
- **B-tree indexes** - Ordered data access
- **Search algorithms** - Hybrid search (vector + BM25 + concept scoring)
- **Data structures** [10] - Optimized storage and retrieval
- **Caching** [8,84] - Performance optimization via caching layers
- **Query optimization** [15,62,69,72,79] - Efficient query execution
- **Schema design** [15,58,62,69,81,97] - Table structure and relationships
- **Normalization** [15,50,62,69] - Reducing redundancy and anomalies
- **Denormalization** [15,31,43,50] - Trading redundancy for performance
- **Database systems** [15,62,75] - CRUD operations and transactions
- **Primary keys** [15,69] - Unique row identifiers
- **Foreign keys** [15,50,69] - Referential integrity constraints
- **Views** [15,70] - Virtual tables
- **Data integrity** [15,16,19,34,75,85,93] - Field-level, table-level, relationship-level
- **Referential integrity** [15,34,50,62,69,97] - Foreign key constraints
- **Entity integrity** - Primary key constraints

### Database Reliability
- **Backup and recovery** [25,34] - Data protection strategies
- **High availability** [15,20,65,78] - Minimizing downtime
- **Data durability** [25] - Preventing data loss
- **Schema change automation** [25] - Safe, automated migrations
- **Database migration** [1] - Schema evolution scripts
- **Connection pooling** [15,25,29] - Reusing database connections
- **Query instrumentation** [25] - Monitoring query performance
- **Slow-query logging** [25] - Identifying performance issues
- **Caching** [8,84] - Storing frequently accessed data in memory

### Search & Retrieval
- **Semantic search** [10,61,66,68,79] - Vector similarity search
- **Vector embeddings** - Text-to-vector transformations
- **Text embeddings** - Semantic vector representations
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** [61,79] - Context-aware representations
- **Embedding normalization** - Vector normalization techniques
- **Full-text search** [10] - BM25 keyword matching
- **Inverted index** [10,61,72] - Efficient text search structure
- **TF-IDF** [61] - Term importance weighting
- **BM25** - Probabilistic ranking function
- **Hybrid search** - Combining multiple ranking signals
- **Dense retrieval** - Vector-based semantic retrieval
- **Sparse retrieval** - Keyword-based retrieval (BM25, TF-IDF)
- **Ranking algorithms** [61] - Score combination and normalization
- **Query expansion** [66] - WordNet-based synonym expansion
- **Concept extraction** - NLP-based concept identification
- **Fuzzy matching** - Approximate string matching
- **Retrieval-augmented generation (RAG)** - Context-aware generation with retrieval
- **Approximate nearest neighbor (ANN) search** [79] - Efficient vector similarity search
- **Similarity measures** [79] - Cosine similarity, Euclidean distance, dot-product
- **Dynamic indexing** - Real-time index updates
- **Incremental indexing** - Adding documents without full rebuild
- **Re-ranking and rescoring** - Post-retrieval result refinement
- **Evaluation metrics** [61] - Precision@k, Recall@k, NDCG, MRR
- **Source attribution** - Tracking document provenance
- **Context window management** [68,79] - Handling token limits

### Data Management
- **Data locality** [15,31,43,56] - Optimizing data placement for performance
- **Partitioning** [15,31,43,46,56,72,81] - Horizontal data distribution
- **Consistent hashing** [15,31,43,56,75] - Stable key distribution
- **Data integrity** [15,16,19,34,75,85,93] - Validation and constraints
- **Schema evolution** [8,12,14,31] - Versioning and migrations
- **Data lineage** [11,14] - Tracking data origins and transformations
- **Data provenance** [80,91] - Understanding data history
- **Access control** [20,70] - Managing document access

---

## 4. TypeScript & Type Systems

### TypeScript Language Features
- **Type safety** [7,45] - Static type checking for JavaScript
- **Gradual typing** [7,45] - Incremental adoption of types
- **Static typing** [7,23,32,45] - Compile-time type checking
- **Type inference** [7,23,32,45,60] - Automatic type deduction
- **Structural typing** [5,7,45] - Type compatibility based on structure
- **Type narrowing** [7,32,45] - Refining types through control flow
- **Control-flow-based type analysis** [7] - Type refinement through code flow
- **Type guards** [5,7,23,32,45] - Runtime type checking functions
- **User-defined type guards** - Custom type predicate functions
- **Union types** [5,7,23,45] - Types that can be one of several types
- **Intersection types** [5,7,45] - Types that combine multiple types
- **Discriminated unions** [7] - Tagged union types for type safety
- **Generics** [5,7,23,76] - Parametric polymorphism
- **Bounded polymorphism** [7] - Generic constraints with `extends`
- **Generic type inference** [7,32] - Automatic type argument deduction
- **Conditional types** [7,23,32,45] - Types that depend on other types
- **Mapped types** [7,23,32,45] - Transforming types programmatically
- **Index signatures** [7,23,32,45] - Dynamic property access
- **Template literal types** - String literal type manipulation
- **Type aliases** [5,7,23,32,45,60] - Named type definitions
- **Type assertions** [5,7] - Explicit type casting
- **Non-null assertion operator (!)** [7,32] - Asserting non-null values
- **Const assertions (as const)** - Narrow literal types
- **Literal types** [7] - String, number, boolean literals
- **Primitive types** - number, string, boolean, null, undefined, symbol, bigint
- **unknown type** [7,23,32] - Type-safe alternative to any
- **never type** [7,23,32] - Type for unreachable code
- **void type** [5] - Absence of return value
- **Record type** [7] - Key-value object types
- **Tuple types** [7,32] - Fixed-length arrays with typed elements
- **Readonly arrays** - Immutable arrays
- **Readonly properties** [7,23,32] - Immutable object properties
- **Function call signatures** [7] - Function type definitions
- **Overloaded function signatures** [7] - Multiple function signatures
- **Contextual typing** [7,45] - Type inference from context
- **Excess property checking** [7,45] - Strict object literal checking

### Type System Concepts
- **Variance** [75] - Covariance, contravariance, invariance
- **Covariance** - Subtype in output position
- **Contravariance** - Supertype in input position
- **Subtyping** - Type compatibility relationships
- **Assignability rules** [7] - When types are compatible
- **Type widening** [7,45] - Automatic type generalization
- **Type erasure** - Types removed at runtime
- **Type branding** - Simulating nominal types in structural systems
- **Definite assignment** - Ensuring variables are initialized
- **Exhaustiveness checking** [7,60] - Ensuring all cases are handled

### TypeScript-Specific Patterns
- **Declaration merging** [7] - Combining multiple declarations
- **Interface merging** [7] - Multiple interface declarations merged
- **Module augmentation** [7] - Extending existing modules
- **Ambient declarations** [7] - Type-only declarations for JavaScript
- **Declaration files (.d.ts)** - Type definitions for libraries
- **@types packages** - Type definitions on npm
- **Project references** [7] - Multi-project TypeScript setups
- **Incremental compilation** [7,76] - Faster rebuilds

### Type-Driven Development
- **Type-driven design** [60,76,83,85] - Using types to guide design
- **Type-driven development** [7,60,69,76] - Development led by type definitions
- **Type-safe APIs** - APIs with compile-time guarantees
- **Schema-driven APIs** - APIs defined by schemas (JSON Schema)
- **Client-server type contract** [7] - Shared types across boundaries
- **Pattern matching** [10,60,69,81,85] - Destructuring and control flow based on structure
- **Error handling with Result** [60,76,83,85] - Type-safe error handling
- **Custom error types** [72,85] - Domain-specific error hierarchies
- **Newtype pattern** [60,78,83,85] - Wrapping types for type safety

### TypeScript Compiler & Tooling
- **TypeScript compiler (tsc)** - Compiling TS to JS
- **tsconfig.json** [7,23] - TypeScript configuration
- **Compiler options** [7,23] - Strict mode, module system, target
- **Strict type checking** [7,32] - Enabling all strict flags
- **noImplicitAny** [5,7,23] - Requiring explicit any annotations
- **strictNullChecks** [7,23,32,45] - Null and undefined handling
- **Source maps** [7] - Debugging support
- **Module resolution** [7,23,32] - How modules are found
- **Module formats** - CommonJS, ES2015
- **ESModule interop** - CommonJS/ES module compatibility
- **Language services (tsserver)** - Editor integration
- **Editor integration** - VSCode/IntelliSense support

---

## 5. Reliability & Resilience

> **Note:** This project is a local TypeScript/Node.js application, not a distributed system. This section focuses on reliability patterns applicable to single-node applications with external dependencies (LLM APIs, database).

### Caching Strategies
- **Caching strategies** [6,12,20,40,68,71,82] - Multi-level caching for performance
- **In-memory caching** [20] - RAM-based storage (embeddings, search results)
- **Cache-aside pattern** - Lazy-loading cache on demand
- **Cache eviction policies** [2,68] - LRU, TTL-based expiration
- **Request coalescing** [2,56] - Batching concurrent identical requests
- **Memoization** [10,68] - Caching function results

### Fault Tolerance for External Services
- **Circuit breaker pattern** [2,8,12,14,29,56] - Preventing cascade failures to LLM APIs
- **Open/closed/half-open states** - Circuit breaker state machine
- **Retry semantics** [20] - Handling transient failures
- **Exponential backoff** [29,98] - Randomized progressive retry delays
- **Idempotence** [14,31,43,56] - Safe retry of operations
- **Timeout handling** [14] - Detecting unresponsive services
- **Graceful degradation** [14,58,68,93] - Fallback behavior when services unavailable

### Data Consistency
- **Transactions** [15,43,56,75,81,87,99] - ACID properties for database operations
- **ACID properties** [15,16,31,43,56,75,99] - Atomicity, Consistency, Isolation, Durability
- **Optimistic concurrency control** [10,15,31,43,56,62,75] - Validate at commit time
- **Write-ahead log (WAL)** [31,43] - Durability via logging (LanceDB)
- **Event sourcing** [5,8,12,14,17,22,40,52] - Event log as source of truth (optional pattern)

### Health & Monitoring
- **Health checks** [12,14,29] - System status monitoring
- **Health endpoints** - Status API for monitoring
- **Structured logging** [29,58,65,78,83] - Parseable log events for debugging

### Communication Patterns
- **Synchronous communication** [10,14,20,91] - Request-response to LLM APIs
- **Asynchronous communication** [10,11,14,16,19,22] - Non-blocking I/O (Node.js async/await)
- **Back pressure** [19] - Flow control in streams

---

## 6. Performance & Optimization

### Optimization Techniques
- **Performance optimization** [10,68,76,83,85,97] - Systematic improvement
- **Performance engineering** [31,40,43,66,96] - Systematic performance design
- **Profiling** - Identifying performance hotspots
- **Benchmarking** [10,34,72,75,95] - Performance measurement and comparison
- **Caching** [8,84] - Reducing redundant computation
- **Lazy evaluation** - Deferred computation
- **Memoization** [10,68] - Result caching
- **Batching** - Reducing operation overhead
- **Streaming** - Processing large datasets incrementally
- **Parallel processing** - Concurrent execution

### Resource Management
- **Memory management** [68] - Heap and garbage collection awareness
- **Connection pooling** [15,25,29] - Reusing expensive connections
- **Throttling and rate limiting** - Preventing resource exhaustion
- **Rate limiting** [29] - Request rate control
- **Load shedding** [29,58] - Graceful degradation under load

### Performance Measurement
- **Latency** [1,26,31,43,46,66,93] - Response time
- **Throughput** [25,26,31,40,43,66,84,93] - Request processing rate
- **Utilization** [25] - Resource usage percentage
- **Percentiles** [58,72] - P50, P95, P99 latency
- **Tail latency** [31,43] - High percentile latency
- **Service level indicators (SLI)** - Measurable metrics
- **Service level objectives (SLO)** - Target reliability
- **Service level agreements (SLA)** - Contractual commitments
- **Error budget** [12,39,58] - Allowed failure rate

### Data Structures & Algorithms
- **Data structures** [10] - Efficient storage and access patterns
- **Search algorithms** - Optimal search strategies
- **Hash tables** - Fast lookups
- **B-trees** - Ordered data access
- **Bloom filters** [15,31,43,80] - Space-efficient set membership
- **Log-structured merge (LSM) trees** - Write-optimized storage
- **Merkle trees** [15,43,75] - Hash-based verification trees
- **Tries** - Prefix tree for strings
- **Consistent hashing** [15,31,43,56,75] - Stable key distribution
- **Hash partitioning** [15,31,43,56,62] - Key-based distribution
- **Range partitioning** [15,43,56,62] - Value-range distribution

---

## 7. API Design & Interfaces

### API Patterns
- **API design** [5,10,14,45,78,83,91] - RESTful and tool-based interfaces
- **RESTful HTTP** [56,84] - Resource-oriented APIs
- **HTTP methods** [56,72] - GET, POST, PUT, DELETE, PATCH
- **HTTP status codes** [56,76] - Semantic response codes
- **API versioning** [10,11,14,31,56,84] - Backward compatibility
- **Semantic versioning** [2,14,37,51,60,63,69,82] - MAJOR.MINOR.PATCH version numbering
- **Interface definition** [12,26,41,55] - Contract specification
- **JSON Schema** - Schema validation for API payloads
- **Request-response pattern** [8,56] - Synchronous communication
- **Content negotiation** [14,56,84] - Format flexibility
- **Interface-oriented design** [34] - Designing around interfaces
- **Interface contract** [34] - Preconditions, postconditions, invariants
- **Design by contract** [6,10,34,46,52,59] - Formal interface specifications
- **Minimal interface** [34] - Simplest possible interface
- **Complete interface** [34] - All needed operations
- **Interface coupling** [34] - Dependencies between interfaces
- **Postel's Law** [2,12] - Be liberal in what you accept, conservative in what you send
- **Tolerant reader** [12] - Resilient to interface changes
- **Parse-don't-validate** [2] - Convert unvalidated data to validated types
- **Guard clause** [2] - Early return for invalid inputs
- **Authentication** [20,51] - Identity verification
- **Authorization** [20,51] - Access control
- **Authentication and authorization** - Identity and access management
- **API evolution** - Managing API changes
- **Deprecation strategies** [10,47] - Phasing out old APIs

### MCP Tool Design
- **Tool interfaces** - Standardized tool definitions
- **Parameter validation** - Input sanitization
- **Error responses** - Structured error reporting
- **Documentation** [47,95] - Self-documenting APIs
- **Tool composition** - Chaining operations
- **Schema validation** [16] - JSON schema enforcement

### Integration Patterns
- **Message passing** [41,52,55,72,76,85] - Asynchronous communication
- **Event-driven architecture** [5,8,12,14,19,22,23,54,56,67,72,77,80,82,99] - Event sourcing patterns
- **Event sourcing** [5,8,12,14,17,22,40,52] - Append-only event log
- **Publish-subscribe** [5,19,31] - Decoupled messaging
- **Consumer-driven contracts** [8,10,11,14,16,19,22] - Testing interface compatibility
- **Adapter pattern** [5,10,28,29,34,47,54] - Interface translation
- **Facade pattern** [10,28,30,32,47] - Simplified interface

---

## 8. Concurrency & Synchronization

### Concurrency Concepts
- **Concurrency** [10,15,31,40,43,72,76,77] - Parallel execution handling
- **Parallelism** [76,77] - Simultaneous execution
- **Synchronization** [10] - Coordinating concurrent operations
- **Race condition** [2] - Preventing data races
- **Atomicity** [15,16,56,62,75,99] - Indivisible operations
- **Mutual exclusion** [115,116] - Critical section protection
- **Deadlock prevention** [15] - Resource ordering
- **Thread safety** - Safe concurrent access

### Asynchronous Patterns
- **Async/await** [72,76,77,78,83,85] - JavaScript asynchronous programming
- **Promises** [7,23,98] - Future value representation
- **Event loops** - Non-blocking I/O
- **JavaScript event loop** [7] - Node.js concurrency model
- **Callbacks** [23,98] - Asynchronous result handling
- **Streaming** - Asynchronous data processing
- **Async iterators** [7] - Asynchronous iteration
- **Backpressure** [29,31,52] - Flow control in streams
- **Event emitters** [7] - Publish-subscribe for events

### Shared State Management
- **Immutability** [2,15,31,43,75,85,91] - Unchanging data structures
- **Segregation of mutability** [17] - Isolating mutable state
- **Pure functions** - Functions without side effects
- **Referential transparency** [2,10] - Substitutable expressions
- **Encapsulation** [3,6,10,17,28,37,42,50,62,71] - Hiding internal state
- **Thread safety** - Safe concurrent access to shared state

---

## 9. Error Handling & Reliability

### Error Handling Strategies
- **Exception handling** [3,87] - Structured error management
- **Error propagation** - Bubbling errors up the stack
- **Validation** [55,93] - Input validation and sanitization
- **Graceful degradation** [14,58,68,93] - Fallback mechanisms
- **Error recovery** [55] - Automatic retry and healing
- **Logging and monitoring** [52] - Observability
- **Functional error handling** [5] - Result/Either types instead of exceptions
- **Option/Maybe types** - Nullable value handling
- **Error masking** - Hiding implementation details
- **Crash-on-fatal** - Fail-fast error handling
- **Define errors out of existence** [64] - Designing APIs to avoid error cases
- **Defensive programming** [6,52,61,70,93] - Anticipating failures
- **Assertions** [3,6,15,34] - Runtime correctness checks
- **Input validation** - Sanitizing inputs

### Domain Exceptions
- **Custom exceptions** - Domain-specific error types
- **Error hierarchies** - Structured exception taxonomy
- **Error codes** - Standardized error identification
- **Error messages** - User-friendly error descriptions

### Reliability Patterns
- **Fail-fast** - Early error detection
- **Fail-safe** [93] - Safe defaults
- **Health checks** [12,14,29] - System status monitoring
- **Health endpoints** - Status API endpoints
- **Incident management** [25,58] - Handling production issues
- **Runbooks** [25,58] - Operational procedures
- **Mean time to detect (MTTD)** - Detection speed
- **Mean time to repair (MTTR)** - Recovery speed

---

## 10. Development Practices & Collaboration

### Development Workflow
- **Incremental development** [1,10,26,47,55,56,71,73,75] - Iterative implementation
- **Iterative development** [10,26,34,42,46,47,71,73] - Repeated refinement cycles
- **Code review** [49] - Peer feedback
- **Code reviews** - Systematic review process
- **Pull requests** [2,37,63] - Code review workflow
- **Code review latency** - Time to review changes
- **Pair programming** [2,3,6,12,34,51,65,77] - Two programmers, one workstation
- **Mob programming** [2,12] - Whole team programming together
- **Refactoring** [2,3,5,6,10,21,36,37,46,47,52,65,69,73,76,77,85] - Code improvement
- **Documentation** [47,95] - Code and API documentation
- **Collective ownership** [2,3,37] - Team code ownership
- **Collective code ownership** [2,3,8,40,51,61,63] - Team responsibility for code
- **Egoless programming** [3,6] - Depersonalized code review
- **Checklists** [2,6] - Systematic verification aids

### Version Control
- **Git** [2,63] - Distributed version control system
- **Version control** [1,6,26,34,37,40,44,51,56,73,89] - Git-based workflow
- **Distributed version control** [1,63] - Decentralized repository model
- **Branching strategies** [1,12,30,37] - Git workflow patterns
- **Branching workflows** - Feature, release, and hotfix branches
- **Trunk-based development** [1,8,12,37,57] - All changes to main trunk
- **Feature branching** [1,37] - Branch per feature
- **Branch by abstraction** [1] - Incremental changes behind abstractions
- **Merge conflicts** - Resolving concurrent changes
- **Atomic commits** [1] - Small, focused commits
- **Small commits** [2] - Incremental, focused changes
- **Commit history** - Clean, meaningful history
- **Semantic versioning** [2,14,37,51,60,63,69,82] - MAJOR.MINOR.PATCH version numbering

### Agile Methodologies
- **Agile methodologies** [3] - Iterative, adaptive development
- **Extreme Programming (XP)** [10] - Agile with engineering practices
- **Kanban method** - Flow-based agile
- **Lean software development** [3] - Waste elimination
- **User stories** [26,51,73,75] - Requirements as user narratives
- **Product backlog** [3,26,51] - Prioritized feature list
- **Minimum viable product (MVP)** - Minimal feature set
- **Walking skeleton** [1,2] - Thinnest slice of functionality
- **Vertical slice** [2] - End-to-end feature implementation
- **Velocity** [3,26,73,75] - Team throughput metric
- **Cycle time** [1,57] - Time from start to finish
- **Conway's Law** [2,5,52,65] - Organizations produce designs mirroring their communication

### Code Quality
- **Coding standards** [3,6,51,52] - Style guides and conventions
- **Static analysis** [3,12,37,41,45,69,82,91] - TypeScript type checking
- **Static code analysis** [1,69,82] - Automated code inspection
- **Linting** [12,37] - Code style enforcement (ESLint)
- **Code formatting** [69] - Automated formatting (Prettier)
- **Code metrics** [3] - Complexity measurement
- **Cyclomatic complexity** [3,5,10,11,14,47,77,96] - Decision point count
- **Technical debt** [1,2,5,8,12,29,34,40,47,49,50,73,77] - Deferred quality work
- **Cost of change** - Modification difficulty
- **Maintainability** [3,5,6,10,11,14,16,19,22,28,31,43,45,50,51,60,73,76,97] - Long-term code health
- **Code smells** [5,21,36] - Indicators of design problems
- **Anti-patterns** [5] - Common design mistakes
- **Naming conventions** [5,52,91] - Intent-revealing names
- **Intent-revealing code** [5] - Self-documenting code
- **Code readability** [2,52,69] - Understandable code
- **Git hooks** - Pre-commit quality checks (Husky)
- **Refactoring process** - Detect, plan, repay
- **Behavior-preserving transformations** [36] - Safe refactorings
- **Extract method** [6,36] - Breaking up large functions
- **Rename refactoring** - Improving names
- **Complexity management** [3,5,6,10,11,14,19,20,21,22,47,64,71,88] - Managing code complexity
- **Decomposition** [2,8,62,75] - Breaking problems into parts
- **Cross-cutting concerns** [2,17] - Aspects that span modules
- **Separation of concerns** [3,5,6,10,17,28,32,34,41,42,49,74,79] - Single responsibility for modules

---

## 11. DevOps & Site Reliability Engineering

### Continuous Integration & Delivery
- **Continuous integration (CI)** [1,2,3,5,6,8,12,14,21,22,24,37,38,40,46,49,51,52,59,65,73,75,77,82] - Automated build and test on every commit
- **Continuous delivery (CD)** [1,2,14,22,37,38,40,52,77,82] - Automated deployment pipeline
- **Continuous deployment** [1,8,14,29,38,77] - Automatic production deployment
- **Deployment pipeline** [1,12,22,38,47,52] - Stages from commit to production
- **Commit stage** [1] - Initial CI validation step
- **Build automation** [1,2,6,52,56,69,73] - Automated builds (npm scripts, build tools)
- **Test automation** [1,3,12,38,49,56,57,73,75,83] - Automated test execution in pipeline
- **Test data management** [1,44,51] - Managing data for tests
- **Architecture fitness functions** [11,14] - Automated architecture validation
- **Automated deployment** [1] - Scripted, repeatable deployments
- **Idempotent deployment** [1] - Deployments that can be safely repeated
- **Deployment orchestration** [1,12,79] - Coordinating deployment steps
- **Dependency management** [14,17,28,29,32,47,54,60,81,91,95] - Managing external dependencies
- **Continuous improvement** [3,12,21,63,75,90] - Iterative process enhancement
- **DevOps culture** [12,14,25,58,63] - Collaboration between dev and ops
- **Value stream mapping** [1,75] - Visualizing delivery process

### Deployment Strategies
- **Canary releases** [2,8,12] - Gradual rollout to subset of users
- **Blue-green deployment** [1,8,24,30,57,63] - Zero-downtime switching between environments
- **Progressive delivery** [12,30,58,66] - Controlled feature rollout
- **Zero-downtime deployment** [8,12,14] - Deployment without service interruption
- **Rolling deployment** [12,30] - Incremental instance updates
- **Rollback** [1,62] - Reverting to previous version
- **Rollforward** - Fixing issues by deploying new version
- **Backing out changes** [1] - Safe deployment reversal

### Feature Management
- **Feature toggles** [8,19,22] - Runtime feature switches
- **Feature flags** [2,58,83] - Conditional feature activation
- **Calendar flags** - Time-based feature activation
- **Release toggles** - Deployment-time feature control
- **Experiment toggles** - A/B testing support
- **Permission toggles** - User-based feature access

### Infrastructure & Configuration
- **Infrastructure as code (IaC)** [1,8,12,14,24,29,37,38,39,57,58,59,82] - Machine-readable infrastructure configuration
- **Configuration as code** [8,12,14,58,63] - Version-controlled configuration
- **Configuration management** [1,3,14,34,44,47,55,56,65,73,75,90,94] - Environment-specific config
- **Desired state management** [8] - Automatic infrastructure reconciliation
- **Environment parity** [77] - Consistent dev/staging/production environments
- **Immutable infrastructure** [12,14,24,30] - Replace rather than update
- **Declarative infrastructure** [1,12] - Describing desired state
- **Environment provisioning** [1,12] - Creating environments automatically
- **Configuration drift** [1,57] - Environments diverging from desired state
- **Environment management** [1] - Managing multiple environments
- **Artifact repository** [1,82] - Storing build artifacts
- **Artifact promotion** [1,82] - Moving artifacts through pipeline stages
- **Infrastructure provisioning** [1,12] - Automated environment creation

### Observability
- **Observability** [1,8,12,14,16,19,22,25,29,30,38,40,58,63,66,72,78,82,88,91] - Understanding system state from external outputs
- **Monitoring** [8,40,58,63,93] - Tracking system metrics and health
- **Log aggregation** [8,12,14,19,29,38,65,78] - Centralized logging across services
- **Metrics aggregation** [8,66,72] - Collecting and storing metrics
- **Distributed tracing** [8,12,10,14,25,29,38,66,72,88] - Tracking requests across service boundaries
- **Structured logging** [29,58,65,78,83] - Parseable log events (JSON logging)
- **Trace context propagation** [29,56] - Passing trace IDs across calls
- **Spans** - Units of work in distributed traces
- **Correlation IDs** - Linking related log entries

### Alerting & Incident Response
- **Alerting** [8,12,14,25] - Automated notifications for issues
- **On-call management** [25] - Production support rotation
- **Incident response** [12,58,72,85] - Systematic failure handling
- **Postmortems** [25] - Blameless incident retrospectives
- **Runbooks** [25,58] - Operational procedures
- **Alert fatigue** [8,12,25,58] - Avoiding too many alerts
- **Toil elimination** - Automating manual work

### Site Reliability Concepts
- **Service level indicators (SLI)** - Measurable metrics
- **Service level objectives (SLO)** - Target reliability
- **Service level agreements (SLA)** - Contractual commitments
- **Error budget** [12,39,58] - Allowed failure rate
- **Burn rate** [58] - Rate of error budget consumption
- **Mean time to detect (MTTD)** - Detection speed
- **Mean time to repair (MTTR)** - Recovery speed
- **Capacity planning** [1,25,29,34,39,88,96] - Resource forecasting

---

## 12. System Design & Architecture

### System Design Principles
- **System architecture** [26,34,40,44,56,74,86] - High-level system organization
- **Component design** - Module boundaries
- **Interface design** [6,10] - Contract definition
- **Abstraction layers** [68,77] - Hiding complexity
- **Encapsulation** [3,6,10,17,28,37,42,50,62,71] - Information hiding
- **Cohesion** [5,8,12,19,20,21,34,52,53,67] - Single responsibility
- **Coupling** [3,5,6,8,10,11,14,16,50,52] - Minimizing dependencies
- **Afferent coupling** [10,16] - Incoming dependencies
- **Efferent coupling** [10,16] - Outgoing dependencies
- **Component granularity** [10,11,19,20] - Size and scope
- **Trade-off analysis** [10,46,55,66,74,96] - Evaluating design decisions
- **Architecture trade-offs** [10,19] - Everything is a trade-off

### Design Patterns for Systems
- **Model-based design** [56] - Domain modeling
- **State machines** [47,70,73] - Stateful behavior modeling
- **Pipeline architecture** - Data flow processing
- **Plugin architecture** [17,73] - Extensibility patterns
- **Service granularity** [12,10,11,14,16,19,22,40] - Service size and scope
- **Granularity disintegrators** [10,16,20] - Reasons to split services
- **Granularity integrators** [10,16,20] - Reasons to combine services
- **Modular monolith** [5,8,11,14,16,19,22] - Monolith with clear module boundaries
- **Hexagonal architecture** [5,14,52] - Ports and adapters pattern
- **Vertical-slice architecture** - Feature-based organization

### Systems Thinking
- **Systems thinking** [15,16,55,66,74,77,86,88,96] - Holistic perspective
- **Feedback loops** [66] - Circular causality
- **Balancing feedback** [86,99] - Stabilizing loops
- **Reinforcing feedback** [86,99] - Amplifying loops
- **Leverage points** [86,99] - High-impact interventions
- **System archetypes** [86,99] - Common patterns
- **Mental models** [5,66,67,86,99] - Internal representations
- **System boundaries** [5] - Scope definition
- **Resilience** [14,19,22,29,30,38,39,58,65,76,78,84,86,99] - Adaptive capacity
- **Interdependence** - Mutual relationships

---

## 13. Domain-Specific Concepts

### Natural Language Processing
- **Text embeddings** - Semantic vector representations
- **Tokenization** [10,15,61,66,80,91,93] - Text segmentation
- **Concept extraction** - Identifying key concepts
- **Named entity recognition** [15] - Entity identification
- **Semantic similarity** [61,66] - Measuring text relatedness
- **Word embeddings** [61,66] - Distributed word representations
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** [61,79] - Context-aware representations
- **Prompt engineering** [63,66,68] - Designing effective prompts for LLMs
- **Context window management** [68,79] - Handling token limits

### Information Retrieval
- **Ranking** - Result ordering
- **Relevance scoring** [61] - Query-document matching
- **Inverted index** [10,61,72] - Efficient text search
- **TF-IDF** [61] - Term importance weighting
- **BM25** - Probabilistic ranking
- **Vector space model** - Geometric text representation

### Knowledge Management
- **Ontologies** - Concept hierarchies
- **Taxonomies** [66] - Classification schemes
- **Knowledge graphs** [15,66,68] - Relationship networks
- **Metadata management** [15,66,69,75] - Document properties
- **Content organization** - Structuring information
- **Document clustering** - Grouping similar documents
- **Knowledge synthesis** [79] - Combining information from multiple sources
- **Data lineage** [11,14] - Tracking data origins and transformations
- **Explainability** - Understanding system decisions

---

## Application to Concept-RAG Project

### Architecture Alignment
The concept-RAG project demonstrates many of these concepts:

1. **Layered Architecture**: Clear separation between domain, infrastructure, application, and tools layers
2. **Repository Pattern**: Database access abstraction in infrastructure layer
3. **Service Layer**: Domain services encapsulate business logic
4. **Dependency Injection**: Container-based wiring in `application/container.ts`
5. **Hybrid Search**: Combining vector, BM25, and concept-based ranking
6. **Caching**: Multi-level caching for embeddings and results
7. **MCP Tools**: Well-defined API for AI agent integration
8. **Type Safety**: TypeScript for compile-time correctness
9. **Modular Design**: Clear component boundaries
10. **Strategic Programming**: Investment in long-term design quality

### DevOps Practices
The project utilizes:
- **Git version control** with atomic commits
- **Continuous integration** for automated testing
- **Feature toggles** for gradual feature rollout
- **Semantic versioning** for releases
- **Structured logging** for observability
- **TypeScript compilation** in build pipeline

### Testing Strategy
The project leverages:
- **Unit tests** for individual components (Vitest)
- **Integration tests** for database and search operations
- **Performance benchmarks** for search queries
- **Contract tests** for MCP tool interfaces
- **Test-driven development** where appropriate

### Quality Practices
The project benefits from:
- **TypeScript** for static type checking and type safety
- **Type-driven development** - Using types to guide design
- **Linting** for code consistency (ESLint)
- **Code formatting** (Prettier)
- **Modular design** for maintainability
- **Clear interfaces** for testability
- **Comprehensive error handling** for reliability
- **Refactoring** - Continuous code improvement

---

## Document Sources

The following **197 sources** were verified using `concept_sources` to have contributed one or more concepts to this lexicon. Source numbers in brackets throughout this document reference this list.

1. Continuous Delivery - Humble, Jez & Farley, David
2. Code That Fits in Your Head - Mark Seemann
3. Continuous Delivery - Farley, David & Humble, Jez
4. Software Development, Design, and Coding - John F. Dooley & Vera A. Kazakova
5. Introduction to Software Design and Architecture with TypeScript - Khalil Stemmler
6. Code Complete - Steve McConnell
7. Programming TypeScript - Boris Cherny
8. Building Microservices - Sam Newman
9. Building Microservices (2015) - Sam Newman
10. Beautiful Code - Andy Oram & Greg Wilson (editors)
11. Domain-Driven Design - Eric Evans
12. Software Architecture: The Hard Parts - Ford, Richards, Sadalage & Dehghani
13. CI/CD Unleashed - Tommy Clark
14. Microservices: Flexible Software Architecture - Eberhard Wolff
15. Database System Concepts - Silberschatz, Korth & Sudarshan
16. Software Architecture: The Hard Parts - Ford, Richards, Sadalage & Dehghani
17. Clean Architecture - Robert C. Martin
18. Fundamentals of Software Architecture - Neal Ford & Mark Richards
19. Head First Software Architecture - Gandhi, Richards & Ford
20. Test Driven Development for Embedded C - James Grenning
21. Fundamentals of Software Architecture - Mark Richards & Neal Ford
22. Mastering TypeScript - Nathan Rozentals
23. The DevOps Handbook - Gene Kim et al.
24. Database Reliability Engineering - Laine Campbell & Charity Majors
25. Software Requirements - Karl Wiegers & Joy Beatty
26. CI/CD Design Patterns - Garima Bajpai et al.
27. Design Patterns: Elements of Reusable Object-Oriented Software - Gamma, Helm, Johnson & Vlissides
28. Distributed Systems with Node.js - Thomas Hunter II
29. Applying UML and Patterns - Craig Larman
30. Designing Data-Intensive Applications - Martin Kleppmann
31. Head First Design Patterns - Eric Freeman & Elisabeth Robson
32. Systems Analysis and Design - Scott Tilley & Harry Rosenblatt
33. Interface Oriented Design - Ken Pugh
34. Essential TypeScript 5 - Adam Freeman
35. Refactoring - Martin Fowler & Kent Beck
36. Effective TypeScript - Dan Vanderkam
37. Grokking Continuous Delivery - Christie Wilson
38. Microservices Patterns - Chris Richardson
39. Site Reliability Engineering - Beyer, Jones, Petoff & Murphy (Google)
40. Software Architecture for Developers - Simon Brown
41. Software Requirements Engineering - Richard H. Thayer & Merlin Dorfman
42. UML 2 for Dummies - Michael Jesse Chonoles
43. Designing Data-Intensive Applications - Martin Kleppmann
44. Effective Software Testing - Elfriede Dustin
45. Just Enough Software Architecture - George Fairbanks
46. Applying UML and Patterns - Craig Larman
47. Refactoring for Software Design Smells - Samarthyam, Sharma & Suryanarayana
48. SQL Antipatterns - Bill Karwin
49. The UML User Guide - Grady Booch et al.
50. AntiPatterns - Brown, Malveau, McCormick & Mowbray
51. The Art of Unit Testing - Roy Osherove
52. User Stories Applied - Mike Cohn
53. Embedded Systems Design (CMP Books)
54. Design It! - Michael Keeling
55. JSF AV Rules (Embedded coding standards)
56. Node.js Design Patterns - Mario Casciaro & Artie Ng
57. The Engineering Design of Systems - Dennis Buede & William Miller
58. The Pragmatic Programmer - Andy Hunt & David Thomas
59. Distributed Systems for Practitioners - Dimos Raptis
60. Infrastructure as Code - Kief Morris
61. Observability Engineering - Charity Majors, Liz Fong-Jones & George Miranda
62. The Rust Programming Language - Steve Klabnik & Carol Nichols
63. Understanding Distributed Systems - Roberto Vitillo
64. A Philosophy of Software Design - John Ousterhout
65. Database Systems: The Complete Book - Garcia-Molina, Ullman & Widom
66. DevOps Unleashed with Git and GitHub - Yuki Hattori & Isabel Drost-Fromm
67. The Clean Coder - Robert C. Martin
68. The Trader's Classroom Collection (Volume 2) - Jeffrey Kennedy
69. Building Secure and Reliable Systems - Heather Adkins (Google)
70. Handbuch Automotive SPICE 4 - Alexander Levin et al.
71. Knowledge-Based Design Systems - Rosenman, Radford, Balachandran & Gero
72. Learning Domain-Driven Design - Vladik Khononov
73. Machine Learning Production Systems - Robert Crowe et al.
74. The Pragmatic Programmer - Andrew Hunt & David Thomas
75. Agentic Design Patterns - Antonio Gulli
76. Command-Line Rust - Ken Youens-Clark
77. Cracking the Coding Interview - Gayle Laakmann McDowell
78. Rust Programming by Example - Guillaume Gomez
79. Software Telemetry - Jamie Riedesel
80. Understanding The UML
81. UML Reference Manual - James Rumbaugh et al.
82. Data Modeling Essentials - Graeme Simsion & Graham Witt
83. Embedded C - Traps and Pitfalls
84. Enterprise Integration Patterns - Frank Leymann & Dieter Roller
85. Network Programming with Rust - Abhishek Chanda
86. Refactoring to Rust - Lily Mara & Joel Holmes
87. Utilizing Vector Databases to Enhance RAG Models
88. Zero to Production in Rust - Luca Palmieri
89. Agile Model-Based Systems Engineering Cookbook - Bruce Powel Douglass
90. BABOK Guide (v3.0)
91. Database Internals - Alex Petrov
92. Needs, Requirements, Verification, Validation Lifecycle - INCOSE
93. Refactoring at Scale - Maude Lemaire
94. Sams Teach Yourself UML in 24 Hours
95. Thinking in Systems - Donella H. Meadows
96. Agile Model-Based Systems Engineering Cookbook - Bruce Powel Douglass
97. arc42 by Example - Gernot Starke et al.
98. Asynchronous Programming in Rust - Carl Fredrik Samson
99. Building Decentralized Trust - Victoria Lemieux & Chen Feng
100. Fundamentals of Smart Contracts Security - Richard Ma et al.
101. Programming Rust - Jim Blandy et al.
102. RESTful Web APIs - Leonard Richardson, Mike Amundsen & Sam Ruby
103. Systems, Functions and Safety - Milan Z. Bjelica
104. The Art of Software Security Assessment - Mark Dowd et al.
105. A Discipline for Software Engineering - Watts S. Humphrey
106. UML Distilled - Martin Fowler
107. Learning SQL - Alan Beaulieu
108. Mastering GitHub Actions - Eric Chapman
109. Rust for Rustaceans - Jon Gjengset
110. Continuous Integration (CI) and Continuous Delivery (CD) - Henry van Merode
111. Mastering Blockchain - Imran Bashir
112. PMBOK Guide (5th Edition)
113. Requirements Engineering - Axel van Lamsweerde
114. Solidity Programming Essentials - Ritesh Modi
115. Systems Engineering: Fifty Lessons Learned - Howard Eisner
116. Systems Performance - Brendan Gregg
117. The C4 Model for Visualising Software Architecture - Simon Brown
118. The Software Engineer's Guidebook - Gergely Orosz
119. Thinking in Systems: A Primer - Donella H. Meadows
120. Transaction Processing - Jim Gray & Andreas Reuter
121. The UML and Data Modeling
122. Building Blockchain Apps - Michael Juntao Yuan
123. Database Modeling and Design - Teorey, Lightstone, Nadeau & Jagadish
124. Introduction to Algorithms - Cormen, Leiserson, Rivest & Stein
125. Mastering Blockchain - Imran Bashir
126. Systems Engineering: System Design Principles and Models - Dahai Liu
127. Asynchronous Programming Patterns in JavaScript - Tamás Sallai
128. The Little Black Book of Project Management
129. Functional Safety from Scratch - Peter Clarke
130. Node.js Web Development - David Herron
131. Programming Rust - Jim Blandy, Jason Orendorff & Leonora Tindall
132. Systems Engineering Models - Adedeji B. Badiru
133. The Art of Designing Embedded Systems - Jack G. Ganssle
134. The Art of Designing Embedded Systems (2008) - Jack G. Ganssle
135. The Art of Multiprocessor Programming - Herlihy, Shavit, Luchangco & Spear
136. Visual Models for Software Requirements - Joy Beatty & Anthony Chen
137. UML Tutorial - Finite State Machines
138. Writing Effective Use Cases - Alistair Cockburn
139. Applying Design for Six Sigma to Software and Hardware - Eric Maass & Patricia McNair
140. Automating DevOps with GitLab CI/CD - Cowell, Lotz & Timberlake
141. C Programming for Embedded Systems (CMP Books)
142. Concurrency Control and Recovery in Database Systems - Bernstein, Hadzilacos & Goodman
143. Distributed Computing: 16th International Conference (DISC)
144. Embedded Systems Building Blocks - Jean J. Labrosse
145. Ethereum for Architects and Developers - Debajani Mohanty
146. Hungarian Notation (coding standards)
147. Learning GitHub Actions - Brent Laster
148. Mastering Blockchain - Imran Bashir
149. Measure What Matters - John Doerr
150. Peer-to-Peer Systems and Applications (Lecture Notes)
151. Rational Analysis for a Problematic World Revisited - Jonathan Rosenhead & John Mingers
152. Rust for Blockchain Application Development - Akhil Sharma
153. Rust in Action - T.S. McNamara
154. Safety Critical Systems Handbook - David J. Smith
155. Solidity Programming Essentials - Ritesh Modi
156. Statecharts Quantum Programming
157. Systems Engineering and Artificial Intelligence
158. The Art of Computer Systems Performance Analysis - Raj K. Jain
159. UML Tutorial - Complex Transitions
160. Atomic Transactions in Concurrent and Distributed Systems - Lynch, Merritt, Weihl
161. Real-Time Concepts for Embedded Systems (CMP Books)
162. Complexity Perspectives in Innovation and Social Change - David Lane et al.
163. Cryptography: Algorithms, Protocols, and Standards - Zoubir Z. Mammeri
164. Data Science: The Hard Parts - Daniel Vaughan
165. Data Smart - Jordan Goldmeier
166. Database Design for Mere Mortals - Michael James Hernandez
167. Dictionary of Financial and Business Terms
168. Efficient Node.js - Samer Buna
169. Elliott Wave Techniques Simplified - Bennett A. McDowell
170. Embedded Microprocessor Systems: Real World Design
171. Fuzzy Data Matching with SQL - Jim Lehmer
172. Introduction to Modern Cryptography - Jonathan Katz & Yehuda Lindell
173. Mastering Ethereum - Andreas M. Antonopoulos & Gavin Wood
174. Abstract State Machines (Springer)
175. Notes on the Synthesis of Form - Christopher Alexander
176. Security Engineering (V2)
177. Seven Habits of Highly Effective People - Stephen R. Covey
178. Situated Cognition - William J. Clancey
179. The Cambridge Handbook of Situated Cognition - Philip Robbins & Murat Aydede
180. Software for Use - Larry Constantine & Lucy Lockwood
181. Test Driven Development by Example - Kent Beck
182. The Art of Setting Smart Goals - Anisa Marku
183. The Economics of Blockchain Consensus - Joshua Gans
184. The Elliott Wave Writings - A.J. Frost & Richard Russell
185. The Rust Performance Book
186. The Trader's Classroom Collection (Volume 4) - Jeffrey Kennedy
187. The Trader's Classroom Collection (Volume 1) - Jeffrey Kennedy
188. UML Notation Guide
189. Visualizing Complexity - Darjan Hil & Nicole Lachenmeier
190. Applied Cryptography - Bruce Schneier
191. Cryptography: Theory and Practice - Douglas Stinson
192. (ebook) 10 Minute Guide to Project Management
193. (ebook) Project Management Practitioner's Handbook
194. Handbook for Small Business
195. Data Provenance and Integrity (various sources)
196. The Trader's Classroom Collection (Volume 3) - Jeffrey Kennedy
197. Elliott Wave International (reference materials)

---
