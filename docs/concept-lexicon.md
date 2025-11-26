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

---

## 1. Software Architecture & Design Patterns

### Core Architecture Concepts
- **Modular software architecture** - Layered architecture with clear separation of concerns
- **Dependency injection** - Container-based DI pattern for loose coupling
- **Constructor injection** - Injecting dependencies via constructor
- **Repository pattern** - Data access layer abstraction for database operations
- **Service layer** - Domain services encapsulate business logic
- **Factory pattern** - Object creation patterns for complex instantiation
- **Domain model** - Rich domain objects with behavior
- **Domain-driven design** - Domain models, bounded contexts, and ubiquitous language
- **Layered architecture** - Clear separation: domain, infrastructure, application, tools
- **Interface definition (IDL)** - Type definitions and contracts between layers
- **API design and evolution** - MCP tool interfaces and versioning considerations
- **Separation of concerns** - Clean boundaries between modules
- **Component-based design** - Modular, composable architecture units
- **Componentization** - Breaking systems into independent components
- **Architectural characteristics** - The "-ilities" (scalability, reliability, performance, etc.)
- **Architecture decision records (ADRs)** - Documenting architectural decisions and rationale
- **Screaming architecture** - Domain-centric design where architecture reveals intent
- **Ports and adapters** - Hexagonal architecture for testability
- **Modular monolith** - Monolith with clear module boundaries
- **Clean architecture** - Dependency rule and policy vs. details separation
- **Evolutionary architecture** - Architecture that supports guided incremental change
- **Bounded context** - Domain partitioning with explicit boundaries

### Design Patterns
- **Design patterns** - Proven solutions to recurring problems
- **Strategy pattern** - Algorithm selection (e.g., different search strategies)
- **Adapter pattern** - Document loader abstractions for different file types
- **Decorator pattern** - Enhancing search results with additional metadata
- **Observer pattern** - Event-driven architectures for index updates
- **Singleton pattern** - Cache and database connection management
- **Template method pattern** - Common workflows with customizable steps
- **Context object pattern** - Avoiding pass-through variables
- **Factory method pattern** - Object creation abstraction
- **Abstract factory** - Families of related objects
- **Proxy pattern** - Controlling access to objects
- **Façade pattern** - Simplified interface to complex subsystem
- **Composite pattern** - Tree structures of objects
- **Mediator pattern** - Reducing coupling between components
- **Command pattern** - Encapsulating requests as objects
- **State pattern** - State-dependent behavior
- **Builder pattern** - Step-by-step object construction
- **Chain of responsibility** - Passing requests along a handler chain
- **Humble object pattern** - Separating testable from hard-to-test code
- **Strangler pattern** - Incremental migration from legacy systems
- **Repository pattern** - Data access abstraction
- **Value object** - Immutable objects defined by value
- **Data transfer object (DTO)** - Simple data containers

### Architectural Principles
- **Functional decomposition** - Breaking complex operations into smaller units
- **Inversion of control** - Dependency inversion principle application
- **Object-oriented design** - Class hierarchies and polymorphism
- **Modular decomposition** - Library and module organization
- **Interface specification** - Clear contracts between components
- **Design for debugging** - Structured logging and error tracing
- **Complexity management** - Strategic programming vs tactical programming
- **Deep modules** - Modules with simple interfaces and rich functionality
- **Information hiding** - Encapsulating implementation details
- **Abstraction** - Hiding complexity behind simple interfaces
- **Cohesion** - How strongly related module elements are
- **Coupling** - Degree of interdependence between modules
- **Strategic programming** - Investing in design quality for long-term maintainability
- **Tactical programming** - Short-term implementation focus (anti-pattern)
- **Design it twice** - Exploring multiple design alternatives
- **Pull complexity downward** - Moving complexity away from users/callers
- **Define errors out of existence** - Designing APIs to eliminate error cases
- **Obvious code principle** - Code should be self-explanatory
- **Defensive programming** - Anticipating failures and edge cases
- **SOLID principles** - Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **Liskov substitution principle** - Subtypes must be substitutable for base types
- **Dependency inversion principle** - Depend on abstractions, not concretions
- **DRY principle** - Don't Repeat Yourself
- **YAGNI** - You Aren't Gonna Need It (avoid speculative generality)
- **KISS** - Keep It Simple, Stupid
- **Law of Demeter** - Principle of least knowledge
- **Acyclic dependencies principle** - Avoid circular dependencies
- **Stable dependencies principle** - Depend on stable components
- **Stable abstractions principle** - Abstract components should be stable
- **Package by component** - Organization around business capabilities
- **Package by feature** - Domain-centric organization

