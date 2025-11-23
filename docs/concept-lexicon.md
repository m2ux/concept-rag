# Concept Lexicon
## Executive Summary

This document catalogs concepts from the knowledge base that are directly applicable to the project.

---

## 1. Software Architecture & Design Patterns

### Core Architecture Concepts
- **Modular software architecture** - Layered architecture with clear separation of concerns
- **Dependency injection** - Container-based DI pattern for loose coupling
- **Repository pattern** - Data access layer abstraction for database operations
- **Service layer** - Domain services encapsulate business logic
- **Factory pattern** - Object creation patterns for complex instantiation
- **Domain-driven design** - Domain models, bounded contexts, and ubiquitous language
- **Layered architecture** - Clear separation: domain, infrastructure, application, tools
- **Interface definition (IDL)** - Type definitions and contracts between layers
- **API design and evolution** - MCP tool interfaces and versioning considerations
- **Separation of concerns** - Clean boundaries between modules
- **Component-based design** - Modular, composable architecture units
- **Architectural characteristics** - The "-ilities" (scalability, reliability, performance, etc.)
- **Architecture decision records (ADRs)** - Documenting architectural decisions and rationale
- **Screaming architecture** - Domain-centric design where architecture reveals intent
- **Ports and adapters** - Hexagonal architecture for testability
- **Modular monolith** - Monolith with clear module boundaries
- **Clean architecture** - Dependency rule and policy vs. details separation
- **Evolutionary architecture** - Architecture that supports guided incremental change
- **Bounded context** - Domain partitioning with explicit boundaries

### Design Patterns
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
- **Bridge pattern** - Separating abstraction from implementation
- **Builder pattern** - Step-by-step object construction
- **Chain of responsibility** - Passing requests along a handler chain
- **Humble object pattern** - Separating testable from hard-to-test code

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
- **Strategic programming** - Investing in design quality for long-term maintainability
- **Tactical programming** - Short-term implementation focus (anti-pattern)
- **Design it twice** - Exploring multiple design alternatives
- **Pull complexity downward** - Moving complexity away from users/callers
- **Define errors out of existence** - Designing APIs to eliminate error cases
- **Obvious code principle** - Code should be self-explanatory
- **SOLID principles** - Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY principle** - Don't Repeat Yourself
- **YAGNI** - You Aren't Gonna Need It (avoid speculative generality)
- **KISS** - Keep It Simple, Stupid
- **Law of Demeter** - Principle of least knowledge
- **Acyclic dependencies principle** - Avoid circular dependencies
- **Stable dependencies principle** - Depend on stable components
- **Stable abstractions principle** - Abstract components should be stable
- **Package by component** - Organization around business capabilities
- **Package by feature** - Domain-centric organization
- **Technical partitioning** - Layered organization (presentation/business/persistence)
- **Domain partitioning** - Organization by business domain

### Architectural Styles
- **Microservices architecture** - Distributed, independently deployable services
- **Service-oriented architecture (SOA)** - Service-based decomposition
- **Event-driven architecture** - Asynchronous event-based communication
- **Space-based architecture** - In-memory data grids for scalability
- **Microkernel architecture** - Plugin-based extensible core
- **Pipeline architecture** - Pipes and filters for data flow
- **Broker topology** - Event routing through a message broker
- **Mediator topology** - Centralized event orchestration
- **Layered architecture** - Organized in horizontal layers
- **Hexagonal architecture** - Ports and adapters pattern
- **Onion architecture** - Dependency inversion in concentric layers
- **Vertical slice architecture** - Feature-based organization
- **Client-server architecture** - Request-response patterns
- **Peer-to-peer architecture** - Distributed coordination without central authority

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
- **Stress testing** - System limits and breaking points
- **Contract testing** - API contract validation between layers
- **Property-based testing** - Testing general properties
- **Mutation testing** - Testing the quality of tests
- **Smoke testing** - Basic functionality verification
- **Sanity testing** - Quick verification of specific functionality
- **Exploratory testing** - Unscripted testing for discovery

### Verification Techniques
- **Design verification and validation** - Ensuring requirements are met
- **Code inspection and review** - Peer review practices
- **Fagan inspection** - Formal code inspection methodology
- **Walkthroughs** - Informal review sessions
- **Test coverage measurement** - Statement and branch coverage
- **Branch coverage** - Exercising all decision branches
- **Statement coverage** - Executing all statements
- **Path coverage** - Covering all possible paths
- **Loop coverage** - Testing loop conditions
- **Design for testability** - Architecture that facilitates testing
- **Test harness** - Testing infrastructure and fixtures
- **Test fixtures** - Setup and teardown for tests
- **Test scaffolding** - Support code for testing
- **Functional testing (black-box)** - Testing against specifications
- **Structural testing (white-box)** - Internal structure testing
- **Grey-box testing** - Partial knowledge of internals
- **Assertions** - Runtime correctness checks
- **Preconditions and postconditions** - Contract-based verification
- **Invariants** - Properties that always hold

### Quality Assurance
- **Software quality assurance** - Systematic quality activities
- **Risk reduction** - Identifying and mitigating technical risks
- **Cost of defects** - Early detection and correction
- **Static code analysis** - Linting and type checking (TypeScript)
- **Dynamic analysis** - Runtime behavior analysis
- **Continuous integration** - Automated build and test pipelines
- **Continuous delivery** - Automated deployment pipelines
- **Defect tracking** - Systematic issue management
- **Defect prevention** - Proactive quality measures
- **Code metrics** - Quantitative quality measures
- **Cyclomatic complexity** - Measuring code complexity
- **Code coverage metrics** - Test effectiveness measurement
- **Quality attributes** - Understandability, changeability, extensibility, reusability, testability, reliability
- **Egoless programming** - Separating ego from code ownership
- **Collective code ownership** - Team responsibility for quality

---

## 3. Database & Search Systems

