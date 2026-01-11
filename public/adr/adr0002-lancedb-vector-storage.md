# 2. LanceDB for Vector Storage

**Date:** ~2024 (lance-mcp upstream project)  
**Status:** Accepted (Inherited)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Inherited By:** concept-rag fork (2025)  
**Technical Story:** Foundational database choice from upstream lance-mcp project  

**Sources:**
- Git Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2 (November 19, 2024, lance-mcp upstream)

## Context and Problem Statement

The project needed a vector database for storing and searching document embeddings. The system requires:
- Efficient vector similarity search (semantic search)
- Storage of document chunks with embeddings
- Ability to store metadata alongside vectors
- TypeScript/JavaScript compatibility
- Local-first deployment (embedded database preferred)
- Cost-effective for personal/small-scale use

**Decision Drivers:**
* Embedding search is core functionality
* Need for local deployment without external services
* TypeScript integration required
* Metadata storage alongside vectors
* Cost considerations (self-hosted preferred over cloud)
* Performance requirements (sub-second search)

## Alternative Options

* **Option 1: LanceDB** - Embedded vector database with Apache Arrow
* **Option 2: Pinecone** - Cloud-based vector database service
* **Option 3: Qdrant** - Open-source vector search engine
* **Option 4: ChromaDB** - Embedded AI-native database
* **Option 5: PostgreSQL with pgvector** - Traditional database with vector extension
* **Option 6: Weaviate** - Cloud-native vector database

## Decision Outcome

**Chosen option:** "LanceDB (Option 1)"

### Configuration

```typescript
// Connection
import * as lancedb from "@lancedb/lancedb";
const db = await lancedb.connect(databasePath);

// Tables
const chunksTable = await db.openTable("chunks");      // Text chunks + vectors
const catalogTable = await db.openTable("catalog");    // Document summaries
```
[Source: lance-mcp `src/lancedb/client.ts`, lines 17-22]

### Schema Design

**Chunks Table:**
```typescript
{
  pageContent: string,         // Chunk text
  vector: Float32Array,        // Ollama embedding
  metadata: {
    loc: object,               // Location info from text splitter
    source: string             // Document path
  }
}
```
[Source: lance-mcp `src/seed.ts`, lines 153, 176-182]

**Catalog Table:**
```typescript
{
  pageContent: string,         // Document summary (LLM-generated)
  vector: Float32Array,        // Ollama embedding
  metadata: {
    source: string,            // Document path
    hash: string               // SHA-256 content hash
  }
}
```
[Source: lance-mcp `src/seed.ts`, lines 108, 159-163]

### Consequences

**Positive:**
* **Local-first**: No external service dependencies, works offline
* **Zero cost**: No per-query or per-storage pricing
* **TypeScript support**: First-class bindings via @lancedb/lancedb ^0.15.0
* **Performance**: Sub-100ms search for typical queries (validated in production)
* **Apache Arrow**: Efficient columnar storage format
* **Metadata support**: Rich metadata alongside vectors
* **Multiple tables**: Flexible schema for chunks, catalog, concepts
* **Vector + SQL**: Hybrid queries combining vector similarity and SQL filters
* **Scalability**: Embedded database scales for personal use

**Negative:**
* **Single-node**: No distributed deployment (acceptable for personal use)
* **Limited ecosystem**: Smaller community than Pinecone/Weaviate
* **Maturity**: Newer project compared to established databases
* **Query language**: Custom query API, not standard SQL
* **Backup strategy**: Manual file-based backups

**Neutral:**
* **File-based storage**: Database is directory on disk (~300-700MB)
* **Version pinning**: Need to track Lance file format versions
* **Performance tuning**: Limited configuration options

### Confirmation

Database choice enables:
- Local vector storage
- PDF document indexing
- Vector similarity search
- Zero operational cost

## Pros and Cons of the Options

### Option 1: LanceDB (Chosen)

**Pros:**
* **Embedded**: No external service, works offline
* **Cost**: Zero operational costs
* **TypeScript**: Excellent first-class support
* **Performance**: Fast for personal/small-scale use
* **Simple deployment**: Just a directory on disk
* **Metadata**: Rich metadata support
* **Multiple tables**: Flexible data organization

**Cons:**
* Single-node only (no clustering)
* Smaller community/ecosystem
* Custom query API (not standard SQL)
* Manual backup management

### Option 2: Pinecone

**Pros:**
* Fully managed cloud service
* Excellent performance at scale
* Rich query features
* Strong ecosystem

**Cons:**
* **Requires external service** - Not local-first
* **Cost**: Pay per query and storage (~$70+/month)
* **Network dependency**: Requires internet
* **Privacy**: Data leaves local machine
* **Vendor lock-in**: Proprietary service

### Option 3: Qdrant

**Pros:**
* Open-source
* Can self-host
* Good performance
* Active development

**Cons:**
* Requires separate server process
* More operational complexity
* TypeScript support less mature
* Heavier than embedded database
* Still requires Docker/deployment

### Option 4: ChromaDB

**Pros:**
* Embedded option available
* Python-first (good ML ecosystem)
* Simple API

**Cons:**
* **Python-first**: TypeScript support secondary
* Less mature TypeScript bindings
* Smaller feature set
* Less optimized for production

### Option 5: PostgreSQL with pgvector

**Pros:**
* Familiar SQL database
* Mature and stable
* Rich ecosystem
* ACID guarantees

**Cons:**
* **Requires PostgreSQL server** - Not embedded
* Slower vector search than specialized DBs
* More operational overhead
* Not designed for vector workloads
* Heavier resource footprint

### Option 6: Weaviate

**Pros:**
* Feature-rich
* Good documentation
* Strong community
* GraphQL API

**Cons:**
* Requires server deployment
* More complex than needed
* Higher resource requirements
* Not local-first
* Over-engineering for use case

## Implementation Notes

### Installation

```json
{
  "dependencies": {
    "@lancedb/lancedb": "^0.15.0",
    "apache-arrow": "^21.0.0"
  }
}
```

### Connection Management

```typescript
// Global exports for table access
export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;

export async function connectToLanceDB(databaseUrl: string, 
                                       chunksTableName: string, 
                                       catalogTableName: string) {
  client = await lancedb.connect(databaseUrl);
  chunksTable = await client.openTable(chunksTableName);
  catalogTable = await client.openTable(catalogTableName);
}
```
[Source: lance-mcp `src/lancedb/client.ts`, lines 8-23]


### Performance Characteristics

**Capabilities:**
- Vector similarity search
- Metadata filtering
- Local storage (file-based)

## Related Decisions

- [ADR-0001: TypeScript with Node.js](adr0001-typescript-nodejs-runtime.md) - Language choice enables LanceDB integration
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md) - RAG approach using LanceDB

## References

### Related Decisions
- [ADR-0001: TypeScript/Node.js](adr0001-typescript-nodejs-runtime.md)
- [ADR-0004: RAG Architecture](adr0004-rag-architecture.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2