### Architectural Styles
- **Service-based architecture** - Services with shared database
- **Event-driven architecture** - Asynchronous event-based communication
- **Microkernel architecture** - Plugin-based extensible core
- **Pipeline architecture** - Pipes and filters for data flow
- **Layered architecture** - Organized in horizontal layers
- **Hexagonal architecture** - Ports and adapters pattern
- **Ports and adapters (hexagonal) architecture** - Decoupling core from infrastructure
- **Onion architecture** - Dependency inversion in concentric layers
- **Vertical slice architecture** - Feature-based organization
- **Client-server architecture** - Request-response patterns
- **Command-query responsibility segregation (CQRS)** - Separating reads from writes
- **Command-query separation (CQS)** - Methods should be commands or queries

---

## 2. Testing & Verification

### Testing Strategies
- **Unit testing** - Component-level tests (project uses Vitest)
- **Integration testing** - Testing component interactions
- **System testing** - End-to-end workflow validation
- **Acceptance testing** - Validating against user requirements
- **Test automation** - Automated test suites
- **Regression testing** - Preventing regressions during refactoring
- **Test case design** - Systematic test coverage
- **Test-driven development (TDD)** - Write tests before implementation
- **Behavior-driven development (BDD)** - Specification through examples
- **Performance testing** - Search performance benchmarks
- **Load testing** - System behavior under load
- **Contract testing** - API contract validation between layers
- **Property-based testing** - Testing general properties with generated inputs
- **Smoke testing** - Basic functionality verification
- **Consumer-driven contracts** - Testing interface compatibility
- **Test isolation** - Keeping tests independent
- **A/B testing** - Comparing variations in production
- **Exploratory testing** - Unscripted manual testing
- **Scalability testing** - Testing behavior under scale

### Verification Techniques
- **Design verification and validation** - Ensuring requirements are met
- **Code inspection and review** - Peer review practices
- **Structured walkthroughs** - Team review sessions
- **Test coverage measurement** - Statement and branch coverage
- **Branch coverage** - Exercising all decision branches
- **Statement coverage** - Executing all statements
- **Design for testability** - Architecture that facilitates testing
- **Test harness** - Testing infrastructure and fixtures
- **Test fixtures** - Setup and teardown for tests
- **Test doubles** - Mocks, stubs, spies, fakes
- **Mocks and stubs** - Substitutes for dependencies
- **Functional testing (black-box)** - Testing against specifications
- **Structural testing (white-box)** - Internal structure testing
- **Assertions** - Runtime correctness checks
- **Preconditions and postconditions** - Contract-based verification
- **Invariants** - Properties that always hold
- **Test automation pyramid** - More unit tests than integration tests
- **Arrange-Act-Assert (AAA)** - Test structure pattern
- **Red-green-refactor** - TDD cycle

### Quality Assurance
- **Software quality assurance** - Systematic quality activities
- **Risk reduction** - Identifying and mitigating technical risks
- **Risk management** - Identifying and mitigating risks
- **Cost of defects** - Early detection and correction
- **Static code analysis** - Linting and type checking (TypeScript)
- **Static analysis** - Code inspection without execution
- **Dynamic analysis** - Runtime behavior analysis
- **Defect tracking** - Systematic issue management
- **Defect prevention** - Proactive quality measures
- **Code metrics** - Quantitative quality measures
- **Cyclomatic complexity** - Measuring code complexity
- **Code coverage metrics** - Test effectiveness measurement
- **Test coverage** - Percentage of code exercised by tests
- **Quality attributes** - Understandability, changeability, extensibility, reusability, testability, reliability
- **Maintainability** - Ease of modification
- **Readability** - Ease of understanding code
- **Testability** - Ease of testing
- **Reliability** - Consistent correct operation
- **Extensibility** - Ease of adding new functionality
- **Reusability** - Applicability in multiple contexts
- **Egoless programming** - Separating ego from code ownership
- **Collective code ownership** - Team responsibility for quality

---

## 3. Database & Search Systems

### Database Concepts
- **Vector databases** - LanceDB for embedding storage
- **Relational databases** - Structured data with ACID properties
- **Indexing** - Efficient data retrieval strategies
- **B-tree indexes** - Ordered data access
- **Search algorithms** - Hybrid search (vector + BM25 + concept scoring)
- **Data structures** - Optimized storage and retrieval
- **Caching** - Performance optimization via caching layers
- **Query optimization** - Efficient query execution
- **Schema design** - Table structure and relationships
- **Normalization** - Reducing redundancy and anomalies
- **Denormalization** - Trading redundancy for performance
- **Database systems** - CRUD operations and transactions
- **Primary keys** - Unique row identifiers
- **Foreign keys** - Referential integrity constraints
- **Views** - Virtual tables
- **Data integrity** - Field-level, table-level, relationship-level
- **Referential integrity** - Foreign key constraints
- **Entity integrity** - Primary key constraints