### Database Concepts
- **Vector databases** - LanceDB for embedding storage
- **Relational databases** - Structured data with ACID properties
- **Operational databases (OLTP)** - Transaction processing systems
- **Analytical databases (OLAP)** - Decision support systems
- **Indexing** - Efficient data retrieval strategies
- **B-tree indexes** - Ordered data access
- **Hash indexes** - Fast equality lookups
- **Search algorithms** - Hybrid search (vector + BM25 + concept scoring)
- **Data structures** - Optimized storage and retrieval
- **Caching** - Performance optimization via caching layers
- **Query optimization** - Efficient query execution
- **Schema design** - Table structure and relationships
- **Normalization** - Reducing redundancy and anomalies
- **Normal forms** - 1NF, 2NF, 3NF, BCNF
- **Denormalization** - Trading redundancy for performance
- **Database systems** - CRUD operations and transactions
- **Primary keys** - Unique row identifiers
- **Foreign keys** - Referential integrity constraints
- **Surrogate keys** - Artificial identifiers
- **Composite keys** - Multi-column keys
- **Candidate keys** - Potential primary keys
- **Views** - Virtual tables
- **Materialized views** - Pre-computed query results
- **Triggers** - Automatic event-driven logic
- **Stored procedures** - Database-resident logic
- **Field specifications** - Data type, length, constraints
- **Business rules** - Field-specific, relationship-specific
- **Data integrity** - Field-level, table-level, relationship-level
- **Referential integrity** - Foreign key constraints
- **Entity integrity** - Primary key constraints
- **Domain integrity** - Value constraints
- **Validation tables** - Lookup tables for allowed values
- **Linking tables** - Many-to-many relationship implementation
- **Subset tables** - Category-specific views

### Database Reliability Engineering
- **Database reliability engineering (DBRE)** - Operational excellence for data
- **Backup and recovery** - Data protection strategies
- **Backup validation** - Ensuring recoverability
- **Replication** - Data redundancy for availability
- **Replication latency** - Lag between primary and replicas
- **Replication drift** - Consistency challenges
- **Failover** - Automatic recovery from failures
- **High availability** - Minimizing downtime
- **Data durability** - Preventing data loss
- **Ephemeral storage** - Temporary, non-persistent data
- **Schema change automation** - Safe, automated migrations
- **Rolling schema changes** - Zero-downtime migrations
- **Connection pooling** - Reusing database connections
- **Query instrumentation** - Monitoring query performance
- **Slow-query logging** - Identifying performance issues
- **Query execution plans** - Understanding query behavior
- **Optimizer statistics** - Query planner metadata
- **Database asserts** - Integrity checks
- **Corruption detection** - Data integrity validation
- **Operational playbooks** - Runbooks for common scenarios

### Search & Retrieval
- **Semantic search** - Vector similarity search
- **Vector embeddings** - Text-to-vector transformations
- **Text embeddings** - Semantic vector representations
- **Word embeddings** - Word-level vectors
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** - Context-aware representations
- **Transformer embeddings** - Attention-based embeddings
- **Embedding normalization** - Vector normalization techniques
- **Full-text search** - BM25 keyword matching
- **Inverted index** - Efficient text search structure
- **TF-IDF** - Term importance weighting
- **BM25** - Probabilistic ranking function
- **Hybrid search** - Combining multiple ranking signals
- **Dense retrieval** - Vector-based semantic retrieval
- **Sparse retrieval** - Keyword-based retrieval (BM25, TF-IDF)
- **Retrieval-fusion techniques** - Combining multiple retrieval methods
- **Ranking algorithms** - Score combination and normalization
- **Query expansion** - WordNet-based synonym expansion
- **Concept extraction** - NLP-based concept identification
- **Fuzzy matching** - Approximate string matching
- **Retrieval-augmented generation (RAG)** - Context-aware generation with retrieval
- **Approximate nearest neighbor (ANN) search** - Efficient vector similarity search
- **Similarity measures** - Cosine similarity, Euclidean distance, dot-product
- **Vector index compression** - Product quantization, vector quantization
- **Maximum inner product search (MIPS)** - Optimized vector search
- **Inverted file indexing** - Efficient sparse retrieval
- **Dynamic indexing** - Real-time index updates
- **Incremental indexing** - Adding documents without full rebuild
- **Vector store versioning** - Managing embedding model changes
- **Dimensionality reduction** - PCA, UMAP, t-SNE for high-dimensional data
- **Index sharding** - Distributing vector indices across nodes
- **Re-ranking and rescoring** - Post-retrieval result refinement
- **Contextual re-ranking** - Using context to improve ranking
- **Evaluation metrics** - Precision@k, Recall@k, NDCG, MRR
- **Mean reciprocal rank (MRR)** - Ranking quality metric
- **Normalized discounted cumulative gain (NDCG)** - Graded relevance metric
- **Hallucination mitigation** - Ensuring factual accuracy in RAG systems
- **Source attribution** - Tracking document provenance
- **Provenance tracking** - Document lineage and origin
- **Knowledge-grounded generation** - Using retrieved knowledge for generation
- **Context window management** - Handling token limits
- **Retriever-generator pipelines** - Two-stage RAG architecture
- **Real-time retrieval** - Low-latency search
- **Batch retrieval** - Bulk query processing

### Data Management
- **Data locality** - Optimizing data placement for performance
- **Partitioning and sharding** - Horizontal data distribution
- **Range partitioning** - Distributing by value ranges
- **Hash partitioning** - Consistent distribution strategies
- **Consistent hashing** - Stable key distribution
- **Data integrity** - Validation and constraints
- **Schema evolution** - Versioning and migrations
- **Change data capture (CDC)** - Tracking data changes
- **Data lineage** - Tracking data origins and transformations
- **Data provenance** - Understanding data history
- **Data curation and governance** - Managing data quality
- **Access control** - Managing document access
- **Data ownership** - Clear responsibility for data
- **Data isolation** - Preventing unauthorized access
- **Full-cost accounting** - Comprehensive cost tracking

---

## 4. TypeScript & Type Systems

### TypeScript Language Features
- **Type safety** - Static type checking for JavaScript
- **Gradual typing** - Incremental adoption of types
- **Static typing** - Compile-time type checking
- **Type inference** - Automatic type deduction
- **Structural typing** - Type compatibility based on structure
- **Nominal typing** - Type compatibility based on name
- **Duck typing** - Type compatibility via shape matching
- **Type narrowing** - Refining types through control flow
- **Control-flow-based type analysis** - Type refinement through code flow
- **Type guards** - Runtime type checking functions
- **User-defined type guards** - Custom type predicate functions
- **Union types** - Types that can be one of several types
- **Intersection types** - Types that combine multiple types
- **Discriminated unions** - Tagged union types for type safety
- **Tagged unions** - Unions with discriminant property
- **Generics** - Parametric polymorphism
- **Bounded polymorphism** - Generic constraints with `extends`
- **Generic defaults** - Default type arguments
- **Generic type inference** - Automatic type argument deduction
- **Conditional types** - Types that depend on other types
- **Distributive conditional types** - Distribution over union types
- **The infer keyword** - Type inference in conditional types
- **Mapped types** - Transforming types programmatically
- **Index signatures** - Dynamic property access
- **Template literal types** - String literal type manipulation
- **Type aliases** - Named type definitions
- **Type assertions** - Explicit type casting
- **Non-null assertion operator (!)** - Asserting non-null values
- **Const assertions (as const)** - Narrow literal types
- **Literal types** - String, number, boolean literals
- **Primitive types** - number, string, boolean, null, undefined, symbol, bigint
- **any type** - Type system escape hatch
- **unknown type** - Type-safe alternative to any
- **never type** - Type for unreachable code
- **void type** - Absence of return value
- **Object types** - Structural object definitions
- **Record type** - Key-value object types
- **Tuple types** - Fixed-length arrays with typed elements
- **Readonly arrays** - Immutable arrays
- **Readonly properties** - Immutable object properties
- **Rest parameters** - Variable-length argument lists
- **Function call signatures** - Function type definitions
- **Overloaded function signatures** - Multiple function signatures
- **Contextual typing** - Type inference from context
- **Excess property checking** - Strict object literal checking

### Type System Concepts
- **Variance** - Covariance, contravariance, invariance, bivariance
- **Covariance** - Subtype in output position
- **Contravariance** - Supertype in input position
- **Invariance** - No subtype relationship
- **Bivariance** - Both covariant and contravariant
- **Function variance** - Variance in function parameters and returns
- **Subtyping** - Type compatibility relationships
- **Assignability rules** - When types are compatible
- **Type widening** - Automatic type generalization
- **Type erasure** - Types removed at runtime
- **Nominal vs structural typing** - Type identity strategies
- **Type branding** - Simulating nominal types in structural systems
- **Definite assignment** - Ensuring variables are initialized
- **Non-null assertions** - Asserting non-null values
- **Exhaustiveness checking** - Ensuring all cases are handled
- **Totality** - Handling all possible cases

### TypeScript-Specific Patterns
- **Declaration merging** - Combining multiple declarations
- **Interface merging** - Multiple interface declarations merged
- **Namespace merging** - Combining namespace declarations
- **Module augmentation** - Extending existing modules
- **Ambient declarations** - Type-only declarations for JavaScript
- **Declaration files (.d.ts)** - Type definitions for libraries
- **DefinitelyTyped** - Community type definitions repository
- **@types packages** - Type definitions on npm
- **Triple-slash directives** - Compiler directives
- **Types directive** - Include type dependencies
- **AMD-module directive** - AMD module naming
- **Project references** - Multi-project TypeScript setups
- **Composite projects** - Building multiple projects together
- **Incremental compilation** - Faster rebuilds
- **Declaration maps** - Mapping .d.ts to source

### Type-Driven Development
- **Type-driven design** - Using types to guide design
- **Type-driven development** - Development led by type definitions
- **Type-safe APIs** - APIs with compile-time guarantees
- **Type-safe protocols** - Communication protocols with type safety
- **Typed ORMs** - Database access with type safety
- **Code generation from types** - Generating code from type definitions
- **Schema-driven APIs** - APIs defined by schemas (OpenAPI, GraphQL)
- **Code-generated APIs** - Types generated from API schemas
- **Client-server type contract** - Shared types across boundaries

### TypeScript Compiler & Tooling
- **TypeScript compiler (tsc)** - Compiling TS to JS
- **tsconfig.json** - TypeScript configuration
- **Compiler options** - Strict mode, module system, target
- **Strict type checking** - Enabling all strict flags
- **noImplicitAny** - Requiring explicit any annotations
- **strictNullChecks** - Null and undefined handling
- **strictFunctionTypes** - Strict function parameter checking
- **noImplicitThis** - Explicit this typing
- **alwaysStrict** - Emit "use strict"
- **Source maps** - Debugging support
- **Module resolution** - How modules are found
- **Module formats** - CommonJS, ES2015, AMD, UMD
- **Compile target** - ES version to emit
- **ESModule interop** - CommonJS/ES module compatibility
- **AllowJS** - Mixing JavaScript and TypeScript
- **JSDoc annotations** - Type information in JavaScript comments
- **@ts-check** - Type checking JavaScript files
- **Language services (tsserver)** - Editor integration
- **Editor integration** - VSCode/IntelliSense support
- **TSLint and linting** - Style and error checking
- **Build artifacts** - Generated JavaScript output
- **outDir** - Output directory configuration

---

## 5. Distributed Systems & Scalability

### Scalability Patterns
- **Scalability** - Horizontal and vertical scaling strategies
- **Horizontal scaling (scale out)** - Adding more machines
- **Vertical scaling (scale up)** - Adding resources to existing machines
- **Elastic scaling** - Dynamic resource adjustment
- **Performance optimization** - Bottleneck identification and resolution
- **Replication** - Data redundancy for availability
- **Leader-based replication** - Single primary, multiple replicas
- **Multi-leader replication** - Multiple primaries
- **Leaderless replication** - Peer-to-peer replication
- **Consistency models** - Eventual consistency patterns
- **Strong consistency** - Linearizability guarantees
- **Eventual consistency** - Relaxed consistency models
- **Sequential consistency** - Program order preservation
- **Causal consistency** - Cause-effect ordering
- **Partitioning** - Data distribution across nodes
- **Sharding** - Horizontal partitioning
- **Shard rebalancing** - Redistribution of data
- **Functional partitioning** - By business capability
- **Load balancing** - Request distribution
- **DNS load balancing** - Distribution via DNS
- **L4 load balancing** - Transport layer distribution
- **L7 load balancing** - Application layer distribution
- **Geo load balancing** - Geographic distribution
- **Caching strategies** - Multi-level caching
- **In-process caching** - Local memory cache
- **Out-of-process caching** - Distributed cache
- **In-memory caching** - RAM-based storage
- **Cache-aside pattern** - Lazy-loading cache
- **Write-through cache** - Synchronous cache updates
- **Write-back cache** - Asynchronous cache updates
- **Cache eviction policies** - LRU, MRU, MFU, random
- **Request coalescing** - Batching concurrent requests
- **Sticky sessions** - Session affinity