### Database Reliability
- **Backup and recovery** - Data protection strategies
- **High availability** - Minimizing downtime
- **Data durability** - Preventing data loss
- **Schema change automation** - Safe, automated migrations
- **Database migration** - Schema evolution scripts
- **Connection pooling** - Reusing database connections
- **Query instrumentation** - Monitoring query performance
- **Slow-query logging** - Identifying performance issues
- **Caching** - Storing frequently accessed data in memory

### Search & Retrieval
- **Semantic search** - Vector similarity search
- **Vector embeddings** - Text-to-vector transformations
- **Text embeddings** - Semantic vector representations
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** - Context-aware representations
- **Embedding normalization** - Vector normalization techniques
- **Full-text search** - BM25 keyword matching
- **Inverted index** - Efficient text search structure
- **TF-IDF** - Term importance weighting
- **BM25** - Probabilistic ranking function
- **Hybrid search** - Combining multiple ranking signals
- **Dense retrieval** - Vector-based semantic retrieval
- **Sparse retrieval** - Keyword-based retrieval (BM25, TF-IDF)
- **Ranking algorithms** - Score combination and normalization
- **Query expansion** - WordNet-based synonym expansion
- **Concept extraction** - NLP-based concept identification
- **Fuzzy matching** - Approximate string matching
- **Retrieval-augmented generation (RAG)** - Context-aware generation with retrieval
- **Approximate nearest neighbor (ANN) search** - Efficient vector similarity search
- **Similarity measures** - Cosine similarity, Euclidean distance, dot-product
- **Dynamic indexing** - Real-time index updates
- **Incremental indexing** - Adding documents without full rebuild
- **Re-ranking and rescoring** - Post-retrieval result refinement
- **Evaluation metrics** - Precision@k, Recall@k, NDCG, MRR
- **Source attribution** - Tracking document provenance
- **Context window management** - Handling token limits

### Data Management
- **Data locality** - Optimizing data placement for performance
- **Partitioning and sharding** - Horizontal data distribution
- **Consistent hashing** - Stable key distribution
- **Data integrity** - Validation and constraints
- **Schema evolution** - Versioning and migrations
- **Data lineage** - Tracking data origins and transformations
- **Data provenance** - Understanding data history
- **Access control** - Managing document access

---

## 4. TypeScript & Type Systems

### TypeScript Language Features
- **Type safety** - Static type checking for JavaScript
- **Gradual typing** - Incremental adoption of types
- **Static typing** - Compile-time type checking
- **Type inference** - Automatic type deduction
- **Structural typing** - Type compatibility based on structure
- **Type narrowing** - Refining types through control flow
- **Control-flow-based type analysis** - Type refinement through code flow
- **Type guards** - Runtime type checking functions
- **User-defined type guards** - Custom type predicate functions
- **Union types** - Types that can be one of several types
- **Intersection types** - Types that combine multiple types
- **Discriminated unions** - Tagged union types for type safety
- **Generics** - Parametric polymorphism
- **Bounded polymorphism** - Generic constraints with `extends`
- **Generic type inference** - Automatic type argument deduction
- **Conditional types** - Types that depend on other types
- **Mapped types** - Transforming types programmatically
- **Index signatures** - Dynamic property access
- **Template literal types** - String literal type manipulation
- **Type aliases** - Named type definitions
- **Type assertions** - Explicit type casting
- **Non-null assertion operator (!)** - Asserting non-null values
- **Const assertions (as const)** - Narrow literal types
- **Literal types** - String, number, boolean literals
- **Primitive types** - number, string, boolean, null, undefined, symbol, bigint
- **unknown type** - Type-safe alternative to any
- **never type** - Type for unreachable code
- **void type** - Absence of return value
- **Record type** - Key-value object types
- **Tuple types** - Fixed-length arrays with typed elements
- **Readonly arrays** - Immutable arrays
- **Readonly properties** - Immutable object properties
- **Function call signatures** - Function type definitions
- **Overloaded function signatures** - Multiple function signatures
- **Contextual typing** - Type inference from context
- **Excess property checking** - Strict object literal checking

### Type System Concepts
- **Variance** - Covariance, contravariance, invariance
- **Covariance** - Subtype in output position
- **Contravariance** - Supertype in input position
- **Subtyping** - Type compatibility relationships
- **Assignability rules** - When types are compatible
- **Type widening** - Automatic type generalization
- **Type erasure** - Types removed at runtime
- **Type branding** - Simulating nominal types in structural systems
- **Definite assignment** - Ensuring variables are initialized
- **Exhaustiveness checking** - Ensuring all cases are handled