### Distributed System Concepts
- **Distributed systems** - Multi-node architectures
- **Communication** - Inter-process and inter-node messaging
- **Coordination** - Distributed agreement protocols
- **Inter-process communication (IPC)** - Local communication
- **Remote procedure call (RPC)** - Remote invocation
- **Network protocol stack** - Layered networking
- **TCP reliability** - Reliable byte stream
- **UDP tradeoffs** - Unreliable, low-latency datagram
- **TLS/SSL** - Secure communication channels
- **Transport layer security (TLS)** - Encryption in transit
- **Three-way handshake** - TCP connection establishment
- **Flow control** - Rate matching sender/receiver
- **Congestion control** - Network congestion management
- **Bandwidth-delay product** - Network capacity
- **Service discovery** - Finding service endpoints
- **DNS (Domain Name System)** - Name to address resolution
- **CAP theorem** - Consistency, Availability, Partition tolerance tradeoffs
- **PACELC** - Extended CAP theorem
- **Fallacies of distributed computing** - Common false assumptions
- **Network latency** - Communication delay
- **Network reliability** - Dealing with failures
- **Bandwidth considerations** - Throughput limitations
- **Topology change management** - Dynamic network changes
- **Heterogeneous networks** - Multiple network types

### Reliability & Fault Tolerance
- **Fault tolerance** - Graceful degradation
- **Availability** - High-availability design
- **Reliability** - Consistent correct operation
- **Resiliency** - Recovery from failures
- **Failure detection and recovery** - Error handling and retry logic
- **Failure detection** - Heartbeats and timeouts
- **Circuit breaker pattern** - Preventing cascade failures
- **Open/closed/half-open states** - Circuit breaker states
- **Retry semantics** - Exponential backoff with jitter
- **Exponential backoff** - Progressive retry delays
- **Retry amplification** - Cascading retry load
- **Idempotence** - Safe retry of operations
- **Deduplication** - Preventing duplicate processing
- **At-least-once delivery** - Guaranteed delivery with possible duplicates
- **At-most-once delivery** - No duplicates, possible loss
- **Exactly-once delivery** - Neither duplicates nor loss
- **Bulkhead pattern** - Isolating failures
- **Watchdog timers** - Detecting hangs
- **Health checks** - System status monitoring
- **Active health checks** - Proactive polling
- **Passive health checks** - Monitoring responses
- **Chaos engineering** - Intentional failure injection
- **Fault injection testing** - Systematic resilience testing

### Consistency & Coordination
- **Consistency** - Data consistency guarantees
- **Transactions** - ACID properties where needed
- **ACID properties** - Atomicity, Consistency, Isolation, Durability
- **BASE properties** - Basically Available, Soft state, Eventual consistency
- **Atomic operations** - All-or-nothing execution
- **Distributed transactions** - Cross-component coordination
- **Two-phase commit (2PC)** - Distributed transaction protocol
- **Sagas** - Long-running transactions with compensation
- **Compensating transactions** - Undo operations
- **Consensus** - Agreement protocols
- **Quorum** - Majority agreement
- **Raft** - Consensus algorithm
- **Leader election** - Coordinator selection
- **Election terms** - Raft leader epochs
- **Fencing tokens** - Preventing split-brain
- **Leases** - Time-bounded locks
- **System models** - Synchronous, asynchronous, partial synchrony
- **Failure models** - Crash-stop, crash-recovery, Byzantine
- **Time in distributed systems** - Clock synchronization
- **Physical clocks** - Wall-clock time
- **Clock drift and skew** - Clock inaccuracy
- **NTP (Network Time Protocol)** - Clock synchronization
- **Monotonic clocks** - Non-decreasing timers
- **Logical clocks** - Lamport timestamps
- **Vector clocks** - Causality tracking
- **Happened-before relation** - Causal ordering

### Communication Patterns
- **Synchronous communication** - Request-response blocking
- **Asynchronous communication** - Non-blocking messaging
- **Request-response pattern** - Synchronous interaction
- **Fire-and-forget** - Asynchronous one-way
- **Message passing** - Decoupled communication
- **Message queues** - Persistent message buffering
- **Publish-subscribe (pub/sub)** - One-to-many messaging
- **Topics** - Pub/sub channels
- **Queues** - Point-to-point channels
- **Dead-letter channel** - Failed message handling
- **Message durability** - Persistent messages
- **Visibility timeout** - Message processing window
- **Message ordering** - FIFO guarantees
- **Back pressure** - Flow control in streams
- **Guaranteed delivery** - At-least-once semantics
- **Client acknowledge mode** - Manual acknowledgment
- **Orchestration** - Centralized workflow coordination
- **Choreography** - Decentralized event-driven coordination
- **Service orchestration** - Centralized service coordination
- **Service choreography** - Event-based service collaboration

---

## 6. Performance & Optimization

### Optimization Techniques
- **Performance optimization** - Systematic improvement
- **Performance engineering** - Systematic performance design
- **Profiling** - Identifying performance hotspots
- **Benchmarking** - Performance measurement and comparison
- **Microbenchmarking** - Fine-grained performance tests
- **Caching** - Reducing redundant computation
- **Lazy evaluation** - Deferred computation
- **Memoization** - Result caching
- **Batching** - Reducing operation overhead
- **Streaming** - Processing large datasets incrementally
- **Parallel processing** - Concurrent execution
- **Task parallelism** - Different tasks concurrently
- **Data parallelism** - Same task on different data
- **Embarrassingly parallel** - No dependencies between tasks
- **Manager/worker pattern** - Task distribution
- **MapReduce** - Distributed data processing
- **Fork/join** - Recursive task decomposition
- **Pipeline parallelism** - Staged processing

### Resource Management
- **Memory management** - Heap and garbage collection awareness
- **Resource-constrained design** - Efficient resource utilization
- **Memory budgeting** - Allocation planning
- **Cache coherency** - Cache invalidation strategies
- **Connection pooling** - Reusing expensive connections
- **Throttling and rate limiting** - Preventing resource exhaustion
- **Rate limiting** - Request rate control
- **Load shedding** - Graceful degradation under load
- **Resource limits** - Constraining resource usage
- **CPU utilization** - Processor usage monitoring
- **Memory utilization** - RAM usage monitoring
- **Network throughput** - Data transfer rate
- **Storage I/O** - Disk read/write performance
- **Disk capacity** - Available storage
- **Steal time** - Virtualization overhead
- **Noisy neighbor effects** - Resource contention in shared environments

### Performance Measurement
- **Latency** - Response time
- **Throughput** - Request processing rate
- **Utilization** - Resource usage percentage
- **Saturation** - Queue depth
- **Errors** - Error rate
- **Percentiles** - P50, P95, P99 latency
- **Histograms** - Distribution visualization
- **Tail latency** - High percentile latency
- **Outlier analysis** - Identifying anomalies
- **Amdahl's law** - Speedup limits from parallelization
- **Service level indicators (SLI)** - Measurable metrics
- **Service level objectives (SLO)** - Target reliability
- **Service level agreements (SLA)** - Contractual commitments
- **Error budget** - Allowed failure rate
- **Burn rate** - Rate of error budget consumption

### Data Structures & Algorithms
- **Data structures** - Efficient storage and access patterns
- **Search algorithms** - Optimal search strategies
- **Hash tables** - Fast lookups
- **B-trees** - Ordered data access
- **Bloom filters** - Space-efficient set membership
- **Merkle trees** - Efficient data verification
- **Log-structured merge (LSM) trees** - Write-optimized storage
- **Consistent hashing** - Stable key distribution
- **Ring hashing** - Consistent hashing variant
- **Priority queues** - Ordered processing
- **Heaps** - Efficient priority queue implementation
- **Tries** - Prefix tree for strings

---

## 7. API Design & Interfaces

### API Patterns
- **API design** - RESTful and tool-based interfaces
- **RESTful HTTP** - Resource-oriented APIs
- **HTTP methods** - GET, POST, PUT, DELETE, PATCH
- **HTTP status codes** - Semantic response codes
- **HTTP multiplexing** - Concurrent requests
- **API versioning** - Backward compatibility
- **Interface definition** - Contract specification
- **OpenAPI/Swagger** - API specification format
- **IDL (Interface Definition Language)** - Formal interface definition
- **Request-response pattern** - Synchronous communication
- **Content negotiation** - Format flexibility
- **API gateway** - Unified entry point
- **Routing and composition** - Request routing
- **Translation and protocol bridging** - Format conversion
- **Service discovery** - Dynamic service location
- **Interface-oriented design** - Designing around interfaces
- **Three Laws of Interfaces** - Interface design principles
- **Interface contract** - Preconditions, postconditions, invariants
- **Design by contract** - Formal interface specifications
- **Interface granularity** - Minimal vs complete interfaces
- **Minimal interface** - Simplest possible interface
- **Complete interface** - All needed operations
- **Interface cohesiveness** - Related operations grouped together
- **Interface coupling** - Dependencies between interfaces
- **Published interfaces** - Stable, versioned interfaces
- **Interface discovery** - Service registry and directory services
- **Pull interfaces** - Consumer-driven data access
- **Push interfaces** - Provider-driven data delivery
- **Stateful vs stateless interfaces** - Session management strategies
- **Data interfaces** - Structured data exchange
- **Service interfaces** - Operation-based interfaces
- **Document-style interfaces** - XML/JSON document exchange
- **Procedural interfaces** - Function call-based interfaces
- **Authentication** - Identity verification
- **Authorization** - Access control
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
- **Service-oriented architecture (SOA)** - Service-based decomposition
- **Message passing** - Asynchronous communication
- **Event-driven architecture** - Event sourcing patterns
- **Event sourcing** - Append-only event log
- **Publish-subscribe** - Decoupled messaging
- **API composition** - Aggregating multiple services
- **Consumer-driven contracts** - Testing interface compatibility
- **Postel's Law** - Robustness principle (be liberal in what you accept)
- **Tolerant reader** - Resilient to interface changes
- **HATEOAS** - Hypermedia as the engine of application state
- **Resource-oriented client architecture (ROCA)** - Web-first API design
- **Adapter pattern** - Interface translation
- **Facade pattern** - Simplified interface
- **Proxy pattern** - Intermediary access control

---

## 8. Concurrency & Synchronization

### Concurrency Concepts
- **Concurrency** - Parallel execution handling
- **Parallelism** - Simultaneous execution
- **Synchronization** - Coordinating concurrent operations
- **Race condition mitigation** - Preventing data races
- **Atomicity** - Indivisible operations
- **Atomic operations** - Hardware-level indivisible operations
- **Compare-and-swap (CAS)** - Atomic update operation
- **Mutual exclusion** - Critical section protection
- **Locks and mutexes** - Mutual exclusion primitives
- **Semaphores** - Counting locks
- **Barriers** - Collective synchronization
- **Deadlock prevention** - Resource ordering
- **Deadlock** - Circular wait condition
- **Livelock** - Continuous state changes without progress
- **Thread safety** - Safe concurrent access
- **Thread-safe programming** - Designing for concurrency
- **Flynn's taxonomy** - Parallel processing classifications
- **SIMD/SIMT** - Single instruction, multiple data
- **MIMD** - Multiple instruction, multiple data
- **Threads and concurrency primitives** - OS-level threading
- **POSIX threads (pthreads)** - Standard threading API
- **OpenMP** - Parallel programming directives
- **Thread lifecycle** - Creation, execution, termination
- **Thread scheduling** - OS thread management
- **Preemptive scheduling** - Forcible context switching
- **Cooperative scheduling** - Voluntary yielding

### Asynchronous Patterns
- **Async/await** - JavaScript asynchronous programming
- **Promises** - Future value representation
- **Event loops** - Non-blocking I/O
- **JavaScript event loop** - Browser/Node.js concurrency model
- **Callbacks** - Asynchronous result handling
- **Streaming** - Asynchronous data processing
- **Async streams** - Asynchronous data flows
- **Observables** - Reactive streams
- **Event emitters** - Publish-subscribe for events
- **Backpressure** - Flow control in streams
- **Async functions** - Promise-based functions
- **Async transpilation** - State machine transforms
- **Async iterators** - Asynchronous iteration