### TypeScript-Specific Patterns
- **Declaration merging** - Combining multiple declarations
- **Interface merging** - Multiple interface declarations merged
- **Module augmentation** - Extending existing modules
- **Ambient declarations** - Type-only declarations for JavaScript
- **Declaration files (.d.ts)** - Type definitions for libraries
- **@types packages** - Type definitions on npm
- **Project references** - Multi-project TypeScript setups
- **Incremental compilation** - Faster rebuilds

### Type-Driven Development
- **Type-driven design** - Using types to guide design
- **Type-driven development** - Development led by type definitions
- **Type-safe APIs** - APIs with compile-time guarantees
- **Schema-driven APIs** - APIs defined by schemas (JSON Schema)
- **Client-server type contract** - Shared types across boundaries
- **Pattern matching** - Destructuring and control flow based on structure
- **Error handling with Result** - Type-safe error handling
- **Custom error types** - Domain-specific error hierarchies
- **Newtype pattern** - Wrapping types for type safety

### TypeScript Compiler & Tooling
- **TypeScript compiler (tsc)** - Compiling TS to JS
- **tsconfig.json** - TypeScript configuration
- **Compiler options** - Strict mode, module system, target
- **Strict type checking** - Enabling all strict flags
- **noImplicitAny** - Requiring explicit any annotations
- **strictNullChecks** - Null and undefined handling
- **Source maps** - Debugging support
- **Module resolution** - How modules are found
- **Module formats** - CommonJS, ES2015
- **ESModule interop** - CommonJS/ES module compatibility
- **Language services (tsserver)** - Editor integration
- **Editor integration** - VSCode/IntelliSense support

---

## 5. Reliability & Resilience

> **Note:** This project is a local TypeScript/Node.js application, not a distributed system. This section focuses on reliability patterns applicable to single-node applications with external dependencies (LLM APIs, database).

### Caching Strategies
- **Caching strategies** - Multi-level caching for performance
- **In-memory caching** - RAM-based storage (embeddings, search results)
- **Cache-aside pattern** - Lazy-loading cache on demand
- **Cache eviction policies** - LRU, TTL-based expiration
- **Request coalescing** - Batching concurrent identical requests
- **Memoization** - Caching function results

### Fault Tolerance for External Services
- **Circuit breaker pattern** - Preventing cascade failures to LLM APIs
- **Open/closed/half-open states** - Circuit breaker state machine
- **Retry semantics** - Handling transient failures
- **Exponential backoff with jitter** - Randomized progressive retry delays
- **Idempotence** - Safe retry of operations
- **Timeout handling** - Detecting unresponsive services
- **Graceful degradation** - Fallback behavior when services unavailable

### Data Consistency
- **Transactions** - ACID properties for database operations
- **ACID properties** - Atomicity, Consistency, Isolation, Durability
- **Optimistic concurrency control** - Validate at commit time
- **Write-ahead log (WAL)** - Durability via logging (LanceDB)
- **Event sourcing** - Event log as source of truth (optional pattern)

### Health & Monitoring
- **Health checks** - System status monitoring
- **Health endpoints** - Status API for monitoring
- **Structured logging** - Parseable log events for debugging

### Communication Patterns
- **Synchronous communication** - Request-response to LLM APIs
- **Asynchronous communication** - Non-blocking I/O (Node.js async/await)
- **Back pressure** - Flow control in streams

---

## 6. Performance & Optimization

### Optimization Techniques
- **Performance optimization** - Systematic improvement
- **Performance engineering** - Systematic performance design
- **Profiling** - Identifying performance hotspots
- **Benchmarking** - Performance measurement and comparison
- **Caching** - Reducing redundant computation
- **Lazy evaluation** - Deferred computation
- **Memoization** - Result caching
- **Batching** - Reducing operation overhead
- **Streaming** - Processing large datasets incrementally
- **Parallel processing** - Concurrent execution

### Resource Management
- **Memory management** - Heap and garbage collection awareness
- **Connection pooling** - Reusing expensive connections
- **Throttling and rate limiting** - Preventing resource exhaustion
- **Rate limiting** - Request rate control
- **Load shedding** - Graceful degradation under load

### Performance Measurement
- **Latency** - Response time
- **Throughput** - Request processing rate
- **Utilization** - Resource usage percentage
- **Percentiles** - P50, P95, P99 latency
- **Tail latency** - High percentile latency
- **Service level indicators (SLI)** - Measurable metrics
- **Service level objectives (SLO)** - Target reliability
- **Service level agreements (SLA)** - Contractual commitments
- **Error budget** - Allowed failure rate