### Shared Memory and Message Passing
- **Shared memory** - Common memory space
- **Message passing** - Inter-process messaging
- **MPI (Message Passing Interface)** - Distributed message passing
- **Web Workers** - Browser-based parallelism
- **Worker messaging** - Message-based communication
- **Child processes** - OS process spawning
- **Interprocess messaging** - Cross-process communication
- **Transactional memory** - Optimistic concurrency
- **Atoms** - Immutable value containers
- **Immutability** - Unchanging data structures
- **Segregation of mutability** - Isolating mutable state

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
- **Either/Try/Result patterns** - Error as value
- **Error masking** - Hiding implementation details
- **Error aggregation** - Combining multiple errors
- **Crash-on-fatal** - Fail-fast error handling
- **Define errors out of existence** - Designing APIs to avoid error cases
- **Business exceptions** - Domain-specific errors
- **Technology exceptions** - Infrastructure errors
- **Exception aggregation** - Collecting multiple exceptions
- **Exception masking** - Controlled error suppression
- **Checked vs unchecked exceptions** - Compile-time vs runtime errors
- **Defensive programming** - Anticipating failures
- **Assertions** - Runtime correctness checks
- **Input validation** - Sanitizing inputs
- **Return value checking** - Validating results
- **Short-circuit evaluation** - Early exit on failure

### Domain Exceptions
- **Custom exceptions** - Domain-specific error types
- **Error hierarchies** - Structured exception taxonomy
- **Error codes** - Standardized error identification
- **Error messages** - User-friendly error descriptions

### Reliability Patterns
- **Fault injection testing** - Chaos engineering
- **Fail-fast** - Early error detection
- **Fail-safe** - Safe defaults
- **Watchdog timers** - Detecting hangs
- **Health checks** - System status monitoring
- **Health endpoints** - Status API endpoints
- **Postmortems** - Incident retrospectives
- **Incident management** - Handling production issues
- **Incident response** - Systematic failure handling
- **On-call management** - Production support rotation
- **Runbooks** - Operational procedures
- **Mean time to detect (MTTD)** - Detection speed
- **Mean time to repair (MTTR)** - Recovery speed
- **Alerting** - Automated notifications
- **Alert fatigue** - Too many alerts
- **Toil elimination** - Automating manual work

---

## 10. Development Practices & Tools

### Development Workflow
- **Incremental development** - Iterative implementation
- **Iterative development** - Repeated refinement cycles
- **Evolutionary development** - Adaptive design
- **Code review** - Peer feedback
- **Peer code review** - Collaborative quality assurance
- **Pair programming** - Two programmers, one workstation
- **Driver and navigator** - Pair programming roles
- **Refactoring** - Code improvement
- **Design iteration** - Evolving design
- **Documentation** - Code and API documentation
- **Version control** - Git-based workflow
- **Branching strategies** - Git workflow patterns
- **Merge conflicts** - Resolving concurrent changes
- **Collision management** - Coordinating changes
- **Source control workflows** - Lock-modify-unlock vs copy-modify-merge
- **Collective ownership** - Team code ownership
- **Egoless programming** - Depersonalized code review

### Agile Methodologies
- **Agile methodologies** - Iterative, adaptive development
- **Extreme Programming (XP)** - Agile with engineering practices
- **Scrum framework** - Sprint-based agile
- **Kanban method** - Flow-based agile
- **Crystal family** - Lightweight agile methods
- **Lean software development** - Waste elimination
- **User stories** - Requirements as user narratives
- **Product backlog** - Prioritized feature list
- **Sprint/iteration backlog** - Work for current iteration
- **Minimum viable product (MVP)** - Minimal feature set
- **INVEST criteria** - Good user story attributes
- **Three Cs** - Card, Conversation, Confirmation
- **SMART tasks** - Specific, Measurable, Achievable, Relevant, Time-bound
- **Planning game** - Collaborative planning
- **Release planning** - Long-term roadmap
- **Daily stand-up** - Daily synchronization
- **Sprint planning** - Iteration planning
- **Sprint review** - Demonstration and feedback
- **Sprint retrospective** - Process improvement
- **Velocity** - Team throughput metric
- **Continuous delivery** - Automated release pipeline
- **On-site customer** - Direct customer involvement

### Build & Deployment
- **Compilation and linking** - TypeScript build process
- **Transpilation** - Source-to-source compilation
- **Downlevel compilation** - Targeting older JS versions
- **Continuous integration** - Automated CI/CD
- **Test automation** - Automated test execution
- **Package management** - npm dependencies
- **Configuration management** - Environment-specific config
- **Deployment strategies** - Release management
- **Canary releases** - Gradual rollout
- **Phased rollouts** - Progressive deployment
- **Blue-green deployment** - Zero-downtime switching
- **Rollforward and rollback** - Deployment recovery
- **Feature toggles** - Runtime feature flags
- **Progressive delivery** - Controlled feature rollout
- **Infrastructure as code** - Declarative infrastructure
- **Containerization** - Docker-based packaging
- **Container orchestration** - Kubernetes-based management
- **Build automation** - Automated builds
- **Build pipelines** - Multi-stage build process
- **Artifact repositories** - Binary storage

### Code Quality
- **Coding standards** - Style guides and conventions
- **Static analysis** - TypeScript type checking
- **Static code analysis** - Automated code inspection
- **Linting** - Code style enforcement
- **Code metrics** - Complexity measurement
- **Lines of code (LOC)** - Size metric
- **Weighted methods per class (WMC)** - Complexity metric
- **Cyclomatic complexity** - Decision point count
- **Fan-in and fan-out** - Dependency metrics
- **Coupling metrics** - Inter-module dependencies
- **Cohesion metrics** - Intra-module relationships
- **Technical debt** - Deferred quality work
- **Design debt** - Architectural shortcuts
- **Technical bankruptcy** - Overwhelming debt
- **Principal and interest metaphor** - Debt accumulation
- **Cost of change** - Modification difficulty
- **Maintainability** - Long-term code health
- **Code smells** - Indicators of design problems
- **Design smells** - Architectural problems
- **Anti-patterns** - Common design mistakes
- **Overengineering** - Unnecessary complexity
- **Speculative generality** - YAGNI violation
- **Naming conventions** - Intent-revealing names
- **Comments policy** - When and how to comment
- **Intent-revealing code** - Self-documenting code
- **Newspaper code principle** - High-level details first
- **Step-down principle** - Top-to-bottom code organization
- **Whitespace and formatting** - Readability through formatting
- **ESLint and Prettier** - Automated code formatting
- **Husky** - Git hooks for quality checks
- **Clone detection** - Finding duplicate code
- **Code clones** - Duplicated code
- **Duplicate code** - Copy-paste programming
- **Refactoring process** - Detect, plan, repay
- **Behavior-preserving transformations** - Safe refactorings
- **Composite refactorings** - Multi-step refactorings
- **Extract class** - Splitting classes
- **Inline class** - Merging classes
- **Move method** - Relocating methods
- **Move field** - Relocating fields
- **Pull up method** - Moving to superclass
- **Pull down method** - Moving to subclass
- **Collapse hierarchy** - Removing unnecessary inheritance
- **Extract superclass** - Creating parent class
- **Replace inheritance with delegation** - Favoring composition