### Data Structures & Algorithms
- **Data structures** - Efficient storage and access patterns
- **Search algorithms** - Optimal search strategies
- **Hash tables** - Fast lookups
- **B-trees** - Ordered data access
- **Bloom filters** - Space-efficient set membership
- **Log-structured merge (LSM) trees** - Write-optimized storage
- **Merkle trees** - Hash-based verification trees
- **Tries** - Prefix tree for strings
- **Consistent hashing** - Stable key distribution
- **Hash partitioning** - Key-based distribution
- **Range partitioning** - Value-range distribution

---

## 7. API Design & Interfaces

### API Patterns
- **API design** - RESTful and tool-based interfaces
- **RESTful HTTP** - Resource-oriented APIs
- **HTTP methods** - GET, POST, PUT, DELETE, PATCH
- **HTTP status codes** - Semantic response codes
- **API versioning** - Backward compatibility
- **Semantic versioning** - MAJOR.MINOR.PATCH version numbering
- **Interface definition** - Contract specification
- **JSON Schema** - Schema validation for API payloads
- **Request-response pattern** - Synchronous communication
- **Content negotiation** - Format flexibility
- **Interface-oriented design** - Designing around interfaces
- **Interface contract** - Preconditions, postconditions, invariants
- **Design by contract** - Formal interface specifications
- **Minimal interface** - Simplest possible interface
- **Complete interface** - All needed operations
- **Interface coupling** - Dependencies between interfaces
- **Postel's Law** - Be liberal in what you accept, conservative in what you send
- **Tolerant reader** - Resilient to interface changes
- **Parse-don't-validate** - Convert unvalidated data to validated types
- **Guard clause** - Early return for invalid inputs
- **Authentication** - Identity verification
- **Authorization** - Access control
- **Authentication and authorization** - Identity and access management
- **API evolution** - Managing API changes
- **Deprecation strategies** - Phasing out old APIs

### MCP Tool Design
- **Tool interfaces** - Standardized tool definitions
- **Parameter validation** - Input sanitization
- **Error responses** - Structured error reporting
- **Documentation** - Self-documenting APIs
- **Tool composition** - Chaining operations
- **Schema validation** - JSON schema enforcement

### Integration Patterns
- **Message passing** - Asynchronous communication
- **Event-driven architecture** - Event sourcing patterns
- **Event sourcing** - Append-only event log
- **Publish-subscribe** - Decoupled messaging
- **Consumer-driven contracts** - Testing interface compatibility
- **Adapter pattern** - Interface translation
- **Facade pattern** - Simplified interface

---

## 8. Concurrency & Synchronization

### Concurrency Concepts
- **Concurrency** - Parallel execution handling
- **Parallelism** - Simultaneous execution
- **Synchronization** - Coordinating concurrent operations
- **Race condition mitigation** - Preventing data races
- **Atomicity** - Indivisible operations
- **Mutual exclusion** - Critical section protection
- **Deadlock prevention** - Resource ordering
- **Thread safety** - Safe concurrent access

### Asynchronous Patterns
- **Async/await** - JavaScript asynchronous programming
- **Promises** - Future value representation
- **Event loops** - Non-blocking I/O
- **JavaScript event loop** - Node.js concurrency model
- **Callbacks** - Asynchronous result handling
- **Streaming** - Asynchronous data processing
- **Async iterators** - Asynchronous iteration
- **Backpressure** - Flow control in streams
- **Event emitters** - Publish-subscribe for events

### Shared State Management
- **Immutability** - Unchanging data structures
- **Segregation of mutability** - Isolating mutable state
- **Pure functions** - Functions without side effects
- **Referential transparency** - Substitutable expressions
- **Encapsulation** - Hiding internal state
- **Thread safety** - Safe concurrent access to shared state

---

## 9. Error Handling & Reliability

### Error Handling Strategies
- **Exception handling** - Structured error management
- **Error propagation** - Bubbling errors up the stack
- **Validation** - Input validation and sanitization
- **Graceful degradation** - Fallback mechanisms
- **Error recovery** - Automatic retry and healing
- **Logging and monitoring** - Observability
- **Functional error handling** - Result/Either types instead of exceptions
- **Option/Maybe types** - Nullable value handling
- **Error masking** - Hiding implementation details
- **Crash-on-fatal** - Fail-fast error handling
- **Define errors out of existence** - Designing APIs to avoid error cases
- **Defensive programming** - Anticipating failures
- **Assertions** - Runtime correctness checks
- **Input validation** - Sanitizing inputs

### Domain Exceptions
- **Custom exceptions** - Domain-specific error types
- **Error hierarchies** - Structured exception taxonomy
- **Error codes** - Standardized error identification
- **Error messages** - User-friendly error descriptions

### Reliability Patterns
- **Fail-fast** - Early error detection
- **Fail-safe** - Safe defaults
- **Health checks** - System status monitoring
- **Health endpoints** - Status API endpoints
- **Incident management** - Handling production issues
- **Runbooks** - Operational procedures
- **Mean time to detect (MTTD)** - Detection speed
- **Mean time to repair (MTTR)** - Recovery speed

---

## 10. Development Practices & Collaboration

### Development Workflow
- **Incremental development** - Iterative implementation
- **Iterative development** - Repeated refinement cycles
- **Code review** - Peer feedback
- **Code reviews** - Systematic review process
- **Pull requests** - Code review workflow
- **Code review latency** - Time to review changes
- **Pair programming** - Two programmers, one workstation
- **Mob programming** - Whole team programming together
- **Refactoring** - Code improvement
- **Documentation** - Code and API documentation
- **Collective ownership** - Team code ownership
- **Collective code ownership** - Team responsibility for code
- **Egoless programming** - Depersonalized code review
- **Checklists** - Systematic verification aids

### Version Control
- **Git** - Distributed version control system
- **Version control** - Git-based workflow
- **Distributed version control** - Decentralized repository model
- **Branching strategies** - Git workflow patterns
- **Branching workflows** - Feature, release, and hotfix branches
- **Trunk-based development** - All changes to main trunk
- **Feature branching** - Branch per feature
- **Branch by abstraction** - Incremental changes behind abstractions
- **Merge conflicts** - Resolving concurrent changes
- **Atomic commits** - Small, focused commits
- **Small commits** - Incremental, focused changes
- **Commit history** - Clean, meaningful history
- **Semantic versioning** - MAJOR.MINOR.PATCH version numbering

### Agile Methodologies
- **Agile methodologies** - Iterative, adaptive development
- **Extreme Programming (XP)** - Agile with engineering practices
- **Kanban method** - Flow-based agile
- **Lean software development** - Waste elimination
- **User stories** - Requirements as user narratives
- **Product backlog** - Prioritized feature list
- **Minimum viable product (MVP)** - Minimal feature set
- **Walking skeleton** - Thinnest slice of functionality
- **Vertical slice** - End-to-end feature implementation
- **Velocity** - Team throughput metric
- **Cycle time** - Time from start to finish
- **Conway's Law** - Organizations produce designs mirroring their communication

### Code Quality
- **Coding standards** - Style guides and conventions
- **Static analysis** - TypeScript type checking
- **Static code analysis** - Automated code inspection
- **Linting** - Code style enforcement (ESLint)
- **Code formatting** - Automated formatting (Prettier)
- **Code metrics** - Complexity measurement
- **Cyclomatic complexity** - Decision point count
- **Technical debt** - Deferred quality work
- **Cost of change** - Modification difficulty
- **Maintainability** - Long-term code health
- **Code smells** - Indicators of design problems
- **Anti-patterns** - Common design mistakes
- **Naming conventions** - Intent-revealing names
- **Intent-revealing code** - Self-documenting code
- **Code readability** - Understandable code
- **Git hooks** - Pre-commit quality checks (Husky)
- **Refactoring process** - Detect, plan, repay
- **Behavior-preserving transformations** - Safe refactorings
- **Extract method** - Breaking up large functions
- **Rename refactoring** - Improving names
- **Complexity management** - Managing code complexity
- **Decomposition** - Breaking problems into parts
- **Cross-cutting concerns** - Aspects that span modules
- **Separation of concerns** - Single responsibility for modules

---

## 11. DevOps & Site Reliability Engineering

### Continuous Integration & Delivery
- **Continuous integration (CI)** - Automated build and test on every commit
- **Continuous delivery (CD)** - Automated deployment pipeline
- **Continuous deployment** - Automatic production deployment
- **Deployment pipeline** - Stages from commit to production
- **Commit stage** - Initial CI validation step
- **Build automation** - Automated builds (npm scripts, build tools)
- **Test automation** - Automated test execution in pipeline
- **Test data management** - Managing data for tests
- **Architecture fitness functions** - Automated architecture validation
- **Automated deployment** - Scripted, repeatable deployments
- **Idempotent deployment** - Deployments that can be safely repeated
- **Deployment orchestration** - Coordinating deployment steps
- **Dependency management** - Managing external dependencies
- **Continuous improvement** - Iterative process enhancement
- **DevOps culture** - Collaboration between dev and ops
- **Value stream mapping** - Visualizing delivery process

### Deployment Strategies
- **Canary releases** - Gradual rollout to subset of users
- **Blue-green deployment** - Zero-downtime switching between environments
- **Progressive delivery** - Controlled feature rollout
- **Zero-downtime deployment** - Deployment without service interruption
- **Rolling deployment** - Incremental instance updates
- **Rollback** - Reverting to previous version
- **Rollforward** - Fixing issues by deploying new version
- **Backing out changes** - Safe deployment reversal