---

## 11. System Design & Architecture

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
- **Instability metric** - Coupling-based stability
- **Abstractness metric** - Abstraction level
- **Distance from main sequence** - Balance metric
- **Component granularity** - Size and scope
- **Component cohesion** - Internal consistency
- **Reuse-release equivalence principle** - Releasable units
- **Common closure principle** - Change together, package together
- **Common reuse principle** - Use together, package together
- **Trade-off analysis** - Evaluating design decisions
- **Architecture trade-offs** - Everything is a trade-off
- **Least-worst architecture** - Optimal within constraints

### Design Patterns for Systems
- **Model-based design** - Domain modeling
- **State machines** - Stateful behavior modeling
- **Pipeline architecture** - Data flow processing
- **Plugin architecture** - Extensibility patterns
- **Microservices** - Service decomposition
- **Service granularity** - Service size and scope
- **Granularity disintegrators** - Reasons to split services
- **Granularity integrators** - Reasons to combine services
- **Database-per-service** - Data ownership per service
- **Shared library vs shared service** - Code sharing tradeoffs
- **Modular monolith** - Monolith with clear module boundaries
- **Hexagonal architecture** - Ports and adapters pattern
- **Onion architecture** - Dependency inversion layers
- **Vertical-slice architecture** - Feature-based organization
- **Message-based architectures** - Asynchronous communication
- **Client-server architecture** - Request-response patterns
- **Peer-to-peer architecture** - Distributed coordination
- **Space-based architecture** - In-memory data grids
- **Replicated in-memory data grid** - Distributed caching
- **Near-cache** - Local cache with remote backing
- **Replicated vs distributed caching** - Caching strategies

### Systems Thinking
- **Systems thinking** - Holistic perspective
- **System structure** - Organization of elements
- **System behavior** - Dynamic patterns
- **Feedback loops** - Circular causality
- **Balancing feedback** - Stabilizing loops
- **Reinforcing feedback** - Amplifying loops
- **Stocks** - Accumulators
- **Flows** - Rates of change
- **Delays** - Time lags
- **Buffers** - Shock absorbers
- **Leverage points** - High-impact interventions
- **System archetypes** - Common patterns
- **System traps** - Problematic patterns
- **Tragedy of the commons** - Shared resource depletion
- **Shifting the burden** - Dependency on interventions
- **Success to the successful** - Winner-take-all dynamics
- **Escalation** - Arms race dynamics
- **Drift to low performance** - Eroding standards
- **Policy resistance** - Unintended consequences
- **Mental models** - Internal representations
- **System boundaries** - Scope definition
- **Resilience** - Adaptive capacity
- **Self-organization** - Emergent order
- **Hierarchy** - Nested subsystems
- **Sustainability** - Long-term viability
- **Holistic thinking** - Seeing the whole
- **Interdependence** - Mutual relationships

### Infrastructure Concepts
- **Containerization** - Docker deployment
- **Orchestration** - Service coordination
- **Service mesh** - Inter-service communication
- **Sidecar pattern** - Auxiliary service processes
- **Cloud computing** - Cloud-native patterns
- **Infrastructure as code** - Automated provisioning
- **Ephemeral infrastructure** - Disposable resources
- **Automation** - Eliminating manual processes
- **Self-service platforms** - User-driven provisioning

---

## 12. Domain-Specific Concepts

### Natural Language Processing
- **Text embeddings** - Semantic vector representations
- **Tokenization** - Text segmentation
- **Concept extraction** - Identifying key concepts
- **Named entity recognition** - Entity identification
- **Semantic similarity** - Measuring text relatedness
- **Word vectors** - Word embeddings
- **Word embeddings** - Distributed word representations
- **Sentence embeddings** - Document-level vectors
- **Contextual embeddings** - Context-aware representations
- **Transformer embeddings** - Attention-based embeddings
- **Embedding normalization** - Vector normalization techniques
- **Session embeddings** - Conversation context vectors
- **Conversational context retention** - Multi-turn dialogue state
- **Conversational AI** - Dialogue systems
- **Dialog management** - Conversation flow control
- **Intent modeling** - Understanding user intent
- **Intent classification** - Categorizing user requests
- **Slot filling** - Extracting structured information
- **Prompt engineering** - Designing effective prompts for LLMs
- **Prompt templates** - Reusable prompt patterns
- **Context window management** - Handling token limits
- **Decoding strategies** - Beam search, top-k, nucleus sampling
- **Beam search** - Multiple hypothesis decoding
- **Top-k sampling** - Limiting token choices
- **Nucleus sampling (top-p)** - Probability mass sampling
- **Pre-trained language models** - Transfer learning for NLP
- **Transformer-based generation** - Attention-based text generation
- **Fine-tuning RAG models** - Domain adaptation

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
- **Knowledge-grounded generation** - Using retrieved knowledge for generation
- **Knowledge synthesis** - Combining information from multiple sources
- **Data curation and governance** - Managing data quality
- **Data lineage** - Tracking data origins and transformations
- **Access control** - Managing document access
- **Privacy-preserving retrieval** - Protecting sensitive information
- **Differential privacy** - Privacy-preserving data access
- **Federated learning** - Decentralized model training
- **Explainability and interpretability** - Understanding system decisions
- **Local explanations** - Example-based explanations
- **Global model explanations** - System-wide behavior understanding
- **Human-in-the-loop workflows** - User feedback integration
- **User feedback integration** - Incorporating human judgment