### Feature Management
- **Feature toggles** - Runtime feature switches
- **Feature flags** - Conditional feature activation
- **Calendar flags** - Time-based feature activation
- **Release toggles** - Deployment-time feature control
- **Experiment toggles** - A/B testing support
- **Permission toggles** - User-based feature access

### Infrastructure & Configuration
- **Infrastructure as code (IaC)** - Machine-readable infrastructure configuration
- **Configuration as code** - Version-controlled configuration
- **Configuration management** - Environment-specific config
- **Desired state management** - Automatic infrastructure reconciliation
- **Environment parity** - Consistent dev/staging/production environments
- **Immutable infrastructure** - Replace rather than update
- **Declarative infrastructure** - Describing desired state
- **Environment provisioning** - Creating environments automatically
- **Configuration drift** - Environments diverging from desired state
- **Environment management** - Managing multiple environments
- **Artifact repository** - Storing build artifacts
- **Artifact promotion** - Moving artifacts through pipeline stages
- **Infrastructure provisioning** - Automated environment creation

### Observability
- **Observability** - Understanding system state from external outputs
- **Monitoring** - Tracking system metrics and health
- **Log aggregation** - Centralized logging across services
- **Metrics aggregation** - Collecting and storing metrics
- **Distributed tracing** - Tracking requests across service boundaries
- **Structured logging** - Parseable log events (JSON logging)
- **Trace context propagation** - Passing trace IDs across calls
- **Spans** - Units of work in distributed traces
- **Correlation IDs** - Linking related log entries

### Alerting & Incident Response
- **Alerting** - Automated notifications for issues
- **On-call management** - Production support rotation
- **Incident response** - Systematic failure handling
- **Postmortems** - Blameless incident retrospectives
- **Runbooks** - Operational procedures
- **Alert fatigue** - Avoiding too many alerts
- **Toil elimination** - Automating manual work

### Site Reliability Concepts
- **Service level indicators (SLI)** - Measurable metrics
- **Service level objectives (SLO)** - Target reliability
- **Service level agreements (SLA)** - Contractual commitments
- **Error budget** - Allowed failure rate
- **Burn rate** - Rate of error budget consumption
- **Mean time to detect (MTTD)** - Detection speed
- **Mean time to repair (MTTR)** - Recovery speed
- **Capacity planning** - Resource forecasting

---

## 12. System Design & Architecture

### System Design Principles
- **System architecture** - High-level system organization
- **Component design** - Module boundaries
- **Interface design** - Contract definition
- **Abstraction layers** - Hiding complexity
- **Encapsulation** - Information hiding
- **Cohesion** - Single responsibility
- **Coupling** - Minimizing dependencies
- **Afferent coupling** - Incoming dependencies
- **Efferent coupling** - Outgoing dependencies
- **Component granularity** - Size and scope
- **Trade-off analysis** - Evaluating design decisions
- **Architecture trade-offs** - Everything is a trade-off

### Design Patterns for Systems
- **Model-based design** - Domain modeling
- **State machines** - Stateful behavior modeling
- **Pipeline architecture** - Data flow processing
- **Plugin architecture** - Extensibility patterns
- **Service granularity** - Service size and scope
- **Granularity disintegrators** - Reasons to split services
- **Granularity integrators** - Reasons to combine services
- **Modular monolith** - Monolith with clear module boundaries
- **Hexagonal architecture** - Ports and adapters pattern
- **Vertical-slice architecture** - Feature-based organization

### Systems Thinking
- **Systems thinking** - Holistic perspective
- **Feedback loops** - Circular causality
- **Balancing feedback** - Stabilizing loops
- **Reinforcing feedback** - Amplifying loops
- **Leverage points** - High-impact interventions
- **System archetypes** - Common patterns
- **Mental models** - Internal representations
- **System boundaries** - Scope definition
- **Resilience** - Adaptive capacity
- **Interdependence** - Mutual relationships

---

## 13. Domain-Specific Concepts

### Natural Language Processing
- **Text embeddings** - Semantic vector representations
- **Tokenization** - Text segmentation
- **Concept extraction** - Identifying key concepts
- **Named entity recognition** - Entity identification
- **Semantic similarity** - Measuring text relatedness
- **Word embeddings** - Distributed word representations
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** - Context-aware representations
- **Prompt engineering** - Designing effective prompts for LLMs
- **Context window management** - Handling token limits

### Information Retrieval
- **Ranking** - Result ordering
- **Relevance scoring** - Query-document matching
- **Inverted index** - Efficient text search
- **TF-IDF** - Term importance weighting
- **BM25** - Probabilistic ranking
- **Vector space model** - Geometric text representation

### Knowledge Management
- **Ontologies** - Concept hierarchies
- **Taxonomies** - Classification schemes
- **Knowledge graphs** - Relationship networks
- **Metadata management** - Document properties
- **Content organization** - Structuring information
- **Document clustering** - Grouping similar documents
- **Knowledge synthesis** - Combining information from multiple sources
- **Data lineage** - Tracking data origins and transformations
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

This lexicon was compiled from concepts extracted from the following knowledge base documents. Sources were identified using `category_search` against selected categories.

> **Note on Distributed Systems**: While the knowledge base contains distributed systems content, this category was **excluded** from this lexicon as the concept-rag project is a local TypeScript/Node.js application, not a distributed system.

### TypeScript & JavaScript
- **Programming TypeScript: Making Your JavaScript Applications Scale** by Boris Cherny (O'Reilly Media, 2019)
- **Effective TypeScript: 62 Specific Ways to Improve Your TypeScript** by Dan Vanderkam (O'Reilly Media, 2019)
- **Essential TypeScript 5** by Adam Freeman (Manning, 2023)
- **Mastering TypeScript 4** by Nathan Rozentals (Packt, 2021)
- **Introduction to Software Design and Architecture With TypeScript** by Khalil Stemmler

### Software Architecture & Design
- **Clean Architecture: A Craftsman's Guide to Software Structure and Design** by Robert C. Martin (Pearson, 2017)
- **Fundamentals of Software Architecture** by Neal Ford and Mark Richards (O'Reilly, 2020)
- **Software Architecture for Developers** by Simon Brown (Leanpub, 2022)
- **The C4 Model for Visualising Software Architecture** by Simon Brown (Leanpub, 2022)
- **arc42 by Example: Software Architecture Documentation** by Gernot Starke et al. (Leanpub, 2023)
- **Design It! From Programmer to Software Architect** by Michael Keeling (Pragmatic Programmers, 2017)
- **Building Microservices** by Sam Newman (O'Reilly, 2nd Edition)
- **Microservices: Flexible Software Architecture** by Eberhard Wolff (Addison-Wesley, 2016)
- **Microservices Patterns** by Chris Richardson (Manning, 2018)

### Design Patterns & Principles
- **Design Patterns: Elements of Reusable Object-Oriented Software** by Gamma, Helm, Johnson, Vlissides (Addison-Wesley, 1994)
- **Head First Design Patterns** (O'Reilly)
- **A Philosophy of Software Design** by John Ousterhout (Yaknyam Press, 2019)
- **Refactoring: Improving the Design of Existing Code** by Martin Fowler (Addison-Wesley, 2nd Edition)
- **Refactoring for Software Design Smells** by Samarthyam, Sharma, Suryanarayana (Morgan Kaufmann, 2015)
- **AntiPatterns: Refactoring Software, Architectures, and Projects** by Brown et al. (Wiley, 2001)
- **Domain-Driven Design** by Eric Evans (Addison-Wesley, 2003)

### Software Engineering & Quality
- **Code Complete** by Steve McConnell (Microsoft Press, 2nd Edition)
- **Code That Fits in Your Head: Heuristics for Software Engineering** by Mark Seemann (Addison-Wesley, 2021)
- **The Pragmatic Programmer: Your Journey to Mastery** by Hunt and Thomas (Addison-Wesley, 20th Anniversary Edition)
- **The Clean Coder: A Code of Conduct for Professional Programmers** by Robert C. Martin (Prentice Hall, 2011)
- **Designing Data-Intensive Applications** by Martin Kleppmann (O'Reilly, 2017)

### Testing & TDD
- **Test Driven Development for Embedded C** by James Grenning (Pragmatic Programmers)
- **Test Driven Development: By Example** by Kent Beck (Addison-Wesley)
- **The Art of Unit Testing** by Roy Osherove (Manning, 2nd Edition)
- **Effective Software Testing: 50 Specific Ways** by Elfriede Dustin (Addison-Wesley, 2002)
- **User Stories Applied: For Agile Software Development** by Mike Cohn (Addison-Wesley, 2004)

### DevOps & Continuous Delivery
- **Continuous Delivery: Reliable Software Releases** by Jez Humble and David Farley (Addison-Wesley, 2010)
- **Grokking Continuous Delivery** by Christie Wilson (Manning, 2022)
- **Learning GitHub Actions** by Brent Laster (O'Reilly, 2023)
- **CI/CD Unleashed** by Tommy Clark (Apress, 2025)

### Database Systems
- **Database Design for Mere Mortals** by Michael James Hernandez (Addison-Wesley, 25th Anniversary Edition)
- **Database Reliability Engineering** by Laine Campbell and Charity Majors (O'Reilly, 2017)

### Systems Thinking
- **Thinking in Systems: A Primer** by Donella H. Meadows (Chelsea Green Publishing, 2008)

---