### Machine Learning Operations
- **Machine learning operations (MLOps)** - ML model deployment
- **Feature stores** - ML feature management
- **Model versioning** - Embedding model evolution
- **A/B testing** - Search quality experimentation
- **User engagement metrics** - Measuring RAG system effectiveness
- **Model and dataset drift detection** - Monitoring data quality
- **Online learning** - Incremental model updates
- **Observability** - Distributed tracing, metrics, logs
- **Observability pillars** - Metrics, logs, traces
- **Monitoring and telemetry** - System instrumentation
- **Metrics** - Quantitative measurements
- **Time-series metrics** - Time-indexed data
- **Dimensional metrics** - Tagged metrics
- **Logging** - Event recording
- **Structured logging** - Parseable log events
- **Log aggregation** - Centralized logging
- **Distributed tracing** - Request flow tracking
- **Trace context propagation** - Passing trace IDs
- **Spans** - Unit of work in traces
- **KPI dashboards** - Performance monitoring
- **Dashboards and visualization** - Visual analytics
- **Application performance monitoring (APM)** - Runtime monitoring
- **Sampling resolution** - Metric granularity
- **Metric retention** - Storage duration
- **Pre-aggregation** - Computed rollups
- **Anomaly detection** - Identifying outliers
- **Deployment and MLOps** - Production ML systems

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

### Testing Strategy
The project leverages:
- **Unit tests** for individual components
- **Integration tests** for database and search operations
- **Performance benchmarks** for search queries
- **Contract tests** for MCP tool interfaces
- **Test-driven development** where appropriate
- **Automated CI/CD** for continuous validation

### Scalability Considerations
Future enhancements could include:
- **Partitioning** for large document collections
- **Replication** for read scalability
- **Caching layers** for frequently accessed data
- **Async processing** for heavy operations (concept extraction)
- **Horizontal scaling** for increased load
- **Load balancing** for request distribution

### Quality Practices
The project benefits from:
- **TypeScript** for static type checking and type safety
- **Type-driven development** - Using types to guide design
- **Gradual typing** - Incremental adoption of types
- **Linting** for code consistency (ESLint, Prettier)
- **Modular design** for maintainability
- **Clear interfaces** for testability
- **Comprehensive error handling** for reliability
- **Complexity management** - Strategic programming approach
- **Deep modules** - Simple interfaces with rich functionality
- **Information hiding** - Encapsulating implementation details
- **Refactoring** - Continuous code improvement
- **Technical debt management** - Tracking and addressing debt

---

## Related Concepts for Future Exploration

### Advanced Topics
- **Distributed systems** - Multi-node deployment
- **Consensus algorithms** - Distributed coordination (Raft, Paxos)
- **Event sourcing** - Audit trail and replay
- **CQRS** - Command-query responsibility segregation
- **Domain-driven design** - Advanced modeling techniques
- **Formal verification** - Correctness proofs
- **Performance modeling** - Analytical performance prediction
- **Capacity planning** - Resource forecasting
- **Queuing theory** - Mathematical modeling of wait times
- **Control theory** - Feedback-based system control

### Specialized Areas
- **Security** - Authentication, authorization, encryption
- **Compliance** - Data governance, privacy regulations
- **Privacy engineering** - Privacy-by-design principles
- **Secure multiparty computation** - Privacy-preserving computation
- **Edge computing** - Computation at network edge
- **Serverless architectures** - Function-as-a-service
- **Stream processing** - Real-time data processing
- **Real-time analytics** - Low-latency insights
- **Knowledge distillation** - Model compression
- **Transfer learning** - Reusing learned representations
- **Multi-modal integration** - Combining text, images, audio
- **Graph neural networks** - Learning on graphs
- **Causal inference** - Understanding cause-effect relationships
- **Reinforcement learning** - Learning through interaction
- **Curriculum learning** - Structured learning progression

---

## Document Sources

This lexicon was compiled from concepts extracted from the following knowledge base documents:

### TypeScript & JavaScript
- **Programming TypeScript: Making Your JavaScript Applications Scale** by Boris Cherny (O'Reilly Media, 2019)
- **Effective TypeScript: 62 Specific Ways to Improve Your TypeScript** by Dan Vanderkam (O'Reilly Media, 2019)
- **Introduction to Software Design and Architecture With TypeScript** by Khalil Stemmler

### Software Architecture
- **Fundamentals of Software Architecture: A Comprehensive Guide** by Neal Ford and Mark Richards (O'Reilly Media, 2020)
- **Software Architecture for Developers: Technical Leadership** by Simon Brown (2022)
- **Head First Software Architecture: A Learner's Guide to Architectural Thinking** by Raju Gandhi, Mark Richards, and Neal Ford (O'Reilly Media, 2024)
- **Clean Architecture: A Craftsman's Guide to Software Structure and Design** by Robert C. Martin (Pearson, 2017)
- **Software Development, Design, and Coding: With Patterns, Debugging, Unit Testing, and Refactoring** by John F. Dooley and Vera A. Kazakova (Apress, 2024)

### Design Philosophy & Principles
- **A Philosophy of Software Design** by John Ousterhout (Yaknyam Press, 2019)
- **Refactoring for Software Design Smells: Managing Technical Debt** by Ganesh Samarthyam, Tushar Sharma, and Girish Suryanarayana (Morgan Kaufmann, 2015)

### RAG & Vector Databases
- **Utilizing Vector Databases to Enhance RAG Models** (Author unknown)

### Distributed Systems
- **Understanding Distributed Systems: What Every Developer Should Know** by Roberto Vitillo (2021)
- **Distributed Systems for Practitioners** by Dimos Raptis (2020)
- **Distributed Computing: 16th International Conference, DISC 2002** (Lecture Notes in Computer Science, 2002)

### Interface & API Design
- **Interface Oriented Design** by Ken Pugh (The Pragmatic Programmers, 2006)

### Database Systems
- **Database Design for Mere Mortals®, 25th Anniversary Edition** by Michael James Hernandez (Addison-Wesley, 2020)
- **Database Reliability Engineering: Designing and Operating Resilient Datastores** by Laine Campbell and Charity Majors (O'Reilly Media, 2017)

### Systems Thinking
- **Thinking in Systems: A Primer** by Donella H. Meadows (Chelsea Green Publishing, 2008)

---

**Last Updated:** November 23, 2025

**End of Document**
